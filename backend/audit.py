import os
import json
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger("workflowos.audit")

_LOG_FILE = os.getenv("AUDIT_LOG_FILE", "audit.log")


async def log_audit(
    session_id: str,
    action: str,
    actor: str = "system",
    detail: Optional[dict] = None,
    store_db: bool = True,
):
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id,
        "action": action,
        "actor": actor,
        "detail": detail or {},
    }
    line = json.dumps(entry, default=str)
    try:
        with open(_LOG_FILE, "a") as f:
            f.write(line + "\n")
    except Exception as e:
        logger.warning("Audit file write failed: %s", e)

    if store_db:
        try:
            import db
            await db.save_audit_entry(session_id, entry)
        except Exception as e:
            logger.warning("Audit DB write failed: %s", e)

    logger.info("AUDIT [%s] %s by %s", session_id, action, actor)
