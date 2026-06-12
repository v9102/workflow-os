import pytest
from backend.schemas.models import (
    TaskItem, ExtractionResult, RiskAssessment, AssignmentResult,
    ExecutionDashboard, ValidationIssue, AgentActivity,
    RiskLevel, AgentStatus, TranscriptRequest, TranscriptResponse,
    DashboardResponse
)
from datetime import datetime


class TestTaskItem:
    def test_default_risk_is_unknown(self):
        task = TaskItem(task="Test task")
        assert task.risk == RiskLevel.UNKNOWN

    def test_default_dependencies_is_empty(self):
        task = TaskItem(task="Test task")
        assert task.dependencies == []

    def test_with_all_fields(self):
        task = TaskItem(
            id="1", task="Do work", deadline="Friday",
            dependencies=["Setup"], owner="Alice",
            risk=RiskLevel.HIGH, decision="Approved"
        )
        assert task.id == "1"
        assert task.deadline == "Friday"
        assert task.owner == "Alice"


class TestExecutionDashboard:
    def test_created_at_auto_set(self):
        dashboard = ExecutionDashboard(transcript_id="test-1")
        assert dashboard.created_at is not None
        assert isinstance(dashboard.created_at, datetime)

    def test_default_collections(self):
        dashboard = ExecutionDashboard(transcript_id="test-1")
        assert dashboard.tasks == []
        assert dashboard.timeline == []
        assert dashboard.validation_issues == []


class TestRiskLevel:
    def test_enum_values(self):
        assert RiskLevel.HIGH.value == "High"
        assert RiskLevel.MEDIUM.value == "Medium"
        assert RiskLevel.LOW.value == "Low"
        assert RiskLevel.UNKNOWN.value == "Unknown"


class TestAgentActivity:
    def test_timestamp_auto_set(self):
        activity = AgentActivity(
            agent_name="TestAgent",
            status=AgentStatus.RUNNING,
            message="Testing"
        )
        assert activity.timestamp is not None
        assert activity.agent_name == "TestAgent"
