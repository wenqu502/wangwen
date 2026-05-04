/**
 * DB 读写操作层 (P1-004 读写分离 + P1-005 事务优化)
 *
 * 设计原则：
 * 1. 读操作：简单查询封装，统一返回类型
 * 2. 写操作：事务包裹，原子性保证
 * 3. 错误处理：结构化错误，支持调用方决定提示方式
 */

import { db } from './index'
import type { Work, Character, PlotNode, RelationEdge, WorkSystem, Idea } from '@/types'

// === 错误类型 ===

export class DBError extends Error {
  constructor(
    message: string,
    public readonly code: 'READ_ERROR' | 'WRITE_ERROR' | 'TRANSACTION_ERROR' | 'NOT_FOUND',
    public readonly table?: string,
    public readonly originalError?: unknown,
  ) {
    super(message)
    this.name = 'DBError'
  }
}

// === 读操作 (P1-004: 读写分离) ===

/** 按 workId 读取角色列表 */
export async function readCharactersByWorkId(workId: string): Promise<Character[]> {
  try {
    return await db.characters.where('workId').equals(workId).toArray()
  } catch (err) {
    throw new DBError('读取角色数据失败', 'READ_ERROR', 'characters', err)
  }
}

/** 按 workId 读取剧情节点列表 */
export async function readPlotNodesByWorkId(workId: string): Promise<PlotNode[]> {
  try {
    return await db.plotNodes.where('workId').equals(workId).toArray()
  } catch (err) {
    throw new DBError('读取剧情数据失败', 'READ_ERROR', 'plotNodes', err)
  }
}

/** 按 workId 读取关系列表 */
export async function readRelationsByWorkId(workId: string): Promise<RelationEdge[]> {
  try {
    return await db.relations.where('workId').equals(workId).toArray()
  } catch (err) {
    throw new DBError('读取关系数据失败', 'READ_ERROR', 'relations', err)
  }
}

/** 按 workId 读取体系列表 */
export async function readSystemsByWorkId(workId: string): Promise<WorkSystem[]> {
  try {
    return await db.systems.where('workId').equals(workId).toArray()
  } catch (err) {
    throw new DBError('读取体系数据失败', 'READ_ERROR', 'systems', err)
  }
}

/** 按 workId 读取灵感列表 */
export async function readIdeasByWorkId(workId: string): Promise<Idea[]> {
  try {
    return await db.ideas.where('workId').equals(workId).toArray()
  } catch (err) {
    throw new DBError('读取灵感数据失败', 'READ_ERROR', 'ideas', err)
  }
}

/** 读取作品列表 */
export async function readAllWorks(): Promise<Work[]> {
  try {
    return await db.works.toArray()
  } catch (err) {
    throw new DBError('读取作品列表失败', 'READ_ERROR', 'works', err)
  }
}

/** 按 ID 读取单个角色 */
export async function readCharacterById(id: string): Promise<Character | undefined> {
  try {
    return await db.characters.get(id)
  } catch (err) {
    throw new DBError('读取角色失败', 'READ_ERROR', 'characters', err)
  }
}

// === 写操作 (P1-005: 事务优化 + 统一错误处理) ===

interface WriteResult<T> {
  success: boolean
  data?: T
  error?: DBError
}

/** 添加角色 — 事务包裹 */
export async function writeAddCharacter(char: Character): Promise<WriteResult<Character>> {
  try {
    await db.transaction('rw', db.characters, async () => {
      await db.characters.add(char)
    })
    return { success: true, data: char }
  } catch (err) {
    const dbErr = new DBError('添加角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[DB] writeAddCharacter:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新角色 */
export async function writeUpdateCharacter(char: Character): Promise<WriteResult<Character>> {
  try {
    await db.transaction('rw', db.characters, async () => {
      await db.characters.put(char)
    })
    return { success: true, data: char }
  } catch (err) {
    const dbErr = new DBError('更新角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[DB] writeUpdateCharacter:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除角色 */
export async function writeDeleteCharacter(id: string): Promise<WriteResult<void>> {
  try {
    await db.transaction('rw', db.characters, async () => {
      await db.characters.delete(id)
    })
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[DB] writeDeleteCharacter:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加剧情节点 */
export async function writeAddPlotNode(node: PlotNode): Promise<WriteResult<PlotNode>> {
  try {
    await db.transaction('rw', db.plotNodes, async () => {
      await db.plotNodes.add(node)
    })
    return { success: true, data: node }
  } catch (err) {
    const dbErr = new DBError('添加剧情节点失败', 'WRITE_ERROR', 'plotNodes', err)
    console.error('[DB] writeAddPlotNode:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新剧情节点 */
export async function writeUpdatePlotNode(node: PlotNode): Promise<WriteResult<PlotNode>> {
  try {
    await db.transaction('rw', db.plotNodes, async () => {
      await db.plotNodes.put(node)
    })
    return { success: true, data: node }
  } catch (err) {
    const dbErr = new DBError('更新剧情节点失败', 'WRITE_ERROR', 'plotNodes', err)
    console.error('[DB] writeUpdatePlotNode:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除剧情节点 */
export async function writeDeletePlotNode(id: string): Promise<WriteResult<void>> {
  try {
    await db.transaction('rw', db.plotNodes, async () => {
      await db.plotNodes.delete(id)
    })
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除剧情节点失败', 'WRITE_ERROR', 'plotNodes', err)
    console.error('[DB] writeDeletePlotNode:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加关系 */
export async function writeAddRelation(edge: RelationEdge): Promise<WriteResult<RelationEdge>> {
  try {
    await db.transaction('rw', db.relations, async () => {
      await db.relations.add(edge)
    })
    return { success: true, data: edge }
  } catch (err) {
    const dbErr = new DBError('添加关系失败', 'WRITE_ERROR', 'relations', err)
    console.error('[DB] writeAddRelation:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新关系 */
export async function writeUpdateRelation(edge: RelationEdge): Promise<WriteResult<RelationEdge>> {
  try {
    await db.transaction('rw', db.relations, async () => {
      await db.relations.put(edge)
    })
    return { success: true, data: edge }
  } catch (err) {
    const dbErr = new DBError('更新关系失败', 'WRITE_ERROR', 'relations', err)
    console.error('[DB] writeUpdateRelation:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除关系 */
export async function writeDeleteRelation(id: string): Promise<WriteResult<void>> {
  try {
    await db.transaction('rw', db.relations, async () => {
      await db.relations.delete(id)
    })
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除关系失败', 'WRITE_ERROR', 'relations', err)
    console.error('[DB] writeDeleteRelation:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加体系 */
export async function writeAddSystem(system: WorkSystem): Promise<WriteResult<WorkSystem>> {
  try {
    await db.transaction('rw', db.systems, async () => {
      await db.systems.add(system)
    })
    return { success: true, data: system }
  } catch (err) {
    const dbErr = new DBError('添加体系失败', 'WRITE_ERROR', 'systems', err)
    console.error('[DB] writeAddSystem:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新体系 */
export async function writeUpdateSystem(system: WorkSystem): Promise<WriteResult<WorkSystem>> {
  try {
    await db.transaction('rw', db.systems, async () => {
      await db.systems.put(system)
    })
    return { success: true, data: system }
  } catch (err) {
    const dbErr = new DBError('更新体系失败', 'WRITE_ERROR', 'systems', err)
    console.error('[DB] writeUpdateSystem:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除体系 */
export async function writeDeleteSystem(id: string): Promise<WriteResult<void>> {
  try {
    await db.transaction('rw', db.systems, async () => {
      await db.systems.delete(id)
    })
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除体系失败', 'WRITE_ERROR', 'systems', err)
    console.error('[DB] writeDeleteSystem:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加灵感 */
export async function writeAddIdea(idea: Idea): Promise<WriteResult<Idea>> {
  try {
    await db.transaction('rw', db.ideas, async () => {
      await db.ideas.add(idea)
    })
    return { success: true, data: idea }
  } catch (err) {
    const dbErr = new DBError('添加灵感失败', 'WRITE_ERROR', 'ideas', err)
    console.error('[DB] writeAddIdea:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新灵感 */
export async function writeUpdateIdea(idea: Idea): Promise<WriteResult<Idea>> {
  try {
    await db.transaction('rw', db.ideas, async () => {
      await db.ideas.put(idea)
    })
    return { success: true, data: idea }
  } catch (err) {
    const dbErr = new DBError('更新灵感失败', 'WRITE_ERROR', 'ideas', err)
    console.error('[DB] writeUpdateIdea:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除灵感 */
export async function writeDeleteIdea(id: string): Promise<WriteResult<void>> {
  try {
    await db.transaction('rw', db.ideas, async () => {
      await db.ideas.delete(id)
    })
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除灵感失败', 'WRITE_ERROR', 'ideas', err)
    console.error('[DB] writeDeleteIdea:', dbErr)
    return { success: false, error: dbErr }
  }
}

// === 批量操作 ===

/** 批量添加角色 */
export async function writeBulkAddCharacters(chars: Character[]): Promise<WriteResult<number>> {
  try {
    await db.transaction('rw', db.characters, async () => {
      await db.characters.bulkAdd(chars)
    })
    return { success: true, data: chars.length }
  } catch (err) {
    const dbErr = new DBError('批量添加角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[DB] writeBulkAddCharacters:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 批量更新角色 */
export async function writeBulkPutCharacters(chars: Character[]): Promise<WriteResult<number>> {
  try {
    await db.transaction('rw', db.characters, async () => {
      await db.characters.bulkPut(chars)
    })
    return { success: true, data: chars.length }
  } catch (err) {
    const dbErr = new DBError('批量更新角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[DB] writeBulkPutCharacters:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 全量数据加载（初始化用） */
export async function loadAllDataByWorkId(workId: string) {
  try {
    const [characters, plotNodes, relations, systems, ideas] = await db.transaction(
      'r',
      [db.characters, db.plotNodes, db.relations, db.systems, db.ideas],
      async () => {
        return await Promise.all([
          db.characters.where('workId').equals(workId).toArray(),
          db.plotNodes.where('workId').equals(workId).toArray(),
          db.relations.where('workId').equals(workId).toArray(),
          db.systems.where('workId').equals(workId).toArray(),
          db.ideas.where('workId').equals(workId).toArray(),
        ])
      },
    )
    return { success: true as const, characters, plotNodes, relations, systems, ideas }
  } catch (err) {
    const dbErr = new DBError('加载数据失败', 'READ_ERROR', undefined, err)
    console.error('[DB] loadAllDataByWorkId:', dbErr)
    return { success: false as const, error: dbErr }
  }
}
