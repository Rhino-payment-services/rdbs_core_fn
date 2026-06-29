import * as XLSX from 'xlsx'
import type {
  PlatformRevenueEntry,
  PlatformRevenuePartnerSummaryRow,
} from '@/lib/hooks/useWallets'

export interface PlatformRevenueExportPayload {
  currency: string
  items: PlatformRevenuePartnerSummaryRow[]
  totals: {
    accruedAmount: number
    liquidatedAmount: number
    unsettledAmount: number
    entryCount: number
    transactionVolume?: number
  }
  entries: PlatformRevenueEntry[]
  entriesTotal: number
  entryCount: number
  period?: {
    startDate: string | null
    endDate: string | null
  } | null
}

function formatExportDate(value: string | Date | null | undefined): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatExportDateOnly(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function buildPlatformRevenueWorkbook(data: PlatformRevenueExportPayload) {
  const { currency, items, totals, entries, entriesTotal } = data

  const summaryRows = items.map((row) => ({
    Source: row.partnerLabel,
    TPV: row.transactionVolume ?? 0,
    Transactions: row.entryCount,
    'Fees accrued': row.accruedAmount,
    Settled: row.liquidatedAmount,
    Unsettled: row.unsettledAmount,
    'Last activity': formatExportDateOnly(row.lastCreditedAt),
  }))

  summaryRows.push({
    Source: 'TOTAL',
    TPV: totals.transactionVolume ?? 0,
    Transactions: totals.entryCount,
    'Fees accrued': totals.accruedAmount,
    Settled: totals.liquidatedAmount,
    Unsettled: totals.unsettledAmount,
    'Last activity': '',
  })

  const entryRows = entries.map((entry) => {
    const tx = entry.transaction
    return {
      'Credited at': formatExportDate(entry.creditedAt),
      Source: entry.partnerLabel ?? '',
      'Transaction type': entry.transactionType || tx?.type || '',
      Reference: tx?.reference || entry.transactionId,
      'Transaction ID': entry.transactionId,
      'Txn amount': tx?.amount ?? '',
      'Txn currency': tx?.currency || entry.currency,
      'Fee amount': entry.amount,
      Currency: entry.currency,
      'Txn created at': tx?.createdAt ? formatExportDate(tx.createdAt) : '',
      Channel: entry.channel || tx?.channel || '',
      Status: entry.status,
    }
  })

  entryRows.push({
    'Credited at': '',
    Source: 'TOTAL',
    'Transaction type': '',
    Reference: '',
    'Transaction ID': '',
    'Txn amount': '',
    'Txn currency': '',
    'Fee amount': entriesTotal,
    Currency: currency,
    'Txn created at': '',
    Channel: '',
    Status: '',
  })

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows)
  const entriesSheet = XLSX.utils.json_to_sheet(entryRows)

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary by source')
  XLSX.utils.book_append_sheet(workbook, entriesSheet, 'Accrual entries')

  return workbook
}

export function downloadPlatformRevenueWorkbook(
  data: PlatformRevenueExportPayload,
  options?: { periodStart?: string; periodEnd?: string },
) {
  const workbook = buildPlatformRevenueWorkbook(data)
  const periodLabel =
    options?.periodStart || options?.periodEnd
      ? `${options?.periodStart || 'start'}_to_${options?.periodEnd || 'end'}`
      : 'all_time'
  const fileName = `platform_revenue_${data.currency}_${periodLabel}.xlsx`
  XLSX.writeFile(workbook, fileName)
}
