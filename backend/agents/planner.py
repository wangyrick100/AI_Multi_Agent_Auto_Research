"""
Planner Agent — decomposes the research query into a structured plan of sub-questions.
Emits: agent_thinking, plan_ready events.
"""

from __future__ import annotations
import json
import uuid
import logging
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from backend.config import settings
from backend.event_bus import emit
from backend.models.schemas import ResearchState, ResearchPlan, SubQuery
from backend.memory.knowledge import knowledge_store

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are an expert research planner. Your role is to decompose a complex research question into a structured set of sub-questions that, when answered together, will produce a comprehensive and rigorous research report.

Guidelines:
- Generate 3-6 sub-questions depending on complexity
- Sub-questions should cover: definitions/background, evidence/data, mechanisms/causality, counterarguments, applications/implications
- Each sub-question must be specific, answerable, and non-overlapping
- Identify a clear research strategy
- Consider prior knowledge from memory if provided

Return ONLY valid JSON matching this schema:
{
  "sub_queries": [
    {
      "id": "<uuid>",
      "question": "<specific sub-question>",
      "rationale": "<why this matters>",
      "priority": <1|2|3>,
      "parent_id": null
    }
  ],
  "strategy": "<overall research approach>",
  "estimated_iterations": <1|2|3>
}
"""


class PlannerAgent:
    def __init__(self) -> None:
        self._llm = ChatOpenAI(
            model=settings.model_name,
            temperature=0.2,
            max_tokens=2048,
            openai_api_key=settings.openai_api_key,
        )

    async def run(self, state: ResearchState) -> ResearchState:
        sid = state.session_id
        await emit(sid, "agent_thinking", "planner", f"Decomposing research query: '{state.query[:80]}...'")

        # Retrieve any relevant prior research from long-term memory
        prior_context = ""
        if knowledge_store.available:
            prior = knowledge_store.search(state.query, n_results=2)
            if prior:
                summaries = [p["document"][:300] for p in prior]
                prior_context = "\n\nRelevant prior research:\n" + "\n---\n".join(summaries)

        user_msg = f"Research query: {state.query}{prior_context}"

        try:
            response = await self._llm.ainvoke([
                SystemMessage(content=_SYSTEM_PROMPT),
                HumanMessage(content=user_msg),
            ])

            raw = response.content.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()

            parsed = json.loads(raw)

            sub_queries = [
                SubQuery(
                    id=sq.get("id", str(uuid.uuid4())),
                    question=sq["question"],
                    rationale=sq["rationale"],
                    priority=sq.get("priority", 1),
                    parent_id=sq.get("parent_id"),
                )
                for sq in parsed["sub_queries"]
            ]

            state.plan = ResearchPlan(
                main_query=state.query,
                sub_queries=sub_queries,
                strategy=parsed.get("strategy", "Systematic research"),
                estimated_iterations=parsed.get("estimated_iterations", 2),
            )

            await emit(
                sid,
                "plan_ready",
                "planner",
                f"Generated research plan with {len(sub_queries)} sub-questions",
                {
                    "sub_queries": [sq.model_dump() for sq in sub_queries],
                    "strategy": state.plan.strategy,
                },
            )

        except Exception as exc:
            logger.error("PlannerAgent failed: %s", exc)
            # Fallback: create a single direct sub-query
            fallback_sq = SubQuery(
                id=str(uuid.uuid4()),
                question=state.query,
                rationale="Direct research (planner fallback)",
                priority=1,
            )
            state.plan = ResearchPlan(
                main_query=state.query,
                sub_queries=[fallback_sq],
                strategy="Direct search",
                estimated_iterations=1,
            )
            await emit(sid, "agent_error", "planner", f"Planning failed, using direct search: {exc}")

        return state
