import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/shallow'
import { useMemo } from 'react'
import type { Character } from '@/types'
import { db } from '@/db'

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
  immer((set) => ({
    characters: {},
    selectedId: null,

    setCharacters: (list) =>
      set((state) => {
        state.characters = {}
        for (const c of list) state.characters[c.id] = c
      }),

    addCharacter: (char) =>
      set((state) => {
        state.characters[char.id] = char
        db.characters.add(char).catch((err) => console.error('[DB] addCharacter failed:', err))
      }),

    updateCharacter: (id, updater) =>
      set((state) => {
        const c = state.characters[id]
        if (c) {
          updater(c)
          db.characters.put(c).catch((err) => console.error('[DB] updateCharacter failed:', err))
        }
      }),

    deleteCharacter: (id) =>
      set((state) => {
        delete state.characters[id]
        if (state.selectedId === id) state.selectedId = null
        db.characters.delete(id).catch((err) => console.error('[DB] deleteCharacter failed:', err))
      }),

    selectCharacter: (id) =>
      set((state) => {
        state.selectedId = id
      }),
  }))
)

// === Selector Hooks（性能优化：避免全量重渲染）===

/** 获取角色列表（数组形式） */
export function useCharacterList(): Character[] {
  const characters = useCharacterStore(useShallow((s) => s.characters))
  return useMemo(() => Object.values(characters), [characters])
}

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

