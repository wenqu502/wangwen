/// <reference types="vite/client" />
import OpenAI from 'openai'
import { AI_CONFIG, APP_CONFIG } from '@/config/env'
import type { AIChatOptions, AIStreamChunk, AIChatMessage } from './types'

// === API Key 安全读取策略 (P1-001) ===
// 1. 优先从 localStorage 读取（用户通过 UI 输入，不在代码中硬编码）
// 2. 仅在开发环境回退到环境变量（生产构建应清空 VITE_AI_API_KEY）
// 3. 如果都没有，提示用户输入
function getApiKey(): string {
  const LS_KEY = 'wangwen:deepseek-api-key'
  const fromStorage = localStorage.getItem(LS_KEY)
  if (fromStorage) return fromStorage

  // 仅开发环境允许 env 回退
  const fromEnv = AI_CONFIG.apiKey
  if (APP_CONFIG.isDev && fromEnv && fromEnv !== 'your_api_key_here') return fromEnv

  return ''
}

const BASE_URL = AI_CONFIG.baseURL
const REQUEST_TIMEOUT_MS = 30000
const MAX_RETRIES = 2
const MAX_CONTEXT_MESSAGES = 20

function createClient() {
  const apiKey = getApiKey()
  return new OpenAI({
    baseURL: BASE_URL,
    apiKey,
    dangerouslyAllowBrowser: true,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: MAX_RETRIES,
  })
}

/** 截断消息列表，保留系统提示词和最近 N 条消息 (P1-003) */
function truncateMessages(messages: AIChatOptions['messages']): AIChatOptions['messages'] {
  if (messages.length <= MAX_CONTEXT_MESSAGES + 1) return messages
  const systemMsgs = messages.filter((m) => m.role === 'system')
  const nonSystem = messages.filter((m) => m.role !== 'system')
  const recent = nonSystem.slice(-MAX_CONTEXT_MESSAGES)
  return [...systemMsgs, ...recent]
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
    throw new Error('AI API Key 未配置，请在设置面板中输入您的 API Key')
  }

  const client = createClient()
  const isReasoningModel = AI_CONFIG.model.includes('v4') || AI_CONFIG.model.includes('reasoner')
  const messages = truncateMessages(options.messages)

  let lastError: Error | undefined
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stream = await client.chat.completions.create({
        model: AI_CONFIG.model,
        messages: messages as any,
        tools: options.tools as any,
        stream: true,
        max_tokens: options.maxTokens ?? AI_CONFIG.maxTokens,
        ...(isReasoningModel && AI_CONFIG.reasoning
          ? {
              extra_body: {
                reasoning_effort: AI_CONFIG.reasoningEffort,
              },
            }
          : {
              temperature: options.temperature ?? AI_CONFIG.temperature,
            }),
      } as any)

      for await (const chunk of stream) {
        yield chunk as unknown as AIStreamChunk
      }
      return
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_RETRIES) {
        console.warn(`[AI] chatStream 失败，${MAX_RETRIES - attempt} 次重试剩余:`, lastError.message)
        await delay(1000 * (attempt + 1))
      }
    }
  }

  throw lastError || new Error('AI 流式请求失败')
}

export async function chatOnce(options: AIChatOptions): Promise<string> {
  if (!hasApiKey()) {
    throw new Error('AI API Key 未配置，请在设置面板中输入您的 API Key')
  }

  const client = createClient()
  const isReasoningModel = AI_CONFIG.model.includes('v4') || AI_CONFIG.model.includes('reasoner')
  const messages = truncateMessages(options.messages)

  let lastError: Error | undefined
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: AI_CONFIG.model,
        messages: messages as any,
        tools: options.tools as any,
        max_tokens: options.maxTokens ?? AI_CONFIG.maxTokens,
        ...(isReasoningModel && AI_CONFIG.reasoning
          ? {
              extra_body: {
                reasoning_effort: AI_CONFIG.reasoningEffort,
              },
            }
          : {
              temperature: options.temperature ?? AI_CONFIG.temperature,
            }),
      } as any)

      return response.choices[0]?.message?.content ?? ''
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_RETRIES) {
        console.warn(`[AI] chatOnce 失败，${MAX_RETRIES - attempt} 次重试剩余:`, lastError.message)
        await delay(1000 * (attempt + 1))
      }
    }
  }

  throw lastError || new Error('AI 请求失败')
}

export function createSystemPrompt(base: string, context: string): AIChatMessage {
  return {
    role: 'system',
    content: `${base}\n\n---\n\n当前作品上下文:\n${context}`,
  }
}

// === 模块化的系统提示词构建 ===
import { CHARACTER_SYSTEM_PROMPT } from '@/modules/character/ai-prompts'
import { PLOT_SYSTEM_PROMPT } from '@/modules/plot/ai-prompts'
import { SYSTEM_SYSTEM_PROMPT } from '@/modules/system/ai-prompts'
import { buildWorkContext } from './context-builder'

const BASE_SYSTEM_PROMPT = `
你是织文 (WangWen) 的 AI 创作助手，专门协助网文作者进行创作。
你可以帮助用户创建角色、规划剧情、梳理人物关系、设计世界观体系、记录灵感等。
当用户提出创作需求时，直接调用对应的工具完成操作，不要只返回文本描述。
` as const

export async function buildSystemPrompt(currentTab?: string, currentWorkId?: string | null): Promise<AIChatMessage> {
  let modulePrompt = ''
  switch (currentTab) {
    case 'character':
      modulePrompt = CHARACTER_SYSTEM_PROMPT
      break
    case 'plot':
      modulePrompt = PLOT_SYSTEM_PROMPT
      break
    case 'system':
      modulePrompt = SYSTEM_SYSTEM_PROMPT
      break
    default:
      modulePrompt = ''
  }

  // P0-001: 注入真实作品上下文
  const context = await buildWorkContext(currentWorkId || null)

  const content = modulePrompt
    ? `${BASE_SYSTEM_PROMPT}\n\n---\n\n${modulePrompt}\n\n---\n\n${context}`
    : `${BASE_SYSTEM_PROMPT}\n\n---\n\n${context}`

  return { role: 'system', content }
}

// === Mock / Demo Mode ===
// 当没有配置 API Key 时，进入演示模式，模拟 AI 响应以便体验完整交互流程

const MOCK_DELAY_MS = AI_CONFIG.mockDelayMs

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

// === 参数化 Mock 数据生成器 ===
// 根据用户输入动态生成内容，避免每次硬编码相同数据

const NAME_POOLS = {
  ancient: {
    family: ['林', '苏', '沈', '顾', '楚', '萧', '陆', '谢', '慕容', '欧阳'],
    given: ['云', '瑶', '轩', '瑾', '澈', '婉', '辞', '衍', '笙', '烬', '离', '染'],
    aliases: (name: string) => [`${name}儿`, `${name[0]}哥`, `${name}君`],
  },
  modern: {
    family: ['陈', '周', '吴', '郑', '王', '李', '张', '刘', '赵', '孙'],
    given: ['晓', '雨', '晨', '浩', '思', '诺', '然', '泽', '悦', '航'],
    aliases: (name: string) => [`小${name[0]}`, `${name}仔`, `${name}宝`],
  },
  scifi: {
    family: ['K', 'A', 'X', 'R', 'N', 'V', 'L', 'M', 'S', 'T'],
    given: ['-7', '-9', 'ra', 'on', 'ix', 'ne', 'ar', 'el', 'or', 'an'],
    aliases: (name: string) => [`Unit ${name}`, `Subject ${name[0]}`, name],
  },
  fantasy: {
    family: ['艾尔', '赛尔', '卡', '维', '洛', '菲', '奥', '雷', '米', '达'],
    given: ['文', '娜', '斯', '娅', '恩', '特', '拉', '德', '尔', '斯'],
    aliases: (name: string) => [`${name}大人`, `${name}爵士`, `小${name}`],
  },
}

const APPEARANCE_POOLS = {
  ancient: [
    '一袭青衫，腰间悬着一柄古朴长剑。眉眼间藏着化不开的霜意。',
    '红衣如火，发间一支金步摇。眼角一颗泪痣，笑起来有酒窝。',
    '白衣胜雪，手持折扇。眉目温润如玉，却带着几分疏离。',
    '玄衣黑袍，肩披墨色大氅。双眸深邃如夜，不怒自威。',
  ],
  modern: [
    '白衬衫配深色西裤，腕上一块简约手表。短发干净利落，目光专注。',
    'oversize卫衣配牛仔裤，头戴棒球帽。笑起来眼睛弯成月牙。',
    '一身剪裁利落的西装，金丝眼镜。举止优雅，说话不紧不慢。',
    '格子衬衫配双肩包，T恤上印着一行代码。眼神里总带着思考的光。',
  ],
  scifi: [
    '银白色仿生皮肤下隐约可见蓝色能量纹路。瞳孔是机械般的淡金色。',
    '穿着纳米材料编织的紧身战斗服，背后有微型推进器的轮廓。',
    '左臂是义肢，金属关节在灯光下泛着冷光。其余部分和人类无异。',
    '全身笼罩在能量护盾的微光中，头发因为静电微微飘起。',
  ],
  fantasy: [
    '尖耳微微露出兜帽，手中握着一根镶嵌宝石的法杖。',
    '身材魁梧，铠甲上刻满符文。腰间别着一把几乎和人一样高的巨剑。',
    '背后一对半透明翅膀，皮肤泛着珍珠般的光泽。赤脚走在地上却不染尘埃。',
    '全身被黑色斗篷覆盖，只露出一双猩红的眼睛和苍白的下巴。',
  ],
}

const BACKGROUND_POOLS = {
  ancient: [
    '出身于没落的剑修世家，自幼与妹妹相依为命。妹妹在十年前的一场宗门争斗中被仇家杀害，从此踏上复仇之路。',
    '本是名门正派的掌门独女，因一次下山历练误入魔道遗迹，体内被种下魔种，正邪两道都不容她。',
    '孤儿出身，被隐世高人收养。从小在山中修行，对外界一无所知，直到师父去世才下山。',
    '表面是京城第一纨绔，实则是先帝遗孤。为了躲避追杀，只能装疯卖傻。',
  ],
  modern: [
    '从小在孤儿院长大，靠奖学金一路读到顶尖大学的计算机系。骨子里不服输，对认定的事极度执着。',
    '含着金汤匙出生的富二代，却在十八岁那年家族破产。一夜之间从云端跌落，尝尽人情冷暖。',
    '普通小镇做题家，靠高考改变命运的典型。在大城市里迷茫又倔强地活着。',
    '退役电竞选手，拿过世界冠军。因为手伤被迫退役，现在在一家网咖当店长。',
  ],
  scifi: [
    '出生在殖民星球的贫民窟，靠捡垃圾和走私维生。十六岁那年偷渡到主星，靠黑市格斗攒下第一桶金。',
    '原本是星际舰队的精英飞行员，在一次虫族遭遇战中全队覆没，她是唯一的幸存者。',
    '培养舱中诞生的基因改造人，编号A-7749。在实验室被摧毁后逃出，第一次呼吸到自由的空气。',
    '从小就能听到"低语"——一种来自高维空间的信息流。被当作疯子关进精神病院，直到某天低语变成了求救信号。',
  ],
  fantasy: [
    '人类与精灵的混血，在两个世界都没有容身之处。从小在边境的流浪商队中长大。',
    '曾是最强大的龙骑士，却在屠龙战争中失去了自己的龙。现在酗酒度日，靠讲过去的故事换酒钱。',
    '出身贫寒的农家女，某天在森林里捡到了一本古老的魔法书。没有老师，只能自己摸索。',
    '死过一次的人。被死灵法师复活后保留了生前的记忆，但身体已经不需要呼吸和睡眠。',
  ],
}

const PERSONALITY_KEYWORDS = [
  ['沉稳', '偏执', '隐忍', '深情'],
  ['活泼', '莽撞', '善良', '冲动'],
  ['冷漠', '精明', '多疑', '孤独'],
  ['温柔', '犹豫', '体贴', '自卑'],
  ['狂妄', '天才', '自负', '脆弱'],
  ['正直', '固执', '理想主义', '倔强'],
]

const ARC_POOL = [
  '从封闭自我 → 学会信任伙伴 → 放下执念 → 超越仇恨',
  '从天真无知 → 见识黑暗 → 迷失方向 → 找回初心',
  '从随波逐流 → 觉醒自我 → 对抗命运 → 创造新秩序',
  '从巅峰跌落 → 坠入谷底 → 重新站起 → 超越从前',
]

const SYSTEM_POOLS = {
  ancient: {
    names: ['九天剑诀', '玄火心法', '冰心诀', '万象真经', '太虚剑意'],
    branches: ['剑气境', '心法境', '身法境'],
    levels: ['初窥', '入微', '通玄', '大成', '圆满'],
    abilities: ['剑气外放', '御剑飞行', '神识锁定', '剑气化形', '虚空斩'],
  },
  magic: {
    names: ['元素共鸣', '奥术编织', '星象魔法', '血契之术', '死灵秘典'],
    branches: ['火系', '水系', '风系', '土系'],
    levels: ['学徒', '法师', '大法师', '贤者', '宗师'],
    abilities: ['火球术', '冰盾', '瞬移', '元素化身', '时间停滞'],
  },
  scifi: {
    names: ['灵能觉醒', '量子共振', '基因解锁', '神经网络', '维度跃迁'],
    branches: ['感知系', '战斗系', '辅助系'],
    levels: ['D级', 'C级', 'B级', 'A级', 'S级'],
    abilities: ['心灵感应', '念力操控', '预知', '空间跳跃', '能量护盾'],
  },
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash)
}

function pickFromPool<T>(pool: T[], seed: number): T {
  return pool[seed % pool.length]
}

function detectStyle(text: string): keyof typeof NAME_POOLS {
  const t = text.toLowerCase()
  if (t.includes('科幻') || t.includes('未来') || t.includes('星际') || t.includes('机甲') || t.includes('cyber')) return 'scifi'
  if (t.includes('西幻') || t.includes('魔法') || t.includes('龙') || t.includes('精灵') || t.includes('魔兽')) return 'fantasy'
  if (t.includes('现代') || t.includes('都市') || t.includes('校园') || t.includes('职场')) return 'modern'
  return 'ancient'
}

function generateCharacter(text: string) {
  const style = detectStyle(text)
  const seed = hashString(text)
  const pool = NAME_POOLS[style]
  const family = pickFromPool(pool.family, seed)
  const given = pickFromPool(pool.given, seed + 1)
  const name = family + given
  const aliases = [pickFromPool(pool.aliases(name), seed + 2)]

  const appPool = APPEARANCE_POOLS[style]
  const appearance = pickFromPool(appPool, seed + 3)

  const bgPool = BACKGROUND_POOLS[style]
  const background = pickFromPool(bgPool, seed + 4)

  const keywords = pickFromPool(PERSONALITY_KEYWORDS, seed + 5)
  const arc = pickFromPool(ARC_POOL, seed + 6)

  const traitSurfaces: Record<string, string> = {
    '沉稳': '寡言少语，对人不冷不热，独来独往',
    '活泼': '话多，喜欢热闹，总是第一个冲在前面',
    '冷漠': '对大多数人和事都不关心，极少露出表情',
    '温柔': '说话轻声细语，总是优先考虑别人的感受',
    '狂妄': '目中无人，喜欢嘲讽对手，但确实有实力',
    '正直': '眼里容不得沙子，遇到不公一定会出头',
  }
  const traitInners: Record<string, string> = {
    '沉稳': '内心深处极度渴望被理解，只是不知如何表达',
    '偏执': '认定的事绝不回头，哪怕全世界都反对',
    '隐忍': '习惯把痛苦咽下去，不愿让任何人看到脆弱',
    '深情': '一旦付出真心就毫无保留，哪怕最后伤痕累累',
    '孤独': '害怕再次失去，所以干脆不再拥有',
    '自卑': '表面上的自信全是装的，内心总觉得自己不够好',
  }

  const mainTrait = keywords[0]
  const innerTrait = keywords[2] || keywords[1]

  return {
    text: `好的，我为您创建了一个${style === 'ancient' ? '古风' : style === 'modern' ? '现代' : style === 'scifi' ? '科幻' : '西幻'}风格的角色「${name}」。这个角色将作为演示数据展示在左侧画布中。`,
    toolCall: {
      name: 'createCharacter',
      args: {
        name,
        aliases,
        tags: [style === 'ancient' ? '剑修' : style === 'modern' ? '都市' : style === 'scifi' ? '改造人' : '法师', keywords[0], keywords[1]],
        appearance,
        personality: {
          keywords,
          surface: traitSurfaces[mainTrait] || '性格复杂，难以用一两句话概括',
          inner: traitInners[innerTrait] || '内心深处有不为人知的秘密',
          stressResponse: '在极端压力下会暴露出最真实的自己',
        },
        background,
        trauma: background.split('。')[0] + '。',
        goals: '找到属于自己的道路',
        arc,
        quotes: [`这就是${name}的选择。`, '无论如何，我不会后悔。'],
        abilities: style === 'ancient' ? ['九天剑诀', '冰心诀'] : style === 'magic' ? ['火球术', '元素护盾'] : style === 'scifi' ? ['灵能感知', '神经加速'] : ['基础魔法', '冥想'],
      },
    },
  }
}

function generatePlotNode(text: string) {
  const seed = hashString(text)
  const titles = [
    '第一章：血染山门',
    '第一章：意外觉醒',
    '第一章：破碎的平静',
    '序章：最后的黄昏',
    '第一章：陌生的天花板',
    '第一章：命运的齿轮',
  ]
  const summaries = [
    '主角回到故乡，发现昔日家园已成废墟。在废墟中，他找到了重要之人留下的信物，确认了仇家的身份线索。',
    '一个平常的日子被突如其来的变故打破。主角在混乱中发现自己拥有了不可思议的能力，却不知这能力是福是祸。',
    '平静的生活被一封神秘来信打破。信中没有署名，只有一个时间和地点，以及一句警告：不要相信他。',
    '故事从一个雨夜开始。主角在逃亡中遇到了改变他一生的人，而那个人带来的不是救赎，而是更大的谜团。',
    '主角从昏迷中醒来，发现自己身处一个陌生的地方。周围的人都认识他，但他对这里没有任何记忆。',
    '一个看似简单的委托任务，却牵扯出背后庞大的阴谋。主角本想置身事外，却发现早已深陷其中。',
  ]
  const types = ['trunk', 'trunk', 'branch', 'trunk']
  const title = pickFromPool(titles, seed)
  const summary = pickFromPool(summaries, seed + 1)
  const type = pickFromPool(types, seed + 2)

  return {
    text: `已为您生成剧情节点「${title}」，您可以在左侧的剧情分支树中查看。`,
    toolCall: {
      name: 'createPlotNode',
      args: {
        title,
        summary,
        type,
        tags: ['开篇', '主线'],
      },
    },
  }
}

function generateSystem(text: string) {
  const t = text.toLowerCase()
  let category: keyof typeof SYSTEM_POOLS = 'ancient'
  if (t.includes('魔法') || t.includes('法师') || t.includes('元素')) category = 'magic'
  else if (t.includes('科幻') || t.includes('未来') || t.includes('星际') || t.includes('灵能')) category = 'scifi'

  const seed = hashString(text)
  const pool = SYSTEM_POOLS[category]
  const name = pickFromPool(pool.names, seed)
  const branchName = pickFromPool(pool.branches, seed + 1)

  const levels = pool.levels.slice(0, 3).map((n, i) => ({
    name: n,
    description: `${branchName}第${i + 1}阶段，${pool.abilities[i]}开始显现`,
    abilities: [pool.abilities[i]],
    restrictions: i > 1 ? ['消耗大量能量'] : ['每日限用三次'],
  }))

  return {
    text: `已为您设计一个${category === 'ancient' ? '修炼' : category === 'magic' ? '魔法' : '异能'}体系「${name}」。`,
    toolCall: {
      name: 'createSystem',
      args: {
        name,
        description: `上古传承，共分${pool.levels.length}重境界`,
        branches: [{ name: branchName, levels }],
        rules: [
          { description: '每突破一重需经历心魔试炼', severity: 'hard', exceptions: ['持特殊心法可豁免'] },
          { description: '修炼时不可分心，否则容易走火入魔', severity: 'soft', exceptions: ['心性坚定者可免疫'] },
        ],
      },
    },
  }
}

function generateRelation(text: string) {
  // 尝试从现有 store 中获取角色，让 mock 关系更真实
  let sourceId = 'char_demo_1'
  let targetId = 'char_demo_2'
  let type = '仇敌'
  let description = '两人之间有着不可调和的矛盾'

  try {
    const { useCharacterStore } = require('@/modules/character/store')
    const chars = useCharacterStore.getState().characters
    const ids = Object.keys(chars)
    if (ids.length >= 2) {
      sourceId = ids[0]
      targetId = ids[1]
      type = '关联'
      description = `${chars[sourceId].name} 与 ${chars[targetId].name} 之间存在着复杂的关系`
    } else if (ids.length === 1) {
      sourceId = ids[0]
      targetId = ids[0]
      type = '自我'
      description = `${chars[sourceId].name} 内心的矛盾与挣扎`
    }
  } catch {
    // store 未加载时使用默认值
  }

  return {
    text: `我来为您创建一段人物关系。${description}。`,
    toolCall: {
      name: 'createRelation',
      args: { sourceId, targetId, type, description, isHidden: false },
    },
  }
}

function generateIdea(text: string) {
  const content = text.replace(/记录|灵感|点子|想法/g, '').trim() || '一个新的创作灵感'
  return {
    text: '已记录您的灵感便签！',
    toolCall: {
      name: 'createIdea',
      args: { content, tags: ['剧情', '待处理'] },
    },
  }
}

function matchMockResponse(userText: string): MockResponse {
  const t = userText.toLowerCase()

  if (t.includes('角色') || t.includes('人物') || t.includes('创建') || t.includes('生成')) {
    return generateCharacter(userText)
  }

  if (t.includes('剧情') || t.includes('节点') || t.includes('规划') || t.includes('大纲')) {
    return generatePlotNode(userText)
  }

  if (t.includes('关系') || t.includes('梳理') || t.includes('人际')) {
    return generateRelation(userText)
  }

  if (t.includes('体系') || t.includes('等级') || t.includes('境界') || t.includes('魔法') || t.includes('修炼')) {
    return generateSystem(userText)
  }

  if (t.includes('灵感') || t.includes('点子') || t.includes('想法') || t.includes('记录')) {
    return generateIdea(userText)
  }

  return {
    text: '收到！我是织文的 AI 创作助手。您可以让我帮您：\n\n1. **创建角色** — 说"帮我创建一个剑修男主"\n2. **规划剧情** — 说"帮我写一个复仇主线"\n3. **梳理关系** — 说"根据现有角色梳理关系"\n4. **设计体系** — 说"帮我设计一个修炼体系"\n5. **记录灵感** — 随口提到的好点子我会自动提取\n\n当前处于 **演示模式**（无 API Key），所有数据仅存储在本地浏览器中。',
  }
}
