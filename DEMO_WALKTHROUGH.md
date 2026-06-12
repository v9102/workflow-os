# WorkflowOS — Step-by-Step Demo Walkthrough

> A plain-language guide for everyone
> *No technical knowledge required*

---

## What Is WorkflowOS?

WorkflowOS is an **AI-powered system** that turns meeting transcripts into organized action plans. Think of it as a smart assistant that listens to your team meetings and automatically figures out:

- **What tasks** need to be done
- **Who** should do each task
- **When** each task is due
- **What risks** might cause problems
- **How** tasks depend on each other

Then it creates a beautiful dashboard with all of this information and can even push tasks to Microsoft Planner or share summaries in Microsoft Teams.

---

## How It Works — The Big Picture

```
You paste a transcript ──▶ AI Agent Swarm ──▶ Actionable Dashboard
                              │
                    ┌─────────┼─────────┐
                    │         │         │
                    ▼         ▼         ▼
               Tasks      Risks     Timeline
```

---

## Step-by-Step Demo

### Step 1: You Start With a Meeting Transcript

A meeting transcript is just the text of what everyone said in a meeting. Here's a simple example:

```
Sarah: Good morning everyone. Let's kick off the sprint planning
       for the authentication module.

Rakshit: I've reviewed the requirements. The main tasks are:
         implement OAuth2 flow, add JWT token refresh,
         and write integration tests.

Sarah: Great. What's the timeline?

Rakshit: OAuth2 flow should be done by Friday. Token refresh
         depends on the OAuth2 completion, so early next week.

Priya: I can handle the integration tests.

Sarah: Any risks?

Rakshit: The third-party OAuth provider has rate limits
         we need to handle. That's a medium risk.

Sarah: Sounds good. Rakshit, you own the OAuth2 implementation.
       Priya owns tests.
```

You can either:
- **Type or paste** the transcript
- **Drag and drop** a `.txt` file
- **Click "Load sample"** to use a built-in example

---

### Step 2: The AI Agent Swarm Goes to Work

When you click **"Process Transcript"**, five AI agents spring into action — each with a specific job:

#### Agent 1: The Extractor 🧠
Reads the conversation and pulls out concrete tasks:
- *"Implement OAuth2 flow"* — Task
- *"Write integration tests"* — Task
- *"Due by Friday"* — Deadline
- *"Token refresh depends on OAuth2"* — Dependency

#### Agent 2: The Risk Assessor ⚠️
Looks at each task and asks: *"What could go wrong?"*
- Third-party API rate limits → **Medium Risk**
- Clear task, adequate time → **Low Risk**
- Missing owner or deadline → **High Risk**

#### Agent 3: The Assigner 👤
Figures out who should do what, based on the conversation:
- Sarah → coordinating with security team
- Rakshit → OAuth2, CI pipeline
- Priya → integration tests

#### Agent 4: The Reporter 📊
Creates an executive summary with a timeline:
- Sorts tasks by deadline urgency
- Generates a 2-3 sentence summary
- Builds a timeline view

#### Agent 5: The Validator ✅
Double-checks everything:
- Does every task have an owner?
- Are there conflicting deadlines?
- Are risk scores missing?
- If problems are found, it asks the other agents to fix them

All of this happens **in about 30–60 seconds**. You can watch each agent work in real time on the screen.

---

### Step 3: You Get a Beautiful Dashboard

Once processing is complete, you see a dashboard with five sections:

#### Executive Summary
A short paragraph that captures the essence of the meeting:
> *"The team planned the authentication module sprint. Three tasks were identified: OAuth2 implementation (owned by Rakshit, due Friday), JWT token refresh (owned by Rakshit, due next week), and integration tests (owned by Priya, no deadline set). A medium risk was flagged around third-party API rate limits."*

#### Risk Heatmap
A color-coded chart showing who has how many high/medium/low-risk tasks:
```
Owner      High  Medium  Low
Rakshit    ████  ██
Priya            ████████
```

#### Timeline
Tasks arranged in order of deadline urgency, connected by a visual timeline:
```
🔴 Rakshit · OAuth2 implementation · Due Friday
   │
   └──🔴 Rakshit · JWT token refresh · Due next week
   
🔵 Priya · Integration tests · No deadline
```

#### Task Table
A searchable, filterable table with every detail:
| # | Task | Owner | Deadline | Risk | Dependencies |
|---|------|-------|----------|------|-------------|
| 1 | OAuth2 flow | Rakshit | Friday | High | — |
| 2 | JWT refresh | Rakshit | Next week | Medium | Depends on #1 |
| 3 | Integration tests | Priya | — | Low | Needs API docs |

#### Dependency Graph
A visual map showing which tasks block others:
```
Level 1          Level 2
┌─────────┐     ┌──────────────┐
│ OAuth2  │────▶│ JWT Refresh  │
└─────────┘     └──────────────┘
┌───────────────────┐
│ Integration Tests │
└───────────────────┘
```

---

### Step 4: You Take Action

From the dashboard, you can:

| Action | How | What Happens |
|--------|-----|-------------|
| **Push to Planner** | Click a button | Tasks appear in Microsoft Planner |
| **Share to Teams** | Click a button | A summary is posted in your Teams channel |
| **Download Report** | Click a button | A formatted report file is downloaded |
| **Copy as Markdown** | Click a button | A table is copied to your clipboard |
| **Copy a single task** | Click the copy icon next to any task | Just that task text is copied |
| **Search tasks** | Type in the search box | The table filters in real time |
| **Collapse sections** | Click section headers | Hide sections you don't need |

---

## Real-World Use Cases

### Sprint Planning Meetings
Paste your sprint planning transcript → get a complete sprint backlog with owners, deadlines, and risk scores → push directly to Planner.

### Post-Mortem / Retrospectives
Paste the discussion → identify action items and owners → share the summary in Teams so everyone knows their follow-ups.

### Client Meetings
Paste the conversation → get a clear list of commitments and deadlines → download as a report to share with stakeholders.

### Daily Stand-ups
Even short stand-up transcripts are handled — the system detects brief meetings and adjusts its processing accordingly.

---

## Try It Yourself

### Option A: Just Watch the Demo
1. Go to `http://localhost:3000`
2. Click **"Load sample"**
3. Click **"Process Transcript"**
4. Watch the agents work in real time

### Option B: Use Your Own Transcript
1. Copy a real meeting transcript (or type one)
2. Paste it into the text area
3. Click **"Process Transcript"**

### Option C: Upload a File
1. Drag a `.txt` file onto the text area
2. It loads automatically
3. Click **"Process Transcript"**

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Submit transcript |
| `Ctrl + L` | Focus the text area |

---

## What Makes WorkflowOS Special

| Feature | Why It Matters |
|---------|---------------|
| **Real-time AI** | You watch each agent work — no waiting in the dark |
| **No setup needed** | Paste a transcript, get results. That's it |
| **Smart routing** | Short meetings skip unnecessary steps |
| **Self-correcting** | The validator catches mistakes and fixes them automatically |
| **Dark mode** | Easy on the eyes, works in any lighting |
| **Export anywhere** | Planner, Teams, Markdown, or download |
| **Accessible** | Works with keyboard navigation and screen readers |
| **Fast** | Full analysis in under a minute |

---

## Behind the Scenes (For the Curious)

### What Powers It?
- **AI Brain:** Azure OpenAI GPT-4o (the same technology behind ChatGPT)
- **Backend:** Python with FastAPI (handles all the logic)
- **Frontend:** Next.js (the interface you see in the browser)
- **Storage:** Azure Cosmos DB (saves your sessions)
- **Infrastructure:** Docker containers, deployed to Azure

### Is My Data Safe?
- All processing happens on your machine (locally) or on your Azure account
- No data is sent to third parties
- Session data can be cleared at any time
- Rate limiting prevents abuse

---

## Project Status

| Area | Status |
|------|--------|
| Core pipeline | ✅ Complete |
| User interface | ✅ Complete |
| Microsoft 365 export | ✅ Complete |
| Testing | ✅ 10/10 tests passing |
| Infrastructure | ✅ Docker, Bicep, CI/CD |
| Documentation | ✅ Complete |

---

**WorkflowOS — Built for Microsoft Build AI Hackathon 2026**
*Agent Swarms Track · AI Operating System for Teams*
