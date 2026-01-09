import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { 
  Wallet, 
  CreateWalletRequest,
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
export const walletQueryKeys = {
  wallets: ['wallets'] as const,
  wallet: (id: string) => ['wallet', id] as const,
}

// Wallet hooks
export const useWallets = () => {
  return useQuery<ApiResponse<Wallet[]>>({
    queryKey: walletQueryKeys.wallets,
    queryFn: () => apiFetch('/wallet'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useWallet = (id: string) => {
  return useQuery({
    queryKey: walletQueryKeys.wallet(id),
    queryFn: () => apiFetch(`/wallet/${id}`),
    enabled: !!id,
  })
}

export const useWalletBalance = (id: string) => {
  return useQuery({
    queryKey: walletQueryKeys.wallet(id),
    queryFn: () => apiFetch(`/wallet/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useCreateWallet = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Wallet>, Error, CreateWalletRequest>({
    mutationFn: (walletData) => apiFetch('/wallet', {
      method: 'POST',
      data: walletData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.wallets })
    },
  })
}

export const useWalletTransactions = (userId: string, page: number = 1, limit: number = 10) => {
  const queryParams = new URLSearchParams({
    userId,
    page: page.toString(),
    limit: limit.toString()
  })
  
  return useQuery({
    queryKey: ['wallet', userId, 'transactions', page, limit],
    queryFn: () => apiFetch(`/wallet/${userId}/transactions?${queryParams}`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Admin wallet hooks - Get all wallets for admin view with filtering and search
export const useAdminWallets = (filters?: {
  category?: 'PERSONAL' | 'BUSINESS' | 'SYSTEM' | 'OTHER'
  search?: string
  walletType?: string
  currency?: string
  isActive?: boolean
  isSuspended?: boolean
  page?: number
  limit?: number
}) => {
  const queryString = filters ? new URLSearchParams(
    Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString() : ''
  
  return useQuery({
    queryKey: ['admin', 'wallets', filters],
    queryFn: async () => {
      try {
        const endpoint = `/wallet/admin/all${queryString ? `?${queryString}` : ''}`
        console.log('Fetching admin wallets from:', endpoint)
        // Use the new admin endpoint that returns all wallets with categorization
        const response = await apiFetch(endpoint)
        console.log('Admin wallets response:', response)
        
        // Ensure response has the expected structure
        if (response && typeof response === 'object') {
          // If response already has wallets array, return as is
          if (Array.isArray(response.wallets)) {
            return response
          }
          // If response is the wallets array directly, wrap it
          if (Array.isArray(response)) {
            return { wallets: response, total: response.length, categoryStats: {} }
          }
        }
        
        return response
      } catch (error: any) {
        console.error('Error fetching admin wallets:', error)
        
        // If 404, try fallback to finance endpoints
        if (error?.status === 404) {
          console.warn('Admin endpoint not available, trying finance endpoints as fallback...')
          try {
            const [companyResponse, partnerResponse] = await Promise.all([
              apiFetch('/finance/wallets/company?limit=1000').catch(() => ({ wallets: [] })),
              apiFetch('/finance/wallets/partner?limit=1000').catch(() => ({ wallets: [] }))
            ])
            
            const companyWallets = Array.isArray(companyResponse?.wallets) ? companyResponse.wallets : []
            const partnerWallets = Array.isArray(partnerResponse?.wallets) ? partnerResponse.wallets : []
            const allWallets = [...companyWallets, ...partnerWallets]
            
            console.log('Fallback: Found wallets from finance endpoints:', allWallets.length)
            
            return {
              wallets: allWallets,
              total: allWallets.length,
              page: 1,
              limit: 1000,
              totalPages: 1,
              categoryStats: {}
            }
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError)
            return { wallets: [], total: 0, page: 1, limit: 50, totalPages: 0, categoryStats: {} }
          }
        }
        
        // If 403, user might not have admin permissions
        if (error?.status === 403) {
          console.warn('Could not fetch admin wallets - may not have permissions')
          return { wallets: [], total: 0, page: 1, limit: 50, totalPages: 0, categoryStats: {} }
        }
        
        // For other errors, throw to be handled by error boundary
        throw error
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false, // Don't retry on 404/403
  })
}

// Fund wallet mutation
export const useFundWallet = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Wallet>, Error, { walletId: string; amount: number; reason: string; reference?: string }>({
    mutationFn: ({ walletId, amount, reason, reference }) => apiFetch(`/wallet/admin/${walletId}/fund`, {
      method: 'POST',
      data: { amount, reason, reference },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] })
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.wallets })
    },
  })
}

export const useUpdateWalletBalance = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Wallet>, Error, { walletId: string; amount: number; reason?: string }>({
    mutationFn: ({ walletId, amount, reason }) => apiFetch(`/admin/wallets/${walletId}/balance`, {
      method: 'PATCH',
      data: { amount, reason },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] })
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.wallets })
    },
  })
}

export const useSuspendWallet = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Wallet>, Error, { walletId: string; reason?: string }>({
    mutationFn: ({ walletId, reason }) => apiFetch(`/admin/wallets/${walletId}/suspend`, {
      method: 'PATCH',
      data: { reason },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] })
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.wallets })
    },
  })
}

export const useUpdateDailyLimit = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<any>, Error, { walletId: string; dailyLimit: number; reason?: string }>({
    mutationFn: ({ walletId, dailyLimit, reason }) => apiFetch(`/wallet/admin/${walletId}/daily-limit`, {
      method: 'PATCH',
      data: { dailyLimit, reason },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] })
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.wallets })
    },
  })
}

// System Fee Wallet hooks
export interface CreateSystemFeeWalletRequest {
  currency?: string
  partnerId?: string
  description?: string
}

export interface SystemFeeWalletResponse {
  id: string
  userId: string
  partnerId?: string
  balance: number
  currency: string
  walletType: string
  description?: string
  createdAt: Date
}

export interface WithdrawSystemFeeWalletRequest {
  amount: number
  destinationAccount: string
  destinationBank?: string
  narration?: string
}

export const useCreateSystemFeeWallet = () => {
  const queryClient = useQueryClient()
  return useMutation<SystemFeeWalletResponse, Error, CreateSystemFeeWalletRequest>({
    mutationFn: (data) => apiFetch('/admin/system-wallets', {
      method: 'POST',
      data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] })
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.wallets })
    },
  })
}

export const useWithdrawSystemFeeWallet = () => {
  const queryClient = useQueryClient()
  return useMutation<any, Error, WithdrawSystemFeeWalletRequest>({
    mutationFn: (data) => apiFetch('/wallet/system-fee/withdraw', {
      method: 'POST',
      data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] })
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.wallets })
    },
  })
}

export const useSystemFeeWalletBalance = () => {
  return useQuery({
    queryKey: ['system-fee-wallet', 'balance'],
    queryFn: () => apiFetch('/wallet/system-fee/balance'),
    staleTime: 30 * 1000, // 30 seconds
  })
}
