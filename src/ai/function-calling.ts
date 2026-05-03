import type { ToolDefinition } from './types'

// 所有模块暴露给 AI 的 Function Calling 工具
export const tools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'generateCharacter',
      description: '根据用户描述生成角色档案',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: '用户对角色的自然语言描述' },
        },
        required: ['description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateCharacter',
      description: '修改角色档案的指定字段',
      parameters: {
        type: 'object',
        properties: {
          characterId: { type: 'string', description: '角色 ID' },
          changes: { type: 'object', description: '要修改的字段和值' },
        },
        required: ['characterId', 'changes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generatePlotSkeleton',
      description: '根据故事梗概生成剧情骨架',
      parameters: {
        type: 'object',
        properties: {
          synopsis: { type: 'string', description: '故事梗概' },
          chapterCount: { type: 'number', description: '预估章节数' },
        },
        required: ['synopsis'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'addPlotNode',
      description: '在剧情树中添加节点',
      parameters: {
        type: 'object',
        properties: {
          parentId: { type: 'string', description: '父节点 ID' },
          title: { type: 'string', description: '节点标题' },
          summary: { type: 'string', description: '节点摘要' },
        },
        required: ['parentId', 'title', 'summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'inferRelations',
      description: '根据角色档案推断关系网络',
      parameters: {
        type: 'object',
        properties: {
          characterIds: {
            type: 'array',
            items: { type: 'string' },
            description: '要分析的角色 ID 列表',
          },
        },
        required: ['characterIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generateSystem',
      description: '生成抽象化的分级体系',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: '体系描述' },
          branchCount: { type: 'number', description: '分支数量' },
          levelCount: { type: 'number', description: '每个分支的等级数' },
        },
        required: ['description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'captureIdea',
      description: '从用户消息中提取灵感便签',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '灵感内容' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: '标签数组',
          },
        },
        required: ['content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'validateConsistency',
      description: '校验角色言行与人设的一致性',
      parameters: {
        type: 'object',
        properties: {
          characterId: { type: 'string', description: '角色 ID' },
          text: { type: 'string', description: '待检测文本' },
        },
        required: ['characterId', 'text'],
      },
    },
  },
]
