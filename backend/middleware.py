import os
import time
from collections import defaultdict
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


_RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
_WINDOW = 60.0
_hits: dict[str, list[float]] = defaultdict(list)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = _hits[client_ip]
        cutoff = now - _WINDOW
        while window and window[0] < cutoff:
            window.pop(0)
        if len(window) >= _RATE_LIMIT:
            return Response(status_code=429, content='{"detail":"Rate limit exceeded. Try again later."}', media_type="application/json")
        window.append(now)
        return await call_next(request)
