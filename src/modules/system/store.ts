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
  immer((set, get) => ({
    systems: {},
    selectedId: null,

    setSystems: (list) =>
      set((state) => {
        state.systems = {}
        for (const s of list) state.systems[s.id] = s
      }),

    addSystem: (system) => {
      set((state) => {
        state.systems[system.id] = system
      })
      writeAddSystem(system).then((result) => {
        if (!result.success) {
          set((state) => {
            delete state.systems[system.id]
          })
          console.error('[Store] addSystem rollback:', result.error)
        }
      })
    },

    updateSystem: (id, updater) => {
      const previous = get().systems[id] ? structuredClone(get().systems[id]) : undefined
      set((state) => {
        const s = state.systems[id]
        if (s) updater(s)
      })
      const updated = get().systems[id]
      if (updated) {
        writeUpdateSystem(updated).then((result) => {
          if (!result.success && previous) {
            set((state) => {
              state.systems[id] = previous
            })
            console.error('[Store] updateSystem rollback:', result.error)
          }
        })
      }
    },

    deleteSystem: (id) => {
      const previous = get().systems[id] ? structuredClone(get().systems[id]) : undefined
      const previousSelected = get().selectedId
      set((state) => {
        delete state.systems[id]
        if (state.selectedId === id) state.selectedId = null
      })
      writeDeleteSystem(id).then((result) => {
        if (!result.success && previous) {
          set((state) => {
            state.systems[id] = previous
            state.selectedId = previousSelected
          })
          console.error('[Store] deleteSystem rollback:', result.error)
        }
      })
    },

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
