import Dexie, { type Table } from 'dexie'
import type { Work, Character, PlotNode, RelationEdge, WorkSystem, Idea } from '@/types'

class WangWenDB extends Dexie {
  works!: Table Table<Work>
  characters!: Table Table<Character>
  plotNodes!: Table Table<PlotNode>
  relations!: Table Table<RelationEdge>
  systems!: Table Table<WorkSystem>
  ideas!: Table<Idea>

  constructor() {
    super('wangwen-db')
    this.version(1).stores({
      works: 'id, name, createdAt',
      characters: 'id, workId, name, [workId+name], createdAt',
      plotNodes: 'id, workId, [workId+status], createdAt',
      relations: 'id, workId, [workId+sourceId], createdAt',
      systems: 'id, workId, createdAt',
      ideas: 'id, workId, [workId+status], createdAt',
    })
  }
}

export const db = new WangWenDB()
