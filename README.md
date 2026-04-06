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

## Patent Preparation Record

This README is intentionally structured so it can serve as the core technical specification and invention-support file for patent preparation relating to AutoResearch. It is intended to function as a primary technical reference for patent counsel, invention disclosure drafting, internal priority documentation, diligence review, and technical memorialization of the inventive concepts embodied in the codebase.

In practical terms, this file is meant to be strong enough to serve as the core file in a patent preparation package when paired with the repository snapshot, architecture diagram, example runs, screenshots, and commit metadata corresponding to the version being documented. It should not be treated as a substitute for a formally drafted patent application, but it is written to support preparation of such an application at a much higher level of specificity than an ordinary README.

### Patent Record Metadata

| Field | Value |
| --- | --- |
| Working invention name | AutoResearch |
| Candidate filing title | Multi-Agent Research Orchestration System with Critique-Driven Iterative Refinement |
| Inventor | Yang (Rick) Wang, Ph.D. |
| Owner | Yang (Rick) Wang, Ph.D. |
| Status | Patent application filed; patent-pending positioning applies |
| Core support assets | `README.md`, `mermaid-diagram.png`, `backend/`, `frontend/` |
| Filing snapshot commit hash | Insert commit hash used for filing support record |
| First reduction to practice date | Insert date if desired |
| First public disclosure date | Insert date or state none |
| Counsel or docket reference | Insert law firm, docket number, or matter reference if desired |

### Candidate Patent Titles

- Multi-Agent Research Orchestration System with Critique-Driven Iterative Refinement
- System and Method for Evidence-Normalized AI Research Synthesis
- Real-Time Multi-Agent Research Platform with Persistent Knowledge Reuse
- System, Method, and Computer-Readable Medium for Structured AI Research Workflows

### Technical Field

This invention relates generally to artificial intelligence systems, computer-implemented research workflows, information retrieval, machine-assisted evidence analysis, distributed or modular agent orchestration, human-auditable AI systems, and memory-augmented computing platforms.

More specifically, the invention concerns a computer-implemented system and method that decomposes a research objective into sub-questions, acquires source material from heterogeneous channels, normalizes the acquired material into structured evidence units, critiques the evidence base for quality and completeness, iteratively refines the research process when needed, and synthesizes the results into an auditable final report.

### Background and Limitations of Existing Approaches

Conventional large language model interfaces commonly generate direct answers from a single prompt without robust decomposition of the problem, without structured evidence normalization, without explicit critique of coverage, and without an auditable record of intermediate reasoning stages. Conventional search systems, on the other hand, may return ranked documents or snippets but do not generally convert those results into a normalized evidence model tied to a deliberate research plan and iterative quality-control loop.

Existing approaches therefore suffer from one or more of the following limitations:

- lack of structured decomposition of a research objective into targeted sub-questions
- inability to compare coverage across multiple sub-questions in a unified state model
- insufficient handling of contradictions, weak evidence, and missing angles
- limited transparency into intermediate machine reasoning or workflow state
- poor reuse of prior research results across future sessions
- inefficient use of models because the same model is often used for all tasks regardless of cost or reasoning profile
- weak provenance tracking between user query, sub-question, evidence item, critique result, and final synthesis

### Technical Problems Addressed

AutoResearch addresses technical problems that arise when trying to convert a broad research question into a trustworthy machine-assisted output. Those problems include:

- how to orchestrate multiple specialized AI functions without collapsing the workflow into a single opaque generation step
- how to retrieve heterogeneous raw material from multiple source channels while preserving provenance
- how to normalize noisy retrieval output into a common evidence representation that downstream modules can evaluate consistently
- how to detect when the evidence base is incomplete, contradictory, or too weak for final synthesis
- how to trigger additional research iterations only when justified by measured quality gaps
- how to expose the internal workflow to a user in real time without tightly coupling UI logic to research logic
- how to persist reusable knowledge from prior sessions without requiring every session to start from zero

### Summary of the Invention

In one aspect, the invention provides a computer-implemented research system comprising an orchestrator, a plurality of specialized agents, one or more retrieval tools, a session-state memory layer, a persistent knowledge layer, and a real-time event transport layer, where the orchestrator coordinates a research workflow that includes planning, exploration, extraction, critique, optional refinement, and synthesis.

In another aspect, the invention provides a computer-implemented method comprising receiving a research query, decomposing the query into sub-questions, executing parallel retrieval operations across one or more source channels, converting retrieved outputs into structured evidence objects, evaluating the evidence objects to determine research completeness and quality, conditionally performing one or more additional retrieval iterations based on critique output, generating a final synthesis report, and streaming workflow events to a client interface.

In another aspect, the invention provides a non-transitory computer-readable medium storing instructions that, when executed by one or more processors, cause the processors to perform the foregoing method.

In another aspect, the invention provides a human-auditable AI interface in which intermediate states of the research workflow are externalized as structured events and rendered to a user during execution.

### Core Inventive Concepts

1. A state-machine-governed multi-agent research workflow rather than a single monolithic prompt-response interaction.
2. Critique-driven iterative refinement, where additional search and extraction passes are triggered by assessed evidence gaps and contradictions.
3. A normalized evidence representation that sits between retrieval and synthesis and supports downstream quality analysis.
4. Session-scoped event streaming that makes internal agent transitions and outputs observable in real time.
5. Dual-memory behavior combining short-term session state and persistent long-term research reuse.
6. Role-specialized model usage, allowing different reasoning resources to be allocated to planning, extraction, critique, and synthesis.
7. Graceful degradation across retrieval and synthesis layers so the system remains operational even when preferred services fail.

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

## Claim-Oriented Embodiments

### System Embodiment

In one non-limiting system embodiment, AutoResearch comprises:

- an input interface configured to receive a research query and runtime configuration
- an orchestration engine configured to execute a multi-stage research workflow as a state machine
- a planner agent configured to produce sub-questions and a research strategy
- an explorer agent configured to run web and academic retrieval operations, including parallel retrieval across multiple sub-questions
- an extractor agent configured to transform raw retrieval results into structured evidence objects
- a critic agent configured to evaluate evidence quality, contradictions, and missing coverage, and to determine whether further refinement is warranted
- a synthesizer agent configured to produce a final report, hypotheses, findings, and source mapping
- a session memory store configured to persist in-flight research state during execution
- a long-term memory store configured to preserve prior research outputs for future reuse
- an event bus and client transport layer configured to stream intermediate workflow events to an external user interface

### Method Embodiment

In one non-limiting method embodiment, the system performs the following operations:

1. receive a research query from a client
2. initialize a session state object for the query
3. generate a research plan including multiple sub-questions
4. launch retrieval tasks for at least a subset of the sub-questions
5. associate each retrieved item with provenance data including source and sub-question context
6. transform retrieved items into structured evidence objects
7. evaluate the evidence objects for quality, contradiction, and coverage
8. determine whether additional retrieval or refinement is required
9. if required, perform at least one additional retrieval pass based on refinement queries or unresolved sub-questions
10. generate a synthesis output from the accumulated evidence base
11. optionally persist the resulting research output into long-term memory
12. emit structured runtime events to a client-facing interface during one or more of the foregoing steps

### Computer-Readable Medium Embodiment

In one non-limiting computer-readable medium embodiment, stored instructions cause one or more processors to:

- coordinate specialized research agents using an explicit execution graph or state machine
- maintain a shared research state across multiple workflow stages
- normalize heterogeneous source material into a common evidence schema
- iteratively refine the research process according to critique results
- output both a final synthesis and an observable intermediate event stream

### Alternative Embodiments Intended to be Covered

To preserve breadth of the inventive disclosure, the following variants should be understood as within the intended technical scope of the invention unless expressly disclaimed in a formal patent filing:

- model-provider agnostic implementations, including OpenAI, Anthropic, open-weight, proprietary, or domain-specific models
- retrieval-provider agnostic implementations, including Tavily, DuckDuckGo, academic APIs, enterprise search systems, or private corpora
- memory-backend agnostic implementations, including vector databases, graph stores, relational stores, object stores, or hybrid memory layers
- transport agnostic interfaces, including WebSocket, Server-Sent Events, message queues, polling APIs, or local desktop event transports
- single-tenant, multi-tenant, on-premises, private-cloud, regulated-environment, or edge-deployed implementations
- domain-specialized embodiments for science, finance, medicine, law, engineering, intelligence, policy, or enterprise due diligence

### Example Claim Families for Counsel Review

The following are non-binding claim-orientation themes intended to help counsel, not formal claims:

- a system claim directed to an orchestrated multi-agent research platform
- a method claim directed to plan -> retrieve -> normalize -> critique -> refine -> synthesize processing
- a computer-readable medium claim directed to processor-executable workflow control
- a claim family directed to session-scoped event streaming of intermediate AI workflow states
- a claim family directed to critique-triggered iterative refinement of machine-assisted research
- a claim family directed to evidence normalization and provenance mapping between retrieval and synthesis
- a claim family directed to long-term reuse of prior research outputs in later sessions
- a claim family directed to differentiated model allocation across workflow stages

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

## Patent Support for Data Structures

The data structures used by AutoResearch are not merely implementation details. They help evidence the internal machine state required to perform the claimed workflow and may be relevant to patent drafting because they define how information is transformed across stages.

### `ResearchPlan`

`ResearchPlan` captures the main query, a set of sub-questions, a strategy statement, and an estimated iteration count. From a patent-support perspective, this object shows that planning output is structured, inspectable, and suitable for downstream machine processing rather than being an unstructured text artifact.

### `SubQuery`

`SubQuery` captures the question text, rationale, optional hierarchy, and priority. This supports embodiments in which the system decomposes a research objective into multiple machine-manageable investigative units.

### `Evidence`

`Evidence` captures a claim, supporting text, source identity, source type, confidence, relevance, and sub-question linkage. This object is central to the inventive architecture because it provides a normalized intermediate representation between retrieval and synthesis.

### `Critique`

`Critique` captures findings, missing angles, contradictions, refinement queries, quality score, and a continuation decision. This object supports embodiments in which the system programmatically decides whether to terminate or continue a research loop based on machine-evaluated evidence sufficiency.

### `SynthesisReport`

`SynthesisReport` captures executive summary, hypotheses, key findings, methodology notes, knowledge gaps, markdown report content, and sources. This supports embodiments in which output is both human-readable and structurally tied to the evidence pipeline.

### `ResearchState`

`ResearchState` provides the shared state model spanning query, configuration, iteration count, plan, evidence, critique, synthesis, and error state. This supports the architecture of a stateful multi-stage workflow engine rather than an isolated prompt transaction.

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

## Filing Package Checklist

When using this README as the core file in a patent preparation package, preserve it together with the following artifacts:

- repository commit hash for the exact version being documented
- PDF export of this README with creation date and version identifier
- `mermaid-diagram.png` and any additional architecture diagrams
- representative screenshots of the frontend plan, evidence, and synthesis views
- one or more sample research sessions with input, intermediate events, and final output
- source code snapshot of `backend/` and `frontend/`
- inventor declaration details, ownership details, and public-disclosure status
- any prior invention disclosure forms, docket references, or counsel annotations

## Core File Usage Note

This README is intended to be sufficiently detailed to serve as the core technical file for patent preparation related to AutoResearch. It captures the invention title space, technical field, background, technical problems addressed, inventive concepts, system and method embodiments, claim-oriented themes, core data structures, implementation details, and filing-support checklist. For actual filing, patent counsel should translate this material into a formal specification, abstract, claims, figures list, cross-reference sections, and jurisdiction-specific filing package.

## Closing Statement

AutoResearch is not just a demo chatbot. It is a structured research engine with an inspectable multi-agent control loop, evidence normalization, critique-driven refinement, long-term memory, and real-time UX instrumentation. The technical architecture and the inventive framing described in this repository should be treated as the proprietary intellectual property of Yang (Rick) Wang, Ph.D.
