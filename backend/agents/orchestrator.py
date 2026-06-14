import asyncio
import re
import time
import uuid
from typing import Callable, Awaitable, List, Optional
from schemas.models import (
    TaskItem, ExecutionDashboard, AgentActivity, AgentStatus
)
from utils import with_retry
import db
from agents.extraction import ExtractionAgent
from agents.risk import RiskAgent
from agents.assignment import AssignmentAgent
from agents.reporting import ReportingAgent
from agents.validator import ValidatorAgent

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
        self._start_times: dict[str, float] = {}

    async def _emit_activity(self, agent_name: str, status: AgentStatus, message: str):
        elapsed = None
        if status == AgentStatus.RUNNING:
            self._start_times[agent_name] = time.time()
        elif status in (AgentStatus.COMPLETED, AgentStatus.FAILED):
            start = self._start_times.pop(agent_name, None)
            if start:
                elapsed = round(time.time() - start, 2)
        activity = AgentActivity(agent_name=agent_name, status=status, message=message, elapsed_seconds=elapsed)
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

    async def _run_risk(self, tasks: List[TaskItem], transcript: str, prior_context: Optional[List[dict]] = None):
        await self._emit_activity("Risk Agent", AgentStatus.RUNNING, "Assessing execution risks")
        risk_assessments = await with_retry(self.risk_agent.assess_risks, tasks, transcript, prior_context=prior_context)
        risk_map = {ra.task_id: ra for ra in risk_assessments}
        for i, task in enumerate(tasks):
            if str(i) in risk_map:
                task.risk = risk_map[str(i)].risk
        await self._emit_activity("Risk Agent", AgentStatus.COMPLETED, f"Assessed risks for {len(risk_map)} tasks")

    async def _run_assignment(self, tasks: List[TaskItem], transcript: str, prior_context: Optional[List[dict]] = None):
        await self._emit_activity("Assignment Agent", AgentStatus.RUNNING, "Assigning task owners")
        assignments = await with_retry(self.assignment_agent.assign_owners, tasks, transcript, prior_context=prior_context)
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

        # Cross-meeting swarm memory: pull prior completed meetings so Risk,
        # Assignment, and the Validator can coordinate across transcripts.
        prior_context: List[dict] = []
        try:
            prior_context = await db.get_prior_context(exclude_session_id=transcript_id)
        except Exception:
            prior_context = []
        if prior_context:
            prior_meetings = len({p["meeting_id"] for p in prior_context})
            await self._emit_activity(
                "Orchestrator", AgentStatus.RUNNING,
                f"Swarm memory: loaded {len(prior_context)} tasks from {prior_meetings} prior meeting(s) for cross-meeting analysis"
            )

        await self._emit_activity("Extraction Agent", AgentStatus.RUNNING, "Extracting tasks and decisions")
        extraction_result = await with_retry(self.extraction_agent.extract, transcript)
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

            await self._run_risk(tasks, transcript, prior_context)

        if route["run_assignment"] and tasks:
            await self._run_assignment(tasks, transcript, prior_context)

        # Parallel validation sidecar: Reporting (LLM call) and the Validator
        # (in-process checks) run concurrently — the Validator computes while
        # Reporting awaits the network, instead of strictly after it.
        await self._emit_activity("Reporting Agent", AgentStatus.RUNNING, "Generating execution dashboard")
        await self._emit_activity("Validator Agent", AgentStatus.RUNNING, "Cross-checking owners, deadlines, and risk scores (parallel sidecar)")

        async def _report():
            result = await with_retry(self.reporting_agent.generate_dashboard, transcript_id, tasks, transcript)
            await self._emit_activity("Reporting Agent", AgentStatus.COMPLETED, "Dashboard generated")
            return result

        async def _validate():
            result = await self.validator_agent.validate(tasks, route["speakers"], prior_context)
            await self._emit_activity("Validator Agent", AgentStatus.COMPLETED, f"Found {len(result)} issues")
            return result

        dashboard, issues = await asyncio.gather(_report(), _validate())
        dashboard.validation_issues = issues

        if issues:
            issue_types = {i.issue_type for i in issues}
            if route["run_assignment"] and "unowned_task" in issue_types:
                await self._emit_activity("Orchestrator", AgentStatus.RUNNING, "Correction pass: re-running Assignment for unowned tasks")
                await self._run_assignment(tasks, transcript, prior_context)
            if route["run_risk"] and "missing_risk_score" in issue_types:
                await self._emit_activity("Orchestrator", AgentStatus.RUNNING, "Correction pass: re-running Risk for unscored tasks")
                await self._run_risk(tasks, transcript, prior_context)
            if route["run_assignment"] and ("unowned_task" in issue_types or "missing_risk_score" in issue_types):
                dashboard.validation_issues = await self.validator_agent.validate(tasks, route["speakers"], prior_context)

        await self._emit_activity("Orchestrator", AgentStatus.COMPLETED, "Workflow complete")

        return dashboard
