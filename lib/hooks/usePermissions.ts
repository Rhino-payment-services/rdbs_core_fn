"use client"

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

// Updated permissions to match backend format (uppercase with underscores)
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'DASHBOARD_VIEW',
  
  // Analytics
  ANALYTICS_VIEW: 'ANALYTICS_VIEW',
  
  // User Management
  USERS_VIEW: 'USERS_VIEW',
  USERS_CREATE: 'USERS_CREATE',
  USERS_UPDATE: 'USERS_UPDATE',
  USERS_DELETE: 'USERS_DELETE',
  USERS_VERIFY: 'USERS_VERIFY',
  
  // Role Management
  ROLES_VIEW: 'ROLES_VIEW',
  ROLES_CREATE: 'ROLES_CREATE',
  ROLES_UPDATE: 'ROLES_UPDATE',
  ROLES_DELETE: 'ROLES_DELETE',
  ROLES_ASSIGN: 'ROLES_ASSIGN',
  
  // Wallet Management
  WALLETS_VIEW: 'WALLETS_VIEW',
  WALLETS_APPROVE: 'WALLETS_APPROVE',
  WALLETS_SUSPEND: 'WALLETS_SUSPEND',
  
  // KYC Management
  KYC_VIEW: 'KYC_VIEW',
  KYC_VERIFY: 'KYC_VERIFY',
  KYC_APPROVE: 'KYC_APPROVE',
  KYC_REJECT: 'KYC_REJECT',
  
  // Merchant KYC Management
  MERCHANT_KYC_VIEW: 'MERCHANT_KYC_VIEW',
  MERCHANT_KYC_VERIFY: 'MERCHANT_KYC_VERIFY',
  MERCHANT_KYC_APPROVE: 'MERCHANT_KYC_APPROVE',
  MERCHANT_KYC_REJECT: 'MERCHANT_KYC_REJECT',
  MERCHANT_KYC_CREATE: 'MERCHANT_KYC_CREATE',
  MERCHANT_KYC_UPDATE: 'MERCHANT_KYC_UPDATE',
  MERCHANT_KYC_ONBOARD: 'MERCHANT_KYC_ONBOARD',
  
  // Merchant Management
  MERCHANT_VIEW: 'MERCHANT_VIEW',
  MERCHANT_CREATE: 'MERCHANT_CREATE',
  MERCHANT_UPDATE: 'MERCHANT_UPDATE',
  MERCHANT_DELETE: 'MERCHANT_DELETE',
  MERCHANT_SUSPEND: 'MERCHANT_SUSPEND',
  MERCHANT_ACTIVATE: 'MERCHANT_ACTIVATE',

  // Merchant Events Monitoring
  MERCHANT_EVENTS_VIEW: 'MERCHANT_EVENTS_VIEW',
  MERCHANT_EVENTS_MANAGE: 'MERCHANT_EVENTS_MANAGE',
  
  // Document Management
  DOCUMENTS_VIEW: 'DOCUMENTS_VIEW',
  DOCUMENTS_VERIFY: 'DOCUMENTS_VERIFY',
  DOCUMENTS_APPROVE: 'DOCUMENTS_APPROVE',
  DOCUMENTS_REJECT: 'DOCUMENTS_REJECT',
  
  // Transaction Management
  TRANSACTIONS_VIEW: 'TRANSACTIONS_VIEW',
  TRANSACTIONS_APPROVE: 'TRANSACTIONS_APPROVE',
  TRANSACTIONS_REVERSE: 'TRANSACTIONS_REVERSE',

  // Transaction Reversal (fine-grained — seeded via seed-reversal-permissions.ts)
  TRANSACTION_REVERSE: 'TRANSACTION_REVERSE',
  TRANSACTION_REVERSE_HIGH_VALUE: 'TRANSACTION_REVERSE_HIGH_VALUE',
  TRANSACTION_REVERSAL_VIEW: 'TRANSACTION_REVERSAL_VIEW',
  TRANSACTION_REVERSAL_APPROVE: 'TRANSACTION_REVERSAL_APPROVE',
  
  // Transaction Modes Management
  TRANSACTION_MODES_VIEW: 'TRANSACTION_MODES_VIEW',
  TRANSACTION_MODES_CREATE: 'TRANSACTION_MODES_CREATE',
  TRANSACTION_MODES_UPDATE: 'TRANSACTION_MODES_UPDATE',
  TRANSACTION_MODES_DELETE: 'TRANSACTION_MODES_DELETE',
  
  // Tariff Management
  TARIFF_VIEW: 'TARIFF_VIEW',
  TARIFF_CREATE: 'TARIFF_CREATE',
  TARIFF_UPDATE: 'TARIFF_UPDATE',
  TARIFF_DELETE: 'TARIFF_DELETE',
  TARIFF_APPROVE: 'TARIFF_APPROVE',
  TARIFF_REJECT: 'TARIFF_REJECT',
  
  // Product Management
  PRODUCTS_VIEW: 'PRODUCTS_VIEW',
  PRODUCTS_CREATE: 'PRODUCTS_CREATE',
  PRODUCTS_UPDATE: 'PRODUCTS_UPDATE',
  PRODUCTS_DELETE: 'PRODUCTS_DELETE',
  
  // Partner Management
  PARTNERS_VIEW: 'PARTNERS_VIEW',
  PARTNERS_CREATE: 'PARTNERS_CREATE',
  PARTNERS_UPDATE: 'PARTNERS_UPDATE',
  PARTNERS_DELETE: 'PARTNERS_DELETE',
  PARTNERS_APPROVE: 'PARTNERS_APPROVE',
  PARTNERS_REJECT: 'PARTNERS_REJECT',
  
  // System Management
  SYSTEM_CONFIGURE: 'SYSTEM_CONFIG',
  SYSTEM_LOGS: 'SYSTEM_LOGS',
  SYSTEM_BACKUP: 'SYSTEM_BACKUP',

  // Backup Management (granular)
  BACKUP_VIEW: 'BACKUP_VIEW',
  BACKUP_CREATE: 'BACKUP_CREATE',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  MANAGER: 60,
  SUPPORT: 40,
  MERCHANT: 30,
  USER: 20,
} as const

export type Role = keyof typeof ROLE_HIERARCHY

interface UsePermissionsReturn {
  // User info
  currentUser: unknown
  userRole: Role
  userPermissions: string[]
  
  // Permission checks
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  
  // Role checks
  hasRole: (role: Role) => boolean
  hasAnyRole: (roles: Role[]) => boolean
  
  // Action checks - User Management
  canCreateUser: boolean
  canUpdateUser: boolean
  canDeleteUser: boolean
  canViewUsers: boolean
  canVerifyUser: boolean
  
  // Action checks - Role Management
  canCreateRole: boolean
  canUpdateRole: boolean
  canDeleteRole: boolean
  canViewRoles: boolean
  canAssignRoles: boolean
  
  // Action checks - Wallet Management
  canViewWallets: boolean
  canApproveWallet: boolean
  canSuspendWallet: boolean
  
  // Action checks - KYC Management
  canViewKyc: boolean
  canVerifyKyc: boolean
  canApproveKyc: boolean
  canRejectKyc: boolean
  
  // Action checks - Merchant KYC Management
  canViewMerchantKyc: boolean
  canVerifyMerchantKyc: boolean
  canApproveMerchantKyc: boolean
  canRejectMerchantKyc: boolean
  canCreateMerchantKyc: boolean
  canUpdateMerchantKyc: boolean
  canOnboardMerchantKyc: boolean
  
  // Action checks - Merchant Management
  canViewMerchants: boolean
  canCreateMerchant: boolean
  canUpdateMerchant: boolean
  canDeleteMerchant: boolean
  canSuspendMerchant: boolean
  canActivateMerchant: boolean
  
  // Action checks - Document Management
  canViewDocuments: boolean
  canVerifyDocuments: boolean
  canApproveDocuments: boolean
  canRejectDocuments: boolean
  
  // Action checks - Transaction Management
  canViewTransactions: boolean
  canApproveTransactions: boolean
  canReverseTransactions: boolean
  
  // Action checks - Tariff Management
  canViewTariffs: boolean
  canCreateTariffs: boolean
  canUpdateTariffs: boolean
  canDeleteTariffs: boolean
  canApproveTariffs: boolean
  canRejectTariffs: boolean
  
  // Action checks - Partner Management
  canViewPartners: boolean
  canCreatePartners: boolean
  canUpdatePartners: boolean
  canDeletePartners: boolean
  canApprovePartners: boolean
  canRejectPartners: boolean
  
  // Action checks - System Management
  canConfigureSystem: boolean
  canViewSystemLogs: boolean
  canSystemBackup: boolean
}

export const usePermissions = (): UsePermissionsReturn => {
  const { data: session } = useSession()
  
  const currentUser = session?.user
  const userRole = ((currentUser as { role?: string })?.role || 'USER') as Role

  // Session permissions are the only source of truth for non–SUPER_ADMIN users.
  // Empty array = no access (matches backend). Do not invent role-based defaults
  // that the API will reject with 403.
  const userPermissions = useMemo(() => {
    if (userRole === 'SUPER_ADMIN') {
      return Object.values(PERMISSIONS) as string[]
    }
    return ((currentUser as { permissions?: string[] })?.permissions || []) as string[]
  }, [currentUser, userRole])
  
  // Check if user has specific permission
  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false
    
    // SUPER_ADMIN can do everything
    if (userRole === 'SUPER_ADMIN') return true
    
    // For other roles, check specific permissions
    return userPermissions.includes(permission)
  }
  
  // Check if user has any of the given permissions
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }
  
  // Check if user has all of the given permissions
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }
  
  // Check if user has specific role
  const hasRole = (role: Role): boolean => {
    return userRole === role
  }
  
  // Check if user has any of the given roles
  const hasAnyRole = (roles: Role[]): boolean => {
    return roles.includes(userRole as Role)
  }
  
  // Pre-computed permission checks for common actions
  // User Management
  const canCreateUser = hasPermission(PERMISSIONS.USERS_CREATE)
  const canUpdateUser = hasPermission(PERMISSIONS.USERS_UPDATE)
  const canDeleteUser = hasPermission(PERMISSIONS.USERS_DELETE)
  const canViewUsers = hasPermission(PERMISSIONS.USERS_VIEW)
  const canVerifyUser = hasPermission(PERMISSIONS.USERS_VERIFY)
  
  // Role Management
  const canCreateRole = hasPermission(PERMISSIONS.ROLES_CREATE)
  const canUpdateRole = hasPermission(PERMISSIONS.ROLES_UPDATE)
  const canDeleteRole = hasPermission(PERMISSIONS.ROLES_DELETE)
  const canViewRoles = hasPermission(PERMISSIONS.ROLES_VIEW)
  const canAssignRoles = hasPermission(PERMISSIONS.ROLES_ASSIGN)
  
  // Wallet Management
  const canViewWallets = hasPermission(PERMISSIONS.WALLETS_VIEW)
  const canApproveWallet = hasPermission(PERMISSIONS.WALLETS_APPROVE)
  const canSuspendWallet = hasPermission(PERMISSIONS.WALLETS_SUSPEND)
  
  // KYC Management
  const canViewKyc = hasPermission(PERMISSIONS.KYC_VIEW)
  const canVerifyKyc = hasPermission(PERMISSIONS.KYC_VERIFY)
  const canApproveKyc = hasPermission(PERMISSIONS.KYC_APPROVE)
  const canRejectKyc = hasPermission(PERMISSIONS.KYC_REJECT)
  
  // Merchant KYC Management
  const canViewMerchantKyc = hasPermission(PERMISSIONS.MERCHANT_KYC_VIEW)
  const canVerifyMerchantKyc = hasPermission(PERMISSIONS.MERCHANT_KYC_VERIFY)
  const canApproveMerchantKyc = hasPermission(PERMISSIONS.MERCHANT_KYC_APPROVE)
  const canRejectMerchantKyc = hasPermission(PERMISSIONS.MERCHANT_KYC_REJECT)
  const canCreateMerchantKyc = hasPermission(PERMISSIONS.MERCHANT_KYC_CREATE)
  const canUpdateMerchantKyc = hasPermission(PERMISSIONS.MERCHANT_KYC_UPDATE)
  const canOnboardMerchantKyc = hasPermission(PERMISSIONS.MERCHANT_KYC_ONBOARD)
  
  // Merchant Management
  const canViewMerchants = hasPermission(PERMISSIONS.MERCHANT_VIEW)
  const canCreateMerchant = hasPermission(PERMISSIONS.MERCHANT_CREATE)
  const canUpdateMerchant = hasPermission(PERMISSIONS.MERCHANT_UPDATE)
  const canDeleteMerchant = hasPermission(PERMISSIONS.MERCHANT_DELETE)
  const canSuspendMerchant = hasPermission(PERMISSIONS.MERCHANT_SUSPEND)
  const canActivateMerchant = hasPermission(PERMISSIONS.MERCHANT_ACTIVATE)
  
  // Document Management
  const canViewDocuments = hasPermission(PERMISSIONS.DOCUMENTS_VIEW)
  const canVerifyDocuments = hasPermission(PERMISSIONS.DOCUMENTS_VERIFY)
  const canApproveDocuments = hasPermission(PERMISSIONS.DOCUMENTS_APPROVE)
  const canRejectDocuments = hasPermission(PERMISSIONS.DOCUMENTS_REJECT)
  
  // Transaction Management
  const canViewTransactions = hasPermission(PERMISSIONS.TRANSACTIONS_VIEW)
  const canApproveTransactions = hasPermission(PERMISSIONS.TRANSACTIONS_APPROVE)
  const canReverseTransactions = hasPermission(PERMISSIONS.TRANSACTIONS_REVERSE)
  
  // Tariff Management
  const canViewTariffs = hasPermission(PERMISSIONS.TARIFF_VIEW)
  const canCreateTariffs = hasPermission(PERMISSIONS.TARIFF_CREATE)
  const canUpdateTariffs = hasPermission(PERMISSIONS.TARIFF_UPDATE)
  const canDeleteTariffs = hasPermission(PERMISSIONS.TARIFF_DELETE)
  const canApproveTariffs = hasPermission(PERMISSIONS.TARIFF_APPROVE)
  const canRejectTariffs = hasPermission(PERMISSIONS.TARIFF_REJECT)
  
  // Partner Management
  const canViewPartners = hasPermission(PERMISSIONS.PARTNERS_VIEW)
  const canCreatePartners = hasPermission(PERMISSIONS.PARTNERS_CREATE)
  const canUpdatePartners = hasPermission(PERMISSIONS.PARTNERS_UPDATE)
  const canDeletePartners = hasPermission(PERMISSIONS.PARTNERS_DELETE)
  const canApprovePartners = hasPermission(PERMISSIONS.PARTNERS_APPROVE)
  const canRejectPartners = hasPermission(PERMISSIONS.PARTNERS_REJECT)
  
  // System Management
  const canConfigureSystem = hasPermission(PERMISSIONS.SYSTEM_CONFIGURE)
  const canViewSystemLogs = hasPermission(PERMISSIONS.SYSTEM_LOGS)
  const canSystemBackup = hasPermission(PERMISSIONS.SYSTEM_BACKUP)
  
  return {
    currentUser,
    userRole,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    // User Management
    canCreateUser,
    canUpdateUser,
    canDeleteUser,
    canViewUsers,
    canVerifyUser,
    // Role Management
    canCreateRole,
    canUpdateRole,
    canDeleteRole,
    canViewRoles,
    canAssignRoles,
    // Wallet Management
    canViewWallets,
    canApproveWallet,
    canSuspendWallet,
    // KYC Management
    canViewKyc,
    canVerifyKyc,
    canApproveKyc,
    canRejectKyc,
    // Merchant KYC Management
    canViewMerchantKyc,
    canVerifyMerchantKyc,
    canApproveMerchantKyc,
    canRejectMerchantKyc,
    canCreateMerchantKyc,
    canUpdateMerchantKyc,
    canOnboardMerchantKyc,
    // Merchant Management
    canViewMerchants,
    canCreateMerchant,
    canUpdateMerchant,
    canDeleteMerchant,
    canSuspendMerchant,
    canActivateMerchant,
    // Document Management
    canViewDocuments,
    canVerifyDocuments,
    canApproveDocuments,
    canRejectDocuments,
    // Transaction Management
    canViewTransactions,
    canApproveTransactions,
    canReverseTransactions,
    // Tariff Management
    canViewTariffs,
    canCreateTariffs,
    canUpdateTariffs,
    canDeleteTariffs,
    canApproveTariffs,
    canRejectTariffs,
    // Partner Management
    canViewPartners,
    canCreatePartners,
    canUpdatePartners,
    canDeletePartners,
    canApprovePartners,
    canRejectPartners,
    // System Management
    canConfigureSystem,
    canViewSystemLogs,
    canSystemBackup,
  }
}

export default usePermissions
