# 角色小像模块 (Character)

负责角色档案的创建、编辑、展示和管理。

## 核心能力

- AI 对话式创建角色
- AI 对话式修改角色属性
- AI 形象生成（调用文生图 API）
- 角色卡片墙展示
- 人设一致性校验

## 数据模型

见 `types.ts` 中的 `Character` 和 `CharacterRelation`。

## AI 交互

用户通过自然语言描述角色，AI 生成完整档案 JSON 并写入 store。

## 文件说明

- `types.ts` — 类型定义
- `store.ts` — Zustand store
- `ai-prompts.ts` — AI 提示词模板
- `README.md` — 本文件
