from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class ResearchDepth(str, Enum):
    FAST = "fast"
    BALANCED = "balanced"
    DEEP = "deep"


class ResearchConfig(BaseModel):
    max_iterations: int = Field(default=3, ge=1, le=5)
    include_academic: bool = True
    include_web: bool = True
    depth: ResearchDepth = ResearchDepth.BALANCED


class ResearchRequest(BaseModel):
    query: str = Field(..., min_length=10, max_length=2000)
    session_id: str
    config: ResearchConfig = Field(default_factory=ResearchConfig)


class SubQuery(BaseModel):
    id: str
    question: str
    parent_id: Optional[str] = None
    rationale: str
    priority: int = Field(default=1, ge=1, le=3)


class ResearchPlan(BaseModel):
    main_query: str
    sub_queries: List[SubQuery]
    strategy: str
    estimated_iterations: int


class Evidence(BaseModel):
    id: str
    claim: str
    evidence_text: str
    source_url: Optional[str] = None
    source_title: Optional[str] = None
    source_type: str  # "web" | "academic" | "rag"
    confidence: float = Field(ge=0.0, le=1.0)
    relevance: float = Field(ge=0.0, le=1.0)
    sub_query_id: Optional[str] = None
    extracted_at: datetime = Field(default_factory=datetime.utcnow)


class CritiqueFinding(BaseModel):
    category: str  # "gap" | "contradiction" | "weak_evidence" | "strong_coverage"
    description: str
    affected_sub_query_ids: List[str] = Field(default_factory=list)
    severity: str  # "low" | "medium" | "high"


class Critique(BaseModel):
    overall_quality: float = Field(ge=0.0, le=1.0)
    findings: List[CritiqueFinding]
    missing_angles: List[str]
    contradictions: List[str]
    refinement_queries: List[str]
    should_continue: bool
    reasoning: str


class Hypothesis(BaseModel):
    statement: str
    confidence: float = Field(ge=0.0, le=1.0)
    supporting_evidence: List[str]
    counterpoints: List[str]


class SynthesisReport(BaseModel):
    executive_summary: str
    hypotheses: List[Hypothesis]
    key_findings: List[str]
    evidence_summary: List[Dict[str, Any]]
    knowledge_gaps: List[str]
    methodology_notes: str
    confidence_overall: float = Field(ge=0.0, le=1.0)
    markdown_report: str
    sources: List[Dict[str, str]]


class ResearchState(BaseModel):
    """Mutable research session state passed between agents."""
    session_id: str
    query: str
    config: ResearchConfig = Field(default_factory=ResearchConfig)
    iteration: int = 0
    plan: Optional[ResearchPlan] = None
    all_evidence: List[Evidence] = Field(default_factory=list)
    critique: Optional[Critique] = None
    synthesis: Optional[SynthesisReport] = None
    should_continue: bool = True
    error: Optional[str] = None

    def get_max_iterations(self) -> int:
        return self.config.max_iterations

    def increment_iteration(self) -> None:
        self.iteration += 1


class MemoryEntry(BaseModel):
    id: str
    query: str
    report_summary: str
    key_findings: List[str]
    sources: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    embedding_id: Optional[str] = None


class SessionInfo(BaseModel):
    session_id: str
    query: str
    status: str  # "pending" | "planning" | "exploring" | "extracting" | "critiquing" | "synthesizing" | "complete" | "error"
    iteration: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
