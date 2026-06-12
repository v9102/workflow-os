import json
from typing import Optional
from ..schemas.models import ExtractionResult, TaskItem
from .llm import get_client, get_deployment


EXTRACTION_PROMPT = """
You are an expert at extracting actionable items from meeting transcripts.
Extract all tasks, decisions, deadlines, and dependencies from the transcript.

Return a JSON object with this structure:
{
    "tasks": [
        {
            "task": "description of the task",
            "deadline": "deadline if mentioned (e.g., Friday, 2024-01-15, next week)",
            "dependencies": ["task descriptions this depends on"],
            "decision": "related decision if any"
        }
    ],
    "decisions": ["key decisions made in the meeting"]
}

Guidelines:
- Only extract explicit action items and decisions
- Include deadlines exactly as mentioned (don't infer dates)
- Dependencies should reference other task descriptions
- Be concise but complete
"""


class ExtractionAgent:
    def __init__(self):
        self.client = get_client()
        self.deployment = get_deployment()

    async def extract(self, transcript: str, context_hint: Optional[str] = None) -> ExtractionResult:
        system_prompt = EXTRACTION_PROMPT
        if context_hint:
            system_prompt += f"\nAdditional instruction from a downstream agent:\n{context_hint}\n"

        response = await self.client.chat.completions.create(
            model=self.deployment,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": transcript}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        tasks = [
            TaskItem(
                id=str(i),
                task=t["task"],
                deadline=t.get("deadline"),
                dependencies=t.get("dependencies", []),
                decision=t.get("decision")
            )
            for i, t in enumerate(result.get("tasks", []))
        ]
        return ExtractionResult(tasks=tasks, decisions=result.get("decisions", []))
