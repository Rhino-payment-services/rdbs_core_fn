"use client"
import React from 'react'
import { AlertTriangle } from 'lucide-react'
import CustomerProfileHeader from './CustomerProfileHeader'
import CustomerStatsCards from './CustomerStatsCards'
import CustomerOverview from './CustomerOverview'
import CustomerTransactions from './CustomerTransactions'
import CustomerActivity from './CustomerActivity'
import CustomerSettings from './CustomerSettings'
import LiquidateToDisbursementModal from './LiquidateToDisbursementModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, CreditCard, Activity, Settings, Wallet, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import type { WalletBalance } from '@/lib/types/api'

interface CustomerProfileContentProps {
  type: string
  id: string
  customer: any
  merchantData: any
  partner: any
  regularPartner: any
  isGatewayPartner: boolean
  walletBalance: any
  allUserWallets?: any[]
  selectedWalletId?: string
  onWalletChange?: (walletId: string | undefined) => void
  currentBalance: number
  suspensionFund: number
  disbursementWalletBalance: number | null
  avgTransactionValue: number
  successRate: number
  totalTransactions: number
  transactions: any[]
  transactionsLoading: boolean
  transactionsError: any
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  /** When set, Export becomes a menu to download CSV per wallet (admin wallet API). */
  transactionUserId?: string
  effectiveWalletId?: string
  onExportWalletTransactions?: (walletId: string | undefined, label: string) => Promise<void>
  activities: any[]
  activityLogsLoading: boolean
  activityLogsError: any
  onBack: () => void
  onResetPin: () => void
  onGrantSuperMerchant?: () => void
  onRevokeSuperMerchant?: () => void
  onManageChildMerchants?: () => void
  isSuperAdmin?: boolean
}

export const CustomerProfileContent: React.FC<CustomerProfileContentProps> = ({
  type,
  id,
  customer,
  merchantData,
  partner,
  regularPartner,
  isGatewayPartner,
  walletBalance,
  allUserWallets = [],
  selectedWalletId,
  onWalletChange,
  currentBalance,
  suspensionFund,
  disbursementWalletBalance,
  avgTransactionValue,
  successRate,
  totalTransactions,
  transactions,
  transactionsLoading,
  transactionsError,
  totalPages,
  currentPage,
  onPageChange,
  transactionUserId,
  effectiveWalletId,
  onExportWalletTransactions,
  activities,
  activityLogsLoading,
  activityLogsError,
  onBack,
  onResetPin,
  onGrantSuperMerchant,
  onRevokeSuperMerchant,
  onManageChildMerchants,
  isSuperAdmin = false
}) => {
  const [activeTab, setActiveTab] = React.useState("overview")
  const [liquidateOpen, setLiquidateOpen] = React.useState(false)

  const showActivityTab = activityLogsLoading || activities.length > 0

  React.useEffect(() => {
    if (!showActivityTab && activeTab === 'activity') {
      setActiveTab('overview')
    }
  }, [showActivityTab, activeTab])

  const handleExportLegacy = () => {
    toast.success('Exporting customer data...')
  }

  const handleGoToSettings = () => {
    setActiveTab('settings')
  }

  // Build customer name
  const customerName = React.useMemo(() => {
    if (type === 'partner' && isGatewayPartner && partner?.partnerName) {
      return partner.partnerName
    }
    if (type === 'partner' && regularPartner) {
      return `${regularPartner?.profile?.firstName || ''} ${regularPartner?.profile?.lastName || ''}`.trim() ||
             `${regularPartner?.firstName || ''} ${regularPartner?.lastName || ''}`.trim() ||
             regularPartner?.email ||
             'Unknown Partner'
    }
    if (type === 'merchant' && merchantData?.businessTradeName) {
      return merchantData.businessTradeName
    }
    return `${customer?.profile?.firstName || ''} ${customer?.profile?.lastName || ''}`.trim() ||
           `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() ||
           customer?.email ||
           'Unknown Customer'
  }, [type, isGatewayPartner, partner, regularPartner, merchantData, customer])

  // Build customer email
  const customerEmail = React.useMemo(() => {
    if (type === 'partner' && isGatewayPartner && partner?.contactEmail) {
      return partner.contactEmail
    }
    if (type === 'partner' && regularPartner) {
      return regularPartner?.email || 'N/A'
    }
    if (type === 'merchant' && merchantData?.businessEmail) {
      return merchantData.businessEmail
    }
    return customer?.email || 'N/A'
  }, [type, isGatewayPartner, partner, regularPartner, merchantData, customer])

  // Build customer phone
  const customerPhone = React.useMemo(() => {
    if (type === 'partner' && isGatewayPartner && partner?.contactPhone) {
      return partner.contactPhone
    }
    if (type === 'partner' && regularPartner) {
      return regularPartner?.profile?.phone || regularPartner?.phone || 'N/A'
    }
    if (type === 'merchant' && merchantData?.registeredPhoneNumber) {
      return merchantData.registeredPhoneNumber
    }
    return customer?.profile?.phone || customer?.phone || 'N/A'
  }, [type, isGatewayPartner, partner, regularPartner, merchantData, customer])

  // Build customer status
  const customerStatus = React.useMemo(() => {
    if (type === 'partner' && isGatewayPartner) {
      return partner?.isActive && !partner?.isSuspended ? 'ACTIVE' : partner?.isSuspended ? 'SUSPENDED' : 'INACTIVE'
    }
    if (type === 'partner' && regularPartner) {
      return regularPartner?.status || 'unknown'
    }
    if (type === 'merchant' && merchantData) {
      return merchantData.isActive && !merchantData.isSuspended ? 'ACTIVE' : merchantData.isSuspended ? 'SUSPENDED' : 'INACTIVE'
    }
    return customer?.status || 'unknown'
  }, [type, isGatewayPartner, partner, regularPartner, merchantData, customer])

  // Build profile tags
  const profileTags = React.useMemo(() => {
    if (type === 'partner') {
      if (isGatewayPartner) {
        return partner?.isActive ? ['Active'] : []
      } else if (regularPartner) {
        return regularPartner?.isVerified ? ['Verified'] : []
      }
      return []
    }
    return customer?.isVerified ? ['Verified'] : []
  }, [type, isGatewayPartner, partner, regularPartner, customer])

  // Build wallet balance object
  const balance: WalletBalance = React.useMemo(() => {
    if (walletBalance) {
      return {
        walletId: walletBalance.id,
        balance: walletBalance.balance,
        currency: walletBalance.currency,
        lastUpdated: walletBalance.updatedAt
      }
    }
    return {
      walletId: '',
      balance: 0,
      currency: 'UGX',
      lastUpdated: new Date().toISOString()
    }
  }, [walletBalance])

  return (
    <>
      <CustomerProfileHeader
        customer={{
          id: partner?.id || merchantData?.id || customer?.id || id,
          name: customerName,
          type,
          email: customerEmail,
          phone: customerPhone,
          status: customerStatus,
          joinDate: (isGatewayPartner && partner?.createdAt) || merchantData?.onboardedAt || customer?.createdAt || 'N/A',
          location: (isGatewayPartner && partner?.country) || customer?.profile?.country || 'Kampala, Uganda',
          address: 'N/A',
          totalTransactions,
          currentBalance,
          avgTransactionValue,
          successRate,
          kycStatus: type === 'partner' && isGatewayPartner ? 'APPROVED' : (customer?.kycStatus || 'unknown'),
          riskLevel: 'low',
          tags: profileTags,
          notes: type === 'partner' && isGatewayPartner ? `Partner Type: ${partner?.partnerType || 'N/A'}, Tier: ${partner?.tier || 'N/A'}` : 'Customer profile from database',
          walletBalance: type === 'partner' ? null : (walletBalance || null),
          merchantCode: merchantData?.merchantCode || customer?.merchantCode,
          businessTradeName: merchantData?.businessTradeName,
          ownerName: merchantData ? `${merchantData.ownerFirstName || ''} ${merchantData.ownerLastName || ''}`.trim() : undefined,
          userId: merchantData?.userId || customer?.id,
          subscriberType: merchantData?.user?.subscriberType || customer?.subscriberType,
          isSuperMerchant: merchantData?.isSuperMerchant || false  // ✅ Merchant-level super merchant status
        }}
        onBack={onBack}
        onExport={handleExportLegacy}
        onEdit={() => toast.success('Opening edit form...')}
        onResetPin={onResetPin}
        onGoToSettings={handleGoToSettings}
        onGrantSuperMerchant={onGrantSuperMerchant}
        onRevokeSuperMerchant={onRevokeSuperMerchant}
        onManageChildMerchants={onManageChildMerchants}
        isSuperAdmin={isSuperAdmin}
        onLiquidateToDisbursement={() => setLiquidateOpen(true)}
      />

      <CustomerStatsCards
        stats={{
          totalTransactions,
          currentBalance,
          suspensionFund,
          disbursementWalletBalance,
          successRate,
          status: customerStatus,
          joinDate: partner?.createdAt || merchantData?.onboardedAt || customer?.createdAt || 'N/A',
          kycStatus: type === 'partner' ? 'APPROVED' : (customer?.kycStatus || 'unknown'),
          riskLevel: 'low',
          currency: walletBalance?.currency || 'UGX'
        }}
        wallets={allUserWallets}
      />

      {/* Admin: liquidate collection → disbursement for merchants */}
      {isSuperAdmin && (customer?.subscriberType === 'MERCHANT' || merchantData) && (
        <LiquidateToDisbursementModal
          open={liquidateOpen}
          onOpenChange={setLiquidateOpen}
          userId={merchantData?.userId || customer?.id || ''}
          merchantCode={merchantData?.merchantCode || customer?.merchantCode}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-${
          3 + (showActivityTab ? 1 : 0) + (type !== 'partner' ? 1 : 0)
        }`}>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          {showActivityTab && (
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
          )}
          {type !== 'partner' && (
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          )}
          <TabsTrigger value="etranzactKyc" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            ETRANZACT KYC
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <CustomerOverview
            customer={{
              name: customerName,
              email: customerEmail,
              phone: customerPhone,
              status: customerStatus,
              joinDate: (isGatewayPartner && partner?.createdAt) || merchantData?.onboardedAt || customer?.createdAt || 'N/A',
              location: (isGatewayPartner && partner?.country) || customer?.profile?.country || 'Kampala, Uganda',
              address: 'N/A',
              walletBalance: type === 'partner' && isGatewayPartner ? 0 : (walletBalance?.balance ?? 0)
            }}
            type={type}
            profileDetails={{
              ...(type === 'partner' && isGatewayPartner && partner ? {
                partnerName: partner.partnerName,
                partnerType: partner.partnerType,
                tier: partner.tier,
                country: partner.country,
                isActive: partner.isActive,
                isSuspended: partner.isSuspended
              } : {}),
              merchants: merchantData ? {
                businessName: merchantData.businessTradeName || 'N/A',
                businessType: merchantData.businessType || 'N/A',
                registrationNumber: merchantData.merchantCode || 'N/A',
                taxNumber: 'N/A',
                businessAddress: 'N/A',
                contactPerson: `${merchantData.ownerFirstName || ''} ${merchantData.ownerLastName || ''}`.trim() || 'N/A',
                contactPhone: merchantData.registeredPhoneNumber || 'N/A',
                annualRevenue: 0
              } : undefined
            }}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6 mt-6">
          {transactionsError && type !== 'partner' ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Transactions</h3>
              <p className="text-gray-500 mb-4">Unable to retrieve transactions for this user.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {type !== 'partner' && allUserWallets.length > 1 && onWalletChange && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Wallet className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Statement for:</span>
                  <Select
                    value={selectedWalletId ?? 'all'}
                    onValueChange={(v) => onWalletChange(v === 'all' ? undefined : v)}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="All wallets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All wallets</SelectItem>
                      {allUserWallets.map((w: any) => (
                        <SelectItem key={w.id} value={w.id}>
                          {(w.walletType || 'Wallet').replace(/_/g, ' ')} — {Number(w.balance ?? 0).toLocaleString()} UGX
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-gray-400">Consistent balances per wallet</span>
                </div>
              )}
              <CustomerTransactions
                transactions={transactions}
                onExport={handleExportLegacy}
                onFilter={() => toast.success('Opening transaction filters...')}
                isLoading={transactionsLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                allUserWallets={allUserWallets}
                statementWalletId={effectiveWalletId}
                transactionUserId={transactionUserId}
                onExportWalletTransactions={onExportWalletTransactions}
              />
            </>
          )}
        </TabsContent>

        {showActivityTab && (
          <TabsContent value="activity" className="space-y-6 mt-6">
            {activityLogsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading activity logs...</p>
              </div>
            ) : activityLogsError && type !== 'partner' && type !== 'merchant' ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Activity Logs</h3>
                <p className="text-gray-500">Unable to retrieve activity logs for this user.</p>
              </div>
            ) : (
              <CustomerActivity
                activities={activities}
                onExport={handleExportLegacy}
                onFilter={() => toast.success('Opening activity filters...')}
              />
            )}
          </TabsContent>
        )}

        <TabsContent value="settings" className="space-y-6 mt-6">
          {type === 'partner' ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Settings are not available for partners.</p>
            </div>
          ) : (
            <CustomerSettings
              type={type}
              customerId={customer?.id || id}
              customerStatus={customer?.status || 'unknown'}
              customerPhone={customer?.profile?.phone || customer?.phone || ''}
              walletBalance={walletBalance?.balance ?? 0}
              walletId={walletBalance?.id}
              currency={walletBalance?.currency || 'UGX'}
              allUserWallets={type !== 'partner' ? allUserWallets : undefined}
              merchantId={merchantData?.id}
              merchantCode={merchantData?.merchantCode}
              collectionFeeMode={merchantData?.collectionFeeMode ?? undefined}
              collectionCustomerSharePercent={merchantData?.collectionCustomerSharePercent ?? undefined}
              onActionComplete={() => {
                window.location.reload()
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="etranzactKyc" className="mt-6">
          <div className="w-full rounded-xl overflow-hidden border bg-white">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">ETRANZACT KYC</div>
                <div className="text-xs text-gray-500">
                  Embedded onboarding page from Xcel
                </div>
              </div>
              <a
                href="https://onboard.xcelapp.com/onboard/rukapay"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Open in new tab
              </a>
            </div>
            <div className="w-full" style={{ height: '75vh' }}>
              <iframe
                title="ETRANZACT KYC"
                src="https://onboard.xcelapp.com/onboard/rukapay"
                className="w-full h-full"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
