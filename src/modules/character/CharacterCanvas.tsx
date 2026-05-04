import { useState } from 'react'
import { useCharacterStore, useCharacterList, useSelectedCharacter, useSelectedCharacterId } from './store'
import { useAppStore } from '@/stores/app-store'
import { Plus, User, Trash2, Edit3, Sparkles, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateCharacterId } from '@/utils/id-generator'
import type { Character } from '@/types'

export function CharacterCanvas() {
  const characterList = useCharacterList()
  const selected = useSelectedCharacter()
  const selectedId = useSelectedCharacterId()
  const { selectCharacter, addCharacter, deleteCharacter, updateCharacter } = useCharacterStore()
  const { addMessage } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Character>>({})

  const handleCreateMock = () => {
    const id = generateCharacterId()
    addCharacter({
      id,
      workId: 'default',
      name: `角色 ${characterList.length + 1}`,
      aliases: [],
      tags: ['待完善'],
      appearance: '',
      personality: {
        keywords: [],
        surface: '',
        inner: '',
        stressResponse: '',
      },
      background: '',
      quotes: [],
      abilities: [],
      relations: [],
      status: 'alive',
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    selectCharacter(id)
  }

  return (
    <div className="h-full flex gap-4">
      {/* 左侧角色列表 */}
      <div className="w-64 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">角色小像</h2>
          <div className="flex gap-1">
            <button
              onClick={handleCreateMock}
              className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="手动创建"
              aria-label="手动创建"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                addMessage({
                  id: `msg_${Date.now()}`,
                  role: 'user',
                  content: '帮我创建一个新角色',
                  timestamp: Date.now(),
                })
              }}
              className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="AI 创建"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {characterList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-neutral-400 space-y-2">
            <User className="w-10 h-10" />
            <p className="text-sm">还没有角色</p>
            <p className="text-xs">在右侧 AI 面板说"帮我创建一个..."</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2">
            {characterList.map((char) => (
              <button
                key={char.id}
                onClick={() => selectCharacter(char.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all',
                  selectedId === char.id
                    ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium shrink-0">
                    {char.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-neutral-900 truncate">
                      {char.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {char.tags.join(' · ') || '未分类'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 右侧角色详情 */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
                  {(isEditing ? editForm.name : selected.name)?.charAt(0)}
                </div>
                <div>
                  {isEditing ? (
                    <input
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="text-xl font-bold text-neutral-900 border-b border-neutral-300 outline-none bg-transparent w-full"
                      placeholder="角色名"
                    />
                  ) : (
                    <h3 className="text-xl font-bold text-neutral-900">{selected.name}</h3>
                  )}
                  {isEditing ? (
                    <input
                      value={(editForm.aliases || []).join(' / ')}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, aliases: e.target.value.split(/[\/，,]/).map((s) => s.trim()).filter(Boolean) }))
                      }
                      className="text-sm text-neutral-500 border-b border-neutral-300 outline-none bg-transparent w-full mt-1"
                      placeholder="别名（用 / 分隔）"
                    />
                  ) : (
                    <p className="text-sm text-neutral-500">
                      {selected.aliases.join(' / ') || '无别名'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {!isEditing ? (
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setEditForm({ ...selected })
                    }}
                    aria-label="编辑角色"
                    className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (!editForm.name?.trim()) return
                        updateCharacter(selected.id, (c) => {
                          c.name = editForm.name || c.name
                          c.aliases = editForm.aliases || c.aliases
                          c.appearance = editForm.appearance ?? c.appearance
                          c.background = editForm.background ?? c.background
                          c.personality = { ...c.personality, ...(editForm.personality || {}) }
                          c.goals = editForm.goals ?? c.goals
                          c.updatedAt = new Date().toISOString()
                        })
                        setIsEditing(false)
                        setEditForm({})
                      }}
                      aria-label="确认编辑"
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setEditForm({})
                      }}
                      aria-label="取消编辑"
                      className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => deleteCharacter(selected.id)}
                  aria-label="删除角色"
                  className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selected.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <EditBlock label="外貌" value={editForm.appearance || ''} onChange={(v) => setEditForm((f) => ({ ...f, appearance: v }))} />
                  <EditBlock label="背景" value={editForm.background || ''} onChange={(v) => setEditForm((f) => ({ ...f, background: v }))} />
                  <EditBlock label="表面性格" value={editForm.personality?.surface || ''} onChange={(v) => setEditForm((f) => ({ ...f, personality: { ...f.personality, surface: v } }))} />
                  <EditBlock label="内心性格" value={editForm.personality?.inner || ''} onChange={(v) => setEditForm((f) => ({ ...f, personality: { ...f.personality, inner: v } }))} />
                  <EditBlock label="应激反应" value={editForm.personality?.stressResponse || ''} onChange={(v) => setEditForm((f) => ({ ...f, personality: { ...f.personality, stressResponse: v } }))} />
                  <EditBlock label="目标" value={editForm.goals || ''} onChange={(v) => setEditForm((f) => ({ ...f, goals: v }))} />
                </>
              ) : (
                <>
                  <InfoBlock label="外貌" content={selected.appearance || '未填写'} />
                  <InfoBlock label="背景" content={selected.background || '未填写'} />
                  <InfoBlock label="表面性格" content={selected.personality.surface || '未填写'} />
                  <InfoBlock label="内心性格" content={selected.personality.inner || '未填写'} />
                  <InfoBlock label="应激反应" content={selected.personality.stressResponse || '未填写'} />
                  <InfoBlock label="目标" content={selected.goals || '未填写'} />
                </>
              )}
            </div>

            {selected.quotes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">经典台词</h4>
                <div className="space-y-2">
                  {selected.quotes.map((quote, i) => (
                    <p key={i} className="text-sm text-neutral-600 italic pl-3 border-l-2 border-indigo-200">
                      "{quote}"
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-neutral-400 space-y-3">
            <User className="w-16 h-16" />
            <div>
              <p className="text-neutral-500 font-medium">选择一个角色查看详情</p>
              <p className="text-sm mt-1">或在左侧创建新角色</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoBlock({ label, content }: { label: string; content: string }) {
  return (
    <div className="bg-neutral-50 rounded-lg p-3">
      <p className="text-xs font-medium text-neutral-500 mb-1">{label}</p>
      <p className="text-sm text-neutral-800">{content}</p>
    </div>
  )
}

function EditBlock({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="bg-neutral-50 rounded-lg p-3">
      <p className="text-xs font-medium text-neutral-500 mb-1">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm text-neutral-800 bg-transparent outline-none resize-none h-16"
        placeholder={`填写${label}...`}
      />
    </div>
  )
}
