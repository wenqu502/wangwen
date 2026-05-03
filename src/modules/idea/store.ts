import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Idea } from '@/types'

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
      }),

    updateIdea: (id, updater) =>
      set((state) => {
        const i = state.ideas[id]
        if (i) updater(i)
      }),

    deleteIdea: (id) =>
      set((state) => {
        delete state.ideas[id]
        if (state.selectedId === id) state.selectedId = null
      }),

    selectIdea: (id) =>
      set((state) => {
        state.selectedId = id
      }),

    archiveIdea: (id) =>
      set((state) => {
        const i = state.ideas[id]
        if (i) i.status = 'archived'
      }),

    linkIdea: (id, entity) =>
      set((state) => {
        const i = state.ideas[id]
        if (i) i.linkedEntity = entity
      }),

    unlinkIdea: (id) =>
      set((state) => {
        const i = state.ideas[id]
        if (i) i.linkedEntity = undefined
      }),
  }))
)
