# 织文 (WangWen) 缺陷汇总报告

> **编制日期**: 2026-05-06
> **检查人**: program-system-architecture-expert + program-qa-engineer
> **范围**: PRD v3.0 P0 功能、架构安全、数据一致性、测试覆盖
> **状态**: 待修复

---

## 一、P0 级缺陷（架构/数据层断裂）

### P0-001: AI 上下文组装器未接入调用链
- **位置**: `src/ai/client.ts:136-138`
- **问题**: `buildSystemPrompt()` 硬编码 `"当前暂无作品上下文"`，`context-builder.ts` 已完整实现但未被调用
- **影响**: AI 完全无法感知作品数据，function calling 上下文空洞
- **修复**: 将 `buildSystemPrompt` 改为 async，调用 `buildWorkContext(currentWorkId)` 注入真实上下文

### P0-002: 对话历史持久化双轨制
- **位置**: `src/stores/app-store.ts` vs `src/db/operations.ts`
- **问题**: DB 层已实现 `conversations` 表和读写操作，但 UI 仍用 localStorage 存 messages
- **影响**: 数据分裂、localStorage 容量受限(5-10MB)、清缓存即丢失
- **修复**: ChatPanel 改为从 IndexedDB 加载/保存对话，app-store 移除 messages 持久化

### P0-003: Store → DB 写入无事务回滚
- **位置**: 所有模块 `store.ts`（character/plot/relation/system/idea）
- **问题**: Zustand 先更新内存，Dexie 异步 fire-and-forget。DB 失败时内存已污染
- **影响**: 用户感知"成功"但刷新后数据丢失
- **修复**: 改为"先写 DB，成功后写 Store"，失败时乐观回滚 + Toast 提示

### P0-004: deleteCharacter 未级联删除 relations
- **位置**: `src/modules/character/store.ts:44`
- **问题**: 删除角色后 `relations` 表残留孤儿数据
- **影响**: 关系图可能崩溃或显示错误
- **修复**: deleteCharacter 时级联删除该角色参与的所有关系（sourceId 或 targetId 匹配）

### P0-005: deletePlotNode 仅删节点，未级联清理 parentIds/childIds
- **位置**: `src/modules/plot/store.ts:48`
- **问题**: 内存中已清理，但 DB 中其他节点仍引用已删除节点 ID
- **影响**: 画布渲染异常
- **修复**: DB 写入时同步清理其他节点的 parentIds/childIds

### P0-006: useInitData 遗漏 events/eventEdges
- **位置**: `src/hooks/use-init-data.ts:37`
- **问题**: DB v5 新增 events/eventEdges 表，但初始化不加载
- **影响**: 事件图谱数据就绪但数据流断裂
- **修复**: useInitData 加载 events/eventEdges，event store 提供 setEvents/setEventEdges

### P0-007: CSP 策略过宽
- **位置**: `index.html`
- **问题**: `script-src 'self' 'unsafe-inline'` 削弱 XSS 防护
- **影响**: 内联 script 注入仍可执行
- **修复**: 移除 `script-src` 的 `'unsafe-inline'`，改用 nonce；`style-src` 保留监控

---

## 二、P1 级缺陷（安全/健壮性）

### P1-001: API Key 暴露面未完全消除
- **位置**: `src/config/env.ts`, `src/ai/client.ts`
- **问题**: `VITE_AI_API_KEY` 可能被打包进 JS；`dangerouslyAllowBrowser: true`
- **修复**: 生产构建时 env key 为空；UI 强制输入；长期需代理服务器

### P1-002: IndexedDB 敏感数据无加密
- **位置**: 全代码库
- **问题**: `FEATURE_FLAGS.encryption` 为 true 但无实现
- **修复**: `crypto.subtle` AES-GCM 加密敏感字段，密钥由用户密码 PBKDF2 派生

### P1-003: AI 流式处理缺乏容错
- **位置**: `src/ai/streaming.ts`
- **问题**: 无 timeout、无重试、`safeParseJSON` 静默失败、toolCallMap key 风险
- **修复**: AbortController 30s 超时、safeParseJSON 返回错误标记、index 维度兜底

### P1-004: 消息上下文按条数截断
- **位置**: `src/components/chat/ChatPanel.tsx:102`
- **问题**: `messages.slice(-10)`，PRD 要求 20 轮，且无 Token 估算
- **修复**: 按 Token 数截断（中文 ~1.5 token/字），早期消息摘要压缩

### P1-005: Character.relations 双源数据风险
- **位置**: `src/types/index.ts:30`
- **问题**: `Character` 有内联 relations，AI 创建关系只写 `relations` 表
- **修复**: 删除 `Character.relations`，统一以 `RelationEdge` 为唯一数据源

### P1-006: 剧情节点拖拽位置不持久化
- **位置**: `src/modules/plot/PlotCanvas.tsx:206`
- **问题**: `onNodeDragStop` 仅 console.log，未保存位置
- **修复**: PlotNode 添加 position 字段，拖拽后持久化到 Dexie

### P1-007: App.tsx handleExport 错误无用户提示
- **位置**: `src/App.tsx:156`
- **问题**: 导出失败仅 console.error
- **修复**: 添加 Toast 错误提示

### P1-008: messages 数组无上限
- **位置**: `src/stores/app-store.ts`
- **问题**: localStorage 可能溢出
- **修复**: 限制最大消息数或迁移到 IndexedDB

---

## 三、功能未实现（对照 PRD P0）

| 功能 | 状态 | 说明 |
|------|------|------|
| AI 形象生成 | ❌ | `CharacterCanvas.tsx:235` alert 占位 |
| 人设一致性校验（AI 驱动） | ❌ | ReportCanvas 仅字段空值检查 |
| 伏笔追踪 | ❌ | `foreshadowing`/`payoff` 类型存在但无逻辑 |
| 规则冲突检测 | ❌ | 未实现 |
| 事件图谱模块 | ❌ | DB 就绪但无 UI（ModuleTab 有 `'event'`） |
| 数据导入 | ❌ | 只有 `exportWork` |
| 多作品切换 | ❌ | 顶部按钮纯占位 |

---

## 四、数据一致性审计

| 操作 | 内存级联 | DB 级联 | 结论 |
|------|----------|---------|------|
| 删除角色 | ❌ | ❌ | **不一致** |
| 删除剧情节点 | ✅ | ❌ | **不一致** |
| 删除关系 | ✅ | ✅ | ✅ |
| 删除体系 | ✅ | ✅ | ✅ |
| 删除灵感 | ✅ | ✅ | ✅ |
| 删除事件 | — | ✅ 级联删边 | — |

---

## 五、测试缺口

- 单元测试完全缺失（Store、tool-executor、utils）
- 数据持久化测试缺失（刷新后数据保留）
- Mock/Real 模式切换测试缺失
- 大数据量性能测试缺失（PRD 要求 50 节点流畅）
- 暗色模式测试缺失
- 键盘快捷键测试缺失

---

## 六、修复计划

| 批次 | 内容 | 预估 |
|------|------|------|
| Batch 1 | 核心架构修复（上下文组装器、对话持久化、写入回滚、CSP） | — |
| Batch 2 | 数据一致性修复（级联删除、事件加载、双源数据清理） | — |
| Batch 3 | 安全加固（API Key 策略、IndexedDB 加密、XSS） | — |
| Batch 4 | AI 层健壮性（流式容错、Token 截断、超时重试） | — |
| Batch 5 | 功能补齐（形象生成占位、伏笔/规则检测框架） | — |
| Batch 6 | 事件图谱模块（EventCanvas + Store + Tab 入口） | — |
| Batch 7 | 数据导入 + 多作品切换 | — |
| Batch 8 | 全量回归测试 + 攻防检查 | — |
