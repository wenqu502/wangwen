import { useState, useCallback } from 'react'
import { useCharacterStore, useCharacterList, useSelectedCharacter, useSelectedCharacterId } from './store'
import { useAppStore } from '@/stores/app-store'
import { Plus, User, Trash2, Edit3, Sparkles, Check, X, Upload, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateCharacterId } from '@/utils/id-generator'
import type { Character } from '@/types'

const STATUS_OPTIONS: Array<{ value: Character['status']; label: string; color: string }> = [
  { value: 'alive', label: '存活', color: 'bg-green-50 text-green-700' },
  { value: 'dead', label: '死亡', color: 'bg-red-50 text-red-700' },
  { value: 'missing', label: '失踪', color: 'bg-amber-50 text-amber-700' },
  { value: 'sealed', label: '封印', color: 'bg-purple-50 text-purple-700' },
]

export function CharacterCanvas() {
  const characterList = useCharacterList()
  const selected = useSelectedCharacter()
  const selectedId = useSelectedCharacterId()
  const { selectCharacter, addCharacter, deleteCharacter, updateCharacter } = useCharacterStore()
  const { addMessage } = useAppStore()
  const currentWorkId = useAppStore((s) => s.currentWorkId)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Character>>({})

  const handleCreateMock = () => {
    const id = generateCharacterId()
    addCharacter({
      id,
      workId: currentWorkId || 'default',
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
      status: 'alive',
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    selectCharacter(id)
  }

  const startEdit = useCallback(() => {
    if (!selected) return
    setIsEditing(true)
    setEditForm({ ...selected })
  }, [selected])

  const cancelEdit = useCallback(() => {
    setIsEditing(false)
    setEditForm({})
  }, [])

  const saveEdit = useCallback(() => {
    if (!selected || !editForm.name?.trim()) return
    updateCharacter(selected.id, (c) => {
      c.name = editForm.name || c.name
      c.aliases = editForm.aliases || c.aliases
      c.tags = editForm.tags || c.tags
      c.appearance = editForm.appearance ?? c.appearance
      c.background = editForm.background ?? c.background
      c.personality = editForm.personality ? { ...editForm.personality } : c.personality
      c.trauma = editForm.trauma ?? c.trauma
      c.goals = editForm.goals ?? c.goals
      c.arc = editForm.arc ?? c.arc
      c.quotes = editForm.quotes || c.quotes
      c.abilities = editForm.abilities || c.abilities
      c.status = editForm.status || c.status
      c.images = editForm.images ?? c.images
      c.updatedAt = new Date().toISOString()
    })
    setIsEditing(false)
    setEditForm({})
  }, [selected, editForm, updateCharacter])

  const updateField = useCallback(<K extends keyof Character>(field: K, value: Character[K]) => {
    setEditForm((f) => ({ ...f, [field]: value }))
  }, [])

  const updatePersonality = useCallback((key: keyof Character['personality'], value: string) => {
    setEditForm((f) => ({
      ...f,
      personality: { ...(f.personality || {}), [key]: value },
    }))
  }, [])

  const updateArray = useCallback(<K extends 'quotes' | 'abilities' | 'tags' | 'aliases'>(
    field: K,
    index: number,
    value: string
  ) => {
    setEditForm((f) => {
      const arr = [...(f[field] || [])]
      arr[index] = value
      return { ...f, [field]: arr }
    })
  }, [])

  const addArrayItem = useCallback(<K extends 'quotes' | 'abilities' | 'tags' | 'aliases'>(
    field: K,
    defaultValue = ''
  ) => {
    setEditForm((f) => ({
      ...f,
      [field]: [...(f[field] || []), defaultValue],
    }))
  }, [])

  const removeArrayItem = useCallback(<K extends 'quotes' | 'abilities' | 'tags' | 'aliases'>(
    field: K,
    index: number
  ) => {
    setEditForm((f) => ({
      ...f,
      [field]: (f[field] || []).filter((_, i) => i !== index),
    }))
  }, [])

  return (
    <div className="h-full flex gap-4">
      {/* 左侧角色列表 */}
      <div className="w-64 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">角色小像</h2>
          <div className="flex gap-1">
            <button
              onClick={handleCreateMock}
              className="p-1.5 text-muted-foreground hover:text-brand hover:bg-brand-light rounded-md transition-colors"
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
              className="p-1.5 text-muted-foreground hover:text-brand hover:bg-brand-light rounded-md transition-colors"
              title="AI 创建"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {characterList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-2">
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
                    ? 'border-brand-hover bg-brand-light shadow-sm'
                    : 'border-border bg-card hover:border-border'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-light text-brand flex items-center justify-center text-sm font-medium shrink-0">
                    {char.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {char.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
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
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selected ? (
          <div className="bg-card rounded-xl border border-border p-6 space-y-6">
            {/* 头部信息 */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full bg-brand-light text-brand flex items-center justify-center text-xl font-bold overflow-hidden">
                  {selected.images?.[0] ? (
                    <img src={selected.images[0]} alt={selected.name} className="w-full h-full object-cover" />
                  ) : (
                    (isEditing ? editForm.name : selected.name)?.charAt(0)
                  )}
                  {isEditing && (
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                      <Upload className="w-5 h-5 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const reader = new FileReader()
                          reader.onload = () => {
                            const dataUrl = reader.result as string
                            updateField('images', [dataUrl])
                          }
                          reader.readAsDataURL(file)
                        }}
                      />
                    </label>
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={() => {
                      // Batch5: AI 形象生成占位 — 使用 Canvas 生成渐变头像
                      const canvas = document.createElement('canvas')
                      canvas.width = 200
                      canvas.height = 200
                      const ctx = canvas.getContext('2d')
                      if (ctx) {
                        const gradient = ctx.createLinearGradient(0, 0, 200, 200)
                        gradient.addColorStop(0, '#4756ff')
                        gradient.addColorStop(1, '#6f7bff')
                        ctx.fillStyle = gradient
                        ctx.fillRect(0, 0, 200, 200)
                        ctx.fillStyle = 'rgba(255,255,255,0.15)'
                        ctx.beginPath()
                        ctx.arc(100, 80, 50, 0, Math.PI * 2)
                        ctx.fill()
                        ctx.beginPath()
                        ctx.ellipse(100, 190, 70, 60, 0, 0, Math.PI * 2)
                        ctx.fill()
                        ctx.fillStyle = '#ffffff'
                        ctx.font = 'bold 80px sans-serif'
                        ctx.textAlign = 'center'
                        ctx.textBaseline = 'middle'
                        ctx.fillText((editForm.name || selected.name).charAt(0), 100, 105)
                        const dataUrl = canvas.toDataURL('image/png')
                        updateField('images', [dataUrl])
                      }
                    }}
                    className="text-xs text-brand hover:text-brand-active flex items-center gap-1 mt-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    AI 生成形象
                  </button>
                )}
                <div>
                  {isEditing ? (
                    <input
                      value={editForm.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="text-xl font-bold text-foreground border-b border-border outline-none bg-transparent w-full"
                      placeholder="角色名"
                    />
                  ) : (
                    <h3 className="text-xl font-bold text-foreground">{selected.name}</h3>
                  )}
                  {isEditing ? (
                    <input
                      value={(editForm.aliases || []).join(' / ')}
                      onChange={(e) =>
                        updateField('aliases', e.target.value.split(/[/，,]/).map((s) => s.trim()).filter(Boolean))
                      }
                      className="text-sm text-muted-foreground border-b border-border outline-none bg-transparent w-full mt-1"
                      placeholder="别名（用 / 分隔）"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selected.aliases.join(' / ') || '无别名'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {!isEditing ? (
                  <button
                    onClick={startEdit}
                    aria-label="编辑角色"
                    className="p-2 text-muted-foreground hover:text-brand hover:bg-brand-light rounded-md transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={saveEdit}
                      aria-label="确认编辑"
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      aria-label="取消编辑"
                      className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => deleteCharacter(selected.id)}
                  aria-label="删除角色"
                  className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 标签与状态 */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {isEditing ? (
                  <ArrayEditorInline
                    items={editForm.tags || []}
                    onUpdate={(i, v) => updateArray('tags', i, v)}
                    onAdd={() => addArrayItem('tags', '新标签')}
                    onRemove={(i) => removeArrayItem('tags', i)}
                    placeholder="标签"
                    color="indigo"
                  />
                ) : (
                  selected.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 text-xs font-medium bg-brand-light text-brand-active rounded-full"
                    >
                      {tag}
                    </span>
                  ))
                )}
              </div>
              {isEditing ? (
                <select
                  value={editForm.status || 'alive'}
                  onChange={(e) => updateField('status', e.target.value as Character['status'])}
                  className="text-sm px-2 py-1 border border-border rounded-md bg-card"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              ) : (
                <StatusBadge status={selected.status} />
              )}
            </div>

            {/* 基础信息网格 */}
            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <EditBlock label="外貌" value={editForm.appearance || ''} onChange={(v) => updateField('appearance', v)} />
                  <EditBlock label="背景" value={editForm.background || ''} onChange={(v) => updateField('background', v)} />
                  <EditBlock label="表面性格" value={editForm.personality?.surface || ''} onChange={(v) => updatePersonality('surface', v)} />
                  <EditBlock label="内心性格" value={editForm.personality?.inner || ''} onChange={(v) => updatePersonality('inner', v)} />
                  <EditBlock label="应激反应" value={editForm.personality?.stressResponse || ''} onChange={(v) => updatePersonality('stressResponse', v)} />
                  <EditBlock label="目标" value={editForm.goals || ''} onChange={(v) => updateField('goals', v)} />
                  <EditBlock label="创伤" value={editForm.trauma || ''} onChange={(v) => updateField('trauma', v)} />
                  <EditBlock label="成长弧线" value={editForm.arc || ''} onChange={(v) => updateField('arc', v)} />
                </>
              ) : (
                <>
                  <InfoBlock label="外貌" content={selected.appearance || '未填写'} />
                  <InfoBlock label="背景" content={selected.background || '未填写'} />
                  <InfoBlock label="表面性格" content={selected.personality.surface || '未填写'} />
                  <InfoBlock label="内心性格" content={selected.personality.inner || '未填写'} />
                  <InfoBlock label="应激反应" content={selected.personality.stressResponse || '未填写'} />
                  <InfoBlock label="目标" content={selected.goals || '未填写'} />
                  <InfoBlock label="创伤" content={selected.trauma || '未填写'} />
                  <InfoBlock label="成长弧线" content={selected.arc || '未填写'} />
                </>
              )}
            </div>

            {/* 经典台词 */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">经典台词</h4>
              {isEditing ? (
                <ArrayEditorBlock
                  items={editForm.quotes || []}
                  onUpdate={(i, v) => updateArray('quotes', i, v)}
                  onAdd={() => addArrayItem('quotes', '')}
                  onRemove={(i) => removeArrayItem('quotes', i)}
                  placeholder="输入一句台词..."
                  icon="quote"
                />
              ) : selected.quotes.length > 0 ? (
                <div className="space-y-2">
                  {selected.quotes.map((quote, i) => (
                    <p key={i} className="text-sm text-muted-foreground italic pl-3 border-l-2 border-brand-light">
                      "{quote}"
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">暂无台词</p>
              )}
            </div>

            {/* 能力/技能 */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">能力 / 技能</h4>
              {isEditing ? (
                <ArrayEditorBlock
                  items={editForm.abilities || []}
                  onUpdate={(i, v) => updateArray('abilities', i, v)}
                  onAdd={() => addArrayItem('abilities', '')}
                  onRemove={(i) => removeArrayItem('abilities', i)}
                  placeholder="输入一项能力..."
                  icon="tag"
                />
              ) : selected.abilities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selected.abilities.map((a, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">暂无能力记录</p>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
            <User className="w-16 h-16" />
            <div>
              <p className="text-muted-foreground font-medium">选择一个角色查看详情</p>
              <p className="text-sm mt-1">或在左侧创建新角色</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Character['status'] }) {
  const config = STATUS_OPTIONS.find((s) => s.value === status)
  if (!config) return null
  return (
    <span className={cn('text-xs px-2 py-1 rounded-full font-medium', config.color)}>
      {config.label}
    </span>
  )
}

function InfoBlock({ label, content }: { label: string; content: string }) {
  return (
    <div className="bg-muted rounded-lg p-3">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-sm text-card-foreground">{content}</p>
    </div>
  )
}

function EditBlock({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="bg-muted rounded-lg p-3">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm text-card-foreground bg-transparent outline-none resize-none h-16"
        placeholder={`填写${label}...`}
      />
    </div>
  )
}

/** 内联数组编辑器（用于标签等短文本） */
function ArrayEditorInline({
  items,
  onUpdate,
  onAdd,
  onRemove,
  placeholder,
  color = 'indigo',
}: {
  items: string[]
  onUpdate: (index: number, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  placeholder: string
  color?: string
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-brand-light text-brand-active border-brand-light',
    green: 'bg-green-50 text-green-700 border-green-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  const style = colorMap[color] || colorMap.indigo

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {items.map((item, i) => (
        <div key={i} className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border', style)}>
          <input
            value={item}
            onChange={(e) => onUpdate(i, e.target.value)}
            className="bg-transparent outline-none w-16 min-w-0"
            placeholder={placeholder}
          />
          <button onClick={() => onRemove(i)} className="hover:text-red-500">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="text-xs px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground hover:bg-muted"
      >
        + {placeholder}
      </button>
    </div>
  )
}

/** 块级数组编辑器（用于台词、能力等） */
function ArrayEditorBlock({
  items,
  onUpdate,
  onAdd,
  onRemove,
  placeholder,
  icon,
}: {
  items: string[]
  onUpdate: (index: number, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  placeholder: string
  icon: 'quote' | 'tag'
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={item}
            onChange={(e) => onUpdate(i, e.target.value)}
            className="flex-1 text-sm px-3 py-2 border border-border rounded-md bg-card outline-none focus:border-brand-hover"
            placeholder={placeholder}
          />
          <button
            onClick={() => onRemove(i)}
            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center gap-1 text-sm text-brand hover:text-brand-active px-1 py-1"
      >
        <Plus className="w-4 h-4" />
        <span>添加{placeholder.replace(/输入一?[个项]?/, '').replace(/\.\.\./, '')}</span>
      </button>
    </div>
  )
}
