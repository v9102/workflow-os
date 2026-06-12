import asyncio
import json
import os
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

from .schemas.models import (
    TranscriptResponse, DashboardResponse, AgentActivity, ExecutionDashboard
)
from .agents.orchestrator import OrchestratorAgent
from . import db
from .m365 import graph_client

load_dotenv()


active_sessions: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("WorkflowOS Backend starting...")
    yield
    print("WorkflowOS Backend shutting down...")


app = FastAPI(title="WorkflowOS API", version="1.0.0", lifespan=lifespan)

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
    except Exception as e:
        session["status"] = "failed"
        session["error"] = str(e)
    finally:
        await db.save_session(session_id, _serialize_session(session))
        await session["queue"].put(None)


@app.post("/api/transcript/process", response_model=TranscriptResponse)
async def process_transcript(request: ProcessRequest):
    if not request.transcript.strip():
        raise HTTPException(status_code=422, detail="Transcript is empty")

    session_id = request.meeting_id or str(uuid.uuid4())[:8]
    active_sessions[session_id] = {
        "status": "processing",
        "dashboard": None,
        "activities": [],
        "error": None,
        "queue": asyncio.Queue(),
    }

    asyncio.create_task(_run_pipeline(session_id, request.transcript))

    return TranscriptResponse(
        transcript_id=session_id,
        status="processing",
        message="Transcript processing started"
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
            activity = await session["queue"].get()
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
    return {"status": "ok"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "WorkflowOS API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
