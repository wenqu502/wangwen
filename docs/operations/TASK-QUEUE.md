# 96号项目 — Program Agent 协作任务队列

> **项目**: 小说网文作者Web (织文 WangWen)
> **协作模式**: 多 Agent 流水线
> **管理原则**: 每个任务完成后由 `program-system-architecture-expert` Review
> **更新时间**: 2026-05-04 17:00

---

## 🎯 执行阶段总览

| 阶段 | 任务数 | 状态 | 负责人 |
|------|--------|------|--------|
| **Phase 0: P0 紧急修复** | 5 | ✅ 已完成 | Wydq |
| **Phase 1: P1 风险修复** | 14 | 🟡 进行中 | `program-frontend-engineering-expert` |
| **Phase 2: 功能开发** | 6 | ⏳ 待启动 | `program-frontend-engineering-expert` |
| **Phase 3: 视觉与体验** | 3 | ⏳ 待启动 | `program-frontend-design-expert` |
| **Phase 4: 质量与测试** | 2 | ⏳ 待启动 | `program-quality-assurance-expert` |

---

## ✅ Phase 0: P0 紧急修复（已完成）

| # | 编号 | 任务 | 状态 | 完成时间 |
|---|------|------|------|----------|
| 1 | P0-001 | Store 全量替换 → 精细化 selector | ✅ 已 Review | 2026-05-04 |
| 2 | P0-002 | API Key 暴露 → localStorage 用户输入 | ✅ 已 Review | 2026-05-04 |
| 3 | P0-003 | CSP 安全策略配置 | ✅ 已 Review | 2026-05-04 |
| 4 | P0-004 | IndexedDB 加密框架 | ✅ 已 Review | 2026-05-04 |
| 5 | P0-005 | 数据库版本迁移策略 | ✅ 已 Review | 2026-05-04 |

---

## 🟡 Phase 1: P1 核心风险修复（14 项）

| # | 编号 | 任务 | 描述 | 优先级 | 状态 | 负责人 | Reviewer |
|---|------|------|------|--------|------|--------|----------|
| 1 | P1-001 | 组件懒加载 | 首页非首屏模块 React.lazy + Suspense | 🔴 高 | ✅ 已 Review 通过 | `frontend-engineering` | `architecture-expert` |
| 2 | P1-002 | Vite Chunk 拆分 | manualChunks 配置 | 🔴 高 | 🏃 执行中 | `frontend-engineering` | `architecture-expert` |
| 3 | P1-003 | useMemo/useCallback | 大型列表记忆化 | 🟡 中 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 4 | P1-004 | IndexedDB 分区 | 读写分离 | 🟡 中 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 5 | P1-005 | Dexie 事务优化 | 批量写入 + 错误处理 | 🟡 中 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 6 | P1-006 | XSS 输入净化 | DOMPurify 集成 | 🔴 高 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 7 | P1-007 | 错误边界 | ErrorBoundary | 🟡 中 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 8 | P1-008 | Dexie 索引优化 | 移除冗余索引 | 🟡 中 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 9 | P1-009 | 复合索引 | [workId+targetId] 等 | 🟡 中 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 10 | P1-010 | 路由配置 | 404 + 路由守卫 | 🟡 中 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 11 | P1-011 | StrictMode | 确认开启 | 🟢 低 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 12 | P1-012 | useId | 列表唯一键 | 🟢 低 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 13 | P1-013 | Suspense | 可视化库懒加载 | 🟡 中 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 14 | P1-014 | 环境变量 | 统一配置默认值 | 🟢 低 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |

---

## ⏳ Phase 2: 功能开发（6 项）

| # | 编号 | 任务 | 状态 | 负责人 | Reviewer |
|---|------|------|------|--------|----------|
| 1 | F-001 | 角色编辑表单 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 2 | F-002 | AI 流式输出完善 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 3 | F-003 | 剧情树 React Flow | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 4 | F-004 | 关系图 G6 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 5 | F-005 | 体系管理页面 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |
| 6 | F-006 | 灵感便签增强 | ⏳ 待开始 | `frontend-engineering` | `architecture-expert` |

---

## ⏳ Phase 3: 视觉与体验（3 项）

| # | 编号 | 任务 | 状态 | 负责人 | Reviewer |
|---|------|------|------|--------|----------|
| 1 | UI-001 | 角色卡片设计 | ⏳ 待开始 | `frontend-design` | `architecture-expert` |
| 2 | UI-002 | 暗黑模式 | ⏳ 待开始 | `frontend-design` | `architecture-expert` |
| 3 | UI-003 | 动画过渡 | ⏳ 待开始 | `frontend-design` | `architecture-expert` |

---

## ⏳ Phase 4: 质量与测试（2 项）

| # | 编号 | 任务 | 状态 | 负责人 | Reviewer |
|---|------|------|------|--------|----------|
| 1 | QA-001 | TypeScript 严格模式 | ⏳ 待开始 | `quality-assurance` | `architecture-expert` |
| 2 | QA-002 | E2E 测试框架 | ⏳ 待开始 | `quality-assurance` | `architecture-expert` |

---

## 🔄 执行规则

1. **顺序执行**: 按 Phase 0 → 1 → 2 → 3 → 4 推进
2. **Review 必须**: 每完成一个任务，spawn `program-system-architecture-expert` Review
3. **失败回滚**: Review 不通过需回滚重做
4. **文档同步**: 每完成一个任务，更新本文档状态

---

> **当前执行**: P1-001 组件懒加载 — 🏃 执行中
> **下次 Review**: P1-001 完成后

---

> **当前执行**: P1-001 已完成 → 🏃 架构师 Review 中
> **已完成时间**: 2026-05-04
> **编译状态**: tsc -b ✅ | build ✅
> **代码分割**: 5 个独立 chunk 已生成
