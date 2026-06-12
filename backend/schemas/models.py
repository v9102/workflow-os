from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    UNKNOWN = "Unknown"


class AgentStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskItem(BaseModel):
    id: Optional[str] = None
    task: str
    deadline: Optional[str] = None
    dependencies: List[str] = []
    owner: Optional[str] = None
    risk: RiskLevel = RiskLevel.UNKNOWN
    decision: Optional[str] = None


class ExtractionResult(BaseModel):
    tasks: List[TaskItem] = []
    decisions: List[str] = []


class RiskAssessment(BaseModel):
    task_id: str
    risk: RiskLevel
    reasoning: str


class AssignmentResult(BaseModel):
    task_id: str
    owner: str
    confidence: float


class ExecutionDashboard(BaseModel):
    transcript_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    tasks: List[TaskItem] = []
    summary: str = ""
    timeline: List[dict] = []


class AgentActivity(BaseModel):
    agent_name: str
    status: AgentStatus
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TranscriptRequest(BaseModel):
    transcript: str
    meeting_id: Optional[str] = None


class TranscriptResponse(BaseModel):
    transcript_id: str
    status: str
    message: str


class DashboardResponse(BaseModel):
    dashboard: ExecutionDashboard
    activities: List[AgentActivity] = []