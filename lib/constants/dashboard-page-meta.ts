import type { DashboardBreadcrumbItem } from '@/components/dashboard/DashboardBreadcrumbs'

const root: DashboardBreadcrumbItem = { label: 'Dashboard', href: '/dashboard' }
const finance: DashboardBreadcrumbItem = { label: 'Finance', href: '/dashboard/finance' }

/** Breadcrumbs keyed by route segment under /dashboard (file path without page.tsx) */
export const DASHBOARD_PAGE_CRUMBS: Record<string, DashboardBreadcrumbItem[]> = {
  '': [root, { label: 'Overview' }],
  activity: [root, { label: 'Activity' }],
  analytics: [root, { label: 'Analytics' }],
  'api-logs': [root, { label: 'API Logs' }],
  backups: [root, { label: 'Backups' }],
  cards: [root, { label: 'Cards' }],
  'cards/link': [root, { label: 'Cards', href: '/dashboard/cards' }, { label: 'Link Card' }],
  'cards/register': [root, { label: 'Cards', href: '/dashboard/cards' }, { label: 'Register Card' }],
  carousel: [root, { label: 'Carousel' }],
  customers: [root, { label: 'Customers' }],
  'customers/merchant-onboard': [
    root,
    { label: 'Customers', href: '/dashboard/customers' },
    { label: 'Merchant Onboard' },
  ],
  'customers/super-merchants': [
    root,
    { label: 'Customers', href: '/dashboard/customers' },
    { label: 'Super Merchants' },
  ],
  finance: [root, { label: 'Finance' }],
  'finance/partners': [root, finance, { label: 'External Partners' }],
  'finance/partners/create': [
    root,
    finance,
    { label: 'External Partners', href: '/dashboard/finance/partners' },
    { label: 'Create' },
  ],
  'finance/partners/configure-mapping': [
    root,
    finance,
    { label: 'External Partners', href: '/dashboard/finance/partners' },
    { label: 'Configure Mapping' },
  ],
  'finance/tariffs': [root, finance, { label: 'Tariffs (classic)' }],
  'finance/tariffs-new': [root, finance, { label: 'Tariffs' }],
  'finance/tariffs/create': [
    root,
    finance,
    { label: 'Tariffs', href: '/dashboard/finance/tariffs-new' },
    { label: 'Create' },
  ],
  'finance/transaction-mapping': [root, finance, { label: 'Transaction Mapping' }],
  'gateway-partners': [root, { label: 'Gateway Partners' }],
  'gateway-partners/create': [
    root,
    { label: 'Gateway Partners', href: '/dashboard/gateway-partners' },
    { label: 'Create' },
  ],
  saccos: [root, { label: 'SACCOs' }],
  'saccos/[id]': [
    root,
    { label: 'SACCOs', href: '/dashboard/saccos' },
    { label: 'Details' },
  ],
  kyc: [root, { label: 'KYC' }],
  'platform-revenue': [root, { label: 'Platform Revenue' }],
  products: [root, { label: 'Products' }],
  profile: [root, { label: 'Profile' }],
  reports: [root, { label: 'Reports' }],
  'revenue-tax': [root, { label: 'Revenue Tax' }],
  roles: [root, { label: 'Roles & Permissions' }],
  security: [root, { label: 'Security' }],
  settings: [root, { label: 'Settings' }],
  'settings/nav-visibility': [
    root,
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Nav Visibility' },
  ],
  'settings/mobile-app-versions': [
    root,
    { label: 'Settings', href: '/dashboard/settings' },
    { label: 'Mobile app versions' },
  ],
  'system-logs': [root, { label: 'System Logs' }],
  'test-permissions': [root, { label: 'Permissions Test' }],
  'transaction-modes': [root, { label: 'Transaction Modes' }],
  transactions: [root, { label: 'Transaction Ledgers' }],
  'transactions/liquidations': [
    root,
    { label: 'Transactions', href: '/dashboard/transactions' },
    { label: 'Liquidations' },
  ],
  'transactions/reversals': [
    root,
    { label: 'Transactions', href: '/dashboard/transactions' },
    { label: 'Reversals' },
  ],
  users: [root, { label: 'Users' }],
  'users/create': [root, { label: 'Users', href: '/dashboard/users' }, { label: 'Create' }],
  'users/duplicates': [
    root,
    { label: 'Users', href: '/dashboard/users' },
    { label: 'Duplicates' },
  ],
  'users/permissions': [root, { label: 'Users', href: '/dashboard/users' }, { label: 'Permissions' }],
  'users/[userId]/nav-visibility': [
    root,
    { label: 'Users', href: '/dashboard/users' },
    { label: 'Nav Visibility' },
  ],
  wallet: [root, { label: 'Wallets' }],
  'wallet/[walletId]/statement': [
    root,
    { label: 'Wallets', href: '/dashboard/wallet' },
    { label: 'Statement' },
  ],
}

export function getDashboardPageCrumbs(routeKey: string): DashboardBreadcrumbItem[] {
  return DASHBOARD_PAGE_CRUMBS[routeKey] ?? [root, { label: routeKey.split('/').pop() ?? 'Page' }]
}
