# WorkflowOS

> **AI Operating System for Teams** — Transform meeting transcripts into actionable execution plans using a swarm of AI agents.

[![CI](https://github.com/v9102/workflow-os/actions/workflows/ci.yml/badge.svg)](https://github.com/v9102/workflow-os/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-blue)
![Next.js 14](https://img.shields.io/badge/Next.js-14-black)

```
Transcript → [Extraction → Risk → Assignment → Reporting] → Dashboard → Planner/Teams
```

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Docker](#docker)
- [Configuration](#configuration)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Azure Deployment](#azure-deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

WorkflowOS converts any meeting transcript into a structured, actionable team plan automatically. A swarm of 5 specialized AI agents processes the input in sequence, each adding a layer of intelligence before delivering a unified dashboard with tasks, owners, risk scores, dependencies, and a shared timeline.

**Key differentiator:** Most tools summarize meetings. WorkflowOS *executes* — pushing tasks to Microsoft Planner, notifying teams via Microsoft Teams, and checking for cross-meeting conflicts.

Built for the **Microsoft Build AI Hackathon 2026** — Agent Swarms Track.

---

## Features

- **5-Agent Swarm:** Extraction → Risk → Assignment → Reporting → Validation with feedback loops
- **Live Agent Feed:** Watch all 5 agents process in real time
- **Execution Dashboard:** Task table, risk heatmap, Gantt-style timeline
- **Microsoft 365 Integration:** Push to Planner, share to Teams, export as Markdown
- **Feedback Loops:** Agents can request reprocessing from upstream agents via the orchestrator
- **Dynamic DAG:** Pipeline adapts based on transcript length and speaker count
- **Persistent State:** Cosmos DB-backed session memory with Redis caching
- **Containerized:** Docker Compose for local dev, Azure Container Apps for production

---

## Architecture

### Agent Swarm

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| **Orchestrator** | Lifecycle, routing, retry, state management | Raw transcript | Final dashboard |
| **Extraction** | Extract action items, decisions, deadlines | Transcript | Task graph |
| **Risk** | Score tasks High/Med/Low by urgency and dependencies | Task graph | Risk-scored tasks |
| **Assignment** | Map tasks to team members by context | Risk-scored tasks | Owner-mapped tasks |
| **Reporting** | Generate dashboard payload with timeline and summary | Owner-mapped tasks | Dashboard payload |

### Swarm Dynamics

```
                    ┌──────────────────────────────────────────┐
                    │              Orchestrator                │
                    │  Lifecycle · State · Retry · Re-routing │
                    └──┬─────────┬─────────┬─────────┬─────────┘
                       │         │         │         │
                       ▼         ▼         ▼         ▼
                 ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
                 │Extraction│ │  Risk   │ │Assignment│ │Reporting│
                 └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
                      │            │            │            │
                      └──────┬─────┴────────────┴────────────┘
                             │
                    ┌────────▼────────┐
                    │   Dashboard     │
                    └─────────────────┘
```

Feedback loops allow agents to request reprocessing (e.g., Assignment signals Extraction to re-scan for missing owners). See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Python FastAPI | Async agent runtime |
| **LLM** | Azure OpenAI GPT-4o | Powers all 5 agents |
| **Frontend** | Next.js 14 + Tailwind CSS | Real-time dashboard |
| **Database** | Azure Cosmos DB | Swarm memory, session persistence |
| **Cache** | Redis | Response caching, rate limiting |
| **Queue** | Azure Service Bus | Async feedback between agents |
| **Container** | Docker + Azure Container Apps | Isolated, scalable agents |
| **CI/CD** | GitHub Actions | Test, lint, build, deploy |
| **Infrastructure** | Bicep | Infrastructure as Code |
| **Auth** | Microsoft Entra ID (optional) | OAuth 2.0 for M365 APIs |

---

## Prerequisites

- **Python 3.12+** and **Node.js 20+**
- **Azure OpenAI** resource with GPT-4o deployment
- **Azure Cosmos DB** (optional — falls back to in-memory store)
- **Microsoft 365** developer tenant (optional — for Planner/Teams integration)

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/v9102/workflow-os.git
cd workflow-os
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Azure OpenAI API key and endpoint
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:3000`.

### 4. Verify

```bash
# Health check
curl http://localhost:8000/api/health

# Process a sample transcript
curl -X POST http://localhost:8000/api/transcript/process \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Alice: Complete the API by Friday.\nBob: I will review the PR."}'
```

### Docker (Alternative)

```bash
docker compose up -d
```

This starts backend, frontend, and Redis. Access the app at `http://localhost:3000`.

---

## Configuration

All configuration is via environment variables in `backend/.env`:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AZURE_OPENAI_API_KEY` | ✅ | — | Your Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | ✅ | — | Azure OpenAI endpoint URL |
| `AZURE_OPENAI_API_VERSION` | ❌ | `2024-02-15-preview` | API version |
| `AZURE_OPENAI_DEPLOYMENT` | ❌ | `gpt-4o` | Model deployment name |
| `COSMOS_DB_CONNECTION_STRING` | ❌ | — | Cosmos DB connection string (falls back to in-memory) |
| `REDIS_URL` | ❌ | `redis://localhost:6379/0` | Redis connection (optional) |
| `SERVICEBUS_CONNECTION_STRING` | ❌ | — | Service Bus connection (optional) |
| `MICROSOFT_CLIENT_ID` | ❌ | — | Microsoft Entra ID app ID |
| `LOG_LEVEL` | ❌ | `INFO` | Logging level (`DEBUG`, `INFO`, `WARN`, `ERROR`) |

---

## Testing

```bash
# From the project root
python -m pytest tests/ -v

# Run with coverage (if installed)
pip install pytest-cov
python -m pytest tests/ --cov=backend -v
```

The test suite includes:
- **Schema validation tests** — Pydantic model defaults, enums, and serialization
- **Database tests** — In-memory session persistence (save, get, delete, update)
- **API tests** — Health check, input validation (requires running backend)

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/transcript/process` | Submit transcript for processing |
| `GET` | `/api/dashboard/{session_id}` | Get dashboard results |
| `GET` | `/api/activities/{session_id}` | Get agent activity log |
| `GET` | `/api/activities/{session_id}/stream` | SSE stream of agent activity |
| `GET` | `/api/status/{session_id}` | Get session status |
| `POST` | `/api/export/planner` | Push tasks to Microsoft Planner |
| `POST` | `/api/export/teams` | Send summary to Microsoft Teams |

Full interactive docs at `http://localhost:8000/docs` when the backend is running.

---

## Project Structure

```
workflowos/
├── backend/
│   ├── agents/
│   │   ├── extraction.py       # Extraction Agent — parse transcript into tasks
│   │   ├── risk.py             # Risk Agent — score tasks High/Med/Low
│   │   ├── assignment.py       # Assignment Agent — map tasks to owners
│   │   ├── reporting.py        # Reporting Agent — generate dashboard
│   │   └── orchestrator.py     # Orchestrator — lifecycle, retry, routing
│   ├── schemas/
│   │   └── models.py           # Pydantic data models
│   ├── main.py                 # FastAPI application entry point
│   ├── db.py                   # Cosmos DB / in-memory session store
│   ├── cache.py                # Redis caching layer
│   ├── feedback.py             # Service Bus feedback queue
│   ├── m365.py                 # Microsoft Graph API client
│   ├── utils.py                # Retry, logging, timer utilities
│   ├── Dockerfile              # Backend container image
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Main application page
│   │   ├── layout.tsx          # Root layout and metadata
│   │   └── globals.css         # Global styles and Tailwind
│   ├── components/
│   │   ├── TranscriptInput.tsx  # Transcript paste/upload widget
│   │   ├── AgentFeed.tsx        # Real-time agent activity feed
│   │   ├── ExecutionDashboard.tsx # Dashboard with timeline, heatmap
│   │   ├── Header.tsx           # Application header
│   │   └── Footer.tsx           # Application footer
│   ├── Dockerfile              # Frontend container image
│   └── package.json            # Node dependencies
├── infra/
│   ├── main.bicep              # Azure infrastructure orchestrator
│   └── modules/                # Bicep modules (Cosmos DB, ACR, ACA, SB)
├── tests/
│   ├── test_db.py              # Database persistence tests
│   ├── test_schemas.py         # Schema validation tests
│   └── conftest.py             # Shared test fixtures
├── .github/workflows/
│   ├── ci.yml                  # CI: test + lint on PR/push
│   └── deploy.yml              # CD: build + deploy to Azure
├── docker-compose.yml          # Local development orchestration
├── pyproject.toml              # Python project metadata
└── PROGRESS.md                 # Project completion tracker
```

---

## Azure Deployment

### Prerequisites
- Azure CLI installed and logged in
- Azure subscription with permissions to create resources

### Deploy Infrastructure

```bash
az deployment sub create \
  --location eastus \
  --template-file infra/main.bicep \
  --parameters environmentName=workflowos
```

### Deploy Application (CI/CD)

Push to the `main` branch triggers the [deploy workflow](.github/workflows/deploy.yml), which:
1. Builds Docker images for backend and frontend
2. Pushes images to Azure Container Registry
3. Deploys to Azure Container Apps

### Manual Docker Build & Push

```bash
az acr login --name workflowosacr
docker build -f backend/Dockerfile -t workflowosacr.azurecr.io/workflowos-backend:latest .
docker push workflowosacr.azurecr.io/workflowos-backend:latest
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Run `ruff check .` before committing Python changes
- Run `npm run lint` before committing frontend changes
- Add tests for new functionality
- Update documentation for API changes

---

## License

MIT — Built for Microsoft Build AI Hackathon 2026 · Agent Swarms Track

---

## Team

- **Team Member 1** — AI / Backend (Agent architecture, prompt engineering, Azure OpenAI)
- **Team Member 2** — Frontend (Next.js, dashboard design, real-time agent feed)
- **Team Member 3** — Architecture & Integration (Azure AI Foundry, pipeline design, JSON schema)

---

*WorkflowOS — From Transcript to Execution in Seconds.*
