import api from '@/lib/axios'

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

/**
 * Fetches every page of `/wallet/:userId/transactions` for admin export.
 * When `walletId` is omitted, returns all wallets for the user (combined).
 */
export async function fetchAllWalletTransactionsForUser(
  userId: string,
  walletId: string | undefined,
  pageSize = 200,
): Promise<any[]> {
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

    const res = await api.get(`/wallet/${userId}/transactions?${params.toString()}`)
    const { transactions, total: reportedTotal } = parseListResponse(res.data)
    total = reportedTotal

    if (!transactions.length) {
      break
    }

    all.push(...transactions)

    if (transactions.length < pageSize) {
      break
    }

    page += 1
  }

  return all
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
    'Net Amount',
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
    return [
      tx.type,
      tx.direction,
      tx.amount,
      tx.fee,
      tx.netAmount,
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
