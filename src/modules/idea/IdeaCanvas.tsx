import { useIdeaStore, useIdeaList, useIdeaCount } from './store'
import { useAppStore } from '@/stores/app-store'
import { Lightbulb, Plus } from 'lucide-react'

export function IdeaCanvas() {
  const ideaList = useIdeaList()
  const ideaCount = useIdeaCount()
  const { addIdea, deleteIdea } = useIdeaStore()
  const currentWorkId = useAppStore((s) => s.currentWorkId)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">灵感便签</h2>
        <button
          onClick={() => {
            const id = `idea_${Date.now()}`
            addIdea({
              id,
              workId: currentWorkId || 'default',
              content: '新的灵感...',
              tags: [],
              status: 'pending',
              createdAt: new Date().toISOString(),
            })
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>添加便签</span>
        </button>
      </div>

      {ideaCount === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-400 space-y-3">
          <Lightbulb className="w-16 h-16" />
          <div>
            <p className="text-neutral-500 font-medium">还没有灵感便签</p>
            <p className="text-sm mt-1">在右侧 AI 面板随口提到点子，我会自动提取</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {ideaList.map((idea) => (
            <div
              key={idea.id}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <p className="text-sm text-neutral-800">{idea.content}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-1">
                  {idea.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => deleteIdea(idea.id)}
                  className="text-xs text-neutral-400 hover:text-red-500"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
