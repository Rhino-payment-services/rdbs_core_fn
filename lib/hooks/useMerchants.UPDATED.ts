/**
 * Updated useMerchants hook for new merchant-kyc endpoints
 * 
 * CHANGES FROM ORIGINAL:
 * - Uses /merchant-kyc/all instead of /merchants
 * - Added new filter parameters (kycStatus, verificationLevel, city)
 * - Added useMerchantStatistics hook
 * - Added useMyMerchants hook
 * - Added useMerchantById hook
 * - Updated response types
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse } from '@/lib/types/api'

// Updated types for new merchant endpoints
interface Merchant {
  id: string;
  merchantCode: string;
  businessTradeName: string;
  businessType: string;
  phone: string;
  email: string;
  kycStatus: string;
  verificationLevel: string;
  canTransact: boolean;
  city: string;
  walletBalance?: number;
  onboardedAt: Date;
  onboardedByName?: string;
  createdAt: Date;
}

interface MerchantListResponse {
  merchants: Merchant[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface MerchantStatistics {
  total: number;
  byStatus: Record<string, number>;
  byVerificationLevel: Record<string, number>;
  byBusinessType: Record<string, number>;
  byCity: Record<string, number>;
  recentlyOnboarded: number;
  canTransact: number;
  verifiedMerchants: number;
}

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
  myMerchants: ['my-merchants'] as const,
  statistics: ['merchant-statistics'] as const,
}

/**
 * Get all merchants with pagination and filtering
 * NEW ENDPOINT: /merchant-kyc/all
 */
export const useMerchants = (filters?: {
  kycStatus?: string;           // Changed from 'status'
  verificationLevel?: string;   // NEW
  search?: string;
  city?: string;                // NEW
  page?: number;
  pageSize?: number;            // Changed from 'limit'
}) => {
  const queryString = filters 
    ? new URLSearchParams(filters as Record<string, string>).toString() 
    : ''
  
  return useQuery<MerchantListResponse>({
    queryKey: [...merchantQueryKeys.merchants, filters],
    queryFn: () => apiFetch(`/merchant-kyc/all${queryString ? `?${queryString}` : ''}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    throwOnError: false,
  })
}

/**
 * Get merchants onboarded by current user
 * NEW HOOK
 */
export const useMyMerchants = (page?: number, pageSize?: number) => {
  const params = new URLSearchParams()
  if (page) params.append('page', page.toString())
  if (pageSize) params.append('pageSize', pageSize.toString())
  
  return useQuery<MerchantListResponse>({
    queryKey: [...merchantQueryKeys.myMerchants, page, pageSize],
    queryFn: () => apiFetch(`/merchant-kyc/my-merchants?${params.toString()}`),
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  })
}

/**
 * Get merchant statistics for dashboard
 * NEW HOOK
 */
export const useMerchantStatistics = () => {
  return useQuery<MerchantStatistics>({
    queryKey: merchantQueryKeys.statistics,
    queryFn: () => apiFetch('/merchant-kyc/statistics'),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
    throwOnError: false,
  })
}

/**
 * Get single merchant by ID
 * NEW HOOK - uses merchant-kyc/:id/status endpoint
 */
export const useMerchantById = (merchantId: string) => {
  return useQuery({
    queryKey: merchantQueryKeys.merchant(merchantId),
    queryFn: () => apiFetch(`/merchant-kyc/${merchantId}/status`),
    enabled: !!merchantId,
    retry: false,
    throwOnError: false,
  })
}

/**
 * Create merchant
 * NOTE: This should use the merchant onboarding form, not called directly
 * The form uses /merchant-kyc/create endpoint
 */
export const useCreateMerchant = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<any>, Error, any>({
    mutationFn: (merchantData) => apiFetch('/merchant-kyc/create', {
      method: 'POST',
      data: merchantData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.merchants })
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.statistics })
    },
  })
}

// Note: The following hooks (update, delete, suspend, activate) may need 
// new endpoints or might not be applicable with the new structure.
// Keep them for now but they might need backend endpoints created.

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
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.statistics })
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
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.statistics })
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
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.statistics })
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
      queryClient.invalidateQueries({ queryKey: merchantQueryKeys.statistics })
    },
  })
}

