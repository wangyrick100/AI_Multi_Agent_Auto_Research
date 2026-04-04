"""
Explorer Agent — runs web and academic searches in parallel for each sub-query.
Emits: agent_searching, search_results events.
"""

from __future__ import annotations
import asyncio
import logging
from typing import List, Dict, Any

from backend.event_bus import emit
from backend.models.schemas import ResearchState, SubQuery
from backend.tools.web_search import web_search
from backend.tools.academic import academic_search

logger = logging.getLogger(__name__)


class ExplorerAgent:
    async def run(self, state: ResearchState) -> ResearchState:
        if not state.plan:
            return state

        sid = state.session_id
        sub_queries = state.plan.sub_queries

        # Pick refined queries if critic produced them
        refinement_queries: List[str] = []
        if state.critique and state.critique.refinement_queries:
            refinement_queries = state.critique.refinement_queries[:3]

        await emit(
            sid,
            "agent_searching",
            "explorer",
            f"Exploring {len(sub_queries)} sub-questions"
            + (f" + {len(refinement_queries)} refinements" if refinement_queries else ""),
        )

        # Build search tasks: each sub-query gets both web + academic searches
        tasks: List[asyncio.Task] = []
        task_meta: List[Dict[str, Any]] = []

        for sq in sub_queries:
            if state.config.include_web:
                tasks.append(asyncio.create_task(web_search(sq.question)))
                task_meta.append({"sq_id": sq.id, "type": "web", "question": sq.question})
            if state.config.include_academic:
                tasks.append(asyncio.create_task(academic_search(sq.question)))
                task_meta.append({"sq_id": sq.id, "type": "academic", "question": sq.question})

        for rq in refinement_queries:
            if state.config.include_web:
                tasks.append(asyncio.create_task(web_search(rq)))
                task_meta.append({"sq_id": "refinement", "type": "web", "question": rq})

        results = await asyncio.gather(*tasks, return_exceptions=True)

        raw_findings: List[Dict[str, Any]] = []
        for meta, result in zip(task_meta, results):
            if isinstance(result, Exception):
                logger.error("Search error for '%s': %s", meta["question"], result)
                continue
            for item in result:
                item["sq_id"] = meta["sq_id"]
                item["search_type"] = meta["type"]
                raw_findings.append(item)

        total = len(raw_findings)
        await emit(
            sid,
            "search_results",
            "explorer",
            f"Found {total} raw results from {len(tasks)} searches",
            {"result_count": total, "breakdown": _breakdown(raw_findings)},
        )

        # Attach to state (accumulate across iterations)
        state.all_evidence  # reference to trigger dict init
        if not hasattr(state, "_raw_findings"):
            state.__dict__["_raw_findings"] = []
        state.__dict__["_raw_findings"].extend(raw_findings)

        return state


def _breakdown(findings: List[Dict[str, Any]]) -> Dict[str, int]:
    web = sum(1 for f in findings if f.get("search_type") == "web")
    academic = sum(1 for f in findings if f.get("search_type") == "academic")
    return {"web": web, "academic": academic}
