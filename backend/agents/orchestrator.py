import uuid
from typing import List, Dict, Callable, Awaitable
from ..schemas.models import (
    TaskItem, ExtractionResult, RiskAssessment,
    AssignmentResult, ExecutionDashboard, AgentActivity, AgentStatus
)
from ..utils import with_retry, logger, Timer
from ..cache import cache_get_json, cache_set_json
from .extraction import ExtractionAgent
from .risk import RiskAgent
from .assignment import AssignmentAgent
from .reporting import ReportingAgent


class OrchestratorAgent:
    def __init__(self):
        self.extraction_agent = ExtractionAgent()
        self.risk_agent = RiskAgent()
        self.assignment_agent = AssignmentAgent()
        self.reporting_agent = ReportingAgent()
        self.activities: List[AgentActivity] = []
        self._activity_callback: Callable[[AgentActivity], Awaitable[None]] = None

    def set_activity_callback(self, callback: Callable[[AgentActivity], Awaitable[None]]):
        self._activity_callback = callback

    async def _emit_activity(self, agent_name: str, status: AgentStatus, message: str):
        activity = AgentActivity(agent_name=agent_name, status=status, message=message)
        self.activities.append(activity)
        if self._activity_callback:
            await self._activity_callback(activity)

    async def process_transcript(self, transcript: str, transcript_id: str = None) -> ExecutionDashboard:
        if not transcript_id:
            transcript_id = str(uuid.uuid4())[:8]

        self.activities = []

        cache_key = f"dashboard:{transcript_id}"
        cached = await cache_get_json(cache_key)
        if cached:
            logger.info("Cache hit for session %s, returning cached result", transcript_id)
            return ExecutionDashboard(**cached)

        await self._emit_activity("Orchestrator", AgentStatus.RUNNING, "Starting workflow pipeline")

        async with Timer("extraction"):
            await self._emit_activity("Extraction Agent", AgentStatus.RUNNING, "Extracting tasks and decisions")
            extraction_result = await with_retry(self.extraction_agent.extract, transcript)
            tasks = extraction_result.tasks
            await self._emit_activity("Extraction Agent", AgentStatus.COMPLETED, f"Extracted {len(tasks)} tasks")

        async with Timer("risk"):
            await self._emit_activity("Risk Agent", AgentStatus.RUNNING, "Assessing execution risks")
            risk_assessments = await with_retry(self.risk_agent.assess_risks, tasks, transcript)
            risk_map = {ra.task_id: ra for ra in risk_assessments}
            for i, task in enumerate(tasks):
                if str(i) in risk_map:
                    task.risk = risk_map[str(i)].risk
            await self._emit_activity("Risk Agent", AgentStatus.COMPLETED, f"Assessed risks for {len(tasks)} tasks")

        async with Timer("assignment"):
            await self._emit_activity("Assignment Agent", AgentStatus.RUNNING, "Assigning task owners")
            assignments = await with_retry(self.assignment_agent.assign_owners, tasks, transcript)
            assignment_map = {a.task_id: a for a in assignments}
            for i, task in enumerate(tasks):
                if str(i) in assignment_map:
                    task.owner = assignment_map[str(i)].owner
            await self._emit_activity("Assignment Agent", AgentStatus.COMPLETED, f"Assigned owners for {len(tasks)} tasks")

        async with Timer("reporting"):
            await self._emit_activity("Reporting Agent", AgentStatus.RUNNING, "Generating execution dashboard")
            dashboard = await with_retry(self.reporting_agent.generate_dashboard, transcript_id, tasks, transcript)
            await self._emit_activity("Reporting Agent", AgentStatus.COMPLETED, "Dashboard generated")

        await self._emit_activity("Orchestrator", AgentStatus.COMPLETED, "Workflow complete")
        logger.info("Session %s completed in %.2fs total", transcript_id,
                     sum(a.timestamp.timestamp() for a in self.activities))

        await cache_set_json(cache_key, dashboard.model_dump(), ttl=600)
        return dashboard
