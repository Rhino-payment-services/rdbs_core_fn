import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { 
  Merchant,
  ApiResponse,
  PaginatedResponse
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
export const merchantQueryKeys = {
  merchants: ['merchants'] as const,
  merchant: (id: string) => ['merchant', id] as const,
}

// Custom hooks for merchants
export const useMerchants = (filters?: {
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
  return useQuery<ApiResponse<PaginatedResponse<Merchant>>>({
    queryKey: [...merchantQueryKeys.merchants, filters],
    queryFn: () => apiFetch(`/merchants${queryString ? `?${queryString}` : ''}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on 404 errors
    throwOnError: false, // Don't throw errors, handle them gracefully
  })
}

export const useMerchant = (id: string) => {
  return useQuery<ApiResponse<Merchant>>({
    queryKey: merchantQueryKeys.merchant(id),
    queryFn: () => apiFetch(`/merchants/${id}`),
    enabled: !!id,
  })
}

export const useCreateMerchant = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Merchant>, Error, any>({
    mutationFn: (merchantData) => apiFetch('/merchants', {
      method: 'POST',
      data: merchantData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.merchants })
    },
  })
}

export const useUpdateMerchant = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Merchant>, Error, { id: string; merchantData: any }>({
    mutationFn: ({ id, merchantData }) => apiFetch(`/merchants/${id}`, {
      method: 'PUT',
      data: merchantData,
    }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.merchants })
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.merchant(id) })
    },
  })
}

export const useDeleteMerchant = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<void>, Error, string>({
    mutationFn: (id) => apiFetch(`/merchants/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.merchants })
    },
  })
}

export const useSuspendMerchant = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Merchant>, Error, { id: string; reason: string }>({
    mutationFn: ({ id, reason }) => apiFetch(`/merchants/${id}/suspend`, {
      method: 'PATCH',
      data: { reason },
    }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.merchants })
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.merchant(id) })
    },
  })
}

export const useActivateMerchant = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Merchant>, Error, string>({
    mutationFn: (id) => apiFetch(`/merchants/${id}/activate`, {
      method: 'PATCH',
    }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.merchants })
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.merchant(id) })
    },
  })
}
