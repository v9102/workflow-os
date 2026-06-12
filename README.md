# WorkflowOS

> **AI Operating System for Teams** — Transform meeting transcripts into actionable execution plans using a swarm of AI agents.

[![CI](https://github.com/v9102/workflow-os/actions/workflows/ci.yml/badge.svg)](https://github.com/v9102/workflow-os/actions/workflows/ci.yml)
[![Deploy](https://github.com/v9102/workflow-os/actions/workflows/deploy.yml/badge.svg)](https://github.com/v9102/workflow-os/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-blue)
![Next.js 14](https://img.shields.io/badge/Next.js-14-black)
![Status](https://img.shields.io/badge/Status-Production Ready-brightgreen)

```
Transcript → [Extraction → Risk → Assignment → Reporting → Validation] → Dashboard → Planner/Teams
```

---

## Table of Contents

- [Project Overview](#project-overview)
- [What Problem Does It Solve?](#what-problem-does-it-solve)
- [Current Stage](#current-stage)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Configuration](#configuration)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Azure Deployment](#azure-deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

WorkflowOS converts any meeting transcript into a structured, actionable team plan automatically. A swarm of 5 specialized AI agents processes the input in sequence, each adding a layer of intelligence before delivering a unified dashboard with tasks, owners, risk scores, dependencies, and a shared timeline.

**Key differentiator:** Most tools summarize meetings. WorkflowOS *executes* — pushing tasks to Microsoft Planner, notifying teams via Microsoft Teams, and checking for cross-meeting conflicts.

Built for the **Microsoft Build AI Hackathon 2026** — Agent Swarms Track.

### What Problem Does It Solve?

Teams waste countless hours manually converting meeting notes into structured action items, tracking deadlines, assigning owners, and monitoring risks. WorkflowOS eliminates this overhead by:

- **Automating task extraction** from natural-language meeting transcripts
- **Identifying owners** and deadlines automatically using AI context analysis
- **Flagging risks** across tasks and dependencies in real time
- **Generating execution dashboards** with timelines, heatmaps, and dependency graphs
- **Integrating with Microsoft 365** to push tasks directly to Planner and Teams

---

## Current Stage

**Production Ready — All 47 Features Implemented**

| Category | Status |
|----------|--------|
| Agent Pipeline (Extraction → Risk → Assignment → Reporting → Validation) | ✅ Complete |
| Real-time SSE Agent Feed | ✅ Complete |
| Execution Dashboard (Tasks, Timeline, Risk Heatmap, Dependencies) | ✅ Complete |
| Dark Mode & Theme System | ✅ Complete |
| Preset Transcripts for Quick Demo | ✅ Complete |
| History & Local Storage Persistence | ✅ Complete |
| Microsoft 365 Integration (Planner, Teams) | ✅ Complete |
| Cosmos DB Session Persistence | ✅ Complete |
| Redis Caching | ✅ Complete |
| Service Bus Feedback Queue | ✅ Complete |
| Webhook Notifications | ✅ Complete |
| Audit Logging | ✅ Complete |
| Rate Limiting Middleware | ✅ Complete |
| Docker Compose Local Dev | ✅ Complete |
| Azure Container Apps Deployment | ✅ Complete |
| GitHub Actions CI/CD | ✅ Complete |
| Bicep Infrastructure as Code | ✅ Complete |
| Input Validation & Sanitization | ✅ Complete |
| Retry & Error Recovery | ✅ Complete |
| Feedback Loops Between Agents | ✅ Complete |

See [FINAL_SUMMARY.md](./FINAL_SUMMARY.md) and [DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md) for detailed progress tracking.

---

## Features

- **5-Agent Swarm:** Extraction → Risk → Assignment → Reporting → Validation with feedback loops and correction passes
- **Live Agent Feed:** Watch all 5 agents process in real time via Server-Sent Events
- **Execution Dashboard:** Task table with search, risk heatmap, dependency graph, and operational timeline
- **Microsoft 365 Integration:** Push to Planner, share to Teams, export as Markdown
- **Feedback Loops:** Agents can request reprocessing from upstream agents via the orchestrator (e.g., Assignment triggers Extraction to re-scan for missing deadlines)
- **Dynamic DAG:** Pipeline adapts based on transcript length and speaker count
- **Dark Mode:** Full theme support with persistent preference
- **Design System:** Warm, editorial aesthetic with Playfair Display typography and monochrome palette
- **Persistent State:** Cosmos DB-backed session memory with in-memory fallback
- **Audit Logging:** Full audit trail for every pipeline execution
- **Rate Limiting:** Configurable per-minute rate limiting
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
| **Validator** | Cross-check owners, deadlines, risk scores | Dashboard | Validation issues |

### Swarm Dynamics

```
                    ┌──────────────────────────────────────────┐
                    │              Orchestrator                │
                    │  Lifecycle · State · Retry · Re-routing │
                    └──┬─────────┬─────────┬─────────┬─────────┘
                       │         │         │         │
                       ▼         ▼         ▼         ▼
                 ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
                 │Extraction│ │  Risk   │ │Assignment│ │  Valid. │
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
| **Backend** | Python FastAPI + Uvicorn | Async agent runtime |
| **LLM** | Azure OpenAI GPT-4o | Powers all 5 agents |
| **Frontend** | Next.js 14 + Tailwind CSS | Real-time dashboard with dark mode |
| **Design** | Playfair Display + Inter | Editorial typography system |
| **Animation** | Motion (Framer Motion) | Smooth UI transitions |
| **Icons** | Lucide React | Consistent iconography |
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

# Run with coverage
pip install pytest-cov
python -m pytest tests/ --cov=backend -v
```

The test suite includes schema validation, database persistence, and API endpoint tests.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check (version, schema, env status) |
| `POST` | `/api/transcript/process` | Submit transcript for processing |
| `POST` | `/api/retry` | Retry a failed session |
| `GET` | `/api/dashboard/{session_id}` | Get dashboard results |
| `GET` | `/api/activities/{session_id}` | Get agent activity log |
| `GET` | `/api/activities/{session_id}/stream` | SSE stream of real-time agent activity |
| `GET` | `/api/status/{session_id}` | Get session status |
| `GET` | `/api/audit/{session_id}` | Get audit log for a session |
| `GET` | `/api/sessions` | List all sessions |
| `POST` | `/api/export/planner` | Push tasks to Microsoft Planner |
| `POST` | `/api/export/teams` | Send summary to Microsoft Teams |
| `POST` | `/api/export/pdf` | Download report as Markdown |

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
│   │   ├── validator.py        # Validator Agent — cross-check completeness
│   │   ├── orchestrator.py     # Orchestrator — lifecycle, retry, routing
│   │   └── llm.py              # Shared LLM client utilities
│   ├── schemas/
│   │   └── models.py           # Pydantic data models
│   ├── main.py                 # FastAPI application entry point
│   ├── db.py                   # Cosmos DB / in-memory session store + audit
│   ├── cache.py                # Redis caching layer
│   ├── feedback.py             # Service Bus feedback queue
│   ├── m365.py                 # Microsoft Graph API client
│   ├── webhooks.py             # Webhook notification service
│   ├── audit.py                # Audit logging (file + DB)
│   ├── middleware.py           # Rate limiting middleware
│   ├── validation.py           # Input sanitization & validation
│   ├── utils.py                # Retry, logging, timer utilities
│   ├── Dockerfile              # Backend container image
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Main application page
│   │   ├── layout.tsx          # Root layout and metadata
│   │   └── globals.css         # Global styles with Playfair Display + Inter
│   ├── lib/
│   │   ├── types.ts            # TypeScript type definitions
│   │   └── data.ts             # Preset transcript data for demos
│   ├── hooks/
│   │   ├── useSSE.ts           # SSE real-time connection hook
│   │   └── useKeyboardShortcuts.ts # Keyboard shortcut hook
│   ├── components/
│   │   ├── Header.tsx          # Navigation header with dark mode toggle
│   │   ├── Footer.tsx          # Application footer with links
│   │   ├── TranscriptInput.tsx # Transcript input with preset selection
│   │   ├── AgentFeed.tsx       # Agent swarm activity panel
│   │   ├── ExecutionDashboard.tsx # Full dashboard with tasks, timeline, risks
│   │   ├── DependencyGraph.tsx # Task dependency visualization
│   │   └── Toast.tsx           # Toast notification system
│   ├── .eslintrc.json          # ESLint configuration
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
├── ARCHITECTURE.md             # Detailed architecture documentation
├── FINAL_SUMMARY.md            # Complete feature checklist
└── DEMO_WALKTHROUGH.md         # Step-by-step demo guide
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
1. Runs linting and tests via CI
2. Builds Docker images for backend and frontend
3. Pushes images to Azure Container Registry
4. Deploys both services to Azure Container Apps

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
- Run `npm run build` to verify the frontend compiles
- Add tests for new functionality
- Update documentation for API changes

---

## License

MIT — Built for Microsoft Build AI Hackathon 2026 · Agent Swarms Track

---

*WorkflowOS — From Transcript to Execution in Seconds.*
