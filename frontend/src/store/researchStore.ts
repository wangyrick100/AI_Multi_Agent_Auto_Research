import { create } from 'zustand'
import type {
  ResearchSession,
  AgentEvent,
  ResearchPlan,
  Evidence,
  Critique,
  SynthesisReport,
  ResearchStatus,
  ResearchConfig,
} from '../types'

interface ResearchStore {
  // Current session
  session: ResearchSession | null
  config: ResearchConfig

  // Actions
  startSession: (sessionId: string, query: string) => void
  setStatus: (status: ResearchStatus) => void
  addEvent: (event: AgentEvent) => void
  setPlan: (plan: ResearchPlan) => void
  addEvidence: (evidence: Evidence[]) => void
  setCritique: (critique: Critique) => void
  setSynthesis: (synthesis: SynthesisReport) => void
  setError: (message: string) => void
  setComplete: () => void
  resetSession: () => void
  updateConfig: (config: Partial<ResearchConfig>) => void

  // UI state
  activePanel: 'feed' | 'tree' | 'evidence' | 'report'
  setActivePanel: (panel: 'feed' | 'tree' | 'evidence' | 'report') => void
}

const defaultConfig: ResearchConfig = {
  max_iterations: 3,
  include_academic: true,
  include_web: true,
  depth: 'balanced',
}

export const useResearchStore = create<ResearchStore>((set, get) => ({
  session: null,
  config: defaultConfig,
  activePanel: 'feed',

  startSession: (sessionId, query) => {
    set({
      session: {
        sessionId,
        query,
        status: 'connecting',
        iteration: 0,
        events: [],
        plan: null,
        evidence: [],
        critique: null,
        synthesis: null,
        errorMessage: null,
        startedAt: new Date(),
        completedAt: null,
      },
      activePanel: 'feed',
    })
  },

  setStatus: (status) => {
    set((state) => ({
      session: state.session ? { ...state.session, status } : null,
    }))
  },

  addEvent: (event) => {
    set((state) => {
      if (!state.session) return state
      const newStatus = _eventToStatus(event.type, state.session.status)
      return {
        session: {
          ...state.session,
          status: newStatus,
          events: [...state.session.events, event],
        },
      }
    })
  },

  setPlan: (plan) => {
    set((state) => ({
      session: state.session ? { ...state.session, plan } : null,
    }))
  },

  addEvidence: (evidence) => {
    set((state) => ({
      session: state.session
        ? {
            ...state.session,
            evidence: _dedupeEvidence([...state.session.evidence, ...evidence]),
          }
        : null,
    }))
  },

  setCritique: (critique) => {
    set((state) => ({
      session: state.session
        ? {
            ...state.session,
            critique,
            iteration: state.session.iteration + 1,
          }
        : null,
    }))
  },

  setSynthesis: (synthesis) => {
    set((state) => {
      if (!state.session) return state
      return {
        session: { ...state.session, synthesis },
        activePanel: 'report',
      }
    })
  },

  setError: (message) => {
    set((state) => ({
      session: state.session
        ? { ...state.session, status: 'error', errorMessage: message }
        : null,
    }))
  },

  setComplete: () => {
    set((state) => ({
      session: state.session
        ? { ...state.session, status: 'complete', completedAt: new Date() }
        : null,
    }))
  },

  resetSession: () => {
    set({ session: null, activePanel: 'feed' })
  },

  updateConfig: (partial) => {
    set((state) => ({ config: { ...state.config, ...partial } }))
  },

  setActivePanel: (panel) => set({ activePanel: panel }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function _eventToStatus(eventType: string, current: ResearchStatus): ResearchStatus {
  const map: Partial<Record<string, ResearchStatus>> = {
    research_started: 'planning',
    plan_ready: 'exploring',
    agent_searching: 'exploring',
    search_results: 'extracting',
    agent_extracting: 'extracting',
    evidence_extracted: 'critiquing',
    agent_critiquing: 'critiquing',
    critique_ready: 'critiquing',
    agent_synthesizing: 'synthesizing',
    synthesis_ready: 'synthesizing',
    complete: 'complete',
    error: 'error',
  }
  return map[eventType] ?? current
}

function _dedupeEvidence(evidence: Evidence[]): Evidence[] {
  const seen = new Set<string>()
  return evidence.filter((e) => {
    if (seen.has(e.id)) return false
    seen.add(e.id)
    return true
  })
}
