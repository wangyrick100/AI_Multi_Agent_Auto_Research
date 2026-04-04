# AutoResearch — Multi-Agent AI Research System

A production-grade auto-research engine built on a **5-agent pipeline** with iterative refinement, long-term memory, and a real-time streaming UI.

---

## Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATOR                            │
│  (LangGraph state machine — Plan → Explore → Extract →          │
│                            Critique → Refine ↺ → Synthesize)   │
└─────────────────────────────────────────────────────────────────┘
    │          │           │            │            │
    ▼          ▼           ▼            ▼            ▼
 Planner   Explorer    Extractor     Critic     Synthesizer
   │       (web +        (LLM        (gap +      (report +
decompose  academic    structured   contradict.  hypotheses)
  query    parallel)   evidence)    scoring)
    │
    ▼
 Memory Layer
  ├── Short-term (session, in-memory)
  └── Long-term (ChromaDB vector store — persisted)
```

### Agents

| Agent | Role | Model |
|-------|------|-------|
| **Planner** | Decomposes query into 3–6 targeted sub-questions with a research strategy | GPT-4o |
| **Explorer** | Runs web (Tavily/DuckDuckGo) + academic (arXiv) searches **in parallel** per sub-question | — |
| **Extractor** | Transforms raw snippets/abstracts into structured `Evidence` objects (claim, confidence, relevance) | GPT-4o-mini |
| **Critic** | Evaluates coverage, identifies contradictions & gaps, scores overall quality, decides if more iteration needed | GPT-4o |
| **Synthesizer** | Produces hypotheses, key findings, knowledge gaps, and a full markdown report with citations | GPT-4o |

### Orchestration Loop

```
START → [plan] → [explore] → [extract] → [critique]
                                              │
                    ┌─ should_continue? ──────┘
                    │ yes → back to [explore] (refined queries)
                    │ no  → [synthesize] → END
                    └─ max iterations enforced
```

---

## Project Structure

```
autoresearch/
├── backend/
│   ├── main.py              # FastAPI app + WebSocket endpoint
│   ├── config.py            # Settings (env vars via pydantic-settings)
│   ├── event_bus.py         # Async event streaming to WebSocket clients
│   ├── models/
│   │   └── schemas.py       # All Pydantic models
│   ├── agents/
│   │   ├── orchestrator.py  # LangGraph state machine
│   │   ├── planner.py
│   │   ├── explorer.py
│   │   ├── extractor.py
│   │   ├── critic.py
│   │   └── synthesizer.py
│   ├── memory/
│   │   ├── session.py       # In-memory session store
│   │   └── knowledge.py     # ChromaDB long-term memory
│   └── tools/
│       ├── web_search.py    # Tavily → DuckDuckGo fallback
│       └── academic.py      # arXiv
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main layout (3-panel + synthesis)
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── ResearchInput.tsx   # Landing + config
│   │   │   ├── AgentFeed.tsx       # Real-time event stream
│   │   │   ├── ResearchTree.tsx    # ReactFlow plan tree
│   │   │   ├── EvidencePanel.tsx   # Extracted evidence cards
│   │   │   ├── SynthesisReport.tsx # Final report (markdown + hypotheses)
│   │   │   └── ProgressBar.tsx
│   │   ├── hooks/
│   │   │   └── useResearch.ts  # WebSocket state machine
│   │   ├── store/
│   │   │   └── researchStore.ts  # Zustand global state
│   │   └── types/
│   │       └── index.ts
│   └── package.json
└── .env.example
```

---

## Quick Start

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate       # Windows
# source .venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start devserver (proxies /ws and /api to localhost:8000)
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | **Required.** OpenAI key |
| `TAVILY_API_KEY` | — | Optional. Better web search. Falls back to DuckDuckGo |
| `MODEL_NAME` | `gpt-4o` | Primary reasoning model |
| `FAST_MODEL_NAME` | `gpt-4o-mini` | Fast model for per-result extraction |
| `MAX_RESEARCH_ITERATIONS` | `3` | Max plan→explore→critique loops |
| `CHROMA_PERSIST_DIR` | `./data/chroma_db` | Long-term memory location |

---

## API Reference

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Backend health + memory stats |
| `GET /sessions` | List all sessions |
| `GET /sessions/{id}` | Session info + evidence count |
| `GET /sessions/{id}/report` | Final synthesis report |
| `DELETE /sessions/{id}` | Clean up session |
| `WS /ws/{id}` | Real-time research WebSocket |

### WebSocket Protocol

**Client → Server:**
```json
{ "type": "start_research", "query": "...", "config": { "max_iterations": 3, "include_academic": true, "depth": "balanced" } }
```

**Server → Client:** stream of events:
```json
{ "type": "plan_ready", "agent": "planner", "message": "...", "data": { "sub_queries": [...] }, "timestamp": "..." }
```

Final message: `{ "type": "complete", "data": { "synthesis": {...}, "evidence_count": 42 } }`

---

## Key Design Decisions

- **LangGraph state machine** — conditional edges enable the refinement loop; each node is a pure async function
- **Event bus pattern** — agents emit events to per-session `asyncio.Queue`; WebSocket handler forwards them to the UI without coupling
- **Dual-model strategy** — GPT-4o for reasoning, GPT-4o-mini for high-volume extraction (cost efficiency)
- **Graceful fallbacks** — Tavily → DuckDuckGo; planner failure → direct search; synthesizer failure → plain text report
- **ChromaDB long-term memory** — completed research summaries are vectorized and retrieved in future sessions on similar queries
