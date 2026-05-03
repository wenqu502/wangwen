# 剧情分支树模块 (Plot)

负责故事脉络的可视化管理。

## 核心能力

- AI 对话式生成剧情骨架
- AI 对话式修改节点（增删改）
- React Flow 可视化画布展示
- 伏笔自动识别与追踪
- 时间轴视图

## 数据模型

见 `types.ts` 中的 `PlotNode`、`Foreshadowing`、`Payoff`。

## AI 交互

用户描述故事梗概，AI 生成节点树 JSON，写入 store 后 React Flow 渲染。

## 文件说明

- `types.ts` — 类型定义
- `store.ts` — Zustand store
- `ai-prompts.ts` — AI 提示词模板
- `README.md` — 本文件
