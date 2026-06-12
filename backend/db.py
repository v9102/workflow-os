import os
from typing import Optional
from azure.cosmos import CosmosClient, exceptions

_client: Optional[CosmosClient] = None
_in_memory_store: dict[str, dict] = {}


def _get_client() -> Optional[CosmosClient]:
    global _client
    if _client is None:
        conn = os.getenv("COSMOS_DB_CONNECTION_STRING")
        if conn:
            _client = CosmosClient.from_connection_string(conn)
    return _client


_use_cosmos = lambda: bool(os.getenv("COSMOS_DB_CONNECTION_STRING"))
_db_name = lambda: os.getenv("COSMOS_DB_DATABASE", "workflowos")
_container_name = lambda: os.getenv("COSMOS_DB_CONTAINER", "sessions")


def _container():
    if not _use_cosmos():
        return None
    client = _get_client()
    if not client:
        return None
    db = client.get_database_client(_db_name())
    return db.get_container_client(_container_name())


async def save_session(session_id: str, data: dict) -> None:
    data["id"] = session_id
    container = _container()
    if container:
        container.upsert_item(data)
    else:
        _in_memory_store[session_id] = data


async def get_session(session_id: str) -> Optional[dict]:
    container = _container()
    if container:
        try:
            return container.read_item(item=session_id, partition_key=session_id)
        except exceptions.CosmosResourceNotFoundError:
            return None
    return _in_memory_store.get(session_id)


async def delete_session(session_id: str) -> None:
    container = _container()
    if container:
        try:
            container.delete_item(item=session_id, partition_key=session_id)
        except exceptions.CosmosResourceNotFoundError:
            pass
    else:
        _in_memory_store.pop(session_id, None)
