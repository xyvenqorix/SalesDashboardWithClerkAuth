import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Sale, AppSettings } from './types'

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount)
}

export async function exportInvoicePng(elementId: string, invoiceNumber: string): Promise<void> {
  const el = document.getElementById(elementId)
  if (!el) return
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#13161e', useCORS: true })
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `factura-${invoiceNumber}.png`
  a.click()
}

export async function exportInvoicePdf(elementId: string, invoiceNumber: string): Promise<void> {
  const el = document.getElementById(elementId)
  if (!el) return
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#13161e', useCORS: true })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save(`factura-${invoiceNumber}.pdf`)
}

export function generateInvoiceHTML(sale: Sale, settings: AppSettings): string {
  const items = sale.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#e8eaf0;">${item.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#a0a8b8;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#a0a8b8;text-align:right;">${formatCurrency(item.unitPrice, settings.currency)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#4ade80;text-align:right;">${formatCurrency(item.quantity * item.unitPrice, settings.currency)}</td>
    </tr>
  `,
    )
    .join('')

  return `
    <div id="invoice-render" style="background:#13161e;color:#e8eaf0;font-family:system-ui,sans-serif;padding:48px;min-width:700px;max-width:800px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;">
        <div>
          <div style="font-size:28px;font-weight:700;color:#4ade80;letter-spacing:-0.5px;">${settings.businessName}</div>
          ${settings.businessRfc ? `<div style="color:#6b7280;font-size:13px;margin-top:4px;">RFC: ${settings.businessRfc}</div>` : ''}
          ${settings.businessAddress ? `<div style="color:#6b7280;font-size:13px;">${settings.businessAddress}</div>` : ''}
          ${settings.businessEmail ? `<div style="color:#6b7280;font-size:13px;">${settings.businessEmail}</div>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:32px;font-weight:800;color:#e8eaf0;letter-spacing:-1px;">FACTURA</div>
          <div style="font-size:18px;color:#4ade80;font-weight:600;">${sale.invoiceNumber}</div>
          <div style="color:#6b7280;font-size:13px;margin-top:8px;">Fecha: ${new Date(sale.date).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          <div style="margin-top:8px;padding:4px 12px;border-radius:4px;display:inline-block;font-size:12px;font-weight:600;
            background:${sale.status === 'paid' ? 'rgba(74,222,128,0.15)' : sale.status === 'pending' ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)'};
            color:${sale.status === 'paid' ? '#4ade80' : sale.status === 'pending' ? '#fbbf24' : '#ef4444'};">
            ${sale.status === 'paid' ? 'PAGADA' : sale.status === 'pending' ? 'PENDIENTE' : 'CANCELADA'}
          </div>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:20px;margin-bottom:32px;">
        <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Cliente</div>
        <div style="font-size:18px;font-weight:600;">${sale.clientName}</div>
        ${sale.clientRfc ? `<div style="color:#6b7280;font-size:13px;">RFC: ${sale.clientRfc}</div>` : ''}
        ${sale.clientEmail ? `<div style="color:#6b7280;font-size:13px;">${sale.clientEmail}</div>` : ''}
        ${sale.clientAddress ? `<div style="color:#6b7280;font-size:13px;">${sale.clientAddress}</div>` : ''}
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
        <thead>
          <tr style="background:rgba(255,255,255,0.04);">
            <th style="padding:12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">Descripción</th>
            <th style="padding:12px;text-align:center;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">Qty</th>
            <th style="padding:12px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">P. Unitario</th>
            <th style="padding:12px;text-align:right;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">Total</th>
          </tr>
        </thead>
        <tbody>${items}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;">
        <div style="min-width:260px;">
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="color:#6b7280;">Subtotal</span>
            <span>${formatCurrency(sale.subtotal, settings.currency)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="color:#6b7280;">IVA (${sale.taxRate}%)</span>
            <span>${formatCurrency(sale.tax, settings.currency)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;margin-top:4px;">
            <span style="font-size:18px;font-weight:700;">TOTAL</span>
            <span style="font-size:22px;font-weight:800;color:#4ade80;">${formatCurrency(sale.total, settings.currency)}</span>
          </div>
        </div>
      </div>

      ${sale.notes ? `<div style="margin-top:32px;padding:16px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid #4ade80;"><div style="font-size:12px;color:#6b7280;margin-bottom:4px;">NOTAS</div><div style="color:#a0a8b8;font-size:14px;">${sale.notes}</div></div>` : ''}

      <div style="margin-top:48px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;color:#6b7280;font-size:12px;">
        Documento generado el ${new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  `
}
