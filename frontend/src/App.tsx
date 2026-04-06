import { Suspense, lazy } from 'react'
import { useResearch } from './hooks/useResearch'
import { Header } from './components/Header'
import { ResearchInput } from './components/ResearchInput'
import { AgentFeed } from './components/AgentFeed'
import { EvidencePanel } from './components/EvidencePanel'
import { ProgressBar } from './components/ProgressBar'
import { Activity, GitBranch, Database, FileText, AlertCircle } from 'lucide-react'

const ResearchTree = lazy(async () => {
  const module = await import('./components/ResearchTree')
  return { default: module.ResearchTree }
})

const SynthesisReport = lazy(async () => {
  const module = await import('./components/SynthesisReport')
  return { default: module.SynthesisReport }
})

export default function App() {
  const { session, activePanel, setActivePanel, cancelResearch } = useResearch()

  // No active session → show landing / input page
  if (!session) {
    return (
      <div className="min-h-screen">
        <Header />
        <ResearchInput />
      </div>
    )
  }

  const isError = session.status === 'error'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ProgressBar />

      {/* Error banner */}
      {isError && session.errorMessage && (
        <div className="mx-4 mt-4 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1 text-sm">{session.errorMessage}</div>
          <button onClick={cancelResearch} className="text-xs text-red-400/70 hover:text-red-400 underline">
            Start over
          </button>
        </div>
      )}

      {/* Query header */}
      <div className="px-6 py-3 border-b border-bg-border">
        <p className="text-text-muted text-xs mb-0.5">Researching:</p>
        <p className="text-text-primary font-medium text-sm">{session.query}</p>
      </div>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile tab navigation */}
        <div className="flex lg:hidden border-b border-bg-border bg-bg-surface">
          {[
            { key: 'feed', label: 'Activity', icon: <Activity className="w-3.5 h-3.5" /> },
            { key: 'tree', label: 'Plan', icon: <GitBranch className="w-3.5 h-3.5" /> },
            { key: 'evidence', label: 'Evidence', icon: <Database className="w-3.5 h-3.5" /> },
            { key: 'report', label: 'Report', icon: <FileText className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActivePanel(tab.key as typeof activePanel)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                activePanel === tab.key
                  ? 'text-accent-primary border-b-2 border-accent-primary'
                  : 'text-text-muted'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop: 3-column layout + synthesis below */}
        <div className="hidden lg:flex flex-1 overflow-hidden">
          {/* Left: Research Tree */}
          <div className="w-72 flex-shrink-0 border-r border-bg-border bg-bg-surface overflow-hidden flex flex-col">
            <Suspense fallback={<PanelFallback label="Loading research plan..." />}>
              <ResearchTree />
            </Suspense>
          </div>

          {/* Center: Agent Feed */}
          <div className="flex-1 border-r border-bg-border overflow-hidden flex flex-col">
            <AgentFeed />
          </div>

          {/* Right: Evidence */}
          <div className="w-80 flex-shrink-0 overflow-hidden flex flex-col">
            <EvidencePanel />
          </div>
        </div>

        {/* Mobile: single panel */}
        <div className="flex lg:hidden flex-1 overflow-hidden">
          {activePanel === 'feed' && <div className="flex-1 overflow-hidden"><AgentFeed /></div>}
          {activePanel === 'tree' && (
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<PanelFallback label="Loading research plan..." />}>
                <ResearchTree />
              </Suspense>
            </div>
          )}
          {activePanel === 'evidence' && <div className="flex-1 overflow-hidden"><EvidencePanel /></div>}
          {activePanel === 'report' && (
            <div className="flex-1 overflow-y-auto p-4">
              <Suspense fallback={<PanelFallback label="Loading report..." padded />}>
                <SynthesisReport />
              </Suspense>
            </div>
          )}
        </div>

        {/* Bottom: Synthesis Report (desktop only) */}
        {(session.synthesis || session.status === 'synthesizing') && (
          <div className="hidden lg:block border-t border-bg-border max-h-[55vh] overflow-y-auto">
            <div className="p-6">
              <Suspense fallback={<PanelFallback label="Loading report..." padded />}>
                <SynthesisReport />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PanelFallback({ label, padded = false }: { label: string; padded?: boolean }) {
  return (
    <div className={`flex h-full items-center justify-center text-sm text-text-muted ${padded ? 'p-4' : ''}`}>
      {label}
    </div>
  )
}
