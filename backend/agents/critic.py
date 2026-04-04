"""
Critic Agent — evaluates evidence quality, identifies gaps and contradictions,
and decides whether another research iteration is warranted.
Emits: agent_critiquing, critique_ready events.
"""

from __future__ import annotations
import json
import logging
from typing import List

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from backend.config import settings
from backend.event_bus import emit
from backend.models.schemas import ResearchState, Critique, CritiqueFinding

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a rigorous research critic. Evaluate the collected evidence against the research plan and identify weaknesses.

Assess:
1. Coverage — are all sub-questions adequately addressed?
2. Contradictions — are there conflicting claims?
3. Evidence quality — is the evidence specific, sourced, and credible?
4. Missing angles — what important perspectives are absent?
5. Overall readiness — is this ready for synthesis, or should we search more?

Return ONLY valid JSON:
{
  "overall_quality": <0.0-1.0>,
  "findings": [
    {"category": "gap|contradiction|weak_evidence|strong_coverage", "description": "...", "affected_sub_query_ids": ["..."], "severity": "low|medium|high"}
  ],
  "missing_angles": ["..."],
  "contradictions": ["..."],
  "refinement_queries": ["<specific search query to fill a gap>"],
  "should_continue": <true|false>,
  "reasoning": "<one paragraph justifying the decision>"
}

Set should_continue=true ONLY if there are high-severity gaps AND we haven't exhausted useful lines of inquiry.
"""


class CriticAgent:
    def __init__(self) -> None:
        self._llm = ChatOpenAI(
            model=settings.model_name,
            temperature=0.1,
            max_tokens=2048,
            openai_api_key=settings.openai_api_key,
        )

    async def run(self, state: ResearchState) -> ResearchState:
        sid = state.session_id
        evidence = state.all_evidence

        await emit(sid, "agent_critiquing", "critic", f"Evaluating {len(evidence)} evidence items for quality and coverage")

        if not evidence:
            state.critique = Critique(
                overall_quality=0.0,
                findings=[CritiqueFinding(
                    category="gap",
                    description="No evidence was collected",
                    severity="high",
                )],
                missing_angles=["All aspects uncovered"],
                contradictions=[],
                refinement_queries=[state.query],
                should_continue=state.iteration < state.get_max_iterations() - 1,
                reasoning="No evidence found. Will retry.",
            )
            await emit(sid, "critique_ready", "critic", "No evidence found — triggering refinement")
            return state

        # Summarize evidence for the LLM (don't overwhelm context)
        evidence_summary = "\n".join([
            f"- [{e.source_type.upper()}] {e.claim} (confidence={e.confidence:.2f}, relevance={e.relevance:.2f}) — {e.source_title or 'Unknown source'}"
            for e in evidence[:30]
        ])

        sub_questions = ""
        if state.plan:
            sub_questions = "\n".join([f"- [{sq.id[:8]}] {sq.question}" for sq in state.plan.sub_queries])

        user_content = (
            f"Research query: {state.query}\n\n"
            f"Sub-questions:\n{sub_questions}\n\n"
            f"Evidence collected ({len(evidence)} items, showing first 30):\n{evidence_summary}\n\n"
            f"Current iteration: {state.iteration + 1} / {state.get_max_iterations()}"
        )

        try:
            response = await self._llm.ainvoke([
                SystemMessage(content=_SYSTEM_PROMPT),
                HumanMessage(content=user_content),
            ])
            raw = response.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1].lstrip("json").strip()
            parsed = json.loads(raw)

            findings = [
                CritiqueFinding(
                    category=f.get("category", "gap"),
                    description=f.get("description", ""),
                    affected_sub_query_ids=f.get("affected_sub_query_ids", []),
                    severity=f.get("severity", "medium"),
                )
                for f in parsed.get("findings", [])
            ]

            # Force no further iterations if at limit
            force_stop = state.iteration >= state.get_max_iterations() - 1
            should_continue = parsed.get("should_continue", False) and not force_stop

            state.critique = Critique(
                overall_quality=parsed.get("overall_quality", 0.5),
                findings=findings,
                missing_angles=parsed.get("missing_angles", []),
                contradictions=parsed.get("contradictions", []),
                refinement_queries=parsed.get("refinement_queries", [])[:3],
                should_continue=should_continue,
                reasoning=parsed.get("reasoning", ""),
            )
            state.should_continue = should_continue

            severity_counts = {"high": 0, "medium": 0, "low": 0}
            for f in findings:
                severity_counts[f.severity] = severity_counts.get(f.severity, 0) + 1

            await emit(
                sid,
                "critique_ready",
                "critic",
                f"Quality: {state.critique.overall_quality:.0%} — {'Refining' if should_continue else 'Ready for synthesis'} (iter {state.iteration + 1}/{state.get_max_iterations()})",
                {
                    "overall_quality": state.critique.overall_quality,
                    "should_continue": should_continue,
                    "severity_counts": severity_counts,
                    "missing_angles": state.critique.missing_angles,
                    "contradictions": state.critique.contradictions,
                    "reasoning": state.critique.reasoning,
                },
            )

        except Exception as exc:
            logger.error("CriticAgent failed: %s", exc)
            state.critique = Critique(
                overall_quality=0.6,
                findings=[],
                missing_angles=[],
                contradictions=[],
                refinement_queries=[],
                should_continue=False,
                reasoning=f"Critic error — proceeding to synthesis: {exc}",
            )
            state.should_continue = False
            await emit(sid, "agent_error", "critic", f"Critique failed: {exc} — proceeding to synthesis")

        return state
