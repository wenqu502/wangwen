# 织文 (WangWen) 技术架构设计文档

> **编制日期**: 2026-05-03
> **编制角色**: 系统架构师 (program-system-architecture-expert)
> **版本**: v1.0

---

## 一、架构决策记录 (ADR)

### ADR-001: 前端框架选型 — React 19 + TypeScript + Vite

**决策**: 采用 React 19 + TypeScript + Vite 作为前端技术底座。

**依据**:
- React 19 的 Compiler 自动优化渲染，减少手动 useMemo/useCallback
- TypeScript 在 AI 生成内容对接场景下提供强类型保障
- Vite 的 HMR 和构建速度远快于 Webpack，适合快速迭代
- 团队已有 React 技术积累（从 PRD 和现有代码推断）

**影响范围**: 全站所有 UI 组件和页面。

### ADR-002: 状态管理 — Zustand + Immer

**决策**: 采用 Zustand 做全局状态管理，Immer 处理不可变更新。

**依据**:
- Redux Toolkit 过重，本项目模块间通信并不复杂
- Zustand 的 API 极简，Store 可直接按模块拆分
- Immer 让深层对象修改写起来像 mutable，降低心智负担
- persist 中间件支持 localStorage 持久化，满足"离线优先"需求

**影响范围**: src/stores/、src/modules/*/store.ts

### ADR-003: 本地数据库 — Dexie (IndexedDB 封装)

**决策**: 采用 Dexie 作为本地数据持久化层。

**依据**:
- PRD 明确要求"隐私优先，作品数据本地存储"
- Dexie 比原生 IndexedDB API 简洁 10 倍以上，支持 Promise 和 TypeScript
- 6 张表的复合索引设计已能满足当前查询需求
- 未来如需云端同步，可在 Dexie 层之上再加同步适配器，不破坏现有代码

**影响范围**: src/db/index.ts

### ADR-004: AI 后端 — DeepSeek API (OpenAI 兼容接口)

**决策**: 采用 DeepSeek API 作为大模型后端。

**依据**:
- 国内可用，无需翻墙，网络稳定性高
- 价格低于 Claude/GPT，适合高频创作场景
- 支持 Function Calling 和流式输出，满足 PRD 中"对话式创作"的交互要求
- 使用 openai SDK 封装，未来可无缝切换到其他 OpenAI 兼容接口

**影响范围**: src/ai/client.ts、src/ai/streaming.ts

### ADR-005: 可视化引擎 — React Flow (剧情树) + @antv/g6 (关系图)

**决策**: 剧情树用 React Flow，关系图用 G6。

**依据**:
- React Flow 原生支持节点拖拽、连线、自定义节点，完美匹配"剧情分支树"需求
- G6 的力导向布局算法成熟，100+ 节点也能流畅渲染，适合"人物关系图"
- 两者都是 React 生态主流方案，社区活跃，文档完善
- 分开选型而非统一用 D3：降低各自的学习成本和维护成本

**影响范围**: src/modules/plot/、src/modules/relation/

### ADR-006: 样式方案 — Tailwind CSS v4

**决策**: 采用 Tailwind CSS v4 的原生 CSS import 方式。

**依据**:
- 项目骨架已使用 v4 的 `@import "tailwindcss"` 语法
- v4 的 CSS-first 配置更简洁，无需 tailwind.config.js
- 与 shadcn/ui 等组件库兼容（如需后续引入）

**影响范围**: src/index.css、全局组件样式

---

## 二、模块边界与依赖关系

### 2.1 模块分层图

```
┌─────────────────────────────────────────────────────────────┐
│                        表现层 (UI Layer)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ App.tsx  │ │Character │ │  Plot    │ │ Relation │ ...   │
│  │(布局壳子)│ │  Card    │ │  Tree    │ │  Graph   │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │              │
│       └────────────┴─────┬──────┴────────────┘              │
│                          ▼                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              AI 对话面板 (AI Chat Panel)              │   │
│  │         常驻右侧，跨模块全局组件                      │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      状态层 (State Layer)                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ app-store  │ │ character  │ │   plot     │              │
│  │(全局状态)  │ │   store    │ │   store    │ ...           │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘              │
│        │              │              │                      │
│        └──────────────┴──────┬───────┘                      │
│                              ▼                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Zustand + Immer + persist               │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      数据层 (Data Layer)                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │   Dexie    │ │   types    │ │ id-generator│              │
│  │(IndexedDB) │ │(Type定义)  │ │ (ID工具)   │              │
│  └────────────┘ └────────────┘ └────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                       AI 层 (AI Layer)                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │   client   │ │  streaming │ │  function  │              │
│  │(API封装)   │ │(流式处理)  │ │  calling   │              │
│  └────────────┘ └────────────┘ └────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块依赖规则

| 规则编号 | 规则内容 | 违反后果 |
|----------|----------|----------|
| R-001 | UI 层只能依赖 State 层和 AI 层 | 防止组件直接操作数据库 |
| R-002 | State 层只能依赖 Data 层和 AI 层 | 保证状态逻辑的可测试性 |
| R-003 | AI 层只能依赖 Data 层的 types | 保证 AI 接口契约的类型安全 |
| R-004 | 模块间 Store 不直接互相引用 | 通过 App Store 或事件总线协调 |
| R-005 | Dexie 操作只在 Store 的 action 中执行 | 数据库层不暴露给组件 |

### 2.3 核心数据流

```
【用户输入】
    │
    ▼
【AI Chat Panel】→ 组装 Prompt（含当前作品上下文）
    │
    ▼
【AI Client】→ 调用 DeepSeek API（流式输出）
    │
    ▼
【Streaming Handler】→ 解析 content / tool_calls
    │
    ├── content → 直接渲染到对话面板
    │
    └── tool_calls → 调用对应模块的 Store Action
                         │
                         ▼
                  【Zustand Store】→ 更新内存状态
                         │
                         ▼
                  【Dexie IndexedDB】→ 异步持久化
                         │
                         ▼
                  【React 组件】→ 自动重绘画布
```

---

## 三、接口契约

### 3.1 AI 层接口

```typescript
// src/ai/client.ts
async function* chatStream(options: AIChatOptions): AsyncGeneratorGenerator<AIStreamChunk>
async function chatOnce(options: AIChatOptions): Promise<string>
function createSystemPrompt(base: string, context: string): AIChatMessage

// src/ai/streaming.ts
async function handleStreamingResponse(
  options: AIChatOptions,
  onContent: (text: string) => void,
): Promise Promise<StreamingResult>
```

### 3.2 全局状态接口 (App Store)

```typescript
interface AppState {
  currentWorkId: string | null    // 当前选中作品
  currentTab: ModuleTab           // 当前模块标签
  isChatPanelOpen: boolean        // AI 面板开关
  isLoading: boolean              // 全局 loading
  messages: ChatMessage[]         // 对话历史
}
```

### 3.3 模块 Store 标准化接口

每个模块 Store 必须暴露以下标准接口：

```typescript
interface ModuleStore<T> {
  items: Record<string, T>        // 数据字典（原命名各异，建议统一）
  selectedId: string | null       // 当前选中项
  
  setItems: (list: T[]) => void   // 批量设置
  addItem: (item: T) => void      // 新增
  updateItem: (id: string, updater: (item: T) => void) => void  // 更新
  deleteItem: (id: string) => void // 删除
  selectItem: (id: string | null) => void  // 选中
}
```

**当前问题**: characterStore 用 `characters`，plotStore 用 `nodes`，relationStore 用 `edges`，命名不统一。建议保持现状（已足够语义化），不在本次迭代中重构。

### 3.4 Function Calling 工具契约

```typescript
// src/ai/function-calling.ts 中定义的 8 个工具
1. generateCharacter(description: string) → Character JSON
2. updateCharacter(characterId: string, changes: object)
3. generatePlotSkeleton(synopsis: string, chapterCount?: number) → PlotNode[]
4. addPlotNode(parentId: string, title: string, summary: string)
5. inferRelations(characterIds: string[]) → RelationEdge[]
6. generateSystem(description: string, branchCount?: number, levelCount?: number) → WorkSystem
7. captureIdea(content: string, tags?: string[]) → Idea
8. validateConsistency(characterId: string, text: string) → ConsistencyReport
```

---

## 四、技术债务与风险登记

### 4.1 当前技术债务

| 编号 | 债务项 | 严重程度 | 偿还计划 |
|------|--------|----------|----------|
| TD-001 | types.ts 中的 `any` 类型（client.ts 中 `messages as any`） | 中 | 在 AI 层稳定后，定义精确的 OpenAI SDK 类型映射 |
| TD-002 | ID 生成器使用全局计数器，并发场景可能冲突 | 低 | 引入 nanoid 或 uuid 替换当前实现 |
| TD-003 | 没有错误边界 (Error Boundary) | 中 | MVP 后补充，防止 AI 调用异常导致全站崩溃 |
| TD-004 | AI 提示词模板（ai-prompts.ts）尚未实现 | 高 | **当前迭代必须完成** |

### 4.2 风险登记

| 编号 | 风险描述 | 影响 | 缓解措施 |
|------|----------|------|----------|
| RISK-001 | DeepSeek API 在流式输出时可能返回格式不标准的 tool_calls | 高 | 在 streaming.ts 中增加健壮的容错解析 |
| RISK-002 | React Flow 和 G6 同时加载，首屏包体积过大 | 中 | 按模块懒加载可视化组件，非当前模块不渲染 |
| RISK-003 | IndexedDB 在隐身模式下不可用 | 中 | 降级到内存存储，并提示用户 |
| RISK-004 | 长文本上下文超过模型上下文窗口 | 高 | 实现上下文摘要压缩策略（PRD 已提及） |

---

## 五、MVP 开发顺序

按 PRD 的 P0 范围，结合架构依赖关系，建议以下开发顺序：

```
Phase 1: 基础骨架（Batch 1）
  ├─ 修复编译错误 ✅
  ├─ 安装依赖 🔄
  ├─ App.tsx 主布局壳子
  │    ├─ 顶部导航栏（52px）
  │    ├─ 左侧主内容区（动态画布）
  │    └─ 右侧 AI 对话面板（320px，常驻）
  └─ 底部模块切换 Tab

Phase 2: 角色模块 MVP（Batch 2）
  ├─ CharacterCard 组件（卡片列表 + 详情抽屉）
  ├─ 角色模块 AI Prompts（ai-prompts.ts）
  ├─ AI 对话集成："帮我创建一个..."
  └─ Dexie 持久化接入

Phase 3: 剧情模块 MVP（Batch 3）
  ├─ React Flow 画布集成
  ├─ 剧情节点自定义组件
  ├─ 剧情模块 AI Prompts
  └─ AI 生成剧情骨架 → 渲染到画布

Phase 4: 关系 + 体系 + 灵感（Batch 4）
  ├─ 关系图（G6 力导向布局）
  ├─ 体系管理（树形结构）
  └─ 灵感便签（列表 + 自动提取）

Phase 5: 全局联调（Batch 5）
  ├─ 模块间跳转联动
  ├─ AI 上下文组装器
  ├─ 导出功能（html2canvas + jsPDF）
  └─ 性能走查
```

---

## 六、关键设计模式

### 6.1 AI 驱动型组件模式

每个模块的 UI 组件遵循以下模式：

```
+---------------------+
|   ModuleCanvas      |  ← 纯展示组件，从 Store 读取数据
|   (可视化区域)       |
+---------------------+
         ↑
    【Zustand Store】
         ↑
+---------------------+
|   AI Orchestrator   |  ← 在 AI 对话面板中，根据用户意图
|   (意图分发器)       |     调用对应模块的生成函数
+---------------------+
         ↑
    【用户输入】
```

### 6.2 上下文组装器模式

AI 调用前需要将当前作品的全部数据组装成 Prompt 上下文：

```typescript
function buildWorkContext(workId: string): string {
  const work = /* 从 Dexie 读取作品信息 */
  const characters = /* 读取全部角色 */
  const plotNodes = /* 读取全部剧情节点 */
  const relations = /* 读取全部关系 */
  const systems = /* 读取全部体系 */
  
  return `
    作品名称: ${work.name}
    类型: ${work.genre}
    角色列表: ${characters.map(c => `- ${c.name}: ${c.personality.surface}`).join('\n')}
    剧情节点: ${plotNodes.map(n => `- ${n.title}: ${n.summary}`).join('\n')}
    ...
  `
}
```

**优化策略**: 当数据量过大时，对已完成章节做摘要压缩，只保留关键角色和活跃节点。

---

## 七、验证清单

### 7.1 架构验证

- [ ] App.tsx 布局在 1280px 以上宽度不破版
- [ ] 各模块 Store 的 CRUD 操作不互相干扰
- [ ] Dexie 写入后，Zustand Store 能正确响应（通过重新读取）
- [ ] AI 流式输出时 UI 不卡顿
- [ ] 切换模块 Tab 时，未激活模块的组件不渲染（性能）

### 7.2 安全验证

- [ ] API Key 不硬编码在源码中，通过 .env.local 注入
- [ ] 用户创作数据只存本地 IndexedDB，不上传
- [ ] AI 返回的内容在渲染前做 XSS 过滤（如使用 DOMPurify）

---

> **架构师签名**: 本架构遵循"刚好足够"原则，支持未来扩展到云端同步和多端协作，但不过度设计。每个技术决策均有明确的取舍说明。
