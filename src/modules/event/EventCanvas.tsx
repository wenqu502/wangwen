import { useEventStore } from './store'
import { usePlotStore } from '@/modules/plot/store'
import { useCharacterStore } from '@/modules/character/store'
import { useState } from 'react'
import { Plus, Trash2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateEventId, generateEventEdgeId } from '@/utils/id-generator'

export function EventCanvas() {
  const { events, eventEdges, addEvent, deleteEvent, addEventEdge, deleteEventEdge } = useEventStore()
  const nodes = usePlotStore((s) => s.nodes)
  const characters = useCharacterStore((s) => s.characters)

  const [newEventTitle, setNewEventTitle] = useState('')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  const eventList = Object.values(events)
  const edgeList = Object.values(eventEdges)

  const handleAddEvent = () => {
    if (!newEventTitle.trim()) return
    addEvent({
      id: generateEventId(),
      workId: '',
      title: newEventTitle.trim(),
      summary: '',
      characters: [],
      location: '',
      tags: [],
      createdAt: new Date().toISOString(),
    })
    setNewEventTitle('')
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">事件图谱</h2>
        <span className="text-sm text-muted-foreground">{eventList.length} 个事件，{edgeList.length} 条关联</span>
      </div>

      <div className="flex gap-2">
        <input
          value={newEventTitle}
          onChange={(e) => setNewEventTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()}
          placeholder="输入事件名称..."
          className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleAddEvent}
          className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {eventList.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          暂无事件，创建一个开始构建事件图谱
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-3">
          {eventList.map((evt) => {
            const relatedEdges = edgeList.filter((e) => e.sourceId === evt.id || e.targetId === evt.id)
            const isSelected = selectedEventId === evt.id
            return (
              <div
                key={evt.id}
                onClick={() => setSelectedEventId(isSelected ? null : evt.id)}
                className={cn(
                  'p-3 border rounded-md cursor-pointer transition-colors',
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                    : 'border-border hover:bg-accent'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{evt.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteEvent(evt.id)
                    }}
                    className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {evt.summary && <p className="text-xs text-muted-foreground mt-1">{evt.summary}</p>}
                {isSelected && relatedEdges.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {relatedEdges.map((edge) => {
                      const otherId = edge.sourceId === evt.id ? edge.targetId : edge.sourceId
                      const other = events[otherId]
                      return (
                        <div key={edge.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ArrowRight className="w-3 h-3" />
                          <span>{edge.type}: {other?.title || otherId}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteEventEdge(edge.id)
                            }}
                            className="text-red-400 hover:text-red-600"
                          >
                            删除
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
