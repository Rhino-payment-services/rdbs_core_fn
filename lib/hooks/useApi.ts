// Re-export all hooks from separate files for backward compatibility
// This maintains existing imports while using the new modular structure

// Auth hooks
export {
  useUsers,
  useUser,
  useProfile,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useSendWelcomeEmail,
  useSetPassword,
  useForgotPassword,
  useAuth
} from './useAuth'

// Transaction hooks
export {
  useTransactions,
  useTransaction,
  useTransactionSystemStats,
  useTransactionStats,
  useSystemTransactionStats,
  useWalletToWalletTransfer,
  useSendToMno,
  useSendToBank,
  usePayUtility,
  usePayMerchant
} from './useTransactions'

// Wallet hooks
export {
  useWallets,
  useWallet,
  useWalletBalance,
  useCreateWallet,
  useWalletTransactions
} from './useWallets'

// Role hooks
export {
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignRole,
  useUpdateUserRole,
  useRemoveRole,
  useAssignPermissions
} from './useRoles'

// Analytics hooks
export {
  useAnalytics
} from './useAnalytics'

// Merchant hooks
export {
  useMerchants,
  useMerchant,
  useCreateMerchant,
  useUpdateMerchant,
  useDeleteMerchant,
  useSuspendMerchant,
  useActivateMerchant
} from './useMerchants'

// KYC hooks
export {
  useKycStatus,
  useKycStats,
  useKycSubmissions,
  useKycSubmission,
  useUpdateKycProfile,
  useApproveKycSubmission,
  useRejectKycSubmission
} from './useKyc'

// System hooks
export {
  useSystemStats,
  useSystemLogs,
  useSystemLog,
  useSystemLogsStats,
  useActivityLogs,
  useUserActivityLogs
} from './useSystem'

// Legacy hooks that might still be needed
export const useCustomers = (filters?: any) => {
  // This can be implemented later or removed if not needed
  console.warn('useCustomers is deprecated. Please use specific hooks from separate files.')
  return { data: null, isLoading: false, error: null }
}

export const useCustomer = (type: string, id: string) => {
  // This can be implemented later or removed if not needed
  console.warn('useCustomer is deprecated. Please use specific hooks from separate files.')
  return { data: null, isLoading: false, error: null }
}

export const useNotifications = () => {
  // This can be implemented later or removed if not needed
  console.warn('useNotifications is deprecated. Please use specific hooks from separate files.')
  return { data: null, isLoading: false, error: null }
}

export const useNotification = (id: string) => {
  // This can be implemented later or removed if not needed
  console.warn('useNotification is deprecated. Please use specific hooks from separate files.')
  return { data: null, isLoading: false, error: null }
}
