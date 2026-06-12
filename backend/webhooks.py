import os
import json
import hmac
import hashlib
import logging
from typing import Optional
from httpx import AsyncClient

logger = logging.getLogger("workflowos")

_WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")
_HTTP = AsyncClient()


async def notify_webhook(event: str, session_id: str, payload: dict):
    url = os.getenv("WEBHOOK_URL")
    if not url:
        return
    body = json.dumps({"event": event, "session_id": session_id, "data": payload}, default=str)
    headers = {"Content-Type": "application/json"}
    if _WEBHOOK_SECRET:
        sig = hmac.new(_WEBHOOK_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
        headers["X-Webhook-Signature"] = sig
    try:
        resp = await _HTTP.post(url, content=body, headers=headers, timeout=10)
        logger.info("Webhook %s → %s: %s", event, url, resp.status_code)
    except Exception as e:
        logger.warning("Webhook %s failed: %s", event, e)
