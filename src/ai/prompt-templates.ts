import type { PromptTemplate } from './types'

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'char-create',
    label: '创建角色',
    description: '从零开始创建一个完整的角色档案，包括外貌、性格、背景等',
    category: 'character',
    userPrompt: '帮我创建一个新角色，风格是{style}，要求如下：\n\n{requirements}',
  },
  {
    id: 'char-depth',
    label: '深化角色',
    description: '为已有角色补充细节，增强人物立体感',
    category: 'character',
    userPrompt: '请帮我深化角色「{characterName}」，补充以下方面：\n\n{requirements}',
  },
  {
    id: 'plot-trunk',
    label: '主线规划',
    description: '规划故事主线，设计起承转合',
    category: 'plot',
    userPrompt: '请帮我规划一段主线剧情，主题/方向是：\n\n{theme}',
  },
  {
    id: 'plot-branch',
    label: '分支剧情',
    description: '基于现有节点延伸分支剧情',
    category: 'plot',
    userPrompt: '基于当前剧情「{context}」，帮我延伸一段分支剧情：\n\n{theme}',
  },
  {
    id: 'plot-foreshadowing',
    label: '埋伏笔',
    description: '设计伏笔和后续回收方案',
    category: 'plot',
    userPrompt: '请为以下剧情设计伏笔和回收方案：\n\n{context}',
  },
  {
    id: 'rel-analyze',
    label: '关系分析',
    description: '分析角色间关系，提出关系网优化建议',
    category: 'relation',
    userPrompt: '请分析以下角色之间的关系，并给出优化建议：\n\n{characters}',
  },
  {
    id: 'rel-create',
    label: '建立关系',
    description: '为指定角色建立新的关系连线',
    category: 'relation',
    userPrompt: '请为角色「{sourceName}」和「{targetName}」建立一段关系：\n\n{type} - {description}',
  },
  {
    id: 'sys-create',
    label: '设计体系',
    description: '设计修炼体系、魔法体系或世界观规则',
    category: 'system',
    userPrompt: '请帮我设计一个{category}体系，要求如下：\n\n{requirements}',
  },
  {
    id: 'sys-extend',
    label: '扩展体系',
    description: '为已有体系补充新分支或等级',
    category: 'system',
    userPrompt: '请为现有体系「{systemName}」补充新内容：\n\n{requirements}',
  },
  {
    id: 'idea-polish',
    label: '润色灵感',
    description: '将一个粗糙的灵感点子扩展成完整的创作素材',
    category: 'idea',
    userPrompt: '请帮我把这个灵感点子扩展完善：\n\n{idea}',
  },
  {
    id: 'idea-conflict',
    label: '设计冲突',
    description: '基于现有素材设计戏剧冲突',
    category: 'idea',
    userPrompt: '请基于以下素材设计一段戏剧冲突：\n\n{context}',
  },
  {
    id: 'free-chat',
    label: '自由对话',
    description: '没有任何预设模板的自由创作对话',
    category: 'general',
    userPrompt: '{input}',
  },
]

export function getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter((t) => t.category === category)
}

export function getTemplateById(id: string): PromptTemplate | undefined {
  return PROMPT_TEMPLATES.find((t) => t.id === id)
}

/**
 * 填充模板变量，将 {key} 替换为实际值
 */
export function fillTemplate(template: PromptTemplate, variables: Record<string, string>): string {
  let filled = template.userPrompt
  for (const [key, value] of Object.entries(variables)) {
    filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }
  // 移除未填充的变量占位符
  filled = filled.replace(/\{[a-zA-Z0-9_-]+\}/g, '')
  return filled.trim()
}
