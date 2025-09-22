"use client"

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

export const PERMISSIONS = {
  // User Management (5 permissions)
  CREATE_USER: 'users:create',
  UPDATE_USER: 'users:update', 
  DELETE_USER: 'users:delete',
  VIEW_USERS: 'users:view',
  VERIFY_USER: 'users:verify',
  
  // Role Management (5 permissions)
  CREATE_ROLE: 'roles:create',
  UPDATE_ROLE: 'roles:update',
  DELETE_ROLE: 'roles:delete',
  VIEW_ROLES: 'roles:view',
  ASSIGN_ROLES: 'roles:assign',
  
  // Wallet Management (3 permissions)
  VIEW_WALLETS: 'wallets:view',
  APPROVE_WALLET: 'wallets:approve',
  SUSPEND_WALLET: 'wallets:suspend',
  
  // KYC Management (4 permissions)
  VIEW_KYC: 'kyc:view',
  VERIFY_KYC: 'kyc:verify',
  APPROVE_KYC: 'kyc:approve',
  REJECT_KYC: 'kyc:reject',
  
  // 🆕 Merchant KYC Management (7 permissions)
  VIEW_MERCHANT_KYC: 'merchant_kyc:view',
  VERIFY_MERCHANT_KYC: 'merchant_kyc:verify',
  APPROVE_MERCHANT_KYC: 'merchant_kyc:approve',
  REJECT_MERCHANT_KYC: 'merchant_kyc:reject',
  CREATE_MERCHANT_KYC: 'merchant_kyc:create',
  UPDATE_MERCHANT_KYC: 'merchant_kyc:update',
  DELETE_MERCHANT_KYC: 'merchant_kyc:delete',
  
  // 🆕 Merchant Management (6 permissions)
  VIEW_MERCHANTS: 'merchant:view',
  CREATE_MERCHANT: 'merchant:create',
  UPDATE_MERCHANT: 'merchant:update',
  DELETE_MERCHANT: 'merchant:delete',
  APPROVE_MERCHANT: 'merchant:approve',
  SUSPEND_MERCHANT: 'merchant:suspend',
  
  // Document Management (4 permissions)
  VIEW_DOCUMENTS: 'documents:view',
  VERIFY_DOCUMENTS: 'documents:verify',
  APPROVE_DOCUMENTS: 'documents:approve',
  REJECT_DOCUMENTS: 'documents:reject',
  
  // Transaction Management (3 permissions)
  VIEW_TRANSACTIONS: 'transactions:view',
  APPROVE_TRANSACTIONS: 'transactions:approve',
  REVERSE_TRANSACTIONS: 'transactions:reverse',
  
  // Tariff Management (4 permissions)
  VIEW_TARIFFS: 'tariffs:view',
  CREATE_TARIFFS: 'tariffs:create',
  UPDATE_TARIFFS: 'tariffs:update',
  DELETE_TARIFFS: 'tariffs:delete',
  
  // System Management (3 permissions)
  SYSTEM_CONFIGURE: 'system:configure',
  VIEW_SYSTEM_LOGS: 'system:logs',
  SYSTEM_BACKUP: 'system:backup',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export const ROLE_HIERARCHY = {
  SUPERADMIN: 100,
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
  canDeleteMerchantKyc: boolean
  
  // Action checks - Merchant Management
  canViewMerchants: boolean
  canCreateMerchant: boolean
  canUpdateMerchant: boolean
  canDeleteMerchant: boolean
  canApproveMerchant: boolean
  canSuspendMerchant: boolean
  
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
  
  // Action checks - System Management
  canConfigureSystem: boolean
  canViewSystemLogs: boolean
  canSystemBackup: boolean
}

export const usePermissions = (): UsePermissionsReturn => {
  const { data: session } = useSession()
  
  const currentUser = session?.user
  const userRole = ((currentUser as { role?: string })?.role || 'USER') as Role
  
  // Get permissions from session or generate based on role
  const userPermissions = useMemo(() => {
    // If permissions are already in session, use them
    if ((currentUser as { permissions?: string[] })?.permissions) {
      return (currentUser as { permissions?: string[] }).permissions || []
    }
    
    // Fallback: Generate permissions based on role
    const rolePermissions: Record<Role, Permission[]> = {
      SUPERADMIN: Object.values(PERMISSIONS),
      ADMIN: [
        // User Management
        PERMISSIONS.CREATE_USER, PERMISSIONS.UPDATE_USER, PERMISSIONS.VIEW_USERS,
        PERMISSIONS.VERIFY_USER, PERMISSIONS.DELETE_USER,
        // Role Management
        PERMISSIONS.VIEW_ROLES, PERMISSIONS.CREATE_ROLE, PERMISSIONS.UPDATE_ROLE, 
        PERMISSIONS.DELETE_ROLE, PERMISSIONS.ASSIGN_ROLES,
        // Wallet Management
        PERMISSIONS.VIEW_WALLETS, PERMISSIONS.APPROVE_WALLET, PERMISSIONS.SUSPEND_WALLET,
        // KYC Management
        PERMISSIONS.VIEW_KYC, PERMISSIONS.VERIFY_KYC, PERMISSIONS.APPROVE_KYC, PERMISSIONS.REJECT_KYC,
        // Merchant KYC Management
        PERMISSIONS.VIEW_MERCHANT_KYC, PERMISSIONS.VERIFY_MERCHANT_KYC, PERMISSIONS.APPROVE_MERCHANT_KYC,
        PERMISSIONS.REJECT_MERCHANT_KYC, PERMISSIONS.CREATE_MERCHANT_KYC, PERMISSIONS.UPDATE_MERCHANT_KYC,
        // Merchant Management
        PERMISSIONS.VIEW_MERCHANTS, PERMISSIONS.CREATE_MERCHANT, PERMISSIONS.UPDATE_MERCHANT,
        PERMISSIONS.APPROVE_MERCHANT, PERMISSIONS.SUSPEND_MERCHANT,
        // Document Management
        PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.VERIFY_DOCUMENTS, PERMISSIONS.APPROVE_DOCUMENTS, PERMISSIONS.REJECT_DOCUMENTS,
        // Transaction Management
        PERMISSIONS.VIEW_TRANSACTIONS, PERMISSIONS.APPROVE_TRANSACTIONS, PERMISSIONS.REVERSE_TRANSACTIONS,
        // Tariff Management
        PERMISSIONS.VIEW_TARIFFS, PERMISSIONS.CREATE_TARIFFS, PERMISSIONS.UPDATE_TARIFFS, PERMISSIONS.DELETE_TARIFFS,
        // System Management
        PERMISSIONS.VIEW_SYSTEM_LOGS, PERMISSIONS.SYSTEM_CONFIGURE,
      ],
      MANAGER: [
        // User Management
        PERMISSIONS.VIEW_USERS, PERMISSIONS.UPDATE_USER, PERMISSIONS.VERIFY_USER,
        // Wallet Management
        PERMISSIONS.VIEW_WALLETS, PERMISSIONS.APPROVE_WALLET,
        // KYC Management
        PERMISSIONS.VIEW_KYC, PERMISSIONS.APPROVE_KYC, PERMISSIONS.REJECT_KYC,
        // Merchant KYC Management
        PERMISSIONS.VIEW_MERCHANT_KYC, PERMISSIONS.APPROVE_MERCHANT_KYC, PERMISSIONS.REJECT_MERCHANT_KYC,
        // Merchant Management
        PERMISSIONS.VIEW_MERCHANTS, PERMISSIONS.APPROVE_MERCHANT,
        // Document Management
        PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.APPROVE_DOCUMENTS, PERMISSIONS.REJECT_DOCUMENTS,
        // Transaction Management
        PERMISSIONS.VIEW_TRANSACTIONS, PERMISSIONS.APPROVE_TRANSACTIONS,
        // Tariff Management
        PERMISSIONS.VIEW_TARIFFS,
      ],
      SUPPORT: [
        // User Management
        PERMISSIONS.VIEW_USERS,
        // Wallet Management
        PERMISSIONS.VIEW_WALLETS,
        // KYC Management
        PERMISSIONS.VIEW_KYC, PERMISSIONS.VERIFY_KYC,
        // Merchant KYC Management
        PERMISSIONS.VIEW_MERCHANT_KYC, PERMISSIONS.VERIFY_MERCHANT_KYC,
        // Merchant Management
        PERMISSIONS.VIEW_MERCHANTS,
        // Document Management
        PERMISSIONS.VIEW_DOCUMENTS, PERMISSIONS.VERIFY_DOCUMENTS,
        // Transaction Management
        PERMISSIONS.VIEW_TRANSACTIONS,
      ],
      MERCHANT: [
        // View own data
        PERMISSIONS.VIEW_TRANSACTIONS, PERMISSIONS.VIEW_WALLETS,
        // Manage own KYC
        PERMISSIONS.VIEW_MERCHANT_KYC, PERMISSIONS.CREATE_MERCHANT_KYC, PERMISSIONS.UPDATE_MERCHANT_KYC,
      ],
      USER: [
        PERMISSIONS.VIEW_TRANSACTIONS, PERMISSIONS.VIEW_WALLETS,
      ],
    }
    
    return rolePermissions[userRole] || []
  }, [currentUser, userRole])
  
  // Check if user has specific permission
  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false
    
    // SUPERADMIN can do everything
    if (userRole === 'SUPERADMIN') return true
    
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
  const canCreateUser = hasPermission(PERMISSIONS.CREATE_USER)
  const canUpdateUser = hasPermission(PERMISSIONS.UPDATE_USER)
  const canDeleteUser = hasPermission(PERMISSIONS.DELETE_USER)
  const canViewUsers = hasPermission(PERMISSIONS.VIEW_USERS)
  const canVerifyUser = hasPermission(PERMISSIONS.VERIFY_USER)
  
  // Role Management
  const canCreateRole = hasPermission(PERMISSIONS.CREATE_ROLE)
  const canUpdateRole = hasPermission(PERMISSIONS.UPDATE_ROLE)
  const canDeleteRole = hasPermission(PERMISSIONS.DELETE_ROLE)
  const canViewRoles = hasPermission(PERMISSIONS.VIEW_ROLES)
  const canAssignRoles = hasPermission(PERMISSIONS.ASSIGN_ROLES)
  
  // Wallet Management
  const canViewWallets = hasPermission(PERMISSIONS.VIEW_WALLETS)
  const canApproveWallet = hasPermission(PERMISSIONS.APPROVE_WALLET)
  const canSuspendWallet = hasPermission(PERMISSIONS.SUSPEND_WALLET)
  
  // KYC Management
  const canViewKyc = hasPermission(PERMISSIONS.VIEW_KYC)
  const canVerifyKyc = hasPermission(PERMISSIONS.VERIFY_KYC)
  const canApproveKyc = hasPermission(PERMISSIONS.APPROVE_KYC)
  const canRejectKyc = hasPermission(PERMISSIONS.REJECT_KYC)
  
  // Merchant KYC Management
  const canViewMerchantKyc = hasPermission(PERMISSIONS.VIEW_MERCHANT_KYC)
  const canVerifyMerchantKyc = hasPermission(PERMISSIONS.VERIFY_MERCHANT_KYC)
  const canApproveMerchantKyc = hasPermission(PERMISSIONS.APPROVE_MERCHANT_KYC)
  const canRejectMerchantKyc = hasPermission(PERMISSIONS.REJECT_MERCHANT_KYC)
  const canCreateMerchantKyc = hasPermission(PERMISSIONS.CREATE_MERCHANT_KYC)
  const canUpdateMerchantKyc = hasPermission(PERMISSIONS.UPDATE_MERCHANT_KYC)
  const canDeleteMerchantKyc = hasPermission(PERMISSIONS.DELETE_MERCHANT_KYC)
  
  // Merchant Management
  const canViewMerchants = hasPermission(PERMISSIONS.VIEW_MERCHANTS)
  const canCreateMerchant = hasPermission(PERMISSIONS.CREATE_MERCHANT)
  const canUpdateMerchant = hasPermission(PERMISSIONS.UPDATE_MERCHANT)
  const canDeleteMerchant = hasPermission(PERMISSIONS.DELETE_MERCHANT)
  const canApproveMerchant = hasPermission(PERMISSIONS.APPROVE_MERCHANT)
  const canSuspendMerchant = hasPermission(PERMISSIONS.SUSPEND_MERCHANT)
  
  // Document Management
  const canViewDocuments = hasPermission(PERMISSIONS.VIEW_DOCUMENTS)
  const canVerifyDocuments = hasPermission(PERMISSIONS.VERIFY_DOCUMENTS)
  const canApproveDocuments = hasPermission(PERMISSIONS.APPROVE_DOCUMENTS)
  const canRejectDocuments = hasPermission(PERMISSIONS.REJECT_DOCUMENTS)
  
  // Transaction Management
  const canViewTransactions = hasPermission(PERMISSIONS.VIEW_TRANSACTIONS)
  const canApproveTransactions = hasPermission(PERMISSIONS.APPROVE_TRANSACTIONS)
  const canReverseTransactions = hasPermission(PERMISSIONS.REVERSE_TRANSACTIONS)
  
  // Tariff Management
  const canViewTariffs = hasPermission(PERMISSIONS.VIEW_TARIFFS)
  const canCreateTariffs = hasPermission(PERMISSIONS.CREATE_TARIFFS)
  const canUpdateTariffs = hasPermission(PERMISSIONS.UPDATE_TARIFFS)
  const canDeleteTariffs = hasPermission(PERMISSIONS.DELETE_TARIFFS)
  
  // System Management
  const canConfigureSystem = hasPermission(PERMISSIONS.SYSTEM_CONFIGURE)
  const canViewSystemLogs = hasPermission(PERMISSIONS.VIEW_SYSTEM_LOGS)
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
    canDeleteMerchantKyc,
    // Merchant Management
    canViewMerchants,
    canCreateMerchant,
    canUpdateMerchant,
    canDeleteMerchant,
    canApproveMerchant,
    canSuspendMerchant,
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
    // System Management
    canConfigureSystem,
    canViewSystemLogs,
    canSystemBackup,
  }
}

export default usePermissions 