# WorkflowOS

Transform meeting transcripts into actionable execution plans using AI agent swarms.

```
Transcript → [Extraction → Risk → Assignment → Reporting] → Dashboard → Planner/Teams
```

## Quick Start

### Prerequisites
- Python 3.12+, Node.js 20+
- Azure OpenAI API key (GPT-4o deployment)

### Backend
```bash
cd backend
cp .env.example .env  # Add your Azure OpenAI key
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000, paste a transcript, and click "Process."

### Docker
```bash
docker compose up -d
```

## Architecture

5 specialized agents orchestrated in a feedback-driven swarm:

| Agent | Role |
|-------|------|
| **Extraction** | Extract action items, decisions, deadlines from transcript |
| **Risk** | Score tasks High/Med/Low by urgency, dependencies, emphasis |
| **Assignment** | Map tasks to team members by context and mentions |
| **Reporting** | Generate dashboard payload with timeline and summary |
| **Validator** | Cross-check owners, deadlines, risk scores |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details.

## Azure Deployment

```bash
az deployment sub create --location eastus --template-file infra/main.bicep
```

See [BUILD_PLAN.md](./BUILD_PLAN.md) for the full build plan.

## Project Structure

```
workflowos/
├── backend/
│   ├── agents/          # Agent implementations
│   ├── schemas/         # Pydantic models
│   ├── main.py          # FastAPI app
│   ├── db.py            # Cosmos DB / in-memory store
│   ├── cache.py         # Redis caching
│   ├── feedback.py      # Service Bus queue
│   ├── m365.py          # Microsoft Graph API client
│   └── utils.py         # Retry, logging, timer
├── frontend/
│   ├── app/             # Next.js pages
│   └── components/      # React components
├── infra/               # Bicep templates
├── tests/               # Pytest suite
└── docker-compose.yml
```

## Testing

```bash
python -m pytest tests/ -v
```

## License

MIT — Built for Microsoft Build AI Hackathon 2026
