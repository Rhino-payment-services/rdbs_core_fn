import api from '@/lib/axios'
import { getDisplayName, getTypeDisplay } from '@/lib/utils/transactions'

export const STATEMENT_STATUSES = [
  { value: 'SUCCESS', label: 'Success' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const

export type StatementStatus = (typeof STATEMENT_STATUSES)[number]['value']

export const ALL_STATEMENT_STATUSES: StatementStatus[] = STATEMENT_STATUSES.map(
  (s) => s.value,
)

const PAGE_SIZE = 5000
const MAX_ROWS = 50_000
const MAX_PAGES = 20
const REQUEST_TIMEOUT_MS = 60_000

export type StatementRow = {
  id: string
  date: string
  wallet: string
  type: string
  sender: string
  receiver: string
  debit: string
  credit: string
  debitAmount: number
  creditAmount: number
  status: string
  createdAt: string
}

export type StatementWallet = {
  id: string
  walletType?: string | null
  publicWalletId?: string | null
  balance?: number | string | null
  currency?: string | null
}

export type FetchStatementParams = {
  startDate?: string
  endDate?: string
  statuses: StatementStatus[]
  userId?: string
  walletIds?: string[]
  onProgress?: (fetched: number, total: number) => void
}

function unwrapPayload(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {}
  const root = data as Record<string, unknown>
  if (root.data && typeof root.data === 'object' && !Array.isArray(root.data)) {
    return root.data as Record<string, unknown>
  }
  return root
}

function isDisplayLeg(tx: any): boolean {
  return tx?.metadata?.displayLeg === true
}

function isDebit(tx: any): boolean {
  const direction = String(tx?.direction || '').toUpperCase()
  if (direction === 'CREDIT' || direction === 'INCOMING') return false
  if (direction === 'DEBIT' || direction === 'OUTGOING') return true
  return true
}

export function formatStatementStatus(status: string | undefined | null): string {
  const key = String(status || '').toUpperCase()
  if (key === 'SUCCESS' || key === 'COMPLETED') return 'Success'
  if (key === 'PENDING') return 'Pending'
  if (key === 'FAILED') return 'Failed'
  if (key === 'CANCELLED') return 'Cancelled'
  if (key === 'PROCESSING') return 'Processing'
  if (!key) return '—'
  return key.charAt(0) + key.slice(1).toLowerCase()
}

export function formatKampalaDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

export function formatPeriodDay(ymd: string): string {
  const [year, month, day] = ymd.split('-').map(Number)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  if (!year || !month || !day) return ymd
  return `${day} ${months[month - 1]} ${year}`
}

export function isoToKampalaYmd(iso: string): string | null {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala' }).format(parsed)
}

export function periodFromRows(
  rows: StatementRow[],
): { startDate: string; endDate: string } | null {
  let min: number | null = null
  let max: number | null = null
  for (const row of rows) {
    const t = new Date(row.createdAt || 0).getTime()
    if (!Number.isFinite(t) || t <= 0) continue
    if (min === null || t < min) min = t
    if (max === null || t > max) max = t
  }
  if (min === null || max === null) return null
  const startDate = isoToKampalaYmd(new Date(min).toISOString())
  const endDate = isoToKampalaYmd(new Date(max).toISOString())
  if (!startDate || !endDate) return null
  return { startDate, endDate }
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function walletNumbersFromList(wallets: StatementWallet[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const wallet of wallets) {
    if (!wallet?.id) continue
    const number = String(wallet.publicWalletId || '').trim()
    if (number) map[wallet.id] = number
  }
  return map
}

export function sumWalletBalances(wallets: StatementWallet[]): number {
  return wallets.reduce((sum, wallet) => {
    const n = Number(wallet?.balance ?? 0)
    return sum + (Number.isFinite(n) ? n : 0)
  }, 0)
}

export function walletTypeLabel(walletType?: string | null): string {
  return String(walletType || 'Wallet').replace(/_/g, ' ')
}

function partyName(
  tx: any,
  side: 'sender' | 'receiver',
): string {
  const info = side === 'sender' ? tx?.senderInfo : tx?.receiverInfo
  const fromInfo = String(info?.name || '').trim()
  if (fromInfo) return fromInfo
  const fallback = getDisplayName(
    tx?.user,
    tx?.metadata,
    tx?.counterpartyUser,
    tx?.wallet,
    tx,
    side,
  )
  return String(fallback || '—').trim() || '—'
}

function walletCell(tx: any, walletNumbers: Record<string, string>): string {
  const fromWallet = String(tx?.wallet?.publicWalletId || '').trim()
  if (fromWallet) return fromWallet
  const walletId = String(tx?.walletId || tx?.wallet?.id || '').trim()
  if (walletId && walletNumbers[walletId]) return walletNumbers[walletId]
  const fromInfo = String(tx?.senderInfo?.walletId || '').trim()
  if (fromInfo && walletNumbers[fromInfo]) return walletNumbers[fromInfo]
  return '—'
}

export function toStatementRows(
  transactions: any[],
  walletNumbers: Record<string, string> = {},
): StatementRow[] {
  return transactions.map((tx) => {
    const debitRow = isDebit(tx)
    const amount = Number(tx?.amount ?? 0)
    const safeAmount = Number.isFinite(amount) ? amount : 0
    return {
      id: String(tx?.id || ''),
      date: tx?.createdAt ? formatKampalaDateTime(tx.createdAt) : '—',
      wallet: walletCell(tx, walletNumbers),
      type: getTypeDisplay(String(tx?.type || ''), tx?.direction, tx),
      sender: partyName(tx, 'sender'),
      receiver: partyName(tx, 'receiver'),
      debit: debitRow ? formatMoney(safeAmount) : '',
      credit: debitRow ? '' : formatMoney(safeAmount),
      debitAmount: debitRow ? safeAmount : 0,
      creditAmount: debitRow ? 0 : safeAmount,
      status: formatStatementStatus(tx?.status),
      createdAt: String(tx?.createdAt || ''),
    }
  })
}

export async function fetchStatementTransactions({
  startDate,
  endDate,
  statuses,
  userId,
  walletIds,
  onProgress,
}: FetchStatementParams): Promise<any[]> {
  if (!statuses.length) {
    throw new Error('Select at least one status.')
  }

  const statusSet = new Set(statuses.map((s) => s.toUpperCase()))
  const allStatusesSelected =
    ALL_STATEMENT_STATUSES.every((s) => statusSet.has(s)) &&
    statuses.length === ALL_STATEMENT_STATUSES.length
  const singleStatus = statuses.length === 1 ? statuses[0] : undefined
  const walletSet =
    walletIds && walletIds.length > 0 ? new Set(walletIds) : null

  const collected: any[] = []
  const seen = new Set<string>()
  let page = 1
  let reportedTotal = Number.POSITIVE_INFINITY

  while (page <= MAX_PAGES) {
    const response = await api.get('/transactions/all', {
      params: {
        page,
        limit: PAGE_SIZE,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        userId: userId || undefined,
        status: singleStatus,
      },
      timeout: REQUEST_TIMEOUT_MS,
    })

    const payload = unwrapPayload(response.data)
    const pageRows = Array.isArray(payload.transactions)
      ? (payload.transactions as any[])
      : []
    if (typeof payload.total === 'number' && Number.isFinite(payload.total)) {
      reportedTotal = payload.total
    }

    if (
      page === 1 &&
      reportedTotal > MAX_ROWS &&
      allStatusesSelected &&
      !walletSet
    ) {
      throw new Error(
        `This selection has ${reportedTotal.toLocaleString()} transactions (limit ${MAX_ROWS.toLocaleString()}). Pick a date range or fewer statuses.`,
      )
    }

    for (const tx of pageRows) {
      const id = String(tx?.id || '')
      if (id && seen.has(id)) continue
      if (isDisplayLeg(tx)) continue
      if (walletSet && !walletSet.has(String(tx?.walletId || tx?.wallet?.id || ''))) {
        continue
      }
      if (!singleStatus) {
        const status = String(tx?.status || '').toUpperCase()
        const normalized = status === 'COMPLETED' ? 'SUCCESS' : status
        if (!statusSet.has(normalized)) continue
      }
      if (id) seen.add(id)
      collected.push(tx)
      if (collected.length > MAX_ROWS) {
        throw new Error(
          `More than ${MAX_ROWS.toLocaleString()} matching transactions. Pick a date range or fewer statuses.`,
        )
      }
    }

    onProgress?.(collected.length, Number.isFinite(reportedTotal) ? reportedTotal : collected.length)

    if (pageRows.length < PAGE_SIZE) break
    if (Number.isFinite(reportedTotal) && page * PAGE_SIZE >= reportedTotal) break
    page += 1
  }

  if (page > MAX_PAGES) {
    throw new Error(
      `Too many transactions for this selection (over ${(MAX_PAGES * PAGE_SIZE).toLocaleString()}). Pick a date range or fewer statuses.`,
    )
  }

  collected.sort((a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime()
    const bTime = new Date(b?.createdAt || 0).getTime()
    return bTime - aTime
  })

  return collected
}

export function statementFileName(parts: {
  name?: string
  startDate?: string
  endDate?: string
}): string {
  const slug = String(parts.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  const range =
    parts.startDate && parts.endDate
      ? `${parts.startDate}-to-${parts.endDate}`
      : 'all-time'
  return slug
    ? `rukapay-statement-${slug}-${range}.pdf`
    : `rukapay-statement-${range}.pdf`
}
