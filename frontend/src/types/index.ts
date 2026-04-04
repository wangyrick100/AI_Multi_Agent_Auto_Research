// ── Agent event types streamed over WebSocket ──────────────────────────────────

export type AgentName =
  | 'planner'
  | 'explorer'
  | 'extractor'
  | 'critic'
  | 'synthesizer'
  | 'orchestrator'

export type EventType =
  | 'research_started'
  | 'phase_change'
  | 'agent_thinking'
  | 'plan_ready'
  | 'agent_searching'
  | 'search_results'
  | 'agent_extracting'
  | 'evidence_extracted'
  | 'agent_critiquing'
  | 'critique_ready'
  | 'agent_synthesizing'
  | 'synthesis_ready'
  | 'agent_error'
  | 'complete'
  | 'error'
  | 'keepalive'

export interface AgentEvent {
  type: EventType
  agent: AgentName
  message: string
  data: Record<string, unknown>
  timestamp: string
  session_id: string
}

// ── Research plan structures ───────────────────────────────────────────────────

export interface SubQuery {
  id: string
  question: string
  rationale: string
  priority: 1 | 2 | 3
  parent_id: string | null
}

export interface ResearchPlan {
  main_query: string
  sub_queries: SubQuery[]
  strategy: string
  estimated_iterations: number
}

// ── Evidence ───────────────────────────────────────────────────────────────────

export interface Evidence {
  id: string
  claim: string
  evidence_text: string
  source_url: string | null
  source_title: string | null
  source_type: 'web' | 'academic' | 'rag'
  confidence: number
  relevance: number
  sub_query_id: string | null
}

// ── Critique ──────────────────────────────────────────────────────────────────

export interface CritiqueFinding {
  category: 'gap' | 'contradiction' | 'weak_evidence' | 'strong_coverage'
  description: string
  affected_sub_query_ids: string[]
  severity: 'low' | 'medium' | 'high'
}

export interface Critique {
  overall_quality: number
  findings: CritiqueFinding[]
  missing_angles: string[]
  contradictions: string[]
  refinement_queries: string[]
  should_continue: boolean
  reasoning: string
}

// ── Synthesis ─────────────────────────────────────────────────────────────────

export interface Hypothesis {
  statement: string
  confidence: number
  supporting_evidence: string[]
  counterpoints: string[]
}

export interface SynthesisReport {
  executive_summary: string
  hypotheses: Hypothesis[]
  key_findings: string[]
  evidence_summary: Evidence[]
  knowledge_gaps: string[]
  methodology_notes: string
  confidence_overall: number
  markdown_report: string
  sources: Array<{ index: string; title: string; url: string; type: string }>
}

// ── Session state ─────────────────────────────────────────────────────────────

export type ResearchStatus =
  | 'idle'
  | 'connecting'
  | 'planning'
  | 'exploring'
  | 'extracting'
  | 'critiquing'
  | 'synthesizing'
  | 'complete'
  | 'error'

export interface ResearchSession {
  sessionId: string
  query: string
  status: ResearchStatus
  iteration: number
  events: AgentEvent[]
  plan: ResearchPlan | null
  evidence: Evidence[]
  critique: Critique | null
  synthesis: SynthesisReport | null
  errorMessage: string | null
  startedAt: Date | null
  completedAt: Date | null
}

// ── Config ────────────────────────────────────────────────────────────────────

export type ResearchDepth = 'fast' | 'balanced' | 'deep'

export interface ResearchConfig {
  max_iterations: number
  include_academic: boolean
  include_web: boolean
  depth: ResearchDepth
}
