import { z } from 'zod'

// === Character Schemas ===

export const PersonalitySchema = z.object({
  keywords: z.array(z.string()).default([]),
  surface: z.string().default(''),
  inner: z.string().default(''),
  stressResponse: z.string().default(''),
})

export const CreateCharacterSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  aliases: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  appearance: z.string().default(''),
  personality: PersonalitySchema.default({}),
  background: z.string().default(''),
  trauma: z.string().optional(),
  goals: z.string().optional(),
  arc: z.string().optional(),
  quotes: z.array(z.string()).default([]),
  abilities: z.array(z.string()).default([]),
})

export const UpdateCharacterSchema = z.object({
  characterId: z.string().min(1, '角色ID不能为空'),
  changes: z.record(z.unknown()).refine((v) => Object.keys(v).length > 0, '变更内容不能为空'),
})

// === Plot Schemas ===

export const CreatePlotNodeSchema = z.object({
  title: z.string().min(1, '节点标题不能为空'),
  summary: z.string().default(''),
  content: z.string().optional(),
  type: z.enum(['trunk', 'branch', 'if', 'foreshadowing']).default('branch'),
  characters: z.array(z.string()).default([]),
  location: z.string().optional(),
  tags: z.array(z.string()).default([]),
  parentIds: z.array(z.string()).default([]),
  condition: z.string().optional(),
})

// === Relation Schemas ===

export const CreateRelationSchema = z.object({
  sourceId: z.string().min(1, '源角色ID不能为空'),
  targetId: z.string().min(1, '目标角色ID不能为空'),
  type: z.string().min(1, '关系类型不能为空'),
  description: z.string().default(''),
  isHidden: z.boolean().default(false),
})

// === System Schemas ===

export const SystemLevelSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  abilities: z.array(z.string()).default([]),
  restrictions: z.array(z.string()).default([]),
})

export const SystemBranchSchema = z.object({
  name: z.string().min(1),
  levels: z.array(SystemLevelSchema).default([]),
})

export const SystemRuleSchema = z.object({
  description: z.string().min(1),
  severity: z.enum(['hard', 'soft']).default('soft'),
  exceptions: z.array(z.string()).default([]),
})

export const CreateSystemSchema = z.object({
  name: z.string().min(1, '体系名称不能为空'),
  description: z.string().default(''),
  branches: z.array(SystemBranchSchema).default([]),
  rules: z.array(SystemRuleSchema).default([]),
})

// === Idea Schemas ===

export const CreateIdeaSchema = z.object({
  content: z.string().min(1, '灵感内容不能为空'),
  tags: z.array(z.string()).default([]),
})

// === Tool Input Router ===

export function validateToolInput(
  toolName: string,
  args: Record<string, unknown>,
): { success: true; data: Record<string, unknown> } | { success: false; error: string } {
  try {
    let schema: z.ZodTypeType<Record<string, unknown>>

    switch (toolName) {
      case 'createCharacter':
        schema = CreateCharacterSchema
        break
      case 'updateCharacter':
        schema = UpdateCharacterSchema
        break
      case 'createPlotNode':
        schema = CreatePlotNodeSchema
        break
      case 'createRelation':
        schema = CreateRelationSchema
        break
      case 'createSystem':
        schema = CreateSystemSchema
        break
      case 'createIdea':
        schema = CreateIdeaSchema
        break
      default:
        return { success: true, data: args }
    }

    const result = schema.safeParse(args)
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
      return { success: false, error: `参数校验失败: ${issues}` }
    }

    return { success: true, data: result.data as Record<string, unknown> }
  } catch (err) {
    return { success: false, error: `校验异常: ${err instanceof Error ? err.message : '未知错误'}` }
  }
}
