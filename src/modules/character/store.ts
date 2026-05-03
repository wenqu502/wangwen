import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Character } from '@/types'

interface CharacterState {
  characters: Record<string, Character>
  selectedId: string | null

  setCharacters: (list: Character[]) => void
  addCharacter: (char: Character) => void
  updateCharacter: (id: string, updater: (c: Character) => void) => void
  deleteCharacter: (id: string) => void
  selectCharacter: (id: string | null) => void
}

export const useCharacterStore = create create<CharacterState>()(
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
      }),

    updateCharacter: (id, updater) =>
      set((state) => {
        const c = state.characters[id]
        if (c) updater(c)
      }),

    deleteCharacter: (id) =>
      set((state) => {
        delete state.characters[id]
        if (state.selectedId === id) state.selectedId = null
      }),

    selectCharacter: (id) =>
      set((state) => {
        state.selectedId = id
      }),
  }))
)
