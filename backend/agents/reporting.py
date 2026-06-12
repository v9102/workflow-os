import json
from typing import List
from ..schemas.models import TaskItem, ExecutionDashboard
from .llm import get_client, get_deployment


REPORTING_PROMPT = """
You are an expert at creating executive execution dashboards from meeting outcomes.

Generate a JSON object with:
{
    "summary": "2-3 sentence executive summary of the meeting outcomes",
    "timeline": [
        {"task": "task name", "deadline": "deadline", "owner": "owner", "risk": "risk level"}
    ]
}

The timeline should be sorted by deadline urgency (soonest first, unknown last).
Include risk level for each task.
"""


class ReportingAgent:
    def __init__(self):
        self.client = get_client()
        self.deployment = get_deployment()

    async def generate_dashboard(
        self,
        transcript_id: str,
        tasks: List[TaskItem],
        transcript: str
    ) -> ExecutionDashboard:
        task_summaries = [
            f"{t.task} | Owner: {t.owner or 'Unassigned'} | Deadline: {t.deadline or 'Unknown'} | Risk: {t.risk.value}"
            for t in tasks
        ]

        user_prompt = f"Transcript:\n{transcript[:3000]}\n\nTasks:\n" + "\n".join(task_summaries)

        response = await self.client.chat.completions.create(
            model=self.deployment,
            messages=[
                {"role": "system", "content": REPORTING_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        return ExecutionDashboard(
            transcript_id=transcript_id,
            tasks=tasks,
            summary=result.get("summary", "Meeting processed successfully."),
            timeline=result.get("timeline", [])
        )
