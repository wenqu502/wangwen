import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { RelationEdge } from '@/types'

interface RelationState {
  edges: Record<string, RelationEdge>
  selectedId: string | null
  customRelationTypes: string[]

  setEdges: (list: RelationEdge[]) => void
  addEdge: (edge: RelationEdge) => void
  updateEdge: (id: string, updater: (e: RelationEdge) => void) => void
  deleteEdge: (id: string) => void
  selectEdge: (id: string | null) => void

  addRelationType: (type: string) => void
  removeRelationType: (type: string) => void
}

export const useRelationStore = create create<RelationState>()(
  immer((set) => ({
    edges: {},
    selectedId: null,
    customRelationTypes: [],

    setEdges: (list) =>
      set((state) => {
        state.edges = {}
        for (const e of list) state.edges[e.id] = e
      }),

    addEdge: (edge) =>
      set((state) => {
        state.edges[edge.id] = edge
      }),

    updateEdge: (id, updater) =>
      set((state) => {
        const e = state.edges[id]
        if (e) updater(e)
      }),

    deleteEdge: (id) =>
      set((state) => {
        delete state.edges[id]
        if (state.selectedId === id) state.selectedId = null
      }),

    selectEdge: (id) =>
      set((state) => {
        state.selectedId = id
      }),

    addRelationType: (type) =>
      set((state) => {
        if (!state.customRelationTypes.includes(type)) {
          state.customRelationTypes.push(type)
        }
      }),

    removeRelationType: (type) =>
      set((state) => {
        state.customRelationTypes = state.customRelationTypes.filter((t) => t !== type)
      }),
  }))
)
