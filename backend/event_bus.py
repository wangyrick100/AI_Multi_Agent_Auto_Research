"""
Async event bus for streaming research events from agents to WebSocket clients.
Each research session has a dedicated asyncio.Queue.
"""

import asyncio
from typing import Dict, Optional
from datetime import datetime, timezone

_queues: Dict[str, asyncio.Queue] = {}


def create_queue(session_id: str) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue()
    _queues[session_id] = q
    return q


def get_queue(session_id: str) -> Optional[asyncio.Queue]:
    return _queues.get(session_id)


def remove_queue(session_id: str) -> None:
    _queues.pop(session_id, None)


async def emit(session_id: str, event_type: str, agent: str, message: str, data: dict = None) -> None:
    q = _queues.get(session_id)
    if q is None:
        return
    payload = {
        "type": event_type,
        "agent": agent,
        "message": message,
        "data": data or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id,
    }
    await q.put(payload)


async def emit_complete(session_id: str, result: dict) -> None:
    q = _queues.get(session_id)
    if q is None:
        return
    await q.put({
        "type": "complete",
        "agent": "orchestrator",
        "message": "Research complete",
        "data": result,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id,
    })


async def emit_error(session_id: str, error: str) -> None:
    q = _queues.get(session_id)
    if q is None:
        return
    await q.put({
        "type": "error",
        "agent": "orchestrator",
        "message": error,
        "data": {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": session_id,
    })
