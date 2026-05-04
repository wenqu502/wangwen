import { useRelationStore, useRelationEdgeList } from './store'
import { useCharacterStore, useCharacterList } from '@/modules/character/store'
import { useAppStore } from '@/stores/app-store'
import { Network, Plus, Trash2, Eye, EyeOff, List, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { generateRelationId } from '@/utils/id-generator'
import { RelationGraph } from './RelationGraph'

const PRESET_RELATION_TYPES = [
  '爱慕', '暗恋', '前任', '宿敌', '挚友', '情敌',
  '父子', '兄妹', '师徒',
  '同盟', '上下级', '交易', '竞争',
  '隐藏身份', '暗中操控', '秘密关联',
]

export function RelationCanvas() {
  const edgeList = useRelationEdgeList()
  const characterList = useCharacterList()
  const { addEdge, deleteEdge } = useRelationStore()
  const { characters } = useCharacterStore()
  const currentWorkId = useAppStore((s) => s.currentWorkId)

  const [showHidden, setShowHidden] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list')
  const [isAdding, setIsAdding] = useState(false)
  const [newRelation, setNewRelation] = useState({
    sourceId: '',
    targetId: '',
    type: '挚友',
    description: '',
    isHidden: false,
  })

  const filteredEdges = showHidden ? edgeList : edgeList.filter((e) => !e.isHidden)

  const handleAddRelation = () => {
    if (!newRelation.sourceId || !newRelation.targetId) return
    addEdge({
      id: generateRelationId(),
      workId: currentWorkId || 'default',
      sourceId: newRelation.sourceId,
      targetId: newRelation.targetId,
      type: newRelation.type,
      description: newRelation.description,
      isHidden: newRelation.isHidden,
      createdAt: new Date().toISOString(),
    })
    setIsAdding(false)
    setNewRelation({ sourceId: '', targetId: '', type: '挚友', description: '', isHidden: false })
  }

  const getCharacterName = (id: string) => characters[id]?.name || id

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">人物关系图</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-neutral-100 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors',
                viewMode === 'list' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              <List className="w-3.5 h-3.5" />
              <span>列表</span>
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors',
                viewMode === 'graph' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>网络图</span>
            </button>
          </div>
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md transition-colors',
              showHidden ? 'bg-indigo-50 text-indigo-600' : 'text-neutral-500 hover:bg-neutral-100'
            )}
          >
            {showHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showHidden ? '显示隐藏' : '隐藏关系'}</span>
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>添加关系</span>
          </button>
        </div>
      </div>

      {edgeList.length === 0 && !isAdding ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-400 space-y-3">
          <Network className="w-16 h-16" />
          <div>
            <p className="text-neutral-500 font-medium">还没有关系数据</p>
            <p className="text-sm mt-1">在右侧 AI 面板说"梳理一下人物关系..."</p>
          </div>
        </div>
      ) : viewMode === 'graph' ? (
        <div className="flex-1 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <RelationGraph
            characters={characterList}
            edges={filteredEdges}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* 添加关系表单 */}
          {isAdding && (
            <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-3 shrink-0">
              <h3 className="text-sm font-semibold text-neutral-800">新建关系</h3>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newRelation.sourceId}
                  onChange={(e) => setNewRelation({ ...newRelation, sourceId: e.target.value })}
                  className="text-sm px-3 py-2 border border-neutral-200 rounded-md bg-white"
                >
                  <option value="">选择角色 A</option>
                  {characterList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={newRelation.targetId}
                  onChange={(e) => setNewRelation({ ...newRelation, targetId: e.target.value })}
                  className="text-sm px-3 py-2 border border-neutral-200 rounded-md bg-white"
                >
                  <option value="">选择角色 B</option>
                  {characterList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <select
                  value={newRelation.type}
                  onChange={(e) => setNewRelation({ ...newRelation, type: e.target.value })}
                  className="text-sm px-3 py-2 border border-neutral-200 rounded-md bg-white"
                >
                  {PRESET_RELATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="关系描述（可选）"
                  value={newRelation.description}
                  onChange={(e) => setNewRelation({ ...newRelation, description: e.target.value })}
                  className="flex-1 text-sm px-3 py-2 border border-neutral-200 rounded-md"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isHidden"
                  checked={newRelation.isHidden}
                  onChange={(e) => setNewRelation({ ...newRelation, isHidden: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isHidden" className="text-sm text-neutral-600">隐藏关系</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddRelation}
                  className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  确认
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-md"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 关系列表 */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredEdges.map((edge) => (
              <div
                key={edge.id}
                className={cn(
                  'bg-white rounded-lg border p-3 flex items-center justify-between',
                  edge.isHidden ? 'border-dashed border-neutral-300' : 'border-neutral-200'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900">{getCharacterName(edge.sourceId)}</span>
                    <span className="text-xs text-neutral-400">→</span>
                    <span className="text-sm font-medium text-neutral-900">{getCharacterName(edge.targetId)}</span>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    edge.isHidden
                      ? 'bg-purple-50 text-purple-600'
                      : 'bg-indigo-50 text-indigo-600'
                  )}>
                    {edge.type}
                  </span>
                  {edge.description && (
                    <span className="text-xs text-neutral-500">{edge.description}</span>
                  )}
                  {edge.isHidden && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">隐藏</span>
                  )}
                </div>
                <button
                  onClick={() => deleteEdge(edge.id)}
                  className="p-1.5 text-neutral-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
