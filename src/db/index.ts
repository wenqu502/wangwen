import Dexie, { type Table } from 'dexie'
import type { Work, Character, PlotNode, RelationEdge, WorkSystem, Idea } from '@/types'

class WangWenDB extends Dexie {
  works!: Table<Work>
  characters!: Table<Character>
  plotNodes!: Table<PlotNode>
  relations!: Table<RelationEdge>
  systems!: Table<WorkSystem>
  ideas!: Table<Idea>

  constructor() {
    super('wangwen-db')

    // === v1: 初始版本 (2026-05-03) ===
    this.version(1).stores({
      works: 'id, name, createdAt',
      characters: 'id, workId, [workId+name], createdAt',
      plotNodes: 'id, workId, [workId+status]',
      relations: 'id, workId, [workId+sourceId], [workId+targetId]',
      systems: 'id, workId',
      ideas: 'id, workId, [workId+status]',
    })

    // === v2: 索引优化 + 缺失字段补全 ===
    this.version(2)
      .stores({
        works: 'id, name, createdAt',
        characters: 'id, workId, [workId+name], createdAt',
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
              record.relations = record.relations || []
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
