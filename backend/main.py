import os
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from .schemas.models import (
    TranscriptRequest, TranscriptResponse, DashboardResponse,
    ExecutionDashboard, AgentActivity, AgentStatus
)
from .agents.orchestrator import OrchestratorAgent


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
    active_sessions[session_id] = {"status": "processing", "dashboard": None, "activities": []}
    
    async def activity_callback(activity: AgentActivity):
        active_sessions[session_id]["activities"].append(activity)
    
    orchestrator.set_activity_callback(activity_callback)
    
    try:
        dashboard = await orchestrator.process_transcript(request.transcript, session_id)
        active_sessions[session_id]["status"] = "completed"
        active_sessions[session_id]["dashboard"] = dashboard
        return TranscriptResponse(
            transcript_id=session_id,
            status="completed",
            message="Transcript processed successfully"
        )
    except Exception as e:
        active_sessions[session_id]["status"] = "failed"
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/{session_id}", response_model=DashboardResponse)
async def get_dashboard(session_id: str):
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    return DashboardResponse(
        dashboard=session["dashboard"],
        activities=session["activities"]
    )


@app.get("/api/activities/{session_id}", response_model=List[AgentActivity])
async def get_activities(session_id: str):
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return active_sessions[session_id]["activities"]


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "WorkflowOS API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)