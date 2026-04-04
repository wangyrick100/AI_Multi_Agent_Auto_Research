import { Brain, Github, RefreshCw } from 'lucide-react'
import { useResearch } from '../hooks/useResearch'

export function Header() {
  const { session, newResearch } = useResearch()

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-bg-border bg-bg-surface/80 backdrop-blur-md sticky top-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center shadow-lg shadow-accent-primary/20">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-semibold text-text-primary tracking-tight">AutoResearch</span>
          <span className="ml-2 text-xs text-text-muted font-mono">v1.0</span>
        </div>
      </div>

      {/* Center — status pill */}
      {session && (
        <div className="flex items-center gap-2">
          <StatusPill status={session.status} iteration={session.iteration} />
        </div>
      )}

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {session && (
          <button
            onClick={newResearch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Research
          </button>
        )}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted hover:text-text-secondary transition-colors"
        >
          <Github className="w-4 h-4" />
        </a>
      </div>
    </header>
  )
}

function StatusPill({ status, iteration }: { status: string; iteration: number }) {
  const config: Record<string, { label: string; color: string; dot: string }> = {
    connecting: { label: 'Connecting', color: 'text-text-muted', dot: 'bg-text-muted' },
    planning: { label: 'Planning', color: 'text-agent-planner', dot: 'bg-agent-planner animate-pulse' },
    exploring: { label: `Exploring · iter ${iteration}`, color: 'text-agent-explorer', dot: 'bg-agent-explorer animate-pulse' },
    extracting: { label: 'Extracting', color: 'text-agent-extractor', dot: 'bg-agent-extractor animate-pulse' },
    critiquing: { label: 'Critiquing', color: 'text-agent-critic', dot: 'bg-agent-critic animate-pulse' },
    synthesizing: { label: 'Synthesizing', color: 'text-agent-synthesizer', dot: 'bg-agent-synthesizer animate-pulse' },
    complete: { label: 'Complete', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    error: { label: 'Error', color: 'text-red-400', dot: 'bg-red-400' },
  }
  const c = config[status] ?? { label: status, color: 'text-text-muted', dot: 'bg-text-muted' }

  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${c.color}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </div>
  )
}
