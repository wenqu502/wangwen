# 人物关系图模块 (Relation)

负责角色间关系的可视化网络管理。

## 核心能力

- AI 自动分析角色档案，推断关系网络
- G6 力导向图可视化
- AI 对话式修改关系
- 关系类型自定义
- 动态演变（按章节推进）

## 数据模型

见 `types.ts` 中的 `RelationEdge`。

## AI 交互

用户要求梳理关系，AI 读取角色档案生成关系数组。

## 文件说明

- `types.ts` — 类型定义
- `store.ts` — Zustand store
- `ai-prompts.ts` — AI 提示词模板
- `README.md` — 本文件
