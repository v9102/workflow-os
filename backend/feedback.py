import os
import json
from typing import Optional

try:
    from azure.servicebus import ServiceBusClient, ServiceBusMessage
    _HAS_SERVICEBUS = True
except ImportError:
    _HAS_SERVICEBUS = False
    ServiceBusClient = None
    ServiceBusMessage = None


_queue_client = None


def _get_queue_client():
    global _queue_client
    if _queue_client is None and _HAS_SERVICEBUS:
        conn = os.getenv("SERVICEBUS_CONNECTION_STRING")
        queue_name = os.getenv("SERVICEBUS_QUEUE_NAME", "feedback")
        if conn:
            client = ServiceBusClient.from_connection_string(conn)
            _queue_client = client.get_queue_sender(queue_name)
    return _queue_client


async def send_feedback(from_agent: str, to_agent: str, reason: str, context: dict = None):
    sender = _get_queue_client()
    if sender:
        message = ServiceBusMessage(
            json.dumps({
                "from": from_agent,
                "to": to_agent,
                "reason": reason,
                "context": context or {},
            })
        )
        sender.send_messages(message)


async def receive_feedback(timeout: float = 5.0) -> Optional[dict]:
    conn = os.getenv("SERVICEBUS_CONNECTION_STRING")
    queue_name = os.getenv("SERVICEBUS_QUEUE_NAME", "feedback")
    if not conn or not _HAS_SERVICEBUS:
        return None
    client = ServiceBusClient.from_connection_string(conn)
    receiver = client.get_queue_receiver(queue_name)
    with receiver:
        messages = receiver.receive_messages(max_message_count=1, max_wait_time=timeout)
        if messages:
            msg = messages[0]
            data = json.loads(str(msg))
            receiver.complete_message(msg)
            return data
    return None
