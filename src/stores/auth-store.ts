import { create } from 'zustand'

interface AuthState {
  token: string | null
  user: { id: number; username: string; email: string } | null
  isLoading: boolean

  setToken: (token: string | null) => void
  setUser: (user: AuthState['user']) => void
  setIsLoading: (loading: boolean) => void
  logout: () => void
  isAuthenticated: () => boolean
}

function getStoredToken(): string | null {
  return localStorage.getItem('wangwen_token')
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStoredToken(),
  user: null,
  isLoading: true,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('wangwen_token', token)
    } else {
      localStorage.removeItem('wangwen_token')
    }
    set({ token })
  },

  setUser: (user) => set({ user }),

  setIsLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    localStorage.removeItem('wangwen_token')
    set({ token: null, user: null })
    window.location.href = '/login'
  },

  isAuthenticated: () => !!get().token,
}))
