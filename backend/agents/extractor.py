"""
Extractor Agent — transforms raw search results into structured Evidence objects.
Uses an LLM to extract claims, rate confidence/relevance, and filter noise.
Emits: agent_extracting, evidence_extracted events.
"""

from __future__ import annotations
import json
import uuid
import logging
from typing import List, Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from backend.config import settings
from backend.event_bus import emit
from backend.models.schemas import ResearchState, Evidence

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are a research evidence extractor. Given a search result and the research question it targets, extract a structured evidence item.

Return ONLY valid JSON:
{
  "claim": "<the core factual claim or finding in one sentence>",
  "evidence_text": "<the most relevant excerpt or paraphrase, max 300 chars>",
  "confidence": <0.0-1.0, how factually certain this claim appears>,
  "relevance": <0.0-1.0, how relevant to the sub-question>,
  "is_useful": <true|false>
}

Be strict: mark is_useful=false for promotional content, thin snippets, or irrelevant results.
"""


class ExtractorAgent:
    def __init__(self) -> None:
        # Use the faster model for extraction since it runs per-result
        self._llm = ChatOpenAI(
            model=settings.fast_model_name,
            temperature=0.0,
            max_tokens=512,
            openai_api_key=settings.openai_api_key,
        )

    async def run(self, state: ResearchState) -> ResearchState:
        sid = state.session_id
        raw = state.__dict__.get("_raw_findings", [])

        if not raw:
            await emit(sid, "agent_thinking", "extractor", "No raw findings to extract from")
            return state

        await emit(sid, "agent_extracting", "extractor", f"Extracting evidence from {len(raw)} raw results")

        # Deduplicate by URL + title to avoid redundant LLM calls
        seen = set()
        unique_raw: List[Dict[str, Any]] = []
        for r in raw:
            key = (r.get("url", ""), r.get("title", ""))
            if key not in seen:
                seen.add(key)
                unique_raw.append(r)

        # Find the sub-query text by ID for context
        sq_map: Dict[str, str] = {}
        if state.plan:
            for sq in state.plan.sub_queries:
                sq_map[sq.id] = sq.question

        import asyncio
        tasks = [
            self._extract_one(r, sq_map.get(r.get("sq_id", ""), state.query))
            for r in unique_raw
        ]
        extracted_list = await asyncio.gather(*tasks, return_exceptions=True)

        new_evidence: List[Evidence] = []
        for raw_result, extracted in zip(unique_raw, extracted_list):
            if isinstance(extracted, Exception) or extracted is None:
                continue
            if not extracted.get("is_useful", False):
                continue
            if extracted.get("relevance", 0) < 0.3:
                continue

            ev = Evidence(
                id=str(uuid.uuid4()),
                claim=extracted["claim"],
                evidence_text=extracted["evidence_text"],
                source_url=raw_result.get("url"),
                source_title=raw_result.get("title"),
                source_type=raw_result.get("search_type", "web"),
                confidence=extracted.get("confidence", 0.5),
                relevance=extracted.get("relevance", 0.5),
                sub_query_id=raw_result.get("sq_id"),
            )
            new_evidence.append(ev)

        state.all_evidence.extend(new_evidence)

        await emit(
            sid,
            "evidence_extracted",
            "extractor",
            f"Extracted {len(new_evidence)} quality evidence items (filtered {len(unique_raw) - len(new_evidence)} low-quality)",
            {"evidence": [e.model_dump() for e in new_evidence[:10]]},  # send top 10 to UI
        )

        return state

    async def _extract_one(self, result: Dict[str, Any], sub_question: str) -> Dict | None:
        snippet = result.get("snippet") or result.get("abstract", "")
        title = result.get("title", "")
        if not snippet and not title:
            return None

        user_content = f"Sub-question: {sub_question}\n\nSource title: {title}\nContent: {snippet[:600]}"
        try:
            response = await self._llm.ainvoke([
                SystemMessage(content=_SYSTEM_PROMPT),
                HumanMessage(content=user_content),
            ])
            raw = response.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1].lstrip("json").strip()
            return json.loads(raw)
        except Exception as exc:
            logger.debug("Extraction LLM call failed for '%s': %s", title[:40], exc)
            return None
