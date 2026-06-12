import pytest
from unittest.mock import AsyncMock, patch
from typing import List

from backend.schemas.models import (
    TaskItem, ExtractionResult, RiskAssessment, AssignmentResult,
    RiskLevel, AgentActivity, AgentStatus
)


SAMPLE_TRANSCRIPT = """Sarah: Good morning everyone. Let's kick off sprint planning.
Rakshit: I'll implement the OAuth2 flow by Friday.
Priya: I can handle integration tests once the API is documented.
Sarah: The security review is a blocker — needs to be done before launch.
Rakshit: The third-party provider has rate limits, that's a medium risk.
"""


@pytest.fixture
def sample_transcript() -> str:
    return SAMPLE_TRANSCRIPT


@pytest.fixture
def sample_tasks() -> List[TaskItem]:
    return [
        TaskItem(id="0", task="Implement OAuth2 flow", deadline="Friday",
                 dependencies=[], decision="Rakshit owns this"),
        TaskItem(id="1", task="Write integration tests", deadline=None,
                 dependencies=["API docs"], decision=None),
        TaskItem(id="2", task="Security review", deadline="Before launch",
                 dependencies=[], decision="Blocker"),
    ]


@pytest.fixture
def mock_openai():
    """Mock Azure OpenAI chat completions for all agent tests."""
    with patch("backend.agents.llm.get_client") as mock_get_client:
        mock_client = AsyncMock()
        mock_completion = AsyncMock()
        mock_choice = AsyncMock()
        mock_choice.message.content = '{"tasks": [], "decisions": []}'
        mock_completion.choices = [mock_choice]
        mock_client.chat.completions.create = AsyncMock(return_value=mock_completion)
        mock_get_client.return_value = mock_client
        yield mock_get_client
