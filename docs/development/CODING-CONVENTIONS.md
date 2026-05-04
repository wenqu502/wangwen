# 织文 (WangWen) 编码规范

> **所属模块**: development
> **编制日期**: 2026-05-04
> **编制角色**: 吴奕大青 (Wydq)
> **版本**: v1.0
> **状态**: 已发布

---

## 变更记录

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|----------|--------|
| 2026-05-04 | v1.0 | 初版：编码规范、命名约定、文件组织 | Wydq |

---

## 一、技术栈版本锁定

| 技术 | 版本 | 用途 | 升级策略 |
|------|------|------|----------|
| React | ^19.0.0 | UI 框架 | 跟随 React 官方 LTS |
| TypeScript | ^5.x | 类型系统 | 跟随 TS 官方稳定版 |
| Vite | ^6.x | 构建工具 | 跟随 Vite 官方稳定版 |
| Tailwind CSS | ^4.x | 样式方案 | v4 迁移成本较高，谨慎升级 |
| Zustand | ^5.x | 状态管理 | 小版本可自动升级 |
| Dexie | ^4.x | 本地数据库 | 大版本需评估 IndexedDB 兼容性 |
| @xyflow/react | ^12.x | 剧情树画布 | 跟随官方更新 |
| @antv/g6 | ^5.x | 关系图 | 跟随官方更新 |

**升级原则**: 
- 补丁版本（patch）：自动升级
- 次要版本（minor）：评估后升级
- 主要版本（major）：必须做回归测试

---

## 二、文件与目录组织

### 2.1 目录结构

```
src/
├── ai/                    # AI 层：API 封装、流式处理、Function Calling
│   ├── client.ts
│   ├── streaming.ts
│   ├── types.ts
│   ├── function-calling.ts
│   └── prompts/           # 各模块 AI 提示词（待创建）
│       ├── character-prompts.ts
│       ├── plot-prompts.ts
│       └── ...
├── db/                    # 数据层：Dexie 定义
│   ├── index.ts
│   └── migrations/        # 数据库迁移脚本（待创建）
├── types/                 # 全局类型定义
│   └── index.ts
├── stores/                # 全局状态
│   ├── app-store.ts
│   └── index.ts           # 统一导出
├── modules/               # 业务模块（每个模块独立）
│   ├── character/
│   │   ├── CharacterCanvas.tsx
│   │   ├── store.ts
│   │   ├── types.ts
│   │   └── ai-prompts.ts
│   ├── plot/
│   ├── relation/
│   ├── system/
│   └── idea/
├── components/            # 共享组件
│   ├── ui/                # 基础 UI 组件
│   ├── chat/              # AI 对话相关
│   └── canvas/            # 画布通用组件
├── lib/                   # 工具函数
│   └── utils.ts           # cn() 等通用工具
├── utils/                 # 业务工具
│   └── id-generator.ts
├── hooks/                 # 自定义 Hooks（待创建）
└── App.tsx                # 根组件
```

### 2.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase + `.tsx` | `CharacterCanvas.tsx` |
| 组件名 | PascalCase | `function CharacterCanvas()` |
| Store 文件 | camelCase + `.ts` | `store.ts` |
| Store Hook | `use` + PascalCase + `Store` | `useCharacterStore` |
| 类型文件 | camelCase + `.ts` | `types.ts` |
| 工具函数 | camelCase | `generateCharacterId()` |
| 常量 | UPPER_SNAKE_CASE | `MAX_CONTEXT_TOKENS = 50000` |
| 接口 | PascalCase | `interface CharacterState` |
| 枚举 | PascalCase | `enum PlotStatus` |
| 类型别名 | PascalCase | `type ModuleTab = 'character' \| 'plot'` |

### 2.3 导入顺序

```typescript
// 1. React 核心
import { useState, useEffect, useCallback } from 'react'

// 2. 第三方库（按字母序）
import { immer } from 'zustand/middleware/immer'
import { create } from 'zustand'

// 3. 项目内部（按层级：types → utils → hooks → stores → components）
import type { Character } from '@/types'
import { generateId } from '@/utils/id-generator'
import { useCharacterStore } from '@/modules/character/store'
import { ChatPanel } from '@/components/chat/ChatPanel'

// 4. 样式（最后）
import './CharacterCanvas.css'  // 如需要
```

---

## 三、TypeScript 规范

### 3.1 严格模式要求

`tsconfig.app.json` 中必须启用：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 3.2 类型声明规范

```typescript
// ✅ 显式声明函数返回类型
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ✅ 接口首字母大写，属性名 camelCase
interface Character {
  id: string
  workId: string
  name: string
  createdAt: string
}

// ✅ 使用 type 定义联合类型
type ModuleTab = 'character' | 'plot' | 'relation' | 'system' | 'idea'

// ❌ 禁止使用 any（特殊情况需在代码注释中说明）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function legacyParser(data: any): unknown {
  // ...
}
```

### 3.3 空值处理

```typescript
// ✅ 使用可选链和空值合并
const name = character?.name ?? '未命名'

// ✅ 显式检查 null/undefined
if (selectedId != null) {  // 同时覆盖 null 和 undefined
  // ...
}

// ❌ 避免隐式转换
if (selectedId) {  // 空字符串也会被判定为 false，可能误伤
  // ...
}
```

---

## 四、React 组件规范

### 4.1 函数组件写法

```typescript
// ✅ 使用函数声明 + 显式返回类型
export function CharacterCanvas(): JSX.Element {
  const { characters } = useCharacterStore()
  // ...
}

// ✅ Props 接口命名：组件名 + Props
interface CharacterCardProps {
  character: Character
  onSelect: (id: string) => void
  isSelected?: boolean
}

export function CharacterCard({ character, onSelect, isSelected = false }: CharacterCardProps): JSX.Element {
  // ...
}
```

### 4.2 Hooks 使用规范

```typescript
// ✅ 自定义 Hook 必须以 use 开头
export function useCharacterList(workId: string): Character[] {
  const { characters } = useCharacterStore()
  return useMemo(
    () => Object.values(characters).filter((c) => c.workId === workId),
    [characters, workId]
  )
}

// ✅ useEffect 依赖数组必须完整
useEffect(() => {
  loadCharacters(workId)
}, [workId, loadCharacters])  // 两个依赖都必须包含
```

### 4.3 性能优化

```typescript
// ✅ 大数据列表使用 React.memo
export const CharacterListItem = memo(function CharacterListItem({
  character,
  onSelect,
}: CharacterListItemProps): JSX.Element {
  // ...
})

// ✅ useMemo 缓存计算结果
const sortedCharacters = useMemo(
  () => characterList.sort((a, b) => a.name.localeCompare(b.name)),
  [characterList]
)

// ✅ useCallback 缓存事件处理函数
const handleDelete = useCallback((id: string) => {
  deleteCharacter(id)
}, [deleteCharacter])
```

---

## 五、状态管理规范

详见 `STATE-MANAGEMENT.md`。核心要点：

1. **模块隔离**: 每个业务模块拥有独立 Store，不直接引用其他模块的 Store
2. **统一命名**: 各模块 Store 暴露标准接口（`setItems` / `addItem` / `updateItem` / `deleteItem` / `selectItem`）
3. **Immer 使用**: 所有 set 操作通过 Immer 处理，禁止直接修改 state

---

## 六、样式规范

### 6.1 Tailwind CSS 使用

```tsx
// ✅ 使用 cn() 工具合并类名
import { cn } from '@/lib/utils'

<button
  className={cn(
    'px-4 py-2 rounded-md transition-colors',
    isActive
      ? 'bg-indigo-600 text-white'
      : 'bg-white text-neutral-700 hover:bg-neutral-50'
  )}
>

// ✅ 复杂样式提取为变量
const cardVariants = {
  default: 'bg-white border border-neutral-200 rounded-lg',
  selected: 'bg-indigo-50 border border-indigo-300 rounded-lg shadow-sm',
}

// ❌ 避免行内样式（除非动态计算值）
// ❌ 避免过长的 className 字符串（超过 5 个工具类考虑提取）
```

### 6.2 颜色规范

| 用途 | Tailwind 类 | 色值 |
|------|-------------|------|
| 主品牌色 | `text-indigo-600` / `bg-indigo-600` | `#4f46e5` |
| 主品牌浅色 | `bg-indigo-50` / `text-indigo-700` | `#eef2ff` / `#4338ca` |
| 中性文字-主 | `text-neutral-900` | `#171717` |
| 中性文字-次 | `text-neutral-600` / `text-neutral-500` | `#525252` / `#737373` |
| 边框 | `border-neutral-200` | `#e5e5e5` |
| 背景-页面 | `bg-neutral-50` | `#fafafa` |
| 背景-卡片 | `bg-white` | `#ffffff` |
| 危险/删除 | `text-red-600` / `hover:bg-red-50` | `#dc2626` |

---

## 七、AI 层编码规范

### 7.1 Prompt 管理

```typescript
// ✅ 提示词集中管理，按模块拆分
// src/ai/prompts/character-prompts.ts
export const CHARACTER_GENERATION_PROMPT = `
你是网文创作助手。根据用户描述生成角色设定。

输出格式必须是 JSON，包含以下字段：
- name: 角色名
- aliases: 别名数组
- personality: { surface, inner, stressResponse }
- background: 背景故事
- goals: 角色目标

约束：
- 每个字段不能为空
- personality 必须有深度，不只是表面描述
- 背景故事需包含至少一个关键转折点
`

// ✅ Prompt 参数化
export function buildCharacterPrompt(description: string, genre: string): string {
  return `${CHARACTER_GENERATION_PROMPT}\n\n作品类型: ${genre}\n用户描述: ${description}`
}
```

### 7.2 Function Calling 规范

```typescript
// ✅ 工具定义集中管理
export const tools: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'generateCharacter',
      description: '根据描述生成角色设定',
      parameters: {
        type: 'object',
        properties: {
          description: { type: 'string', description: '角色描述' },
          genre: { type: 'string', description: '作品类型' },
        },
        required: ['description'],
      },
    },
  },
]

// ✅ 工具处理函数与定义分离
export async function handleGenerateCharacter(args: { description: string; genre?: string }): Promise<Character> {
  // ...
}
```

---

## 八、Git 提交规范

### 8.1 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

| 类型 | 用途 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 bug |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具链 |

**示例**:

```
feat(character): 添加角色 AI 生成功能

- 集成 DeepSeek API 的角色生成提示词
- 在角色面板添加 "AI 创建" 按钮
- 生成结果自动保存到 Dexie

Closes #123
```

### 8.2 分支策略

```
main          # 生产分支，始终可部署
develop       # 开发分支，功能集成
feature/*     # 功能分支，从 develop 检出
hotfix/*      # 紧急修复，从 main 检出
```

---

## 九、代码审查清单

提交 PR 前自检：

- [ ] TypeScript 编译通过（`npm run build` 或 `npx tsc -b`）
- [ ] 无 `console.log` 调试代码（`console.error` 可保留）
- [ ] 无未使用的变量/导入
- [ ] 组件已添加适当的 `memo` / `useMemo` / `useCallback`
- [ ] Dexie 操作已考虑错误处理
- [ ] AI 调用已添加 try/catch 和超时处理
- [ ] 新功能已添加类型定义
- [ ] 复杂逻辑已添加注释

---

> **维护者**: 吴奕大青 (Wydq)
> **更新频率**: 每迭代周期评审一次，技术栈变更时即时更新
