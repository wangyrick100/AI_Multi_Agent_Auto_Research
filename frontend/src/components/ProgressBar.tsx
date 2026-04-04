import { useResearchStore } from '../store/researchStore'
import type { ResearchStatus } from '../types'

const STEPS: { key: ResearchStatus; label: string }[] = [
  { key: 'planning', label: 'Planning' },
  { key: 'exploring', label: 'Exploring' },
  { key: 'extracting', label: 'Extracting' },
  { key: 'critiquing', label: 'Critiquing' },
  { key: 'synthesizing', label: 'Synthesizing' },
]

const STATUS_ORDER: Record<ResearchStatus, number> = {
  idle: -1,
  connecting: 0,
  planning: 1,
  exploring: 2,
  extracting: 3,
  critiquing: 4,
  synthesizing: 5,
  complete: 6,
  error: 99,
}

export function ProgressBar() {
  const status = useResearchStore((s) => s.session?.status ?? 'idle')
  const iteration = useResearchStore((s) => s.session?.iteration ?? 0)
  const evidence = useResearchStore((s) => s.session?.evidence.length ?? 0)

  const currentOrder = STATUS_ORDER[status] ?? 0

  return (
    <div className="px-6 py-3 border-b border-bg-border bg-bg-surface/50 flex items-center gap-6">
      {/* Steps */}
      <div className="flex items-center gap-1 flex-1">
        {STEPS.map((step, i) => {
          const stepOrder = STATUS_ORDER[step.key] ?? 0
          const isDone = currentOrder > stepOrder
          const isActive = currentOrder === stepOrder || (step.key === 'synthesizing' && status === 'complete')

          return (
            <div key={step.key} className="flex items-center">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-accent-primary text-white animate-pulse'
                      : 'bg-bg-elevated text-text-muted border border-bg-border'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </div>
                <span
                  className={`text-xs hidden sm:block ${
                    isDone ? 'text-emerald-400' : isActive ? 'text-accent-primary font-medium' : 'text-text-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-px mx-1 ${isDone ? 'bg-emerald-500/50' : 'bg-bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-text-muted flex-shrink-0">
        {iteration > 0 && <span>Iteration {iteration}</span>}
        {evidence > 0 && <span>{evidence} evidence</span>}
        {status === 'complete' && <span className="text-emerald-400 font-medium">Complete ✓</span>}
      </div>
    </div>
  )
}
