import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/shallow'
import type { StoryEvent, EventEdge } from '@/types'
import { writeAddEvent, writeUpdateEvent, writeDeleteEvent, writeAddEventEdge, writeUpdateEventEdge, writeDeleteEventEdge } from '@/db/operations'

interface EventState {
  events: Record<string, StoryEvent>
  eventEdges: Record<string, EventEdge>
  selectedId: string | null

  setEvents: (list: StoryEvent[]) => void
  setEventEdges: (list: EventEdge[]) => void
  addEvent: (event: StoryEvent) => void
  updateEvent: (id: string, updater: (e: StoryEvent) => void) => void
  deleteEvent: (id: string) => void
  selectEvent: (id: string | null) => void

  addEventEdge: (edge: EventEdge) => void
  deleteEventEdge: (id: string) => void
}

export const useEventStore = create<EventState>()(
  immer((set, get) => ({
    events: {},
    eventEdges: {},
    selectedId: null,

    setEvents: (list) =>
      set((state) => {
        state.events = {}
        for (const e of list) state.events[e.id] = e
      }),

    setEventEdges: (list) =>
      set((state) => {
        state.eventEdges = {}
        for (const e of list) state.eventEdges[e.id] = e
      }),

    addEvent: (event) => {
      set((state) => {
        state.events[event.id] = event
      })
      writeAddEvent(event).then((result) => {
        if (!result.success) {
          set((state) => { delete state.events[event.id] })
          console.error('[Store] addEvent rollback:', result.error)
        }
      })
    },

    updateEvent: (id, updater) => {
      const previous = get().events[id] ? structuredClone(get().events[id]) : undefined
      set((state) => {
        const e = state.events[id]
        if (e) updater(e)
      })
      const updated = get().events[id]
      if (updated) {
        writeUpdateEvent(updated).then((result) => {
          if (!result.success && previous) {
            set((state) => { state.events[id] = previous })
            console.error('[Store] updateEvent rollback:', result.error)
          }
        })
      }
    },

    deleteEvent: (id) => {
      const previous = get().events[id] ? structuredClone(get().events[id]) : undefined
      const previousSelected = get().selectedId
      set((state) => {
        delete state.events[id]
        if (state.selectedId === id) state.selectedId = null
      })
      writeDeleteEvent(id).then((result) => {
        if (!result.success && previous) {
          set((state) => {
            state.events[id] = previous
            state.selectedId = previousSelected
          })
          console.error('[Store] deleteEvent rollback:', result.error)
        }
      })
    },

    selectEvent: (id) =>
      set((state) => {
        state.selectedId = id
      }),

    addEventEdge: (edge) => {
      set((state) => {
        state.eventEdges[edge.id] = edge
      })
      writeAddEventEdge(edge).then((result) => {
        if (!result.success) {
          set((state) => { delete state.eventEdges[edge.id] })
          console.error('[Store] addEventEdge rollback:', result.error)
        }
      })
    },

    deleteEventEdge: (id) => {
      const previous = get().eventEdges[id] ? structuredClone(get().eventEdges[id]) : undefined
      set((state) => {
        delete state.eventEdges[id]
      })
      writeDeleteEventEdge(id).then((result) => {
        if (!result.success && previous) {
          set((state) => { state.eventEdges[id] = previous })
          console.error('[Store] deleteEventEdge rollback:', result.error)
        }
      })
    },
  }))
)

export const useEventList = () =>
  useEventStore(useShallow((s) => Object.values(s.events)))

export const useEventEdgeList = () =>
  useEventStore(useShallow((s) => Object.values(s.eventEdges)))

export function useEventCount(): number {
  return useEventStore((s) => Object.keys(s.events).length)
}
