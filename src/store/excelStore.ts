import { create } from 'zustand'

const ALL_FIELDS = [
  'so_no',
  'doc_date',
  'gemc_no',
  'gemc_date',
  'qty',
  'supplier_name',
  'option_clause_ptc',
  'item_code',
  'sap_item_code',
  'item_name',
  'item_nomenclature',
  'p_number',
  'sap_order_no',
  'unit_rate',
  'total_cost',
  'psd',
  'unit_basic_price',
  'open_qty',
  'delivery_date',
  'end_use',
] as const

export const STAGE_FIELDS: Record<number, string[]> = {
  1: ['so_no', 'doc_date', 'gemc_no', 'gemc_date'],
  2: [
    'qty',
    'supplier_name',
    'item_name',
    'option_clause_ptc',
    'item_nomenclature',
    'p_number',
    'sap_order_no',
    'item_code',
    'sap_item_code',
  ],
  3: ['unit_rate', 'total_cost', 'psd', 'unit_basic_price'],
  4: ['open_qty', 'delivery_date', 'end_use'],
}

export const FIELD_LABELS: Record<string, string> = {
  so_no: 'S.O No',
  doc_date: 'Document Date',
  gemc_no: 'GEMC Contract No',
  gemc_date: 'GEMC Contract Date',
  qty: 'Total Quantity',
  supplier_name: 'Supplier Name',
  item_name: 'Item Name',
  option_clause_ptc: 'Option Clause Percent',
  item_nomenclature: 'Item Nomenclature',
  p_number: 'P Number',
  sap_order_no: 'SAP Order No',
  item_code: 'Item Code',
  sap_item_code: 'SAP Item Code',
  unit_rate: 'Unit Rate',
  total_cost: 'Total Cost',
  psd: 'PSD',
  unit_basic_price: 'Unit Basic Price',
  open_qty: 'Open Quantity',
  delivery_date: 'Delivery Date',
  end_use: 'End Use',
}

function emptyFormData(): Record<string, string> {
  const data: Record<string, string> = {}
  for (const field of ALL_FIELDS) {
    data[field] = ''
  }
  return data
}

interface ExcelStore {
  filePath: string | null
  headers: string[]
  rows: Record<string, string>[]
  deletedIndices: number[]
  currentStage: number
  formData: Record<string, string>

  setFilePath: (path: string | null) => void
  setExcelData: (headers: string[], rows: Record<string, string>[]) => void
  deleteRow: (index: number) => void
  restoreRow: (index: number) => void
  reset: () => void

  setFormField: (field: string, value: string) => void
  nextStage: () => boolean
  prevStage: () => void
  submitForm: () => boolean
}

export const useExcelStore = create<ExcelStore>((set, get) => ({
  filePath: null,
  headers: [],
  rows: [],
  deletedIndices: [],
  currentStage: 1,
  formData: emptyFormData(),

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

  setFormField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    })),

  nextStage: () => {
    const state = get()
    const fields = STAGE_FIELDS[state.currentStage]
    const allFilled = fields.every((f) => state.formData[f]?.trim())
    if (!allFilled) return false

    set({ currentStage: state.currentStage + 1 })
    return true
  },

  prevStage: () =>
    set((state) => ({
      currentStage: Math.max(1, state.currentStage - 1),
    })),

  submitForm: () => {
    const state = get()
    const fields = STAGE_FIELDS[4]
    const allFilled = fields.every((f) => state.formData[f]?.trim())
    if (!allFilled) return false

    set({
      rows: [...state.rows, { ...state.formData }],
      formData: emptyFormData(),
      currentStage: 1,
    })
    return true
  },
}))
