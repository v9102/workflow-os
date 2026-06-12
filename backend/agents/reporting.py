import json
import os
from typing import List
from datetime import datetime
from openai import AzureOpenAI
from ..schemas.models import TaskItem, ExecutionDashboard, RiskLevel


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
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")

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

        prompt = f"{REPORTING_PROMPT}\n\nTranscript:\n{transcript[:3000]}\n\nTasks:\n" + "\n".join(task_summaries)

        response = self.client.chat.completions.create(
            model=self.deployment,
            messages=[
                {"role": "system", "content": REPORTING_PROMPT},
                {"role": "user", "content": prompt}
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