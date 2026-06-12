import json
import os
from typing import List
from openai import AzureOpenAI
from ..schemas.models import TaskItem, RiskAssessment, RiskLevel


RISK_PROMPT = """
You are a risk assessment expert. Evaluate the execution risk for each task.

Consider these risk factors:
- Deadline proximity (urgent/soon = higher risk)
- Task dependencies (many dependencies = higher risk)
- Urgency indicators in language (ASAP, critical, blocker, urgent)
- Speaker emphasis (repeated mentions, strong language)
- Ambiguity in task definition

Tasks are given as numbered entries ("<index>: <description>"). Return a JSON
object with an "assessments" array, using the numeric index as task_id:
{
    "assessments": [
        {
            "task_id": "0",
            "risk": "Low|Medium|High|Unknown",
            "reasoning": "brief explanation"
        }
    ]
}

Risk Levels:
- Low: Clear task, adequate time, few dependencies
- Medium: Some concerns (tight deadline, dependencies, ambiguity)
- High: Critical concerns (imminent deadline, blockers, unclear ownership)
- Unknown: Insufficient information
"""


class RiskAgent:
    def __init__(self):
        self._client = None
        self._deployment = None

    def _ensure_client(self):
        if hasattr(self, 'client') and self.client is not None:
            return
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY", "placeholder"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", "")
        )
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")

    async def assess_risks(self, tasks: List[TaskItem], transcript: str) -> List[RiskAssessment]:
        self._ensure_client()
        task_descriptions = [f"{i}: {t.task} (deadline: {t.deadline or 'none'}, deps: {t.dependencies})" 
                           for i, t in enumerate(tasks)]

        user_prompt = f"Transcript context:\n{transcript[:3000]}\n\nTasks:\n" + "\n".join(task_descriptions)

        response = self.client.chat.completions.create(
            model=self.deployment,
            messages=[
                {"role": "system", "content": RISK_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        assessments = []
        for item in result.get("assessments", []):
            risk_str = item.get("risk", "Unknown")
            try:
                risk = RiskLevel(risk_str)
            except ValueError:
                risk = RiskLevel.UNKNOWN
            assessments.append(RiskAssessment(
                task_id=str(item.get("task_id", "")),
                risk=risk,
                reasoning=item.get("reasoning", "")
            ))
        return assessments
