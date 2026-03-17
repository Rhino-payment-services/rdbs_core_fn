"use client"

import { useQuery } from '@tanstack/react-query'
import api from '../axios'

export interface ActivityLog {
  _id: string
  userId: string
  userEmail?: string
  userPhone?: string
  userDetails?: {
    id: string
    email?: string
    phone?: string
    role: string
    userType: string
    firstName?: string
    lastName?: string
    fullName?: string
    department?: string
    position?: string
  }
  action: string
  category: string
  description: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  metadata: Record<string, any>
  channel: string
  requestId: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  updatedAt: string
}

export interface ActivityLogListResponse {
  logs: ActivityLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ActivityStatsResponse {
  totalActions: number
  successCount: number
  failedCount: number
  pendingCount: number
  successRate: number
  categoryStats: Array<{ category: string; count: number }>
  topActions: Array<{ action: string; count: number }>
}

export interface ActivityLogFilters {
  /** UI tab selection — forwarded to backend as `logType` when supported. */
  tab?: 'all' | 'customer' | 'internal'
  page?: number
  limit?: number
  userId?: string
  action?: string
  category?: string
  status?: 'SUCCESS' | 'FAILED' | 'PENDING'
  startDate?: string
  endDate?: string
  query?: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function isInternalLog(log: ActivityLog) {
  const channel = (log.channel || '').toUpperCase()
  if (channel === 'BACKOFFICE') return true
  const userType = (log.userDetails?.userType || '').toUpperCase()
  const role = (log.userDetails?.role || '').toUpperCase()
  const email = (log.userEmail || log.userDetails?.email || '').toLowerCase()
  if (userType === 'STAFF') return true
  if (role.includes('ADMIN')) return true
  if (email.endsWith('@rukapay.co.ug')) return true
  return false
}

function matchesTab(log: ActivityLog, tab: ActivityLogFilters['tab']) {
  if (!tab || tab === 'all') return true
  return tab === 'internal' ? isInternalLog(log) : !isInternalLog(log)
}

function inTimeRange(log: ActivityLog, startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return true
  const t = new Date(log.createdAt).getTime()
  if (Number.isNaN(t)) return false
  if (startDate && !Number.isNaN(new Date(startDate).getTime()) && t < new Date(startDate).getTime()) return false
  if (endDate && !Number.isNaN(new Date(endDate).getTime()) && t > new Date(endDate).getTime()) return false
  return true
}

function isValidationRejection(err: any): boolean {
  const status = err?.status ?? err?.response?.status
  if (status !== 400) return false
  const errors = err?.data?.errors ?? err?.response?.data?.errors
  const errText = [
    err?.message ?? '',
    err?.data?.message ?? '',
    err?.response?.data?.message ?? '',
    Array.isArray(errors) ? errors.join(' ') : String(errors ?? ''),
  ].join(' ')
  return errText.includes('should not exist')
}

// ─── primary fetch ────────────────────────────────────────────────────────────

async function getActivityLogs(filters: ActivityLogFilters = {}): Promise<ActivityLogListResponse> {
  const tab = filters.tab || 'all'
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20

  const params = new URLSearchParams()
  params.append('page', String(page))
  params.append('limit', String(limit))
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.action) params.append('action', filters.action)
  if (filters.category) params.append('category', filters.category)
  if (filters.status) params.append('status', filters.status)
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  // logType enables server-side tab filtering on backends that support it
  if (tab !== 'all') params.append('logType', tab)

  try {
    const { data } = await api.get(`/activity-logs?${params.toString()}`)
    return data as ActivityLogListResponse
  } catch (err: any) {
    if (!isValidationRejection(err)) throw err
    // Backend is an older build that rejects page/limit/startDate/endDate params.
    // Fall back to the simpler endpoints and filter client-side.
    return fallbackScan(filters, tab, page, limit)
  }
}

// ─── fallback scan ────────────────────────────────────────────────────────────

async function fallbackScan(
  filters: ActivityLogFilters,
  tab: ActivityLogFilters['tab'],
  page: number,
  limit: number,
): Promise<ActivityLogListResponse> {
  const rawPageSize = 100
  const maxPagesToScan = 25

  // We need enough logs to populate `page` worth of results after tab-filtering.
  // We do NOT apply time range during collection — the scan collects the most recent
  // matching-tab logs regardless of date, then we apply the time range as a display
  // filter afterwards (and fall back to all collected if the time window is empty).
  const neededForPage = page * limit

  if (filters.userId) {
    const { data } = await api.get(
      `/activity-logs/user/${encodeURIComponent(filters.userId)}?page=1&limit=${rawPageSize}`,
    )
    const tabFiltered = (data.logs || []).filter((l: ActivityLog) => matchesTab(l, tab))
    const display = applyTimeRangeWithFallback(tabFiltered, filters.startDate, filters.endDate)
    const start = (page - 1) * limit
    return {
      logs: display.slice(start, start + limit),
      total: display.length,
      page,
      limit,
      totalPages: Math.ceil(display.length / limit),
    }
  }

  const collected: ActivityLog[] = []
  let systemTotal = 0
  let systemTotalPages = 0

  for (let p = 1; p <= maxPagesToScan; p++) {
    const { data } = await api.get(`/activity-logs/system?page=${p}&limit=${rawPageSize}`)
    systemTotal = (data as ActivityLogListResponse).total
    systemTotalPages = (data as ActivityLogListResponse).totalPages
    const matching = ((data as ActivityLogListResponse).logs || []).filter((l: ActivityLog) =>
      matchesTab(l, tab),
    )
    collected.push(...matching)
    if (collected.length >= neededForPage * 3) break
    if (systemTotalPages && p >= systemTotalPages) break
  }

  const display = applyTimeRangeWithFallback(collected, filters.startDate, filters.endDate)
  const start = (page - 1) * limit
  const sliced = display.slice(start, start + limit)

  return {
    logs: sliced,
    total: display.length || systemTotal,
    page,
    limit,
    totalPages: Math.ceil((display.length || systemTotal) / limit),
  }
}

/**
 * Apply time range filter, but fall back to the full list if the time window
 * would produce an empty result. This prevents "No activity" when the user
 * is on the customer/internal tab and has no activity in the selected window.
 */
function applyTimeRangeWithFallback(
  logs: ActivityLog[],
  startDate?: string,
  endDate?: string,
): ActivityLog[] {
  if (!startDate && !endDate) return logs
  const filtered = logs.filter((l) => inTimeRange(l, startDate, endDate))
  return filtered.length > 0 ? filtered : logs
}

// ─── stats & helpers ──────────────────────────────────────────────────────────

async function getActivityStats(startDate?: string, endDate?: string): Promise<ActivityStatsResponse> {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const { data } = await api.get(`/activity-logs/stats?${params.toString()}`)
    return data
  } catch (error: any) {
    if (error?.response?.status !== 403 && error?.response?.status !== 401) {
      if (error?.response?.status >= 500) {
        console.error('Failed to fetch activity stats:', error?.message || error)
      }
    }
    return { totalActions: 0, successCount: 0, failedCount: 0, pendingCount: 0, successRate: 0, categoryStats: [], topActions: [] }
  }
}

async function getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
  try {
    const { data } = await api.get(`/activity-logs/recent?limit=${limit}`)
    return data.logs || []
  } catch (error: any) {
    if (error?.response?.status !== 403 && error?.response?.status !== 401) {
      if (error?.response?.status >= 500) {
        console.error('Failed to fetch recent activity:', error?.message || error)
      }
    }
    return []
  }
}

async function searchActivityLogs(filters: ActivityLogFilters): Promise<ActivityLogListResponse> {
  const params = new URLSearchParams()
  if (filters.query) params.append('query', filters.query)
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) params.append('limit', String(filters.limit))
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.action) params.append('action', filters.action)
  if (filters.category) params.append('category', filters.category)
  if (filters.status) params.append('status', filters.status)
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.tab && filters.tab !== 'all') params.append('logType', filters.tab)
  const { data } = await api.get(`/activity-logs/search?${params.toString()}`)
  return data
}

// ─── hooks ────────────────────────────────────────────────────────────────────

export function useActivityLogs(filters: ActivityLogFilters = {}) {
  return useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: () => getActivityLogs(filters),
    placeholderData: { logs: [], total: 0, page: 1, limit: 20, totalPages: 0 },
    retry: 1,
    staleTime: 30_000,
  })
}

export function useUserActivityLogsByUserId(
  userId: string | undefined,
  page: number = 1,
  limit: number = 20,
) {
  return useQuery({
    queryKey: ['activity-logs', 'user', userId, page, limit],
    queryFn: () => getActivityLogs({ userId: userId!, page, limit }),
    enabled: !!userId && userId.trim() !== '',
    placeholderData: { logs: [], total: 0, page: 1, limit: 20, totalPages: 0 },
    retry: false,
    staleTime: 30_000,
  })
}

export function useActivityStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['activity-stats', startDate, endDate],
    queryFn: () => getActivityStats(startDate, endDate),
    placeholderData: { totalActions: 0, successCount: 0, failedCount: 0, pendingCount: 0, successRate: 0, categoryStats: [], topActions: [] },
    retry: false,
    staleTime: 30_000,
  })
}

export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: () => getRecentActivity(limit),
    placeholderData: [],
    retry: false,
    staleTime: 30_000,
  })
}

export function useSearchActivityLogs(filters: ActivityLogFilters) {
  return useQuery({
    queryKey: ['activity-logs-search', filters],
    queryFn: () => searchActivityLogs(filters),
    enabled: !!filters.query || !!filters.userId || !!filters.category || !!filters.status,
    placeholderData: { logs: [], total: 0, page: 1, limit: 20, totalPages: 0 },
    retry: false,
    staleTime: 30_000,
  })
}
