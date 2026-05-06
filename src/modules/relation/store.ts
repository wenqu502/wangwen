import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/shallow'
import type { RelationEdge } from '@/types'
import { writeAddRelation, writeUpdateRelation, writeDeleteRelation } from '@/db/operations'

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
  immer((set, get) => ({
    edges: {},
    selectedId: null,
    customRelationTypes: [],

    setEdges: (list) =>
      set((state) => {
        state.edges = {}
        for (const e of list) state.edges[e.id] = e
      }),

    addEdge: (edge) => {
      set((state) => {
        state.edges[edge.id] = edge
      })
      writeAddRelation(edge).then((result) => {
        if (!result.success) {
          set((state) => {
            delete state.edges[edge.id]
          })
          console.error('[Store] addEdge rollback:', result.error)
        }
      })
    },

    updateEdge: (id, updater) => {
      const previous = get().edges[id] ? structuredClone(get().edges[id]) : undefined
      set((state) => {
        const e = state.edges[id]
        if (e) updater(e)
      })
      const updated = get().edges[id]
      if (updated) {
        writeUpdateRelation(updated).then((result) => {
          if (!result.success && previous) {
            set((state) => {
              state.edges[id] = previous
            })
            console.error('[Store] updateEdge rollback:', result.error)
          }
        })
      }
    },

    deleteEdge: (id) => {
      const previous = get().edges[id] ? structuredClone(get().edges[id]) : undefined
      const previousSelected = get().selectedId
      set((state) => {
        delete state.edges[id]
        if (state.selectedId === id) state.selectedId = null
      })
      writeDeleteRelation(id).then((result) => {
        if (!result.success && previous) {
          set((state) => {
            state.edges[id] = previous
            state.selectedId = previousSelected
          })
          console.error('[Store] deleteEdge rollback:', result.error)
        }
      })
    },

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

export const useRelationEdgeList = () =>
  useRelationStore(useShallow((s) => Object.values(s.edges)))

export function useRelationEdgeCount(): number {
  return useRelationStore((s) => Object.keys(s.edges).length)
}
