import { useEffect, useState } from 'react'
import { db } from '@/db'
import { useCharacterStore } from '@/modules/character/store'
import { usePlotStore } from '@/modules/plot/store'
import { useRelationStore } from '@/modules/relation/store'
import { useSystemStore } from '@/modules/system/store'
import { useIdeaStore } from '@/modules/idea/store'

/**
 * 应用初始化：从 Dexie 加载数据到各模块 Store
 *
 * 数据流向：Dexie IndexedDB → Zustand Store → React UI
 */
export function useInitData(workId: string | null) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!workId) {
      setIsReady(true)
      return
    }

    async function loadAll() {
      console.log('[Init] 开始加载数据，workId:', workId)

      const [
        characters,
        plotNodes,
        relations,
        systems,
        ideas,
      ] = await Promise.all([
        db.characters.where('workId').equals(workId).toArray(),
        db.plotNodes.where('workId').equals(workId).toArray(),
        db.relations.where('workId').equals(workId).toArray(),
        db.systems.where('workId').equals(workId).toArray(),
        db.ideas.where('workId').equals(workId).toArray(),
      ])

      useCharacterStore.getState().setCharacters(characters)
      usePlotStore.getState().setNodes(plotNodes)
      useRelationStore.getState().setEdges(relations)
      useSystemStore.getState().setSystems(systems)
      useIdeaStore.getState().setIdeas(ideas)

      console.log('[Init] 数据加载完成:', {
        characters: characters.length,
        plotNodes: plotNodes.length,
        relations: relations.length,
        systems: systems.length,
        ideas: ideas.length,
      })

      setIsReady(true)
    }

    loadAll().catch((err) => {
      console.error('[Init] 数据加载失败:', err)
      setIsReady(true)
    })
  }, [workId])

  return isReady
}
