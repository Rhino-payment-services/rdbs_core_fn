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
  try {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', String(filters.page))
    if (filters.limit) params.append('limit', String(filters.limit))
    if (filters.userId) params.append('userId', filters.userId)
    if (filters.action) params.append('action', filters.action)
    if (filters.category) params.append('category', filters.category)
    if (filters.status) params.append('status', filters.status)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    
    const { data } = await api.get(`/activity-logs?${params.toString()}`)
    return data
  } catch (error: any) {
    // Silently handle permission errors (403) - user may not have access
    if (error?.response?.status === 403 || error?.response?.status === 401) {
      return { logs: [], total: 0, page: 1, limit: 20, totalPages: 0 }
    }
    // Only log non-permission errors
    if (error?.response?.status && error.response.status >= 500) {
      console.error('Failed to fetch activity logs:', error?.message || error)
    }
    return { logs: [], total: 0, page: 1, limit: 20, totalPages: 0 }
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
  try {
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
  } catch (error: any) {
    // Silently handle permission errors
    if (error?.response?.status !== 403 && error?.response?.status !== 401) {
      if (error?.response?.status >= 500) {
        console.error('Failed to search activity logs:', error?.message || error)
      }
    }
    return { logs: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  }
}

// Hooks
export function useActivityLogs(filters: ActivityLogFilters = {}) {
  return useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: () => getActivityLogs(filters),
    placeholderData: { logs: [], total: 0, page: 1, limit: 20, totalPages: 0 },
    retry: false,
    staleTime: 30000, // 30 seconds
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
