import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react'
import { useResearchStore } from '../store/researchStore'
import type { Hypothesis, SynthesisReport as SynthesisReportType } from '../types'

export function SynthesisReport() {
  const synthesis = useResearchStore((s) => s.session?.synthesis)
  const status = useResearchStore((s) => s.session?.status)
  const [activeTab, setActiveTab] = useState<'report' | 'hypotheses' | 'sources'>('report')

  if (!synthesis) {
    if (status === 'synthesizing') {
      return (
        <div className="p-8 text-center space-y-3">
          <div className="flex justify-center gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-agent-synthesizer animate-bounce"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
          <p className="text-text-muted text-sm">Synthesizer agent building your report…</p>
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel overflow-hidden"
    >
      {/* Report header */}
      <div className="p-6 border-b border-bg-border bg-gradient-to-r from-accent-primary/5 to-accent-secondary/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Research Complete</span>
            </div>
            <p className="text-base text-text-primary font-medium leading-relaxed">
              {synthesis.executive_summary}
            </p>
          </div>
          <ConfidenceBadge confidence={synthesis.confidence_overall} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-bg-border">
        {[
          { key: 'report', label: 'Full Report' },
          { key: 'hypotheses', label: `Hypotheses (${synthesis.hypotheses.length})` },
          { key: 'sources', label: `Sources (${synthesis.sources.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-accent-primary text-accent-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'report' && <ReportTab synthesis={synthesis} />}
        {activeTab === 'hypotheses' && <HypothesesTab hypotheses={synthesis.hypotheses} />}
        {activeTab === 'sources' && <SourcesTab sources={synthesis.sources} />}
      </div>
    </motion.div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  const color = pct >= 70 ? 'text-emerald-400 border-emerald-400/30' : pct >= 50 ? 'text-amber-400 border-amber-400/30' : 'text-agent-critic border-agent-critic/30'
  return (
    <div className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border ${color}`}>
      <span className="text-2xl font-bold">{pct}%</span>
      <span className="text-[10px] mt-0.5">confidence</span>
    </div>
  )
}

function ReportTab({ synthesis }: { synthesis: SynthesisReportType }) {
  return (
    <div className="space-y-6">
      {/* Key findings */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-accent-primary" />
          Key Findings
        </h4>
        <ul className="space-y-2">
          {synthesis.key_findings.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="text-accent-primary font-mono text-xs mt-1">{i + 1}.</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Knowledge gaps */}
      {synthesis.knowledge_gaps.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            Knowledge Gaps
          </h4>
          <ul className="space-y-1.5">
            {synthesis.knowledge_gaps.map((g, i) => (
              <li key={i} className="text-sm text-text-muted flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">·</span>
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full markdown report */}
      {synthesis.markdown_report && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-4">Full Report</h4>
          <div className="markdown-report">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {synthesis.markdown_report}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Methodology */}
      {synthesis.methodology_notes && (
        <p className="text-xs text-text-muted italic border-t border-bg-border pt-4">
          {synthesis.methodology_notes}
        </p>
      )}
    </div>
  )
}

function HypothesesTab({ hypotheses }: { hypotheses: Hypothesis[] }) {
  return (
    <div className="space-y-4">
      {hypotheses.map((h, i) => (
        <HypothesisCard key={i} hypothesis={h} index={i} />
      ))}
    </div>
  )
}

function HypothesisCard({ hypothesis: h, index }: { hypothesis: Hypothesis; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const pct = Math.round(h.confidence * 100)

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="text-accent-primary font-bold text-lg leading-none mt-0.5">H{index + 1}</span>
          <p className="text-sm text-text-primary font-medium leading-relaxed">{h.statement}</p>
        </div>
        <div className="flex-shrink-0">
          <div className="text-sm font-semibold text-accent-primary">{pct}%</div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="h-1 bg-bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-text-muted hover:text-text-secondary flex items-center gap-1"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? 'Hide' : 'Show'} evidence & counterpoints
      </button>

      {expanded && (
        <div className="space-y-3 pt-1">
          {h.supporting_evidence.length > 0 && (
            <div>
              <p className="text-xs font-medium text-emerald-400 mb-1">Supporting evidence</p>
              <ul className="space-y-1">
                {h.supporting_evidence.map((e, i) => (
                  <li key={i} className="text-xs text-text-muted flex items-start gap-1.5">
                    <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {h.counterpoints.length > 0 && (
            <div>
              <p className="text-xs font-medium text-agent-critic mb-1">Counterpoints</p>
              <ul className="space-y-1">
                {h.counterpoints.map((c, i) => (
                  <li key={i} className="text-xs text-text-muted flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-agent-critic mt-0.5 flex-shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SourcesTab({ sources }: { sources: Array<{ index: string; title: string; url: string; type: string }> }) {
  return (
    <div className="space-y-2">
      {sources.map((src) => (
        <div key={src.index} className="flex items-center gap-3 py-2 border-b border-bg-border/50 last:border-0">
          <span className="text-xs font-mono text-text-muted w-6 flex-shrink-0">[{src.index}]</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-secondary truncate">{src.title || 'Unknown title'}</p>
            {src.url && (
              <p className="text-xs text-text-muted truncate">{src.url}</p>
            )}
          </div>
          <span className={`text-xs px-1.5 py-0.5 rounded ${src.type === 'academic' ? 'bg-agent-extractor/10 text-agent-extractor' : 'bg-agent-explorer/10 text-agent-explorer'}`}>
            {src.type}
          </span>
          {src.url && (
            <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-accent-primary transition-colors flex-shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
