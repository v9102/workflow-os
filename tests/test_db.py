import pytest
from backend import db


@pytest.mark.asyncio
async def test_save_and_get_session():
    session_id = "test-session-1"
    data = {"status": "processing", "tasks": []}
    await db.save_session(session_id, data)
    retrieved = await db.get_session(session_id)
    assert retrieved is not None
    assert retrieved["status"] == "processing"


@pytest.mark.asyncio
async def test_get_nonexistent_session():
    result = await db.get_session("nonexistent-id")
    assert result is None


@pytest.mark.asyncio
async def test_delete_session():
    session_id = "test-session-to-delete"
    await db.save_session(session_id, {"status": "done"})
    await db.delete_session(session_id)
    result = await db.get_session(session_id)
    assert result is None


@pytest.mark.asyncio
async def test_update_session():
    session_id = "test-session-update"
    await db.save_session(session_id, {"status": "processing"})
    await db.save_session(session_id, {"status": "completed", "result": "ok"})
    retrieved = await db.get_session(session_id)
    assert retrieved["status"] == "completed"
    assert retrieved["result"] == "ok"
