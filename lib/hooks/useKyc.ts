import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { 
  KycStatus,
  UpdateKycRequest,
  KycStats,
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
export const kycQueryKeys = {
  kyc: ['kyc'] as const,
  status: ['kyc', 'status'] as const,
  stats: ['kyc', 'stats'] as const,
  submissions: ['kyc', 'submissions'] as const,
  submission: (id: string) => ['kyc', 'submission', id] as const,
}

// KYC hooks
export const useKycStatus = () => {
  return useQuery<ApiResponse<KycStatus>>({
    queryKey: kycQueryKeys.status,
    queryFn: () => apiFetch('/kyc/status'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useKycStats = () => {
  return useQuery<ApiResponse<KycStats>>({
    queryKey: kycQueryKeys.stats,
    queryFn: () => apiFetch('/kyc/stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on 404 errors
    throwOnError: false, // Don't throw errors, handle them gracefully
  })
}

export const useKycSubmissions = (filters?: {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  verificationLevel?: 'BASIC' | 'STANDARD' | 'ENHANCED' | 'PREMIUM';
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
  return useQuery<ApiResponse<PaginatedResponse<any>>>({
    queryKey: [...kycQueryKeys.submissions, filters],
    queryFn: () => apiFetch(`/kyc/submissions${queryString ? `?${queryString}` : ''}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useKycSubmission = (id: string) => {
  return useQuery<ApiResponse<any>>({
    queryKey: kycQueryKeys.submission(id),
    queryFn: () => apiFetch(`/kyc/submissions/${id}`),
    enabled: !!id,
  })
}

export const useUpdateKycProfile = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<KycStatus>, Error, UpdateKycRequest>({
    mutationFn: (kycData) => apiFetch('/kyc/update-profile', {
      method: 'POST',
      data: kycData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.status })
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
    },
  })
}

export const useApproveKycSubmission = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<any>, Error, { id: string; verificationLevel: string; notes?: string }>({
    mutationFn: ({ id, verificationLevel, notes }) => apiFetch(`/kyc/submissions/${id}/approve`, {
      method: 'POST',
      data: { verificationLevel, notes },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.submissions })
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.stats })
    },
  })
}

export const useRejectKycSubmission = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<any>, Error, { id: string; reason: string; notes?: string }>({
    mutationFn: ({ id, reason, notes }) => apiFetch(`/kyc/submissions/${id}/reject`, {
      method: 'POST',
      data: { reason, notes },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.submissions })
      queryClient.invalidateQueries({ queryKey: kycQueryKeys.stats })
    },
  })
}
