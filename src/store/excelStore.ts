import { create } from 'zustand'

interface ExcelStore {
  filePath: string | null
  headers: string[]
  rows: Record<string, string>[]
  deletedIndices: number[]

  setFilePath: (path: string | null) => void
  setExcelData: (headers: string[], rows: Record<string, string>[]) => void
  deleteRow: (index: number) => void
  restoreRow: (index: number) => void
  reset: () => void
}

export const useExcelStore = create<ExcelStore>((set) => ({
  filePath: null,
  headers: [],
  rows: [],
  deletedIndices: [],

  setFilePath: (path) => set({ filePath: path }),

  setExcelData: (headers, rows) =>
    set({ headers, rows, deletedIndices: [] }),

  deleteRow: (index) =>
    set((state) => ({
      deletedIndices: state.deletedIndices.includes(index)
        ? state.deletedIndices
        : [...state.deletedIndices, index],
    })),

  restoreRow: (index) =>
    set((state) => ({
      deletedIndices: state.deletedIndices.filter((i) => i !== index),
    })),

  reset: () =>
    set({
      filePath: null,
      headers: [],
      rows: [],
      deletedIndices: [],
    }),
}))
