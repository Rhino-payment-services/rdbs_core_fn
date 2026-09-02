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

const PAGE_SIZE = 100
const TX_PAGE_SIZE = 200
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
  row: Omit<SuspiciousTransactionExportRow, keyof TransactorProfile | 'transactorFullName' | 'transactorEmail' | 'transactorPhone' | 'transactorUserType' | 'transactorSubscriberType' | 'transactorRole' | 'transactorStatus' | 'transactorKycStatus' | 'transactorNationalId' | 'transactorCity' | 'transactorCountry'>,
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

async function fetchUserProfileMap(): Promise<Map<string, TransactorProfile>> {
  const map = new Map<string, TransactorProfile>()
  try {
    const { data } = await api.get('/admin/users')
    const users = Array.isArray(data) ? data : data?.data || data?.users || []
    if (!Array.isArray(users)) return map

    users.forEach((user: Record<string, unknown>) => {
      const id = String(user.id ?? '')
      if (id) map.set(id, resolveTransactorProfile(user))
    })
  } catch {
    // Export still works without profile enrichment
  }
  return map
}

async function fetchAllTransactionsInRange(
  startDate: string,
  endDate: string,
): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY

  while (all.length < MAX_ROWS && all.length < total) {
    const { data } = await api.get('/transactions/all', {
      params: {
        page,
        limit: TX_PAGE_SIZE,
        startDate,
        endDate,
      },
    })

    const payload = data?.data ?? data
    const batch = Array.isArray(payload?.transactions) ? payload.transactions : []
    total = typeof payload?.total === 'number' ? payload.total : batch.length

    if (!batch.length) break
    all.push(...batch)
    if (batch.length < TX_PAGE_SIZE) break
    page += 1
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
): Promise<SuspiciousTransactionExportRow[]> {
  const [transactions, activityLogs, transactionLogs, profileMap] = await Promise.all([
    fetchAllTransactionsInRange(startDate, endDate).catch(() => [] as Record<string, unknown>[]),
    fetchAllSuspiciousActivityLogs(startDate, endDate).catch(() => [] as ActivityLog[]),
    fetchAllFlaggedTransactionLogs(startDate, endDate).catch(() => [] as Record<string, unknown>[]),
    fetchUserProfileMap(),
  ])

  const patternRows = detectSuspiciousPatterns(transactions).map((tx) =>
    patternToRow(tx, profileMap),
  )

  const rows = dedupeRows([
    ...patternRows,
    ...activityLogs.map((log) => activityLogToRow(log, profileMap)),
    ...transactionLogs.map((log) => transactionLogToRow(log, profileMap)),
  ])

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
