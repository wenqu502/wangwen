export interface Work {
  id: string
  name: string
  genre?: string
  description?: string
  totalChapters?: number
  createdAt: string
  updatedAt: string
}

export interface Character {
  id: string
  workId: string
  name: string
  aliases: string[]
  tags: string[]
  appearance: string
  personality: {
    keywords: string[]
    surface: string
    inner: string
    stressResponse: string
  }
  background: string
  trauma?: string
  goals?: string
  arc?: string
  quotes: string[]
  abilities: string[]
  relations: CharacterRelation[]
  firstAppearance?: string
  status: 'alive' | 'dead' | 'missing' | 'sealed'
  images: string[]
  createdAt: string
  updatedAt: string
}

export interface CharacterRelation {
  targetId: string
  targetName?: string
  type: string
  description: string
  isHidden: boolean
}

export interface PlotNode {
  id: string
  workId: string
  title: string
  summary: string
  content?: string
  type: 'trunk' | 'branch' | 'if' | 'foreshadowing'
  status: 'written' | 'writing' | 'todo' | 'abandoned'
  characters: string[]
  location?: string
  tags: string[]
  parentIds: string[]
  childIds: string[]
  condition?: string
  foreshadowing: Foreshadowing[]
  payoff: Payoff[]
  wordCountTarget?: number
  wordCountActual?: number
  createdAt: string
  updatedAt: string
}

export interface Foreshadowing {
  id: string
  description: string
  status: 'unresolved' | 'resolved'
}

export interface Payoff {
  id: string
  description: string
  linkedForeshadowing?: string
}

export interface RelationEdge {
  id: string
  workId: string
  sourceId: string
  targetId: string
  type: string
  description: string
  isHidden: boolean
  createdAt: string
}

export interface SystemBranch {
  id: string
  name: string
  levels: SystemLevel[]
}

export interface SystemLevel {
  rank: number
  name: string
  description: string
  promotionCondition?: string
  abilities: string[]
  restrictions: string[]
}

export interface WorkSystem {
  id: string
  workId: string
  name: string
  description: string
  branches: SystemBranch[]
  rules: SystemRule[]
  createdAt: string
  updatedAt: string
}

export interface SystemRule {
  id: string
  description: string
  severity: 'hard' | 'soft'
  exceptions: string[]
}

export interface Idea {
  id: string
  workId: string
  content: string
  tags: string[]
  status: 'pending' | 'archived'
  linkedEntity?: {
    type: 'node' | 'character' | 'system'
    id: string
  }
  createdAt: string
}

export type ModuleTab = 'character' | 'plot' | 'relation' | 'system' | 'idea' | 'report'
