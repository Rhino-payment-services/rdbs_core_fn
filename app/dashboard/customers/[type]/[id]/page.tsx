"use client"
import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/dashboard/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User,
  CreditCard,
  Activity,
  Settings,
  AlertTriangle
} from 'lucide-react'
import CustomerProfileHeader from '@/components/dashboard/customers/profile/CustomerProfileHeader'
import toast from 'react-hot-toast'
import CustomerStatsCards from '@/components/dashboard/customers/profile/CustomerStatsCards'
import CustomerOverview from '@/components/dashboard/customers/profile/CustomerOverview'
import CustomerTransactions from '@/components/dashboard/customers/profile/CustomerTransactions'
import CustomerActivity from '@/components/dashboard/customers/profile/CustomerActivity'
import CustomerSettings from '@/components/dashboard/customers/profile/CustomerSettings'
import { useUser,useUsers ,useWalletTransactions, useWalletBalance, useUserActivityLogs, useApiPartner } from '@/lib/hooks/useApi'
import { useMerchants } from '@/lib/hooks/useMerchants'
import { useAllTransactions } from '@/lib/hooks/useTransactions'
import { useActivityLogs } from '@/lib/hooks/useActivityLogs'
import type { TransactionFilters, Wallet, WalletBalance } from '@/lib/types/api'
import api from '@/lib/axios'

const CustomerProfilePage = () => {
  const params = useParams()
  const router = useRouter()
  const { type, id } = params

  console.log("id====>", id)
  const [activeTab, setActiveTab] = useState("overview")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageLimit] = useState(10) // You can make this configurable

  // Fetch partner data when type is 'partner'
  const { data: partnerData, isLoading: partnerLoading, error: partnerError } = useApiPartner(
    type === 'partner' ? (id as string) : undefined
  )
  
  // Fetch customer data (only if not a partner)
  const { data: customerData, isLoading: customerLoading, error: customerError } = useUsers()
  
  // Fetch merchants data when type is 'merchant'
  const { data: merchantsData, isLoading: merchantsLoading } = useMerchants({
    page: 1,
    pageSize: 1000  // Get all merchants to find by userId
  })

  console.log("customerData====>", customerData)
  console.log("merchantsData====>", merchantsData)
  console.log("partnerData====>", partnerData)
  
  // Fetch partner wallets if this is a partner view
  const [partnerWallets, setPartnerWallets] = React.useState<Wallet[]>([])
  const [partnerWalletIds, setPartnerWalletIds] = React.useState<string[]>([])
  
  // Get partner data
  const partner = type === 'partner' ? (partnerData?.data || null) : null;
  
  React.useEffect(() => {
    if (type === 'partner' && partner?.id) {
      // Fetch partner wallets - try different endpoint formats
      Promise.all([
        api.get(`/finance/wallets/partner?partnerId=${partner.id}&limit=1000`).catch(() => null),
        api.get(`/finance/wallets/partner?id=${partner.id}&limit=1000`).catch(() => null),
        api.get(`/finance/wallets/partner?limit=1000`).catch(() => null),
      ])
        .then((responses) => {
          // Find the first successful response
          const response = responses.find(r => r !== null)
          if (response) {
            const wallets = response.data?.wallets || response.data?.data || []
            // Filter wallets by partnerId if we got all wallets
            const filteredWallets = wallets.filter((w: Wallet) => 
              w.partnerId === partner.id
            )
            setPartnerWallets(filteredWallets)
            setPartnerWalletIds(filteredWallets.map((w: Wallet) => w.id))
            console.log('Partner wallets found:', filteredWallets.length, filteredWallets)
          } else {
            setPartnerWallets([])
            setPartnerWalletIds([])
          }
        })
        .catch((error) => {
          console.error('Error fetching partner wallets:', error)
          setPartnerWallets([])
          setPartnerWalletIds([])
        })
    } else {
      setPartnerWallets([])
      setPartnerWalletIds([])
    }
  }, [type, partner?.id])

  // Fetch wallet transactions for this user with pagination (only for non-partners)
  const { data: transactionsData, isLoading: transactionsLoading } = useWalletTransactions(
    type !== 'partner' ? (id as string) : '', 
    currentPage, 
    pageLimit
  )

  // Fetch transactions for partner wallets
  const { data: partnerTransactionsData, isLoading: partnerTransactionsLoading } = useAllTransactions(
    type === 'partner' && partnerWalletIds.length > 0
      ? {
          page: currentPage,
          limit: pageLimit,
        }
      : undefined
  )
  
  // Get wallet data from user data (now included in user response)
  const users = Array.isArray(customerData) ? customerData : ((customerData as any)?.data || [])
  const customer = type !== 'partner' ? (users.find((user: any) => user.id === id) || null) : null;
  
  // Get merchant data if this is a merchant view
  const merchants = merchantsData?.merchants || []
  const merchantData = type === 'merchant' 
    ? merchants.find((m: any) => m.id === id || m.userId === id) // Prioritize merchant ID match first
    : null;
  
  console.log("merchantData====>", merchantData)
  console.log("partner====>", partner)
  
  const wallets = customer?.wallets || [];
  const personalWallet = wallets.find((wallet: any) => wallet.walletType === 'PERSONAL');
  const businessWallet = wallets.find((wallet: any) => wallet.walletType === 'BUSINESS');
  
  // Use personal wallet for display (or business wallet if no personal wallet)
  const walletBalance = personalWallet || businessWallet || null;

  // Fetch user activity logs (only for non-partners)
  const { data: activityLogsData, isLoading: activityLogsLoading, error: activityLogsError } = useUserActivityLogs(
    type !== 'partner' ? (id as string) : '',
    currentPage,
    pageLimit
  )

  // Fetch activity logs for partners (will filter client-side by wallet IDs)
  const { data: partnerActivityLogsData, isLoading: partnerActivityLogsLoading } = useActivityLogs(
    type === 'partner'
      ? {
          page: currentPage,
          limit: pageLimit * 2, // Fetch more to account for filtering
        }
      : {}
  )

  console.log("customer====>", customer)
  console.log("wallets====>", wallets)
  console.log("personalWallet====>", personalWallet)
  console.log("businessWallet====>", businessWallet)
  console.log("walletBalance====>", walletBalance)
  console.log("transactionsData====>", transactionsData)
  console.log("activityLogsData====>", activityLogsData)
  console.log("activityLogsError====>", activityLogsError)

  // Handle loading and error states
  const isLoading = (type === 'partner' ? partnerLoading : customerLoading) || (type === 'merchant' && merchantsLoading)
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading customer profile...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Handle error states
  if (type === 'partner') {
    if (partnerError || !partner) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Partner Not Found</h1>
                  <p className="text-gray-600 mb-4">The partner you're looking for doesn't exist or you don't have permission to view it.</p>
                  <button 
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      )
    }
  } else {
    if (customerError || !customerData) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Customer Not Found</h1>
                  <p className="text-gray-600 mb-4">The customer you're looking for doesn't exist or you don't have permission to view it.</p>
                  <button 
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      )
    }
  }

  
  // Get transactions - for partners, filter by wallet IDs; for others, use user transactions
  const allTransactions = type === 'partner' 
    ? (partnerTransactionsData?.data?.data || partnerTransactionsData?.data || partnerTransactionsData?.transactions || [])
    : (transactionsData?.transactions || [])
  
  // Filter partner transactions to only include those from partner wallets
  const filteredPartnerTransactions = React.useMemo(() => {
    if (type !== 'partner' || partnerWalletIds.length === 0) {
      return []
    }
    return allTransactions.filter((tx: any) => {
      // Check if transaction involves any partner wallet (as source or destination)
      const sourceWalletId = tx.sourceWalletId || tx.sourceWallet?.id || tx.fromWalletId
      const destWalletId = tx.destinationWalletId || tx.destinationWallet?.id || tx.toWalletId
      const walletId = tx.walletId || tx.wallet?.id
      
      return partnerWalletIds.includes(sourceWalletId) || 
             partnerWalletIds.includes(destWalletId) ||
             partnerWalletIds.includes(walletId) ||
             (tx.partnerId && tx.partnerId === partner?.id)
    })
  }, [type, allTransactions, partnerWalletIds, partner?.id])

  // Paginate filtered partner transactions
  const paginatedPartnerTransactions = React.useMemo(() => {
    if (type !== 'partner') return []
    const start = (currentPage - 1) * pageLimit
    const end = start + pageLimit
    return filteredPartnerTransactions.slice(start, end)
  }, [type, filteredPartnerTransactions, currentPage, pageLimit])

  // Use filtered transactions for partners, regular transactions for others
  const transactions = type === 'partner' ? paginatedPartnerTransactions : allTransactions
  
  // Calculate totals and pagination
  const totalTransactions = type === 'partner' 
    ? filteredPartnerTransactions.length
    : (transactionsData?.total || 0)
  const totalPages = type === 'partner'
    ? Math.ceil(filteredPartnerTransactions.length / pageLimit)
    : Math.ceil(totalTransactions / (transactionsData?.limit || 10))
  const wallet = walletBalance

  console.log("activityLogsData====>", activityLogsData)

  // Activity logs data with error handling - for partners, filter by wallet IDs
  const filteredPartnerActivities = React.useMemo(() => {
    if (type !== 'partner' || partnerWalletIds.length === 0) {
      return []
    }
    const allLogs = partnerActivityLogsData?.logs || []
    // Filter logs that mention partner wallet IDs in metadata or description
    return allLogs.filter((log: any) => {
      const logStr = JSON.stringify(log).toLowerCase()
      return partnerWalletIds.some(walletId => logStr.includes(walletId.toLowerCase()))
    })
  }, [type, partnerActivityLogsData?.logs, partnerWalletIds])

  const activities = type === 'partner' 
    ? filteredPartnerActivities
    : (activityLogsData?.logs || [])
  const totalActivities = type === 'partner'
    ? filteredPartnerActivities.length
    : (activityLogsData?.total || 0)
  const activityPages = Math.ceil(totalActivities / pageLimit)

  // Create wallet balance object for components
  const balance: WalletBalance = wallet ? {
    walletId: wallet.id,
    balance: wallet.balance,
    currency: wallet.currency,
    lastUpdated: wallet.updatedAt
  } : {
    walletId: '',
    balance: 0,
    currency: 'UGX',
    lastUpdated: new Date().toISOString()
  }

  // Calculate stats from real data - use full filtered list for partners, paginated for display
  const statsTransactions = type === 'partner' ? filteredPartnerTransactions : transactions
  
  // Find escrow/reserve wallets for partners
  const escrowWallets = React.useMemo(() => {
    if (type !== 'partner') return []
    return partnerWallets.filter((w: Wallet) => 
      w.walletType?.toUpperCase().includes('ESCROW') || 
      w.walletType?.toUpperCase().includes('RESERVE') ||
      w.walletType?.toUpperCase().includes('SUSPENSION')
    )
  }, [type, partnerWallets])
  
  // Calculate suspension fund (escrow balance)
  const suspensionFund = React.useMemo(() => {
    if (type === 'partner') {
      // For partners: Use escrow wallet balance if available (most accurate)
      if (escrowWallets.length > 0) {
        return escrowWallets.reduce((sum, w) => sum + (parseFloat(w.balance?.toString() || '0') || 0), 0)
      }
      // Otherwise, calculate from fees of completed transactions (fees held in escrow before disbursement)
      // Only count fees from successful/completed transactions that haven't been disbursed
      const escrowFees = filteredPartnerTransactions
        .filter((tx: any) => tx.status === 'SUCCESS' || tx.status === 'COMPLETED')
        .reduce((sum: number, tx: any) => {
          // Get fee amount - prefer main fee field, fallback to fee breakdown
          const fee = parseFloat(tx.fee?.toString() || '0') || 0
          const rukapayFee = parseFloat(tx.rukapayFee?.toString() || '0') || 0
          const thirdPartyFee = parseFloat(tx.thirdPartyFee?.toString() || '0') || 0
          const processingFee = parseFloat(tx.processingFee?.toString() || '0') || 0
          // Use main fee if available, otherwise sum fee breakdown
          return sum + (fee > 0 ? fee : (rukapayFee + thirdPartyFee + processingFee))
        }, 0)
      return escrowFees
    } else {
      // For regular users: Use escrow wallet if available, otherwise 0
      const userEscrowWallet = wallets.find((w: any) => 
        w.walletType?.toUpperCase().includes('ESCROW') || 
        w.walletType?.toUpperCase().includes('RESERVE') ||
        w.walletType?.toUpperCase().includes('SUSPENSION')
      )
      return userEscrowWallet ? (parseFloat(userEscrowWallet.balance?.toString() || '0') || 0) : 0
    }
  }, [type, escrowWallets, filteredPartnerTransactions, wallets])
  
  const currentBalance = type === 'partner'
    ? (partnerWallets.reduce((sum, w) => sum + (parseFloat(w.balance?.toString() || '0') || 0), 0))
    : (wallet?.balance || 0)
  const avgTransactionValue = statsTransactions.length > 0 ? 
    statsTransactions.reduce((sum: number, tx: any) => sum + (parseFloat(tx.amount?.toString() || '0') || 0), 0) / statsTransactions.length : 0
  const successRate = statsTransactions.length > 0 ? 
    (statsTransactions.filter((tx: any) => tx.status === 'SUCCESS').length / statsTransactions.length) * 100 : 0

  // Event handlers
  const handleExport = () => {
    toast.success('Exporting customer data...')
  }

  const handleEdit = () => {
    toast.success('Opening edit form...')
  }

  const handleActions = () => {
    toast.success('Opening actions menu...')
  }

  const handleConfigureNotifications = () => {
    toast.success('Configuring notifications...')
  }

  const handleConfigureSecurity = () => {
    toast.success('Configuring security settings...')
  }

  const handleViewLoginHistory = () => {
    toast.success('Opening login history...')
  }

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

  const handleGoToSettings = () => {
    setActiveTab('settings')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Customer Profile Header */}
          <CustomerProfileHeader
            customer={{
              id: partner?.id || customer?.id || id as string,
              // For partners, show partner name; for merchants, show business name; for others, show personal name with fallbacks
              name: type === 'partner' && partner?.partnerName
                ? partner.partnerName
                : type === 'merchant' && merchantData?.businessTradeName
                  ? merchantData.businessTradeName
                  : (
                      // Try profile firstName/lastName first
                      `${customer?.profile?.firstName || ''} ${customer?.profile?.lastName || ''}`.trim() ||
                      // Then try direct user firstName/lastName
                      `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() ||
                      // Then fall back to email
                      customer?.email ||
                      // Finally show Unknown Customer
                      'Unknown Customer'
                    ),
              type: type as string,
              email: type === 'partner' && partner?.contactEmail
                ? partner.contactEmail
                : type === 'merchant' && merchantData?.businessEmail
                  ? merchantData.businessEmail
                  : customer?.email || 'N/A',
              phone: type === 'partner' && partner?.contactPhone
                ? partner.contactPhone
                : type === 'merchant' && merchantData?.registeredPhoneNumber
                  ? merchantData.registeredPhoneNumber
                  : customer?.profile?.phone || customer?.phone || 'N/A',
              status: type === 'partner' 
                ? (partner?.isActive && !partner?.isSuspended ? 'ACTIVE' : partner?.isSuspended ? 'SUSPENDED' : 'INACTIVE')
                : type === 'merchant' && merchantData
                  ? (merchantData.isActive && !merchantData.isSuspended ? 'ACTIVE' : merchantData.isSuspended ? 'SUSPENDED' : 'INACTIVE')
                  : customer?.status || 'unknown',
              joinDate: partner?.createdAt || merchantData?.onboardedAt || customer?.createdAt || 'N/A',
              location: partner?.country || 'Kampala, Uganda',
              address: 'N/A',
              totalTransactions: totalTransactions,
              currentBalance: currentBalance,
              avgTransactionValue: avgTransactionValue,
              successRate: successRate,
              kycStatus: type === 'partner' ? 'APPROVED' : (customer?.kycStatus || 'unknown'),
              riskLevel: 'low',
              tags: type === 'partner' 
                ? (partner?.isActive ? ['Active'] : [])
                : (customer?.isVerified ? ['Verified'] : []),
              notes: type === 'partner' ? `Partner Type: ${partner?.partnerType || 'N/A'}, Tier: ${partner?.tier || 'N/A'}` : 'Customer profile from database',
              walletBalance: type === 'partner' ? null : (wallet as Wallet),
              // Pass merchant-specific data for merchants
              merchantCode: merchantData?.merchantCode || customer?.merchantCode,
              businessTradeName: merchantData?.businessTradeName,
              ownerName: merchantData ? `${merchantData.ownerFirstName || ''} ${merchantData.ownerLastName || ''}`.trim() : undefined
            }}
            onBack={() => router.back()}
            onExport={handleExport}
            onEdit={handleEdit}
            onResetPin={handleResetPin}
            onGoToSettings={handleGoToSettings}
          />

          {/* Stats Cards */}
          <CustomerStatsCards
            stats={{
              totalTransactions: totalTransactions,
              currentBalance: currentBalance,
              suspensionFund: suspensionFund,
              successRate: successRate,
              status: type === 'partner' 
                ? (partner?.isActive && !partner?.isSuspended ? 'ACTIVE' : partner?.isSuspended ? 'SUSPENDED' : 'INACTIVE')
                : type === 'merchant' && merchantData
                  ? (merchantData.isActive && !merchantData.isSuspended ? 'ACTIVE' : merchantData.isSuspended ? 'SUSPENDED' : 'INACTIVE')
                  : (customer?.status || 'unknown'),
              joinDate: partner?.createdAt || merchantData?.onboardedAt || customer?.createdAt || 'N/A',
              kycStatus: type === 'partner' ? 'APPROVED' : (customer?.kycStatus || 'unknown'),
              riskLevel: 'low',
              currency: wallet?.currency || 'UGX'
            }}
          />

          {/* Profile Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <CustomerOverview
                customer={{
                  // For partners, show partner name; for merchants, show business name; for others, show personal name with fallbacks
                  name: type === 'partner' && partner?.partnerName
                    ? partner.partnerName
                    : type === 'merchant' && merchantData?.businessTradeName
                      ? merchantData.businessTradeName
                      : (
                          // Try profile firstName/lastName first
                          `${customer?.profile?.firstName || ''} ${customer?.profile?.lastName || ''}`.trim() ||
                          // Then try direct user firstName/lastName
                          `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() ||
                          // Then fall back to email
                          customer?.email ||
                          // Finally show Unknown Customer
                          'Unknown Customer'
                        ),
                  email: type === 'partner' && partner?.contactEmail
                    ? partner.contactEmail
                    : type === 'merchant' && merchantData?.businessEmail
                      ? merchantData.businessEmail
                      : customer?.email || 'N/A',
                  phone: type === 'partner' && partner?.contactPhone
                    ? partner.contactPhone
                    : type === 'merchant' && merchantData?.registeredPhoneNumber
                      ? merchantData.registeredPhoneNumber
                      : customer?.phone || 'N/A',
                  status: type === 'partner' 
                    ? (partner?.isActive && !partner?.isSuspended ? 'ACTIVE' : partner?.isSuspended ? 'SUSPENDED' : 'INACTIVE')
                    : type === 'merchant' && merchantData
                      ? (merchantData.isActive && !merchantData.isSuspended ? 'ACTIVE' : merchantData.isSuspended ? 'SUSPENDED' : 'INACTIVE')
                      : (customer?.status || 'unknown'),
                  joinDate: partner?.createdAt || merchantData?.onboardedAt || customer?.createdAt || 'N/A',
                  location: partner?.country || 'Kampala, Uganda',
                  address: 'N/A',
                  walletBalance: type === 'partner' ? 0 : (wallet?.balance || 0)
                }}
                type={type as string}
                profileDetails={{
                  // Partner-specific profile details
                  ...(type === 'partner' && partner ? {
                    partnerName: partner.partnerName,
                    partnerType: partner.partnerType,
                    tier: partner.tier,
                    country: partner.country,
                    isActive: partner.isActive,
                    isSuspended: partner.isSuspended
                  } : {}),
                  // Merchant-specific profile details
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
              <CustomerTransactions
                transactions={transactions}
                onExport={handleExport}
                onFilter={() => toast.success('Opening transaction filters...')}
                isLoading={type === 'partner' ? partnerTransactionsLoading : transactionsLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 mt-6">
              {(type === 'partner' ? partnerActivityLogsLoading : activityLogsLoading) ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading activity logs...</p>
                </div>
              ) : activityLogsError && type !== 'partner' ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Activity Logs</h3>
                  <p className="text-gray-500">Unable to retrieve activity logs for this user.</p>
                </div>
              ) : (
                <CustomerActivity
                  activities={activities}
                  onExport={handleExport}
                  onFilter={() => toast.success('Opening activity filters...')}
                />
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-6">
              {type === 'partner' ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Settings are not available for partners.</p>
                </div>
              ) : (
                <CustomerSettings
                  customerId={customer?.id || id as string}
                  customerStatus={customer?.status || 'unknown'}
                  customerPhone={customer?.profile?.phone || customer?.phone || ''}
                  walletBalance={wallet?.balance || 0}
                  currency={wallet?.currency || 'UGX'}
                  onActionComplete={() => {
                    // Refresh data after actions
                    window.location.reload()
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default CustomerProfilePage 