import type { ToolDefinition } from './types'

// 所有模块暴露给 AI 的 Function Calling 工具
export const tools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'createCharacter',
      description: '创建一个完整的角色档案。当用户要求创建角色、生成人物时调用。',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '角色姓名' },
          aliases: { type: 'array', items: { type: 'string' }, description: '别名/绰号' },
          tags: { type: 'array', items: { type: 'string' }, description: '标签，如["主角","剑修","复仇者"]' },
          appearance: { type: 'string', description: '外貌描写，100-300字' },
          personality: {
            type: 'object',
            description: '性格结构',
            properties: {
              keywords: { type: 'array', items: { type: 'string' }, description: '性格关键词' },
              surface: { type: 'string', description: '表面性格' },
              inner: { type: 'string', description: '内心性格' },
              stressResponse: { type: 'string', description: '压力下的反应' },
            },
          },
          background: { type: 'string', description: '身世背景' },
          trauma: { type: 'string', description: '心理创伤（可选）' },
          goals: { type: 'string', description: '目标动机（可选）' },
          arc: { type: 'string', description: '人物弧光（可选）' },
          quotes: { type: 'array', items: { type: 'string' }, description: '标志性台词' },
          abilities: { type: 'array', items: { type: 'string' }, description: '能力/技能' },
        },
        required: ['name', 'appearance', 'personality', 'background'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'updateCharacter',
      description: '修改已有角色的指定字段。当用户要求修改某个角色的属性时调用。',
      parameters: {
        type: 'object',
        properties: {
          characterId: { type: 'string', description: '角色 ID' },
          changes: {
            type: 'object',
            description: '要修改的字段，只包含需要修改的字段',
            properties: {
              name: { type: 'string' },
              aliases: { type: 'array', items: { type: 'string' } },
              tags: { type: 'array', items: { type: 'string' } },
              appearance: { type: 'string' },
              background: { type: 'string' },
              trauma: { type: 'string' },
              goals: { type: 'string' },
              arc: { type: 'string' },
              status: { type: 'string', enum: ['alive', 'dead', 'missing', 'sealed'] },
              quotes: { type: 'array', items: { type: 'string' } },
              abilities: { type: 'array', items: { type: 'string' } },
              personality: {
                type: 'object',
                properties: {
                  keywords: { type: 'array', items: { type: 'string' } },
                  surface: { type: 'string' },
                  inner: { type: 'string' },
                  stressResponse: { type: 'string' },
                },
              },
            },
          },
        },
        required: ['characterId', 'changes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createPlotNode',
      description: '在剧情树中创建一个新节点。当用户要求添加剧情、规划桥段时调用。',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '节点标题，如"第三章：秘境开启"' },
          summary: { type: 'string', description: '剧情摘要，50-200字' },
          content: { type: 'string', description: '详细内容（可选）' },
          type: { type: 'string', enum: ['trunk', 'branch', 'if', 'foreshadowing'], description: '节点类型' },
          characters: { type: 'array', items: { type: 'string' }, description: '涉及的角色 ID 列表' },
          location: { type: 'string', description: '发生地点（可选）' },
          tags: { type: 'array', items: { type: 'string' }, description: '标签' },
          parentIds: { type: 'array', items: { type: 'string' }, description: '父节点 ID 列表，用于建立层级关系' },
          condition: { type: 'string', description: '触发条件（可选，用于分支/if节点）' },
        },
        required: ['title', 'summary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createRelation',
      description: '创建两个角色之间的关系。当用户要求建立人物关系时调用。',
      parameters: {
        type: 'object',
        properties: {
          sourceId: { type: 'string', description: '源角色 ID' },
          targetId: { type: 'string', description: '目标角色 ID' },
          type: { type: 'string', description: '关系类型，如"师徒","仇敌","恋人"' },
          description: { type: 'string', description: '关系描述' },
          isHidden: { type: 'boolean', description: '是否为隐藏关系' },
        },
        required: ['sourceId', 'targetId', 'type', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createSystem',
      description: '创建一个修炼/世界观体系。当用户要求设计等级体系、功法体系时调用。',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: '体系名称，如"玄天九变"' },
          description: { type: 'string', description: '体系简介' },
          branches: {
            type: 'array',
            description: '分支体系',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: '分支名称' },
                levels: {
                  type: 'array',
                  description: '等级列表',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: '等级名称' },
                      description: { type: 'string', description: '等级描述' },
                      abilities: { type: 'array', items: { type: 'string' }, description: '该等级解锁的能力' },
                      restrictions: { type: 'array', items: { type: 'string' }, description: '该等级的限制' },
                    },
                  },
                },
              },
            },
          },
          rules: {
            type: 'array',
            description: '体系规则',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string', description: '规则描述' },
                severity: { type: 'string', enum: ['hard', 'soft'], description: 'hard=不可违逆，soft=可灵活处理' },
                exceptions: { type: 'array', items: { type: 'string' }, description: '例外情况' },
              },
            },
          },
        },
        required: ['name', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'createIdea',
      description: '记录一个灵感便签。当用户提到有趣的创意、点子时调用。',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '灵感内容' },
          tags: { type: 'array', items: { type: 'string' }, description: '标签' },
        },
        required: ['content'],
      },
    },
  },
]
