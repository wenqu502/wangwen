/**
 * DB 读写操作层 (P1-004 读写分离 + P1-005 事务优化)
 *
 * 设计原则：
 * 1. 读操作：简单查询封装，统一返回类型
 * 2. 写操作：事务包裹，原子性保证
 * 3. 错误处理：结构化错误，支持调用方决定提示方式
 */

import { db } from './index'
import type { Work, Character, PlotNode, RelationEdge, WorkSystem, Idea, StoryEvent, EventEdge } from '@/types'
import type { Conversation } from '@/ai/types'
import { encryptObjectFields, decryptObjectFields } from '@/utils/crypto'

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

/** 按 workId 读取角色列表（P1-002: 自动解密敏感字段） */
export async function readCharactersByWorkId(workId: string): Promise<Character[]> {
  try {
    const list = await db.characters.where('workId').equals(workId).toArray()
    return await Promise.all(list.map((c) => decryptObjectFields(c)))
  } catch (err) {
    throw new DBError('读取角色数据失败', 'READ_ERROR', 'characters', err)
  }
}

/** 按 workId 读取剧情节点列表（P1-002: 自动解密敏感字段） */
export async function readPlotNodesByWorkId(workId: string): Promise<PlotNode[]> {
  try {
    const list = await db.plotNodes.where('workId').equals(workId).toArray()
    return await Promise.all(list.map((n) => decryptObjectFields(n)))
  } catch (err) {
    throw new DBError('读取剧情数据失败', 'READ_ERROR', 'plotNodes', err)
  }
}

/** 按 workId 读取关系列表（P1-002: 自动解密敏感字段） */
export async function readRelationsByWorkId(workId: string): Promise<RelationEdge[]> {
  try {
    const list = await db.relations.where('workId').equals(workId).toArray()
    return await Promise.all(list.map((r) => decryptObjectFields(r)))
  } catch (err) {
    throw new DBError('读取关系数据失败', 'READ_ERROR', 'relations', err)
  }
}

/** 按 workId 读取体系列表（P1-002: 自动解密敏感字段） */
export async function readSystemsByWorkId(workId: string): Promise<WorkSystem[]> {
  try {
    const list = await db.systems.where('workId').equals(workId).toArray()
    return await Promise.all(list.map((s) => decryptObjectFields(s)))
  } catch (err) {
    throw new DBError('读取体系数据失败', 'READ_ERROR', 'systems', err)
  }
}

/** 按 workId 读取灵感列表（P1-002: 自动解密敏感字段） */
export async function readIdeasByWorkId(workId: string): Promise<Idea[]> {
  try {
    const list = await db.ideas.where('workId').equals(workId).toArray()
    return await Promise.all(list.map((i) => decryptObjectFields(i)))
  } catch (err) {
    throw new DBError('读取灵感数据失败', 'READ_ERROR', 'ideas', err)
  }
}

/** 按 workId 读取事件列表（P1-002: 自动解密敏感字段） */
export async function readEventsByWorkId(workId: string): Promise<StoryEvent[]> {
  try {
    const list = await db.events.where('workId').equals(workId).toArray()
    return await Promise.all(list.map((e) => decryptObjectFields(e)))
  } catch (err) {
    throw new DBError('读取事件数据失败', 'READ_ERROR', 'events', err)
  }
}

/** 按 workId 读取事件边列表（P1-002: 自动解密敏感字段） */
export async function readEventEdgesByWorkId(workId: string): Promise<EventEdge[]> {
  try {
    const list = await db.eventEdges.where('workId').equals(workId).toArray()
    return await Promise.all(list.map((e) => decryptObjectFields(e)))
  } catch (err) {
    throw new DBError('读取事件边数据失败', 'READ_ERROR', 'eventEdges', err)
  }
}

/** 读取作品列表（P1-002: 自动解密敏感字段） */
export async function readAllWorks(): Promise<Work[]> {
  try {
    const list = await db.works.toArray()
    return await Promise.all(list.map((w) => decryptObjectFields(w)))
  } catch (err) {
    throw new DBError('读取作品列表失败', 'READ_ERROR', 'works', err)
  }
}

/** 添加作品（P1-002: 写入前加密敏感字段） */
export async function writeAddWork(work: Work): Promise<WriteResult<Work>> {
  try {
    const encrypted = await encryptObjectFields(work)
    await db.transaction('rw', db.works, async () => {
      await db.works.add(encrypted)
    })
    return { success: true, data: work }
  } catch (err) {
    const dbErr = new DBError('添加作品失败', 'WRITE_ERROR', 'works', err)
    console.error('[DB] writeAddWork:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除作品（级联删除关联数据） */
export async function writeDeleteWork(id: string): Promise<WriteResult<void>> {
  try {
    await db.transaction('rw', [db.works, db.characters, db.plotNodes, db.relations, db.systems, db.ideas, db.events, db.eventEdges, db.conversations], async () => {
      await db.works.delete(id)
      await db.characters.where('workId').equals(id).delete()
      await db.plotNodes.where('workId').equals(id).delete()
      await db.relations.where('workId').equals(id).delete()
      await db.systems.where('workId').equals(id).delete()
      await db.ideas.where('workId').equals(id).delete()
      await db.events.where('workId').equals(id).delete()
      await db.eventEdges.where('workId').equals(id).delete()
      await db.conversations.where('workId').equals(id).delete()
    })
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除作品失败', 'WRITE_ERROR', 'works', err)
    console.error('[DB] writeDeleteWork:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加作品（P1-002: 写入前加密敏感字段） */
export async function writeAddWork(work: Work): Promise<WriteResult<Work>> {
  try {
    const encrypted = await encryptObjectFields(work)
    await db.transaction('rw', db.works, async () => {
      await db.works.add(encrypted)
    })
    return { success: true, data: work }
  } catch (err) {
    const dbErr = new DBError('添加作品失败', 'WRITE_ERROR', 'works', err)
    console.error('[DB] writeAddWork:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除作品（级联删除关联数据） */
export async function writeDeleteWork(id: string): Promise<WriteResult<void>> {
  try {
    await db.transaction('rw', [db.works, db.characters, db.plotNodes, db.relations, db.systems, db.ideas, db.events, db.eventEdges, db.conversations], async () => {
      await db.works.delete(id)
      await db.characters.where('workId').equals(id).delete()
      await db.plotNodes.where('workId').equals(id).delete()
      await db.relations.where('workId').equals(id).delete()
      await db.systems.where('workId').equals(id).delete()
      await db.ideas.where('workId').equals(id).delete()
      await db.events.where('workId').equals(id).delete()
      await db.eventEdges.where('workId').equals(id).delete()
      await db.conversations.where('workId').equals(id).delete()
    })
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除作品失败', 'WRITE_ERROR', 'works', err)
    console.error('[DB] writeDeleteWork:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 按 ID 读取单个角色（P1-002: 自动解密） */
export async function readCharacterById(id: string): Promise<Character | undefined> {
  try {
    const raw = await db.characters.get(id)
    return raw ? await decryptObjectFields(raw) : undefined
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

/** 添加角色 — 事务包裹（P1-002: 写入前加密敏感字段） */
export async function writeAddCharacter(char: Character): Promise<WriteResult<Character>> {
  try {
    const encrypted = await encryptObjectFields(char)
    await db.transaction('rw', db.characters, async () => {
      await db.characters.add(encrypted)
    })
    return { success: true, data: char }
  } catch (err) {
    const dbErr = new DBError('添加角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[DB] writeAddCharacter:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新角色（P1-002: 写入前加密敏感字段） */
export async function writeUpdateCharacter(char: Character): Promise<WriteResult<Character>> {
  try {
    const encrypted = await encryptObjectFields(char)
    await db.transaction('rw', db.characters, async () => {
      await db.characters.put(encrypted)
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

/** 添加剧情节点（P1-002: 写入前加密敏感字段） */
export async function writeAddPlotNode(node: PlotNode): Promise<WriteResult<PlotNode>> {
  try {
    const encrypted = await encryptObjectFields(node)
    await db.transaction('rw', db.plotNodes, async () => {
      await db.plotNodes.add(encrypted)
    })
    return { success: true, data: node }
  } catch (err) {
    const dbErr = new DBError('添加剧情节点失败', 'WRITE_ERROR', 'plotNodes', err)
    console.error('[DB] writeAddPlotNode:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新剧情节点（P1-002: 写入前加密敏感字段） */
export async function writeUpdatePlotNode(node: PlotNode): Promise<WriteResult<PlotNode>> {
  try {
    const encrypted = await encryptObjectFields(node)
    await db.transaction('rw', db.plotNodes, async () => {
      await db.plotNodes.put(encrypted)
    })
    return { success: true, data: node }
  } catch (err) {
    const dbErr = new DBError('更新剧情节点失败', 'WRITE_ERROR', 'plotNodes', err)
    console.error('[DB] writeUpdatePlotNode:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除剧情节点（P0-005: 级联清理 parentIds/childIds） */
export async function writeDeletePlotNode(id: string): Promise<WriteResult<void>> {
  try {
    await db.transaction('rw', db.plotNodes, async () => {
      // 先清理其他节点对该节点的引用
      const related = await db.plotNodes
        .where('parentIds')
        .equals(id)
        .or('childIds')
        .equals(id)
        .toArray()
      for (const node of related) {
        const updated = { ...node, parentIds: node.parentIds.filter((pid) => pid !== id), childIds: node.childIds.filter((cid) => cid !== id) }
        await db.plotNodes.put(updated)
      }
      await db.plotNodes.delete(id)
    })
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除剧情节点失败', 'WRITE_ERROR', 'plotNodes', err)
    console.error('[DB] writeDeletePlotNode:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加关系（P1-002: 写入前加密敏感字段） */
export async function writeAddRelation(edge: RelationEdge): Promise<WriteResult<RelationEdge>> {
  try {
    const encrypted = await encryptObjectFields(edge)
    await db.transaction('rw', db.relations, async () => {
      await db.relations.add(encrypted)
    })
    return { success: true, data: edge }
  } catch (err) {
    const dbErr = new DBError('添加关系失败', 'WRITE_ERROR', 'relations', err)
    console.error('[DB] writeAddRelation:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新关系（P1-002: 写入前加密敏感字段） */
export async function writeUpdateRelation(edge: RelationEdge): Promise<WriteResult<RelationEdge>> {
  try {
    const encrypted = await encryptObjectFields(edge)
    await db.transaction('rw', db.relations, async () => {
      await db.relations.put(encrypted)
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

/** 添加体系（P1-002: 写入前加密敏感字段） */
export async function writeAddSystem(system: WorkSystem): Promise<WriteResult<WorkSystem>> {
  try {
    const encrypted = await encryptObjectFields(system)
    await db.transaction('rw', db.systems, async () => {
      await db.systems.add(encrypted)
    })
    return { success: true, data: system }
  } catch (err) {
    const dbErr = new DBError('添加体系失败', 'WRITE_ERROR', 'systems', err)
    console.error('[DB] writeAddSystem:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新体系（P1-002: 写入前加密敏感字段） */
export async function writeUpdateSystem(system: WorkSystem): Promise<WriteResult<WorkSystem>> {
  try {
    const encrypted = await encryptObjectFields(system)
    await db.transaction('rw', db.systems, async () => {
      await db.systems.put(encrypted)
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

/** 添加灵感（P1-002: 写入前加密敏感字段） */
export async function writeAddIdea(idea: Idea): Promise<WriteResult<Idea>> {
  try {
    const encrypted = await encryptObjectFields(idea)
    await db.transaction('rw', db.ideas, async () => {
      await db.ideas.add(encrypted)
    })
    return { success: true, data: idea }
  } catch (err) {
    const dbErr = new DBError('添加灵感失败', 'WRITE_ERROR', 'ideas', err)
    console.error('[DB] writeAddIdea:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新灵感（P1-002: 写入前加密敏感字段） */
export async function writeUpdateIdea(idea: Idea): Promise<WriteResult<Idea>> {
  try {
    const encrypted = await encryptObjectFields(idea)
    await db.transaction('rw', db.ideas, async () => {
      await db.ideas.put(encrypted)
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

/** 添加事件（P1-002: 写入前加密敏感字段） */
export async function writeAddEvent(event: StoryEvent): Promise<WriteResult<StoryEvent>> {
  try {
    const encrypted = await encryptObjectFields(event)
    await db.transaction('rw', db.events, async () => {
      await db.events.add(encrypted)
    })
    return { success: true, data: event }
  } catch (err) {
    const dbErr = new DBError('添加事件失败', 'WRITE_ERROR', 'events', err)
    console.error('[DB] writeAddEvent:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新事件（P1-002: 写入前加密敏感字段） */
export async function writeUpdateEvent(event: StoryEvent): Promise<WriteResult<StoryEvent>> {
  try {
    const encrypted = await encryptObjectFields(event)
    await db.transaction('rw', db.events, async () => {
      await db.events.put(encrypted)
    })
    return { success: true, data: event }
  } catch (err) {
    const dbErr = new DBError('更新事件失败', 'WRITE_ERROR', 'events', err)
    console.error('[DB] writeUpdateEvent:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除事件 */
export async function writeDeleteEvent(id: string): Promise<WriteResult<void>> {
  try {
    await db.transaction('rw', [db.events, db.eventEdges], async () => {
      await db.events.delete(id)
      // 级联删除相关边
      const edges = await db.eventEdges.where({ sourceId: id }).or('targetId').equals(id).toArray()
      await db.eventEdges.bulkDelete(edges.map((e) => e.id))
    })
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除事件失败', 'WRITE_ERROR', 'events', err)
    console.error('[DB] writeDeleteEvent:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加事件边（P1-002: 写入前加密敏感字段） */
export async function writeAddEventEdge(edge: EventEdge): Promise<WriteResult<EventEdge>> {
  try {
    const encrypted = await encryptObjectFields(edge)
    await db.transaction('rw', db.eventEdges, async () => {
      await db.eventEdges.add(encrypted)
    })
    return { success: true, data: edge }
  } catch (err) {
    const dbErr = new DBError('添加事件边失败', 'WRITE_ERROR', 'eventEdges', err)
    console.error('[DB] writeAddEventEdge:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新事件边（P1-002: 写入前加密敏感字段） */
export async function writeUpdateEventEdge(edge: EventEdge): Promise<WriteResult<EventEdge>> {
  try {
    const encrypted = await encryptObjectFields(edge)
    await db.transaction('rw', db.eventEdges, async () => {
      await db.eventEdges.put(encrypted)
    })
    return { success: true, data: edge }
  } catch (err) {
    const dbErr = new DBError('更新事件边失败', 'WRITE_ERROR', 'eventEdges', err)
    console.error('[DB] writeUpdateEventEdge:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除事件边 */
export async function writeDeleteEventEdge(id: string): Promise<WriteResult<void>> {
  try {
    await db.transaction('rw', db.eventEdges, async () => {
      await db.eventEdges.delete(id)
    })
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除事件边失败', 'WRITE_ERROR', 'eventEdges', err)
    console.error('[DB] writeDeleteEventEdge:', dbErr)
    return { success: false, error: dbErr }
  }
}

// === 批量操作 ===

/** 批量添加角色（P1-002: 写入前加密） */
export async function writeBulkAddCharacters(chars: Character[]): Promise<WriteResult<number>> {
  try {
    const encrypted = await Promise.all(chars.map((c) => encryptObjectFields(c)))
    await db.transaction('rw', db.characters, async () => {
      await db.characters.bulkAdd(encrypted)
    })
    return { success: true, data: chars.length }
  } catch (err) {
    const dbErr = new DBError('批量添加角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[DB] writeBulkAddCharacters:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 批量更新角色（P1-002: 写入前加密） */
export async function writeBulkPutCharacters(chars: Character[]): Promise<WriteResult<number>> {
  try {
    const encrypted = await Promise.all(chars.map((c) => encryptObjectFields(c)))
    await db.transaction('rw', db.characters, async () => {
      await db.characters.bulkPut(encrypted)
    })
    return { success: true, data: chars.length }
  } catch (err) {
    const dbErr = new DBError('批量更新角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[DB] writeBulkPutCharacters:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 全量数据加载（初始化用）（P1-002: 角色数据自动解密） */
export async function loadAllDataByWorkId(workId: string) {
  try {
    const [characters, plotNodes, relations, systems, ideas, events, eventEdges] = await db.transaction(
      'r',
      [db.characters, db.plotNodes, db.relations, db.systems, db.ideas, db.events, db.eventEdges],
      async () => {
        return await Promise.all([
          db.characters.where('workId').equals(workId).toArray(),
          db.plotNodes.where('workId').equals(workId).toArray(),
          db.relations.where('workId').equals(workId).toArray(),
          db.systems.where('workId').equals(workId).toArray(),
          db.ideas.where('workId').equals(workId).toArray(),
          db.events.where('workId').equals(workId).toArray(),
          db.eventEdges.where('workId').equals(workId).toArray(),
        ])
      },
    )
    const decryptedCharacters = await Promise.all(characters.map((c) => decryptObjectFields(c)))
    const decryptedPlotNodes = await Promise.all(plotNodes.map((n) => decryptObjectFields(n)))
    const decryptedRelations = await Promise.all(relations.map((r) => decryptObjectFields(r)))
    const decryptedSystems = await Promise.all(systems.map((s) => decryptObjectFields(s)))
    const decryptedIdeas = await Promise.all(ideas.map((i) => decryptObjectFields(i)))
    const decryptedEvents = await Promise.all(events.map((e) => decryptObjectFields(e)))
    const decryptedEventEdges = await Promise.all(eventEdges.map((e) => decryptObjectFields(e)))
    return {
      success: true as const,
      characters: decryptedCharacters,
      plotNodes: decryptedPlotNodes,
      relations: decryptedRelations,
      systems: decryptedSystems,
      ideas: decryptedIdeas,
      events: decryptedEvents,
      eventEdges: decryptedEventEdges,
    }
  } catch (err) {
    const dbErr = new DBError('加载数据失败', 'READ_ERROR', undefined, err)
    console.error('[DB] loadAllDataByWorkId:', dbErr)
    return { success: false as const, error: dbErr }
  }
}

// === 对话历史读写 (P1-009: AI对话优化模块) ===

/** 读取作品下的所有对话 */
export async function readConversationsByWorkId(workId: string): Promise<Conversation[]> {
  try {
    return await db.conversations.where('workId').equals(workId).sortBy('updatedAt')
  } catch (err) {
    throw new DBError('读取对话历史失败', 'READ_ERROR', 'conversations', err)
  }
}

/** 按 ID 读取单个对话 */
export async function readConversationById(id: string): Promise<Conversation | undefined> {
  try {
    return await db.conversations.get(id)
  } catch (err) {
    throw new DBError('读取对话失败', 'READ_ERROR', 'conversations', err)
  }
}

/** 保存/更新对话 */
export async function writeSaveConversation(conv: Conversation): Promise<WriteResult<Conversation>> {
  try {
    await db.transaction('rw', db.conversations, async () => {
      await db.conversations.put(conv)
    })
    return { success: true, data: conv }
  } catch (err) {
    const dbErr = new DBError('保存对话失败', 'WRITE_ERROR', 'conversations', err)
    console.error('[DB] writeSaveConversation:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除对话 */
export async function writeDeleteConversation(id: string): Promise<WriteResult<void>> {
  try {
    await db.transaction('rw', db.conversations, async () => {
      await db.conversations.delete(id)
    })
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除对话失败', 'WRITE_ERROR', 'conversations', err)
    console.error('[DB] writeDeleteConversation:', dbErr)
    return { success: false, error: dbErr }
  }
}

// === P0-002: 简化消息列表持久化适配 ===

import type { ChatMessage } from '@/stores/app-store'

/** 为作品加载消息列表（简化适配） */
export async function loadMessages(workId: string): Promise<ChatMessage[]> {
  try {
    const conv = await db.conversations.get(`msg_${workId}`)
    if (!conv || !conv.branches.length) return []
    const branch = conv.branches.find((b) => b.id === conv.activeBranchId) || conv.branches[0]
    return branch.messages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: m.timestamp,
    }))
  } catch (err) {
    console.error('[DB] loadMessages failed:', err)
    return []
  }
}

/** 保存作品的消息列表 */
export async function saveMessages(workId: string, messages: ChatMessage[]): Promise<WriteResult<void>> {
  try {
    const convId = `msg_${workId}`
    const now = new Date().toISOString()
    const existing = await db.conversations.get(convId)

    const conversation = existing || {
      id: convId,
      workId,
      title: '对话历史',
      branches: [{
        id: 'main',
        name: '主线',
        messages: [],
      }],
      activeBranchId: 'main',
      createdAt: now,
      updatedAt: now,
    }

    conversation.branches[0].messages = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }))
    conversation.updatedAt = now

    await db.transaction('rw', db.conversations, async () => {
      await db.conversations.put(conversation as Conversation)
    })
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('保存消息失败', 'WRITE_ERROR', 'conversations', err)
    console.error('[DB] saveMessages:', dbErr)
    return { success: false, error: dbErr }
  }
}
