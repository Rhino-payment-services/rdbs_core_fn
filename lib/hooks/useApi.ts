import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  Transaction, 
  Customer, 
  AnalyticsData, 
  Notification,
  ApiResponse,
  PaginatedResponse,
  TransactionFilters,
  CustomerFilters,
  AnalyticsFilters,
  Role,
  Permission,
  CreateRoleRequest,
  AssignRoleRequest,
  PermissionsResponse,
  Wallet,
  CreateWalletRequest,
  WalletBalance,
  TransactionStats,
  WalletToWalletRequest,
  MnoTransactionRequest,
  BankTransactionRequest,
  UtilityTransactionRequest,
  MerchantTransactionRequest,
  KycStatus,
  UpdateKycRequest,
  KycApproval,
  SystemLog,
  SystemLogsResponse,
  TransactionSystemStats
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
  } catch (error: any) {
    // Error is already handled by Axios interceptors
    throw error
  }
}

// Query keys for better cache management
export const queryKeys = {
  transactions: ['transactions'] as const,
  users: ['users'] as const,
  customers: ['customers'] as const,
  analytics: ['analytics'] as const,
  notifications: ['notifications'] as const,
  systemLogs: ['systemLogs'] as const,
  user: (id: string) => ['user', id] as const,
  customer: (type: string, id: string) => ['customer', type, id] as const,
  transaction: (id: string) => ['transaction', id] as const,
}

// Custom hooks for transactions
export const useTransactions = (filters?: TransactionFilters) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
  return useQuery<ApiResponse<PaginatedResponse<Transaction>>>({
    queryKey: [...queryKeys.transactions, filters],
    queryFn: () => apiFetch(`/transactions/my-transactions${queryString ? `?${queryString}` : ''}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useTransaction = (id: string) => {
  return useQuery<ApiResponse<Transaction>>({
    queryKey: queryKeys.transaction(id),
    queryFn: () => apiFetch(`/transactions/${id}`),
    enabled: !!id,
  })
}

// Hook to get transaction system stats
export const useTransactionSystemStats = () => {
  return useQuery<ApiResponse<TransactionSystemStats>>({
    queryKey: [...queryKeys.transactions, 'system', 'stats'],
    queryFn: () => apiFetch('/transactions/system/stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Custom hooks for users
export const useUsers = () => {
  return useQuery<ApiResponse<User[]>>({
    queryKey: queryKeys.users,
    queryFn: () => apiFetch('/users'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useUser = (id: string) => {
  return useQuery<ApiResponse<User>>({
    queryKey: queryKeys.user(id),
    queryFn: () => apiFetch(`/users/${id}`),
    enabled: !!id,
  })
}

// Hook to get current user profile
export const useProfile = () => {
  return useQuery<ApiResponse<User>>({
    queryKey: ['profile', 'me'],
    queryFn: () => apiFetch('/users/me'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to get roles
export const useRoles = () => {
  return useQuery<{ roles: Role[] }>({
    queryKey: ['roles'],
    queryFn: () => apiFetch('/roles'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook to get permissions
export const usePermissions = () => {
  return useQuery<PermissionsResponse>({
    queryKey: ['permissions'],
    queryFn: () => apiFetch('/roles/permissions'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook to create role
export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Role>, Error, CreateRoleRequest>({
    mutationFn: (roleData) => apiFetch('/roles', {
      method: 'POST',
      data: roleData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

// Hook to assign role to user
export const useAssignRole = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Role>, Error, AssignRoleRequest>({
    mutationFn: (roleData) => apiFetch('/roles/assign', {
      method: 'POST',
      data: roleData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

// Hook to update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      apiFetch(`/users/${userId}/role`, {
        method: 'PATCH',
        data: { roleId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

// Hook to remove role from user
export const useRemoveRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      apiFetch(`/roles/remove/${userId}/${roleId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

// Hook to assign permissions to user
export const useAssignPermissions = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      apiFetch(`/users/${userId}/permissions`, {
        method: 'PUT',
        data: { permissions },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

// Custom hooks for customers
export const useCustomers = (filters?: CustomerFilters) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
  return useQuery<ApiResponse<PaginatedResponse<Customer>>>({
    queryKey: [...queryKeys.customers, filters],
    queryFn: () => apiFetch(`/customers${queryString ? `?${queryString}` : ''}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCustomer = (type: string, id: string) => {
  return useQuery<ApiResponse<Customer>>({
    queryKey: queryKeys.customer(type, id),
    queryFn: () => apiFetch(`/customers/${type}/${id}`),
    enabled: !!type && !!id,
  })
}

// Custom hooks for analytics
export const useAnalytics = (filters?: AnalyticsFilters) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
  return useQuery<ApiResponse<AnalyticsData>>({
    queryKey: [...queryKeys.analytics, filters],
    queryFn: () => apiFetch(`/analytics${queryString ? `?${queryString}` : ''}`),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Custom hooks for notifications
export const useNotifications = () => {
  return useQuery<ApiResponse<Notification[]>>({
    queryKey: queryKeys.notifications,
    queryFn: () => apiFetch('/notifications'),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  })
}

// Mutation hooks
export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<User>, Error, CreateUserRequest>({
    mutationFn: (userData) => apiFetch('/admin/users', {
      method: 'POST',
      data: userData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<User>, Error, { id: string; userData: UpdateUserRequest }>({
    mutationFn: ({ id, userData }) => 
      apiFetch(`/users/${id}`, {
        method: 'PUT',
        data: userData,
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<void>, Error, string>({
    mutationFn: (id) => apiFetch(`/users/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users })
      queryClient.removeQueries({ queryKey: queryKeys.user(id) })
    },
  })
}

// Utility hook for optimistic updates
export const useOptimisticUpdate = <T>(
  queryKey: readonly unknown[],
  updateFn: (oldData: T | undefined) => T
) => {
  const queryClient = useQueryClient()
  
  return (newData: T) => {
    queryClient.setQueryData(queryKey, updateFn)
  }
}

// ===== WALLET HOOKS =====

export const useWallets = () => {
  return useQuery<ApiResponse<Wallet[]>>({
    queryKey: ['wallets'],
    queryFn: () => apiFetch('/wallet'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useWallet = (id: string) => {
  return useQuery<ApiResponse<Wallet>>({
    queryKey: ['wallet', id],
    queryFn: () => apiFetch(`/wallet/${id}`),
    enabled: !!id,
  })
}

export const useWalletBalance = (id: string) => {
  return useQuery<ApiResponse<WalletBalance>>({
    queryKey: ['wallet', id, 'balance'],
    queryFn: () => apiFetch(`/wallet/${id}/balance`),
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
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
  })
}

// ===== TRANSACTION HOOKS =====

export const useTransactionStats = () => {
  return useQuery<ApiResponse<TransactionStats>>({
    queryKey: ['transactions', 'stats'],
    queryFn: () => apiFetch('/transactions/my-stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useSystemTransactionStats = () => {
  return useQuery<ApiResponse<TransactionStats>>({
    queryKey: ['transactions', 'system', 'stats'],
    queryFn: () => apiFetch('/transactions/system/stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useWalletToWalletTransfer = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Transaction>, Error, WalletToWalletRequest>({
    mutationFn: (transferData) => apiFetch('/transactions/wallet-to-wallet', {
      method: 'POST',
      data: transferData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['transactions', 'stats'] })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['transactions', 'stats'] })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['transactions', 'stats'] })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['transactions', 'stats'] })
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
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions })
      queryClient.invalidateQueries({ queryKey: ['wallets'] })
      queryClient.invalidateQueries({ queryKey: ['transactions', 'stats'] })
    },
  })
}

// ===== KYC HOOKS =====

export const useKycStatus = () => {
  return useQuery<ApiResponse<KycStatus>>({
    queryKey: ['kyc', 'status'],
    queryFn: () => apiFetch('/kyc/status'),
    staleTime: 10 * 60 * 1000, // 10 minutes
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
      queryClient.invalidateQueries({ queryKey: ['kyc', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
    },
  })
} 

// Admin-specific hooks for internal dashboard
export const useAdminUsers = () => {
  return useQuery<ApiResponse<User[]>>({
    queryKey: ['admin', 'users'],
    queryFn: () => apiFetch('/users'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAdminUserTransactions = (userId: string) => {
  return useQuery<ApiResponse<PaginatedResponse<Transaction>>>({
    queryKey: ['admin', 'user', userId, 'transactions'],
    queryFn: () => apiFetch(`/transactions/user/${userId}/transactions`),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useAdminUserStats = (userId: string) => {
  return useQuery<ApiResponse<TransactionStats>>({
    queryKey: ['admin', 'user', userId, 'stats'],
    queryFn: () => apiFetch(`/transactions/user/${userId}/stats`),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useSystemStats = () => {
  return useQuery<ApiResponse<TransactionStats>>({
    queryKey: ['admin', 'system', 'stats'],
    queryFn: () => apiFetch('/transactions/system/stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useAdminWallets = () => {
  return useQuery<ApiResponse<Wallet[]>>({
    queryKey: ['admin', 'wallets'],
    queryFn: () => apiFetch('/wallet'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useAdminWallet = (walletId: string) => {
  return useQuery<ApiResponse<Wallet>>({
    queryKey: ['admin', 'wallet', walletId],
    queryFn: () => apiFetch(`/wallet/${walletId}`),
    enabled: !!walletId,
  })
}

export const useUpdateWalletBalance = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Wallet>, Error, { walletId: string; amount: number; currency: string; reason: string }>({
    mutationFn: ({ walletId, amount, currency, reason }) => 
      apiFetch(`/wallet/${walletId}/balance`, {
        method: 'PATCH',
        data: { amount, currency, reason },
      }),
    onSuccess: (_, { walletId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet', walletId] })
    },
  })
}

export const useSuspendWallet = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Wallet>, Error, { walletId: string; reason: string }>({
    mutationFn: ({ walletId, reason }) => 
      apiFetch(`/wallet/${walletId}/suspend`, {
        method: 'PATCH',
        data: { reason },
      }),
    onSuccess: (_, { walletId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallet', walletId] })
    },
  })
}

export const useAdminKycApprovals = () => {
  return useQuery<ApiResponse<KycApproval[]>>({
    queryKey: ['admin', 'kyc', 'approvals'],
    queryFn: () => apiFetch('/kyc/admin/pending'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useApproveKyc = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<KycStatus>, Error, { userId: string; status: 'APPROVED' | 'REJECTED'; reason?: string }>({
    mutationFn: ({ userId, status, reason }) => 
      apiFetch(`/kyc/admin/${userId}/approve`, {
        method: 'POST',
        data: { status, reason },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc', 'approvals'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
} 

// System logs hooks
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
    queryKey: [...queryKeys.systemLogs, filters],
    queryFn: () => apiFetch(`/activity-logs/system${queryString ? `?${queryString}` : ''}`),
    staleTime: 1 * 60 * 1000, // 1 minute - logs change frequently
  })
}

export const useSystemLog = (logId: string) => {
  return useQuery<ApiResponse<SystemLog>>({
    queryKey: [...queryKeys.systemLogs, logId],
    queryFn: () => apiFetch(`/activity-logs/system/${logId}`),
    enabled: !!logId,
  })
} 

export const useSystemLogsStats = (filters?: { 
  startDate?: string; 
  endDate?: string; 
}) => {
  const queryString = filters ? new URLSearchParams(filters as Record<string, string>).toString() : ''
  return useQuery<ApiResponse<any>>({
    queryKey: [...queryKeys.systemLogs, 'stats', filters],
    queryFn: () => apiFetch(`/activity-logs/stats${queryString ? `?${queryString}` : ''}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useActivityLogs = () => {
  return useQuery<ApiResponse<SystemLogsResponse>>({
    queryKey: [...queryKeys.systemLogs, 'activity'],
    queryFn: () => apiFetch(`/activity-logs`),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
} 