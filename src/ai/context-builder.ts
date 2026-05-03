import { db } from '@/db'

export async function buildWorkContext(workId: string | null): Promise<string> {
  if (!workId) return '当前没有选中的作品。'

  const work = await db.works.get(workId)
  const characters = await db.characters.where('workId').equals(workId).toArray()
  const plotNodes = await db.plotNodes.where('workId').equals(workId).toArray()
  const relations = await db.relations.where('workId').equals(workId).toArray()
  const systems = await db.systems.where('workId').equals(workId).toArray()
  const ideas = await db.ideas.where('workId').equals(workId).and(i => i.status === 'pending').toArray()

  const parts: string[] = []

  parts.push(`## 作品信息`)
  parts.push(`- 名称: ${work?.name ?? '未命名'}`)
  parts.push(`- 类型: ${work?.genre ?? '未指定'}`)
  parts.push(`- 总章节数: ${work?.totalChapters ?? '未指定'}`)

  if (characters.length > 0) {
    parts.push(`\n## 角色列表 (${characters.length} 个)`)
    for (const c of characters) {
      parts.push(`- ${c.name}: ${c.tags.join(', ')} | ${c.personality.keywords.join(', ')}`)
    }
  }

  if (plotNodes.length > 0) {
    parts.push(`\n## 剧情骨架 (${plotNodes.length} 个节点)`)
    for (const n of plotNodes.slice(0, 20)) {
      parts.push(`- ${n.id}: ${n.title} (${n.status})`)
    }
    if (plotNodes.length > 20) {
      parts.push(`- ... 还有 ${plotNodes.length - 20} 个节点`)
    }
  }

  if (relations.length > 0) {
    parts.push(`\n## 关系网络 (${relations.length} 组)`)
    for (const r of relations) {
      parts.push(`- ${r.sourceId} → ${r.targetId}: ${r.type}`)
    }
  }

  if (systems.length > 0) {
    parts.push(`\n## 体系设定 (${systems.length} 个)`)
    for (const s of systems) {
      parts.push(`- ${s.name}: ${s.branches.map(b => b.name).join(', ')}`)
    }
  }

  if (ideas.length > 0) {
    parts.push(`\n## 未归档灵感 (${ideas.length} 条)`)
    for (const i of ideas.slice(0, 10)) {
      parts.push(`- ${i.content}`)
    }
    if (ideas.length > 10) {
      parts.push(`- ... 还有 ${ideas.length - 10} 条灵感`)
    }
  }

  return parts.join('\n')
}
