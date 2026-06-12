import asyncio
import json
import os
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

from .schemas.models import (
    TranscriptResponse, DashboardResponse, AgentActivity
)
from .agents.orchestrator import OrchestratorAgent


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
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = active_sessions[session_id]
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
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return active_sessions[session_id]["activities"]


@app.get("/api/activities/{session_id}/stream")
async def stream_activities(session_id: str):
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    session = active_sessions[session_id]

    async def event_generator():
        for activity in session["activities"]:
            yield f"data: {activity.model_dump_json()}\n\n"
        if session["status"] != "processing":
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
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    session = active_sessions[session_id]
    return {"session_id": session_id, "status": session["status"], "error": session["error"]}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "WorkflowOS API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
