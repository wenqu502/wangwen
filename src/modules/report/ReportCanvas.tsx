import { useCharacterList } from '@/modules/character/store'
import { usePlotNodeList } from '@/modules/plot/store'
import { useRelationEdgeList } from '@/modules/relation/store'
import { useSystemList } from '@/modules/system/store'
import { useIdeaList } from '@/modules/idea/store'
import { FileCheck, AlertTriangle, CheckCircle, Users, GitBranch, Network, Layers, Lightbulb } from 'lucide-react'

export function ReportCanvas() {
  const characters = useCharacterList()
  const plotNodes = usePlotNodeList()
  const relations = useRelationEdgeList()
  const systems = useSystemList()
  const ideas = useIdeaList()

  const stats = [
    { label: '角色', count: characters.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: '剧情节点', count: plotNodes.length, icon: GitBranch, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '关系', count: relations.length, icon: Network, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '体系', count: systems.length, icon: Layers, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: '灵感', count: ideas.length, icon: Lightbulb, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ]

  const incompleteChars = characters.filter((c) => !c.appearance || !c.background || !c.personality?.surface)
  const orphanNodes = plotNodes.filter((n) => n.parentIds.length === 0 && n.status === 'todo')
  const hiddenRelations = relations.filter((r) => r.isHidden)

  const checks = [
    {
      title: '角色档案完整度',
      ok: incompleteChars.length === 0,
      detail: incompleteChars.length === 0
        ? '所有角色档案填写完整'
        : `${incompleteChars.length} 个角色档案信息不完整`,
    },
    {
      title: '剧情节点关联检查',
      ok: orphanNodes.length === 0,
      detail: orphanNodes.length === 0
        ? '所有节点已正确关联'
        : `${orphanNodes.length} 个待写节点未关联父节点`,
    },
    {
      title: '隐藏关系提示',
      ok: true,
      detail: hiddenRelations.length === 0
        ? '暂无隐藏关系'
        : `${hiddenRelations.length} 条隐藏关系待揭露`,
    },
    {
      title: '灵感便签状态',
      ok: ideas.length > 0,
      detail: ideas.length === 0 ? '暂无灵感记录' : `${ideas.length} 条灵感已记录`,
    },
  ]

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <FileCheck className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-neutral-900">校验报告</h2>
      </div>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-5 gap-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} ${s.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{s.count}</p>
                <p className="text-xs text-neutral-500">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* 校验项 */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
        <h3 className="font-semibold text-neutral-900">一致性校验</h3>
        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check.title} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50">
              {check.ok ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-neutral-800">{check.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 提示 */}
      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-800">
        <p className="font-medium mb-1">AI 智能校验</p>
        <p className="text-indigo-600/80 text-xs">
          当前为简化版校验报告。完整版将支持 AI 自动扫描人设一致性、伏笔追踪、规则冲突检测等功能。
        </p>
      </div>
    </div>
  )
}
