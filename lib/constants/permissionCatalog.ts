import { PERMISSIONS } from '@/lib/hooks/usePermissions'

export interface PermissionItem {
  name: string
  label: string
}

export interface PermissionGroup {
  group: string
  permissions: PermissionItem[]
}

// All dashboard sections whose VIEW permission gates the navbar link.
// Must stay in sync with PermissionGuard wrappers in Navbar.tsx.
export const NAV_PERMISSION_ITEMS: { permName: string; label: string; desc: string }[] = [
  { permName: PERMISSIONS.ANALYTICS_VIEW,    label: 'Analytics',              desc: 'Analytics & reports tab' },
  { permName: PERMISSIONS.TRANSACTIONS_VIEW, label: 'Finance / Transactions',  desc: 'Tariffs, transactions, wallets dropdown' },
  { permName: PERMISSIONS.PARTNERS_VIEW,     label: 'Gateway Partners',        desc: 'Payment gateway partner management' },
  { permName: PERMISSIONS.USERS_VIEW,        label: 'Users',                   desc: 'Staff user management' },
  { permName: PERMISSIONS.WALLETS_VIEW,      label: 'Customers',               desc: 'Customer accounts and wallets (WALLETS_VIEW or USERS_VIEW)' },
  { permName: PERMISSIONS.KYC_VIEW,          label: 'Security / KYC',          desc: 'Security dropdown → KYC verification' },
  { permName: PERMISSIONS.SYSTEM_CONFIGURE,  label: 'Settings',                desc: 'System configuration & settings' },
]

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    group: 'User Management',
    permissions: [
      { name: PERMISSIONS.USERS_VIEW,   label: 'View Users' },
      { name: PERMISSIONS.USERS_CREATE, label: 'Create Users' },
      { name: PERMISSIONS.USERS_UPDATE, label: 'Update Users' },
      { name: PERMISSIONS.USERS_DELETE, label: 'Delete Users' },
      { name: PERMISSIONS.USERS_VERIFY, label: 'Verify Users' },
      { name: PERMISSIONS.ROLES_ASSIGN, label: 'Assign Roles' },
    ],
  },
  {
    group: 'Role Management',
    permissions: [
      { name: PERMISSIONS.ROLES_VIEW,   label: 'View Roles' },
      { name: PERMISSIONS.ROLES_CREATE, label: 'Create Roles' },
      { name: PERMISSIONS.ROLES_UPDATE, label: 'Update Roles' },
      { name: PERMISSIONS.ROLES_DELETE, label: 'Delete Roles' },
    ],
  },
  {
    group: 'Customers / Wallets',
    permissions: [
      { name: PERMISSIONS.WALLETS_VIEW,    label: 'View Wallets' },
      { name: PERMISSIONS.WALLETS_APPROVE, label: 'Approve Wallets' },
      { name: PERMISSIONS.WALLETS_SUSPEND, label: 'Suspend Wallets' },
    ],
  },
  {
    group: 'KYC',
    permissions: [
      { name: PERMISSIONS.KYC_VIEW,    label: 'View KYC' },
      { name: PERMISSIONS.KYC_VERIFY,  label: 'Verify KYC' },
      { name: PERMISSIONS.KYC_APPROVE, label: 'Approve KYC' },
      { name: PERMISSIONS.KYC_REJECT,  label: 'Reject KYC' },
    ],
  },
  {
    group: 'Merchant KYC',
    permissions: [
      { name: PERMISSIONS.MERCHANT_KYC_VIEW,    label: 'View Merchant KYC' },
      { name: PERMISSIONS.MERCHANT_KYC_VERIFY,  label: 'Verify Merchant KYC' },
      { name: PERMISSIONS.MERCHANT_KYC_APPROVE, label: 'Approve Merchant KYC' },
      { name: PERMISSIONS.MERCHANT_KYC_REJECT,  label: 'Reject Merchant KYC' },
      { name: PERMISSIONS.MERCHANT_KYC_CREATE,  label: 'Create Merchant KYC' },
      { name: PERMISSIONS.MERCHANT_KYC_UPDATE,  label: 'Update Merchant KYC' },
      { name: PERMISSIONS.MERCHANT_KYC_ONBOARD, label: 'Onboard Merchant' },
    ],
  },
  {
    group: 'Merchants',
    permissions: [
      { name: PERMISSIONS.MERCHANT_VIEW,     label: 'View Merchants' },
      { name: PERMISSIONS.MERCHANT_CREATE,   label: 'Create Merchants' },
      { name: PERMISSIONS.MERCHANT_UPDATE,   label: 'Update Merchants' },
      { name: PERMISSIONS.MERCHANT_DELETE,   label: 'Delete Merchants' },
      { name: PERMISSIONS.MERCHANT_SUSPEND,  label: 'Suspend Merchants' },
      { name: PERMISSIONS.MERCHANT_ACTIVATE, label: 'Activate Merchants' },
    ],
  },
  {
    group: 'Documents',
    permissions: [
      { name: PERMISSIONS.DOCUMENTS_VIEW,    label: 'View Documents' },
      { name: PERMISSIONS.DOCUMENTS_VERIFY,  label: 'Verify Documents' },
      { name: PERMISSIONS.DOCUMENTS_APPROVE, label: 'Approve Documents' },
      { name: PERMISSIONS.DOCUMENTS_REJECT,  label: 'Reject Documents' },
    ],
  },
  {
    group: 'Transactions',
    permissions: [
      { name: PERMISSIONS.TRANSACTIONS_VIEW,             label: 'View Transactions' },
      { name: PERMISSIONS.TRANSACTIONS_APPROVE,          label: 'Approve Transactions' },
      { name: PERMISSIONS.TRANSACTIONS_REVERSE,          label: 'Reverse Transactions (legacy)' },
      { name: PERMISSIONS.TRANSACTION_REVERSE,           label: 'Reverse Standard Transactions' },
      { name: PERMISSIONS.TRANSACTION_REVERSE_HIGH_VALUE, label: 'Reverse High-Value Transactions' },
      { name: PERMISSIONS.TRANSACTION_REVERSAL_VIEW,     label: 'View Reversals' },
      { name: PERMISSIONS.TRANSACTION_REVERSAL_APPROVE,  label: 'Approve / Reject Reversals' },
    ],
  },
  {
    group: 'Transaction Modes',
    permissions: [
      { name: PERMISSIONS.TRANSACTION_MODES_VIEW,   label: 'View Transaction Modes' },
      { name: PERMISSIONS.TRANSACTION_MODES_CREATE, label: 'Create Transaction Modes' },
      { name: PERMISSIONS.TRANSACTION_MODES_UPDATE, label: 'Update Transaction Modes' },
      { name: PERMISSIONS.TRANSACTION_MODES_DELETE, label: 'Delete Transaction Modes' },
    ],
  },
  {
    group: 'Tariffs',
    permissions: [
      { name: PERMISSIONS.TARIFF_VIEW,    label: 'View Tariffs' },
      { name: PERMISSIONS.TARIFF_CREATE,  label: 'Create Tariffs' },
      { name: PERMISSIONS.TARIFF_UPDATE,  label: 'Update Tariffs' },
      { name: PERMISSIONS.TARIFF_DELETE,  label: 'Delete Tariffs' },
      { name: PERMISSIONS.TARIFF_APPROVE, label: 'Approve Tariffs' },
      { name: PERMISSIONS.TARIFF_REJECT,  label: 'Reject Tariffs' },
    ],
  },
  {
    group: 'Products',
    permissions: [
      { name: PERMISSIONS.PRODUCTS_VIEW,   label: 'View Products' },
      { name: PERMISSIONS.PRODUCTS_CREATE, label: 'Create Products' },
      { name: PERMISSIONS.PRODUCTS_UPDATE, label: 'Update Products' },
      { name: PERMISSIONS.PRODUCTS_DELETE, label: 'Delete Products' },
    ],
  },
  {
    group: 'Gateway Partners',
    permissions: [
      { name: PERMISSIONS.PARTNERS_VIEW,    label: 'View Partners' },
      { name: PERMISSIONS.PARTNERS_CREATE,  label: 'Create Partners' },
      { name: PERMISSIONS.PARTNERS_UPDATE,  label: 'Update Partners' },
      { name: PERMISSIONS.PARTNERS_DELETE,  label: 'Delete Partners' },
      { name: PERMISSIONS.PARTNERS_APPROVE, label: 'Approve Partners' },
      { name: PERMISSIONS.PARTNERS_REJECT,  label: 'Reject Partners' },
    ],
  },
  {
    group: 'Analytics & System',
    permissions: [
      { name: PERMISSIONS.ANALYTICS_VIEW,   label: 'View Analytics' },
      { name: PERMISSIONS.SYSTEM_CONFIGURE, label: 'Configure System' },
      { name: PERMISSIONS.SYSTEM_LOGS,      label: 'View System Logs' },
      { name: PERMISSIONS.SYSTEM_BACKUP,    label: 'System Backup' },
    ],
  },
]
