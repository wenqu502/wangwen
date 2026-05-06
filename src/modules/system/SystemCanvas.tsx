import { useSystemStore, useSystemList } from './store'
import { useAppStore } from '@/stores/app-store'
import { Layers, Plus, Trash2, ChevronDown, ChevronRight, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { generateSystemId } from '@/utils/id-generator'

export function SystemCanvas() {
  const systemList = useSystemList()
  const { addSystem, deleteSystem } = useSystemStore()
  const currentWorkId = useAppStore((s) => s.currentWorkId)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreateSystem = () => {
    const id = generateSystemId()
    addSystem({
      id,
      workId: currentWorkId || 'default',
      name: '新体系',
      description: '点击编辑体系描述...',
      branches: [
        {
          id: `br_${Date.now()}`,
          name: '主分支',
          levels: [
            {
              rank: 1,
              name: '入门',
              description: '初级等级',
              abilities: ['基础能力'],
              restrictions: ['无法使用高级技能'],
            },
          ],
        },
      ],
      rules: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">体系管理</h2>
        <button
          onClick={handleCreateSystem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-brand text-white rounded-md hover:bg-brand-active transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>添加体系</span>
        </button>
      </div>

      {systemList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
          <Layers className="w-16 h-16" />
          <div>
            <p className="text-muted-foreground font-medium">还没有体系设定</p>
            <p className="text-sm mt-1">在右侧 AI 面板说"帮我设计一个...体系"</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {systemList.map((system) => {
            const isExpanded = expandedIds.has(system.id)
            return (
              <div key={system.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* 体系标题 */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted"
                  onClick={() => toggleExpand(system.id)}
                >
                  <div className="flex items-center gap-3">
                    <button className="text-muted-foreground">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <h3 className="font-semibold text-foreground">{system.name}</h3>
                      <p className="text-xs text-muted-foreground">{system.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSystem(system.id)
                    }}
                    className="p-1.5 text-neutral-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 体系详情 */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    {/* 分支列表 */}
                    {system.branches.map((branch) => (
                      <div key={branch.id} className="border border-neutral-100 rounded-lg p-3">
                        <h4 className="text-sm font-semibold text-card-foreground mb-2">{branch.name}</h4>
                        <div className="space-y-2">
                          {branch.levels.map((level) => (
                            <div
                              key={level.rank}
                              className="flex items-center gap-3 py-2 px-3 bg-muted rounded-md"
                            >
                              <span className="w-6 h-6 flex items-center justify-center bg-brand-light text-brand text-xs font-bold rounded-full shrink-0">
                                T{level.rank}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-card-foreground">{level.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{level.description}</p>
                              </div>
                              {level.abilities.length > 0 && (
                                <div className="flex gap-1 shrink-0">
                                  {level.abilities.map((a) => (
                                    <span key={a} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                                      {a}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* 规则列表 */}
                    {system.rules.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" />
                          规则
                        </h4>
                        {system.rules.map((rule) => (
                          <div
                            key={rule.id}
                            className={cn(
                              'flex items-center gap-2 py-1.5 px-3 rounded-md text-sm',
                              rule.severity === 'hard'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-yellow-50 text-yellow-700'
                            )}
                          >
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-card/60">
                              {rule.severity === 'hard' ? '硬性' : '软性'}
                            </span>
                            <span>{rule.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
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
