import { useEffect, useState } from 'react'
import { loadAllDataByWorkId } from '@/db/operations'
import { useCharacterStore } from '@/modules/character/store'
import { usePlotStore } from '@/modules/plot/store'
import { useRelationStore } from '@/modules/relation/store'
import { useSystemStore } from '@/modules/system/store'
import { useIdeaStore } from '@/modules/idea/store'

/**
 * 应用初始化：从 Dexie 加载数据到各模块 Store (P1-004/P1-005)
 *
 * 数据流向：Dexie IndexedDB → Zustand Store → React UI
 * 优化：使用统一的事务加载函数，读写分离
 */
export function useInitData(workId: string | null) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!workId) {
      setIsReady(true)
      return
    }

    const currentWorkId = workId

    async function loadAll() {
      console.log('[Init] 开始加载数据，workId:', currentWorkId)

      const result = await loadAllDataByWorkId(currentWorkId)

      if (!result.success) {
        console.error('[Init] 数据加载失败:', result.error)
        setIsReady(true)
        return
      }

      const { characters, plotNodes, relations, systems, ideas } = result

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
      console.error('[Init] 数据加载异常:', err)
      setIsReady(true)
    })
  }, [workId])

  return isReady
}
