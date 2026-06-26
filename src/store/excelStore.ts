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
  'qty_in_quality',
  'no_of_staggers',
  '1_stagger_qty',
  '1_stagger_start',
  '1_stagger_end',
  '2_stagger_qty',
  '2_stagger_start',
  '2_stagger_end',
  '3_stagger_qty',
  '3_stagger_start',
  '3_stagger_end',
] as const

export const STAGE_FIELDS: Record<number, string[]> = {
  1: ['so_no', 'doc_date', 'gemc_no', 'gemc_date'],
  2: [
    'qty',
    'qty_in_quality',
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
  4: ['open_qty', 'delivery_date', 'end_use', 'no_of_staggers'],
  5: [
    '1_stagger_qty',
    '1_stagger_start',
    '1_stagger_end',
    '2_stagger_qty',
    '2_stagger_start',
    '2_stagger_end',
    '3_stagger_qty',
    '3_stagger_start',
    '3_stagger_end',
  ],
}

export const TOTAL_STAGES = Object.keys(STAGE_FIELDS).length

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
  qty_in_quality: 'Qty in Quality',
  no_of_staggers: 'No of Staggers',
  '1_stagger_qty': '1st Stagger Qty',
  '1_stagger_start': '1st Stagger Start',
  '1_stagger_end': '1st Stagger End',
  '2_stagger_qty': '2nd Stagger Qty',
  '2_stagger_start': '2nd Stagger Start',
  '2_stagger_end': '2nd Stagger End',
  '3_stagger_qty': '3rd Stagger Qty',
  '3_stagger_start': '3rd Stagger Start',
  '3_stagger_end': '3rd Stagger End',
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
    const stages = [
      '1_stagger_qty',
      '1_stagger_start',
      '1_stagger_end',
      '2_stagger_qty',
      '2_stagger_start',
      '2_stagger_end',
      '3_stagger_qty',
      '3_stagger_start',
      '3_stagger_end',
    ]

    const staggers = parseInt(state.formData.no_of_staggers, 10) || 0

    const requiredFields = stages.slice(0, staggers * 3)

    if (requiredFields.length > 0) {
      const allFilled = requiredFields.every((f) => state.formData[f]?.trim())
      if (!allFilled) return false
    }

    set({
      rows: [...state.rows, { ...state.formData }],
      formData: emptyFormData(),
      currentStage: 1,
    })
    return true
  },
}))
