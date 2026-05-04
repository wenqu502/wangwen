import { useState, useRef, useCallback } from 'react'
import { useIdeaStore, useIdeaList, useIdeaCount } from './store'
import { useAppStore } from '@/stores/app-store'
import { Lightbulb, Plus, Trash2, Tag, Archive, RotateCcw, X, Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRESET_TAGS = ['剧情', '角色', '设定', '伏笔', '世界观', '对话', '待处理']

export function IdeaCanvas() {
  const ideaList = useIdeaList()
  const ideaCount = useIdeaCount()
  const { addIdea, deleteIdea, updateIdea, archiveIdea, linkIdea, unlinkIdea } = useIdeaStore()
  const currentWorkId = useAppStore((s) => s.currentWorkId)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [addingTagFor, setAddingTagFor] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const textareaRef = useRefRef<HTMLTextAreaElement>(null)

  const pendingList = ideaList.filter((i) => i.status !== 'archived')
  const archivedList = ideaList.filter((i) => i.status === 'archived')
  const displayList = showArchived ? ideaList : pendingList

  const handleStartEdit = useCallback((idea: typeof ideaList[0]) => {
    setEditingId(idea.id)
    setEditContent(idea.content)
  }, [])

  const handleSaveEdit = useCallback((id: string) => {
    if (!editContent.trim()) return
    updateIdea(id, (i) => {
      i.content = editContent.trim()
    })
    setEditingId(null)
    setEditContent('')
  }, [editContent, updateIdea])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditContent('')
  }, [])

  const handleAddTag = useCallback((ideaId: string) => {
    const tag = newTag.trim()
    if (!tag) return
    updateIdea(ideaId, (i) => {
      if (!i.tags.includes(tag)) {
        i.tags.push(tag)
      }
    })
    setNewTag('')
    setAddingTagFor(null)
  }, [newTag, updateIdea])

  const handleRemoveTag = useCallback((ideaId: string, tag: string) => {
    updateIdea(ideaId, (i) => {
      i.tags = i.tags.filter((t) => t !== tag)
    })
  }, [updateIdea])

  const handleCreateIdea = useCallback(() => {
    const id = `idea_${Date.now()}`
    addIdea({
      id,
      workId: currentWorkId || 'default',
      content: '',
      tags: ['待处理'],
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    // 自动进入编辑模式
    setTimeout(() => {
      setEditingId(id)
      setEditContent('')
    }, 50)
  }, [addIdea, currentWorkId])

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">灵感便签</h2>
          <span className="text-xs text-neutral-400">
            {pendingList.length} 待处理 / {archivedList.length} 已归档
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 text-xs rounded-md transition-colors',
              showArchived
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-neutral-500 hover:bg-neutral-100'
            )}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{showArchived ? '显示全部' : '仅待处理'}</span>
          </button>
          <button
            onClick={handleCreateIdea}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>添加便签</span>
          </button>
        </div>
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
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            {displayList.map((idea) => {
              const isEditing = editingId === idea.id
              const isArchived = idea.status === 'archived'

              return (
                <div
                  key={idea.id}
                  className={cn(
                    'rounded-lg p-4 transition-all border',
                    isArchived
                      ? 'bg-neutral-50 border-neutral-200 opacity-60'
                      : 'bg-yellow-50 border-yellow-200 hover:shadow-md'
                  )}
                >
                  {/* 内容区 */}
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        ref={textareaRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full text-sm text-neutral-800 bg-white/80 rounded-md p-2 outline-none resize-none min-h-[60px] border border-yellow-200 focus:border-yellow-400"
                        placeholder="写下你的灵感..."
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleSaveEdit(idea.id)
                          }
                          if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSaveEdit(idea.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          <Check className="w-3 h-3" />
                          保存
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 rounded"
                        >
                          <X className="w-3 h-3" />
                          取消
                        </button>
                        <span className="text-[10px] text-neutral-400 ml-auto">
                          Cmd+Enter 保存 / Esc 取消
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !isArchived && handleStartEdit(idea)}
                      className={cn(
                        'text-sm text-neutral-800 min-h-[40px] cursor-text',
                        !idea.content && 'text-neutral-400 italic'
                      )}
                    >
                      {idea.content || '点击编辑内容...'}
                    </div>
                  )}

                  {/* 底部操作栏 */}
                  <div className="flex items-center justify-between mt-3">
                    {/* 标签区 */}
                    <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                      {idea.tags.map((tag) => (
                        <span
                          key={tag}
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5',
                            isArchived
                              ? 'bg-neutral-100 text-neutral-500'
                              : 'bg-yellow-100 text-yellow-700'
                          )}
                        >
                          {tag}
                          {!isArchived && !isEditing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveTag(idea.id, tag)
                              }}
                              className="hover:text-red-500"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </span>
                      ))}

                      {/* 添加标签 */}
                      {!isArchived && !isEditing && (
                        addingTagFor === idea.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddTag(idea.id)
                                if (e.key === 'Escape') {
                                  setAddingTagFor(null)
                                  setNewTag('')
                                }
                              }}
                              className="text-[10px] px-1.5 py-0.5 w-16 border border-yellow-300 rounded outline-none"
                              placeholder="标签"
                              autoFocus
                            />
                            <button
                              onClick={() => handleAddTag(idea.id)}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setAddingTagFor(idea.id)
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-yellow-300 text-yellow-600 hover:bg-yellow-100"
                          >
                            + 标签
                          </button>
                        )
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {isArchived ? (
                        <button
                          onClick={() => {
                            updateIdea(idea.id, (i) => {
                              i.status = 'pending'
                            })
                          }}
                          title="恢复"
                          className="p-1 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => archiveIdea(idea.id)}
                            title="归档"
                            className="p-1 text-neutral-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteIdea(idea.id)}
                            title="删除"
                            className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 关联信息 */}
                  {idea.linkedEntity && (
                    <div className="mt-2 pt-2 border-t border-yellow-200/50">
                      <span className="text-[10px] text-neutral-400">
                        关联: {idea.linkedEntity.type} → {idea.linkedEntity.id.slice(0, 8)}...
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 空状态（过滤后） */}
          {displayList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400 space-y-2">
              <Clock className="w-8 h-8" />
              <p className="text-sm">
                {showArchived ? '暂无便签' : '没有待处理的便签'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
