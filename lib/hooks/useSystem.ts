import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { 
  SystemStats,
  SystemLog,
  SystemLogsResponse,
  TransactionSystemStats,
  ApiResponse
} from '@/lib/types/api'

// Generic API wrapper using centralized Axios instance
const apiFetch = async (endpoint: string, options: any = {}) => {
  try {
    const response = await api({
      url: endpoint,
      method: options.method || 'GET',
      data: options.data,
      ...options,
    })
    
    return response.data
  } catch (error: unknown) {
    // Error is already handled by Axios interceptors
    throw error
  }
}

// Query keys for better cache management
export const systemQueryKeys = {
  systemLogs: ['systemLogs'] as const,
  systemLog: (logId: string) => ['systemLog', logId] as const,
  stats: ['admin', 'system', 'stats'] as const,
  activityLogs: ['activity-logs'] as const,
}

// System hooks
export const useSystemStats = () => {
  return useQuery<ApiResponse<SystemStats>>({
    queryKey: systemQueryKeys.stats,
    queryFn: () => apiFetch('/transactions/system/stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on 404 errors
    throwOnError: false, // Don't throw errors, handle them gracefully
  })
}

export const useSystemLogs = (filters?: { 
  startDate?: string; 
  endDate?: string; 
  status?: 'SUCCESS' | 'FAILED' | 'PENDING';
  category?: string;
  limit?: number;
  page?: number;
}) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
  return useQuery<SystemLogsResponse>({
    queryKey: [...systemQueryKeys.systemLogs, filters],
    queryFn: () => apiFetch(`/activity-logs/system${queryString ? `?${queryString}` : ''}`),
    staleTime: 1 * 60 * 1000, // 1 minute - logs change frequently
  })
}

export const useSystemLog = (logId: string) => {
  return useQuery<ApiResponse<SystemLog>>({
    queryKey: [...systemQueryKeys.systemLogs, logId],
    queryFn: () => apiFetch(`/activity-logs/system/${logId}`),
    enabled: !!logId,
  })
} 

export const useSystemLogsStats = (filters?: { 
  startDate?: string; 
  endDate?: string; 
}) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
  return useQuery<ApiResponse<TransactionSystemStats>>({
    queryKey: [...systemQueryKeys.systemLogs, 'stats', filters],
    queryFn: () => apiFetch(`/activity-logs/stats${queryString ? `?${queryString}` : ''}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useActivityLogs = () => {
  return useQuery<ApiResponse<SystemLogsResponse>>({
    queryKey: [...systemQueryKeys.systemLogs, 'activity'],
    queryFn: () => apiFetch(`/activity-logs`),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useUserActivityLogs = (userId: string, page: number = 1, limit: number = 10) => {
  const queryParams = new URLSearchParams({
    userId,
    page: page.toString(),
    limit: limit.toString()
  })
  
  return useQuery<{
    logs: any[]
    total: number
    page: number
    limit: number
  }>({
    queryKey: ['activity-logs', userId, page, limit],
    queryFn: () => apiFetch(`/activity-logs/user/${userId}?${queryParams}`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
