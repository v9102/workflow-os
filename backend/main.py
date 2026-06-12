import asyncio
import json
import os
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

from .schemas.models import (
    TranscriptResponse, DashboardResponse, AgentActivity, ExecutionDashboard,
    AuditEntry, RetryRequest, SCHEMA_VERSION
)
from .agents.orchestrator import OrchestratorAgent
from . import db
from . import audit
from . import webhooks
from .validation import sanitize_transcript, validate_transcript
from .middleware import RateLimitMiddleware
from .m365 import graph_client

load_dotenv()


_MISSING_ENV = []
for _var in ["AZURE_OPENAI_API_KEY", "AZURE_OPENAI_ENDPOINT"]:
    if not os.getenv(_var):
        _MISSING_ENV.append(_var)


active_sessions: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"WorkflowOS Backend starting... (schema v{SCHEMA_VERSION})")
    if _MISSING_ENV:
        print(f"WARNING: Missing env vars: {', '.join(_MISSING_ENV)}")
    yield
    print("WorkflowOS Backend shutting down...")


app = FastAPI(title="WorkflowOS API", version=SCHEMA_VERSION, lifespan=lifespan)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)


class ProcessRequest(BaseModel):
    transcript: str
    meeting_id: Optional[str] = None


def _serialize_session(session: dict) -> dict:
    return {
        "status": session["status"],
        "error": session["error"],
        "dashboard": session["dashboard"].model_dump(mode="json") if session["dashboard"] else None,
        "activities": [a.model_dump(mode="json") for a in session["activities"]],
    }


async def _load_session(session_id: str) -> Optional[dict]:
    session = active_sessions.get(session_id)
    if session:
        return session
    stored = await db.get_session(session_id)
    if not stored:
        return None
    return {
        "status": stored.get("status"),
        "error": stored.get("error"),
        "dashboard": ExecutionDashboard(**stored["dashboard"]) if stored.get("dashboard") else None,
        "activities": [AgentActivity(**a) for a in stored.get("activities", [])],
        "queue": None,
    }


async def _run_pipeline(session_id: str, transcript: str):
    session = active_sessions[session_id]

    async def activity_callback(activity: AgentActivity):
        session["activities"].append(activity)
        await session["queue"].put(activity)

    orchestrator = OrchestratorAgent(activity_callback=activity_callback)
    try:
        dashboard = await orchestrator.process_transcript(transcript, session_id)
        session["dashboard"] = dashboard
        session["status"] = "completed"
        await audit.log_audit(session_id, "pipeline.completed", detail={"task_count": len(dashboard.tasks)})
        await webhooks.notify_webhook("pipeline.completed", session_id, {
            "status": "completed", "task_count": len(dashboard.tasks)
        })
    except Exception as e:
        session["status"] = "failed"
        session["error"] = str(e)
        await audit.log_audit(session_id, "pipeline.failed", detail={"error": str(e)})
    finally:
        await db.save_session(session_id, _serialize_session(session))
        await session["queue"].put(None)


@app.post("/api/transcript/process", response_model=TranscriptResponse)
async def process_transcript(request: ProcessRequest):
    transcript = sanitize_transcript(request.transcript)
    err = validate_transcript(transcript)
    if err:
        raise HTTPException(status_code=422, detail=err)

    session_id = request.meeting_id or str(uuid.uuid4())[:8]
    active_sessions[session_id] = {
        "status": "processing",
        "dashboard": None,
        "activities": [],
        "error": None,
        "queue": asyncio.Queue(),
    }

    asyncio.create_task(_run_pipeline(session_id, transcript))
    await audit.log_audit(session_id, "pipeline.started")

    return TranscriptResponse(
        transcript_id=session_id,
        status="processing",
        message="Transcript processing started"
    )


@app.post("/api/retry", response_model=TranscriptResponse)
async def retry_processing(request: RetryRequest):
    session_id = request.session_id
    old = await _load_session(session_id)
    if old and old["status"] != "failed":
        raise HTTPException(status_code=409, detail="Session is not in a failed state")

    transcript = sanitize_transcript(request.transcript)
    active_sessions[session_id] = {
        "status": "processing",
        "dashboard": None,
        "activities": [],
        "error": None,
        "queue": asyncio.Queue(),
    }
    asyncio.create_task(_run_pipeline(session_id, transcript))
    await audit.log_audit(session_id, "pipeline.retried")

    return TranscriptResponse(
        transcript_id=session_id,
        status="processing",
        message="Retry initiated"
    )


@app.get("/api/dashboard/{session_id}", response_model=DashboardResponse)
async def get_dashboard(session_id: str):
    session = await _load_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if session["status"] == "failed":
        raise HTTPException(status_code=500, detail=session["error"] or "Processing failed")
    if session["dashboard"] is None:
        raise HTTPException(status_code=409, detail="Processing not complete")
    return DashboardResponse(
        dashboard=session["dashboard"],
        activities=session["activities"]
    )


@app.get("/api/activities/{session_id}", response_model=List[AgentActivity])
async def get_activities(session_id: str):
    session = await _load_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session["activities"]


@app.get("/api/activities/{session_id}/stream")
async def stream_activities(session_id: str):
    session = await _load_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    async def event_generator():
        for activity in session["activities"]:
            yield f"data: {activity.model_dump_json()}\n\n"
        if session["status"] != "processing" or session["queue"] is None:
            return
        while True:
            try:
                activity = await asyncio.wait_for(session["queue"].get(), timeout=60)
            except asyncio.TimeoutError:
                yield f"data: {json.dumps({'event': 'timeout'})}\n\n"
                break
            if activity is None:
                break
            yield f"data: {activity.model_dump_json()}\n\n"
        yield f"data: {json.dumps({'event': 'done', 'status': session['status']})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/status/{session_id}")
async def get_status(session_id: str):
    session = await _load_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session_id, "status": session["status"], "error": session["error"]}


class ExportToPlannerRequest(BaseModel):
    session_id: str
    plan_id: str
    bucket_id: Optional[str] = None


class ExportToTeamsRequest(BaseModel):
    session_id: str
    team_id: str
    channel_id: str


class ExportToPdfRequest(BaseModel):
    session_id: str


async def _get_ready_dashboard(session_id: str) -> ExecutionDashboard:
    session = await _load_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    dashboard = session.get("dashboard")
    if not dashboard:
        raise HTTPException(status_code=409, detail="Dashboard not ready")
    return dashboard


@app.post("/api/export/planner")
async def export_to_planner(request: ExportToPlannerRequest):
    dashboard = await _get_ready_dashboard(request.session_id)
    results = []
    for task in dashboard.tasks:
        result = await graph_client.push_to_planner(
            plan_id=request.plan_id,
            title=f"[{task.risk.value}] {task.task}",
            bucket_id=request.bucket_id,
        )
        results.append(result)
    await audit.log_audit(request.session_id, "export.planner", detail={"tasks": len(results)})
    return {"status": "ok", "pushed": len(results)}


@app.post("/api/export/teams")
async def export_to_teams(request: ExportToTeamsRequest):
    dashboard = await _get_ready_dashboard(request.session_id)
    task_list = "\n".join(
        f"- [{t.risk.value}] {t.task} ({t.owner or 'Unassigned'})"
        for t in dashboard.tasks
    )
    message = f"## WorkflowOS Summary\n\n{dashboard.summary}\n\n### Tasks\n{task_list}"
    await graph_client.send_teams_message(
        team_id=request.team_id,
        channel_id=request.channel_id,
        message=message,
    )
    await audit.log_audit(request.session_id, "export.teams")
    return {"status": "ok"}


@app.post("/api/export/pdf")
async def export_to_pdf(request: ExportToPdfRequest):
    dashboard = await _get_ready_dashboard(request.session_id)
    lines = [f"# WorkflowOS Report", f"Session: {request.session_id}", "",
             f"## Summary", dashboard.summary, "",
             "## Tasks", "| Task | Owner | Deadline | Risk | Dependencies |",
             "|------|-------|----------|------|-------------|"]
    for t in dashboard.tasks:
        lines.append(f"| {t.task} | {t.owner or '—'} | {t.deadline or '—'} | {t.risk.value} | {', '.join(t.dependencies) if t.dependencies else '—'} |")
    if dashboard.validation_issues:
        lines.extend(["", "## Validation Issues"])
        for v in dashboard.validation_issues:
            lines.append(f"- [{v.issue_type}] {v.detail}")
    body = "\n".join(lines)
    await audit.log_audit(request.session_id, "export.pdf")
    return {"status": "ok", "format": "markdown", "content": body}


@app.get("/api/audit/{session_id}")
async def get_audit_log(session_id: str):
    entries = await db.get_audit_entries(session_id)
    return entries


@app.get("/api/sessions")
async def list_sessions():
    return await db.list_sessions()


@app.get("/api/health")
async def health_check():
    schema_ver = await db.check_schema_version()
    return {
        "status": "healthy",
        "service": "WorkflowOS API",
        "version": SCHEMA_VERSION,
        "schema_version": schema_ver,
        "env_ok": len(_MISSING_ENV) == 0,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
