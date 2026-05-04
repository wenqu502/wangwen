/// <reference types="vite/client" />
import OpenAI from 'openai'
import type { AIChatOptions, AIStreamChunk, AIChatMessage } from './types'

// === API Key 安全读取策略 ===
// 1. 优先从 localStorage 读取（用户通过 UI 输入，不在代码中硬编码）
// 2. 回退到环境变量（开发时可用 .env.local，生产构建应清空）
// 3. 如果都没有，提示用户输入
function getApiKey(): string {
  const LS_KEY = 'wangwen:deepseek-api-key'
  const fromStorage = localStorage.getItem(LS_KEY)
  if (fromStorage) return fromStorage

  const fromEnv = import.meta.env.VITE_DEEPSEEK_API_KEY
  if (fromEnv && fromEnv !== 'your_api_key_here') return fromEnv

  return ''
}

const BASE_URL = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'

function createClient() {
  const apiKey = getApiKey()
  return new OpenAI({
    baseURL: BASE_URL,
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}

export function saveApiKey(key: string): void {
  localStorage.setItem('wangwen:deepseek-api-key', key.trim())
}

export function clearApiKey(): void {
  localStorage.removeItem('wangwen:deepseek-api-key')
}

export async function* chatStream(options: AIChatOptions): AsyncGenerator<AIStreamChunk> {
  if (!hasApiKey()) {
    throw new Error('DeepSeek API Key 未配置，请在设置面板中输入您的 API Key')
  }

  const client = createClient()
  const stream = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: options.messages as any,
    tools: options.tools as any,
    stream: true,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
  })

  for await (const chunk of stream) {
    yield chunk as unknown as AIStreamChunk
  }
}

export async function chatOnce(options: AIChatOptions): Promise<string> {
  if (!hasApiKey()) {
    throw new Error('DeepSeek API Key 未配置，请在设置面板中输入您的 API Key')
  }

  const client = createClient()
  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: options.messages as any,
    tools: options.tools as any,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 4096,
  })

  return response.choices[0]?.message?.content ?? ''
}

export function createSystemPrompt(base: string, context: string): AIChatMessage {
  return {
    role: 'system',
    content: `${base}\n\n---\n\n当前作品上下文:\n${context}`,
  }
}

// === Mock / Demo Mode ===
// 当没有配置 API Key 时，进入演示模式，模拟 AI 响应以便体验完整交互流程

const MOCK_DELAY_MS = 30

export function isMockMode(): boolean {
  return !hasApiKey()
}

export async function* mockChatStream(options: AIChatOptions): AsyncGenerator<AIStreamChunk> {
  const lastUserMsg = options.messages.filter((m) => m.role === 'user').pop()
  const text = lastUserMsg?.content || ''

  // 根据用户输入匹配对应的 mock 响应
  const response = matchMockResponse(text)

  // 模拟流式输出：逐字发送
  const chars = response.text.split('')
  let accumulated = ''
  for (const ch of chars) {
    accumulated += ch
    await delay(MOCK_DELAY_MS)
    yield createMockChunk(accumulated)
  }

  // 如果有 tool calls，在文本流完后发送
  if (response.toolCall) {
    await delay(200)
    yield createMockToolChunk(response.toolCall)
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createMockChunk(content: string): AIStreamChunk {
  return {
    id: 'mock-chunk',
    object: 'chat.completion.chunk',
    created: Date.now(),
    model: 'mock-model',
    choices: [
      {
        index: 0,
        delta: { content, role: 'assistant' },
        finish_reason: null,
      },
    ],
  } as unknown as AIStreamChunk
}

function createMockToolChunk(toolCall: { name: string; args: Record<string, unknown> }): AIStreamChunk {
  return {
    id: 'mock-chunk',
    object: 'chat.completion.chunk',
    created: Date.now(),
    model: 'mock-model',
    choices: [
      {
        index: 0,
        delta: {
          tool_calls: [
            {
              index: 0,
              id: `call_${Date.now()}`,
              type: 'function',
              function: {
                name: toolCall.name,
                arguments: JSON.stringify(toolCall.args),
              },
            },
          ],
        },
        finish_reason: 'tool_calls',
      },
    ],
  } as unknown as AIStreamChunk
}

interface MockResponse {
  text: string
  toolCall?: { name: string; args: Record<string, unknown> }
}

function matchMockResponse(userText: string): MockResponse {
  const t = userText.toLowerCase()

  // 角色相关
  if (t.includes('角色') || t.includes('人物') || t.includes('创建') || t.includes('生成')) {
    return {
      text: '好的，我来为您创建一个角色。这个角色将作为演示数据展示在左侧画布中。',
      toolCall: {
        name: 'createCharacter',
        args: {
          name: '林云',
          aliases: ['云哥'],
          tags: ['男主', '剑修', '复仇者'],
          appearance: '一袭青衫，腰间悬着一柄古朴长剑。眉眼间藏着化不开的霜意，唯有看向远方时，眼底会闪过一丝不易察觉的温柔。',
          personality: {
            keywords: ['沉稳', '偏执', '隐忍', '深情'],
            surface: '寡言少语，对人不冷不热，独来独往',
            inner: '因妹妹之死背负巨大愧疚，内心深处极度渴望被理解',
            stressResponse: '情绪压抑到极点时会失控拔剑',
          },
          background: '出身于没落的剑修世家，自幼与妹妹相依为命。妹妹在十年前的一场宗门争斗中被仇家杀害，从此他踏上复仇之路。',
          trauma: '妹妹死在自己面前，却无力保护',
          goals: '找到幕后真凶，为妹妹报仇',
          arc: '从封闭自我 → 学会信任伙伴 → 放下执念 → 超越仇恨',
          quotes: ['剑不饮血，何以安魂。', '我这条命，早就不是自己的了。'],
          abilities: ['九天剑诀', '冰心诀', '御剑飞行'],
        },
      },
    }
  }

  // 剧情相关
  if (t.includes('剧情') || t.includes('节点') || t.includes('规划') || t.includes('大纲')) {
    return {
      text: '已为您生成一个剧情节点，您可以在左侧的剧情分支树中查看。',
      toolCall: {
        name: 'createPlotNode',
        args: {
          title: '第一章：血染山门',
          summary: '林云回到故乡，发现昔日山门已成废墟。在废墟中，他找到了妹妹留下的半块玉佩，确认了仇家的身份线索。',
          type: 'trunk',
          tags: ['开篇', '复仇线'],
        },
      },
    }
  }

  // 关系相关
  if (t.includes('关系') || t.includes('梳理') || t.includes('人际')) {
    return {
      text: '我来为您创建一段人物关系。注意：创建关系需要先选择已存在的角色。',
      toolCall: {
        name: 'createRelation',
        args: {
          sourceId: 'char_demo_1',
          targetId: 'char_demo_2',
          type: '仇敌',
          description: '杀妹之仇，不共戴天',
          isHidden: false,
        },
      },
    }
  }

  // 体系相关
  if (t.includes('体系') || t.includes('等级') || t.includes('境界') || t.includes('魔法') || t.includes('修炼')) {
    return {
      text: '已为您设计一个修炼体系，包含主分支和等级划分。',
      toolCall: {
        name: 'createSystem',
        args: {
          name: '九天剑诀',
          description: '上古剑修传承，共分九重境界',
          branches: [
            {
              name: '剑气境',
              levels: [
                { name: '初窥', description: '感知天地灵气，凝练第一道剑气', abilities: ['基础剑气释放'], restrictions: ['每日限用三次'] },
                { name: '入微', description: '剑气入微，可斩断精铁', abilities: ['剑气外放', '御剑护身'], restrictions: [] },
                { name: '通玄', description: '剑气通玄，可伤神魂', abilities: ['剑气化形', '神识锁定'], restrictions: ['消耗大量灵力'] },
              ],
            },
          ],
          rules: [
            { description: '每突破一重需经历心魔试炼', severity: 'hard', exceptions: ['持特殊心法可豁免'] },
            { description: '剑修不可近女色，否则剑心不稳', severity: 'soft', exceptions: ['真情可破'] },
          ],
        },
      },
    }
  }

  // 灵感相关
  if (t.includes('灵感') || t.includes('点子') || t.includes('想法') || t.includes('记录')) {
    return {
      text: '已记录您的灵感便签！',
      toolCall: {
        name: 'createIdea',
        args: {
          content: userText.replace(/记录|灵感|点子/g, '').trim() || '一个新的创作灵感',
          tags: ['剧情', '待处理'],
        },
      },
    }
  }

  // 默认回复
  return {
    text: '收到！我是织文的 AI 创作助手。您可以让我帮您：\n\n1. **创建角色** — 说"帮我创建一个剑修男主"\n2. **规划剧情** — 说"帮我写一个复仇主线"\n3. **梳理关系** — 说"根据现有角色梳理关系"\n4. **设计体系** — 说"帮我设计一个修炼体系"\n5. **记录灵感** — 随口提到的好点子我会自动提取\n\n当前处于 **演示模式**（无 API Key），所有数据仅存储在本地浏览器中。',
  }
}
