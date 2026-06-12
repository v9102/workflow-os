import uuid
from typing import List, Dict, Callable, Awaitable
from ..schemas.models import (
    TaskItem, ExtractionResult, RiskAssessment, 
    AssignmentResult, ExecutionDashboard, AgentActivity, AgentStatus
)
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

        await self._emit_activity("Orchestrator", AgentStatus.RUNNING, "Starting workflow pipeline")

        await self._emit_activity("Extraction Agent", AgentStatus.RUNNING, "Extracting tasks and decisions")
        extraction_result = await self.extraction_agent.extract(transcript)
        tasks = extraction_result.tasks
        await self._emit_activity("Extraction Agent", AgentStatus.COMPLETED, f"Extracted {len(tasks)} tasks")

        await self._emit_activity("Risk Agent", AgentStatus.RUNNING, "Assessing execution risks")
        risk_assessments = await self.risk_agent.assess_risks(tasks, transcript)
        risk_map = {ra.task_id: ra for ra in risk_assessments}
        for i, task in enumerate(tasks):
            if str(i) in risk_map:
                task.risk = risk_map[str(i)].risk
        await self._emit_activity("Risk Agent", AgentStatus.COMPLETED, f"Assessed risks for {len(tasks)} tasks")

        await self._emit_activity("Assignment Agent", AgentStatus.RUNNING, "Assigning task owners")
        assignments = await self.assignment_agent.assign_owners(tasks, transcript)
        assignment_map = {a.task_id: a for a in assignments}
        for i, task in enumerate(tasks):
            if str(i) in assignment_map:
                task.owner = assignment_map[str(i)].owner
        await self._emit_activity("Assignment Agent", AgentStatus.COMPLETED, f"Assigned owners for {len(tasks)} tasks")

        await self._emit_activity("Reporting Agent", AgentStatus.RUNNING, "Generating execution dashboard")
        dashboard = await self.reporting_agent.generate_dashboard(transcript_id, tasks, transcript)
        await self._emit_activity("Reporting Agent", AgentStatus.COMPLETED, "Dashboard generated")

        await self._emit_activity("Orchestrator", AgentStatus.COMPLETED, "Workflow complete")

        return dashboard