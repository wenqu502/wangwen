/**
 * API 读写操作层（已从 IndexedDB 迁移到后端 API）
 *
 * 设计原则：
 * 1. 保持接口不变，所有 store 代码无需修改
 * 2. 读写操作通过 HTTP API 与后端交互
 * 3. 错误处理：结构化错误，支持调用方决定提示方式
 */

import { api } from '@/api/client'
import type { Work, Character, PlotNode, RelationEdge, WorkSystem, Idea, StoryEvent, EventEdge } from '@/types'
import type { Conversation } from '@/ai/types'

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

// === 辅助：修复后端 boolean 字符串 ===
function fixBooleanFields<T extends Record<string, unknown>>(obj: T): T {
  if (obj && typeof obj === 'object') {
    if (obj.isHidden === 'true') (obj as Record<string, unknown>).isHidden = true
    if (obj.isHidden === 'false') (obj as Record<string, unknown>).isHidden = false
  }
  return obj
}

function fixListBooleanFields<T extends Record<string, unknown>>(list: T[]): T[] {
  return list.map(fixBooleanFields)
}

// === 读操作 ===

/** 按 workId 读取角色列表 */
export async function readCharactersByWorkId(workId: string): Promise<Character[]> {
  try {
    const list = await api.get<Character[]>(`/api/characters/work/${workId}`)
    return fixListBooleanFields(list || [])
  } catch (err) {
    throw new DBError('读取角色数据失败', 'READ_ERROR', 'characters', err)
  }
}

/** 按 workId 读取剧情节点列表 */
export async function readPlotNodesByWorkId(workId: string): Promise<PlotNode[]> {
  try {
    const list = await api.get<PlotNode[]>(`/api/plot-nodes/work/${workId}`)
    return list || []
  } catch (err) {
    throw new DBError('读取剧情数据失败', 'READ_ERROR', 'plotNodes', err)
  }
}

/** 按 workId 读取关系列表 */
export async function readRelationsByWorkId(workId: string): Promise<RelationEdge[]> {
  try {
    const list = await api.get<RelationEdge[]>(`/api/relations/work/${workId}`)
    return fixListBooleanFields(list || [])
  } catch (err) {
    throw new DBError('读取关系数据失败', 'READ_ERROR', 'relations', err)
  }
}

/** 按 workId 读取体系列表 */
export async function readSystemsByWorkId(workId: string): Promise<WorkSystem[]> {
  try {
    const list = await api.get<WorkSystem[]>(`/api/systems/work/${workId}`)
    return list || []
  } catch (err) {
    throw new DBError('读取体系数据失败', 'READ_ERROR', 'systems', err)
  }
}

/** 按 workId 读取灵感列表 */
export async function readIdeasByWorkId(workId: string): Promise<Idea[]> {
  try {
    const list = await api.get<Idea[]>(`/api/ideas/work/${workId}`)
    return list || []
  } catch (err) {
    throw new DBError('读取灵感数据失败', 'READ_ERROR', 'ideas', err)
  }
}

/** 按 workId 读取事件列表 */
export async function readEventsByWorkId(workId: string): Promise<StoryEvent[]> {
  try {
    const list = await api.get<StoryEvent[]>(`/api/events/work/${workId}`)
    return list || []
  } catch (err) {
    throw new DBError('读取事件数据失败', 'READ_ERROR', 'events', err)
  }
}

/** 按 workId 读取事件边列表 */
export async function readEventEdgesByWorkId(workId: string): Promise<EventEdge[]> {
  try {
    const list = await api.get<EventEdge[]>(`/api/events/edges/work/${workId}`)
    return list || []
  } catch (err) {
    throw new DBError('读取事件边数据失败', 'READ_ERROR', 'eventEdges', err)
  }
}

/** 读取作品列表 */
export async function readAllWorks(): Promise<Work[]> {
  try {
    const list = await api.get<Work[]>('/api/works')
    return list || []
  } catch (err) {
    throw new DBError('读取作品列表失败', 'READ_ERROR', 'works', err)
  }
}

// === 写操作 ===

interface WriteResult<T> {
  success: boolean
  data?: T
  error?: DBError
}

/** 添加作品 */
export async function writeAddWork(work: Work): Promise<WriteResultResult<Work>> {
  try {
    const data = await api.post<Work>('/api/works', work)
    return { success: true, data: data || work }
  } catch (err) {
    const dbErr = new DBError('添加作品失败', 'WRITE_ERROR', 'works', err)
    console.error('[API] writeAddWork:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除作品（级联删除由后端处理） */
export async function writeDeleteWork(id: string): Promise<WriteResult<void>> {
  try {
    await api.delete(`/api/works/${id}`)
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除作品失败', 'WRITE_ERROR', 'works', err)
    console.error('[API] writeDeleteWork:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 按 ID 读取单个角色 */
export async function readCharacterById(id: string): Promise<Character | undefined> {
  try {
    const list = await api.get<Character[]>(`/api/characters/work/_`)
    return list?.find((c) => c.id === id)
  } catch (err) {
    throw new DBError('读取角色失败', 'READ_ERROR', 'characters', err)
  }
}

/** 添加角色 */
export async function writeAddCharacter(char: Character): Promise<WriteResultResult<Character>> {
  try {
    const data = await api.post<Character>('/api/characters', char)
    return { success: true, data: data || char }
  } catch (err) {
    const dbErr = new DBError('添加角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[API] writeAddCharacter:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新角色 */
export async function writeUpdateCharacter(char: Character): Promise<WriteResultResult<Character>> {
  try {
    const data = await api.put<Character>(`/api/characters/${char.id}`, char)
    return { success: true, data: data || char }
  } catch (err) {
    const dbErr = new DBError('更新角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[API] writeUpdateCharacter:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除角色 */
export async function writeDeleteCharacter(id: string): Promise<WriteResult<void>> {
  try {
    await api.delete(`/api/characters/${id}`)
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[API] writeDeleteCharacter:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加剧情节点 */
export async function writeAddPlotNode(node: PlotNode): Promise<WriteResultResult<PlotNode>> {
  try {
    const data = await api.post<PlotNode>('/api/plot-nodes', node)
    return { success: true, data: data || node }
  } catch (err) {
    const dbErr = new DBError('添加剧情节点失败', 'WRITE_ERROR', 'plotNodes', err)
    console.error('[API] writeAddPlotNode:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新剧情节点 */
export async function writeUpdatePlotNode(node: PlotNode): Promise<WriteResultResult<PlotNode>> {
  try {
    const data = await api.put<PlotNode>(`/api/plot-nodes/${node.id}`, node)
    return { success: true, data: data || node }
  } catch (err) {
    const dbErr = new DBError('更新剧情节点失败', 'WRITE_ERROR', 'plotNodes', err)
    console.error('[API] writeUpdatePlotNode:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除剧情节点 */
export async function writeDeletePlotNode(id: string): Promise<WriteResult<void>> {
  try {
    await api.delete(`/api/plot-nodes/${id}`)
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除剧情节点失败', 'WRITE_ERROR', 'plotNodes', err)
    console.error('[API] writeDeletePlotNode:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加关系 */
export async function writeAddRelation(edge: RelationEdge): Promise<WriteResultResult<RelationEdge>> {
  try {
    const data = await api.post<RelationEdge>('/api/relations', edge)
    return { success: true, data: data || edge }
  } catch (err) {
    const dbErr = new DBError('添加关系失败', 'WRITE_ERROR', 'relations', err)
    console.error('[API] writeAddRelation:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新关系 */
export async function writeUpdateRelation(edge: RelationEdge): Promise<WriteResultResult<RelationEdge>> {
  try {
    const data = await api.put<RelationEdge>(`/api/relations/${edge.id}`, edge)
    return { success: true, data: data || edge }
  } catch (err) {
    const dbErr = new DBError('更新关系失败', 'WRITE_ERROR', 'relations', err)
    console.error('[API] writeUpdateRelation:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除关系 */
export async function writeDeleteRelation(id: string): Promise<WriteResult<void>> {
  try {
    await api.delete(`/api/relations/${id}`)
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除关系失败', 'WRITE_ERROR', 'relations', err)
    console.error('[API] writeDeleteRelation:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加体系 */
export async function writeAddSystem(system: WorkSystem): Promise<WriteResultResult<WorkSystem>> {
  try {
    const data = await api.post<WorkSystem>('/api/systems', system)
    return { success: true, data: data || system }
  } catch (err) {
    const dbErr = new DBError('添加体系失败', 'WRITE_ERROR', 'systems', err)
    console.error('[API] writeAddSystem:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新体系 */
export async function writeUpdateSystem(system: WorkSystem): Promise<WriteResultResult<WorkSystem>> {
  try {
    const data = await api.put<WorkSystem>(`/api/systems/${system.id}`, system)
    return { success: true, data: data || system }
  } catch (err) {
    const dbErr = new DBError('更新体系失败', 'WRITE_ERROR', 'systems', err)
    console.error('[API] writeUpdateSystem:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除体系 */
export async function writeDeleteSystem(id: string): Promise<WriteResult<void>> {
  try {
    await api.delete(`/api/systems/${id}`)
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除体系失败', 'WRITE_ERROR', 'systems', err)
    console.error('[API] writeDeleteSystem:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加灵感 */
export async function writeAddIdea(idea: Idea): Promise<WriteResult<Idea>> {
  try {
    const data = await api.post<Idea>('/api/ideas', idea)
    return { success: true, data: data || idea }
  } catch (err) {
    const dbErr = new DBError('添加灵感失败', 'WRITE_ERROR', 'ideas', err)
    console.error('[API] writeAddIdea:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新灵感 */
export async function writeUpdateIdea(idea: Idea): Promise<WriteResult<Idea>> {
  try {
    const data = await api.put<Idea>(`/api/ideas/${idea.id}`, idea)
    return { success: true, data: data || idea }
  } catch (err) {
    const dbErr = new DBError('更新灵感失败', 'WRITE_ERROR', 'ideas', err)
    console.error('[API] writeUpdateIdea:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除灵感 */
export async function writeDeleteIdea(id: string): Promise<WriteResult<void>> {
  try {
    await api.delete(`/api/ideas/${id}`)
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除灵感失败', 'WRITE_ERROR', 'ideas', err)
    console.error('[API] writeDeleteIdea:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加事件 */
export async function writeAddEvent(event: StoryEvent): Promise<WriteResultResult<StoryEvent>> {
  try {
    const data = await api.post<StoryEvent>('/api/events', event)
    return { success: true, data: data || event }
  } catch (err) {
    const dbErr = new DBError('添加事件失败', 'WRITE_ERROR', 'events', err)
    console.error('[API] writeAddEvent:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新事件 */
export async function writeUpdateEvent(event: StoryEvent): Promise<WriteResultResult<StoryEvent>> {
  try {
    const data = await api.put<StoryEvent>(`/api/events/${event.id}`, event)
    return { success: true, data: data || event }
  } catch (err) {
    const dbErr = new DBError('更新事件失败', 'WRITE_ERROR', 'events', err)
    console.error('[API] writeUpdateEvent:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除事件 */
export async function writeDeleteEvent(id: string): Promise<WriteResult<void>> {
  try {
    await api.delete(`/api/events/${id}`)
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除事件失败', 'WRITE_ERROR', 'events', err)
    console.error('[API] writeDeleteEvent:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 添加事件边 */
export async function writeAddEventEdge(edge: EventEdge): Promise<WriteResult<EventEdge>> {
  try {
    const data = await api.post<EventEdge>('/api/events/edges', edge)
    return { success: true, data: data || edge }
  } catch (err) {
    const dbErr = new DBError('添加事件边失败', 'WRITE_ERROR', 'eventEdges', err)
    console.error('[API] writeAddEventEdge:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 更新事件边 */
export async function writeUpdateEventEdge(edge: EventEdge): Promise<WriteResult<EventEdge>> {
  try {
    const data = await api.put<EventEdge>(`/api/events/edges/${edge.id}`, edge)
    return { success: true, data: data || edge }
  } catch (err) {
    const dbErr = new DBError('更新事件边失败', 'WRITE_ERROR', 'eventEdges', err)
    console.error('[API] writeUpdateEventEdge:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除事件边 */
export async function writeDeleteEventEdge(id: string): Promise<WriteResult<void>> {
  try {
    await api.delete(`/api/events/edges/${id}`)
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除事件边失败', 'WRITE_ERROR', 'eventEdges', err)
    console.error('[API] writeDeleteEventEdge:', dbErr)
    return { success: false, error: dbErr }
  }
}

// === 批量操作 ===

/** 批量添加角色 */
export async function writeBulkAddCharacters(chars: Character[]): Promise<WriteResult<number>> {
  try {
    for (const char of chars) {
      await api.post('/api/characters', char)
    }
    return { success: true, data: chars.length }
  } catch (err) {
    const dbErr = new DBError('批量添加角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[API] writeBulkAddCharacters:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 批量更新角色 */
export async function writeBulkPutCharacters(chars: Character[]): Promise<WriteResult<number>> {
  try {
    for (const char of chars) {
      await api.put(`/api/characters/${char.id}`, char)
    }
    return { success: true, data: chars.length }
  } catch (err) {
    const dbErr = new DBError('批量更新角色失败', 'WRITE_ERROR', 'characters', err)
    console.error('[API] writeBulkPutCharacters:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 全量数据加载（初始化用） */
export async function loadAllDataByWorkId(workId: string) {
  try {
    const [characters, plotNodes, relations, systems, ideas, events, eventEdges] = await Promise.all([
      readCharactersByWorkId(workId).catch(() => []),
      readPlotNodesByWorkId(workId).catch(() => []),
      readRelationsByWorkId(workId).catch(() => []),
      readSystemsByWorkId(workId).catch(() => []),
      readIdeasByWorkId(workId).catch(() => []),
      readEventsByWorkId(workId).catch(() => []),
      readEventEdgesByWorkId(workId).catch(() => []),
    ])
    return {
      success: true as const,
      characters,
      plotNodes,
      relations,
      systems,
      ideas,
      events,
      eventEdges,
    }
  } catch (err) {
    const dbErr = new DBError('加载数据失败', 'READ_ERROR', undefined, err)
    console.error('[API] loadAllDataByWorkId:', dbErr)
    return { success: false as const, error: dbErr }
  }
}

// === 对话历史读写 ===

/** 读取作品下的所有对话（暂存 localStorage，后续可迁移到后端） */
export async function readConversationsByWorkId(workId: string): Promise<Conversation[]> {
  try {
    const raw = localStorage.getItem(`wangwen_conv_${workId}`)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    throw new DBError('读取对话历史失败', 'READ_ERROR', 'conversations', err)
  }
}

/** 按 ID 读取单个对话 */
export async function readConversationById(id: string): Promise<Conversation | undefined> {
  try {
    // 简化为从所有作品中查找
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('wangwen_conv_')) {
        const list: Conversation[] = JSON.parse(localStorage.getItem(key) || '[]')
        const found = list.find((c) => c.id === id)
        if (found) return found
      }
    }
    return undefined
  } catch (err) {
    throw new DBError('读取对话失败', 'READ_ERROR', 'conversations', err)
  }
}

/** 保存/更新对话 */
export async function writeSaveConversation(conv: Conversation): Promise<WriteResultResult<Conversation>> {
  try {
    const key = `wangwen_conv_${conv.workId}`
    const existing = localStorage.getItem(key)
    const list: Conversation[] = existing ? JSON.parse(existing) : []
    const idx = list.findIndex((c) => c.id === conv.id)
    if (idx >= 0) {
      list[idx] = conv
    } else {
      list.push(conv)
    }
    localStorage.setItem(key, JSON.stringify(list))
    return { success: true, data: conv }
  } catch (err) {
    const dbErr = new DBError('保存对话失败', 'WRITE_ERROR', 'conversations', err)
    console.error('[API] writeSaveConversation:', dbErr)
    return { success: false, error: dbErr }
  }
}

/** 删除对话 */
export async function writeDeleteConversation(id: string): Promise<WriteResult<void>> {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('wangwen_conv_')) {
        const list: Conversation[] = JSON.parse(localStorage.getItem(key) || '[]')
        const filtered = list.filter((c) => c.id !== id)
        if (filtered.length !== list.length) {
          localStorage.setItem(key, JSON.stringify(filtered))
          return { success: true }
        }
      }
    }
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('删除对话失败', 'WRITE_ERROR', 'conversations', err)
    console.error('[API] writeDeleteConversation:', dbErr)
    return { success: false, error: dbErr }
  }
}

// === 消息列表持久化 ===

import type { ChatMessage } from '@/stores/app-store'

/** 为作品加载消息列表 */
export async function loadMessages(workId: string): Promise<ChatMessage[]> {
  try {
    const raw = localStorage.getItem(`wangwen_messages_${workId}`)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('[API] loadMessages failed:', err)
    return []
  }
}

/** 保存作品的消息列表 */
export async function saveMessages(workId: string, messages: ChatMessage[]): Promise<WriteResult<void>> {
  try {
    localStorage.setItem(`wangwen_messages_${workId}`, JSON.stringify(messages))
    return { success: true }
  } catch (err) {
    const dbErr = new DBError('保存消息失败', 'WRITE_ERROR', 'conversations', err)
    console.error('[API] saveMessages:', dbErr)
    return { success: false, error: dbErr }
  }
}
