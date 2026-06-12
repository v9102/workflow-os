import pytest
from backend.agents.validator import ValidatorAgent
from backend.schemas.models import TaskItem, RiskLevel


@pytest.mark.asyncio
async def test_validate_flags_unowned_tasks():
    agent = ValidatorAgent()
    tasks = [
        TaskItem(id="0", task="Do something", owner=None, risk=RiskLevel.LOW,
                 deadline="Friday", dependencies=[]),
    ]
    issues = await agent.validate(tasks, ["Alice", "Bob"])
    assert any(i.issue_type == "unowned_task" for i in issues)


@pytest.mark.asyncio
async def test_validate_passes_owned_tasks():
    agent = ValidatorAgent()
    tasks = [
        TaskItem(id="0", task="Do something", owner="Alice", risk=RiskLevel.LOW,
                 deadline="Friday", dependencies=[]),
    ]
    issues = await agent.validate(tasks, ["Alice"])
    assert len(issues) == 0


@pytest.mark.asyncio
async def test_validate_flags_missing_risk():
    agent = ValidatorAgent()
    tasks = [
        TaskItem(id="0", task="Do something", owner="Alice",
                 risk=RiskLevel.UNKNOWN, deadline="Friday", dependencies=[]),
    ]
    issues = await agent.validate(tasks, ["Alice"])
    assert any(i.issue_type == "missing_risk_score" for i in issues)


@pytest.mark.asyncio
async def test_validate_detects_conflicting_deadlines():
    agent = ValidatorAgent()
    tasks = [
        TaskItem(id="0", task="Task A", owner="Alice", risk=RiskLevel.HIGH,
                 deadline="Friday", dependencies=[]),
        TaskItem(id="1", task="Task B", owner="Alice", risk=RiskLevel.MEDIUM,
                 deadline="Friday", dependencies=[]),
    ]
    issues = await agent.validate(tasks, ["Alice"])
    assert any(i.issue_type == "conflicting_deadline" for i in issues)


@pytest.mark.asyncio
async def test_validate_flags_unknown_speaker():
    agent = ValidatorAgent()
    tasks = [
        TaskItem(id="0", task="Do something", owner="Charlie",
                 risk=RiskLevel.LOW, deadline="Friday", dependencies=[]),
    ]
    issues = await agent.validate(tasks, ["Alice", "Bob"])
    assert any(i.issue_type == "owner_not_in_roster" for i in issues)
