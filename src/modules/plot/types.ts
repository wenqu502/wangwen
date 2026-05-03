export interface PlotFilter {
  status?: ('written' | 'writing' | 'todo' | 'abandoned')[]
  type?: ('trunk' | 'branch' | 'if' | 'foreshadowing')[]
  tags?: string[]
}

export interface PlotNodePosition {
  x: number
  y: number
}
