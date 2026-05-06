import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/shallow'
import type { Idea } from '@/types'
import { writeAddIdea, writeUpdateIdea, writeDeleteIdea } from '@/db/operations'

interface IdeaState {
  ideas: Record<string, Idea>
  selectedId: string | null

  setIdeas: (list: Idea[]) => void
  addIdea: (idea: Idea) => void
  updateIdea: (id: string, updater: (i: Idea) => void) => void
  deleteIdea: (id: string) => void
  selectIdea: (id: string | null) => void

  archiveIdea: (id: string) => void
  linkIdea: (id: string, entity: { type: 'node' | 'character' | 'system'; id: string }) => void
  unlinkIdea: (id: string) => void
}

export const useIdeaStore = create<IdeaState>()(
  immer((set, get) => ({
    ideas: {},
    selectedId: null,

    setIdeas: (list) =>
      set((state) => {
        state.ideas = {}
        for (const i of list) state.ideas[i.id] = i
      }),

    addIdea: (idea) => {
      set((state) => {
        state.ideas[idea.id] = idea
      })
      writeAddIdea(idea).then((result) => {
        if (!result.success) {
          set((state) => {
            delete state.ideas[idea.id]
          })
          console.error('[Store] addIdea rollback:', result.error)
        }
      })
    },

    updateIdea: (id, updater) => {
      const previous = get().ideas[id] ? structuredClone(get().ideas[id]) : undefined
      set((state) => {
        const i = state.ideas[id]
        if (i) updater(i)
      })
      const updated = get().ideas[id]
      if (updated) {
        writeUpdateIdea(updated).then((result) => {
          if (!result.success && previous) {
            set((state) => {
              state.ideas[id] = previous
            })
            console.error('[Store] updateIdea rollback:', result.error)
          }
        })
      }
    },

    deleteIdea: (id) => {
      const previous = get().ideas[id] ? structuredClone(get().ideas[id]) : undefined
      const previousSelected = get().selectedId
      set((state) => {
        delete state.ideas[id]
        if (state.selectedId === id) state.selectedId = null
      })
      writeDeleteIdea(id).then((result) => {
        if (!result.success && previous) {
          set((state) => {
            state.ideas[id] = previous
            state.selectedId = previousSelected
          })
          console.error('[Store] deleteIdea rollback:', result.error)
        }
      })
    },

    archiveIdea: (id) => {
      const previous = get().ideas[id] ? structuredClone(get().ideas[id]) : undefined
      set((state) => {
        const i = state.ideas[id]
        if (i) i.status = 'archived'
      })
      const updated = get().ideas[id]
      if (updated) {
        writeUpdateIdea(updated).then((result) => {
          if (!result.success && previous) {
            set((state) => {
              state.ideas[id] = previous
            })
            console.error('[Store] archiveIdea rollback:', result.error)
          }
        })
      }
    },

    linkIdea: (id, entity) => {
      const previous = get().ideas[id] ? structuredClone(get().ideas[id]) : undefined
      set((state) => {
        const i = state.ideas[id]
        if (i) i.linkedEntity = entity
      })
      const updated = get().ideas[id]
      if (updated) {
        writeUpdateIdea(updated).then((result) => {
          if (!result.success && previous) {
            set((state) => {
              state.ideas[id] = previous
            })
            console.error('[Store] linkIdea rollback:', result.error)
          }
        })
      }
    },

    unlinkIdea: (id) => {
      const previous = get().ideas[id] ? structuredClone(get().ideas[id]) : undefined
      set((state) => {
        const i = state.ideas[id]
        if (i) i.linkedEntity = undefined
      })
      const updated = get().ideas[id]
      if (updated) {
        writeUpdateIdea(updated).then((result) => {
          if (!result.success && previous) {
            set((state) => {
              state.ideas[id] = previous
            })
            console.error('[Store] unlinkIdea rollback:', result.error)
          }
        })
      }
    },

    selectIdea: (id) =>
      set((state) => {
        state.selectedId = id
      }),
  }))
)

// === Selector Hooks（性能优化）===

export const useIdeaList = () =>
  useIdeaStore(useShallow((s) => Object.values(s.ideas)))

export function useIdeaCount(): number {
  return useIdeaStore((s) => Object.keys(s.ideas).length)
}
