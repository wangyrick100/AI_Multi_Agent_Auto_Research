import { useCallback, useRef } from 'react'
import { useResearchStore } from '../store/researchStore'
import type { AgentEvent, ResearchConfig } from '../types'

const WS_URL = (sessionId: string) =>
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/${sessionId}`

export function useResearch() {
  const store = useResearchStore()
  const wsRef = useRef<WebSocket | null>(null)

  const startResearch = useCallback(
    (query: string, config: ResearchConfig) => {
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      store.startSession(sessionId, query)

      const ws = new WebSocket(WS_URL(sessionId))
      wsRef.current = ws

      ws.onopen = () => {
        store.setStatus('planning')
        ws.send(
          JSON.stringify({
            type: 'start_research',
            query,
            session_id: sessionId,
            config,
          })
        )
      }

      ws.onmessage = (evt) => {
        let event: AgentEvent
        try {
          event = JSON.parse(evt.data) as AgentEvent
        } catch {
          return
        }

        if (event.type === 'keepalive') return

        store.addEvent(event)
        _handleEvent(event, store)
      }

      ws.onerror = () => {
        store.setError('WebSocket connection error. Is the backend running?')
      }

      ws.onclose = (evt) => {
        if (!evt.wasClean) {
          store.setError('Connection closed unexpectedly')
        }
        wsRef.current = null
      }
    },
    [store]
  )

  const cancelResearch = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User cancelled')
      wsRef.current = null
    }
    store.resetSession()
  }, [store])

  const newResearch = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'New research started')
      wsRef.current = null
    }
    store.resetSession()
  }, [store])

  return {
    session: store.session,
    config: store.config,
    updateConfig: store.updateConfig,
    startResearch,
    cancelResearch,
    newResearch,
    activePanel: store.activePanel,
    setActivePanel: store.setActivePanel,
  }
}

// ── Event dispatcher ──────────────────────────────────────────────────────────

function _handleEvent(event: AgentEvent, store: ReturnType<typeof useResearchStore.getState>) {
  const { data } = event

  switch (event.type) {
    case 'plan_ready': {
      if (data.sub_queries && data.strategy) {
        store.setPlan({
          main_query: store.session?.query ?? '',
          sub_queries: data.sub_queries as never,
          strategy: data.strategy as string,
          estimated_iterations: 2,
        })
      }
      break
    }
    case 'evidence_extracted': {
      if (Array.isArray(data.evidence)) {
        store.addEvidence(data.evidence as never)
      }
      break
    }
    case 'critique_ready': {
      store.setCritique({
        overall_quality: (data.overall_quality as number) ?? 0.5,
        findings: [],
        missing_angles: (data.missing_angles as string[]) ?? [],
        contradictions: (data.contradictions as string[]) ?? [],
        refinement_queries: [],
        should_continue: (data.should_continue as boolean) ?? false,
        reasoning: (data.reasoning as string) ?? '',
      })
      break
    }
    case 'synthesis_ready': {
      if (data.synthesis) {
        store.setSynthesis(data.synthesis as never)
      }
      break
    }
    case 'complete': {
      store.setComplete()
      break
    }
    case 'error': {
      store.setError(event.message)
      break
    }
  }
}
