/**
 * AI 智能功能层 (P2-001 ~ P2-003)
 * 提供最小可行实现框架，支持图片生成占位、伏笔检测、灵感分类
 */

import type { PlotNode, Character, Idea, WorkSystem } from '@/types'

// === P2-001: AI 图片生成占位符 ===

const IMAGE_PLACEHOLDERS = [
  'https://placehold.co/400x600/4756ff/ffffff?text=角色立绘',
  'https://placehold.co/400x600/15b25e/ffffff?text=角色立绘',
  'https://placehold.co/400x600/ff8c00/ffffff?text=角色立绘',
  'https://placehold.co/400x600/86909c/ffffff?text=角色立绘',
]

/** 生成角色图片（占位实现，后续接入真实 AI 绘图 API） */
export async function generateCharacterImage(_character: Character): Promise<string> {
  // 使用确定性哈希选取占位图，保证同一角色多次调用结果一致
  const seed = _character.name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return IMAGE_PLACEHOLDERS[seed % IMAGE_PLACEHOLDERS.length]
}

// === P2-002: 伏笔/规则检测框架 ===

export interface ForeshadowingIssue {
  type: 'unresolved_foreshadowing' | 'missing_setup' | 'orphan_payoff'
  nodeId: string
  title: string
  message: string
}

/** 检测剧情节点中的伏笔与回收问题 */
export function detectForeshadowingPayoff(nodes: PlotNode[]): ForeshadowingIssue[] {
  const issues: ForeshadowingIssue[] = []
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  for (const node of nodes) {
    // 检查伏笔是否有回收
    for (const fs of node.foreshadowing || []) {
      if (!fs.payoffNodeId || !nodeMap.has(fs.payoffNodeId)) {
        issues.push({
          type: 'unresolved_foreshadowing',
          nodeId: node.id,
          title: node.title,
          message: `伏笔「${fs.description.slice(0, 30)}...」尚未回收`,
        })
      }
    }

    // 检查回收是否有前置伏笔
    for (const po of node.payoff || []) {
      if (!po.foreshadowingNodeId || !nodeMap.has(po.foreshadowingNodeId)) {
        issues.push({
          type: 'missing_setup',
          nodeId: node.id,
          title: node.title,
          message: `回收「${po.description.slice(0, 30)}...」缺少前置伏笔`,
        })
      }
    }
  }

  return issues
}

// === P2-003: 灵感便签智能分类/关联 ===

const IDEA_TAG_KEYWORDS: Record<string, string[]> = {
  角色: ['角色', '人物', '主角', '配角', '反派', '性格', '外貌'],
  剧情: ['剧情', '情节', '故事', '冲突', '转折', '高潮', '结局'],
  世界观: ['世界', '设定', '体系', '规则', '魔法', '修炼', '科技'],
  关系: ['关系', '感情', '友情', '爱情', '亲情', '敌对', '联盟'],
  待处理: ['TODO', '待办', '稍后', '回头', '记得'],
}

/** 根据内容智能建议标签 */
export function suggestIdeaTags(content: string): string[] {
  const tags: string[] = []
  for (const [tag, keywords] of Object.entries(IDEA_TAG_KEYWORDS)) {
    if (keywords.some((kw) => content.includes(kw))) {
      tags.push(tag)
    }
  }
  return tags.length > 0 ? tags : ['未分类']
}

/** 根据内容相似度建议关联的剧情节点或角色 */
export function suggestIdeaLinks(
  idea: Idea,
  nodes: PlotNode[],
  characters: Character[],
): Array<{ type: 'node' | 'character'; id: string; name: string; reason: string }> {
  const suggestions: Array<{ type: 'node' | 'character'; id: string; name: string; reason: string }> = []
  const content = idea.content.toLowerCase()

  for (const node of nodes) {
    const score = [node.title, node.summary, node.content || '']
      .join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 2 && content.includes(w)).length

    if (score >= 2) {
      suggestions.push({
        type: 'node',
        id: node.id,
        name: node.title,
        reason: `内容关键词与节点「${node.title}」匹配`,
      })
    }
  }

  for (const char of characters) {
    const score = [char.name, char.background, char.appearance]
      .join(' ')
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 2 && content.includes(w)).length

    if (score >= 2) {
      suggestions.push({
        type: 'character',
        id: char.id,
        name: char.name,
        reason: `内容关键词与角色「${char.name}」匹配`,
      })
    }
  }

  return suggestions.slice(0, 3)
}

// === Batch5: 规则冲突检测框架 ===

export interface RuleConflict {
  type: 'duplicate' | 'contradiction' | 'orphan_hard_rule'
  systemId: string
  systemName: string
  ruleId: string
  message: string
}

/** 检测世界观体系中的规则冲突 */
export function detectRuleConflicts(systems: WorkSystem[]): RuleConflict[] {
  const conflicts: RuleConflict[] = []

  for (const system of systems) {
    const seen = new Set<string>()
    for (const rule of system.rules) {
      const normalized = rule.description.replace(/\s+/g, '').toLowerCase()

      // 重复规则检测
      if (seen.has(normalized)) {
        conflicts.push({
          type: 'duplicate',
          systemId: system.id,
          systemName: system.name,
          ruleId: rule.id,
          message: `规则「${rule.description.slice(0, 30)}...」与体系内其他规则重复`,
        })
      }
      seen.add(normalized)

      // 孤儿硬规则：无例外条款的 hard 规则
      if (rule.severity === 'hard' && rule.exceptions.length === 0) {
        conflicts.push({
          type: 'orphan_hard_rule',
          systemId: system.id,
          systemName: system.name,
          ruleId: rule.id,
          message: `硬规则「${rule.description.slice(0, 30)}...」未定义任何例外条款，可能导致剧情无法推进`,
        })
      }
    }
  }

  // 跨体系矛盾检测：简单关键词反义匹配
  const contradictionPairs = [
    { pos: ['可以', '允许', '能'], neg: ['禁止', '不能', '不可', '无法'] },
    { pos: ['必须', '一定', '只能'], neg: ['可选', '自由', '任意'] },
  ]
  for (let i = 0; i < systems.length; i++) {
    for (let j = i + 1; j < systems.length; j++) {
      const s1 = systems[i]
      const s2 = systems[j]
      for (const r1 of s1.rules) {
        for (const r2 of s2.rules) {
          for (const pair of contradictionPairs) {
            const r1HasPos = pair.pos.some((kw) => r1.description.includes(kw))
            const r2HasNeg = pair.neg.some((kw) => r2.description.includes(kw))
            if (r1HasPos && r2HasNeg && r1.description.length > 5 && r2.description.length > 5) {
              conflicts.push({
                type: 'contradiction',
                systemId: s1.id,
                systemName: s1.name,
                ruleId: r1.id,
                message: `「${s1.name}」的规则与「${s2.name}」的规则可能存在矛盾`,
              })
            }
          }
        }
      }
    }
  }

  return conflicts
}

// === Batch5: 人设一致性校验框架 ===

export interface CharacterInconsistency {
  characterId: string
  characterName: string
  type: 'status_vs_goals' | 'ability_vs_background' | 'empty_critical_field'
  message: string
}

/** 基础人设一致性校验（非 AI，基于规则） */
export function detectCharacterInconsistencies(characters: Character[]): CharacterInconsistency[] {
  const issues: CharacterInconsistency[] = []

  for (const char of characters) {
    // 死亡/失踪角色仍有未来目标
    if ((char.status === 'dead' || char.status === 'missing') && char.goals) {
      const futureKeywords = ['要', '想', '打算', '计划', '目标', '成为', '复仇', '拯救']
      if (futureKeywords.some((kw) => char.goals!.includes(kw))) {
        issues.push({
          characterId: char.id,
          characterName: char.name,
          type: 'status_vs_goals',
          message: `角色状态为「${char.status === 'dead' ? '死亡' : '失踪'}」，但目标描述包含未来意向：「${char.goals!.slice(0, 20)}...」`,
        })
      }
    }

    // 背景与能力冲突：背景说不会魔法，能力却有魔法
    const magicKeywords = ['魔法', '法术', '灵力', '异能', '超能力']
    const noMagicKeywords = ['不会', '无法', '没有', '普通人', '无能力']
    const hasMagicAbility = char.abilities.some((a) => magicKeywords.some((kw) => a.includes(kw)))
    const backgroundDeniesMagic = noMagicKeywords.some((kw) => char.background.includes(kw)) &&
      magicKeywords.some((kw) => char.background.includes(kw.replace('魔法', '').replace('法术', '')))
    if (hasMagicAbility && backgroundDeniesMagic) {
      issues.push({
        characterId: char.id,
        characterName: char.name,
        type: 'ability_vs_background',
        message: '背景描述暗示无特殊能力，但能力列表包含魔法/异能',
      })
    }

    // 关键字段缺失
    if (!char.appearance || !char.background || !char.personality.surface) {
      issues.push({
        characterId: char.id,
        characterName: char.name,
        type: 'empty_critical_field',
        message: '角色关键字段（外貌/背景/性格）未填写完整',
      })
    }
  }

  return issues
}
