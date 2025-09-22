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
import { useUser,useUsers ,useWalletTransactions, useWalletBalance, useUserActivityLogs } from '@/lib/hooks/useApi'
import type { TransactionFilters, Wallet, WalletBalance } from '@/lib/types/api'

const CustomerProfilePage = () => {
  const params = useParams()
  const router = useRouter()
  const { type, id } = params

  console.log("id====>", id)
  const [activeTab, setActiveTab] = useState("overview")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageLimit] = useState(10) // You can make this configurable

  // Fetch customer data
  const { data: customerData, isLoading: customerLoading, error: customerError } = useUsers()

  console.log("customerData====>", customerData)
  
  // Fetch wallet transactions for this user with pagination
  const { data: transactionsData, isLoading: transactionsLoading } = useWalletTransactions(
    id as string, 
    currentPage, 
    pageLimit
  )
  
  // Fetch wallet balance if customer has wallet
  const { data: walletBalance, isLoading: balanceLoading, error: walletError } = useWalletBalance(id as string)

  // Fetch user activity logs
  const { data: activityLogsData, isLoading: activityLogsLoading, error: activityLogsError } = useUserActivityLogs(
    id as string,
    currentPage,
    pageLimit
  )

  console.log("walletBalance====>", walletBalance)
  console.log("transactionsData====>", transactionsData)
  console.log("activityLogsData====>", activityLogsData)
  console.log("walletError====>", walletError)
  console.log("activityLogsError====>", activityLogsError)

  // Handle loading and error states
  if (customerLoading) {
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

  const customer: any = customerData.filter((customer: any) => customer.id == id)[0] || {
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: '',
    createdAt: '',
  }
  console.log("customer====>", customer)
  
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Customer Profile Header */}
          <CustomerProfileHeader
            customer={{
              id: customer.id || id as string,
              name: `${customer?.profile?.firstName || ''} ${customer?.profile?.lastName || ''}`.trim() || 'Unknown Customer',
              type: type as string,
              email: customer.email || 'N/A',
              phone: customer.profile?.phone || 'N/A',
              status: customer.status || 'unknown',
              joinDate: customer.createdAt || 'N/A',
              location: 'Kampala, Uganda',
              address: 'N/A',
              totalTransactions,
              currentBalance: currentBalance, // Replace with current balance
              avgTransactionValue,
              successRate,
              kycStatus: customer.kycStatus || 'unknown',
              riskLevel: 'low',
              tags: customer.isVerified ? ['Verified'] : [],
              notes: 'Customer profile from database',
              walletBalance: wallet as Wallet
            }}
            onBack={() => router.back()}
            onExport={handleExport}
            onEdit={handleEdit}
            onActions={handleActions}
          />

          {/* Stats Cards */}
          <CustomerStatsCards
            stats={{
              totalTransactions,
              currentBalance: currentBalance, // Replace with current balance
              suspensionFund: avgTransactionValue,
              successRate,
              status: customer.status || 'unknown',
              joinDate: customer.createdAt || 'N/A',
              kycStatus: customer.kycStatus || 'unknown',
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
                  name: `${customer?.profile?.firstName || ''} ${customer?.profile?.lastName || ''}`.trim() || 'Unknown Customer',
                  email: customer?.email || 'N/A',
                  phone: customer?.phone || 'N/A',
                  status: customer.status || 'unknown',
                  joinDate: customer.createdAt || 'N/A',
                  location: 'Kampala, Uganda',
                  address: 'N/A',
                  walletBalance: wallet?.balance || 0
                }}
                type={type as string}
                profileDetails={{
                  // You can add more detailed profile information here
                  // based on the customer type and available data
                }}
              
              />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6 mt-6">
              <CustomerTransactions
                transactions={transactions}
                onExport={handleExport}
                onFilter={() => toast.success('Opening transaction filters...')}
                isLoading={transactionsLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 mt-6">
              {activityLogsError ? (
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
              <CustomerSettings
                customerId={customer.id || id as string}
                customerStatus={customer.status || 'unknown'}
                walletBalance={wallet?.balance || 0}
                currency={wallet?.currency || 'UGX'}
                onActionComplete={() => {
                  // Refresh data after actions
                  window.location.reload()
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default CustomerProfilePage 