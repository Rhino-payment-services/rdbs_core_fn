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
  list: ['transactions', 'all'] as const,
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
export const useTransactionSystemStats = (filters?: {
  type?: string;
  status?: string;
  direction?: string;
  currency?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (filters?.type) queryParams.append('type', filters.type);
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.direction) queryParams.append('direction', filters.direction);
  if (filters?.currency) queryParams.append('currency', filters.currency);
  if (filters?.userId) queryParams.append('userId', filters.userId);
  if (filters?.startDate) queryParams.append('startDate', filters.startDate);
  if (filters?.endDate) queryParams.append('endDate', filters.endDate);
  if (filters?.minAmount) queryParams.append('minAmount', filters.minAmount.toString());
  if (filters?.maxAmount) queryParams.append('maxAmount', filters.maxAmount.toString());

  return useQuery({
    queryKey: [...transactionQueryKeys.systemStats, filters],
    queryFn: () => apiFetch(`/transactions/system/stats?${queryParams.toString()}`),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchInterval: false, // No automatic refetching
    retry: 1, // Only retry once on failure
    retryDelay: 3000, // Wait 3 seconds before retry
  })
}

// Hook to get all transactions (admin view)
export const useAllTransactions = (params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.type) queryParams.append('type', params.type);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  return useQuery({
    queryKey: [...transactionQueryKeys.list, params],
    queryFn: () => apiFetch(`/transactions/all?${queryParams.toString()}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading new page
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
    mutationFn: (transferData) => apiFetch('/transactions/process', {
      method: 'POST',
      data: {
        reference: `W2W_${Date.now()}`,
        amount: transferData.amount,
        currency: transferData.currency || 'UGX',
        description: transferData.description || 'Wallet to wallet transfer',
        mode: 'WALLET_TO_WALLET',
        recipientUserId: transferData.recipientUserId
      },
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
    mutationFn: (transferData) => apiFetch('/transactions/process', {
      method: 'POST',
      data: {
        reference: `MNO_${Date.now()}`,
        amount: transferData.amount,
        currency: transferData.currency || 'UGX',
        description: transferData.description || `Send to ${transferData.mnoProvider}`,
        mode: 'WALLET_TO_MNO',
        externalMetadata: {
          phoneNumber: transferData.phoneNumber,
          mnoProvider: transferData.mnoProvider
        }
      },
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
    mutationFn: (transferData) => apiFetch('/transactions/process', {
      method: 'POST',
      data: {
        reference: `BANK_${Date.now()}`,
        amount: transferData.amount,
        currency: transferData.currency || 'UGX',
        description: transferData.description || `Bank transfer to ${transferData.bankCode}`,
        mode: 'MERCHANT_WITHDRAWAL',
        externalMetadata: {
          bankName: transferData.bankCode,
          accountNumber: transferData.accountNumber,
          accountName: transferData.accountName
        }
      },
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
    mutationFn: (paymentData) => apiFetch('/transactions/process', {
      method: 'POST',
      data: {
        reference: `UTIL_${Date.now()}`,
        amount: paymentData.amount,
        currency: 'UGX',
        description: paymentData.description || `Utility payment for ${paymentData.utilityType}`,
        mode: 'UTILITIES',
        externalMetadata: {
          utilityProvider: paymentData.utilityType,
          utilityAccountNumber: paymentData.meterNumber,
          customerRef: paymentData.meterNumber,
          meterNumber: paymentData.meterNumber
        }
      },
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
    mutationFn: (paymentData) => apiFetch('/transactions/process', {
      method: 'POST',
      data: {
        reference: `MERCH_${Date.now()}`,
        amount: paymentData.amount,
        currency: paymentData.currency || 'UGX',
        description: paymentData.description || 'Merchant payment',
        mode: 'WALLET_TO_MERCHANT',
        externalMetadata: {
          merchantId: paymentData.merchantId
        }
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: transactionQueryKeys.stats })
    },
  })
}

// Hook to get channel statistics
export const useChannelStatistics = (startDate?: string, endDate?: string) => {
  const queryParams = new URLSearchParams()
  if (startDate) queryParams.append('startDate', startDate)
  if (endDate) queryParams.append('endDate', endDate)

  return useQuery({
    queryKey: ['transactions', 'channels', 'stats', startDate, endDate],
    queryFn: () => apiFetch(`/transactions/channels/stats?${queryParams.toString()}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Hook to get daily new wallets
export const useDailyNewWallets = (date?: string) => {
  const queryParams = new URLSearchParams()
  if (date) queryParams.append('date', date)

  return useQuery({
    queryKey: ['wallets', 'daily-new', date],
    queryFn: () => apiFetch(`/transactions/wallets/daily-new?${queryParams.toString()}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
