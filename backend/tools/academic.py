"""
Academic search tool — queries arXiv and optionally Semantic Scholar.
Returns a list of dicts: {title, authors, abstract, url, year, score}.
"""

from __future__ import annotations
import asyncio
import logging
from typing import List, Dict, Any, Optional

from backend.config import settings

logger = logging.getLogger(__name__)


async def academic_search(query: str, max_results: Optional[int] = None) -> List[Dict[str, Any]]:
    """Search academic sources for the given query."""
    n = max_results or settings.max_academic_results
    arxiv_results = await _arxiv_search(query, n)
    return arxiv_results


async def _arxiv_search(query: str, n: int) -> List[Dict[str, Any]]:
    try:
        import arxiv  # type: ignore

        def _sync_search():
            client = arxiv.Client()
            search = arxiv.Search(
                query=query,
                max_results=n,
                sort_by=arxiv.SortCriterion.Relevance,
            )
            papers = []
            for result in client.results(search):
                papers.append({
                    "title": result.title,
                    "authors": [a.name for a in result.authors[:3]],
                    "abstract": result.summary[:800],
                    "url": result.entry_id,
                    "year": result.published.year if result.published else None,
                    "categories": result.categories,
                    "score": 0.7,
                    "source": "arxiv",
                })
            return papers

        return await asyncio.get_event_loop().run_in_executor(None, _sync_search)
    except Exception as exc:
        logger.error("arXiv search failed: %s", exc)
        return []
