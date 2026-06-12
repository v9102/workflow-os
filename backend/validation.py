import re
from typing import Optional


_MAX_TRANSCRIPT_LENGTH = 50000
_MAX_TASK_LENGTH = 500


def sanitize_transcript(text: str) -> str:
    text = text.strip()
    text = re.sub(r"<[^>]+>", "", text)
    text = text[: _MAX_TRANSCRIPT_LENGTH]
    return text


def validate_transcript(text: str) -> Optional[str]:
    if not text or not text.strip():
        return "Transcript is empty"
    if len(text) > _MAX_TRANSCRIPT_LENGTH:
        return f"Transcript exceeds {_MAX_TRANSCRIPT_LENGTH} characters"
    return None


def sanitize_task_name(name: str) -> str:
    return name.strip()[: _MAX_TASK_LENGTH]
