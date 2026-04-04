import { ExternalLink, BookOpen, Globe, Database, TrendingUp, TrendingDown } from 'lucide-react'
import { useResearchStore } from '../store/researchStore'
import type { Evidence } from '../types'

export function EvidencePanel() {
  const evidence = useResearchStore((s) => s.session?.evidence ?? [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-bg-border">
        <h3 className="text-sm font-semibold text-text-primary">Evidence</h3>
        <span className="text-xs text-text-muted">{evidence.length} items</span>
      </div>

      {evidence.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
          Evidence will appear here…
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Quick stats */}
          <EvidenceStats evidence={evidence} />

          {/* Evidence cards sorted by relevance */}
          {[...evidence]
            .sort((a, b) => b.relevance - a.relevance)
            .map((ev) => (
              <EvidenceCard key={ev.id} evidence={ev} />
            ))}
        </div>
      )}
    </div>
  )
}

function EvidenceStats({ evidence }: { evidence: Evidence[] }) {
  const web = evidence.filter((e) => e.source_type === 'web').length
  const academic = evidence.filter((e) => e.source_type === 'academic').length
  const avgConf = evidence.reduce((s, e) => s + e.confidence, 0) / evidence.length

  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      {[
        { label: 'Web', value: web, icon: <Globe className="w-3 h-3" />, color: 'text-agent-explorer' },
        { label: 'Academic', value: academic, icon: <BookOpen className="w-3 h-3" />, color: 'text-agent-extractor' },
        { label: 'Avg conf', value: `${Math.round(avgConf * 100)}%`, icon: <Database className="w-3 h-3" />, color: 'text-accent-primary' },
      ].map((stat) => (
        <div key={stat.label} className="glass-panel p-2 text-center">
          <div className={`flex justify-center mb-1 ${stat.color}`}>{stat.icon}</div>
          <div className="text-sm font-semibold text-text-primary">{stat.value}</div>
          <div className="text-[10px] text-text-muted">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

function EvidenceCard({ evidence: ev }: { evidence: Evidence }) {
  const typeIcon = ev.source_type === 'academic'
    ? <BookOpen className="w-3 h-3" />
    : <Globe className="w-3 h-3" />

  const confHigh = ev.confidence >= 0.7
  const confLow = ev.confidence < 0.4

  return (
    <div className="evidence-card animate-slide-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <span className={`${ev.source_type === 'academic' ? 'text-agent-extractor' : 'text-agent-explorer'}`}>
            {typeIcon}
          </span>
          <span className="truncate max-w-[140px]">{ev.source_title ?? 'Unknown source'}</span>
        </div>
        <div className="flex items-center gap-1">
          {confHigh
            ? <TrendingUp className="w-3 h-3 text-emerald-400" />
            : confLow
            ? <TrendingDown className="w-3 h-3 text-agent-critic" />
            : null}
          <span className={`text-[10px] font-mono ${confHigh ? 'text-emerald-400' : confLow ? 'text-agent-critic' : 'text-text-muted'}`}>
            {Math.round(ev.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Claim */}
      <p className="text-xs text-text-primary leading-relaxed font-medium">{ev.claim}</p>

      {/* Evidence text */}
      <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">{ev.evidence_text}</p>

      {/* Relevance bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-0.5 bg-bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary rounded-full"
            style={{ width: `${ev.relevance * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-text-muted">rel {Math.round(ev.relevance * 100)}%</span>
        {ev.source_url && (
          <a
            href={ev.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-accent-primary transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}
