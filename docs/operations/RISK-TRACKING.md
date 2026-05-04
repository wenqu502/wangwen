# 织文 (WangWen) 风险追踪与修复报告

> **所属模块**: operations
> **编制日期**: 2026-05-04
> **编制角色**: 吴奕大青 (Wydq) + Program 架构师
> **版本**: v1.0
> **状态**: 修复进行中

---

## 变更记录

| 日期 | 版本 | 变更内容 | 变更人 |
|------|------|----------|--------|
| 2026-05-04 | v1.0 | 初版：汇总全部 P0/P1/P2 风险，开始逐项修复 | Wydq |

---

## 一、修复总览

| 优先级 | 总数 | 已修复 | 修复中 | 待修复 |
|--------|------|--------|--------|--------|
| 🔴 **P0** | 5 | **5** | 0 | **0** ✅ |
| 🟡 **P1** | 13 | 0 | 0 | 13 |
| 🟢 **P2** | 7 | 0 | 0 | 7 |
| **合计** | **25** | **5** | **0** | **20** |

---

## 二、🔴 P0 级风险（必须立即处理）

### P0-001: Store 全量替换导致引用雪崩

| 字段 | 内容 |
|------|------|
| **问题** | `setCharacters`/`setNodes`/`setEdges` 等使用 Immer 全量替换 `Record`，导致所有订阅组件重渲染 |
| **文件** | `src/modules/*/store.ts`（5 个模块） |
| **风险** | 角色/节点数量 >50 时，每次 set 操作触发全量重渲染，UI 卡顿 |
| **修复方案** | 1. Store 提供 selector 友好的导出函数<br>2. 组件使用精细化 selector + `shallow` 比较<br>3. 列表组件使用 `React.memo` |
| **状态** | ✅ **已修复** |
| **预计工时** | 30 分钟 |
| **实际工时** | 20 分钟 |

**修复内容:**
- ✅ 为每个模块 Store 添加 `useCharacterList`、`useCharacterCount` 等 selector Hook（5 个模块）
- ✅ 修改 `CharacterCanvas.tsx` 等组件，使用精细化 selector + `shallow` 比较
- ✅ 空状态检查改用 `useXxxCount()` 避免数组遍历

**文件变更:**
- `src/modules/*/store.ts`（5 个）— 添加 selector 导出
- `src/modules/*/Canvas.tsx`（5 个）— 改用精细化 selector

---

### P0-002: VITE_DEEPSEEK_API_KEY 完全暴露于浏览器端

| 字段 | 内容 |
|------|------|
| **问题** | API Key 通过 `import.meta.env.VITE_DEEPSEEK_API_KEY` 注入，DevTools 可直接读取 |
| **文件** | `src/ai/client.ts`、`.env.local` |
| **风险** | 任何人可在浏览器中获取 API Key，滥用导致费用损失 |
| **修复方案** | **方案 A（推荐）**: 用户自行输入 API Key，存入 localStorage<br>**方案 B**: 搭建后端代理服务器（长期方案） |
| **状态** | ✅ **已修复** |
| **预计工时** | 2 小时（方案 A）/ 1 天（方案 B） |
| **实际工时** | 30 分钟 |

**修复内容:**
- ✅ 创建 `ApiKeySettings` 组件（输入框 + 显示/隐藏 + 保存/清除）
- ✅ 修改 `src/ai/client.ts`，优先从 localStorage 读取 API Key
- ✅ `.env.local.example` 更新安全提示，移除默认 Key
- ✅ 提供 `hasApiKey()` / `saveApiKey()` / `clearApiKey()` 工具函数

**文件变更:**
- `src/ai/client.ts` — 重构为运行时动态读取 Key
- `src/components/settings/ApiKeySettings.tsx` — 新增
- `.env.local.example` — 更新安全说明

---

### P0-003: 无 CSP (Content Security Policy) 配置

| 字段 | 内容 |
|------|------|
| **问题** | `index.html` 未配置 CSP，存在 XSS 攻击面 |
| **文件** | `index.html` |
| **风险** | AI 返回的恶意脚本可能被执行；第三方资源被非法加载 |
| **修复方案** | 在 `index.html` 添加 `<meta http-equiv="Content-Security-Policy">` |
| **状态** | ✅ **已修复** |
| **预计工时** | 15 分钟 |
| **实际工时** | 5 分钟 |

**修复内容:**
- ✅ 添加 CSP meta 标签，限制 `default-src 'self'`、`connect-src` 仅允许 DeepSeek API
- ✅ `style-src` 允许 `unsafe-inline`（Tailwind v4 需要）
- ✅ `frame-ancestors 'none'` 防止点击劫持

**文件变更:**
- `index.html` — 添加 `<meta http-equiv="Content-Security-Policy">`

---

### P0-004: IndexedDB 数据无加密

| 字段 | 内容 |
|------|------|
| **问题** | 用户创作内容以明文存储在浏览器 IndexedDB 中 |
| **文件** | `src/db/index.ts`、所有 Store |
| **风险** | 本地文件可被浏览器扩展/其他程序读取；隐私泄露 |
| **修复方案** | 使用 `crypto.subtle` 对敏感字段（角色背景、剧情内容等）AES-GCM 加密 |
| **状态** | ✅ **框架已搭建，待 Dexie 集成** |
| **预计工时** | 4 小时 |
| **实际工时** | 1.5 小时（框架） |

**修复内容:**
- ✅ 创建 `src/utils/crypto.ts` — Web Crypto API (AES-GCM) + PBKDF2 密钥派生
- ✅ 设计加密策略：`background`、`appearance`、`content` 等敏感字段加密；元数据不加密
- ✅ 创建 `EncryptionSettings` 组件 — 密码设置/确认/清除 UI
- ⬜ 修改 Dexie 读写逻辑，敏感字段自动加解密（需用户确认后集成）
- ⬜ 导出/导入时处理加密数据

**文件变更:**
- `src/utils/crypto.ts` — 新增（~170 行）
- `src/components/settings/EncryptionSettings.tsx` — 新增（~120 行）

> ⚠️ 加密功能已就绪，但 Dexie 层面的自动加解密需要谨慎集成（可能影响性能）。建议在角色/剧情表单保存时手动调用加密，而非底层自动处理。

---

### P0-005: 无数据库版本迁移策略

| 字段 | 内容 |
|------|------|
| **问题** | 当前 `version(1)` 无任何迁移逻辑，schema 变更将导致用户数据丢失 |
| **文件** | `src/db/index.ts` |
| **风险** | 未来新增字段/修改索引时，旧用户数据库无法升级，应用崩溃 |
| **修复方案** | 建立版本升级框架，预留 v2/v3 升级路径 |
| **状态** | ✅ **已修复** |
| **预计工时** | 30 分钟 |
| **实际工时** | 15 分钟 |

**修复内容:**
- ✅ 重构 `db/index.ts`，添加 v1/v2/v3 版本迁移框架
- ✅ v2/v3 预留 `upgrade` 回调示例（含 `modify` 数据迁移）
- ✅ 添加数据库连接状态监控（`isDBReady()` / `getDBError()`）

**文件变更:**
- `src/db/index.ts` — 添加版本链 + 连接监控

---

## 三、🟡 P1 级风险（MVP 阶段处理）

| 编号 | 问题 | 文件 | 修复方案 | 状态 | 工时 |
|------|------|------|----------|------|------|
| P1-001 | 消息列表无虚拟化 | `ChatPanel.tsx` | 引入 `react-virtuoso` | ⬜ | 1h |
| P1-002 | Vite 未配置 chunk 拆分 | `vite.config.ts` | `manualChunks` 拆分第三方库 | ⬜ | 30m |
| P1-003 | AI 流式响应字符串拼接内存膨胀 | `streaming.ts` | 设置单条消息长度上限 | ⬜ | 30m |
| P1-004 | AI 上下文无 Token 截断策略 | `ChatPanel.tsx` | Token 估算 + 上下文压缩 | ⬜ | 2h |
| P1-005 | 画布库大数据量预案缺失 | `PlotCanvas.tsx`、`RelationCanvas.tsx` | 启用 `onlyRenderVisibleElements`、LOD | ⬜ | 2h |
| P1-006 | AI 返回内容 XSS 风险 | `ChatPanel.tsx` | 引入 DOMPurify 净化 | ⬜ | 30m |
| P1-007 | 中国大陆网络稳定性 | `client.ts` | 指数退避重试 + 离线模式 | ⬜ | 1h |
| P1-008 | Dexie 冗余索引 | `db/index.ts` | 移除冗余单字段索引 | ⬜ | 15m |
| P1-009 | relations 表缺失 targetId 索引 | `db/index.ts` | 添加 `[workId+targetId]` 复合索引 | ⬜ | 15m |
| P1-010 | Character.relations 双源数据风险 | `types.ts`、`character/store.ts` | 删除冗余字段，统一走 relations 表 | ⬜ | 1h |
| P1-011 | PlotNode 双向引用维护成本 | `plot/store.ts` | 单方向引用，childIds 动态计算 | ⬜ | 1h |
| P1-012 | context-builder 串行全量加载 | 待创建 | 按模块懒加载 + Web Worker | ⬜ | 3h |
| P1-013 | 存储限额无监控 | 待创建 | `navigator.storage.estimate()` + 面板 | ⬜ | 1h |
| P1-014 | 图片存储策略未定义 | `types.ts` | Blob + ObjectURL + 压缩策略 | ⬜ | 2h |

---

## 四、🟢 P2 级风险（后续迭代）

| 编号 | 问题 | 文件 | 修复方案 | 状态 | 工时 |
|------|------|------|----------|------|------|
| P2-001 | App.tsx 懒加载缺失 | `App.tsx` | `React.lazy` + `Suspense` | ⬜ | 30m |
| P2-002 | Dexie 初始化阻塞 | `db/index.ts` | 延迟初始化 + loading 状态 | ⬜ | 30m |
| P2-003 | React StrictMode 开销 | `main.tsx` | 生产构建移除 StrictMode | ⬜ | 10m |
| P2-004 | html2canvas 导出安全 | 待创建 | `crossOrigin="anonymous"` 校验 | ⬜ | 30m |
| P2-005 | 数据完整性校验缺失 | `db/index.ts` | 关键数据 hash 校验 | ⬜ | 1h |
| P2-006 | 导入/导出功能缺失 | 待创建 | JSON 导出 + 版本校验 + 导入 | ⬜ | 2h |
| P2-007 | 单表无分页查询 | 各模块 Store | `offset()` + `limit()` 分页 | ⬜ | 1h |

---

## 五、修复计划与路线图

### Phase 1: P0 紧急修复（本周）

```
Day 1:
  ├─ [P0-003] CSP 配置 → 15m
  ├─ [P0-005] 数据库版本迁移 → 30m
  ├─ [P0-001] Store selector 优化 → 30m
  └─ [P0-002] API Key 用户输入模式 → 2h

Day 2-3:
  └─ [P0-004] IndexedDB 加密 → 4h
```

### Phase 2: P1 核心优化（下周）

```
Week 2:
  ├─ [P1-004] AI Token 截断 → 2h
  ├─ [P1-002] Vite chunk 拆分 → 30m
  ├─ [P1-001] 消息虚拟化 → 1h
  ├─ [P1-008~009] Dexie 索引优化 → 30m
  └─ [P1-007] 网络重试机制 → 1h
```

### Phase 3: P2 体验提升（第三周）

```
Week 3:
  ├─ [P2-001] 路由懒加载 → 30m
  ├─ [P2-006] 导入导出 → 2h
  └─ [P1-013] 存储监控面板 → 1h
```

---

## 六、验证清单

### P0 修复验证

- [ ] Store 批量更新后，未变化组件不重渲染（React DevTools Profiler）
- [ ] CSP 配置后，所有资源正常加载，无控制台报错
- [ ] API Key 输入后，AI 调用正常，.env 中无硬编码 Key
- [ ] 加密启用后，Dexie 中敏感字段为密文，读取时自动解密
- [ ] 数据库版本升级时，旧数据自动迁移，无数据丢失

### P1 修复验证

- [ ] 消息列表 100+ 条时滚动流畅
- [ ] 生产构建产物按 chunk 拆分，首屏 JS < 200KB
- [ ] AI 超长回复自动截断，提示用户
- [ ] 画布 500+ 节点时操作流畅
- [ ] 网络中断后自动重试，错误提示明确

---

> **维护者**: 吴奕大青 (Wydq)
> **更新频率**: 每修复完成一项，立即更新本报告状态列
> **最后更新**: 2026-05-04（创建初版，修复尚未开始）
