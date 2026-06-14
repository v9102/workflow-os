import os
import httpx
from typing import Optional

GRAPH_API_BASE = "https://graph.microsoft.com/v1.0"


class MicrosoftGraphClient:
    def __init__(self):
        self.client_id = os.getenv("MICROSOFT_CLIENT_ID")
        self.client_secret = os.getenv("MICROSOFT_CLIENT_SECRET")
        self.tenant_id = os.getenv("MICROSOFT_TENANT_ID")
        self._token: Optional[str] = None

    def is_configured(self) -> bool:
        """True when Microsoft 365 / Entra ID credentials are present so the
        Graph calls can actually run. Lets export endpoints degrade gracefully
        instead of 500-ing when M365 isn't wired up."""
        return bool(self.client_id and self.client_secret and self.tenant_id)

    async def _get_token(self) -> str:
        if self._token:
            return self._token
        url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials",
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, data=data)
            resp.raise_for_status()
            result = resp.json()
            self._token = result["access_token"]
        return self._token

    async def push_to_planner(self, plan_id: str, title: str, bucket_id: str = None) -> dict:
        token = await self._get_token()
        url = f"{GRAPH_API_BASE}/planner/tasks"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        body = {
            "planId": plan_id,
            "title": title,
            "bucketId": bucket_id,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=body)
            resp.raise_for_status()
            return resp.json()

    async def send_teams_message(self, team_id: str, channel_id: str, message: str) -> dict:
        token = await self._get_token()
        url = f"{GRAPH_API_BASE}/teams/{team_id}/channels/{channel_id}/messages"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        body = {"body": {"content": message}}
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=body)
            resp.raise_for_status()
            return resp.json()

    async def create_calendar_event(
        self,
        user_id: str,
        subject: str,
        start_iso: str,
        end_iso: str,
        body: str = "",
        timezone: str = "UTC",
    ) -> dict:
        """Create an Outlook calendar event (deadline reminder) for a task via
        Microsoft Graph. user_id is the target mailbox (UPN or object id),
        required for app-only auth."""
        token = await self._get_token()
        url = f"{GRAPH_API_BASE}/users/{user_id}/events"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        event = {
            "subject": subject,
            "body": {"contentType": "HTML", "content": body},
            "start": {"dateTime": start_iso, "timeZone": timezone},
            "end": {"dateTime": end_iso, "timeZone": timezone},
            "isReminderOn": True,
            "reminderMinutesBeforeStart": 60,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=event)
            resp.raise_for_status()
            return resp.json()

    async def create_planner_plan(self, title: str, owner_group_id: str) -> dict:
        token = await self._get_token()
        url = f"{GRAPH_API_BASE}/planner/plans"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        body = {
            "title": title,
            "owner": owner_group_id,
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=body)
            resp.raise_for_status()
            return resp.json()


graph_client = MicrosoftGraphClient()
