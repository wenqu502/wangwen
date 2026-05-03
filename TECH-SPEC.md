# 织文 (WangWen) — 技术方案文档

> **版本**: v1.0  
> **日期**: 2026-05-03  
> **仓库**: https://github.com/wenqu502/wangwen

---

## 一、技术选型总览

| 层级 | 技术方案 | 选型理由 |
|------|----------|----------|
| 前端框架 | React 18 + TypeScript + Vite | 生态成熟、编译快、TS 原生支持 |
| 状态管理 | Zustand + Immer | 极简 API、无需 Provider、支持不可变更新 |
| 样式方案 | Tailwind CSS + CSS Variables | 原子化、设计 Token 统一管理 |
| UI 组件 | shadcn/ui + Radix UI | 无样式依赖、可定制、无障碍支持好 |
| 可视化-剧情树 | React Flow (@xyflow/react) | React 原生、节点编辑能力强、生态活跃 |
| 可视化-关系图 | @antv/g6 | 力导向布局成熟、性能优秀、中文文档完善 |
| 富文本编辑 | TipTap (ProseMirror) | 结构化编辑、可扩展、支持协同 |
| AI 接入 | DeepSeek API (deepseek-chat) | Function Calling + JSON Output、中文强、成本低 |
| 数据存储 | IndexedDB (Dexie.js) | 本地优先、结构化存储、支持索引 |
| 导出 | html2canvas + jsPDF | 截图导出、PDF 生成 |
| 构建工具 | Vite 6 + SWC | 极速 HMR、现代 ES 模块 |
| 包管理 | pnpm | 磁盘空间优化、monorepo 友好 |

---

## 二、前端架构

### 2.1 项目目录结构

```
wangwen/
├── public/                     # 静态资源
│   └── favicon.ico
├── src/
│   ├── main.tsx               # 入口
│   ├── App.tsx                # 根组件
│   ├── index.css              # 全局样式 + Tailwind
│   │
│   ├── components/            # 通用组件
│   │   ├── ui/               # shadcn/ui 组件（Button, Card, Dialog 等）
│   │   ├── chat/             # AI 对话面板相关
│   │   │   ├── ChatPanel.tsx        # 对话面板主组件
│   │   │   ├── ChatMessage.tsx      # 单条消息
│   │   │   ├── ChatInput.tsx        # 输入框
│   │   │   └── SuggestionChips.tsx  # 快捷指令按钮
│   │   ├── canvas/           # 可视化画布组件
│   │   │   ├── CharacterCardWall.tsx
│   │   │   ├── PlotTreeCanvas.tsx
│   │   │   ├── RelationGraph.tsx
│   │   │   └── SystemBuilderCanvas.tsx
│   │   └── common/           # 跨模块通用
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ResizablePanel.tsx   # 可拖拽调整宽度的面板
│   │
│   ├── modules/               # 五大功能模块（业务逻辑 + 数据模型）
│   │   ├── character/        # 角色小像
│   │   │   ├── types.ts            # Character 类型定义
│   │   │   ├── store.ts            # Zustand store
│   │   │   ├── ai-prompts.ts       # AI 提示词模板
│   │   │   └── CharacterCard.tsx   # 角色卡片组件
│   │   ├── plot/             # 剧情分支树
│   │   │   ├── types.ts
│   │   │   ├── store.ts
│   │   │   ├── ai-prompts.ts
│   │   │   └── PlotNode.tsx
│   │   ├── relation/         # 人物关系图
│   │   │   ├── types.ts
│   │   │   ├── store.ts
│   │   │   └── ai-prompts.ts
│   │   ├── system/           # 体系管理工具
│   │   │   ├── types.ts
│   │   │   ├── store.ts
│   │   │   └── ai-prompts.ts
│   │   └── idea/             # 灵感便签
│   │       ├── types.ts
│   │       ├── store.ts
│   │       └── ai-prompts.ts
│   │
│   ├── ai/                    # AI 核心层（全局唯一）
│   │   ├── client.ts         # DeepSeek API 客户端封装
│   │   ├── function-calling.ts   # Function Calling 工具注册
│   │   ├── context-builder.ts    # 作品上下文组装器
│   │   ├── streaming.ts      # SSE 流式响应处理
│   │   └── types.ts          # AI 相关类型定义
│   │
│   ├── stores/                # 全局状态
│   │   ├── app-store.ts      # 应用级状态（当前作品、当前模块、面板状态）
│   │   ├── work-store.ts     # 作品数据聚合（角色+剧情+关系+体系+灵感）
│   │   └── persist.ts        # 持久化中间件（IndexedDB）
│   │
│   ├── db/                    # 本地数据库层
│   │   ├── index.ts          # Dexie.js 数据库初始化
│   │   ├── works.ts          # 作品表操作
│   │   ├── characters.ts     # 角色表操作
│   │   ├── plot-nodes.ts     # 剧情节点表操作
│   │   └── ...
│   │
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useAIChat.ts      # AI 对话 Hook（核心）
│   │   ├── useCharacterActions.ts
│   │   ├── usePlotActions.ts
│   │   └── ...
│   │
│   ├── utils/                 # 工具函数
│   │   ├── id-generator.ts   # ID 生成器
│   │   ├── validators.ts     # 表单校验
│   │   └── exporters.ts      # 导出逻辑（PDF/JSON/图片）
│   │
│   └── types/                 # 全局类型
│       └── index.ts
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── components.json           # shadcn/ui 配置
└── package.json
```

### 2.2 状态管理策略

采用 **Zustand + 领域拆分** 模式：

```
┌─────────────────────────────────────────────┐
│              app-store.ts                    │
│  · 当前选中作品 ID                           │
│  · 当前活跃模块（角色/剧情/关系/体系/灵感）    │
│  · 面板状态（对话面板展开/收起）              │
│  · 全局加载状态                              │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│character│ │  plot   │ │relation │
│ store   │ │ store   │ │ store   │
│ · list  │ │ · nodes │ │ · nodes │
│ · byId  │ │ · edges │ │ · edges │
└─────────┘ └─────────┘ └─────────┘
    │             │             │
    └─────────────┴─────────────┘
                  ▼
         ┌─────────────┐
         │  work-store  │
         │  · 聚合查询   │
         │  · 导出接口   │
         └─────────────┘
```

**为什么不用 Redux Toolkit？**
- 本项目无复杂异步中间件需求（AI 调用在 `ai/client.ts` 中封装）
- Zustand 代码量少 70%，更适合快速迭代
- 模块间数据隔离清晰，不需要全局单一 Store

**为什么不用 Jotai？**
- Jotai 的 atom 抽象在大量实体列表场景下心智负担更高
- Zustand 的 selector 模式对「角色列表+详情」这类 CRUD 更直观

---

## 三、AI 接入方案（核心）

### 3.1 模型选择

| 模型 | 用途 | 原因 |
|------|------|------|
| **deepseek-chat** (V3) | 常规生成（角色/剧情/关系/体系） | 速度快、成本低、Function Calling 支持好 |
| **deepseek-reasoner** (R1) | 复杂推理（一致性校验、伏笔分析） | 推理能力强，适合需要深度分析的任务 |

API 文档: https://api-docs.deepseek.com/

### 3.2 Function Calling 架构

AI 对话面板不是直接操作 DOM，而是通过 **Function Calling** 调用各模块的生成函数。

```typescript
// ai/function-calling.ts

export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'generateCharacter',
      description: '根据描述生成角色档案',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: '用户对角色的描述' }
        },
        required: ['description']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'generatePlotSkeleton',
      description: '根据梗概生成剧情骨架',
      parameters: {
        type: 'object',
        properties: {
          synopsis: { type: 'string' },
          chapterCount: { type: 'number' }
        },
        required: ['synopsis']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'inferRelations',
      description: '根据角色档案推断关系网络',
      parameters: {
        type: 'object',
        properties: {
          characterIds: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'generateSystem',
      description: '生成抽象化的分级体系',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          branchCount: { type: 'number' },
          levelCount: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'captureIdea',
      description: '从用户消息中提取灵感便签',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'updateCharacter',
      description: '修改角色档案的指定字段',
      parameters: {
        type: 'object',
        properties: {
          characterId: { type: 'string' },
          changes: { type: 'object' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'addPlotNode',
      description: '在剧情树中添加节点',
      parameters: {
        type: 'object',
        properties: {
          parentId: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'validateConsistency',
      description: '校验角色言行与人设的一致性',
      parameters: {
        type: 'object',
        properties: {
          characterId: { type: 'string' },
          text: { type: 'string' }
        }
      }
    }
  }
]
```

### 3.3 上下文组装器

每次 AI 调用前，将当前作品的全部数据组装为 prompt 上下文：

```typescript
// ai/context-builder.ts

export function buildWorkContext(workId: string): string {
  const work = getWorkById(workId)
  const characters = getCharactersByWork(workId)
  const plotNodes = getPlotNodesByWork(workId)
  const relations = getRelationsByWork(workId)
  const systems = getSystemsByWork(workId)
  const ideas = getIdeasByWork(workId)

  return `
# 当前作品上下文

## 作品信息
- 名称: ${work.name}
- 类型: ${work.genre || '未指定'}
- 总章节数: ${work.totalChapters || '未指定'}

## 角色列表 (${characters.length} 个)
${characters.map(c => `- ${c.name}: ${c.tags.join(', ')} | ${c.personality.keywords.join(', ')}`).join('\n')}

## 剧情骨架 (${plotNodes.length} 个节点)
${plotNodes.map(n => `- ${n.id}: ${n.title} (${n.status})`).join('\n')}

## 关系网络 (${relations.length} 组)
${relations.map(r => `- ${r.sourceName} → ${r.targetName}: ${r.type}`).join('\n')}

## 体系设定 (${systems.length} 个)
${systems.map(s => `- ${s.name}: ${s.branches.map(b => b.name).join(', ')}`).join('\n')}

## 未归档灵感 (${ideas.filter(i => i.status === 'pending').length} 条)
${ideas.filter(i => i.status === 'pending').map(i => `- ${i.content}`).join('\n')}

请基于以上上下文回答用户问题或执行操作。
上下文 token 占用约 ${estimateTokens(...)}，请合理分配注意力。
  `.trim()
}
```

**上下文截断策略**：
- 角色/剧情/关系超过一定数量时，仅保留「最近访问」和「关键角色」
- 使用摘要压缩：对已完成章节的节点只保留标题和摘要，不保留全文
- 预留 4000 tokens 给用户输入和 AI 输出

### 3.4 对话流程

```
用户输入
   │
   ▼
┌─────────────────────────────┐
│ 1. 组装上下文 (context-builder) │
│    作品数据 + 历史对话        │
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ 2. 调用 DeepSeek API         │
│    tools: 8 个 function      │
│    stream: true (流式输出)    │
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ 3. 解析响应                  │
│    · 普通文本 → 直接展示     │
│    · function_call → 执行函数 │
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ 4. 执行函数 → 更新 Zustand   │
│    store → React 自动重绘    │
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ 5. 返回执行结果给 AI         │
│    (如果需要多轮工具调用)     │
└─────────────────────────────┘
```

---

## 四、可视化引擎选型

### 4.1 剧情分支树 — React Flow

**为什么选 React Flow：**

| 维度 | React Flow | AntV X6 | 结论 |
|------|-----------|---------|------|
| React 集成 | 原生组件，声明式 API | 命令式 API，需手动桥接 | React Flow 胜 |
| 节点编辑 | 拖拽创建、删除、内置支持 | 功能全面但配置复杂 | 本项目够用即可 |
| 包体积 | ~150KB gzip | ~300KB gzip | React Flow 胜 |
| 学习成本 | 低（1 天上手） | 高（需理解 Graph/Model/View） | React Flow 胜 |
| 社区 | 36K+ stars，活跃 | 6K+ stars，国内为主 | React Flow 胜 |

**使用方式**：

```tsx
import { ReactFlow, Background, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

function PlotTreeCanvas() {
  const nodes = usePlotStore(s => s.nodes)
  const edges = usePlotStore(s => s.edges)

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
  )
}
```

### 4.2 人物关系图 — @antv/g6

**为什么选 G6：**

| 维度 | G6 | D3.js | 结论 |
|------|-----|-------|------|
| 力导向布局 | 内置，开箱即用 | 需手写 simulation | G6 胜 |
| 中文文档 | 完善 | 英文为主 | G6 胜 |
| 性能 | 大数据量优化好 | 需手动优化 | G6 胜 |
| 自定义节点 | 丰富 | 灵活但工作量大 | G6 胜 |

React Flow 不适合做力导向关系图（它的定位是流程图编辑器，不是图分析工具）。

### 4.3 体系结构图 — 自定义组件

体系结构图（树形/阶梯状）结构相对固定，不需要复杂的力导向算法。用 **React + CSS Grid/Flexbox** 自研即可：

- 树形体系：递归渲染 + CSS Grid 对齐
- 阶梯图：Flexbox 横向排列层级
- 交互：点击展开/折叠、拖拽排序

---

## 五、数据存储方案

### 5.1 本地优先策略

**原则**：所有数据存储在浏览器本地，不上传云端。

```
┌─────────────────────────────────────────────┐
│              Dexie.js (IndexedDB)            │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  works   │ │characters│ │plot_nodes│    │
│  │ 作品表    │ │ 角色表   │ │ 剧情节点 │    │
│  ├──────────┤ ├──────────┤ ├──────────┤    │
│  │ id (PK)  │ │ id (PK)  │ │ id (PK)  │    │
│  │ name     │ │ workId   │ │ workId   │    │
│  │ genre    │ │ name     │ │ title    │    │
│  │ ...      │ │ ...      │ │ ...      │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │relations │ │ systems  │ │  ideas   │    │
│  │ 关系表   │ │ 体系表   │ │ 灵感表   │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                              │
└─────────────────────────────────────────────┘
```

### 5.2 Zustand 持久化

```typescript
// stores/persist.ts
import { persist, createJSONStorage } from 'zustand/middleware'
import { dexieStorage } from '@/db/dexie-storage'

export const workStore = create(
  persist(
    (set, get) => ({
      // ... state
    }),
    {
      name: 'wangwen-work-store',
      storage: createJSONStorage(() => dexieStorage)
    }
  )
)
```

### 5.3 数据导出

| 格式 | 用途 | 实现 |
|------|------|------|
| JSON | 完整备份/恢复 | `JSON.stringify(work)` |
| PNG/SVG | 关系图/剧情树截图 | html2canvas |
| PDF | 角色设定集/剧情大纲 | jsPDF |
| Markdown | 大纲文本导出 | 模板渲染 |

---

## 六、关键模块实现思路

### 6.1 AI 对话面板

```tsx
// components/chat/ChatPanel.tsx

function ChatPanel() {
  const { messages, sendMessage, isLoading } = useAIChat()

  return (
    <div className="flex flex-col h-full w-[320px] border-l">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && <LoadingSpinner />}
      </div>

      {/* 快捷指令 */}
      <SuggestionChips
        suggestions={[
          '生成一个高冷男主',
          '规划复仇主线',
          '梳理人物关系',
          '设计魔法体系'
        ]}
        onClick={sendMessage}
      />

      {/* 输入框 */}
      <ChatInput
        onSubmit={sendMessage}
        disabled={isLoading}
      />
    </div>
  )
}
```

### 6.2 useAIChat Hook（核心）

```typescript
// hooks/useAIChat.ts

export function useAIChat() {
  const workId = useAppStore(s => s.currentWorkId)
  const addMessage = useAppStore(s => s.addMessage)
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true)

    // 1. 添加用户消息
    addMessage({ role: 'user', content })

    // 2. 组装上下文
    const context = buildWorkContext(workId)

    // 3. 调用 AI
    const stream = await aiClient.chat({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + context },
        ...getRecentMessages(10),
        { role: 'user', content }
      ],
      tools,
      stream: true
    })

    // 4. 处理流式响应
    let assistantMessage = ''
    let toolCalls: ToolCall[] = []

    for await (const chunk of stream) {
      if (chunk.choices[0].delta.tool_calls) {
        toolCalls = accumulateToolCalls(toolCalls, chunk)
      } else {
        assistantMessage += chunk.choices[0].delta.content || ''
        // 实时更新 UI
        updateStreamingMessage(assistantMessage)
      }
    }

    // 5. 执行工具调用
    if (toolCalls.length > 0) {
      for (const call of toolCalls) {
        const result = await executeToolCall(call)
        // 将结果返回给 AI
        await continueWithToolResult(result)
      }
    }

    setIsLoading(false)
  }, [workId])

  return { sendMessage, isLoading }
}
```

### 6.3 人设一致性校验（AI 自动）

**触发时机**：
1. 用户修改角色档案后 → AI 自动扫描已写章节
2. 用户在章节编辑器输入时 → 防抖 2s 后实时检测
3. 用户主动要求校验时 → 全量扫描

**实现方式**：

```typescript
// AI prompt 示例
const CONSISTENCY_CHECK_PROMPT = `
你是一个网文创作助手，专门负责检测角色人设一致性。

已知角色档案：
姓名: {name}
性格关键词: {keywords}
性格详细描述: {description}
经典台词风格: {quotes}

请分析以下文本中该角色的言行是否符合人设。
如果不符合，请指出具体问题并给出修改建议。
如果符合，请回复"一致"。

待检测文本：
{text}

请以 JSON 格式输出：
{
  "consistent": boolean,
  "score": number, // 0-100
  "issues": [
    {
      "text": "原文片段",
      "problem": "问题描述",
      "suggestion": "修改建议"
    }
  ]
}
`
```

---

## 七、开发环境配置

### 7.1 初始化命令

```bash
# 1. 创建项目
npm create vite@latest wangwen -- --template react-ts

# 2. 进入目录
cd wangwen

# 3. 安装依赖
pnpm install

# 4. 安装核心依赖
pnpm add zustand immer @xyflow/react @antv/g6 tiptap-react tiptap-starter-kit
pnpm add dexie html2canvas jspdf
pnpm add tailwindcss postcss autoprefixer
pnpm add -D @types/react @types/react-dom typescript

# 5. 初始化 Tailwind
npx tailwindcss init -p

# 6. 初始化 shadcn/ui
npx shadcn-ui@latest init
```

### 7.2 DeepSeek API 配置

```typescript
// .env.local
VITE_DEEPSEEK_API_KEY=your_api_key_here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
```

```typescript
// ai/client.ts
const client = new OpenAI({
  baseURL: import.meta.env.VITE_DEEPSEEK_BASE_URL,
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  dangerouslyAllowBrowser: true // 仅用于开发测试，生产环境需走后端代理
})
```

**生产环境注意**：API Key 不应暴露在前端，建议：
- 方案 A：自建轻量后端代理（Cloudflare Workers / Vercel Edge Function）
- 方案 B：使用支持 CORS 的第三方代理服务
- 方案 C：用户自行配置 API Key（本地工具常见做法）

---

## 八、性能考量

| 场景 | 策略 |
|------|------|
| 剧情树 100+ 节点 | React Flow 虚拟滚动 + 节点懒加载 |
| 关系图 100+ 角色 | G6 大数据模式 + 节点聚合 |
| AI 上下文过长 | 摘要压缩 + 关键信息保留 |
| 本地存储上限 | 单作品 50MB 软限制，超限时提醒导出 |
| 首次加载 | Vite 预加载 + 路由懒加载 |

---

## 九、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| DeepSeek API 不可用 | AI 功能完全失效 | 降级为手动模式，所有功能仍可手动操作 |
| AI 生成内容质量不稳定 | 用户体验差 | 增加「重新生成」按钮，用户可多次尝试 |
| 本地数据丢失 | 用户作品丢失 | 定期导出提醒 + 自动备份到本地文件 |
| 长文本上下文超限 | AI 遗忘早期设定 | 摘要压缩 + 关键信息提取 |
| 中文文件名编码问题 | Git 操作失败 | 统一使用英文文件名，中文仅出现在内容中 |

---

## 十、MVP 技术实现路径

### Phase 1: 骨架搭建（1 周）

- [ ] Vite + React + TypeScript 项目初始化
- [ ] Tailwind CSS + shadcn/ui 配置
- [ ] Zustand store 结构搭建
- [ ] Dexie.js 数据库初始化
- [ ] 页面布局（左侧画布 + 右侧 AI 面板）

### Phase 2: AI 核心（1 周）

- [ ] DeepSeek API 客户端封装
- [ ] Function Calling 工具注册
- [ ] 上下文组装器实现
- [ ] 流式响应处理
- [ ] AI 对话面板 UI

### Phase 3: 角色模块（1 周）

- [ ] 角色类型定义 + store
- [ ] AI 生成角色功能
- [ ] 角色卡片墙 UI
- [ ] AI 形象生成（调用文生图 API）
- [ ] 角色详情编辑面板

### Phase 4: 剧情模块（1 周）

- [ ] React Flow 集成
- [ ] AI 生成剧情骨架
- [ ] 节点增删改操作
- [ ] 伏笔标记与追踪

### Phase 5: 关系+体系+灵感（1 周）

- [ ] G6 关系图集成
- [ ] AI 自动推断关系
- [ ] 体系管理工具 UI
- [ ] 灵感便签功能

### Phase 6: 校验+导出+收尾（1 周）

- [ ] 人设一致性校验
- [ ] 规则冲突检测
- [ ] 数据导出（JSON/PDF/图片）
- [ ] 全局搜索
- [ ] 响应式适配

**总计：约 6 周 MVP**

---

## 附录：开发决策记录

```
1. [React Flow > X6 for 剧情树] React 原生、学习成本低、够用
2. [G6 > D3 for 关系图] 力导向开箱即用、中文文档、性能更好
3. [Zustand > Redux/Jotai] 极简 API、无需 Provider、开发效率高
4. [DeepSeek > Claude for 主力] 中文强、成本低、Function Calling 完善
5. [IndexedDB > localStorage] 结构化存储、支持大数据量、索引查询
6. [本地优先 > 云端] 保护创作隐私、降低架构复杂度
7. [TipTap > Slate] 生态更成熟、插件丰富、文档完善
8. [shadcn/ui > Ant Design] 无样式依赖、Tailwind 原生、可定制
```
