import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/shallow'
import { useMemo } from 'react'
import type { WorkSystem } from '@/types'
import { db } from '@/db'

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
        db.systems.add(system).catch((err) => console.error('[DB] addSystem failed:', err))
      }),

    updateSystem: (id, updater) =>
      set((state) => {
        const s = state.systems[id]
        if (s) {
          updater(s)
          db.systems.put(s).catch((err) => console.error('[DB] updateSystem failed:', err))
        }
      }),

    deleteSystem: (id) =>
      set((state) => {
        delete state.systems[id]
        if (state.selectedId === id) state.selectedId = null
        db.systems.delete(id).catch((err) => console.error('[DB] deleteSystem failed:', err))
      }),

    selectSystem: (id) =>
      set((state) => {
        state.selectedId = id
      }),
  }))
)

// === Selector Hooks（性能优化）===

export function useSystemList(): WorkSystem[] {
  const systems = useSystemStore(useShallow((s) => s.systems))
  return useMemo(() => Object.values(systems), [systems])
}

export function useSystemCount(): number {
  return useSystemStore((s) => Object.keys(s.systems).length)
}

