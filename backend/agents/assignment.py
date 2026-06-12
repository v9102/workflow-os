import json
import re
from typing import List
from ..schemas.models import TaskItem, AssignmentResult
from .llm import get_client, get_deployment


ASSIGNMENT_PROMPT = """
You are an expert at assigning task ownership based on meeting context.

Assignment criteria:
1. Direct mentions: "John will handle this", "Sarah owns the API work"
2. Contextual relevance: Person discussed the topic, has relevant expertise
3. Historical ownership: Person mentioned owning similar tasks before
4. Role inference: "Our designer", "backend lead", "PM" etc.

Tasks are given as numbered entries ("<index>: <description>"). Return a JSON
object with an "assignments" array, using the numeric index as task_id:
{
    "assignments": [
        {
            "task_id": "0",
            "owner": "person name",
            "confidence": 0.0
        }
    ]
}

If no clear owner can be determined, use "Unassigned" with low confidence.
Extract speaker names from the transcript context.
"""


class AssignmentAgent:
    def __init__(self):
        self._client = None
        self._deployment = None

    def _ensure_client(self):
        if self._client is not None:
            return
        self._client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY", "placeholder"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", "")
        )
        self._deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")

    def _extract_speakers(self, transcript: str) -> List[str]:
        return list(set(re.findall(r'^(\w+):\s', transcript, re.MULTILINE)))

    async def assign_owners(self, tasks: List[TaskItem], transcript: str) -> List[AssignmentResult]:
        self._ensure_client()
        speakers = self._extract_speakers(transcript)
        speaker_context = f"Identified speakers: {', '.join(speakers)}" if speakers else "No clear speakers identified"

        task_descriptions = [f"{i}: {t.task}" for i, t in enumerate(tasks)]

        user_prompt = f"{speaker_context}\n\nTranscript:\n{transcript[:4000]}\n\nTasks:\n" + "\n".join(task_descriptions)

        response = await self.client.chat.completions.create(
            model=self.deployment,
            messages=[
                {"role": "system", "content": ASSIGNMENT_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        assignments = []
        for item in result.get("assignments", []):
            assignments.append(AssignmentResult(
                task_id=str(item.get("task_id", "")),
                owner=item.get("owner", "Unassigned"),
                confidence=float(item.get("confidence", 0.0))
            ))
        return assignments
