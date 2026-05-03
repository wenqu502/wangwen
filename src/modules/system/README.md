# 体系管理工具模块 (System)

负责作品中各类体系的抽象化设计。

## 核心能力

- AI 对话式创建通用体系（不限题材）
- 体系结构可视化（树形/阶梯）
- AI 规则冲突检测
- 修炼体系、货币体系、魔法体系等均可用

## 数据模型

见 `types.ts` 中的 `WorkSystem`、`SystemBranch`、`SystemLevel`、`SystemRule`。

## AI 交互

用户描述体系结构，AI 生成分支和层级 JSON。

## 文件说明

- `types.ts` — 类型定义
- `store.ts` — Zustand store
- `ai-prompts.ts` — AI 提示词模板
- `README.md` — 本文件
