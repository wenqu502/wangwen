import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/shallow'
import type { Character } from '@/types'
import { writeAddCharacter, writeUpdateCharacter, writeDeleteCharacter } from '@/db/operations'
import { useRelationStore } from '@/modules/relation/store'

interface CharacterState {
  characters: Record<string, Character>
  selectedId: string | null

  setCharacters: (list: Character[]) => void
  addCharacter: (char: Character) => void
  updateCharacter: (id: string, updater: (c: Character) => void) => void
  deleteCharacter: (id: string) => void
  selectCharacter: (id: string | null) => void
}

export const useCharacterStore = create<CharacterState>()(
  immer((set, get) => ({
    characters: {},
    selectedId: null,

    setCharacters: (list) =>
      set((state) => {
        state.characters = {}
        for (const c of list) state.characters[c.id] = c
      }),

    addCharacter: (char) => {
      set((state) => {
        state.characters[char.id] = char
      })
      writeAddCharacter(char).then((result) => {
        if (!result.success) {
          set((state) => {
            delete state.characters[char.id]
          })
          console.error('[Store] addCharacter rollback:', result.error)
        }
      })
    },

    updateCharacter: (id, updater) => {
      const previous = get().characters[id] ? structuredClone(get().characters[id]) : undefined
      set((state) => {
        const c = state.characters[id]
        if (c) updater(c)
      })
      const updated = get().characters[id]
      if (updated) {
        writeUpdateCharacter(updated).then((result) => {
          if (!result.success && previous) {
            set((state) => {
              state.characters[id] = previous
            })
            console.error('[Store] updateCharacter rollback:', result.error)
          }
        })
      }
    },

    deleteCharacter: (id) => {
      const previous = get().characters[id] ? structuredClone(get().characters[id]) : undefined
      const previousSelected = get().selectedId

      // P0-004: 级联删除关联的关系
      const relationStore = useRelationStore.getState()
      const relatedEdgeIds = Object.values(relationStore.edges)
        .filter((e) => e.sourceId === id || e.targetId === id)
        .map((e) => e.id)
      const previousEdges = relatedEdgeIds
        .map((eid) => ({ id: eid, edge: relationStore.edges[eid] ? structuredClone(relationStore.edges[eid]) : undefined }))
        .filter((item): item is { id: string; edge: NonNullableNullable<typeof item.edge> } => !!item.edge)

      // 先删除内存中的关系和角色
      relatedEdgeIds.forEach((eid) => {
        relationStore.deleteEdge(eid)
      })
      set((state) => {
        delete state.characters[id]
        if (state.selectedId === id) state.selectedId = null
      })

      writeDeleteCharacter(id).then((result) => {
        if (!result.success && previous) {
          // 恢复角色
          set((state) => {
            state.characters[id] = previous
            state.selectedId = previousSelected
          })
          // 恢复关系
          previousEdges.forEach(({ id: eid, edge }) => {
            relationStore.addEdge(edge)
          })
          console.error('[Store] deleteCharacter rollback:', result.error)
        }
      })
    },

    selectCharacter: (id) =>
      set((state) => {
        state.selectedId = id
      }),
  }))
)

// === Selector Hooks（性能优化：避免全量重渲染）===

/** 获取角色列表（数组形式） */
export const useCharacterList = () =>
  useCharacterStore(useShallow((s) => Object.values(s.characters)))

/** 获取角色数量 */
export function useCharacterCount(): number {
  return useCharacterStore((s) => Object.keys(s.characters).length)
}

/** 获取当前选中的角色 */
export function useSelectedCharacter(): Character | null {
  return useCharacterStore((s) =>
    s.selectedId ? s.characters[s.selectedId] : null
  )
}

/** 获取选中角色 ID */
export function useSelectedCharacterId(): string | null {
  return useCharacterStore((s) => s.selectedId)
}
