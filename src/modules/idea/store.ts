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
  immer((set) => ({
    ideas: {},
    selectedId: null,

    setIdeas: (list) =>
      set((state) => {
        state.ideas = {}
        for (const i of list) state.ideas[i.id] = i
      }),

    addIdea: (idea) =>
      set((state) => {
        state.ideas[idea.id] = idea
        writeAddIdea(idea).catch((err) => console.error('[DB] addIdea failed:', err))
      }),

    updateIdea: (id, updater) =>
      set((state) => {
        const i = state.ideas[id]
        if (i) {
          updater(i)
          writeUpdateIdea(i).catch((err) => console.error('[DB] updateIdea failed:', err))
        }
      }),

    deleteIdea: (id) =>
      set((state) => {
        delete state.ideas[id]
        if (state.selectedId === id) state.selectedId = null
        writeDeleteIdea(id).catch((err) => console.error('[DB] deleteIdea failed:', err))
      }),

    archiveIdea: (id) =>
      set((state) => {
        const i = state.ideas[id]
        if (i) {
          i.status = 'archived'
          writeUpdateIdea(i).catch((err) => console.error('[DB] archiveIdea failed:', err))
        }
      }),

    linkIdea: (id, entity) =>
      set((state) => {
        const i = state.ideas[id]
        if (i) {
          i.linkedEntity = entity
          writeUpdateIdea(i).catch((err) => console.error('[DB] linkIdea failed:', err))
        }
      }),

    unlinkIdea: (id) =>
      set((state) => {
        const i = state.ideas[id]
        if (i) {
          i.linkedEntity = undefined
          writeUpdateIdea(i).catch((err) => console.error('[DB] unlinkIdea failed:', err))
        }
      }),

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

