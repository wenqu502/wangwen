import Dexie, { type Table } from 'dexie'
import type { Work, Character, PlotNode, RelationEdge, WorkSystem, Idea, StoryEvent, EventEdge } from '@/types'
import type { Conversation } from '@/ai/types'

/**
 * 业务数据库（P1-004: IndexedDB 分区）
 *
 * 分区策略：
 * - wangwen-db（此文件）: 存储业务数据，使用 Dexie + IndexedDB
 *   包含：作品、角色、剧情节点、关系、体系、灵感、事件
 * - wangwen-app-store（src/stores/app-store.ts）: 存储应用状态，使用 zustand persist + localStorage
 *   包含：当前作品ID、当前Tab、面板开关、消息记录
 *
 * 两者完全隔离，禁止交叉引用。
 */
class WangWenDB extends Dexie {
  works!: Table<Work>
  characters!: Table<Character>
  plotNodes!: Table<PlotNode>
  relations!: Table<RelationEdge>
  systems!: Table<WorkSystem>
  ideas!: Table<Idea>
  events!: Table<StoryEvent>
  eventEdges!: Table<EventEdge>
  conversations!: Table<Conversation>

  constructor() {
    super('wangwen-db')

    // === v1: 初始版本 (2026-05-03) ===
    this.version(1).stores({
      works: 'id, name, createdAt',
      characters: 'id, workId, [workId+name]',
      plotNodes: 'id, workId, [workId+status]',
      relations: 'id, workId, [workId+sourceId], [workId+targetId]',
      systems: 'id, workId',
      ideas: 'id, workId, [workId+status]',
    })

    // === v2: 索引优化 + 缺失字段补全 ===
    this.version(2)
      .stores({
        works: 'id, name, createdAt',
        characters: 'id, workId, [workId+name]',
        plotNodes: 'id, workId, [workId+status], createdAt',
        relations: 'id, workId, [workId+sourceId], [workId+targetId], createdAt',
        systems: 'id, workId, createdAt',
        ideas: 'id, workId, [workId+status], createdAt',
      })
      .upgrade((tx) => {
        // 补全可能缺失的字段，确保旧数据兼容
        const tables = ['characters', 'plotNodes', 'relations', 'systems', 'ideas']
        const mods = tables.map((tableName) => {
          return tx.table(tableName).toCollection().modify((record: Record<string, unknown>) => {
            if (!record.createdAt) record.createdAt = new Date().toISOString()
            if (tableName !== 'ideas' && tableName !== 'relations' && !record.updatedAt) {
              record.updatedAt = record.createdAt
            }
            if (tableName === 'characters') {
              record.status = record.status || 'alive'
              record.images = record.images || []
            }
            if (tableName === 'plotNodes') {
              record.status = record.status || 'todo'
              record.childIds = record.childIds || []
              record.foreshadowing = record.foreshadowing || []
              record.payoff = record.payoff || []
            }
            if (tableName === 'relations') {
              record.isHidden = record.isHidden ?? false
            }
            if (tableName === 'systems') {
              record.branches = record.branches || []
              record.rules = record.rules || []
            }
            if (tableName === 'ideas') {
              record.status = record.status || 'pending'
              record.tags = record.tags || []
            }
          })
        })
        return Promise.all(mods)
      })

    // === v3: 移除冗余单字段索引 (P1-008)
    // 复合索引的最左前缀可覆盖单字段查询，减少写入开销和存储空间
    this.version(3).stores({
      works: 'id, name, createdAt',
      // [workId+name] 复合索引的前缀 workId 可覆盖 where('workId').equals() 查询
      characters: 'id, [workId+name]',
      // [workId+status] 复合索引的前缀 workId 可覆盖 where('workId').equals() 查询
      plotNodes: 'id, [workId+status], createdAt',
      // [workId+sourceId] 和 [workId+targetId] 的前缀 workId 均可覆盖
      relations: 'id, [workId+sourceId], [workId+targetId], createdAt',
      // systems 无复合索引，保留 workId 单字段索引
      systems: 'id, workId, createdAt',
      // [workId+status] 复合索引的前缀 workId 可覆盖
      ideas: 'id, [workId+status], createdAt',
    })

    // === v4: 添加对话历史表 (P1-009: AI对话优化模块)
    this.version(4).stores({
      works: 'id, name, createdAt',
      characters: 'id, [workId+name]',
      plotNodes: 'id, [workId+status], createdAt',
      relations: 'id, [workId+sourceId], [workId+targetId], createdAt',
      systems: 'id, workId, createdAt',
      ideas: 'id, [workId+status], createdAt',
      conversations: 'id, workId, updatedAt',
    })

    // === v5: 添加事件图谱表 ===
    this.version(5).stores({
      works: 'id, name, createdAt',
      characters: 'id, [workId+name]',
      plotNodes: 'id, [workId+status], createdAt',
      relations: 'id, [workId+sourceId], [workId+targetId], createdAt',
      systems: 'id, workId, createdAt',
      ideas: 'id, [workId+status], createdAt',
      events: 'id, workId, [workId+type], createdAt',
      eventEdges: 'id, workId, [workId+sourceId], [workId+targetId], createdAt',
      conversations: 'id, workId, updatedAt',
    })
  }
}

export const db = new WangWenDB()

// === 数据库状态监控 ===
let _dbReady = false
let _dbError: Error | null = null

db.open()
  .then(() => {
    _dbReady = true
    console.log('[Dexie] 数据库连接成功，版本:', db.verno)
  })
  .catch((err) => {
    _dbError = err
    console.error('[Dexie] 数据库连接失败:', err)
  })

export function isDBReady(): boolean {
  return _dbReady
}

export function getDBError(): Error | null {
  return _dbError
}
