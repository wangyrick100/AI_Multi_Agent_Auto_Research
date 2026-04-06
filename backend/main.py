"""
FastAPI application — REST + WebSocket endpoints for the Auto Research system.

WebSocket protocol (session-scoped):
  Client  → Server: { "type": "start_research", "query": "...", "config": {...} }
  Server  → Client: stream of AgentEvent JSON objects
  Final:            { "type": "complete", "data": { synthesis, evidence_count, ... } }
"""

from __future__ import annotations
import asyncio
import uuid
import logging
from contextlib import asynccontextmanager, suppress
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from backend.config import settings
from backend import event_bus
from backend.models.schemas import ResearchRequest, ResearchConfig
from backend.memory.session import session_store
from backend.memory.knowledge import knowledge_store
from backend.agents.orchestrator import orchestrator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AutoResearch backend starting up")
    logger.info("LLM model: %s  |  Knowledge store: %s", settings.model_name, "OK" if knowledge_store.available else "OFFLINE")
    yield
    logger.info("AutoResearch backend shutting down")


app = FastAPI(
    title="AutoResearch API",
    description="Multi-agent research system with iterative refinement",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── REST endpoints ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "model": settings.model_name,
        "knowledge_store": knowledge_store.available,
        "knowledge_entries": knowledge_store.count(),
    }


@app.get("/sessions")
async def list_sessions() -> dict:
    return {"sessions": session_store.list_sessions()}


@app.get("/sessions/{session_id}")
async def get_session(session_id: str) -> dict:
    info = session_store.get_info(session_id)
    if not info:
        raise HTTPException(status_code=404, detail="Session not found")
    state = session_store.get_state(session_id)
    return {
        "info": info.model_dump(),
        "evidence_count": len(state.all_evidence) if state else 0,
        "has_synthesis": state.synthesis is not None if state else False,
    }


@app.get("/sessions/{session_id}/report")
async def get_report(session_id: str) -> dict:
    state = session_store.get_state(session_id)
    if not state or not state.synthesis:
        raise HTTPException(status_code=404, detail="Report not ready")
    return {"synthesis": state.synthesis.model_dump()}


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str) -> dict:
    session_store.delete(session_id)
    event_bus.remove_queue(session_id)
    return {"deleted": session_id}


# ── WebSocket endpoint ──────────────────────────────────────────────────────────

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str) -> None:
    await websocket.accept()
    logger.info("WebSocket connected: %s", session_id)

    queue = event_bus.create_queue(session_id)
    session_store.create(session_id, query="pending")
    research_task: asyncio.Task | None = None

    try:
        # Wait for the start_research message
        raw_msg: Any = await asyncio.wait_for(websocket.receive_json(), timeout=30.0)

        if raw_msg.get("type") != "start_research":
            await websocket.send_json({"type": "error", "message": "Expected start_research message"})
            return

        query: str = raw_msg.get("query", "").strip()
        if not query:
            await websocket.send_json({"type": "error", "message": "Query is required"})
            return

        config_data = raw_msg.get("config", {})
        try:
            config = ResearchConfig(**config_data)
        except (ValidationError, TypeError):
            config = ResearchConfig()

        # Update session with real query
        session_store.update_query(session_id, query)

        # Launch research as a background task
        research_task = asyncio.create_task(orchestrator.run(query, session_id, config))

        # Stream events from queue to client until complete/error
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=120.0)
                await websocket.send_json(event)
                if event.get("type") in ("complete", "error"):
                    break
            except asyncio.TimeoutError:
                if research_task.done():
                    break
                # Send keepalive ping
                await websocket.send_json({"type": "keepalive"})

        await research_task  # Ensure task cleanup

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected: %s", session_id)
    except asyncio.TimeoutError:
        await websocket.send_json({"type": "error", "message": "Connection timed out waiting for query"})
    except Exception as exc:
        logger.error("WebSocket error [%s]: %s", session_id, exc, exc_info=True)
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass
    finally:
        if research_task and not research_task.done():
            research_task.cancel()
            with suppress(asyncio.CancelledError):
                await research_task
        event_bus.remove_queue(session_id)
        logger.info("WebSocket cleanup complete: %s", session_id)
