# 织文 (WangWen) 状态管理与数据存储规范

> **所属模块**: development
> **编制日期**: 2026-05-04
> **编制角色**: 吴奕大青 (Wydq) + Program 架构师
> **版本**: v1.0
> **状态**: 已发布

---

## 变更记录

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|----------|--------|
| 2026-05-04 | v1.0 | 初版：Zustand 规范、Dexie 规范、数据流规范 | Wydq |

---

## 一、状态分层架构

```
┌─────────────────────────────────────────┐
│  Layer 3: UI State (组件局部状态)        │
│  useState / useReducer                   │
│  例: 输入框内容、弹窗开关、临时表单值      │
├─────────────────────────────────────────┤
│  Layer 2: Global State (全局状态)        │
│  Zustand Store (内存)                    │
│  例: 当前作品、当前 Tab、选中项 ID        │
├─────────────────────────────────────────┤
│  Layer 1: Persistent State (持久状态)    │
│  Dexie / IndexedDB (磁盘)                │
│  例: 角色数据、剧情节点、关系边、作品信息   │
└─────────────────────────────────────────┘
```

**核心原则**: 数据优先存持久层，内存层只做缓存和查询优化。

---

## 二、Zustand Store 规范

### 2.1 Store 分类

| Store | 职责 | 持久化 | 模块 |
|-------|------|--------|------|
| `app-store` | 全局 UI 状态 | ✅ localStorage | 全局 |
| `character-store` | 角色数据 | ❌ 仅内存 | character |
| `plot-store` | 剧情节点 | ❌ 仅内存 | plot |
| `relation-store` | 关系边 | ❌ 仅内存 | relation |
| `system-store` | 体系设定 | ❌ 仅内存 | system |
| `idea-store` | 灵感便签 | ❌ 仅内存 | idea |

**说明**: 业务模块 Store 不直接持久化，由 Dexie 负责持久化。Store 从 Dexie 加载数据到内存，用户操作后写回 Dexie。

### 2.2 Store 标准接口

每个业务模块 Store 必须实现以下标准接口：

```typescript
interface ModuleStore<T> {
  // === 数据 ===
  items: Record<string, T>        // 数据字典（具体字段名可不同，如 characters/nodes/edges）
  selectedId: string | null       // 当前选中项

  // === CRUD ===
  setItems: (list: T[]) => void   // 批量设置（覆盖式）
  addItem: (item: T) => void      // 新增
  updateItem: (id: string, updater: (item: T) => void) => void  // Immer 更新
  deleteItem: (id: string) => void // 删除
  selectItem: (id: string | null) => void  // 选中

  // === 数据加载 ===
  loadFromDB: (workId: string) => Promise<void>  // 从 Dexie 加载
  saveToDB: (item: T) => Promise<void>           // 保存到 Dexie
}
```

### 2.3 Store 实现模板

```typescript
// src/modules/{module}/store.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { SomeItem } from '@/types'
import { db } from '@/db'

interface SomeState {
  // 数据
  items: Record<string, SomeItem>
  selectedId: string | null

  // 操作
  setItems: (list: SomeItem[]) => void
  addItem: (item: SomeItem) => void
  updateItem: (id: string, updater: (item: SomeItem) => void) => void
  deleteItem: (id: string) => void
  selectItem: (id: string | null) => void

  // 持久化
  loadFromDB: (workId: string) => Promise<void>
  syncToDB: (item: SomeItem) => Promise<void>
}

export const useSomeStore = create<SomeState>()(
  immer((set, get) => ({
    items: {},
    selectedId: null,

    setItems: (list) =>
      set((state) => {
        state.items = {}
        for (const item of list) state.items[item.id] = item
      }),

    addItem: (item) =>
      set((state) => {
        state.items[item.id] = item
      }),

    updateItem: (id, updater) =>
      set((state) => {
        const item = state.items[id]
        if (item) updater(item)
      }),

    deleteItem: (id) =>
      set((state) => {
        delete state.items[id]
        if (state.selectedId === id) state.selectedId = null
      }),

    selectItem: (id) =>
      set((state) => {
        state.selectedId = id
      }),

    loadFromDB: async (workId) => {
      const list = await db.someTable.where('workId').equals(workId).toArray()
      get().setItems(list)
    },

    syncToDB: async (item) => {
      await db.someTable.put(item)
    },
  }))
)
```

### 2.4 性能优化规范

#### Selector 优化

```typescript
// ❌ 订阅整个 Store（任何字段变化都触发重渲染）
const store = useCharacterStore()
const characters = Object.values(store.characters)

// ✅ 只订阅需要的数据
import { shallow } from 'zustand/shallow'

// 场景 1: 只需要列表
const characterList = useCharacterStore(
  (s) => Object.values(s.characters),
  shallow
)

// 场景 2: 只需要选中项
const selectedCharacter = useCharacterStore(
  (s) => (s.selectedId ? s.characters[s.selectedId] : null)
)

// 场景 3: 只需要数量
const characterCount = useCharacterStore((s) => Object.keys(s.characters).length)
```

#### 批量更新优化

```typescript
// ❌ 逐条更新（触发多次重渲染）
for (const char of newCharacters) {
  addCharacter(char)
}

// ✅ 批量设置（只触发一次重渲染）
setCharacters(newCharacters)

// ✅ Dexie 批量写入
async function bulkAddCharacters(characters: Character[]) {
  await db.characters.bulkAdd(characters)
  // 然后一次性更新 Store
  useCharacterStore.getState().setItems(
    await db.characters.where('workId').equals(currentWorkId).toArray()
  )
}
```

---

## 三、Dexie 规范

### 3.1 数据库定义

```typescript
// src/db/index.ts
import Dexie, { type Table } from 'dexie'
import type { Work, Character, PlotNode, RelationEdge, WorkSystem, Idea } from '@/types'

class WangWenDB extends Dexie {
  works!: Table<Work>
  characters!: Table<Character>
  plotNodes!: Table<PlotNode>
  relations!: Table<RelationEdge>
  systems!: Table<WorkSystem>
  ideas!: Table<Idea>

  constructor() {
    super('wangwen-db')

    // === 版本迁移策略 ===
    // v1: 初始版本
    this.version(1).stores({
      works: 'id, name, createdAt',
      characters: 'id, workId, name, [workId+name], createdAt',
      plotNodes: 'id, workId, [workId+status], createdAt',
      relations: 'id, workId, [workId+sourceId], createdAt',
      systems: 'id, workId, createdAt',
      ideas: 'id, workId, [workId+status], createdAt',
    })

    // v2: 示例升级（未来使用）
    // this.version(2).stores({...}).upgrade(tx => {...})
  }
}

export const db = new WangWenDB()
```

### 3.2 索引设计原则

| 原则 | 说明 |
|------|------|
| 主键 | 必须，唯一标识每条记录 |
| 外键索引 | `workId` 必须索引，所有查询按作品隔离 |
| 复合索引 | 遵循最左前缀原则，避免冗余单字段索引 |
| 多值索引 | 用 `*` 前缀，如 `*tags` |
| 唯一索引 | 用 `&` 前缀，如 `&name` |

### 3.3 索引优化示例

```typescript
// 当前索引（待优化）
characters: 'id, workId, name, [workId+name], createdAt'

// 优化后（移除冗余单字段索引）
characters: 'id, [workId+name], [workId+status], createdAt'
// 说明: [workId+name] 的前缀 workId 可覆盖 where('workId').equals() 查询

// relations 表（补充 targetId 索引）
relations: 'id, [workId+sourceId], [workId+targetId], createdAt'
```

### 3.4 数据库版本迁移

**关键规则**:
1. 版本号只能递增，不能回退
2. 每个版本独立定义 schema，Dexie 会自动按顺序执行升级
3. `upgrade` 回调中处理数据迁移（新增字段默认值、数据转换等）
4. 升级失败时 Dexie 会抛 `VersionError`

```typescript
this.version(2)
  .stores({
    characters: 'id, [workId+name], [workId+status], createdAt',
  })
  .upgrade((tx) => {
    return tx.table('characters').toCollection().modify((char) => {
      // 给旧数据添加新字段
      char.status = char.status || 'alive'
      char.powerLevel = char.powerLevel || 0
      // 删除已废弃的字段
      delete char.deprecatedField
    })
  })
```

---

## 四、数据流规范

### 4.1 标准数据流

```
用户操作
  │
  ▼
【UI 组件】→ 调用 Store Action
  │
  ▼
【Zustand Store】→ 更新内存状态（Immer）
  │
  ▼
【Dexie】→ 异步持久化
  │
  ▼
【React 组件】→ 自动重绘（通过 Store 订阅）
```

### 4.2 AI 驱动的数据流

```
用户输入
  │
  ▼
【ChatPanel】→ 组装 Prompt（含作品上下文）
  │
  ▼
【AI Client】→ 调用 DeepSeek API
  │
  ▼
【Streaming Handler】→ 解析 tool_calls
  │
  ├── content → 渲染到对话面板
  │
  └── tool_calls → 调用对应 Store Action
                    │
                    ▼
              【Store】→ 更新内存 + Dexie
                    │
                    ▼
              【画布组件】→ 自动重绘
```

### 4.3 错误处理流

```typescript
// ✅ 标准错误处理模式
async function safeOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    return await operation()
  } catch (err) {
    console.error(errorMessage, err)
    // 可选：写入错误日志到 Dexie
    await db.errors?.add({
      id: generateId('err'),
      message: errorMessage,
      detail: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    })
    return null
  }
}

// 使用示例
const result = await safeOperation(
  () => db.characters.add(newCharacter),
  '保存角色失败'
)
if (result) {
  // 成功后的 UI 反馈
}
```

---

## 五、数据模型规范

### 5.1 基础实体接口

```typescript
// 所有实体必须包含的字段
interface BaseEntity {
  id: string           // 全局唯一 ID
  workId: string       // 所属作品 ID
  createdAt: string    // ISO 8601 格式
  updatedAt: string    // ISO 8601 格式
}

// ID 生成规范
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// 使用示例
const characterId = generateId('char')   // char_1714812345678_abc123
const plotId = generateId('plot')        // plot_1714812345678_def456
```

### 5.2 数据一致性规则

| 规则 | 说明 |
|------|------|
| 单数据源 | 同一数据只在一个表中存储，禁止冗余（除非有性能需求并建立同步机制） |
| 级联删除 | 删除作品时，级联删除该作品下的所有角色、剧情、关系等 |
| 外键约束 | Dexie 不强制外键，需在应用层保证（如删除角色前检查是否有关系引用） |
| 更新时间 | 每次修改必须更新 `updatedAt` 字段 |

---

## 六、存储限额管理

### 6.1 监控机制

```typescript
// src/utils/storage-monitor.ts
export async function checkStorageQuota(): Promise<{
  usage: number
  quota: number
  percent: number
} | null> {
  if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
    return null
  }
  const { usage, quota } = await navigator.storage.estimate()
  if (!usage || !quota) return null

  const percent = Math.round((usage / quota) * 100)

  if (percent > 80) {
    console.warn(`[Storage] 使用量: ${percent}%，建议清理数据`)
  }

  return { usage, quota, percent }
}

// 定期监控（在 App 初始化时启动）
setInterval(() => {
  checkStorageQuota().then((quota) => {
    if (quota && quota.percent > 90) {
      // 触发全局警告
      useAppStore.getState().setStorageWarning(quota)
    }
  })
}, 5 * 60 * 1000) // 每 5 分钟检查一次
```

### 6.2 数据清理策略

| 数据类型 | 清理策略 |
|----------|----------|
| 已完成作品 | 导出后可选删除 |
| 已删除角色的图片 | 立即释放 ObjectURL |
| 对话历史 | 保留最近 100 条，或按时间清理 |
| 错误日志 | 保留最近 30 天 |

---

## 七、导入/导出规范

### 7.1 导出格式

```typescript
interface ExportData {
  version: number           // 数据格式版本
  exportedAt: string        // ISO 8601
  appVersion: string        // 应用版本
  works: Work[]
  characters: Character[]
  plotNodes: PlotNode[]
  relations: RelationEdge[]
  systems: WorkSystem[]
  ideas: Idea[]
}
```

### 7.2 导入校验

```typescript
async function importData(file: File): Promise<void> {
  const text = await file.text()
  const data: ExportData = JSON.parse(text)

  // 1. 版本校验
  if (!data.version || data.version < 1) {
    throw new Error('无效的数据文件：版本号缺失或过低')
  }

  // 2. 结构校验
  const required = ['works', 'characters', 'plotNodes', 'relations', 'systems', 'ideas']
  for (const key of required) {
    if (!Array.isArray(data[key as keyof ExportData])) {
      throw new Error(`数据文件缺少 ${key} 数组`)
    }
  }

  // 3. 导入（事务）
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
    await db.works.bulkAdd(data.works)
    await db.characters.bulkAdd(data.characters)
    await db.plotNodes.bulkAdd(data.plotNodes)
    await db.relations.bulkAdd(data.relations)
    await db.systems.bulkAdd(data.systems)
    await db.ideas.bulkAdd(data.ideas)
  })
}
```

---

> **维护者**: 吴奕大青 (Wydq)
> **关联文档**: `CODING-CONVENTIONS.md`, `architecture/ARCHITECTURE.md`
