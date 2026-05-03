import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { PlotNode } from '@/types'

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

export const usePlotStore = create create<PlotState>()(
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
      }),

    updateNode: (id, updater) =>
      set((state) => {
        const n = state.nodes[id]
        if (n) updater(n)
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
