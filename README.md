# AutoResearch

AutoResearch is a multi-agent research platform that decomposes a user query into sub-questions, gathers evidence from web and academic sources, critiques the coverage and quality of the evidence, and synthesizes the result into a structured report with citations and an auditable activity trail.

Inventor, owner, and author of record: Yang (Rick) Wang, Ph.D.

## Ownership, Proprietary Rights, and Patent Notice

This repository documents proprietary technology conceived, authored, and owned by Yang (Rick) Wang, Ph.D.

One or more patent applications covering this solution, including its architecture, orchestration flow, and related inventive concepts, have already been filed by or for Yang (Rick) Wang, Ph.D. This repository should therefore be read as documenting patent-pending and otherwise protected intellectual property.

Unless Yang (Rick) Wang, Ph.D. grants written permission, no part of this repository should be interpreted as granting any express or implied license under any patent right, copyright, trade secret right, know-how, or other intellectual property right. In particular:

- No right is granted to reproduce, commercialize, sublicense, redistribute, train on, benchmark for publication, reverse engineer for competitive use, or create derivative works from this solution except as expressly authorized in writing.
- The absence of an open-source license in this repository is intentional. All rights are reserved.
- Any external collaboration, contribution, evaluation, diligence review, or implementation transfer should be governed by a separate written agreement.

If a public-facing patent reference is needed later, add the official filing metadata here:

- Patent status: Patent application(s) filed; patent-pending notice applies
- Patent application number(s): insert official application number(s) if and when public disclosure is desired
- Filing jurisdiction(s): insert jurisdiction(s)
- Filing date(s): insert official filing date(s)

Important note: this README can help memorialize technical details, inventive framing, and ownership posture, but it does not itself create patent rights or replace legal advice. Patent protection arises from the filed patent application(s), issued claims if any, and applicable law.

## Executive Summary

AutoResearch is designed as a research-grade orchestration system rather than a single-turn chatbot. Its core value proposition is that it does not jump directly from question to answer. Instead, it:

1. Plans the problem as a structured research program.
2. Explores multiple evidence channels in parallel.
3. Extracts machine-usable evidence objects from noisy search results.
4. Critiques coverage, contradictions, and missing angles.
5. Iterates when the evidence base is weak.
6. Produces a synthesized report with traceable sources.
7. Streams the internal reasoning workflow to the frontend in real time.

The repository combines a FastAPI backend, a LangGraph-driven orchestration loop, search tools, short-term and long-term memory, and a React frontend that visualizes plan construction, evidence accumulation, and synthesis progress.

## Patent-Oriented Technical Positioning

The following system characteristics are especially important from an invention-documentation perspective and may be relevant to claim drafting, prosecution support, diligence review, or technical differentiation analysis:

- Multi-agent orchestration with explicit phase transitions instead of monolithic prompt chaining.
- Critique-driven refinement, where additional search passes are triggered by detected evidence gaps and contradictions.
- Structured evidence normalization that converts heterogeneous search outputs into common evidence objects before synthesis.
- Session-scoped event streaming that makes internal agent behavior observable to external users in real time.
- Dual-memory design with transient session state plus persistent knowledge retrieval for future research runs.
- Cost-aware model specialization, using a stronger model for planning, critique, and synthesis while using a faster model for high-volume extraction.
- Search redundancy and graceful degradation through primary and fallback search paths.
- Human-auditable research artifacts, including sub-questions, extracted evidence, critique summaries, and final markdown synthesis.

These differentiators are documented here to describe the technical system clearly. Final patent scope, enforceability, and claim interpretation depend on the actual filed application(s) and counsel-approved legal strategy.

## System Objectives

AutoResearch is built to support:

- Deep research workflows where evidence quality matters more than fast generic text generation.
- Repeatable and inspectable AI-assisted analysis.
- Parallel acquisition of heterogeneous source material.
- Transparent research iteration instead of opaque answer generation.
- A product form factor that can later be hardened into enterprise, regulated, or proprietary internal research tooling.

## Architecture Overview

```text
User Query
   |
   v
+-----------------------------+
| Research Orchestrator       |
| Plan -> Explore -> Extract  |
| -> Critique -> Refine?      |
| -> Synthesize               |
+-----------------------------+
   |        |        |      |
   |        |        |      +--> Event Bus -> WebSocket -> Frontend
   |        |        |
   |        |        +--------> Evidence Store in Session State
   |        |
   |        +-----------------> Web Search + Academic Search
   |
   +--------------------------> Long-Term Knowledge Store
```

## End-to-End Pipeline

### 1. Planning

The planner decomposes the primary query into a structured set of sub-questions. The goal is coverage, not just decomposition. The plan attempts to span:

- definitions and background
- data and evidence
- mechanisms and causality
- counterarguments and limitations
- implications or applications

The planner can also incorporate prior relevant research retrieved from long-term memory.

### 2. Exploration

The explorer runs source acquisition in parallel:

- web search via Tavily when configured
- DuckDuckGo fallback when Tavily is unavailable
- academic retrieval via arXiv

Each search result is tagged with the originating sub-question and search channel so later stages can maintain provenance.

### 3. Extraction

The extractor converts raw search outputs into normalized `Evidence` objects with fields such as:

- claim
- supporting text
- source URL
- source title
- source type
- confidence
- relevance
- linked sub-question

This design intentionally separates retrieval from evidence normalization, which improves downstream critique and synthesis quality.

### 4. Critique

The critic evaluates the evidence base and decides whether the system has enough material to synthesize responsibly. It looks for:

- missing angles
- contradictions
- weak evidence
- insufficient coverage
- readiness for synthesis

If the critic determines that important gaps remain and iteration budget is available, the loop continues with refinement queries.

### 5. Synthesis

The synthesizer turns the accumulated evidence into a final structured report containing:

- executive summary
- hypotheses
- key findings
- evidence summary
- knowledge gaps
- methodology notes
- markdown report with citations
- source list

### 6. Persistence

Completed synthesis output can be saved into a ChromaDB-backed long-term memory layer so future queries can benefit from prior research context.

### 7. Frontend Streaming

The UI receives backend events in real time over WebSocket and presents:

- agent activity feed
- research plan tree
- extracted evidence cards
- critique state
- final synthesis report

## Repository Structure

```text
.
|-- backend/
|   |-- agents/
|   |   |-- orchestrator.py
|   |   |-- planner.py
|   |   |-- explorer.py
|   |   |-- extractor.py
|   |   |-- critic.py
|   |   `-- synthesizer.py
|   |-- memory/
|   |   |-- session.py
|   |   `-- knowledge.py
|   |-- models/
|   |   `-- schemas.py
|   |-- tools/
|   |   |-- web_search.py
|   |   `-- academic.py
|   |-- config.py
|   |-- event_bus.py
|   `-- main.py
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- store/
|   |   `-- types/
|   |-- package.json
|   `-- vite.config.ts
|-- .env.example
|-- mermaid-diagram.png
`-- README.md
```

## Backend Design

### API Layer

The backend is a FastAPI service that exposes:

- REST endpoints for health, session inspection, report retrieval, and cleanup
- a session-scoped WebSocket endpoint for live orchestration updates

The WebSocket path is the primary runtime interface for research execution.

### Orchestration Layer

The orchestration logic lives in `backend/agents/orchestrator.py` and is implemented as a LangGraph state machine. The state machine provides a cleaner and more extensible control model than ad hoc prompt chaining because it makes the execution graph explicit:

- `plan`
- `explore`
- `extract`
- `critique`
- conditional branch to either `explore` again or `synthesize`

### Agent Specialization

Each agent owns a distinct responsibility:

| Agent | Responsibility | Model Strategy |
| --- | --- | --- |
| Planner | Decompose the research problem into targeted sub-questions | Primary model |
| Explorer | Collect candidate evidence from external sources | Search tools |
| Extractor | Convert raw search results into normalized evidence | Fast model |
| Critic | Evaluate quality, coverage, and contradictions | Primary model |
| Synthesizer | Produce a final report with citations and limitations | Primary model |

### Event Bus

The event bus decouples backend research execution from frontend display concerns. Each session receives its own `asyncio.Queue`, and agents emit structured events into the queue. The WebSocket handler forwards those events to the client.

This design has several advantages:

- agents do not need to know anything about transport or UI
- frontend responsiveness improves because events stream incrementally
- instrumentation points are explicit and easy to extend

### Memory Model

The memory subsystem has two layers:

- short-term session memory in `backend/memory/session.py`
- long-term vector memory in `backend/memory/knowledge.py`

Short-term memory tracks active session state and status. Long-term memory stores completed research summaries so related future runs can retrieve prior context.

### Reliability Notes

The current codebase includes targeted quality improvements:

- WebSocket disconnects now cancel in-flight research tasks so the system does not continue wasting compute or API spend after the client is gone.
- Extraction now skips previously processed findings across iterations, which reduces duplicate evidence and unnecessary repeat LLM calls.
- Local repository hygiene was improved so generated data and Python cache artifacts are less likely to be committed accidentally.

## Frontend Design

The frontend is a Vite + React + TypeScript application with Zustand for state management and React Flow for plan visualization.

The UI is organized into four main views:

- `ResearchInput`: landing page and run configuration
- `AgentFeed`: real-time event stream
- `ResearchTree`: sub-question visualization
- `EvidencePanel`: extracted evidence inventory
- `SynthesisReport`: final report rendering with markdown and sources

The frontend is not a passive shell. It reconstructs session state from the event stream and presents the research process as an inspectable workflow rather than a single opaque response.

## Data Contracts

### Research Configuration

The runtime configuration includes:

| Field | Type | Meaning |
| --- | --- | --- |
| `max_iterations` | integer | Upper bound on critique-driven refinement loops |
| `include_academic` | boolean | Whether academic retrieval should be used |
| `include_web` | boolean | Whether web search should be used |
| `depth` | enum | Research depth preset (`fast`, `balanced`, `deep`) |

### Evidence Object

Core evidence fields include:

| Field | Meaning |
| --- | --- |
| `claim` | Normalized statement extracted from a source |
| `evidence_text` | Supporting excerpt or paraphrase |
| `source_url` | Source locator |
| `source_title` | Human-readable source title |
| `source_type` | `web`, `academic`, or related type |
| `confidence` | Model-estimated factual confidence |
| `relevance` | Estimated relevance to the target sub-question |
| `sub_query_id` | The sub-question that motivated retrieval |

### WebSocket Protocol

Client to server:

```json
{
  "type": "start_research",
  "query": "What are the best evidence-backed biomarkers for early Alzheimer's detection?",
  "config": {
    "max_iterations": 3,
    "include_academic": true,
    "include_web": true,
    "depth": "balanced"
  }
}
```

Server to client event example:

```json
{
  "type": "plan_ready",
  "agent": "planner",
  "message": "Generated research plan with 4 sub-questions",
  "data": {
    "sub_queries": [
      {
        "id": "subq-1",
        "question": "Which biomarkers have the strongest evidence for early detection?",
        "rationale": "Establish core evidence",
        "priority": 1,
        "parent_id": null
      }
    ],
    "strategy": "Systematic literature and web evidence review"
  },
  "timestamp": "2026-04-06T12:00:00Z",
  "session_id": "sess_123"
}
```

## Configuration

Environment variables are defined in `.env.example`.

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Yes | none | Required for planner, extractor, critic, and synthesizer |
| `TAVILY_API_KEY` | No | none | Enables higher-quality web search |
| `MODEL_NAME` | No | `gpt-4o` | Primary reasoning model |
| `FAST_MODEL_NAME` | No | `gpt-4o-mini` | High-volume extraction model |
| `TEMPERATURE` | No | `0.1` | Shared default temperature control |
| `MAX_TOKENS` | No | `4096` | Synthesis budget ceiling |
| `MAX_RESEARCH_ITERATIONS` | No | `3` | Global iteration cap |
| `MAX_WEB_RESULTS` | No | `5` | Per-query web result limit |
| `MAX_ACADEMIC_RESULTS` | No | `5` | Per-query academic result limit |
| `CHROMA_PERSIST_DIR` | No | `./data/chroma_db` | Long-term memory path |

## Local Development

### Prerequisites

- Python 3.11 or newer recommended
- Node.js 18 or newer recommended
- npm
- An OpenAI API key
- Optional: Tavily API key for higher-quality web search

### 1. Configure the environment

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

Then edit `.env` and supply at minimum `OPENAI_API_KEY`.

### 2. Install backend dependencies

PowerShell:

```powershell
python -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

Bash:

```bash
python -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
```

### 3. Run the backend

Run from the repository root so package-style imports resolve correctly:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

### 5. Run the frontend

```bash
npm run dev
```

The frontend default URL is `http://localhost:5173`.

The backend default URL is `http://localhost:8000`.

### 6. Sanity check

Backend health:

```bash
curl http://localhost:8000/health
```

## API Surface

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/health` | GET | Service health and knowledge-store status |
| `/sessions` | GET | List active or known sessions |
| `/sessions/{session_id}` | GET | Session info and evidence count |
| `/sessions/{session_id}/report` | GET | Final synthesis report for a completed session |
| `/sessions/{session_id}` | DELETE | Session cleanup |
| `/ws/{session_id}` | WebSocket | Real-time research execution and streaming |

## Operational Considerations

### Cost and Latency

This system deliberately uses different models for different phases. Planning, critique, and synthesis are reasoning-heavy tasks; extraction is a repeated high-volume task. Splitting these responsibilities reduces cost while preserving overall research quality.

### Failure Behavior

The backend contains graceful fallbacks:

- Tavily to DuckDuckGo for web search
- planner failure to direct-search fallback
- synthesis failure to fallback report generation
- ChromaDB unavailable to stateless operation

### Current Boundaries

This project is already strong as a research orchestration prototype, but it is not yet a finished enterprise platform. Future hardening could include:

- authentication and authorization
- source quality scoring beyond basic extraction heuristics
- richer academic connectors
- evaluation harnesses
- persistence for session timelines
- background job infrastructure
- production observability and tracing

## Security, IP Handling, and Commercial Use

Because this repository documents proprietary, patent-pending work, any productionization, transfer, or external disclosure should be handled carefully. Recommended practice:

- keep patent identifiers synchronized with counsel-approved public disclosures
- avoid publishing non-public continuation or claim strategy details
- require written agreements before accepting external contributions
- use separate deployment credentials and secret stores in production
- avoid treating the current prototype as a compliance-certified system

## Recommended Attribution

If this system is referenced in internal documentation, diligence materials, invention disclosures, commercialization decks, or technical summaries, use the following attribution format:

`AutoResearch, invented and authored by Yang (Rick) Wang, Ph.D. Proprietary and patent-pending. All rights reserved.`

## Closing Statement

AutoResearch is not just a demo chatbot. It is a structured research engine with an inspectable multi-agent control loop, evidence normalization, critique-driven refinement, long-term memory, and real-time UX instrumentation. The technical architecture and the inventive framing described in this repository should be treated as the proprietary intellectual property of Yang (Rick) Wang, Ph.D.
