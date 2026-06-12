import asyncio
import json
import uuid
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

from .schemas.models import (
    TranscriptRequest, TranscriptResponse, DashboardResponse,
    ExecutionDashboard, AgentActivity, AgentStatus
)
from .agents.orchestrator import OrchestratorAgent
from . import db

load_dotenv()

orchestrator = OrchestratorAgent()
active_sessions: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("WorkflowOS Backend starting...")
    yield
    print("WorkflowOS Backend shutting down...")


app = FastAPI(title="WorkflowOS API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProcessRequest(BaseModel):
    transcript: str
    meeting_id: Optional[str] = None


class ActivityUpdate(BaseModel):
    session_id: str
    activities: List[AgentActivity]


@app.post("/api/transcript/process", response_model=TranscriptResponse)
async def process_transcript(request: ProcessRequest):
    session_id = request.meeting_id or str(uuid.uuid4())[:8]
    session = {"status": "processing", "dashboard": None, "activities": []}
    active_sessions[session_id] = session
    await db.save_session(session_id, session)

    async def activity_callback(activity: AgentActivity):
        active_sessions[session_id]["activities"].append(activity)
        await db.save_session(session_id, active_sessions[session_id])

    orchestrator.set_activity_callback(activity_callback)

    try:
        dashboard = await orchestrator.process_transcript(request.transcript, session_id)
        session["status"] = "completed"
        session["dashboard"] = dashboard
        await db.save_session(session_id, session)
        return TranscriptResponse(
            transcript_id=session_id,
            status="completed",
            message="Transcript processed successfully"
        )
    except Exception as e:
        session["status"] = "failed"
        await db.save_session(session_id, session)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/{session_id}", response_model=DashboardResponse)
async def get_dashboard(session_id: str):
    session = await db.get_session(session_id) or active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return DashboardResponse(
        dashboard=session["dashboard"],
        activities=session["activities"]
    )


@app.get("/api/activities/{session_id}", response_model=List[AgentActivity])
async def get_activities(session_id: str):
    session = await db.get_session(session_id) or active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session["activities"]


@app.get("/api/activities/{session_id}/stream")
async def stream_activities(session_id: str):
    session = await db.get_session(session_id) or active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    async def event_generator():
        for activity in session.get("activities", []):
            yield f"data: {activity.model_dump_json()}\n\n"
        if session.get("status") == "completed":
            yield f"data: {json.dumps({'event': 'done', 'status': 'completed'})}\n\n"
            return
        while True:
            await asyncio.sleep(0.5)
            current = await db.get_session(session_id) or active_sessions.get(session_id, {})
            new_count = len(current.get("activities", []))
            old_count = len(session.get("activities", []))
            if new_count > old_count:
                for activity in current["activities"][old_count:]:
                    yield f"data: {activity.model_dump_json()}\n\n"
                session["activities"] = current["activities"]
            if current.get("status") in ("completed", "failed"):
                yield f"data: {json.dumps({'event': 'done', 'status': current['status']})}\n\n"
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/status/{session_id}")
async def get_status(session_id: str):
    session = await db.get_session(session_id) or active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session_id": session_id, "status": session["status"]}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "WorkflowOS API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
