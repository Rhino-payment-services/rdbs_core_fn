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

// Fetch all activity logs with filters
async function getActivityLogs(filters: ActivityLogFilters = {}): Promise<ActivityLogListResponse> {
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
    return data
  } catch (err: any) {
    // Backwards-compatibility fallback:
    // Some deployments reject pagination/date params due to strict validation (forbidNonWhitelisted).
    // In that case, fall back to endpoints that accept only page/limit (and optionally userId).
    const status = err?.status ?? err?.response?.status
    const validationErrors = err?.data?.errors ?? err?.response?.data?.errors
    const validationText = Array.isArray(validationErrors) ? validationErrors.join(' ') : String(validationErrors ?? '')

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

    if (filters.userId) {
      const { data } = await api.get(`/activity-logs/user/${encodeURIComponent(filters.userId)}?page=${page}&limit=${limit}`)
      return data
    }

    const { data } = await api.get(`/activity-logs/system?page=${page}&limit=${limit}`)
    return data
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
