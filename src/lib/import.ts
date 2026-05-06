import { db } from '@/db'
import type { Work, Character, PlotNode, RelationEdge, WorkSystem, Idea, StoryEvent, EventEdge } from '@/types'

export interface ExportPayload {
  meta: {
    exportedAt: string
    version: string
    workName: string
  }
  work: Work
  characters: Character[]
  plotNodes: PlotNode[]
  relations: RelationEdge[]
  systems: WorkSystem[]
  ideas: Idea[]
  events?: StoryEvent[]
  eventEdges?: EventEdge[]
}

/** 导入作品数据（P2-005） */
export async function importWork(file: File): Promise<{ success: true; workId: string } | { success: false; error: string }> {
  try {
    const text = await file.text()
    const payload: ExportPayload = JSON.parse(text)

    // 基础校验
    if (!payload.work || !payload.work.id) {
      return { success: false, error: '无效的作品文件：缺少作品信息' }
    }

    const workId = payload.work.id

    // 写入作品
    await db.works.put({ ...payload.work, updatedAt: new Date().toISOString() })

    // 清除该作品旧数据（避免重复）
    await Promise.all([
      db.characters.where('workId').equals(workId).delete(),
      db.plotNodes.where('workId').equals(workId).delete(),
      db.relations.where('workId').equals(workId).delete(),
      db.systems.where('workId').equals(workId).delete(),
      db.ideas.where('workId').equals(workId).delete(),
      db.events.where('workId').equals(workId).delete(),
      db.eventEdges.where('workId').equals(workId).delete(),
    ])

    // 写入新数据
    if (payload.characters?.length) await db.characters.bulkAdd(payload.characters)
    if (payload.plotNodes?.length) await db.plotNodes.bulkAdd(payload.plotNodes)
    if (payload.relations?.length) await db.relations.bulkAdd(payload.relations)
    if (payload.systems?.length) await db.systems.bulkAdd(payload.systems)
    if (payload.ideas?.length) await db.ideas.bulkAdd(payload.ideas)
    if (payload.events?.length) await db.events.bulkAdd(payload.events)
    if (payload.eventEdges?.length) await db.eventEdges.bulkAdd(payload.eventEdges)

    return { success: true, workId }
  } catch (err) {
    return {
      success: false,
      error: `导入失败: ${err instanceof Error ? err.message : '未知错误'}`,
    }
  }
}
