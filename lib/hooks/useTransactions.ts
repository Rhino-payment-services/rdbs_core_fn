import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { 
  Transaction, 
  TransactionStats,
  TransactionSystemStats,
  TransactionFilters,
  WalletToWalletRequest,
  MnoTransactionRequest,
  BankTransactionRequest,
  UtilityTransactionRequest,
  MerchantTransactionRequest,
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
export const transactionQueryKeys = {
  transactions: ['transactions'] as const,
  transaction: (id: string) => ['transaction', id] as const,
  stats: ['transactions', 'stats'] as const,
  systemStats: ['transactions', 'system', 'stats'] as const,
}

// Custom hooks for transactions
export const useTransactions = (filters?: TransactionFilters) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
  return useQuery<ApiResponse<PaginatedResponse<Transaction>>>({
    queryKey: [...transactionQueryKeys.transactions, filters],
    queryFn: () => apiFetch(`/transactions/my-transactions${queryString ? `?${queryString}` : ''}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useTransaction = (id: string) => {
  return useQuery<ApiResponse<Transaction>>({
    queryKey: transactionQueryKeys.transaction(id),
    queryFn: () => apiFetch(`/transactions/${id}`),
    enabled: !!id,
  })
}

// Hook to get transaction system stats
export const useTransactionSystemStats = () => {
  return useQuery({
    queryKey: transactionQueryKeys.systemStats,
    queryFn: () => apiFetch('/transactions/system/stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useTransactionStats = () => {
  return useQuery<ApiResponse<TransactionStats>>({
    queryKey: transactionQueryKeys.stats,
    queryFn: () => apiFetch('/transactions/my-stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useSystemTransactionStats = () => {
  return useQuery<ApiResponse<TransactionStats>>({
    queryKey: transactionQueryKeys.systemStats,
    queryFn: () => apiFetch('/transactions/system/stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Transaction mutation hooks
export const useWalletToWalletTransfer = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Transaction>, Error, WalletToWalletRequest>({
    mutationFn: (transferData) => apiFetch('/transactions/wallet-to-wallet', {
      method: 'POST',
      data: transferData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.stats })
    },
  })
}

export const useSendToMno = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Transaction>, Error, MnoTransactionRequest>({
    mutationFn: (transferData) => apiFetch('/transactions/send-to-mno', {
      method: 'POST',
      data: transferData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.stats })
    },
  })
}

export const useSendToBank = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Transaction>, Error, BankTransactionRequest>({
    mutationFn: (transferData) => apiFetch('/transactions/send-to-bank', {
      method: 'POST',
      data: transferData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.stats })
    },
  })
}

export const usePayUtility = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Transaction>, Error, UtilityTransactionRequest>({
    mutationFn: (paymentData) => apiFetch('/transactions/pay-utility', {
      method: 'POST',
      data: paymentData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.stats })
    },
  })
}

export const usePayMerchant = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Transaction>, Error, MerchantTransactionRequest>({
    mutationFn: (paymentData) => apiFetch('/transactions/pay-merchant', {
      method: 'POST',
      data: paymentData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.stats })
    },
  })
}
