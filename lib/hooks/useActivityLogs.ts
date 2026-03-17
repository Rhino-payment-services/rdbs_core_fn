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
  /** UI tab selection. Used client-side for backward-compatible filtering when backend can't filter. */
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

function isInternalLog(log: ActivityLog) {
  const role = (log.userDetails?.role || '').toUpperCase()
  const userType = (log.userDetails?.userType || '').toUpperCase()
  const email = (log.userEmail || log.userDetails?.email || '').toLowerCase()
  const channel = (log.channel || '').toUpperCase()

  if (userType === 'STAFF') return true
  if (role.includes('ADMIN')) return true
  if (email.endsWith('@rukapay.co.ug')) return true
  if (channel === 'BACKOFFICE') return true
  return false
}

function matchesTab(log: ActivityLog, tab: ActivityLogFilters['tab']) {
  if (!tab || tab === 'all') return true
  const internal = isInternalLog(log)
  return tab === 'internal' ? internal : !internal
}

function inTimeRange(log: ActivityLog, startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return true
  const t = new Date(log.createdAt).getTime()
  if (Number.isNaN(t)) return false
  if (startDate) {
    const s = new Date(startDate).getTime()
    if (!Number.isNaN(s) && t < s) return false
  }
  if (endDate) {
    const e = new Date(endDate).getTime()
    if (!Number.isNaN(e) && t > e) return false
  }
  return true
}

// Fetch all activity logs with filters
async function getActivityLogs(filters: ActivityLogFilters = {}): Promise<ActivityLogListResponse> {
  const tab = filters.tab || 'all'
  const params = new URLSearchParams()
  if (filters.page) params.append('page', String(filters.page))
  if (filters.limit) params.append('limit', String(filters.limit))
  if (filters.userId) params.append('userId', filters.userId)
  if (filters.action) params.append('action', filters.action)
  if (filters.category) params.append('category', filters.category)
  if (filters.status) params.append('status', filters.status)
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)

  try {
    const { data } = await api.get(`/activity-logs?${params.toString()}`)
    // If backend supports filtering/pagination, still apply tab/time filtering client-side
    // so Customer/Internal tabs behave consistently.
    const filtered = (data.logs || []).filter((l: ActivityLog) => matchesTab(l, tab) && inTimeRange(l, filters.startDate, filters.endDate))
    return { ...data, logs: filtered }
  } catch (err: any) {
    // Backwards-compatibility fallback:
    // Some deployments reject pagination/date params due to strict validation (forbidNonWhitelisted).
    // In that case, fall back to endpoints that accept only page/limit (and optionally userId).
    const status = err?.status ?? err?.response?.status
    const validationErrors = err?.data?.errors ?? err?.response?.data?.errors
    const validationTextFromErrors = Array.isArray(validationErrors) ? validationErrors.join(' ') : String(validationErrors ?? '')
    const validationText = `${err?.message ?? ''} ${err?.data?.message ?? ''} ${err?.response?.data?.message ?? ''} ${validationTextFromErrors}`.trim()

    const looksLikeForbiddenNonWhitelisted =
      status === 400 &&
      (validationText.includes('property page should not exist') ||
        validationText.includes('property limit should not exist') ||
        validationText.includes('property startDate should not exist') ||
        validationText.includes('property endDate should not exist') ||
        validationText.includes('should not exist'))

    if (!looksLikeForbiddenNonWhitelisted) throw err

    const page = filters.page ?? 1
    const limit = filters.limit ?? 20

    // If we need Customer/Internal and backend can't filter, we must fetch enough rows and filter client-side.
    // We do a bounded scan across system pages to populate the requested UI page.
    const desiredStart = (page - 1) * limit
    const desiredEnd = desiredStart + limit
    const rawPageSize = 100
    const maxPagesToScan = 25 // safety cap to avoid excessive calls

    const fetchSystemPage = async (p: number) => {
      const { data } = await api.get(`/activity-logs/system?page=${p}&limit=${rawPageSize}`)
      return data as ActivityLogListResponse
    }

    if (filters.userId) {
      // User-specific endpoint supports page/limit only; apply tab/time range filtering.
      const { data } = await api.get(`/activity-logs/user/${encodeURIComponent(filters.userId)}?page=${page}&limit=${rawPageSize}`)
      const logs = (data.logs || []).filter((l: ActivityLog) => matchesTab(l, tab) && inTimeRange(l, filters.startDate, filters.endDate))
      return { ...data, logs: logs.slice(0, limit), page, limit }
    }

    const collected: ActivityLog[] = []
    let total = 0
    let totalPages = 0
    for (let p = 1; p <= maxPagesToScan; p++) {
      const resp = await fetchSystemPage(p)
      total = resp.total
      totalPages = resp.totalPages
      const pageLogs = (resp.logs || []).filter((l: ActivityLog) => matchesTab(l, tab) && inTimeRange(l, filters.startDate, filters.endDate))
      collected.push(...pageLogs)
      if (collected.length >= desiredEnd) break
      if (totalPages && p >= totalPages) break
    }

    const sliced = collected.slice(desiredStart, desiredEnd)
    return {
      logs: sliced,
      total,
      page,
      limit,
      totalPages: totalPages || Math.ceil(total / limit),
    }
  }
}

// Fetch activity stats
async function getActivityStats(startDate?: string, endDate?: string): Promise<ActivityStatsResponse> {
  try {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const { data } = await api.get(`/activity-logs/stats?${params.toString()}`)
    return data
  } catch (error: any) {
    // Silently handle permission errors
    if (error?.response?.status !== 403 && error?.response?.status !== 401) {
      if (error?.response?.status >= 500) {
        console.error('Failed to fetch activity stats:', error?.message || error)
      }
    }
    return {
      totalActions: 0,
      successCount: 0,
      failedCount: 0,
      pendingCount: 0,
      successRate: 0,
      categoryStats: [],
      topActions: []
    }
  }
}

// Fetch recent activity logs
async function getRecentActivity(limit: number = 10): Promise<ActivityLog[]> {
  try {
    const { data } = await api.get(`/activity-logs/recent?limit=${limit}`)
    return data.logs || []
  } catch (error: any) {
    // Silently handle permission errors
    if (error?.response?.status !== 403 && error?.response?.status !== 401) {
      if (error?.response?.status >= 500) {
        console.error('Failed to fetch recent activity:', error?.message || error)
      }
    }
    return []
  }
}

// Search activity logs
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

  const { data } = await api.get(`/activity-logs/search?${params.toString()}`)
  return data
}

// Hooks
export function useActivityLogs(filters: ActivityLogFilters = {}) {
  return useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: () => getActivityLogs(filters),
    placeholderData: { logs: [], total: 0, page: 1, limit: 20, totalPages: 0 },
    retry: 1,
    staleTime: 30000, // 30 seconds
  })
}

/** Fetch activity logs for a specific user (GET /activity-logs?userId=...). Use for customer profile; degrades to empty on 403. */
export function useUserActivityLogsByUserId(
  userId: string | undefined,
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['activity-logs', 'user', userId, page, limit],
    queryFn: () => getActivityLogs({ userId: userId!, page, limit }),
    enabled: !!userId && userId.trim() !== '',
    placeholderData: { logs: [], total: 0, page: 1, limit: 20, totalPages: 0 },
    retry: false,
    staleTime: 30000,
  })
}

export function useActivityStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['activity-stats', startDate, endDate],
    queryFn: () => getActivityStats(startDate, endDate),
    placeholderData: {
      totalActions: 0,
      successCount: 0,
      failedCount: 0,
      pendingCount: 0,
      successRate: 0,
      categoryStats: [],
      topActions: []
    },
    retry: false,
    staleTime: 30000,
  })
}

export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: () => getRecentActivity(limit),
    placeholderData: [],
    retry: false,
    staleTime: 30000,
  })
}

export function useSearchActivityLogs(filters: ActivityLogFilters) {
  return useQuery({
    queryKey: ['activity-logs-search', filters],
    queryFn: () => searchActivityLogs(filters),
    enabled: !!filters.query || !!filters.userId || !!filters.category || !!filters.status,
    placeholderData: { logs: [], total: 0, page: 1, limit: 20, totalPages: 0 },
    retry: false,
    staleTime: 30000,
  })
}
