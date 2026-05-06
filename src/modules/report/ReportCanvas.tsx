import { useCharacterList } from '@/modules/character/store'
import { usePlotNodeList } from '@/modules/plot/store'
import { useRelationEdgeList } from '@/modules/relation/store'
import { useSystemList } from '@/modules/system/store'
import { useIdeaList } from '@/modules/idea/store'
import { FileCheck, AlertTriangle, CheckCircle, Users, GitBranch, Network, Layers, Lightbulb } from 'lucide-react'
import { detectForeshadowingPayoff, detectRuleConflicts, detectCharacterInconsistencies } from '@/ai/intelligence'

export function ReportCanvas() {
  const characters = useCharacterList()
  const plotNodes = usePlotNodeList()
  const relations = useRelationEdgeList()
  const systems = useSystemList()
  const ideas = useIdeaList()

  const stats = [
    { label: '角色', count: characters.length, icon: Users, color: 'text-brand', bg: 'bg-brand-light' },
    { label: '剧情节点', count: plotNodes.length, icon: GitBranch, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '关系', count: relations.length, icon: Network, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '体系', count: systems.length, icon: Layers, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: '灵感', count: ideas.length, icon: Lightbulb, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ]

  const incompleteChars = characters.filter((c) => !c.appearance || !c.background || !c.personality?.surface)
  const orphanNodes = plotNodes.filter((n) => n.parentIds.length === 0 && n.status === 'todo')
  const hiddenRelations = relations.filter((r) => r.isHidden)

  // Batch5: 集成 AI 智能检测框架
  const foreshadowingIssues = detectForeshadowingPayoff(plotNodes)
  const ruleConflicts = detectRuleConflicts(systems)
  const charInconsistencies = detectCharacterInconsistencies(characters)

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
    {
      title: '人设一致性校验',
      ok: charInconsistencies.length === 0,
      detail: charInconsistencies.length === 0
        ? '所有人设逻辑一致'
        : `发现 ${charInconsistencies.length} 处人设不一致`,
    },
    {
      title: '伏笔追踪',
      ok: foreshadowingIssues.length === 0,
      detail: foreshadowingIssues.length === 0
        ? '所有伏笔已正确回收'
        : `发现 ${foreshadowingIssues.length} 个伏笔问题`,
    },
    {
      title: '规则冲突检测',
      ok: ruleConflicts.length === 0,
      detail: ruleConflicts.length === 0
        ? '世界观规则无冲突'
        : `发现 ${ruleConflicts.length} 条规则冲突`,
    },
  ]

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <FileCheck className="w-5 h-5 text-brand" />
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

      {/* Batch5: 智能检测详情展开 */}
      {(foreshadowingIssues.length > 0 || ruleConflicts.length > 0 || charInconsistencies.length > 0) && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
          <h3 className="font-semibold text-neutral-900">检测详情</h3>
          {charInconsistencies.map((issue, i) => (
            <div key={`char-${i}`} className="flex items-start gap-2 text-sm p-2 rounded bg-red-50 text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{issue.characterName}：{issue.message}</span>
            </div>
          ))}
          {foreshadowingIssues.map((issue, i) => (
            <div key={`fs-${i}`} className="flex items-start gap-2 text-sm p-2 rounded bg-amber-50 text-amber-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>「{issue.title}」{issue.message}</span>
            </div>
          ))}
          {ruleConflicts.map((issue, i) => (
            <div key={`rule-${i}`} className="flex items-start gap-2 text-sm p-2 rounded bg-blue-50 text-blue-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>「{issue.systemName}」{issue.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
