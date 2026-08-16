export interface SaleItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export interface Sale {
  id: string
  invoiceNumber: string
  date: string
  clientName: string
  clientRfc?: string
  clientEmail?: string
  clientAddress?: string
  items: SaleItem[]
  subtotal: number
  tax: number
  taxRate: number
  total: number
  status: 'paid' | 'pending' | 'cancelled'
  notes?: string
  createdAt: string
}

export interface AppSettings {
  businessName: string
  businessRfc?: string
  businessAddress?: string
  businessEmail?: string
  businessPhone?: string
  taxRate: number
  currency: string
  invoicePrefix: string
  nextInvoiceNumber: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  businessName: 'Mi Empresa',
  taxRate: 16,
  currency: 'MXN',
  invoicePrefix: 'FAC-',
  nextInvoiceNumber: 1,
}
