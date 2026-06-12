import os
from typing import Optional

try:
    from azure.cosmos import CosmosClient, exceptions
    _HAS_COSMOS = True
except ImportError:
    _HAS_COSMOS = False
    CosmosClient = None
    exceptions = None

_client: Optional[CosmosClient] = None
_in_memory_store: dict[str, dict] = {}
_audit_store: list[dict] = []

SCHEMA_VERSION_KEY = "_schema_version"


def _get_client() -> Optional["CosmosClient"]:
    global _client
    if _client is None and _HAS_COSMOS:
        conn = os.getenv("COSMOS_DB_CONNECTION_STRING")
        if conn:
            _client = CosmosClient.from_connection_string(conn)
    return _client


def _use_cosmos() -> bool:
    return bool(os.getenv("COSMOS_DB_CONNECTION_STRING")) and _HAS_COSMOS


def _db_name() -> str:
    return os.getenv("COSMOS_DB_DATABASE", "workflowos")


def _container_name() -> str:
    return os.getenv("COSMOS_DB_CONTAINER", "sessions")


def _audit_container_name() -> str:
    return os.getenv("COSMOS_DB_AUDIT_CONTAINER", "audit")


def _container():
    if not _use_cosmos():
        return None
    client = _get_client()
    if not client:
        return None
    db = client.get_database_client(_db_name())
    return db.get_container_client(_container_name())


def _audit_container():
    if not _use_cosmos():
        return None
    client = _get_client()
    if not client:
        return None
    db = client.get_database_client(_db_name())
    return db.get_container_client(_audit_container_name())


async def save_session(session_id: str, data: dict) -> None:
    data["id"] = session_id
    data[SCHEMA_VERSION_KEY] = "1.0.0"
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
        except Exception:
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


async def save_audit_entry(session_id: str, entry: dict) -> None:
    entry["id"] = f"audit-{session_id}-{entry['timestamp']}"
    container = _audit_container()
    if container:
        try:
            container.create_item(entry)
        except Exception:
            pass
    _audit_store.append(entry)


async def get_audit_entries(session_id: str) -> list[dict]:
    container = _audit_container()
    if container:
        try:
            items = container.query_items(
                query="SELECT * FROM c WHERE c.session_id = @sid",
                parameters=[{"name": "@sid", "value": session_id}],
            )
            return list(items)
        except Exception:
            return []
    return [e for e in _audit_store if e.get("session_id") == session_id]


async def list_sessions() -> list[dict]:
    container = _container()
    if container:
        try:
            items = container.query_items("SELECT c.id, c.status, c._schema_version FROM c")
            return list(items)
        except Exception:
            return []
    return [{"id": k, "status": v.get("status"), SCHEMA_VERSION_KEY: v.get(SCHEMA_VERSION_KEY)} for k, v in _in_memory_store.items()]


async def check_schema_version() -> str:
    return "1.0.0"
