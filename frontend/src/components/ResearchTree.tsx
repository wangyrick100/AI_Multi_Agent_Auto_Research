import { useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useResearchStore } from '../store/researchStore'
import type { SubQuery } from '../types'

const PRIORITY_COLOR: Record<number, string> = {
  1: '#6366f1',
  2: '#8b5cf6',
  3: '#a78bfa',
}

function buildNodes(mainQuery: string, subQueries: SubQuery[]): Node[] {
  const nodes: Node[] = [
    {
      id: 'root',
      type: 'default',
      position: { x: 300, y: 20 },
      data: { label: mainQuery.length > 60 ? mainQuery.slice(0, 57) + '…' : mainQuery },
      style: {
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '12px',
        fontWeight: '600',
        maxWidth: '240px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
      },
    },
  ]

  subQueries.forEach((sq, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    nodes.push({
      id: sq.id,
      type: 'default',
      position: { x: col * 220 + 50, y: 140 + row * 120 },
      data: { label: sq.question.length > 70 ? sq.question.slice(0, 67) + '…' : sq.question },
      style: {
        background: '#16162b',
        color: '#e2e8f0',
        border: `1.5px solid ${PRIORITY_COLOR[sq.priority] ?? '#1f1f38'}`,
        borderRadius: '8px',
        padding: '8px 10px',
        fontSize: '11px',
        maxWidth: '200px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      },
    })
  })

  return nodes
}

function buildEdges(subQueries: SubQuery[]): Edge[] {
  return subQueries.map((sq) => ({
    id: `root-${sq.id}`,
    source: 'root',
    target: sq.id,
    style: { stroke: '#1f1f38', strokeWidth: 1.5 },
    animated: false,
  }))
}

export function ResearchTree() {
  const plan = useResearchStore((s) => s.session?.plan)

  if (!plan) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-bg-border">
          <h3 className="text-sm font-semibold text-text-primary">Research Plan</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
          Waiting for planner…
        </div>
      </div>
    )
  }

  const initialNodes = buildNodes(plan.main_query, plan.sub_queries)
  const initialEdges = buildEdges(plan.sub_queries)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-bg-border">
        <h3 className="text-sm font-semibold text-text-primary">Research Plan</h3>
        <span className="text-xs text-text-muted">{plan.sub_queries.length} sub-questions</span>
      </div>
      <div className="flex-1">
        <TreeFlow initialNodes={initialNodes} initialEdges={initialEdges} />
      </div>
      {/* Strategy */}
      {plan.strategy && (
        <div className="p-3 border-t border-bg-border text-xs text-text-muted">
          <span className="text-accent-primary font-medium">Strategy: </span>
          {plan.strategy}
        </div>
      )}
    </div>
  )
}

function TreeFlow({ initialNodes, initialEdges }: { initialNodes: Node[]; initialEdges: Edge[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Sync whenever the plan updates
  useEffect(() => { setNodes(initialNodes) }, [initialNodes, setNodes])
  useEffect(() => { setEdges(initialEdges) }, [initialEdges, setEdges])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      attributionPosition="bottom-left"
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable={false}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#1f1f38" />
      <Controls
        style={{ background: '#16162b', border: '1px solid #1f1f38', borderRadius: '8px' }}
        showInteractive={false}
      />
    </ReactFlow>
  )
}
