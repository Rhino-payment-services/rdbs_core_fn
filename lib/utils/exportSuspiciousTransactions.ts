import api from '@/lib/axios'
import { downloadTextFile } from '@/lib/utils/exportWalletTransactions'
import type { ActivityLog } from '@/lib/hooks/useActivityLogs'

export interface SuspiciousTransactionExportRow {
  date: string
  source: 'activity_log' | 'transaction_log'
  recordId: string
  userId: string
  targetUserId: string
  userEmail: string
  userPhone: string
  amount: string
  currency: string
  transactionType: string
  transactionMode: string
  flagType: string
  reason: string
  severity: string
  riskScore: string
  status: string
  ipAddress: string
  channel: string
  transactionId: string
  description: string
}

const PAGE_SIZE = 100
const MAX_ROWS = 50_000

function dateRangeQuery(startDate: string, endDate: string) {
  return {
    startDate: `${startDate}T00:00:00.000Z`,
    endDate: `${endDate}T23:59:59.999Z`,
  }
}

function escapeCsvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function formatExportDate(value: string | Date | undefined): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString()
}

function activityLogToRow(log: ActivityLog): SuspiciousTransactionExportRow {
  const meta = (log.metadata && typeof log.metadata === 'object' ? log.metadata : {}) as Record<
    string,
    unknown
  >

  const targetUserId = String(meta.targetUserId ?? meta.userId ?? log.userId ?? '')
  const userDetails = log.userDetails

  return {
    date: formatExportDate(log.createdAt),
    source: 'activity_log',
    recordId: log._id,
    userId: String(log.userId ?? meta.prismaUserId ?? ''),
    targetUserId,
    userEmail: log.userEmail || userDetails?.email || '',
    userPhone: log.userPhone || userDetails?.phone || '',
    amount: meta.amount != null ? String(meta.amount) : '',
    currency: String(meta.currency ?? ''),
    transactionType: String(meta.transactionType ?? meta.transactionMode ?? ''),
    transactionMode: String(meta.transactionMode ?? ''),
    flagType: String(meta.flagType ?? log.action ?? ''),
    reason: String(meta.reason ?? log.description ?? ''),
    severity: String(meta.severity ?? ''),
    riskScore: meta.riskScore != null ? String(meta.riskScore) : '',
    status: log.status ?? '',
    ipAddress: log.ipAddress ?? String(meta.ipAddress ?? ''),
    channel: log.channel ?? String(meta.channel ?? ''),
    transactionId: String(meta.transactionId ?? ''),
    description: log.description ?? '',
  }
}

function transactionLogToRow(log: Record<string, unknown>): SuspiciousTransactionExportRow {
  const meta = (log.metadata && typeof log.metadata === 'object' ? log.metadata : {}) as Record<
    string,
    unknown
  >
  const riskIndicators =
    log.riskIndicators && typeof log.riskIndicators === 'object'
      ? (log.riskIndicators as Record<string, unknown>)
      : {}
  const userDetails =
    log.userDetails && typeof log.userDetails === 'object'
      ? (log.userDetails as Record<string, unknown>)
      : {}

  const flags = Array.isArray(riskIndicators.flags) ? riskIndicators.flags.join('; ') : ''

  return {
    date: formatExportDate(String(log.createdAt ?? log.processedAt ?? '')),
    source: 'transaction_log',
    recordId: String(log._id ?? ''),
    userId: String(log.userId ?? ''),
    targetUserId: String(log.userId ?? ''),
    userEmail: String(userDetails.email ?? ''),
    userPhone: String(userDetails.phone ?? ''),
    amount: log.amount != null ? String(log.amount) : '',
    currency: String(log.currency ?? ''),
    transactionType: String(log.transactionType ?? ''),
    transactionMode: String(meta.transactionMode ?? log.transactionType ?? ''),
    flagType: String(meta.flagType ?? log.errorCode ?? flags),
    reason: String(log.errorMessage ?? log.description ?? ''),
    severity: String(meta.severity ?? 'HIGH'),
    riskScore:
      riskIndicators.score != null
        ? String(riskIndicators.score)
        : meta.riskScore != null
          ? String(meta.riskScore)
          : '',
    status: String(log.transactionStatus ?? ''),
    ipAddress: String(log.ipAddress ?? ''),
    channel: String(log.channel ?? ''),
    transactionId: String(log.transactionId ?? ''),
    description: String(log.description ?? ''),
  }
}

async function fetchAllSuspiciousActivityLogs(
  startDate: string,
  endDate: string,
): Promise<ActivityLog[]> {
  const range = dateRangeQuery(startDate, endDate)
  const all: ActivityLog[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && all.length < MAX_ROWS) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      category: 'SUSPICIOUS_TRANSACTION',
      startDate: range.startDate,
      endDate: range.endDate,
    })

    const { data } = await api.get(`/activity-logs?${params.toString()}`)
    const logs = Array.isArray(data?.logs) ? (data.logs as ActivityLog[]) : []
    totalPages = typeof data?.totalPages === 'number' ? data.totalPages : 1

    if (!logs.length) break

    all.push(...logs)
    if (logs.length < PAGE_SIZE) break
    page += 1
  }

  return all.slice(0, MAX_ROWS)
}

async function fetchAllFlaggedTransactionLogs(
  startDate: string,
  endDate: string,
): Promise<Record<string, unknown>[]> {
  const range = dateRangeQuery(startDate, endDate)
  const all: Record<string, unknown>[] = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages && all.length < MAX_ROWS) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      status: 'FLAGGED',
      startDate: range.startDate,
      endDate: range.endDate,
    })

    const { data } = await api.get(`/transaction-logs/system?${params.toString()}`)
    const logs = Array.isArray(data?.logs) ? (data.logs as Record<string, unknown>[]) : []
    totalPages = typeof data?.totalPages === 'number' ? data.totalPages : 1

    if (!logs.length) break

    all.push(...logs)
    if (logs.length < PAGE_SIZE) break
    page += 1
  }

  return all.slice(0, MAX_ROWS)
}

export function suspiciousTransactionsToCsv(rows: SuspiciousTransactionExportRow[]): string {
  const headers: (keyof SuspiciousTransactionExportRow)[] = [
    'date',
    'source',
    'recordId',
    'userId',
    'targetUserId',
    'userEmail',
    'userPhone',
    'amount',
    'currency',
    'transactionType',
    'transactionMode',
    'flagType',
    'reason',
    'severity',
    'riskScore',
    'status',
    'ipAddress',
    'channel',
    'transactionId',
    'description',
  ]

  const lines = [
    headers,
    ...rows.map((row) => headers.map((key) => row[key])),
  ].map((line) => line.map(escapeCsvCell).join(','))

  return `\uFEFF${lines.join('\n')}`
}

export async function fetchSuspiciousTransactionsForExport(
  startDate: string,
  endDate: string,
): Promise<SuspiciousTransactionExportRow[]> {
  const [activityLogs, transactionLogs] = await Promise.all([
    fetchAllSuspiciousActivityLogs(startDate, endDate).catch(() => [] as ActivityLog[]),
    fetchAllFlaggedTransactionLogs(startDate, endDate).catch(() => [] as Record<string, unknown>[]),
  ])

  const rows = [
    ...activityLogs.map(activityLogToRow),
    ...transactionLogs.map(transactionLogToRow),
  ]

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return rows
}

export async function exportSuspiciousTransactionsByDateRange(
  startDate: string,
  endDate: string,
): Promise<number> {
  const rows = await fetchSuspiciousTransactionsForExport(startDate, endDate)

  if (!rows.length) {
    return 0
  }

  const csv = suspiciousTransactionsToCsv(rows)
  const filename = `suspicious-transactions_${startDate}_to_${endDate}.csv`
  downloadTextFile(filename, csv)
  return rows.length
}
