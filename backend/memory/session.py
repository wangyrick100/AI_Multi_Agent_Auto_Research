"""
Short-term, in-memory session storage for active research sessions.
Cleared when the server restarts. Use long-term knowledge store for persistence.
"""

from typing import Dict, Optional
from datetime import datetime, timezone
from backend.models.schemas import ResearchState, SessionInfo


class SessionStore:
    def __init__(self) -> None:
        self._states: Dict[str, ResearchState] = {}
        self._info: Dict[str, SessionInfo] = {}

    def create(self, session_id: str, query: str) -> SessionInfo:
        info = SessionInfo(session_id=session_id, query=query, status="pending", iteration=0)
        self._info[session_id] = info
        return info

    def set_state(self, state: ResearchState) -> None:
        self._states[state.session_id] = state

    def get_state(self, session_id: str) -> Optional[ResearchState]:
        return self._states.get(session_id)

    def get_info(self, session_id: str) -> Optional[SessionInfo]:
        return self._info.get(session_id)

    def update_query(self, session_id: str, query: str) -> None:
        if session_id in self._info:
            self._info[session_id].query = query

    def update_status(self, session_id: str, status: str) -> None:
        if session_id in self._info:
            self._info[session_id].status = status
            if status in ("complete", "error"):
                self._info[session_id].completed_at = datetime.now(timezone.utc)

    def list_sessions(self) -> list:
        return [info.model_dump() for info in self._info.values()]

    def delete(self, session_id: str) -> None:
        self._states.pop(session_id, None)
        self._info.pop(session_id, None)


# Singleton instance reused across the lifetime of the server process
session_store = SessionStore()
