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
  
  // Fetch wallet transactions for this user with pagination (only for non-partners)
  const { data: transactionsData, isLoading: transactionsLoading } = useWalletTransactions(
    type !== 'partner' ? (id as string) : '', 
    currentPage, 
    pageLimit
  )
  
  // Get wallet data from user data (now included in user response)
  const users = Array.isArray(customerData) ? customerData : ((customerData as any)?.data || [])
  const customer = type !== 'partner' ? (users.find((user: any) => user.id === id) || null) : null;
  
  // Get partner data
  const partner = type === 'partner' ? (partnerData?.data || null) : null;
  
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

  
  // Update to match the new API response structure
  const transactions = transactionsData?.transactions || []
  const totalTransactions = transactionsData?.total || 0
  const totalPages = Math.ceil(totalTransactions / (transactionsData?.limit || 10))
  const wallet = walletBalance

  console.log("activityLogsData====>", activityLogsData)

  // Activity logs data with error handling
  const activities = activityLogsData?.logs || []
  const totalActivities = activityLogsData?.total || 0
  const activityPages = Math.ceil(totalActivities / (activityLogsData?.limit || 10))

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

  // Calculate stats from real data
  const currentBalance = wallet?.balance || 0
  const avgTransactionValue = transactions.length > 0 ? 
    transactions.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0) / transactions.length : 0
  const successRate = transactions.length > 0 ? 
    (transactions.filter((tx: any) => tx.status === 'SUCCESS').length / transactions.length) * 100 : 0

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
              totalTransactions: type === 'partner' ? 0 : totalTransactions,
              currentBalance: type === 'partner' ? 0 : currentBalance,
              avgTransactionValue: type === 'partner' ? 0 : avgTransactionValue,
              successRate: type === 'partner' ? 0 : successRate,
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
              totalTransactions: type === 'partner' ? 0 : totalTransactions,
              currentBalance: type === 'partner' ? 0 : currentBalance,
              suspensionFund: type === 'partner' ? 0 : avgTransactionValue,
              successRate: type === 'partner' ? 0 : successRate,
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
              {type === 'partner' ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Transaction history is not available for partners.</p>
                </div>
              ) : (
                <CustomerTransactions
                  transactions={transactions}
                  onExport={handleExport}
                  onFilter={() => toast.success('Opening transaction filters...')}
                  isLoading={transactionsLoading}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 mt-6">
              {type === 'partner' ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Activity logs are not available for partners.</p>
                </div>
              ) : activityLogsError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Activity Logs</h3>
                  <p className="text-gray-500">Unable to retrieve activity logs for this user.</p>
                </div>
              ) : activityLogsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading activity logs...</p>
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