import re
import uuid
from typing import Callable, Awaitable, List, Optional
from ..schemas.models import (
    TaskItem, ExecutionDashboard, AgentActivity, AgentStatus
)
from .extraction import ExtractionAgent
from .risk import RiskAgent
from .assignment import AssignmentAgent
from .reporting import ReportingAgent
from .validator import ValidatorAgent

SHORT_TRANSCRIPT_WORDS = 100

ActivityCallback = Callable[[AgentActivity], Awaitable[None]]


class OrchestratorAgent:
    """Routes the agent swarm: dynamic DAG based on transcript shape, a
    feedback loop back to Extraction, and a post-pipeline validator sidecar
    with a targeted correction pass. One instance per processing session."""

    def __init__(self, activity_callback: Optional[ActivityCallback] = None):
        self.extraction_agent = ExtractionAgent()
        self.risk_agent = RiskAgent()
        self.assignment_agent = AssignmentAgent()
        self.reporting_agent = ReportingAgent()
        self.validator_agent = ValidatorAgent()
        self.activities: List[AgentActivity] = []
        self._activity_callback = activity_callback

    async def _emit_activity(self, agent_name: str, status: AgentStatus, message: str):
        activity = AgentActivity(agent_name=agent_name, status=status, message=message)
        self.activities.append(activity)
        if self._activity_callback:
            await self._activity_callback(activity)

    @staticmethod
    def _speakers(transcript: str) -> List[str]:
        return list(set(re.findall(r'^(\w+):\s', transcript, re.MULTILINE)))

    def _plan_route(self, transcript: str) -> dict:
        word_count = len(transcript.split())
        speakers = self._speakers(transcript)
        run_risk = len(speakers) > 1
        run_assignment = len(speakers) > 1 and word_count >= SHORT_TRANSCRIPT_WORDS
        return {
            "speakers": speakers,
            "run_risk": run_risk,
            "run_assignment": run_assignment,
        }

    async def _run_risk(self, tasks: List[TaskItem], transcript: str):
        await self._emit_activity("Risk Agent", AgentStatus.RUNNING, "Assessing execution risks")
        risk_assessments = await self.risk_agent.assess_risks(tasks, transcript)
        risk_map = {ra.task_id: ra for ra in risk_assessments}
        for i, task in enumerate(tasks):
            if str(i) in risk_map:
                task.risk = risk_map[str(i)].risk
        await self._emit_activity("Risk Agent", AgentStatus.COMPLETED, f"Assessed risks for {len(risk_map)} tasks")

    async def _run_assignment(self, tasks: List[TaskItem], transcript: str):
        await self._emit_activity("Assignment Agent", AgentStatus.RUNNING, "Assigning task owners")
        assignments = await self.assignment_agent.assign_owners(tasks, transcript)
        assignment_map = {a.task_id: a for a in assignments}
        for i, task in enumerate(tasks):
            if str(i) in assignment_map:
                task.owner = assignment_map[str(i)].owner
        await self._emit_activity("Assignment Agent", AgentStatus.COMPLETED, f"Assigned owners for {len(assignment_map)} tasks")

    async def process_transcript(self, transcript: str, transcript_id: str = None) -> ExecutionDashboard:
        if not transcript_id:
            transcript_id = str(uuid.uuid4())[:8]

        self.activities = []

        route = self._plan_route(transcript)
        skipped = [name for name, run in [("Risk", route["run_risk"]), ("Assignment", route["run_assignment"])] if not run]
        route_msg = "Routing full pipeline" if not skipped else f"Dynamic routing: skipping {', '.join(skipped)}"
        await self._emit_activity("Orchestrator", AgentStatus.RUNNING, f"Starting workflow pipeline. {route_msg}")

        await self._emit_activity("Extraction Agent", AgentStatus.RUNNING, "Extracting tasks and decisions")
        extraction_result = await self.extraction_agent.extract(transcript)
        tasks = extraction_result.tasks
        await self._emit_activity("Extraction Agent", AgentStatus.COMPLETED, f"Extracted {len(tasks)} tasks")

        if route["run_risk"] and tasks:
            missing_deadlines = [t for t in tasks if not t.deadline]
            if missing_deadlines:
                await self._emit_activity(
                    "Risk Agent", AgentStatus.RUNNING,
                    f"Feedback loop: {len(missing_deadlines)} tasks lack deadlines, asking Extraction to re-scan"
                )
                retry = await self.extraction_agent.extract(
                    transcript,
                    context_hint="Re-check the transcript for implicit time references "
                                 "(e.g. 'ASAP', 'end of sprint', 'before launch') and "
                                 "attach a deadline to every task that has one."
                )
                if retry.tasks:
                    retry_by_desc = {t.task: t for t in retry.tasks}
                    for task in missing_deadlines:
                        match = retry_by_desc.get(task.task)
                        if match and match.deadline:
                            task.deadline = match.deadline
                await self._emit_activity("Extraction Agent", AgentStatus.COMPLETED, "Deadline re-scan complete")

            await self._run_risk(tasks, transcript)

        if route["run_assignment"] and tasks:
            await self._run_assignment(tasks, transcript)

        await self._emit_activity("Reporting Agent", AgentStatus.RUNNING, "Generating execution dashboard")
        dashboard = await self.reporting_agent.generate_dashboard(transcript_id, tasks, transcript)
        await self._emit_activity("Reporting Agent", AgentStatus.COMPLETED, "Dashboard generated")

        await self._emit_activity("Validator Agent", AgentStatus.RUNNING, "Cross-checking owners, deadlines, and risk scores")
        issues = await self.validator_agent.validate(tasks, route["speakers"])
        dashboard.validation_issues = issues
        await self._emit_activity("Validator Agent", AgentStatus.COMPLETED, f"Found {len(issues)} issues")

        if issues:
            issue_types = {i.issue_type for i in issues}
            if route["run_assignment"] and "unowned_task" in issue_types:
                await self._emit_activity("Orchestrator", AgentStatus.RUNNING, "Correction pass: re-running Assignment for unowned tasks")
                await self._run_assignment(tasks, transcript)
            if route["run_risk"] and "missing_risk_score" in issue_types:
                await self._emit_activity("Orchestrator", AgentStatus.RUNNING, "Correction pass: re-running Risk for unscored tasks")
                await self._run_risk(tasks, transcript)
            if route["run_assignment"] and ("unowned_task" in issue_types or "missing_risk_score" in issue_types):
                dashboard.validation_issues = await self.validator_agent.validate(tasks, route["speakers"])

        await self._emit_activity("Orchestrator", AgentStatus.COMPLETED, "Workflow complete")

        return dashboard
