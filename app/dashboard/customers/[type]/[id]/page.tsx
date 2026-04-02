"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Navbar from '@/components/dashboard/Navbar'
import { CustomerProfileContent } from '@/components/dashboard/customers/profile/CustomerProfileContent'
import { CustomerProfileError } from '@/components/dashboard/customers/profile/CustomerProfileError'
import { CustomerProfileLoading } from '@/components/dashboard/customers/profile/CustomerProfileLoading'
import { SuperMerchantConfirmModal } from '@/components/dashboard/customers/SuperMerchantConfirmModal'
import { useCustomerProfile } from '@/lib/hooks/useCustomerProfile'
import { useCustomerStats } from '@/lib/hooks/useCustomerStats'
import { useCustomerTransactions } from '@/lib/hooks/useCustomerTransactions'
import { useCustomerActivities } from '@/lib/hooks/useCustomerActivities'
import { useAuth } from '@/lib/hooks/useAuth'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import {
  downloadTextFile,
  fetchAllWalletTransactionsForUser,
  transactionsToCsv,
} from '@/lib/utils/exportWalletTransactions'

const CustomerProfilePage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageLimit] = useState(10)
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>(undefined)
  const [grantModalOpen, setGrantModalOpen] = useState(false)
  const [revokeModalOpen, setRevokeModalOpen] = useState(false)
  const { user } = useAuth()
  const isSuperAdmin = (user as any)?.role === 'SUPER_ADMIN'

  const profileData = useCustomerProfile(currentPage, pageLimit, selectedWalletId)
  
  const {
    type,
    id,
    customer,
    merchantData,
    partner,
    regularPartner,
    isGatewayPartner,
    walletBalance,
    allUserWallets,
    partnerWallets,
    partnerWalletIds,
    transactionsData,
    transactionsLoading,
    transactionsError,
    partnerTransactionsData,
    partnerTransactionsLoading,
    activityLogsData,
    activityLogsLoading,
    activityLogsError,
    partnerActivityLogsData,
    partnerActivityLogsLoading,
    isLoading,
    partnerLoading,
    customerLoading,
    merchantsLoading,
    partnerError,
    customerError,
    transactionUserId,
    effectiveWalletId,
  } = profileData

  // Process transactions (pass full transactionsData so hook can read total/limit for pagination)
  const { transactions, totalTransactions, totalPages } = useCustomerTransactions({
    type: type as string,
    isGatewayPartner: !!isGatewayPartner,
    partnerTxData: partnerTransactionsData,
    userTxData: transactionsData ?? { transactions: [], total: 0, limit: pageLimit },
    partnerWalletIds,
    partnerId: partner?.id || '',
    currentPage,
    pageLimit
  })

  // Process activities
  const { activities } = useCustomerActivities({
    type,
    partnerWalletIds,
    partnerActivityLogsData,
    activityLogsData
  })

  // Use wallet-service wallets for stats when available (merchant/subscriber) so balances are correct
  const walletsForStats = type === 'partner' ? (partnerWallets || []) : (allUserWallets?.length ? allUserWallets : (customer?.wallets || []))

  // Calculate stats
  const { currentBalance, suspensionFund, disbursementWalletBalance, avgTransactionValue, successRate } = useCustomerStats({
    type,
    transactions: transactionsData?.transactions || [],
    partnerTransactions: partnerTransactionsData?.data?.data || partnerTransactionsData?.data || partnerTransactionsData?.transactions || [],
    partnerWallets,
    partnerWalletIds,
    partnerId: partner?.id || '',
    wallets: walletsForStats,
    walletBalance
  })

  // Handle reset PIN
  const handleResetPin = async () => {
    if (type === 'partner') {
      toast.error('PIN reset is not available for partners.')
      return
    }
    
    const customerPhone = customer?.profile?.phone || customer?.phone
    if (!customerPhone || customerPhone === 'N/A') {
      toast.error('Customer phone number not found. Cannot reset PIN.')
      return
    }

    try {
      const response = await api.post('/auth/reset-pin-by-phone', { phone: customerPhone })
      const data = response.data

      if (data?.success) {
        toast.success(data?.message || 'PIN has been reset successfully. A temporary PIN has been sent to the customer\'s phone number.')
      } else {
        throw new Error(data?.message || 'Failed to reset PIN')
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to reset PIN. Please try again.'
      toast.error(errorMessage)
    }
  }

  // Super Merchant Management - open modals
  const handleGrantSuperMerchant = () => {
    if (!isSuperAdmin || type !== 'merchant') return
    const merchantId = merchantData?.id
    if (!merchantId) {
      toast.error('Unable to identify merchant ID')
      return
    }
    setGrantModalOpen(true)
  }

  const handleRevokeSuperMerchant = () => {
    if (!isSuperAdmin || type !== 'merchant') return
    const merchantId = merchantData?.id
    if (!merchantId) {
      toast.error('Unable to identify merchant ID')
      return
    }
    setRevokeModalOpen(true)
  }

  // Super Merchant API calls (called from modal confirm)
  // ✅ Now uses merchantId (merchant-level) instead of userId (user-level)
  const handleConfirmGrant = async () => {
    const merchantId = merchantData?.id
    if (!merchantId) {
      toast.error('Unable to identify merchant ID')
      return
    }
    const response = await api.post('/super-merchant/grant', { merchantId })
    toast.success(response.data.message || 'Successfully promoted to SUPER_MERCHANT')
    await queryClient.invalidateQueries({ queryKey: ['merchants'] })
    router.refresh()
  }

  const handleConfirmRevoke = async () => {
    const merchantId = merchantData?.id
    if (!merchantId) {
      toast.error('Unable to identify merchant ID')
      return
    }
    const response = await api.delete(`/super-merchant/revoke/${merchantId}`)
    toast.success(response.data.message || 'Successfully revoked SUPER_MERCHANT status')
    await queryClient.invalidateQueries({ queryKey: ['merchants'] })
    router.refresh()
  }

  const handleManageChildMerchants = () => {
    // Navigate to super merchants management page
    router.push('/dashboard/customers/super-merchants')
  }

  const handleExportWalletTransactions = async (walletId: string | undefined, label: string) => {
    if (type === 'partner') {
      toast.error('Wallet export is not available for this profile type.')
      return
    }
    if (!transactionUserId) {
      toast.error('Unable to resolve user for export.')
      return
    }

    const toastId = toast.loading('Fetching transactions for export…')
    try {
      const rows = await fetchAllWalletTransactionsForUser(transactionUserId, walletId)
      const csv = transactionsToCsv(rows)
      const safeLabel = label.replace(/[^\w\s-]+/g, '').replace(/\s+/g, '_').slice(0, 48) || 'wallet'
      downloadTextFile(`transactions_${safeLabel}_${Date.now()}.csv`, csv)
      toast.success(`Exported ${rows.length} transaction${rows.length === 1 ? '' : 's'}`, { id: toastId })
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Export failed'
      toast.error(msg, { id: toastId })
    }
  }

  // Handle loading state
  if (isLoading) {
    return <CustomerProfileLoading />
  }

  // Handle error states
  if (type === 'partner') {
    // All partners (gateway and regular) display on this page - no redirect.
    // Gateway partners: partner data from API; regular partners: from users (regularPartner).
    
    // Only show error if:
    // - Not a gateway partner (not redirecting)
    // - No customer data (which includes regularPartner for regular partners)
    // - No regularPartner found
    // - Loading is complete
    if (!isGatewayPartner && !customer && !regularPartner && !partnerLoading && !customerLoading) {
      return (
        <CustomerProfileError
          title="Partner Not Found"
          message="The partner you're looking for doesn't exist or you don't have permission to view it."
          onBack={() => router.back()}
        />
      )
    }
  } else if (type === 'merchant') {
    if (!merchantsLoading && !merchantData) {
      return (
        <CustomerProfileError
          title="Merchant Not Found"
          message="The merchant you're looking for doesn't exist or you don't have permission to view it."
          onBack={() => router.back()}
        />
      )
    }
  } else {
    if (customerError || !customer) {
      return (
        <CustomerProfileError
          title="Customer Not Found"
          message="The customer you're looking for doesn't exist or you don't have permission to view it."
          onBack={() => router.back()}
        />
      )
    }
  }

  // Determine transaction loading state
  const finalTransactionsLoading = type === 'partner' ? partnerTransactionsLoading : transactionsLoading
  const finalActivityLogsLoading = type === 'partner' ? partnerActivityLogsLoading : activityLogsLoading

  const merchantName = merchantData?.businessTradeName || 'This merchant'
  const ownerName = merchantData ? `${merchantData.ownerFirstName || ''} ${merchantData.ownerLastName || ''}`.trim() : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Super Merchant confirmation modals */}
          <SuperMerchantConfirmModal
            open={grantModalOpen}
            onOpenChange={setGrantModalOpen}
            action="promote"
            merchantName={merchantName}
            ownerName={ownerName || undefined}
            onConfirm={handleConfirmGrant}
          />
          <SuperMerchantConfirmModal
            open={revokeModalOpen}
            onOpenChange={setRevokeModalOpen}
            action="revoke"
            merchantName={merchantName}
            ownerName={ownerName || undefined}
            onConfirm={handleConfirmRevoke}
          />

          <CustomerProfileContent
            type={type as string}
            id={id as string}
            customer={customer}
            merchantData={merchantData}
            partner={partner}
            regularPartner={regularPartner}
            isGatewayPartner={!!isGatewayPartner}
            walletBalance={walletBalance}
            allUserWallets={allUserWallets}
            selectedWalletId={selectedWalletId}
            onWalletChange={(walletId) => {
              setSelectedWalletId(walletId)
              setCurrentPage(1)
            }}
            currentBalance={currentBalance}
            suspensionFund={suspensionFund}
            disbursementWalletBalance={disbursementWalletBalance}
            avgTransactionValue={avgTransactionValue}
            successRate={successRate}
            totalTransactions={totalTransactions}
            transactions={transactions}
            transactionsLoading={finalTransactionsLoading}
            transactionsError={transactionsError}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            transactionUserId={type !== 'partner' ? transactionUserId : undefined}
            effectiveWalletId={type !== 'partner' ? effectiveWalletId : undefined}
            onExportWalletTransactions={handleExportWalletTransactions}
            activities={activities}
            activityLogsLoading={finalActivityLogsLoading}
            activityLogsError={activityLogsError}
            onBack={() => router.back()}
            onResetPin={handleResetPin}
            onGrantSuperMerchant={handleGrantSuperMerchant}
            onRevokeSuperMerchant={handleRevokeSuperMerchant}
            onManageChildMerchants={handleManageChildMerchants}
            isSuperAdmin={isSuperAdmin}
            partnerWallets={partnerWallets || []}
          />
        </div>
      </main>
    </div>
  )
}

export default CustomerProfilePage
