# WorkflowOS

> **AI Operating System for Teams** — Transform meeting transcripts into actionable execution plans using a swarm of AI agents, powered by Azure OpenAI on Azure AI Foundry.

![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue)
![Next.js 14](https://img.shields.io/badge/Next.js-14-black)
![Azure OpenAI](https://img.shields.io/badge/Azure%20OpenAI-GPT--4o-0078D4)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

```
Transcript → [Extraction → Risk → Assignment → Reporting → Validation] → Dashboard → Planner / Teams
```

**Live deployment**

| Surface | URL |
|---------|-----|
| Frontend (Vercel) | https://workflowos-seven.vercel.app |
| Backend API (Azure App Service) | https://workflowos-api.azurewebsites.net |
| API docs (Swagger) | https://workflowos-api.azurewebsites.net/docs |
| Health check | https://workflowos-api.azurewebsites.net/api/health |

Built for the **Microsoft Build AI Hackathon 2026 — Agent Swarms Track**.

---

## Table of Contents

- [Overview](#overview)
- [Microsoft Azure & AI Foundry Tools Used](#microsoft-azure--ai-foundry-tools-used)
- [Architecture](#architecture)
- [Agent Swarm](#agent-swarm)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [License](#license)

---

## Overview

WorkflowOS converts any meeting transcript into a structured, actionable team plan automatically. A swarm of five specialized AI agents — orchestrated dynamically — processes the input, each adding a layer of intelligence before delivering a unified dashboard with tasks, owners, risk scores, dependencies, and a shared timeline.

**Key differentiator:** most tools *summarize* meetings. WorkflowOS *executes* — pushing tasks to Microsoft Planner, posting summaries to Microsoft Teams, and validating the plan for gaps before you act on it.

### What problem it solves

Teams waste hours turning meeting notes into structured action items, tracking deadlines, assigning owners, and watching for risk. WorkflowOS eliminates that overhead by:

- **Extracting tasks** from natural-language transcripts
- **Assigning owners** and deadlines from conversational context
- **Scoring risk** across tasks and dependencies
- **Generating an execution dashboard** with timeline, heatmap, and dependency graph
- **Pushing to Microsoft 365** (Planner tasks, Teams messages)

---

## Microsoft Azure & AI Foundry Tools Used

This project is built end-to-end on the Microsoft cloud. The table below is the authoritative list of Microsoft technologies in the codebase, and whether each is **required** to run or an **optional** integration that degrades gracefully when not configured.

| Microsoft technology | Where it's used | Role in WorkflowOS | Status |
|----------------------|-----------------|--------------------|--------|
| **Azure OpenAI Service (GPT-4o)** — the model layer of **Azure AI Foundry** | `backend/agents/*.py`, `backend/agents/llm.py` | The reasoning engine behind all five agents. Each agent calls a GPT-4o deployment via the Azure OpenAI SDK (`AzureOpenAI` / `AsyncAzureOpenAI`) with JSON-mode structured output. | **Required** |
| **Azure App Service (Linux, Python 3.11)** | Hosts the FastAPI backend | The live production API host (`workflowos-api.azurewebsites.net`). Build via Oryx, deploy via GitHub Actions `azure/webapps-deploy`. | **Live (backend host)** |
| **Azure Cosmos DB** (NoSQL) | `backend/db.py` | Persistent swarm memory — session state and audit entries. Falls back to an in-memory store when no connection string is set. | Optional |
| **Azure Service Bus** | `backend/feedback.py` | Async feedback queue for agent-to-agent reprocessing signals routed through the orchestrator. No-ops when unconfigured. | Optional |
| **Azure Cache for Redis** | `backend/cache.py` | Response caching / rate-limit backing. Falls back silently when unavailable. | Optional |
| **Microsoft Graph API** (Planner + Teams) | `backend/m365.py` | Pushes tasks to **Microsoft Planner** and posts summaries to **Microsoft Teams** channels. | Optional |
| **Microsoft Entra ID** (Azure AD, OAuth 2.0 client-credentials) | `backend/m365.py` | Issues the Graph API access token (`login.microsoftonline.com` token endpoint). | Optional |
| **Azure Container Registry + Azure Container Apps** | `infra/` (Bicep) | Reference container-based deployment target provisioned by the IaC templates. | IaC (reference) |
| **Azure Bicep** (Infrastructure as Code) | `infra/main.bicep`, `infra/modules/` | Declarative provisioning of Cosmos DB, ACR, Container Apps, and Service Bus. | IaC |

### A note on Azure AI Foundry

The agents run on **GPT-4o served through Azure OpenAI**, which is the foundation-model layer of **Azure AI Foundry**. The orchestration, dynamic routing, feedback loops, and validation sidecar are implemented in application code (`backend/agents/orchestrator.py`) on top of those Foundry model deployments, rather than via the Foundry Agent Service — so the swarm logic is fully transparent and portable. To point the app at a Foundry-hosted deployment, set `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_DEPLOYMENT` to your Foundry project's deployment.

### Deployment-architecture note

The Bicep templates in `infra/` describe a fully containerized **Azure Container Apps** topology (the reference architecture). The **current live deployment** runs the backend on **Azure App Service** and the frontend on **Vercel** — see [Deployment](#deployment). Both are valid; the App Service + Vercel path is what is wired up and verified end-to-end today.

---

## Architecture

```
                    ┌──────────────┐
                    │  Transcript  │
                    └──────┬───────┘
                           ▼
┌──────────────────────────────────────────────┐
│                Orchestrator                   │
│   Dynamic DAG · State · Retry · Feedback      │
│  ┌──────────┐  ┌──────┐  ┌──────────┐         │
│  │Extraction│─▶│ Risk │─▶│Assignment│         │
│  └──────────┘  └──────┘  └──────────┘         │
│        ▲           │            │             │
│        └── feedback ┘           ▼             │
│  ┌──────────┐          ┌──────────┐           │
│  │Validator │◀─────────│Reporting │           │
│  └──────────┘          └──────────┘           │
└───────────────┬──────────────────┬───────────┘
                │                   │
       Azure OpenAI (GPT-4o)   Cosmos DB · Service Bus · Redis
                │                   │
                ▼                   ▼
         ┌──────────┐        ┌─────────────────┐
         │ Dashboard │        │ Planner / Teams │
         │   (UI)   │        │ (Microsoft Graph)│
         └──────────┘        └─────────────────┘
```

Each agent is stateless; all state lives in the orchestrator (and Cosmos DB in production). Agents never call each other directly — feedback requests are routed through the orchestrator. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full swarm-dynamics writeup.

---

## Agent Swarm

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| **Orchestrator** | Lifecycle, dynamic routing, retry, feedback handling | Raw transcript | Final dashboard |
| **Extraction** | Extract action items, decisions, deadlines, dependencies | Transcript | Task graph |
| **Risk** | Score tasks High / Medium / Low by urgency + dependencies | Task graph | Risk-scored tasks |
| **Assignment** | Map tasks to owners from conversational context | Risk-scored tasks | Owner-mapped tasks |
| **Reporting** | Build dashboard payload with summary and timeline | Owner-mapped tasks | Dashboard |
| **Validator** | Cross-check owners, deadlines, and risk scores | Dashboard | Validation issues |

**Swarm behaviors (not a fixed pipeline):**

- **Dynamic routing** — short or single-speaker transcripts skip the Risk and/or Assignment agents (`SHORT_TRANSCRIPT_WORDS = 100`).
- **Feedback loops** — when tasks lack deadlines, Risk asks Extraction to re-scan with a context hint for implicit time references ("ASAP", "end of sprint").
- **Validation sidecar + correction pass** — the Validator flags unowned tasks / missing scores, and the orchestrator re-runs only the affected agent rather than the whole pipeline.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **AI / LLM** | Azure OpenAI GPT-4o (Azure AI Foundry model layer) |
| **Backend** | Python 3.11, FastAPI, Uvicorn/Gunicorn, Pydantic |
| **Frontend** | Next.js 14, Tailwind CSS, Lucide icons, SSE live feed |
| **Persistence** | Azure Cosmos DB (in-memory fallback) |
| **Cache / Queue** | Azure Cache for Redis · Azure Service Bus |
| **M365** | Microsoft Graph API (Planner, Teams) · Microsoft Entra ID |
| **Hosting** | Azure App Service (API) · Vercel (frontend) |
| **IaC / CI/CD** | Azure Bicep · GitHub Actions |

---

## Local Setup

### Prerequisites
- **Python 3.11+** and **Node.js 20+**
- An **Azure OpenAI** resource with a **GPT-4o** deployment (required; everything else is optional)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set at minimum AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API at `http://localhost:8000`, Swagger at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
# Point the frontend at your backend:
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

UI at `http://localhost:3000`.

### 3. Verify

```bash
curl http://localhost:8000/api/health
curl -X POST http://localhost:8000/api/transcript/process \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Alice: Finish the API by Friday.\nBob: I will review the PR."}'
```

### Docker (alternative)

```bash
docker compose up -d   # backend + frontend + Redis
```

---

## Configuration

All backend config is via environment variables (`backend/.env`). Only the first two are required.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_OPENAI_API_KEY` | ✅ | — | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | ✅ | — | Azure OpenAI / Foundry endpoint URL |
| `AZURE_OPENAI_DEPLOYMENT` | ❌ | `gpt-4o` | Model deployment name |
| `AZURE_OPENAI_API_VERSION` | ❌ | `2024-02-15-preview` | API version |
| `COSMOS_DB_CONNECTION_STRING` | ❌ | — | Cosmos DB (falls back to in-memory) |
| `SERVICEBUS_CONNECTION_STRING` | ❌ | — | Service Bus feedback queue |
| `REDIS_URL` | ❌ | `redis://localhost:6379/0` | Redis cache |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` / `MICROSOFT_TENANT_ID` | ❌ | — | Entra ID app for Microsoft Graph (Planner/Teams) |
| `ALLOWED_ORIGINS` | ❌ | `localhost:3000,3001` | CORS origins (must include your frontend URL) |
| `RATE_LIMIT_PER_MINUTE` | ❌ | `60` | Per-IP rate limit |

Frontend: `NEXT_PUBLIC_API_URL` (build-time) points the UI at the backend.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check (version, schema, env status) |
| `POST` | `/api/transcript/process` | Submit a transcript for processing |
| `POST` | `/api/retry` | Retry a failed session |
| `GET` | `/api/dashboard/{session_id}` | Get dashboard results |
| `GET` | `/api/activities/{session_id}` | Get the agent activity log |
| `GET` | `/api/activities/{session_id}/stream` | SSE stream of real-time agent activity |
| `GET` | `/api/status/{session_id}` | Session status |
| `GET` | `/api/audit/{session_id}` | Audit log for a session |
| `GET` | `/api/sessions` | List all sessions |
| `POST` | `/api/export/planner` | Push tasks to Microsoft Planner |
| `POST` | `/api/export/teams` | Post a summary to Microsoft Teams |
| `POST` | `/api/export/pdf` | Export the report as Markdown |

Interactive docs: https://workflowos-api.azurewebsites.net/docs

---

## Deployment

### Backend → Azure App Service

The backend deploys automatically via **GitHub Actions** ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) on every push to `main`:

1. Clears the previous Oryx build tarball from `wwwroot` (Kudu VFS, `If-Match` header) so stale code can't be re-extracted.
2. Deploys the `backend/` package with `azure/webapps-deploy@v2`.
3. Oryx builds and runs `python -m uvicorn main:app` on Azure App Service.

App: `workflowos-api` · runtime `PYTHON|3.11`. The `AZURE_OPENAI_*` keys and `ALLOWED_ORIGINS` are set as App Service application settings (changing them requires an app restart).

### Frontend → Vercel

The frontend is a **Vercel** project connected to this repo (production branch `main`, **Root Directory `frontend`**). `NEXT_PUBLIC_API_URL` is set to the Azure API URL and inlined at build time. Pushes to `main` trigger an automatic redeploy.

### Infrastructure as Code (reference) → Azure Bicep

```bash
az deployment sub create \
  --location eastus \
  --template-file infra/main.bicep \
  --parameters environmentName=workflowos
```

Provisions Cosmos DB, Azure Container Registry, Azure Container Apps, and Service Bus — the fully containerized reference topology.

---

## Project Structure

```
workflowos/
├── backend/
│   ├── agents/
│   │   ├── extraction.py       # Extraction Agent (Azure OpenAI GPT-4o)
│   │   ├── risk.py             # Risk Agent
│   │   ├── assignment.py       # Assignment Agent
│   │   ├── reporting.py        # Reporting Agent
│   │   ├── validator.py        # Validator Agent
│   │   ├── orchestrator.py     # Dynamic DAG, feedback loops, retry
│   │   └── llm.py              # Azure OpenAI client factory
│   ├── schemas/models.py       # Pydantic contracts
│   ├── main.py                 # FastAPI app + SSE + export endpoints
│   ├── db.py                   # Azure Cosmos DB / in-memory store + audit
│   ├── cache.py                # Azure Cache for Redis
│   ├── feedback.py             # Azure Service Bus feedback queue
│   ├── m365.py                 # Microsoft Graph (Planner/Teams) + Entra ID
│   ├── webhooks.py · audit.py · middleware.py · validation.py · utils.py
│   └── requirements.txt
├── frontend/                   # Next.js 14 app (deployed to Vercel)
│   ├── app/ · components/ · hooks/ · lib/
├── infra/                      # Azure Bicep IaC (Cosmos, ACR, ACA, Service Bus)
│   ├── main.bicep
│   └── modules/
├── tests/                      # pytest: schemas, db
├── .github/workflows/          # ci.yml, deploy.yml (Azure App Service)
├── docker-compose.yml
├── ARCHITECTURE.md             # Swarm dynamics deep-dive
└── README.md
```

---

## Testing

```bash
python -m pytest tests/ -v
```

Covers schema validation and the session/audit persistence layer.

---

## License

MIT — Built for **Microsoft Build AI Hackathon 2026 · Agent Swarms Track**.

---

*WorkflowOS — From Transcript to Execution in Seconds, on Azure.*
