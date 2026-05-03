# 织文 (WangWen) — Agent 工作流指南

## 如果你是 AI Agent

你的任务是协助人类伙伴完成网文创作辅助工具的开发。请先阅读 `CLAUDE.md` 了解项目规范。

## 工作流

### 1. 理解需求

- 阅读 `docs/` 目录下的 PRD 文档
- 确认当前开发阶段（骨架 / 模块 / 校验 / 导出）
- 不清楚的地方先询问人类伙伴，不要猜测

### 2. 设计

- 每个功能改动先考虑「AI 对话交互路径」
- 可视化组件只作为展示和微调容器
- 数据流向：用户输入 → AI 处理 → JSON 数据 → Zustand Store → React 渲染

### 3. 编码

- 按模块开发，每个模块独立提交
- 类型定义先行（`types.ts`）
- Store 逻辑次之（`store.ts`）
- UI 组件最后
- AI 提示词（`ai-prompts.ts`）同步编写

### 4. 验证

- 本地运行 `pnpm dev` 验证
- 检查 TypeScript 类型（`tsc --noEmit`）
- 检查代码风格（`pnpm lint`）
- 功能走通后再提交

### 5. 提交

- 使用 Conventional Commits 格式
- 一次提交解决一个问题
- 提交信息说明「为什么」而不仅是「做了什么」

## 模块结构模板

每个功能模块应遵循以下结构：

```
src/modules/<module-name>/
├── types.ts           # 类型定义
├── store.ts           # Zustand store
├── ai-prompts.ts      # AI 提示词模板
├── README.md          # 模块说明
└── <Component>.tsx    # UI 组件
```

## 常见问题

**Q: AI 对话助手如何与可视化组件对接？**
A: AI 通过 Function Calling 调用模块的生成函数，返回 JSON 数据写入 Zustand Store，React 自动重绘画布。AI 不直接操作 DOM。

**Q: 如何处理 AI 生成失败或超时？**
A: 所有 AI 调用都要有 loading 状态和 error 处理。失败后允许用户重试或切换到手动模式。

**Q: 上下文太长怎么办？**
A: 使用摘要压缩策略，保留关键角色/节点信息，舍弃已完成章节的详细内容。
