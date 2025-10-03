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

// Admin wallet hooks
export const useAdminWallets = () => {
  return useQuery<ApiResponse<Wallet[]>>({
    queryKey: ['admin', 'wallets'],
    queryFn: () => apiFetch('/admin/wallets'),
    staleTime: 2 * 60 * 1000, // 2 minutes
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
