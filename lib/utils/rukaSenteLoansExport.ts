import * as XLSX from 'xlsx'
import { downloadCsv } from '@/lib/utils/merchantEventsExport'
import type { PartnerLoanListItem } from '@/lib/hooks/useRukaSenteLoans'

function money(amount?: number | null) {
  if (amount == null || Number.isNaN(Number(amount))) return ''
  return Number(amount)
}

function dateLabel(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function loanRowsForExport(items: PartnerLoanListItem[]): Record<string, unknown>[] {
  return items.map((row) => ({
    Application: row.applicationNumber,
    Borrower: row.name,
    Phone: row.phone || '',
    Email: row.email || '',
    Product: row.productName || row.productCode || '',
    Status: row.status,
    Currency: row.currency || 'UGX',
    Amount: money(row.amount ?? row.disbursedAmount ?? row.requestedAmount),
    Remaining: money(row.outstandingBalance),
    Paid: money(row.amountRepaid),
    Disbursed: dateLabel(row.disbursedAt),
    'Due date': dateLabel(row.dueDate),
  }))
}

export function exportRukaSenteLoansCsv(items: PartnerLoanListItem[]) {
  const stamp = new Date().toISOString().slice(0, 10)
  downloadCsv(`rukasente-loans-${stamp}.csv`, loanRowsForExport(items))
}

export function exportRukaSenteLoansExcel(items: PartnerLoanListItem[]) {
  const stamp = new Date().toISOString().slice(0, 10)
  const sheet = XLSX.utils.json_to_sheet(loanRowsForExport(items))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Loans')
  XLSX.writeFile(workbook, `rukasente-loans-${stamp}.xlsx`)
}

export function exportRukaSenteLoansPdf(items: PartnerLoanListItem[]) {
  const stamp = new Date().toISOString().slice(0, 10)
  const rows = loanRowsForExport(items)
  const headers = rows[0] ? Object.keys(rows[0]) : ['Application', 'Borrower', 'Amount', 'Remaining']
  const body = rows
    .map(
      (row) =>
        `<tr>${headers
          .map((h) => `<td>${escapeHtml(String(row[h] ?? ''))}</td>`)
          .join('')}</tr>`,
    )
    .join('')
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>RukaSente loans ${stamp}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    p { font-size: 12px; color: #555; margin: 0 0 16px; }
    table { border-collapse: collapse; width: 100%; font-size: 11px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #08163d; color: #fff; }
  </style>
</head>
<body>
  <h1>RukaSente loans</h1>
  <p>${items.length} loan${items.length === 1 ? '' : 's'} · ${stamp}. Use Print → Save as PDF.</p>
  <table>
    <thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${body || '<tr><td colspan="12">No loans</td></tr>'}</tbody>
  </table>
</body>
</html>`
  const win = window.open('', '_blank')
  if (!win) {
    throw new Error('Popup blocked. Allow popups to export PDF.')
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
