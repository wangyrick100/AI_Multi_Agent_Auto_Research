"""
Long-term knowledge store backed by ChromaDB.
Persists research summaries and key findings for retrieval in future sessions.
"""

from __future__ import annotations
import uuid
import json
import logging
from typing import List, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from backend.config import settings
from backend.models.schemas import MemoryEntry, SynthesisReport

logger = logging.getLogger(__name__)


class KnowledgeStore:
    _COLLECTION = "research_memory"

    def __init__(self) -> None:
        try:
            self._client = chromadb.PersistentClient(
                path=settings.chroma_persist_dir,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            self._collection = self._client.get_or_create_collection(
                name=self._COLLECTION,
                metadata={"hnsw:space": "cosine"},
            )
            logger.info("KnowledgeStore initialized at %s", settings.chroma_persist_dir)
        except Exception as exc:
            logger.warning("ChromaDB unavailable — long-term memory disabled: %s", exc)
            self._client = None
            self._collection = None

    @property
    def available(self) -> bool:
        return self._collection is not None

    def save(self, query: str, report: SynthesisReport) -> Optional[str]:
        """Persist a completed research report to the vector store."""
        if not self.available:
            return None
        try:
            entry_id = str(uuid.uuid4())
            document = f"Query: {query}\n\nSummary: {report.executive_summary}\n\nFindings: {'; '.join(report.key_findings)}"
            metadata = {
                "query": query[:500],
                "key_findings": json.dumps(report.key_findings[:5]),
                "confidence": report.confidence_overall,
                "sources_count": len(report.sources),
            }
            self._collection.add(
                ids=[entry_id],
                documents=[document],
                metadatas=[metadata],
            )
            return entry_id
        except Exception as exc:
            logger.error("Failed to save to KnowledgeStore: %s", exc)
            return None

    def search(self, query: str, n_results: int = 3) -> List[dict]:
        """Retrieve the most relevant prior research summaries."""
        if not self.available:
            return []
        try:
            results = self._collection.query(
                query_texts=[query],
                n_results=min(n_results, self._collection.count()),
                include=["documents", "metadatas", "distances"],
            )
            out = []
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ):
                out.append({"document": doc, "metadata": meta, "distance": dist})
            return out
        except Exception as exc:
            logger.error("KnowledgeStore search failed: %s", exc)
            return []

    def count(self) -> int:
        if not self.available:
            return 0
        try:
            return self._collection.count()
        except Exception:
            return 0


# Singleton
knowledge_store = KnowledgeStore()
