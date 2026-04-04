import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useResearchStore } from '../store/researchStore'
import type { AgentEvent, AgentName } from '../types'
import { formatDistanceToNow } from 'date-fns'

const AGENT_CONFIG: Record<AgentName, { label: string; color: string; bgColor: string; dotColor: string }> = {
  planner: { label: 'Planner', color: 'text-agent-planner', bgColor: 'bg-agent-planner/10', dotColor: 'bg-agent-planner' },
  explorer: { label: 'Explorer', color: 'text-agent-explorer', bgColor: 'bg-agent-explorer/10', dotColor: 'bg-agent-explorer' },
  extractor: { label: 'Extractor', color: 'text-agent-extractor', bgColor: 'bg-agent-extractor/10', dotColor: 'bg-agent-extractor' },
  critic: { label: 'Critic', color: 'text-agent-critic', bgColor: 'bg-agent-critic/10', dotColor: 'bg-agent-critic' },
  synthesizer: { label: 'Synthesizer', color: 'text-agent-synthesizer', bgColor: 'bg-agent-synthesizer/10', dotColor: 'bg-agent-synthesizer' },
  orchestrator: { label: 'Orchestrator', color: 'text-text-muted', bgColor: 'bg-bg-elevated', dotColor: 'bg-text-muted' },
}

const PHASE_EVENTS = new Set(['phase_change', 'research_started'])

export function AgentFeed() {
  const events = useResearchStore((s) => s.session?.events ?? [])
  const status = useResearchStore((s) => s.session?.status)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  const visibleEvents = events.filter((e) => e.type !== 'keepalive')

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-bg-border">
        <h3 className="text-sm font-semibold text-text-primary">Agent Activity</h3>
        <span className="text-xs text-text-muted font-mono">{visibleEvents.length} events</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence initial={false}>
          {visibleEvents.map((event, idx) => (
            <EventCard key={`${event.timestamp}-${idx}`} event={event} />
          ))}
        </AnimatePresence>

        {/* Active indicator */}
        {status && !['complete', 'error', 'idle'].includes(status) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 py-2 px-3"
          >
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            <span className="text-xs text-text-muted">Agents working…</span>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function EventCard({ event }: { event: AgentEvent }) {
  const agent = AGENT_CONFIG[event.agent] ?? AGENT_CONFIG.orchestrator
  const isPhase = PHASE_EVENTS.has(event.type)
  const isError = event.type === 'agent_error' || event.type === 'error'

  const data = event.data

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-lg p-3 space-y-1 ${
        isPhase
          ? 'bg-bg-elevated border border-bg-border/50'
          : isError
          ? 'bg-red-500/5 border border-red-500/20'
          : `${agent.bgColor} border border-transparent`
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${agent.dotColor}`} />
          <span className={`text-xs font-semibold ${agent.color}`}>{agent.label}</span>
          <span className="text-xs text-text-muted font-mono">{_formatEventType(event.type)}</span>
        </div>
        <span className="text-[10px] text-text-muted">
          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
        </span>
      </div>

      {/* Message */}
      <p className={`text-sm ${isError ? 'text-red-400' : 'text-text-secondary'} leading-snug`}>
        {event.message}
      </p>

      {/* Data details — show relevant sub-data */}
      {event.type === 'plan_ready' && Array.isArray(data.sub_queries) && (
        <div className="mt-2 space-y-1">
          {(data.sub_queries as Array<{ question: string; priority: number }>).map((sq, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-text-muted">
              <span className="text-accent-primary font-mono mt-0.5">Q{i + 1}</span>
              <span>{sq.question}</span>
            </div>
          ))}
        </div>
      )}

      {event.type === 'search_results' && data.breakdown && (
        <div className="flex gap-3 text-xs text-text-muted mt-1">
          <span className="text-agent-explorer">🌐 {(data.breakdown as Record<string,number>).web ?? 0} web</span>
          <span className="text-emerald-400">📄 {(data.breakdown as Record<string,number>).academic ?? 0} academic</span>
        </div>
      )}

      {event.type === 'critique_ready' && typeof data.overall_quality === 'number' && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-agent-critic to-amber-400 rounded-full"
                style={{ width: `${data.overall_quality as number * 100}%` }}
              />
            </div>
            <span className="text-xs text-text-muted">{Math.round((data.overall_quality as number) * 100)}%</span>
          </div>
          {Array.isArray(data.missing_angles) && (data.missing_angles as string[]).length > 0 && (
            <div className="text-xs text-text-muted">
              Gaps: {(data.missing_angles as string[]).slice(0, 2).join(' · ')}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

function _formatEventType(type: string): string {
  return type.replace(/_/g, ' ')
}
