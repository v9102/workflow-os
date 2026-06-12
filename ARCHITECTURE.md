# WorkflowOS Architecture — Agent Swarm Dynamics

## How This Is a True Swarm (Not Just a Pipeline)

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

### 1. Feedback Loops (Swarm Behavior #1)
Agents can request **reprocessing** from upstream agents via the Orchestrator:

- **Assignment → Extraction**: If an owner mention is ambiguous, Assignment signals Extraction to re-scan with a context hint (e.g., "look for role-based mentions, not just names").
- **Risk → Extraction**: If a task has no deadline, Risk asks Extraction to re-check the transcript for implicit time references ("ASAP", "end of sprint").
- **Reporting → All**: If the final dashboard has gaps (unowned tasks, unscored risks), Reporting kicks off a correction pass.

The Orchestrator tracks state and routes these feedback requests — no agent calls another directly.

### 2. Dynamic Re-Routing (Swarm Behavior #2)
The Orchestrator doesn't follow a fixed DAG. Based on transcript content, it dynamically decides:

- **Short transcript (~100 words)**: Skip Assignment agent (no owner info available), flag tasks as "unassigned" and let a human pick them up.
- **Single-speaker transcript (e.g., a memo)**: Skip Risk and Assignment entirely. Go straight to Reporting.
- **Multi-meeting context**: If the transcript references past meetings, the Orchestrator queries the shared state (Cosmos DB) for context and routes that data alongside the transcript to each agent — agents collaborate across sessions.

### 3. Parallel Validation Sidecar (Swarm Behavior #3)
After the main pipeline completes, the Orchestrator spins up a **Validator Agent** *in parallel* that:

- Cross-checks all owners exist in the team roster
- Detects conflicting deadlines (same person, two tasks due same day)
- Flags tasks with no risk score
- Feeds results back to the Orchestrator for a targeted correction pass (doesn't re-run full pipeline — just the affected agent)

### 4. Emergent Coordination Across Transcripts (Swarm Behavior #4)
With multiple transcripts ingested:

- The **Risk Agent** scans *all* active task graphs across meetings to detect cross-meeting conflicts
- The **Assignment Agent** balances workload: if Person A is overloaded across 3 meetings, it routes new tasks to Person B
- Agents share memory via Cosmos DB — this is where swarm intelligence emerges (the whole > sum of parts)

### Agent Communication Model

```
┌──────────────────────────────────────────┐
│              Orchestrator                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  State  │  │  Queue  │  │ Retry   │  │
│  │  Store  │  │  Mgr    │  │ Handler │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  │
│       │            │            │        │
│  ┌────▼────────────▼────────────▼────┐  │
│  │         Router Engine             │  │
│  │  Dynamic DAG + Feedback Handler   │  │
│  └───────────────────────────────────┘  │
└──────────────────────────────────────────┘
          │                    ▲
          │ Routes to agents  │ Feedback / Retry requests
          ▼                    │
    ┌────────────────────────────────────┐
    │  Agent Pool (containerized)       │
    │  ┌──────────┐ ┌──────────┐       │
    │  │Extraction│ │   Risk   │ ...    │
    │  └──────────┘ └──────────┘       │
    │  Each agent is stateless;         │
    │  all state lives in Orchestrator  │
    └────────────────────────────────────┘
```

### Summary

| Aspect | Simple Pipeline | WorkflowOS Swarm |
|--------|----------------|------------------|
| Flow | Fixed A → B → C | Dynamic DAG + feedback loops |
| Agent interaction | None (one-way) | Via Orchestrator (request reprocess) |
| Error handling | Fail & stop | Retry + re-route + sidecar validation |
| Cross-meeting | None | Shared memory via Cosmos DB |
| Adaptivity | Same path every time | Shortens/skips agents based on input |
