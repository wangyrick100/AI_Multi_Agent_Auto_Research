"""
Research Orchestrator — drives the full Plan → Explore → Extract → Critique → Refine → Synthesize loop.

Architecture (LangGraph-style state machine):

  START
    ↓
  [plan]          — PlannerAgent decomposes the query
    ↓
  [explore]       — ExplorerAgent searches web + academic in parallel
    ↓
  [extract]       — ExtractorAgent structures raw findings into Evidence
    ↓
  [critique]      — CriticAgent evaluates coverage and quality
    ↓ (should_continue?)
  ↙ yes            ↘ no
[plan] (refine)    [synthesize]
                        ↓
                      END

Events are emitted to the event_bus throughout so the WebSocket layer
can stream real-time updates to the frontend.
"""

from __future__ import annotations
import asyncio
import logging
from typing import Annotated, TypedDict, List, Optional

from langgraph.graph import StateGraph, END, START  # type: ignore

from backend.event_bus import emit, emit_complete, emit_error
from backend.models.schemas import ResearchState, ResearchConfig
from backend.memory.session import session_store
from backend.memory.knowledge import knowledge_store
from .planner import PlannerAgent
from .explorer import ExplorerAgent
from .extractor import ExtractorAgent
from .critic import CriticAgent
from .synthesizer import SynthesizerAgent

logger = logging.getLogger(__name__)


# ── LangGraph state dict ──────────────────────────────────────────────────────

class GraphState(TypedDict):
    research_state: ResearchState
    _agents: dict  # passed through — holds lazily-constructed agent instances


# ── Node functions ─────────────────────────────────────────────────────────────

def _get_agents():
    """Lazy-instantiate agents to avoid module-level LLM client construction."""
    return {
        "planner": PlannerAgent(),
        "explorer": ExplorerAgent(),
        "extractor": ExtractorAgent(),
        "critic": CriticAgent(),
        "synthesizer": SynthesizerAgent(),
    }


async def _plan_node(state: GraphState) -> GraphState:
    rs: ResearchState = state["research_state"]
    session_store.update_status(rs.session_id, "planning")
    await emit(rs.session_id, "phase_change", "orchestrator", "Phase: Planning")
    rs = await state["_agents"]["planner"].run(rs)
    rs.increment_iteration()
    return {**state, "research_state": rs}


async def _explore_node(state: GraphState) -> GraphState:
    rs: ResearchState = state["research_state"]
    session_store.update_status(rs.session_id, "exploring")
    await emit(rs.session_id, "phase_change", "orchestrator", f"Phase: Exploring (iteration {rs.iteration})")
    rs = await state["_agents"]["explorer"].run(rs)
    return {**state, "research_state": rs}


async def _extract_node(state: GraphState) -> GraphState:
    rs: ResearchState = state["research_state"]
    session_store.update_status(rs.session_id, "extracting")
    await emit(rs.session_id, "phase_change", "orchestrator", "Phase: Extracting evidence")
    rs = await state["_agents"]["extractor"].run(rs)
    return {**state, "research_state": rs}


async def _critique_node(state: GraphState) -> GraphState:
    rs: ResearchState = state["research_state"]
    session_store.update_status(rs.session_id, "critiquing")
    await emit(rs.session_id, "phase_change", "orchestrator", "Phase: Critiquing findings")
    rs = await state["_agents"]["critic"].run(rs)
    return {**state, "research_state": rs}


async def _synthesize_node(state: GraphState) -> GraphState:
    rs: ResearchState = state["research_state"]
    session_store.update_status(rs.session_id, "synthesizing")
    await emit(rs.session_id, "phase_change", "orchestrator", "Phase: Synthesizing report")
    rs = await state["_agents"]["synthesizer"].run(rs)
    return {**state, "research_state": rs}


def _should_refine(state: GraphState) -> str:
    rs: ResearchState = state["research_state"]
    if rs.should_continue and rs.iteration < rs.get_max_iterations():
        return "explore"
    return "synthesize"


# ── Graph construction ─────────────────────────────────────────────────────────

def _build_graph() -> StateGraph:
    builder = StateGraph(GraphState)

    builder.add_node("plan", _plan_node)
    builder.add_node("explore", _explore_node)
    builder.add_node("extract", _extract_node)
    builder.add_node("critique", _critique_node)
    builder.add_node("synthesize", _synthesize_node)

    builder.add_edge(START, "plan")
    builder.add_edge("plan", "explore")
    builder.add_edge("explore", "extract")
    builder.add_edge("extract", "critique")
    builder.add_conditional_edges("critique", _should_refine, {"explore": "explore", "synthesize": "synthesize"})
    builder.add_edge("synthesize", END)

    return builder.compile()


# ── Orchestrator class ─────────────────────────────────────────────────────────

class ResearchOrchestrator:
    def __init__(self) -> None:
        self._graph = _build_graph()

    async def run(self, query: str, session_id: str, config: ResearchConfig) -> dict:
        """
        Execute the full research pipeline.
        Events are streamed to the event_bus throughout.
        Returns the final serialized ResearchState.
        """
        agents = _get_agents()
        rs = ResearchState(
            session_id=session_id,
            query=query,
            config=config,
            iteration=0,
            should_continue=True,
        )
        session_store.set_state(rs)

        initial: GraphState = {"research_state": rs, "_agents": agents}

        try:
            await emit(session_id, "research_started", "orchestrator", f"Starting research: {query[:100]}")

            # Run the graph — each node emits its own events via event_bus
            final_state: GraphState = await self._graph.ainvoke(initial)
            rs = final_state["research_state"]

            session_store.set_state(rs)
            session_store.update_status(session_id, "complete")

            # Persist to long-term memory
            if rs.synthesis and knowledge_store.available:
                entry_id = knowledge_store.save(query, rs.synthesis)
                if entry_id:
                    logger.info("Saved research to long-term memory: %s", entry_id)

            result = {
                "session_id": session_id,
                "query": query,
                "synthesis": rs.synthesis.model_dump() if rs.synthesis else None,
                "evidence_count": len(rs.all_evidence),
                "iterations": rs.iteration,
                "plan": rs.plan.model_dump() if rs.plan else None,
                "critique": rs.critique.model_dump() if rs.critique else None,
            }

            await emit_complete(session_id, result)
            return result

        except Exception as exc:
            logger.error("Orchestrator error for session %s: %s", session_id, exc, exc_info=True)
            session_store.update_status(session_id, "error")
            await emit_error(session_id, str(exc))
            return {"session_id": session_id, "error": str(exc)}


# Singleton
orchestrator = ResearchOrchestrator()
