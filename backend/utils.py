import asyncio
import logging
import os
from typing import Optional, Callable, Awaitable, TypeVar

T = TypeVar("T")

# Structured logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("workflowos")


# Retry with exponential backoff
async def with_retry(
    fn: Callable[..., Awaitable[T]],
    *args,
    max_retries: int = 3,
    base_delay: float = 1.0,
    **kwargs,
) -> T:
    last_exception = None
    for attempt in range(max_retries + 1):
        try:
            return await fn(*args, **kwargs)
        except Exception as e:
            last_exception = e
            if attempt < max_retries:
                delay = base_delay * (2 ** attempt)
                logger.warning(
                    "Retry %d/%d for %s after error: %s",
                    attempt + 1, max_retries, fn.__name__, e,
                )
                await asyncio.sleep(delay)
    logger.error("All %d retries failed for %s: %s", max_retries, fn.__name__, last_exception)
    raise last_exception


# Async context timer
class Timer:
    def __init__(self, name: str):
        self.name = name
        self.elapsed: float = 0.0

    async def __aenter__(self):
        self._start = asyncio.get_event_loop().time()
        return self

    async def __aexit__(self, *args):
        self.elapsed = asyncio.get_event_loop().time() - self._start
        logger.debug("Timer [%s]: %.3fs", self.name, self.elapsed)
