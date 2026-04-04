"""
Web search tool — primary: Tavily, fallback: DuckDuckGo.
Returns a list of dicts: {title, url, snippet, score}.
"""

from __future__ import annotations
import logging
from typing import List, Dict, Any, Optional

from backend.config import settings

logger = logging.getLogger(__name__)


async def web_search(query: str, max_results: Optional[int] = None) -> List[Dict[str, Any]]:
    """Unified async web search. Falls back to DuckDuckGo when Tavily is unavailable."""
    n = max_results or settings.max_web_results

    if settings.tavily_api_key:
        return await _tavily_search(query, n)
    return await _ddg_search(query, n)


async def _tavily_search(query: str, n: int) -> List[Dict[str, Any]]:
    try:
        from tavily import AsyncTavilyClient  # type: ignore
        client = AsyncTavilyClient(api_key=settings.tavily_api_key)
        response = await client.search(
            query=query,
            max_results=n,
            search_depth="advanced",
            include_answer=False,
            include_raw_content=False,
        )
        results = []
        for r in response.get("results", []):
            results.append({
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "snippet": r.get("content", ""),
                "score": r.get("score", 0.5),
                "source": "tavily",
            })
        return results
    except Exception as exc:
        logger.warning("Tavily search failed (%s) — falling back to DuckDuckGo", exc)
        return await _ddg_search(query, n)


async def _ddg_search(query: str, n: int) -> List[Dict[str, Any]]:
    try:
        import asyncio
        from duckduckgo_search import DDGS  # type: ignore

        def _sync_search():
            with DDGS() as ddgs:
                return list(ddgs.text(query, max_results=n))

        raw = await asyncio.get_event_loop().run_in_executor(None, _sync_search)
        results = []
        for r in raw:
            results.append({
                "title": r.get("title", ""),
                "url": r.get("href", ""),
                "snippet": r.get("body", ""),
                "score": 0.5,
                "source": "duckduckgo",
            })
        return results
    except Exception as exc:
        logger.error("DuckDuckGo search also failed: %s", exc)
        return []
