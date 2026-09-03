import api from '@/lib/axios'
import { downloadTextFile } from '@/lib/utils/exportWalletTransactions'
import type { ActivityLog } from '@/lib/hooks/useActivityLogs'
import {
  detectSuspiciousPatterns,
  type SuspiciousTransactionPattern,
} from '@/lib/utils/suspiciousTransactionPatterns'

export interface TransactorProfile {
  fullName: string
  email: string
  phone: string
  userType: string
  subscriberType: string
  role: string
  status: string
  kycStatus: string
  nationalId: string
  city: string
  country: string
}

export interface SuspiciousTransactionExportRow {
  date: string
  source: 'activity_log' | 'transaction_log' | 'pattern_detection'
  recordId: string
  transactionId: string
  reference: string
  userId: string
  transactorFullName: string
  transactorEmail: string
  transactorPhone: string
  transactorUserType: string
  transactorSubscriberType: string
  transactorRole: string
  transactorStatus: string
  transactorKycStatus: string
  transactorNationalId: string
  transactorCity: string
  transactorCountry: string
  amount: string
  currency: string
  transactionType: string
  transactionMode: string
  transactionStatus: string
  flags: string
  flagType: string
  reason: string
  riskLevel: string
  riskScore: string
  severity: string
  ipAddress: string
  channel: string
  description: string
}

export type ExportProgressCallback = (message: string) => void

const PAGE_SIZE = 100
const TX_PAGE_SIZE = 500
const MAX_ROWS = 50_000
const EXPORT_TIMEOUT_MS = 90_000
const TX_PAGE_CONCURRENCY = 4
const PROFILE_FETCH_CONCURRENCY = 10

function dateRangeQuery(startDate: string, endDate: string) {
  const start = startDate.includes('T') ? startDate.slice(0, 10) : startDate
  const end = endDate.includes('T') ? endDate.slice(0, 10) : endDate
  return {
    startDate: `${start}T00:00:00.000Z`,
    endDate: `${end}T23:59:59.999Z`,
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

function emptyProfile(): TransactorProfile {
  return {
    fullName: '',
    email: '',
    phone: '',
    userType: '',
    subscriberType: '',
    role: '',
    status: '',
    kycStatus: '',
    nationalId: '',
    city: '',
    country: '',
  }
}

export function resolveTransactorProfile(user: Record<string, unknown> | undefined): TransactorProfile {
  if (!user) return emptyProfile()

  const profile =
    user.profile && typeof user.profile === 'object'
      ? (user.profile as Record<string, unknown>)
      : undefined

  const firstName = profile?.firstName ?? user.firstName
  const lastName = profile?.lastName ?? user.lastName
  const fullName =
    firstName || lastName ? `${firstName ?? ''} ${lastName ?? ''}`.trim() : ''

  return {
    fullName,
    email: String(user.email ?? ''),
    phone: String(user.phone ?? ''),
    userType: String(user.userType ?? ''),
    subscriberType: String(user.subscriberType ?? ''),
    role: String(user.role ?? ''),
    status: String(user.status ?? ''),
    kycStatus: String(user.kycStatus ?? ''),
    nationalId: String(profile?.nationalId ?? ''),
    city: String(profile?.city ?? ''),
    country: String(profile?.country ?? ''),
  }
}

function applyProfile(
  row: Omit<
    SuspiciousTransactionExportRow,
    | 'transactorFullName'
    | 'transactorEmail'
    | 'transactorPhone'
    | 'transactorUserType'
    | 'transactorSubscriberType'
    | 'transactorRole'
    | 'transactorStatus'
    | 'transactorKycStatus'
    | 'transactorNationalId'
    | 'transactorCity'
    | 'transactorCountry'
  >,
  profile: TransactorProfile,
  fallback?: { email?: string; phone?: string; name?: string },
): SuspiciousTransactionExportRow {
  return {
    ...row,
    transactorFullName: profile.fullName || fallback?.name || '',
    transactorEmail: profile.email || fallback?.email || '',
    transactorPhone: profile.phone || fallback?.phone || '',
    transactorUserType: profile.userType,
    transactorSubscriberType: profile.subscriberType,
    transactorRole: profile.role,
    transactorStatus: profile.status,
    transactorKycStatus: profile.kycStatus,
    transactorNationalId: profile.nationalId,
    transactorCity: profile.city,
    transactorCountry: profile.country,
  }
}

async function fetchTransactionPage(
  page: number,
  startDate: string,
  endDate: string,
): Promise<{ transactions: Record<string, unknown>[]; total: number }> {
  const { data } = await api.get('/transactions/all', {
    params: { page, limit: TX_PAGE_SIZE, startDate, endDate },
    timeout: EXPORT_TIMEOUT_MS,
  })

  const payload = data?.data ?? data
  const transactions = Array.isArray(payload?.transactions) ? payload.transactions : []
  const total = typeof payload?.total === 'number' ? payload.total : transactions.length
  return { transactions, total }
}

export async function fetchProfilesForUserIds(
  userIds: string[],
  onProgress?: ExportProgressCallback,
): Promise<Map<string, TransactorProfile>> {
  const map = new Map<string, TransactorProfile>()
  const unique = [...new Set(userIds.filter(Boolean))]
  if (!unique.length) return map

  onProgress?.(`Loading profiles for ${unique.length} transactor${unique.length === 1 ? '' : 's'}…`)

  for (let i = 0; i < unique.length; i += PROFILE_FETCH_CONCURRENCY) {
    const batch = unique.slice(i, i + PROFILE_FETCH_CONCURRENCY)
    await Promise.all(
      batch.map(async (userId) => {
        try {
          const { data } = await api.get(`/users/${userId}`, { timeout: EXPORT_TIMEOUT_MS })
          const user = (data?.data ?? data) as Record<string, unknown> | undefined
          if (user) map.set(userId, resolveTransactorProfile(user))
        } catch {
          // Profile enrichment is best-effort
        }
      }),
    )
  }

  return map
}

async function fetchAllTransactionsInRange(
  startDate: string,
  endDate: string,
  onProgress?: ExportProgressCallback,
): Promise<Record<string, unknown>[]> {
  onProgress?.('Loading transactions for pattern detection…')

  const firstPage = await fetchTransactionPage(1, startDate, endDate)
  const all = [...firstPage.transactions]
  const total = firstPage.total
  const totalPages = Math.min(Math.ceil(total / TX_PAGE_SIZE), Math.ceil(MAX_ROWS / TX_PAGE_SIZE))

  if (totalPages <= 1 || all.length >= MAX_ROWS) {
    onProgress?.(`Loaded ${all.length} transactions`)
    return all.slice(0, MAX_ROWS)
  }

  for (let page = 2; page <= totalPages && all.length < MAX_ROWS; page += TX_PAGE_CONCURRENCY) {
    const pages = Array.from(
      { length: Math.min(TX_PAGE_CONCURRENCY, totalPages - page + 1) },
      (_, idx) => page + idx,
    )

    const batches = await Promise.all(
      pages.map((p) => fetchTransactionPage(p, startDate, endDate).catch(() => ({ transactions: [], total }))),
    )

    batches.forEach(({ transactions }) => {
      if (transactions.length) all.push(...transactions)
    })

    onProgress?.(`Loaded ${Math.min(all.length, total)} of ${total} transactions…`)

    if (batches.some(({ transactions }) => transactions.length < TX_PAGE_SIZE)) {
      break
    }
  }

  return all.slice(0, MAX_ROWS)
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

    const { data } = await api.get(`/activity-logs?${params.toString()}`, {
      timeout: EXPORT_TIMEOUT_MS,
    })
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

    const { data } = await api.get(`/transaction-logs/system?${params.toString()}`, {
      timeout: EXPORT_TIMEOUT_MS,
    })
    const logs = Array.isArray(data?.logs) ? (data.logs as Record<string, unknown>[]) : []
    totalPages = typeof data?.totalPages === 'number' ? data.totalPages : 1

    if (!logs.length) break
    all.push(...logs)
    if (logs.length < PAGE_SIZE) break
    page += 1
  }

  return all.slice(0, MAX_ROWS)
}

function patternToRow(
  tx: SuspiciousTransactionPattern,
  profileMap: Map<string, TransactorProfile>,
): SuspiciousTransactionExportRow {
  const profile = profileMap.get(tx.userId) ?? emptyProfile()
  return applyProfile(
    {
      date: formatExportDate(tx.createdAt),
      source: 'pattern_detection',
      recordId: tx.id,
      transactionId: tx.transactionId,
      reference: tx.reference,
      userId: tx.userId,
      amount: String(tx.amount),
      currency: tx.currency,
      transactionType: tx.type,
      transactionMode: tx.mode,
      transactionStatus: tx.status,
      flags: tx.flags.join('; '),
      flagType: tx.flags[0] ?? '',
      reason: tx.reason,
      riskLevel: tx.riskLevel,
      riskScore: String(tx.riskScore),
      severity: tx.riskLevel,
      ipAddress: tx.ip ?? '',
      channel: String(tx.metadata?.channel ?? ''),
      description: tx.reason,
    },
    profile,
    { email: tx.userEmail, phone: tx.userPhone, name: tx.userName },
  )
}

function activityLogToRow(
  log: ActivityLog,
  profileMap: Map<string, TransactorProfile>,
): SuspiciousTransactionExportRow {
  const meta = (log.metadata && typeof log.metadata === 'object' ? log.metadata : {}) as Record<
    string,
    unknown
  >
  const userId = String(meta.targetUserId ?? meta.prismaUserId ?? log.userId ?? '')
  const profile = profileMap.get(userId) ?? emptyProfile()
  const userDetails = log.userDetails

  return applyProfile(
    {
      date: formatExportDate(log.createdAt),
      source: 'activity_log',
      recordId: log._id,
      transactionId: String(meta.transactionId ?? ''),
      reference: String(meta.reference ?? meta.transactionId ?? log._id),
      userId,
      amount: meta.amount != null ? String(meta.amount) : '',
      currency: String(meta.currency ?? ''),
      transactionType: String(meta.transactionType ?? meta.transactionMode ?? ''),
      transactionMode: String(meta.transactionMode ?? ''),
      transactionStatus: log.status ?? '',
      flags: String(meta.flagType ?? log.action ?? ''),
      flagType: String(meta.flagType ?? log.action ?? ''),
      reason: String(meta.reason ?? log.description ?? ''),
      riskLevel: '',
      riskScore: meta.riskScore != null ? String(meta.riskScore) : '',
      severity: String(meta.severity ?? 'HIGH'),
      ipAddress: log.ipAddress ?? String(meta.ipAddress ?? ''),
      channel: log.channel ?? String(meta.channel ?? ''),
      description: log.description ?? '',
    },
    profile,
    {
      email: log.userEmail || userDetails?.email,
      phone: log.userPhone || userDetails?.phone,
      name: userDetails?.fullName ?? undefined,
    },
  )
}

function transactionLogToRow(
  log: Record<string, unknown>,
  profileMap: Map<string, TransactorProfile>,
): SuspiciousTransactionExportRow {
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
  const userId = String(log.userId ?? '')
  const profile = profileMap.get(userId) ?? emptyProfile()
  const flags = Array.isArray(riskIndicators.flags)
    ? riskIndicators.flags.join('; ')
    : String(meta.flagType ?? log.errorCode ?? '')

  return applyProfile(
    {
      date: formatExportDate(String(log.createdAt ?? log.processedAt ?? '')),
      source: 'transaction_log',
      recordId: String(log._id ?? ''),
      transactionId: String(log.transactionId ?? ''),
      reference: String(log.reference ?? log.transactionId ?? log._id ?? ''),
      userId,
      amount: log.amount != null ? String(log.amount) : '',
      currency: String(log.currency ?? ''),
      transactionType: String(log.transactionType ?? ''),
      transactionMode: String(meta.transactionMode ?? log.transactionType ?? ''),
      transactionStatus: String(log.transactionStatus ?? ''),
      flags,
      flagType: String(meta.flagType ?? log.errorCode ?? flags),
      reason: String(log.errorMessage ?? log.description ?? ''),
      riskLevel: '',
      riskScore:
        riskIndicators.score != null
          ? String(riskIndicators.score)
          : meta.riskScore != null
            ? String(meta.riskScore)
            : '',
      severity: String(meta.severity ?? 'HIGH'),
      ipAddress: String(log.ipAddress ?? ''),
      channel: String(log.channel ?? ''),
      description: String(log.description ?? ''),
    },
    profile,
    {
      email: String(userDetails.email ?? ''),
      phone: String(userDetails.phone ?? ''),
      name: String(userDetails.fullName ?? ''),
    },
  )
}

function dedupeRows(rows: SuspiciousTransactionExportRow[]): SuspiciousTransactionExportRow[] {
  const map = new Map<string, SuspiciousTransactionExportRow>()

  rows.forEach((row) => {
    const key =
      row.source === 'pattern_detection'
        ? `pattern:${row.transactionId}`
        : `${row.source}:${row.recordId}`

    const existing = map.get(key)
    if (!existing) {
      map.set(key, row)
      return
    }

    const mergedFlags = new Set(
      `${existing.flags}; ${row.flags}`.split(';').map((f) => f.trim()).filter(Boolean),
    )
    existing.flags = Array.from(mergedFlags).join('; ')
    if (!existing.transactorFullName && row.transactorFullName) {
      Object.assign(existing, {
        transactorFullName: row.transactorFullName,
        transactorEmail: row.transactorEmail,
        transactorPhone: row.transactorPhone,
        transactorUserType: row.transactorUserType,
        transactorSubscriberType: row.transactorSubscriberType,
        transactorRole: row.transactorRole,
        transactorStatus: row.transactorStatus,
        transactorKycStatus: row.transactorKycStatus,
        transactorNationalId: row.transactorNationalId,
        transactorCity: row.transactorCity,
        transactorCountry: row.transactorCountry,
      })
    }
  })

  return Array.from(map.values())
}

export function suspiciousTransactionsToCsv(rows: SuspiciousTransactionExportRow[]): string {
  const headers: (keyof SuspiciousTransactionExportRow)[] = [
    'date',
    'source',
    'recordId',
    'transactionId',
    'reference',
    'userId',
    'transactorFullName',
    'transactorEmail',
    'transactorPhone',
    'transactorUserType',
    'transactorSubscriberType',
    'transactorRole',
    'transactorStatus',
    'transactorKycStatus',
    'transactorNationalId',
    'transactorCity',
    'transactorCountry',
    'amount',
    'currency',
    'transactionType',
    'transactionMode',
    'transactionStatus',
    'flags',
    'flagType',
    'reason',
    'riskLevel',
    'riskScore',
    'severity',
    'ipAddress',
    'channel',
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
  onProgress?: ExportProgressCallback,
): Promise<SuspiciousTransactionExportRow[]> {
  onProgress?.('Loading flagged audit logs…')

  const [activityLogs, transactionLogs] = await Promise.all([
    fetchAllSuspiciousActivityLogs(startDate, endDate).catch(() => [] as ActivityLog[]),
    fetchAllFlaggedTransactionLogs(startDate, endDate).catch(() => [] as Record<string, unknown>[]),
  ])

  const transactions = await fetchAllTransactionsInRange(startDate, endDate, onProgress)

  onProgress?.('Detecting suspicious patterns…')
  const patternRows = detectSuspiciousPatterns(transactions)

  const userIds = new Set<string>()
  patternRows.forEach((tx) => userIds.add(tx.userId))
  activityLogs.forEach((log) => {
    const meta = (log.metadata ?? {}) as Record<string, unknown>
    const id = String(meta.targetUserId ?? meta.prismaUserId ?? log.userId ?? '')
    if (id) userIds.add(id)
  })
  transactionLogs.forEach((log) => {
    const id = String(log.userId ?? '')
    if (id) userIds.add(id)
  })

  const profileMap = await fetchProfilesForUserIds([...userIds], onProgress)

  onProgress?.('Building export…')
  const rows = dedupeRows([
    ...patternRows.map((tx) => patternToRow(tx, profileMap)),
    ...activityLogs.map((log) => activityLogToRow(log, profileMap)),
    ...transactionLogs.map((log) => transactionLogToRow(log, profileMap)),
  ])

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return rows
}

export async function exportSuspiciousTransactionsByDateRange(
  startDate: string,
  endDate: string,
  onProgress?: ExportProgressCallback,
): Promise<number> {
  const rows = await fetchSuspiciousTransactionsForExport(startDate, endDate, onProgress)

  if (!rows.length) {
    return 0
  }

  onProgress?.('Generating CSV…')
  const csv = suspiciousTransactionsToCsv(rows)
  const filename = `suspicious-transactions_${startDate}_to_${endDate}.csv`
  downloadTextFile(filename, csv)
  return rows.length
}

/**
 * Lightweight export for the Suspicious Txns tab:
 * only backend-flagged activity logs + FLAGGED transaction logs for the date range.
 * Skips full-ledger pattern scanning (avoids huge/slow exports).
 */
export async function fetchBackendFlaggedSuspiciousForExport(
  startDate: string,
  endDate: string,
  onProgress?: ExportProgressCallback,
): Promise<SuspiciousTransactionExportRow[]> {
  onProgress?.('Loading backend flagged events…')

  const [activityLogs, transactionLogs] = await Promise.all([
    fetchAllSuspiciousActivityLogs(startDate, endDate).catch(() => [] as ActivityLog[]),
    fetchAllFlaggedTransactionLogs(startDate, endDate).catch(() => [] as Record<string, unknown>[]),
  ])

  onProgress?.(
    `Found ${activityLogs.length} activity flag${activityLogs.length === 1 ? '' : 's'} and ` +
      `${transactionLogs.length} flagged transaction log${transactionLogs.length === 1 ? '' : 's'}…`,
  )

  const userIds = new Set<string>()
  activityLogs.forEach((log) => {
    const meta = (log.metadata ?? {}) as Record<string, unknown>
    const id = String(meta.targetUserId ?? meta.prismaUserId ?? log.userId ?? '')
    if (id) userIds.add(id)
  })
  transactionLogs.forEach((log) => {
    const id = String(log.userId ?? '')
    if (id) userIds.add(id)
  })

  const profileMap = await fetchProfilesForUserIds([...userIds], onProgress)

  onProgress?.('Building export…')
  const rows = dedupeRows([
    ...activityLogs.map((log) => activityLogToRow(log, profileMap)),
    ...transactionLogs.map((log) => transactionLogToRow(log, profileMap)),
  ])

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return rows
}

export async function exportBackendFlaggedSuspiciousByDateRange(
  startDate: string,
  endDate: string,
  onProgress?: ExportProgressCallback,
): Promise<number> {
  const rows = await fetchBackendFlaggedSuspiciousForExport(startDate, endDate, onProgress)

  if (!rows.length) {
    return 0
  }

  onProgress?.('Generating CSV…')
  const csv = suspiciousTransactionsToCsv(rows)
  const safeStart = startDate.slice(0, 10)
  const safeEnd = endDate.slice(0, 10)
  const filename = `suspicious-flagged_${safeStart}_to_${safeEnd}.csv`
  downloadTextFile(filename, csv)
  return rows.length
}
