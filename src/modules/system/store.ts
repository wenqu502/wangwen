import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { WorkSystem } from '@/types'

interface SystemState {
  systems: Record<string, WorkSystem>
  selectedId: string | null

  setSystems: (list: WorkSystem[]) => void
  addSystem: (system: WorkSystem) => void
  updateSystem: (id: string, updater: (s: WorkSystem) => void) => void
  deleteSystem: (id: string) => void
  selectSystem: (id: string | null) => void
}

export const useSystemStore = create<SystemState>()(
  immer((set) => ({
    systems: {},
    selectedId: null,

    setSystems: (list) =>
      set((state) => {
        state.systems = {}
        for (const s of list) state.systems[s.id] = s
      }),

    addSystem: (system) =>
      set((state) => {
        state.systems[system.id] = system
      }),

    updateSystem: (id, updater) =>
      set((state) => {
        const s = state.systems[id]
        if (s) updater(s)
      }),

    deleteSystem: (id) =>
      set((state) => {
        delete state.systems[id]
        if (state.selectedId === id) state.selectedId = null
      }),

    selectSystem: (id) =>
      set((state) => {
        state.selectedId = id
      }),
  }))
)
