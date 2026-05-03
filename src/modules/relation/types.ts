export interface RelationFilter {
  types?: string[]
  showHidden?: boolean
}

export interface GraphLayoutConfig {
  type: 'force' | 'circular' | 'grid'
  center?: [number, number]
  preventOverlap?: boolean
}
