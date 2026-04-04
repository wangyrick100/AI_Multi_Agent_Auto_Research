import { useState } from 'react'
import { Search, Settings2, BookOpen, Globe, ChevronDown, ChevronUp, Zap, Scale, Layers } from 'lucide-react'
import { useResearch } from '../hooks/useResearch'
import type { ResearchDepth } from '../types'

const EXAMPLE_QUERIES = [
  'What are the most effective machine learning features for predicting credit default risk?',
  'What is the current state of transformer architectures for multi-modal reasoning?',
  'How do central bank interest rate decisions impact equity market volatility?',
  'What are the key biomarkers for early Alzheimer\'s disease detection?',
]

export function ResearchInput() {
  const { startResearch, config, updateConfig } = useResearch()
  const [query, setQuery] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSubmitting) return
    setIsSubmitting(true)
    startResearch(query.trim(), config)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const handleExample = (q: string) => setQuery(q)

  const depthOptions: { value: ResearchDepth; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'fast', label: 'Fast', icon: <Zap className="w-3.5 h-3.5" />, desc: '1 iteration' },
    { value: 'balanced', label: 'Balanced', icon: <Scale className="w-3.5 h-3.5" />, desc: '2–3 iterations' },
    { value: 'deep', label: 'Deep', icon: <Layers className="w-3.5 h-3.5" />, desc: 'Up to 5 iterations' },
  ]

  const iterMap: Record<ResearchDepth, number> = { fast: 1, balanced: 3, deep: 5 }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-pulse" />
          Multi-Agent · Iterative Refinement · Long-Term Memory
        </div>
        <h1 className="text-5xl font-bold text-text-primary tracking-tight">
          Think like a
          <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent"> researcher</span>
        </h1>
        <p className="text-lg text-text-secondary max-w-xl mx-auto">
          Five specialized agents plan, explore, extract, critique, and synthesize — giving you
          expert-grade research with evidence trails, not just answers.
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to research deeply?"
            rows={3}
            className="w-full pl-12 pr-4 py-4 bg-bg-surface border border-bg-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary/60 focus:ring-1 focus:ring-accent-primary/30 resize-none transition-all"
          />
        </div>

        {/* Config toggle */}
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Research settings
          {showConfig ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showConfig && (
          <div className="glass-panel p-4 space-y-4 animate-fade-in">
            {/* Depth selector */}
            <div>
              <label className="text-xs text-text-muted mb-2 block">Research depth</label>
              <div className="flex gap-2">
                {depthOptions.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => {
                      updateConfig({ depth: d.value, max_iterations: iterMap[d.value] })
                    }}
                    className={`flex-1 flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs transition-all ${
                      config.depth === d.value
                        ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                        : 'border-bg-border text-text-secondary hover:border-bg-border/80'
                    }`}
                  >
                    {d.icon}
                    <span className="font-medium">{d.label}</span>
                    <span className="text-text-muted">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Source toggles */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.include_web}
                  onChange={(e) => updateConfig({ include_web: e.target.checked })}
                  className="accent-accent-primary"
                />
                <Globe className="w-3.5 h-3.5" />
                Web search
              </label>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.include_academic}
                  onChange={(e) => updateConfig({ include_academic: e.target.checked })}
                  className="accent-accent-primary"
                />
                <BookOpen className="w-3.5 h-3.5" />
                Academic papers
              </label>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!query.trim() || isSubmitting}
          className="w-full py-3 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl text-white font-semibold text-base hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-accent-primary/20"
        >
          {isSubmitting ? 'Starting research...' : 'Start deep research →'}
        </button>
      </form>

      {/* Example queries */}
      <div className="mt-10 w-full max-w-2xl">
        <p className="text-xs text-text-muted text-center mb-3">Try an example</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleExample(q)}
              className="text-left text-xs text-text-secondary p-3 rounded-lg border border-bg-border hover:border-accent-primary/30 hover:bg-bg-elevated transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Agent legend */}
      <div className="mt-12 flex flex-wrap justify-center gap-4 text-xs text-text-muted">
        {[
          { name: 'Planner', color: 'bg-agent-planner' },
          { name: 'Explorer', color: 'bg-agent-explorer' },
          { name: 'Extractor', color: 'bg-agent-extractor' },
          { name: 'Critic', color: 'bg-agent-critic' },
          { name: 'Synthesizer', color: 'bg-agent-synthesizer' },
        ].map((a) => (
          <div key={a.name} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${a.color}`} />
            {a.name}
          </div>
        ))}
      </div>
    </div>
  )
}
