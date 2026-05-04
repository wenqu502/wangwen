import { describe, it, expect } from 'vitest'
import {
  validateToolInput,
  CreateCharacterSchema,
  CreatePlotNodeSchema,
  CreateRelationSchema,
  CreateSystemSchema,
  CreateIdeaSchema,
} from './schemas'

describe('validateToolInput', () => {
  it('should pass valid createCharacter args', () => {
    const result = validateToolInput('createCharacter', {
      name: '测试角色',
      aliases: ['别名'],
      tags: ['tag'],
      appearance: '外貌',
      personality: { keywords: ['沉稳'], surface: '表面', inner: '内心', stressResponse: '压力下' },
      background: '背景',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('测试角色')
    }
  })

  it('should reject createCharacter with empty name', () => {
    const result = validateToolInput('createCharacter', { name: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('角色名称不能为空')
    }
  })

  it('should pass valid createPlotNode args', () => {
    const result = validateToolInput('createPlotNode', {
      title: '测试节点',
      summary: '摘要',
      type: 'trunk',
    })
    expect(result.success).toBe(true)
  })

  it('should reject createPlotNode with invalid type', () => {
    const result = validateToolInput('createPlotNode', {
      title: '测试',
      type: 'invalid_type',
    })
    expect(result.success).toBe(false)
  })

  it('should pass valid createRelation args', () => {
    const result = validateToolInput('createRelation', {
      sourceId: 'char_1',
      targetId: 'char_2',
      type: '朋友',
      description: '描述',
    })
    expect(result.success).toBe(true)
  })

  it('should reject createRelation with missing sourceId', () => {
    const result = validateToolInput('createRelation', {
      targetId: 'char_2',
      type: '朋友',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('sourceId')
    }
  })

  it('should pass valid createSystem args', () => {
    const result = validateToolInput('createSystem', {
      name: '测试体系',
      branches: [
        {
          name: '分支1',
          levels: [{ name: '等级1', description: '描述', abilities: [], restrictions: [] }],
        },
      ],
      rules: [{ description: '规则', severity: 'hard', exceptions: [] }],
    })
    expect(result.success).toBe(true)
  })

  it('should pass valid createIdea args', () => {
    const result = validateToolInput('createIdea', { content: '灵感内容' })
    expect(result.success).toBe(true)
  })

  it('should reject createIdea with empty content', () => {
    const result = validateToolInput('createIdea', { content: '' })
    expect(result.success).toBe(false)
  })

  it('should allow unknown tool names', () => {
    const result = validateToolInput('unknownTool', { foo: 'bar' })
    expect(result.success).toBe(true)
  })
})

describe('CreateCharacterSchema defaults', () => {
  it('should fill defaults for missing optional fields', () => {
    const parsed = CreateCharacterSchema.parse({ name: '角色' })
    expect(parsed.aliases).toEqual([])
    expect(parsed.tags).toEqual([])
    expect(parsed.appearance).toBe('')
    expect(parsed.background).toBe('')
  })
})

describe('CreateSystemSchema defaults', () => {
  it('should fill defaults for missing branches and rules', () => {
    const parsed = CreateSystemSchema.parse({ name: '体系' })
    expect(parsed.branches).toEqual([])
    expect(parsed.rules).toEqual([])
  })
})
