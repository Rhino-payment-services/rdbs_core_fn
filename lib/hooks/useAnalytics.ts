import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { 
  AnalyticsData,
  AnalyticsFilters,
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
export const analyticsQueryKeys = {
  analytics: ['analytics'] as const,
}

// Custom hooks for analytics
export const useAnalytics = (filters?: AnalyticsFilters) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
  return useQuery<ApiResponse<AnalyticsData>>({
    queryKey: [...analyticsQueryKeys.analytics, filters],
    queryFn: () => apiFetch(`/analytics${queryString ? `?${queryString}` : ''}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
