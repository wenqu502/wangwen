import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/shallow'
import { useMemo } from 'react'
import type { RelationEdge } from '@/types'
import { db } from '@/db'

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

export const useRelationStore = create<RelationState>()(
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
        db.relations.add(edge).catch((err) => console.error('[DB] addEdge failed:', err))
      }),

    updateEdge: (id, updater) =>
      set((state) => {
        const e = state.edges[id]
        if (e) {
          updater(e)
          db.relations.put(e).catch((err) => console.error('[DB] updateEdge failed:', err))
        }
      }),

    deleteEdge: (id) =>
      set((state) => {
        delete state.edges[id]
        if (state.selectedId === id) state.selectedId = null
        db.relations.delete(id).catch((err) => console.error('[DB] deleteEdge failed:', err))
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

// === Selector Hooks（性能优化）===

export function useRelationEdgeList(): RelationEdge[] {
  const edges = useRelationStore(useShallow((s) => s.edges))
  return useMemo(() => Object.values(edges), [edges])
}

export function useRelationEdgeCount(): number {
  return useRelationStore((s) => Object.keys(s.edges).length)
}

