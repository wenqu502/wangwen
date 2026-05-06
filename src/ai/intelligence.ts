/**
 * AI 智能功能层 (P2-001 ~ P2-003)
 * 提供最小可行实现框架，支持图片生成占位、伏笔检测、灵感分类
 */

import type { PlotNode, Character, Idea } from '@/types'

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
