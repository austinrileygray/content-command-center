import { create } from "zustand"

interface AppState {
  searchQuery: string
  selectedStatus: string | null
  selectedFormat: string | null
  setSearchQuery: (query: string) => void
  setSelectedStatus: (status: string | null) => void
  setSelectedFormat: (format: string | null) => void
  resetFilters: () => void
}

export const useAppStore = create<AppState>((set) => ({
  searchQuery: "",
  selectedStatus: null,
  selectedFormat: null,
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setSelectedFormat: (format) => set({ selectedFormat: format }),
  resetFilters: () =>
    set({
      searchQuery: "",
      selectedStatus: null,
      selectedFormat: null,
    }),
}))


