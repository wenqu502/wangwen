import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModuleTab } from '@/types'

interface AppState {
  currentWorkId: string | null
  currentTab: ModuleTab
  isChatPanelOpen: boolean
  isLoading: boolean
  messages: ChatMessage[]

  setCurrentWorkId: (id: string | null) => void
  setCurrentTab: (tab: ModuleTab) => void
  toggleChatPanel: () => void
  setIsLoading: (loading: boolean) => void
  addMessage: (msg: ChatMessage) => void
  updateMessage: (id: string, content: string) => void
  clearMessages: () => void
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentWorkId: null,
      currentTab: 'character',
      isChatPanelOpen: true,
      isLoading: false,
      messages: [],

      setCurrentWorkId: (id) => set({ currentWorkId: id }),
      setCurrentTab: (tab) => set({ currentTab: tab }),
      toggleChatPanel: () => set((s) => ({ isChatPanelOpen: !s.isChatPanelOpen })),
      setIsLoading: (loading) => set({ isLoading: loading }),
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      updateMessage: (id: string, content: string) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, content } : m)),
        })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'wangwen-app-store',
    }
  )
)
