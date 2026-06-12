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


class ValidationIssue(BaseModel):
    task_id: str
    issue_type: str
    detail: str


class ExecutionDashboard(BaseModel):
    transcript_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    tasks: List[TaskItem] = []
    summary: str = ""
    timeline: List[dict] = []
    validation_issues: List[ValidationIssue] = []


class AgentActivity(BaseModel):
    agent_name: str
    status: AgentStatus
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    elapsed_seconds: Optional[float] = None


class AgentPerformance(BaseModel):
    agent_name: str
    status: str
    elapsed_seconds: float
    message: str


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


class AuditEntry(BaseModel):
    timestamp: str
    session_id: str
    action: str
    actor: str = "system"
    detail: dict = {}


class RetryRequest(BaseModel):
    session_id: str
    transcript: str


SCHEMA_VERSION = "1.0.0"