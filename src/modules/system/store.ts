import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/shallow'
import type { WorkSystem } from '@/types'
import { writeAddSystem, writeUpdateSystem, writeDeleteSystem } from '@/db/operations'

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
        writeAddSystem(system).catch((err) => console.error('[DB] addSystem failed:', err))
      }),

    updateSystem: (id, updater) =>
      set((state) => {
        const s = state.systems[id]
        if (s) {
          updater(s)
          writeUpdateSystem(s).catch((err) => console.error('[DB] updateSystem failed:', err))
        }
      }),

    deleteSystem: (id) =>
      set((state) => {
        delete state.systems[id]
        if (state.selectedId === id) state.selectedId = null
        writeDeleteSystem(id).catch((err) => console.error('[DB] deleteSystem failed:', err))
      }),

    selectSystem: (id) =>
      set((state) => {
        state.selectedId = id
      }),
  }))
)

// === Selector Hooks（性能优化）===

export const useSystemList = () =>
  useSystemStore(useShallow((s) => Object.values(s.systems)))

export function useSystemCount(): number {
  return useSystemStore((s) => Object.keys(s.systems).length)
}

