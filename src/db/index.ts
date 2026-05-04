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
      characters: 'id, workId, name, [workId+name], createdAt',
      plotNodes: 'id, workId, [workId+status], createdAt',
      relations: 'id, workId, [workId+sourceId], createdAt',
      systems: 'id, workId, createdAt',
      ideas: 'id, workId, [workId+status], createdAt',
    })

    // === v2: 索引优化 + 角色状态字段 (预留) ===
    // this.version(2)
    //   .stores({
    //     characters: 'id, [workId+name], [workId+status], createdAt',
    //     relations: 'id, [workId+sourceId], [workId+targetId], createdAt',
    //   })
    //   .upgrade((tx) => {
    //     return tx.table('characters').toCollection().modify((char) => {
    //       char.status = char.status || 'alive'
    //       char.powerLevel = char.powerLevel || 0
    //     })
    //   })

    // === v3: 作品标签功能 (预留) ===
    // this.version(3)
    //   .stores({
    //     works: 'id, name, *tags, createdAt',
    //   })
    //   .upgrade((tx) => {
    //     return tx.table('works').toCollection().modify((work) => {
    //       work.tags = work.tags || []
    //     })
    //   })
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
