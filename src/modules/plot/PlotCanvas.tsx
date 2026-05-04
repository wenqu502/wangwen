import { useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react'
import { usePlotStore, usePlotNodeList, useSelectedPlotNode } from './store'
import { useAppStore } from '@/stores/app-store'
import type { PlotNode } from '@/types'
import { GitBranch, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateNodeId } from '@/utils/id-generator'

// === 自定义节点组件 ===

interface PlotNodeData {
  node: PlotNode
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

function PlotNodeCard({ data, selected }: { data: PlotNodeData; selected?: boolean }) {
  const { node, onSelect, onDelete } = data

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    written: { bg: 'bg-green-50', text: 'text-green-700', label: '已写' },
    writing: { bg: 'bg-blue-50', text: 'text-blue-700', label: '进行中' },
    todo: { bg: 'bg-gray-50', text: 'text-gray-500', label: '待写' },
    abandoned: { bg: 'bg-red-50', text: 'text-red-500', label: '废弃' },
  }

  const status = statusConfig[node.status] || statusConfig.todo
  const isAbandoned = node.status === 'abandoned'

  return (
    <div
      className={cn(
        'w-[180px] rounded-lg border bg-white shadow-sm transition-all',
        selected
          ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-md'
          : 'border-neutral-200 hover:border-neutral-300',
        isAbandoned && 'opacity-50'
      )}
      onClick={() => onSelect(node.id)}
    >
      {/* 顶部状态条 */}
      <div className={cn('h-1 rounded-t-lg', status.bg.replace('bg-', 'bg-').replace('50', '400'))} />

      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <h4 className={cn('text-sm font-semibold text-neutral-900 truncate flex-1', isAbandoned && 'line-through')}>
            {node.title}
          </h4>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(node.id)
            }}
            className="text-neutral-300 hover:text-red-500 transition-colors shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        <p className={cn('text-xs text-neutral-500 mt-1 line-clamp-2', isAbandoned && 'line-through')}>
          {node.summary}
        </p>

        <div className="flex items-center gap-1.5 mt-2">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', status.bg, status.text)}>
            {status.label}
          </span>
          {node.type !== 'trunk' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">
              {node.type === 'branch' ? '分支' : node.type === 'if' ? '条件' : '伏笔'}
            </span>
          )}
        </div>
      </div>

      {/* 连接点 */}
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-neutral-400" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-neutral-400" />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  plotNode: PlotNodeCard,
}

// === 自动布局：简单的层次布局 ===

function autoLayout(nodes: PlotNode[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}
  const levelMap: Record<string, number> = {}

  // 计算每个节点的层级（从根节点开始的深度）
  function getLevel(nodeId: string): number {
    if (levelMap[nodeId] !== undefined) return levelMap[nodeId]
    const node = nodes.find((n) => n.id === nodeId)
    if (!node || node.parentIds.length === 0) {
      levelMap[nodeId] = 0
      return 0
    }
    const parentLevel = Math.max(...node.parentIds.map(getLevel))
    levelMap[nodeId] = parentLevel + 1
    return levelMap[nodeId]
  }

  nodes.forEach((n) => getLevel(n.id))

  // 按层级分组
  const levelGroups: Record<number, PlotNode[]> = {}
  nodes.forEach((n) => {
    const level = levelMap[n.id] || 0
    if (!levelGroups[level]) levelGroups[level] = []
    levelGroups[level].push(n)
  })

  // 计算位置
  const LEVEL_HEIGHT = 140
  const NODE_WIDTH = 200
  const GAP = 40

  Object.entries(levelGroups).forEach(([level, group]) => {
    const totalWidth = group.length * NODE_WIDTH + (group.length - 1) * GAP
    const startX = -totalWidth / 2 + NODE_WIDTH / 2

    group.forEach((node, index) => {
      positions[node.id] = {
        x: startX + index * (NODE_WIDTH + GAP),
        y: parseInt(level) * LEVEL_HEIGHT,
      }
    })
  })

  return positions
}

// === 主组件 ===

export function PlotCanvas() {
  const nodeList = usePlotNodeList()
  const selectedNode = useSelectedPlotNode()
  const { selectNode, addNode, deleteNode, updateNode } = usePlotStore()
  const currentWorkId = useAppStore((s) => s.currentWorkId)

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // 同步 store 数据到 React Flow
  useEffect(() => {
    if (nodeList.length === 0) {
      setNodes([])
      setEdges([])
      return
    }

    // 自动计算布局位置
    const positions = autoLayout(nodeList)

    const rfNodes: Node[] = nodeList.map((node) => ({
      id: node.id,
      type: 'plotNode',
      position: positions[node.id] || { x: 0, y: 0 },
      data: {
        node,
        onSelect: (id: string) => selectNode(id),
        onDelete: (id: string) => deleteNode(id),
      },
      selected: selectedNode?.id === node.id,
    }))

    const rfEdges: Edge[] = []
    nodeList.forEach((node) => {
      node.parentIds.forEach((parentId) => {
        rfEdges.push({
          id: `${parentId}-${node.id}`,
          source: parentId,
          target: node.id,
          type: 'smoothstep',
          animated: node.type === 'branch',
          style: {
            stroke: node.type === 'branch' ? '#6366f1' : '#9ca3af',
            strokeWidth: node.type === 'branch' ? 2 : 1.5,
            strokeDasharray: node.status === 'abandoned' ? '5 5' : undefined,
          },
        })
      })
    })

    setNodes(rfNodes)
    setEdges(rfEdges)
  }, [nodeList, selectedNode, selectNode, deleteNode, setNodes, setEdges])

  // 节点位置变化时同步回 store
  const onNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      updateNode(node.id, (_n) => {
        // 如果需要持久化位置，可以在这里更新 store
        // 当前 PlotNode 类型没有 position 字段，暂不持久化
        console.log('[PlotCanvas] Node moved:', node.id, node.position)
      })
    },
    [updateNode]
  )

  const handleCreateNode = useCallback(() => {
    const id = generateNodeId()
    addNode({
      id,
      workId: currentWorkId || 'default',
      title: `节点 ${nodeList.length + 1}`,
      summary: '点击编辑节点内容...',
      type: 'trunk',
      status: 'todo',
      characters: [],
      tags: [],
      parentIds: [],
      childIds: [],
      foreshadowing: [],
      payoff: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    selectNode(id)
  }, [addNode, nodeList.length, selectNode, currentWorkId])

  const hasNodes = nodeList.length > 0

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">剧情分支树</h2>
        <button
          onClick={handleCreateNode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>添加节点</span>
        </button>
      </div>

      {!hasNodes ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-400 space-y-3">
          <GitBranch className="w-16 h-16" />
          <div>
            <p className="text-neutral-500 font-medium">还没有剧情节点</p>
            <p className="text-sm mt-1">在右侧 AI 面板说"帮我规划剧情..."</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={(_event, node) => selectNode(node.id)}
            onPaneClick={() => selectNode(null)}
            fitView
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} size={1} color="#e5e7eb" />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const data = node.data as unknown as PlotNodeData
                const status = data?.node?.status
                if (status === 'written') return '#22c55e'
                if (status === 'writing') return '#3b82f6'
                if (status === 'abandoned') return '#ef4444'
                return '#9ca3af'
              }}
              className="!bg-white !border !border-neutral-200 !rounded-lg"
            />
          </ReactFlow>
        </div>
      )}
    </div>
  )
}
