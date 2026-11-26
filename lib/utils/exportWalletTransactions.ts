import api from '@/lib/axios'
import { getDisplayNetAmount } from '@/lib/utils/transactionNetDisplay'

function unwrapResponse(data: unknown): any {
  return data && typeof data === 'object' && 'data' in (data as object)
    ? (data as { data: unknown }).data
    : data
}

function parseListResponse(data: unknown): { transactions: any[]; total: number } {
  const raw = unwrapResponse(data) as Record<string, unknown> | null
  const transactions = Array.isArray(raw?.transactions) ? (raw.transactions as any[]) : []
  const total =
    typeof raw?.total === 'number' && Number.isFinite(raw.total) ? raw.total : transactions.length
  return { transactions, total }
}

export type FetchAllWalletTransactionsOptions = {
  /** YYYY-MM-DD — pushed to SQL via GET /wallet/:userId/transactions */
  startDate?: string
  /** YYYY-MM-DD */
  endDate?: string
  pageSize?: number
  /** Per-request axios timeout ms (export loops need more than the global 10s). */
  timeoutMs?: number
}

/**
 * Fetches every page of `/wallet/:userId/transactions` for admin export.
 * When `walletId` is omitted, returns all wallets for the user (combined).
 * Pass `startDate`/`endDate` so the server filters by createdAt (do not fetch all-time then filter client-side).
 */
export async function fetchAllWalletTransactionsForUser(
  userId: string,
  walletId: string | undefined,
  options: number | FetchAllWalletTransactionsOptions = 200,
): Promise<any[]> {
  // Back-compat: third arg used to be pageSize number
  const opts: FetchAllWalletTransactionsOptions =
    typeof options === 'number' ? { pageSize: options } : options || {}

  const pageSize = opts.pageSize && opts.pageSize > 0 ? opts.pageSize : 200
  const timeoutMs = opts.timeoutMs && opts.timeoutMs > 0 ? opts.timeoutMs : 120_000
  const hasDateFilter = Boolean(opts.startDate || opts.endDate)

  const all: any[] = []
  let page = 1
  let total = Infinity

  while (all.length < total) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    })
    if (walletId && walletId.trim() !== '') {
      params.set('walletId', walletId)
    }
    if (opts.startDate) {
      params.set('startDate', opts.startDate)
    }
    if (opts.endDate) {
      params.set('endDate', opts.endDate)
    }
    // Export paging: skip COUNT(*) after we know dates (or always for multi-page export).
    if (hasDateFilter || page > 1) {
      params.set('skipCount', 'true')
    }

    const res = await api.get(`/wallet/${userId}/transactions?${params.toString()}`, {
      timeout: timeoutMs,
    })
    const { transactions, total: reportedTotal } = parseListResponse(res.data)

    if (reportedTotal >= 0 && total === Infinity) {
      total = reportedTotal
    }

    if (!transactions.length) {
      break
    }

    all.push(...transactions)

    if (transactions.length < pageSize) {
      break
    }

    // When skipCount returns total=-1, stop only via short page; keep looping.
    if (total === Infinity || total < 0) {
      // no-op — rely on short page
    } else if (all.length >= total) {
      break
    }

    page += 1
  }

  return all
}

/** Build the query string used by fetchAllWalletTransactionsForUser (for unit tests). */
export function buildWalletTransactionsExportQuery(params: {
  page: number
  pageSize: number
  walletId?: string
  startDate?: string
  endDate?: string
  skipCount?: boolean
}): string {
  const q = new URLSearchParams({
    page: String(params.page),
    limit: String(params.pageSize),
  })
  if (params.walletId && params.walletId.trim() !== '') {
    q.set('walletId', params.walletId)
  }
  if (params.startDate) q.set('startDate', params.startDate)
  if (params.endDate) q.set('endDate', params.endDate)
  if (params.skipCount) q.set('skipCount', 'true')
  return q.toString()
}

function escapeCsvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function transactionsToCsv(transactions: any[]): string {
  const headers = [
    'Type',
    'Direction',
    'Amount',
    'Fee',
    'Net amount (wallet impact)',
    'Balance Before',
    'Balance After',
    'Status',
    'Reference',
    'Description',
    'Created At',
    'Wallet Type',
  ]

  const rows = transactions.map((tx) => {
    const w = tx.wallet || {}
    const meta = (tx.metadata && typeof tx.metadata === 'object' ? tx.metadata : {}) as Record<
      string,
      unknown
    >
    const netForDisplay = getDisplayNetAmount(tx)
    return [
      tx.type,
      tx.direction,
      tx.amount,
      tx.fee,
      netForDisplay == null ? '' : netForDisplay,
      tx.balanceBefore,
      tx.balanceAfter,
      tx.status,
      tx.reference ?? tx.externalReference ?? '',
      tx.description ?? '',
      tx.createdAt,
      w.walletType ?? meta.walletType ?? '',
    ]
  })

  const lines = [headers, ...rows].map((r) => r.map(escapeCsvCell).join(','))
  return '\uFEFF' + lines.join('\n')
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
