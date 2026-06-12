import os
import json
from typing import Optional, Any

try:
    import redis.asyncio as aioredis
    _HAS_REDIS = True
except ImportError:
    _HAS_REDIS = False
    aioredis = None


_redis_client = None


def _get_redis() -> Optional[Any]:
    global _redis_client
    if _redis_client is None and _HAS_REDIS:
        url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        try:
            _redis_client = aioredis.from_url(url, decode_responses=True)
        except Exception:
            _redis_client = None
    return _redis_client


async def cache_get(key: str) -> Optional[str]:
    client = _get_redis()
    if client:
        try:
            return await client.get(key)
        except Exception:
            return None
    return None


async def cache_set(key: str, value: str, ttl: int = 300) -> None:
    client = _get_redis()
    if client:
        try:
            await client.setex(key, ttl, value)
        except Exception:
            pass


async def cache_get_json(key: str) -> Optional[Any]:
    raw = await cache_get(key)
    if raw:
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None
    return None


async def cache_set_json(key: str, value: Any, ttl: int = 300) -> None:
    await cache_set(key, json.dumps(value, default=str), ttl)
