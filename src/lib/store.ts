import { create } from 'zustand'
import type { PageType, Language } from '@/lib/types'

interface AppState {
  currentPage: PageType
  language: Language
  sidebarOpen: boolean
  setCurrentPage: (page: PageType) => void
  setLanguage: (lang: Language) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  language: 'en',
  sidebarOpen: true,
  setCurrentPage: (page) => set({ currentPage: page }),
  setLanguage: (lang) => set({ language: lang }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
