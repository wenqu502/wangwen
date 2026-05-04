import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/shallow'
import type { PlotNode } from '@/types'
import { writeAddPlotNode, writeUpdatePlotNode, writeDeletePlotNode } from '@/db/operations'

interface PlotState {
  nodes: Record<string, PlotNode>
  selectedId: string | null

  setNodes: (list: PlotNode[]) => void
  addNode: (node: PlotNode) => void
  updateNode: (id: string, updater: (n: PlotNode) => void) => void
  deleteNode: (id: string) => void
  selectNode: (id: string | null) => void

  // 连线操作
  addEdge: (sourceId: string, targetId: string) => void
  removeEdge: (sourceId: string, targetId: string) => void
}

export const usePlotStore = create<PlotState>()(
  immer((set) => ({
    nodes: {},
    selectedId: null,

    setNodes: (list) =>
      set((state) => {
        state.nodes = {}
        for (const n of list) state.nodes[n.id] = n
      }),

    addNode: (node) =>
      set((state) => {
        state.nodes[node.id] = node
        writeAddPlotNode(node).catch((err) => console.error('[DB] addNode failed:', err))
      }),

    updateNode: (id, updater) =>
      set((state) => {
        const n = state.nodes[id]
        if (n) {
          updater(n)
          writeUpdatePlotNode(n).catch((err) => console.error('[DB] updateNode failed:', err))
        }
      }),

    deleteNode: (id) =>
      set((state) => {
        delete state.nodes[id]
        if (state.selectedId === id) state.selectedId = null
        // 清理其他节点的引用
        for (const n of Object.values(state.nodes)) {
          n.parentIds = n.parentIds.filter((pid) => pid !== id)
          n.childIds = n.childIds.filter((cid) => cid !== id)
        }
        writeDeletePlotNode(id).catch((err) => console.error('[DB] deleteNode failed:', err))
      }),

    selectNode: (id) =>
      set((state) => {
        state.selectedId = id
      }),

    addEdge: (sourceId, targetId) =>
      set((state) => {
        const source = state.nodes[sourceId]
        const target = state.nodes[targetId]
        if (source && target) {
          if (!source.childIds.includes(targetId)) source.childIds.push(targetId)
          if (!target.parentIds.includes(sourceId)) target.parentIds.push(sourceId)
        }
      }),

    removeEdge: (sourceId, targetId) =>
      set((state) => {
        const source = state.nodes[sourceId]
        const target = state.nodes[targetId]
        if (source) source.childIds = source.childIds.filter((id) => id !== targetId)
        if (target) target.parentIds = target.parentIds.filter((id) => id !== sourceId)
      }),
  }))
)

// === Selector Hooks（性能优化）===

export const usePlotNodeList = () =>
  usePlotStore(useShallow((s) => Object.values(s.nodes)))

export function usePlotNodeCount(): number {
  return usePlotStore((s) => Object.keys(s.nodes).length)
}

export function useSelectedPlotNode(): PlotNode | null {
  return usePlotStore((s) => (s.selectedId ? s.nodes[s.selectedId] : null))
}

