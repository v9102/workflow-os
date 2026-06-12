import json
import os
import logging
from typing import List
from openai import AzureOpenAI
from ..schemas.models import ExtractionResult, TaskItem

logger = logging.getLogger("workflowos.extraction")

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
        api_key = os.getenv("AZURE_OPENAI_API_KEY")
        if not api_key:
            logger.warning("AZURE_OPENAI_API_KEY not set; using placeholder")
        self.client = AzureOpenAI(
            api_key=api_key or "placeholder",
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")

    async def extract(self, transcript: str) -> ExtractionResult:
        try:
            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=[
                    {"role": "system", "content": EXTRACTION_PROMPT},
                    {"role": "user", "content": transcript}
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
                timeout=30,
            )
            raw = response.choices[0].message.content
        except Exception as e:
            logger.error("OpenAI extraction failed: %s", e)
            return ExtractionResult(tasks=[], decisions=[])

        try:
            result = json.loads(raw)
        except json.JSONDecodeError:
            logger.error("Failed to parse extraction JSON: %s", raw[:200])
            return ExtractionResult(tasks=[], decisions=[])

        tasks = []
        for i, t in enumerate(result.get("tasks", [])):
            tasks.append(TaskItem(
                id=str(i),
                task=t.get("task", ""),
                deadline=t.get("deadline"),
                dependencies=t.get("dependencies", []),
                decision=t.get("decision"),
            ))
        return ExtractionResult(tasks=tasks, decisions=result.get("decisions", []))