import { useCharacterStore } from '@/modules/character/store'
import { usePlotStore } from '@/modules/plot/store'
import { useRelationStore } from '@/modules/relation/store'
import { useSystemStore } from '@/modules/system/store'
import { useIdeaStore } from '@/modules/idea/store'
import {
  generateCharacterId,
  generateNodeId,
  generateRelationId,
  generateSystemId,
  generateIdeaId,
} from '@/utils/id-generator'
import type { Character, PlotNode, RelationEdge, WorkSystem, Idea } from '@/types'

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ToolResult {
  success: boolean
  message: string
  data?: unknown
}

export function executeTool(toolCall: ToolCall): ToolResult {
  try {
    switch (toolCall.name) {
      case 'createCharacter':
        return handleCreateCharacter(toolCall.arguments)
      case 'updateCharacter':
        return handleUpdateCharacter(toolCall.arguments)
      case 'createPlotNode':
        return handleCreatePlotNode(toolCall.arguments)
      case 'createRelation':
        return handleCreateRelation(toolCall.arguments)
      case 'createSystem':
        return handleCreateSystem(toolCall.arguments)
      case 'createIdea':
        return handleCreateIdea(toolCall.arguments)
      default:
        return {
          success: false,
          message: `未知工具: ${toolCall.name}`,
        }
    }
  } catch (err) {
    return {
      success: false,
      message: `工具执行出错: ${err instanceof Error ? err.message : '未知错误'}`,
    }
  }
}

function handleCreateCharacter(args: Record<string, unknown>): ToolResult {
  const store = useCharacterStore.getState()
  const now = new Date().toISOString()
  const personalityArg = args.personality as Record<string, unknown> | undefined

  const character: Character = {
    id: generateCharacterId(),
    workId: 'default',
    name: String(args.name || '未命名角色'),
    aliases: Array.isArray(args.aliases) ? args.aliases.map(String) : [],
    tags: Array.isArray(args.tags) ? args.tags.map(String) : [],
    appearance: String(args.appearance || ''),
    personality: {
      keywords: Array.isArray(personalityArg?.keywords)
        ? (personalityArg.keywords as unknown[]).map(String)
        : [],
      surface: String(personalityArg?.surface || ''),
      inner: String(personalityArg?.inner || ''),
      stressResponse: String(personalityArg?.stressResponse || ''),
    },
    background: String(args.background || ''),
    trauma: args.trauma ? String(args.trauma) : undefined,
    goals: args.goals ? String(args.goals) : undefined,
    arc: args.arc ? String(args.arc) : undefined,
    quotes: Array.isArray(args.quotes) ? args.quotes.map(String) : [],
    abilities: Array.isArray(args.abilities) ? args.abilities.map(String) : [],
    relations: [],
    status: 'alive',
    images: [],
    createdAt: now,
    updatedAt: now,
  }

  store.addCharacter(character)
  return {
    success: true,
    message: `已创建角色「${character.name}」`,
    data: { id: character.id, name: character.name },
  }
}

function handleUpdateCharacter(args: Record<string, unknown>): ToolResult {
  const store = useCharacterStore.getState()
  const id = String(args.characterId)
  const changes = args.changes as Record<string, unknown> | undefined

  if (!id || !changes) {
    return { success: false, message: '缺少 characterId 或 changes' }
  }

  const char = store.characters[id]
  if (!char) {
    return { success: false, message: `未找到角色: ${id}` }
  }

  store.updateCharacter(id, (c) => {
    if (changes.name) c.name = String(changes.name)
    if (changes.appearance) c.appearance = String(changes.appearance)
    if (changes.background) c.background = String(changes.background)
    if (changes.status) c.status = changes.status as Character['status']
    if (changes.trauma !== undefined) c.trauma = String(changes.trauma)
    if (changes.goals !== undefined) c.goals = String(changes.goals)
    if (changes.arc !== undefined) c.arc = String(changes.arc)
    if (changes.aliases) c.aliases = Array.isArray(changes.aliases) ? changes.aliases.map(String) : []
    if (changes.tags) c.tags = Array.isArray(changes.tags) ? changes.tags.map(String) : []
    if (changes.quotes) c.quotes = Array.isArray(changes.quotes) ? changes.quotes.map(String) : []
    if (changes.abilities) c.abilities = Array.isArray(changes.abilities) ? changes.abilities.map(String) : []
    if (changes.personality) {
      const p = changes.personality as Record<string, unknown>
      if (p.keywords) c.personality.keywords = Array.isArray(p.keywords) ? p.keywords.map(String) : []
      if (p.surface) c.personality.surface = String(p.surface)
      if (p.inner) c.personality.inner = String(p.inner)
      if (p.stressResponse) c.personality.stressResponse = String(p.stressResponse)
    }
    c.updatedAt = new Date().toISOString()
  })

  return { success: true, message: `已更新角色「${char.name}」` }
}

function handleCreatePlotNode(args: Record<string, unknown>): ToolResult {
  const store = usePlotStore.getState()
  const now = new Date().toISOString()

  const node: PlotNode = {
    id: generateNodeId(),
    workId: 'default',
    title: String(args.title || '未命名节点'),
    summary: String(args.summary || ''),
    content: args.content ? String(args.content) : undefined,
    type: (args.type as PlotNode['type']) || 'branch',
    status: 'todo',
    characters: Array.isArray(args.characters) ? args.characters.map(String) : [],
    location: args.location ? String(args.location) : undefined,
    tags: Array.isArray(args.tags) ? args.tags.map(String) : [],
    parentIds: Array.isArray(args.parentIds) ? args.parentIds.map(String) : [],
    childIds: [],
    condition: args.condition ? String(args.condition) : undefined,
    foreshadowing: [],
    payoff: [],
    createdAt: now,
    updatedAt: now,
  }

  store.addNode(node)

  // 自动建立父子连线
  if (node.parentIds.length > 0) {
    for (const parentId of node.parentIds) {
      store.addEdge(parentId, node.id)
    }
  }

  return {
    success: true,
    message: `已创建剧情节点「${node.title}」`,
    data: { id: node.id, title: node.title },
  }
}

function handleCreateRelation(args: Record<string, unknown>): ToolResult {
  const store = useRelationStore.getState()
  const now = new Date().toISOString()

  const edge: RelationEdge = {
    id: generateRelationId(),
    workId: 'default',
    sourceId: String(args.sourceId || ''),
    targetId: String(args.targetId || ''),
    type: String(args.type || '关联'),
    description: String(args.description || ''),
    isHidden: Boolean(args.isHidden),
    createdAt: now,
  }

  if (!edge.sourceId || !edge.targetId) {
    return { success: false, message: '缺少 sourceId 或 targetId' }
  }

  store.addEdge(edge)
  return {
    success: true,
    message: `已创建关系: ${edge.sourceId} → ${edge.targetId}`,
    data: { id: edge.id },
  }
}

function handleCreateSystem(args: Record<string, unknown>): ToolResult {
  const store = useSystemStore.getState()
  const now = new Date().toISOString()

  const system: WorkSystem = {
    id: generateSystemId(),
    workId: 'default',
    name: String(args.name || '未命名体系'),
    description: String(args.description || ''),
    branches: Array.isArray(args.branches)
      ? (args.branches as unknown[]).map((b: unknown, idx: number) => {
          const branch = b as Record<string, unknown>
          const levels = Array.isArray(branch.levels) ? (branch.levels as unknown[]) : []
          return {
            id: `branch_${idx}`,
            name: String(branch.name || `分支${idx + 1}`),
            levels: levels.map((l: unknown, lidx: number) => {
              const level = l as Record<string, unknown>
              return {
                rank: lidx + 1,
                name: String(level.name || `等级${lidx + 1}`),
                description: String(level.description || ''),
                abilities: Array.isArray(level.abilities)
                  ? (level.abilities as unknown[]).map(String)
                  : [],
                restrictions: Array.isArray(level.restrictions)
                  ? (level.restrictions as unknown[]).map(String)
                  : [],
              }
            }),
          }
        })
      : [],
    rules: Array.isArray(args.rules)
      ? (args.rules as unknown[]).map((r: unknown, idx: number) => {
          const rule = r as Record<string, unknown>
          return {
            id: `rule_${idx}`,
            description: String(rule.description || ''),
            severity: (rule.severity as 'hard' | 'soft') || 'soft',
            exceptions: Array.isArray(rule.exceptions)
              ? (rule.exceptions as unknown[]).map(String)
              : [],
          }
        })
      : [],
    createdAt: now,
    updatedAt: now,
  }

  store.addSystem(system)
  return {
    success: true,
    message: `已创建体系「${system.name}」`,
    data: { id: system.id, name: system.name },
  }
}

function handleCreateIdea(args: Record<string, unknown>): ToolResult {
  const store = useIdeaStore.getState()
  const now = new Date().toISOString()

  const idea: Idea = {
    id: generateIdeaId(),
    workId: 'default',
    content: String(args.content || ''),
    tags: Array.isArray(args.tags) ? args.tags.map(String) : [],
    status: 'pending',
    createdAt: now,
  }

  if (!idea.content) {
    return { success: false, message: '灵感内容不能为空' }
  }

  store.addIdea(idea)
  return {
    success: true,
    message: '已记录灵感',
    data: { id: idea.id },
  }
}

