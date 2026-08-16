import { useState, useRef } from 'react'
import { SignedIn, SignedOut, SignIn, useUser, UserButton } from '@clerk/clerk-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts'
import { exportInvoicePdf, exportInvoicePng, generateInvoiceHTML } from './invoicePdf'
import { format, startOfMonth, subMonths, isWithinInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { AppSettings, DEFAULT_SETTINGS } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Sale {
  id: string
  invoiceNumber: string
  date: string
  clientName: string
  service: string
  quantity: number
  unitPrice: number
  subtotal: number
  tax: number
  taxRate: number
  total: number
  status: 'paid' | 'pending' | 'cancelled'
  notes?: string
  createdAt: string
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
function loadSales(): Sale[] {
  try { return JSON.parse(localStorage.getItem('ventas_sales') ?? '[]') } catch { return [] }
}
function saveSales(s: Sale[]) { localStorage.setItem('ventas_sales', JSON.stringify(s)) }
function loadSettings(): AppSettings {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('ventas_settings') ?? '{}') } }
  catch { return DEFAULT_SETTINGS }
}
function saveSettings(s: AppSettings) { localStorage.setItem('ventas_settings', JSON.stringify(s)) }

// ─── Icons ────────────────────────────────────────────────────────────────────
function Ico({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}
const IC = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  sales: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  add: 'M12 5v14M5 12h14',
  trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  close: 'M18 6 6 18M6 6l12 12',
  export: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  import: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  pdf: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  img: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  trend: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  money: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  search: 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10) }
function fmt(n: number, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(n)
}

const SERVICES = [
  'Servicio informático', 'Soporte técnico', 'Desarrollo web', 'Diseño gráfico',
  'Consultoría', 'Reparación de equipo', 'Instalación de red', 'Mantenimiento',
  'Capacitación', 'Otro (escribir)',
]

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ status }: { status: Sale['status'] }) {
  const m = { paid: 'text-emerald-400 bg-emerald-400/10', pending: 'text-yellow-400 bg-yellow-400/10', cancelled: 'text-red-400 bg-red-400/10' }
  const l = { paid: 'Pagada', pending: 'Pendiente', cancelled: 'Cancelada' }
  return <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${m[status]}`}>{l[status]}</span>
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="text-base font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Ico d={IC.close} size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{label}</label>
      {children}
    </div>
  )
}
const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 border transition-all"
const inputStyle = { background: 'rgba(255,255,255,0.04)', borderColor: 'var(--border)', color: 'var(--foreground)' } as React.CSSProperties

// ─── Sale Form ────────────────────────────────────────────────────────────────
function SaleForm({ initial, settings, onSave, onCancel }: {
  initial?: Sale; settings: AppSettings
  onSave: (s: Sale) => void; onCancel: () => void
}) {
  const [clientName, setClientName] = useState(initial?.clientName ?? '')
  const [service, setService] = useState(initial?.service ?? '')
  const [showCustom, setShowCustom] = useState(false)
  const [customService, setCustomService] = useState('')
  const [qty, setQty] = useState(initial?.quantity ?? 1)
  const [price, setPrice] = useState(initial?.unitPrice ?? 0)
  const [date, setDate] = useState(initial?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [status, setStatus] = useState<Sale['status']>(initial?.status ?? 'paid')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const subtotal = qty * price
  const tax = subtotal * (settings.taxRate / 100)
  const total = subtotal + tax

  function handleServiceChange(val: string) {
    if (val === 'Otro (escribir)') { setShowCustom(true); setService('') }
    else { setShowCustom(false); setService(val) }
  }

  function handleSave() {
    const desc = showCustom ? customService : service
    if (!clientName.trim()) return alert('Ingresa el nombre del cliente')
    if (!desc.trim()) return alert('Selecciona o escribe un servicio')
    if (price <= 0) return alert('Ingresa un precio válido')
    const now = new Date().toISOString()
    onSave({
      id: initial?.id ?? uid(),
      invoiceNumber: initial?.invoiceNumber ?? `${settings.invoicePrefix}${String(settings.nextInvoiceNumber).padStart(4, '0')}`,
      date, clientName, service: desc, quantity: qty, unitPrice: price,
      subtotal, tax, taxRate: settings.taxRate, total,
      status, notes: notes || undefined,
      createdAt: initial?.createdAt ?? now,
    })
  }

  return (
    <div className="space-y-4">
      <Field label="Cliente">
        <input className={inputCls} style={inputStyle} value={clientName}
          onChange={(e) => setClientName(e.target.value)} placeholder="Nombre o empresa" />
      </Field>
      <Field label="Servicio / Producto">
        <select className={inputCls} style={{ ...inputStyle, background: 'var(--secondary)' }}
          value={showCustom ? 'Otro (escribir)' : service} onChange={(e) => handleServiceChange(e.target.value)}>
          <option value="">— Seleccionar —</option>
          {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {showCustom && (
          <input className={inputCls} style={inputStyle} value={customService}
            onChange={(e) => setCustomService(e.target.value)} placeholder="Escribe el servicio..." autoFocus />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cantidad">
          <input type="number" className={inputCls} style={inputStyle} value={qty}
            onChange={(e) => setQty(Number(e.target.value))} min={1} />
        </Field>
        <Field label={`Precio (${settings.currency})`}>
          <input type="number" className={inputCls} style={inputStyle} value={price}
            onChange={(e) => setPrice(Number(e.target.value))} min={0} step={0.01} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha">
          <input type="date" className={inputCls} style={inputStyle} value={date}
            onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Estado">
          <select className={inputCls} style={{ ...inputStyle, background: 'var(--secondary)' }}
            value={status} onChange={(e) => setStatus(e.target.value as Sale['status'])}>
            <option value="paid">Pagada</option>
            <option value="pending">Pendiente</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </Field>
      </div>
      <Field label="Notas (opcional)">
        <textarea className={inputCls} style={inputStyle} value={notes}
          onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observaciones..." />
      </Field>
      <div className="rounded-xl p-4 space-y-1.5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'var(--border)' }}>
        <div className="flex justify-between text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <span>Subtotal</span><span>{fmt(subtotal, settings.currency)}</span>
        </div>
        <div className="flex justify-between text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <span>IVA {settings.taxRate}%</span><span>{fmt(tax, settings.currency)}</span>
        </div>
        <div className="flex justify-between font-bold pt-1.5 border-t" style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
          <span>Total</span><span className="text-lg">{fmt(total, settings.currency)}</span>
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border hover:bg-white/5 transition-all"
          style={{ borderColor: 'var(--border)' }}>Cancelar</button>
        <button onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          {initial ? 'Guardar' : 'Registrar venta'}
        </button>
      </div>
    </div>
  )
}

// ─── Invoice Modal ────────────────────────────────────────────────────────────
function InvoiceModal({ sale, settings, onClose }: { sale: Sale; settings: AppSettings; onClose: () => void }) {
  const [exporting, setExporting] = useState<'pdf' | 'png' | null>(null)

  const saleForInvoice = {
    ...sale,
    items: [{ id: '1', description: sale.service, quantity: sale.quantity, unitPrice: sale.unitPrice }],
  }

  async function doExport(type: 'pdf' | 'png') {
    setExporting(type)
    try {
      const container = document.createElement('div')
      container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1'
      container.innerHTML = generateInvoiceHTML(saleForInvoice, settings)
      document.body.appendChild(container)
      await new Promise((r) => setTimeout(r, 200))
      if (type === 'pdf') await exportInvoicePdf('invoice-render', sale.invoiceNumber)
      else await exportInvoicePng('invoice-render', sale.invoiceNumber)
      document.body.removeChild(container)
    } catch (e) { console.error(e) }
    setExporting(null)
  }

  return (
    <Modal title={`Factura ${sale.invoiceNumber}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <button onClick={() => doExport('pdf')} disabled={!!exporting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
            <Ico d={IC.pdf} size={16} />{exporting === 'pdf' ? 'Generando...' : 'PDF'}
          </button>
          <button onClick={() => doExport('png')} disabled={!!exporting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: 'rgba(34,211,238,0.15)', color: 'var(--accent)' }}>
            <Ico d={IC.img} size={16} />{exporting === 'png' ? 'Generando...' : 'PNG'}
          </button>
        </div>
        <div className="rounded-xl overflow-hidden border text-xs" style={{ borderColor: 'var(--border)' }}
          dangerouslySetInnerHTML={{ __html: generateInvoiceHTML(saleForInvoice, settings) }} />
      </div>
    </Modal>
  )
}

// ─── Dashboard Charts ─────────────────────────────────────────────────────────
function DashboardView({ sales, settings }: { sales: Sale[]; settings: AppSettings }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i)
    const start = startOfMonth(d)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59)
    const earned = sales
      .filter((s) => s.status === 'paid' && isWithinInterval(new Date(s.date + 'T00:00:00'), { start, end }))
      .reduce((a, s) => a + s.total, 0)
    return { mes: format(d, 'MMM', { locale: es }), ganancias: earned }
  })

  const byService: Record<string, number> = {}
  sales.filter((s) => s.status === 'paid').forEach((s) => {
    byService[s.service] = (byService[s.service] ?? 0) + s.total
  })
  const serviceData = Object.entries(byService)
    .map(([name, value]) => ({ name: name.length > 16 ? name.slice(0, 14) + '…' : name, value }))
    .sort((a, b) => b.value - a.value).slice(0, 5)

  const paid = sales.filter((s) => s.status === 'paid').length
  const pending = sales.filter((s) => s.status === 'pending').length
  const cancelled = sales.filter((s) => s.status === 'cancelled').length
  const pieData = [
    { name: 'Pagadas', value: paid, color: '#4ade80' },
    { name: 'Pendientes', value: pending, color: '#fbbf24' },
    { name: 'Canceladas', value: cancelled, color: '#f87171' },
  ].filter((d) => d.value > 0)

  const totalEarned = sales.filter((s) => s.status === 'paid').reduce((a, s) => a + s.total, 0)
  const thisMonthEarned = months[months.length - 1]?.ganancias ?? 0
  const avgSale = paid > 0 ? totalEarned / paid : 0
  const COLORS = ['#4ade80', '#22d3ee', '#a78bfa', '#fb923c', '#f472b6']
  const tooltipStyle = { backgroundColor: '#1a1e2a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e8eaf0', fontSize: '12px' }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ganancias totales', value: fmt(totalEarned, settings.currency), color: 'var(--primary)', icon: IC.money },
          { label: 'Este mes', value: fmt(thisMonthEarned, settings.currency), color: '#22d3ee', icon: IC.trend },
          { label: 'Ventas pagadas', value: String(paid), color: '#a78bfa', icon: IC.sales },
          { label: 'Ticket promedio', value: fmt(avgSale, settings.currency), color: '#fb923c', icon: IC.dashboard },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="rounded-2xl p-4 border space-y-3" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
              <span style={{ color, opacity: 0.7 }}><Ico d={icon} size={16} /></span>
            </div>
            <div className="text-xl font-extrabold tracking-tight" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-bold mb-5">Ganancias últimos 6 meses</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={months} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="mes" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v, settings.currency), 'Ganancias']} />
            <Area type="monotone" dataKey="ganancias" stroke="#4ade80" strokeWidth={2.5} fill="url(#gGrad)" dot={false} activeDot={{ r: 5, fill: '#4ade80' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {serviceData.length > 0 && (
          <div className="rounded-2xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-bold mb-5">Top servicios</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={serviceData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#a0a8b8', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v, settings.currency), 'Ganancia']} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {serviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {pieData.length > 0 && (
          <div className="rounded-2xl p-5 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-bold mb-4">Estado de ventas</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name) => [v + ' ventas', name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{d.name}</span>
                    </div>
                    <span className="text-xs font-bold">{d.value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                  Total: {sales.length} ventas
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {sales.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div className="px-5 py-4 border-b text-sm font-bold" style={{ borderColor: 'var(--border)' }}>Ventas recientes</div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {sales.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div>
                  <div className="text-sm font-semibold">{s.clientName}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{s.service}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{fmt(s.total, settings.currency)}</div>
                  <Badge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sales List ───────────────────────────────────────────────────────────────
function SalesView({ sales, settings, onNew, onEdit, onDelete, onView }: {
  sales: Sale[]; settings: AppSettings
  onNew: () => void; onEdit: (s: Sale) => void; onDelete: (id: string) => void; onView: (s: Sale) => void
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | Sale['status']>('all')

  const filtered = sales
    .filter((s) => filter === 'all' || s.status === filter)
    .filter((s) => !search || s.clientName.toLowerCase().includes(search.toLowerCase()) ||
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border"
          style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
          <Ico d={IC.search} size={15} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1" placeholder="Buscar..."
            style={{ color: 'var(--foreground)' }} />
        </div>
        <div className="flex gap-1 p-1 rounded-xl border overflow-x-auto" style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
          {(['all', 'paid', 'pending', 'cancelled'] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={filter === s ? { background: 'var(--card)', color: 'var(--foreground)' } : { color: 'var(--muted-foreground)' }}>
              {s === 'all' ? 'Todas' : s === 'paid' ? 'Pagadas' : s === 'pending' ? 'Pendientes' : 'Canceladas'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <div style={{ color: 'var(--muted-foreground)' }}><Ico d={IC.sales} size={36} /></div>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{search ? 'Sin resultados' : 'No hay ventas aún'}</p>
          {!search && <button onClick={onNew} className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>Registrar primera venta →</button>}
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          {/* Desktop table */}
          <table className="w-full text-sm hidden md:table">
            <thead>
              <tr className="border-b" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border)' }}>
                {['Factura', 'Cliente', 'Servicio', 'Fecha', 'Total', 'Estado', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sale) => (
                <tr key={sale.id} className="border-t hover:bg-white/[0.02] transition-colors group" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3"><span className="font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>{sale.invoiceNumber}</span></td>
                  <td className="px-4 py-3 font-semibold">{sale.clientName}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>{sale.service}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    {format(new Date(sale.date + 'T00:00:00'), 'dd MMM yy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 font-bold" style={{ color: 'var(--primary)' }}>{fmt(sale.total, settings.currency)}</td>
                  <td className="px-4 py-3"><Badge status={sale.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onView(sale)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: 'var(--muted-foreground)' }}><Ico d={IC.eye} size={14} /></button>
                      <button onClick={() => onEdit(sale)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: 'var(--muted-foreground)' }}><Ico d={IC.edit} size={14} /></button>
                      <button onClick={() => onDelete(sale.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400" style={{ color: 'var(--muted-foreground)' }}><Ico d={IC.trash} size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Mobile cards */}
          <div className="md:hidden divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.map((sale) => (
              <div key={sale.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{sale.clientName}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{sale.service}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{fmt(sale.total, settings.currency)}</div>
                    <div className="mt-1"><Badge status={sale.status} /></div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{sale.invoiceNumber}</span>
                  <div className="flex gap-1">
                    <button onClick={() => onView(sale)} className="p-1.5 rounded-lg bg-white/5" style={{ color: 'var(--muted-foreground)' }}><Ico d={IC.eye} size={14} /></button>
                    <button onClick={() => onEdit(sale)} className="p-1.5 rounded-lg bg-white/5" style={{ color: 'var(--muted-foreground)' }}><Ico d={IC.edit} size={14} /></button>
                    <button onClick={() => onDelete(sale.id)} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400" style={{ color: 'var(--muted-foreground)' }}><Ico d={IC.trash} size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsView({ settings, onSave, onExport, onImportClick }: {
  settings: AppSettings; onSave: (s: AppSettings) => void; onExport: () => void; onImportClick: () => void
}) {
  const [form, setForm] = useState(settings)
  const f = (k: keyof AppSettings, v: string | number) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="max-w-lg space-y-6">
      <div className="rounded-2xl p-5 border space-y-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Mi empresa</h3>
        {([
          { label: 'Nombre', key: 'businessName' as const },
          { label: 'RFC', key: 'businessRfc' as const },
          { label: 'Email', key: 'businessEmail' as const },
          { label: 'Teléfono', key: 'businessPhone' as const },
          { label: 'Dirección', key: 'businessAddress' as const },
        ]).map(({ label, key }) => (
          <Field key={key} label={label}>
            <input className={inputCls} style={inputStyle}
              value={(form[key] as string | undefined) ?? ''}
              onChange={(e) => f(key, e.target.value)} />
          </Field>
        ))}
      </div>
      <div className="rounded-2xl p-5 border space-y-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Facturación</h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label="IVA (%)">
            <input type="number" className={inputCls} style={inputStyle} value={form.taxRate}
              onChange={(e) => f('taxRate', Number(e.target.value))} min={0} max={100} />
          </Field>
          <Field label="Moneda">
            <input className={inputCls} style={inputStyle} value={form.currency}
              onChange={(e) => f('currency', e.target.value)} />
          </Field>
          <Field label="Prefijo">
            <input className={inputCls} style={inputStyle} value={form.invoicePrefix}
              onChange={(e) => f('invoicePrefix', e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="rounded-2xl p-5 border space-y-4" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted-foreground)' }}>Respaldo de datos</h3>
        <div className="flex gap-3">
          <button onClick={onExport}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border hover:bg-white/5 transition-all"
            style={{ borderColor: 'var(--border)' }}>
            <Ico d={IC.export} size={15} /> Exportar JSON
          </button>
          <button onClick={onImportClick}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border hover:bg-white/5 transition-all"
            style={{ borderColor: 'var(--border)' }}>
            <Ico d={IC.import} size={15} /> Importar JSON
          </button>
        </div>
      </div>
      <button onClick={() => onSave(form)}
        className="w-full py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
        Guardar cambios
      </button>
    </div>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
type View = 'dashboard' | 'sales' | 'settings'
const NAV = [
  { id: 'dashboard' as View, label: 'Dashboard', icon: IC.dashboard },
  { id: 'sales' as View, label: 'Ventas', icon: IC.sales },
  { id: 'settings' as View, label: 'Config', icon: IC.settings },
]

// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell() {
  const { user } = useUser()
  const [sales, setSales] = useState<Sale[]>(loadSales)
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [view, setView] = useState<View>('dashboard')
  const [showNew, setShowNew] = useState(false)
  const [editSale, setEditSale] = useState<Sale | null>(null)
  const [viewSale, setViewSale] = useState<Sale | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  function persist(next: Sale[]) { setSales(next); saveSales(next) }

  function handleSaveSale(sale: Sale) {
    const isNew = !sales.find((s) => s.id === sale.id)
    persist(isNew ? [sale, ...sales] : sales.map((s) => (s.id === sale.id ? sale : s)))
    if (isNew) {
      const ns = { ...settings, nextInvoiceNumber: settings.nextInvoiceNumber + 1 }
      setSettings(ns); saveSettings(ns)
    }
    setShowNew(false); setEditSale(null)
    showToast(isNew ? '✓ Venta registrada' : '✓ Venta actualizada')
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta venta?')) return
    persist(sales.filter((s) => s.id !== id))
    showToast('Venta eliminada')
  }

  function handleExport() {
    const data = { sales, settings, exportedAt: new Date().toISOString(), version: '1.0' }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `ventas-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const data = JSON.parse(await file.text())
      const s: Sale[] = Array.isArray(data.sales) ? data.sales : []
      const st: AppSettings = data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : DEFAULT_SETTINGS
      setSales(s); saveSales(s); setSettings(st); saveSettings(st)
      showToast(`✓ Importado: ${s.length} ventas`)
    } catch (err) { alert('Error al importar: ' + (err as Error).message) }
    e.target.value = ''
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r sticky top-0 h-screen"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>V</div>
            <div>
              <div className="text-sm font-bold leading-tight">{settings.businessName}</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{user?.firstName}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setView(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
              style={view === id ? { background: 'rgba(74,222,128,0.12)', color: 'var(--primary)' } : { color: 'var(--muted-foreground)' }}>
              <Ico d={icon} size={17} />{label}
            </button>
          ))}
        </nav>
        <div className="p-4 space-y-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <button onClick={handleExport}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all"
            style={{ color: 'var(--muted-foreground)' }}>
            <Ico d={IC.export} size={14} /> Exportar JSON
          </button>
          <button onClick={() => importRef.current?.click()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 transition-all"
            style={{ color: 'var(--muted-foreground)' }}>
            <Ico d={IC.import} size={14} /> Importar JSON
          </button>
          <div className="flex justify-center pt-1"><UserButton /></div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30"
          style={{ background: 'rgba(13,15,20,0.95)', borderColor: 'var(--border)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>V</div>
            <span className="font-bold text-sm">{settings.businessName}</span>
          </div>
          <UserButton />
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="hidden md:flex items-center justify-between mb-6">
              <h1 className="text-xl font-extrabold tracking-tight">
                {view === 'dashboard' ? 'Dashboard' : view === 'sales' ? 'Ventas' : 'Configuración'}
              </h1>
              {view === 'sales' && (
                <button onClick={() => setShowNew(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 4px 20px rgba(74,222,128,0.25)' }}>
                  <Ico d={IC.add} size={16} /> Nueva venta
                </button>
              )}
            </div>

            {view === 'dashboard' && <DashboardView sales={sales} settings={settings} />}
            {view === 'sales' && (
              <SalesView sales={sales} settings={settings}
                onNew={() => setShowNew(true)} onEdit={setEditSale}
                onDelete={handleDelete} onView={setViewSale} />
            )}
            {view === 'settings' && (
              <SettingsView settings={settings}
                onSave={(s) => { setSettings(s); saveSettings(s); showToast('✓ Guardado') }}
                onExport={handleExport} onImportClick={() => importRef.current?.click()} />
            )}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t"
        style={{ background: 'rgba(13,15,20,0.97)', borderColor: 'var(--border)', backdropFilter: 'blur(16px)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setView(id)}
            className="flex-1 flex flex-col items-center gap-1 py-3 transition-all"
            style={view === id ? { color: 'var(--primary)' } : { color: 'var(--muted-foreground)' }}>
            <Ico d={icon} size={22} />
            <span className="text-xs font-semibold">{label}</span>
          </button>
        ))}
        {view === 'sales' && (
          <button onClick={() => setShowNew(true)}
            className="absolute -top-14 right-4 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: '0 4px 24px rgba(74,222,128,0.4)' }}>
            <Ico d={IC.add} size={22} />
          </button>
        )}
      </nav>

      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

      {showNew && (
        <Modal title="Nueva venta" onClose={() => setShowNew(false)}>
          <SaleForm settings={settings} onSave={handleSaveSale} onCancel={() => setShowNew(false)} />
        </Modal>
      )}
      {editSale && (
        <Modal title="Editar venta" onClose={() => setEditSale(null)}>
          <SaleForm initial={editSale} settings={settings} onSave={handleSaveSale} onCancel={() => setEditSale(null)} />
        </Modal>
      )}
      {viewSale && <InvoiceModal sale={viewSale} settings={settings} onClose={() => setViewSale(null)} />}

      {toast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(74,222,128,0.06) 0%, transparent 50%), radial-gradient(circle at 75% 20%, rgba(34,211,238,0.05) 0%, transparent 40%)',
      }} />
      <div className="relative flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-black tracking-tighter">Ventas<span style={{ color: 'var(--primary)' }}>.</span></div>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Panel de gestión y facturas</p>
        </div>
        <SignIn routing="hash" appearance={{
          variables: { colorBackground: '#13161e', colorText: '#e8eaf0', colorPrimary: '#4ade80', colorInputBackground: 'rgba(255,255,255,0.04)', colorInputText: '#e8eaf0', borderRadius: '12px' },
          elements: { card: { border: '1px solid rgba(255,255,255,0.07)', boxShadow: 'none' } },
        }} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <SignedOut><LoginScreen /></SignedOut>
      <SignedIn><AppShell /></SignedIn>
    </>
  )
}
