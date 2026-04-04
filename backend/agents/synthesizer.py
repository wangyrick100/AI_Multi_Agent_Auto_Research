"""
Synthesizer Agent — merges all evidence into a structured final research report.
Produces hypotheses, key findings, counterpoints, and a markdown report.
Emits: agent_synthesizing, synthesis_ready events.
"""

from __future__ import annotations
import json
import uuid
import logging

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from backend.config import settings
from backend.event_bus import emit
from backend.models.schemas import ResearchState, SynthesisReport, Hypothesis

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a senior research analyst producing a high-quality synthesis report. \
Based on all collected evidence, produce a comprehensive, rigorous, well-structured report.

Return ONLY valid JSON:
{
  "executive_summary": "<2-3 sentence overview of key conclusions>",
  "hypotheses": [
    {
      "statement": "<a testable hypothesis or key finding>",
      "confidence": <0.0-1.0>,
      "supporting_evidence": ["<evidence point 1>", "..."],
      "counterpoints": ["<opposing view or limitation>"]
    }
  ],
  "key_findings": ["<concise finding 1>", "..."],
  "knowledge_gaps": ["<unanswered question or limitation>"],
  "methodology_notes": "<brief note on research completeness and limitations>",
  "confidence_overall": <0.0-1.0>,
  "markdown_report": "<full markdown report with ## sections: Executive Summary, Key Findings, Detailed Analysis, Counterpoints & Limitations, Knowledge Gaps, Sources>"
}

Requirements:
- Include 2-5 hypotheses
- Include 4-8 key findings  
- The markdown_report must be complete, scholarly, and use proper citation [1], [2] etc.
- Be intellectually honest about uncertainty
"""


class SynthesizerAgent:
    def __init__(self) -> None:
        self._llm = ChatOpenAI(
            model=settings.model_name,
            temperature=0.3,
            max_tokens=settings.max_tokens,
            openai_api_key=settings.openai_api_key,
        )

    async def run(self, state: ResearchState) -> ResearchState:
        sid = state.session_id
        evidence = state.all_evidence

        await emit(
            sid, "agent_synthesizing", "synthesizer",
            f"Synthesizing {len(evidence)} evidence items into final report"
        )

        # Build evidence block for the LLM
        evidence_block = "\n".join([
            f"[{i+1}] ({e.source_type.upper()}, conf={e.confidence:.2f}) {e.claim}\n"
            f"    Source: {e.source_title or 'Unknown'} | {e.source_url or 'N/A'}\n"
            f"    Detail: {e.evidence_text[:300]}"
            for i, e in enumerate(evidence[:40])
        ])

        critique_notes = ""
        if state.critique:
            gaps = "; ".join(state.critique.missing_angles[:5])
            contradictions = "; ".join(state.critique.contradictions[:3])
            critique_notes = f"\n\nKnown gaps: {gaps}\nContradictions: {contradictions}"

        user_content = (
            f"Research query: {state.query}\n\n"
            f"Evidence ({len(evidence)} items, top 40 shown):\n{evidence_block}"
            f"{critique_notes}"
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

            hypotheses = [
                Hypothesis(
                    statement=h["statement"],
                    confidence=h.get("confidence", 0.5),
                    supporting_evidence=h.get("supporting_evidence", []),
                    counterpoints=h.get("counterpoints", []),
                )
                for h in parsed.get("hypotheses", [])
            ]

            sources = [
                {
                    "index": str(i + 1),
                    "title": e.source_title or "Unknown",
                    "url": e.source_url or "",
                    "type": e.source_type,
                }
                for i, e in enumerate(evidence[:40])
            ]

            state.synthesis = SynthesisReport(
                executive_summary=parsed["executive_summary"],
                hypotheses=hypotheses,
                key_findings=parsed.get("key_findings", []),
                evidence_summary=[e.model_dump() for e in evidence[:20]],
                knowledge_gaps=parsed.get("knowledge_gaps", []),
                methodology_notes=parsed.get("methodology_notes", ""),
                confidence_overall=parsed.get("confidence_overall", 0.5),
                markdown_report=parsed.get("markdown_report", ""),
                sources=sources,
            )

            await emit(
                sid,
                "synthesis_ready",
                "synthesizer",
                f"Final report ready — {len(hypotheses)} hypotheses, confidence {state.synthesis.confidence_overall:.0%}",
                {"synthesis": state.synthesis.model_dump()},
            )

        except Exception as exc:
            logger.error("SynthesizerAgent failed: %s", exc)
            # Fallback: produce a plain text synthesis
            fallback_report = self._fallback_report(state)
            state.synthesis = fallback_report
            await emit(
                sid, "synthesis_ready", "synthesizer",
                "Synthesis complete (fallback mode)",
                {"synthesis": state.synthesis.model_dump()},
            )

        return state

    def _fallback_report(self, state: ResearchState) -> SynthesisReport:
        evidence = state.all_evidence
        findings = [f"• {e.claim}" for e in evidence[:10]]
        md = f"## Research Report\n\n**Query:** {state.query}\n\n### Key Findings\n\n" + "\n".join(findings)
        return SynthesisReport(
            executive_summary=f"Research on: {state.query}. Found {len(evidence)} evidence items.",
            hypotheses=[],
            key_findings=[e.claim for e in evidence[:8]],
            evidence_summary=[e.model_dump() for e in evidence[:10]],
            knowledge_gaps=["Full synthesis unavailable due to processing error"],
            methodology_notes="Fallback synthesis — LLM synthesis step failed",
            confidence_overall=0.4,
            markdown_report=md,
            sources=[{"index": str(i+1), "title": e.source_title or "Unknown", "url": e.source_url or "", "type": e.source_type} for i, e in enumerate(evidence[:20])],
        )
