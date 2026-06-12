import pytest
from typing import List

from backend.schemas.models import (
    TaskItem, RiskLevel
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
