"use client"
import React, { useState, useRef } from 'react'
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

// Stable empty array to prevent re-renders - never create [] inline in component
const EMPTY_ARRAY: any[] = []

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
  
  // Get wallet data from user data (now included in user response)
  // Use stable references to prevent infinite re-renders
  // Declare users early so it can be used in regularPartner useMemo
  const users = React.useMemo(() => {
    return Array.isArray(customerData) ? customerData : ((customerData as any)?.data || EMPTY_ARRAY)
  }, [customerData])
  
  // Get partner data
  // Check if this is a gateway partner (API partner) or regular partner (user)
  const partner = type === 'partner' ? (partnerData?.data || null) : null;
  
  // For regular partners (users with AGENT subscriberType), find them in users array
  // If partnerData is null/error, it might be a regular partner (user), not an API partner
  const regularPartner = React.useMemo(() => {
    if (type === 'partner' && !partner) {
      // Try to find as regular user partner
      return users.find((user: any) => 
        user.id === id && 
        (user.subscriberType === 'AGENT' || user.userType === 'PARTNER' || user.userType === 'AGENT')
      ) || null
    }
    return null
  }, [type, users, id, partner])
  
  // Get merchant data if this is a merchant view (declare early so it can be used in other memos)
  const merchants = React.useMemo(() => {
    return merchantsData?.merchants || EMPTY_ARRAY
  }, [merchantsData])
  
  const merchantData = React.useMemo(() => {
    if (type !== 'merchant') return null
    
    // Try to find merchant by ID first (most common case)
    let merchant = merchants.find((m: any) => m.id === id)
    
    // If not found by ID, try userId
    if (!merchant) {
      merchant = merchants.find((m: any) => m.userId === id)
    }
    
    // If still not found, try merchantCode as fallback
    if (!merchant) {
      merchant = merchants.find((m: any) => m.merchantCode === id)
    }
    
    return merchant || null
  }, [type, merchants, id])

  // Fetch wallet transactions for this user with pagination
  // For regular partners (users), fetch their transactions like regular users
  // For gateway partners, skip this and use partner transactions instead
  const isGatewayPartner = type === 'partner' && partner !== null
  
  // Redirect gateway partners to their dedicated page (must be at top level, not conditional)
  React.useEffect(() => {
    if (type === 'partner' && isGatewayPartner && partner?.id) {
      router.replace(`/dashboard/gateway-partners/${partner.id}`)
    }
  }, [type, isGatewayPartner, partner?.id, router])
  
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

  // For merchants, use userId instead of merchant ID for transactions
  // Use stable values to prevent hook violations
  const merchantUserId = React.useMemo(() => merchantData?.userId || null, [merchantData?.userId])
  const regularPartnerId = React.useMemo(() => regularPartner?.id || null, [regularPartner?.id])
  
  const transactionUserId = React.useMemo(() => {
    if (type === 'merchant' && merchantUserId) {
      return merchantUserId
    }
    if (type === 'partner' && regularPartnerId) {
      return regularPartnerId
    }
    if (type !== 'partner' && id) {
      return id as string
    }
    return '' // Return empty string for disabled hooks
  }, [type, merchantUserId, regularPartnerId, id])
  
  const { data: transactionsData, isLoading: transactionsLoading } = useWalletTransactions(
    transactionUserId, 
    currentPage, 
    pageLimit
  )

  // Fetch transactions for gateway partner wallets (not regular partners)
  const { data: partnerTransactionsData, isLoading: partnerTransactionsLoading } = useAllTransactions(
    isGatewayPartner && partnerWalletIds.length > 0
      ? {
          page: currentPage,
          limit: pageLimit,
        }
      : undefined
  )
  
  // Get transactions - for partners, filter by wallet IDs; for others, use user transactions
  // Create stable content-based keys to prevent infinite loops
  const partnerTxData = partnerTransactionsData?.data?.data || partnerTransactionsData?.data || partnerTransactionsData?.transactions
  const partnerTxArray = React.useMemo(() => {
    return Array.isArray(partnerTxData) ? partnerTxData : []
  }, [partnerTransactionsData])
  
  const partnerTxKey = React.useMemo(() => {
    if (partnerTxArray.length === 0) return ''
    // Create stable key from length + first + last transaction IDs
    const firstId = partnerTxArray[0]?.id || ''
    const lastId = partnerTxArray[partnerTxArray.length - 1]?.id || ''
    return `${partnerTxArray.length}:${firstId}:${lastId}`
  }, [partnerTxArray])
  
  const userTxData = transactionsData?.transactions
  const userTxArray = React.useMemo(() => {
    return Array.isArray(userTxData) ? userTxData : []
  }, [transactionsData])
  
  const userTxKey = React.useMemo(() => {
    if (userTxArray.length === 0) return ''
    const firstId = userTxArray[0]?.id || ''
    const lastId = userTxArray[userTxArray.length - 1]?.id || ''
    return `${userTxArray.length}:${firstId}:${lastId}`
  }, [userTxArray])
  
  const allTransactions = React.useMemo(() => {
    // Gateway partners use partner transactions, regular partners use user transactions
    if (type === 'partner' && isGatewayPartner) {
      return partnerTxArray
    }
    return userTxArray
  }, [type, partnerTxArray, userTxArray, isGatewayPartner])
  
  const customer = React.useMemo(() => {
    // For regular partners (users), include them in customer lookup
    // Gateway partners are handled separately via partner variable
    if (type === 'partner' && regularPartner) {
      return regularPartner
    }
    // For merchants, find the associated user via userId
    if (type === 'merchant' && merchantData?.userId) {
      return users.find((user: any) => user.id === merchantData.userId) || null
    }
    // For subscribers and other users, find by id
    return type !== 'partner' ? (users.find((user: any) => user.id === id) || null) : null
  }, [type, users, id, regularPartner, merchantData?.userId])
  
  console.log("merchantData====>", merchantData)
  console.log("partner====>", partner)
  
  const wallets = React.useMemo(() => {
    // For regular partners, they are users so they should have wallets
    if (type === 'partner' && regularPartner) {
      const partnerWallets = regularPartner?.wallets || EMPTY_ARRAY
      // Filter out empty objects and ensure valid wallet structure
      return Array.isArray(partnerWallets) ? partnerWallets.filter((w: any) => w && typeof w === 'object' && Object.keys(w).length > 0) : EMPTY_ARRAY
    }
    // For merchants, find the associated user to get wallets
    if (type === 'merchant' && merchantData?.userId) {
      const merchantUser = users.find((u: any) => u.id === merchantData.userId)
      const merchantWallets = merchantUser?.wallets || EMPTY_ARRAY
      // Filter out empty objects and ensure valid wallet structure
      return Array.isArray(merchantWallets) ? merchantWallets.filter((w: any) => w && typeof w === 'object' && Object.keys(w).length > 0) : EMPTY_ARRAY
    }
    // For subscribers and other users, use customer wallets
    const customerWallets = customer?.wallets || EMPTY_ARRAY
    // Filter out empty objects and ensure valid wallet structure
    return Array.isArray(customerWallets) ? customerWallets.filter((w: any) => w && typeof w === 'object' && Object.keys(w).length > 0) : EMPTY_ARRAY
  }, [customer, type, regularPartner, merchantData?.userId, users])
  
  const personalWallet = React.useMemo(() => {
    if (!Array.isArray(wallets) || wallets.length === 0) return null
    return wallets.find((wallet: any) => wallet && wallet.walletType === 'PERSONAL') || null
  }, [wallets])
  
  const businessWallet = React.useMemo(() => {
    if (!Array.isArray(wallets) || wallets.length === 0) return null
    return wallets.find((wallet: any) => wallet && wallet.walletType === 'BUSINESS') || null
  }, [wallets])
  
  // Use personal wallet for display (or business wallet if no personal wallet)
  const walletBalance = personalWallet || businessWallet || null;

  // Fetch user activity logs (for regular users, regular partners, and merchants)
  // For merchants, use userId; for regular partners, use their ID; for others, use the id param
  const activityLogUserId = React.useMemo(() => {
    if (type === 'merchant' && merchantUserId) {
      return merchantUserId
    }
    if (type === 'partner' && regularPartnerId) {
      return regularPartnerId
    }
    if (type !== 'partner' && id) {
      return id as string
    }
    return '' // Return empty string for disabled hooks
  }, [type, merchantUserId, regularPartnerId, id])
  
  const { data: activityLogsData, isLoading: activityLogsLoading, error: activityLogsError } = useUserActivityLogs(
    activityLogUserId,
    currentPage,
    pageLimit
  )

  // Fetch activity logs for gateway partners (will filter client-side by wallet IDs)
  const { data: partnerActivityLogsData, isLoading: partnerActivityLogsLoading } = useActivityLogs(
    isGatewayPartner
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
  // For partners, check both gateway partner loading and customer loading (for regular partners)
  const isLoading = (type === 'partner' ? (partnerLoading || customerLoading) : customerLoading) || (type === 'merchant' && merchantsLoading)
  
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
    // Show loading while redirecting gateway partners
    if (isGatewayPartner && partner?.id) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Redirecting to gateway partner page...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      )
    }
    
    // Only show error if neither gateway partner nor regular partner found
    const isRegularPartnerCheck = regularPartner !== null
    if (!isGatewayPartner && !isRegularPartnerCheck && partnerLoading === false && customerLoading === false) {
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
  } else if (type === 'merchant') {
    // Handle merchant not found error
    if (merchantsLoading === false && !merchantData) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Merchant Not Found</h1>
                  <p className="text-gray-600 mb-4">The merchant you're looking for doesn't exist or you don't have permission to view it.</p>
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

  
  // Filter partner transactions to only include those from partner wallets
  // Use stable memoized values to prevent infinite loops
  const partnerWalletIdsStr = React.useMemo(() => partnerWalletIds.join(','), [partnerWalletIds])
  const partnerId = partner?.id || ''
  
  // Compute filtered transactions with stable metadata in one useMemo
  const filteredTransactionsResult = React.useMemo(() => {
    if (type !== 'partner' || partnerWalletIds.length === 0) {
      return { transactions: EMPTY_ARRAY, length: 0, key: '' }
    }
    
    // Use the already-extracted partnerTxArray
    if (partnerTxArray.length === 0) {
      return { transactions: EMPTY_ARRAY, length: 0, key: '' }
    }
    
    // Create a Set for faster lookups
    const walletIdSet = new Set(partnerWalletIds)
    const filtered = partnerTxArray.filter((tx: any) => {
      if (!tx) return false
      // Check if transaction involves any partner wallet (as source or destination)
      const sourceWalletId = tx.sourceWalletId || tx.sourceWallet?.id || tx.fromWalletId
      const destWalletId = tx.destinationWalletId || tx.destinationWallet?.id || tx.toWalletId
      const walletId = tx.walletId || tx.wallet?.id
      
      return walletIdSet.has(sourceWalletId) || 
             walletIdSet.has(destWalletId) ||
             walletIdSet.has(walletId) ||
             (tx.partnerId && partnerId && tx.partnerId === partnerId)
    })
    
    // Compute stable key from filtered results
    const length = filtered.length
    const firstId = length > 0 ? (filtered[0]?.id || '') : ''
    const lastId = length > 0 ? (filtered[length - 1]?.id || '') : ''
    const key = length > 0 ? `${length}:${firstId}:${lastId}` : ''
    
    return { transactions: filtered, length, key }
  }, [type, partnerWalletIds, partnerId, partnerTxArray])
  
  const filteredPartnerTransactions = filteredTransactionsResult.transactions
  const filteredTxLength = filteredTransactionsResult.length
  const filteredTxKey = filteredTransactionsResult.key

  // Paginate filtered partner transactions
  const paginatedPartnerTransactions = React.useMemo(() => {
    if (type !== 'partner' || filteredTxLength === 0) return EMPTY_ARRAY
    const start = (currentPage - 1) * pageLimit
    const end = start + pageLimit
    return filteredPartnerTransactions.slice(start, end)
  }, [type, filteredPartnerTransactions, currentPage, pageLimit, filteredTxLength])

  // Use filtered transactions for partners, regular transactions for others
  // Use filtered transactions for partners, regular transactions for others
  const transactions = React.useMemo(() => {
    return type === 'partner' ? paginatedPartnerTransactions : allTransactions
  }, [type, paginatedPartnerTransactions, allTransactions])
  
  // Calculate totals and pagination
  const totalTransactions = React.useMemo(() => {
    return type === 'partner' 
      ? filteredTxLength
      : (transactionsData?.total || 0)
  }, [type, filteredTxLength, transactionsData?.total])
  
  const totalPages = React.useMemo(() => {
    return type === 'partner'
      ? Math.ceil(filteredTxLength / pageLimit)
      : Math.ceil(totalTransactions / (transactionsData?.limit || 10))
  }, [type, filteredTxLength, pageLimit, totalTransactions, transactionsData?.limit])
  
  const wallet = walletBalance

  console.log("activityLogsData====>", activityLogsData)

  // Activity logs data with error handling - for partners, filter by wallet IDs
  // Create stable arrays for activity logs
  const partnerLogsArray = React.useMemo(() => {
    return Array.isArray(partnerActivityLogsData?.logs) ? partnerActivityLogsData.logs : EMPTY_ARRAY
  }, [partnerActivityLogsData])
  
  const userLogsArray = React.useMemo(() => {
    return Array.isArray(activityLogsData?.logs) ? activityLogsData.logs : EMPTY_ARRAY
  }, [activityLogsData])
  
  const filteredPartnerActivities = React.useMemo(() => {
    if (type !== 'partner' || partnerWalletIds.length === 0) {
      return EMPTY_ARRAY
    }
    if (partnerLogsArray.length === 0) {
      return EMPTY_ARRAY
    }
    // Filter logs that mention partner wallet IDs in metadata or description
    return partnerLogsArray.filter((log: any) => {
      if (!log) return false
      const logStr = JSON.stringify(log).toLowerCase()
      return partnerWalletIds.some(walletId => logStr.includes(walletId.toLowerCase()))
    })
  }, [type, partnerWalletIds, partnerLogsArray])
  
  const filteredActivitiesLength = filteredPartnerActivities.length
  const activities = React.useMemo(() => {
    if (type === 'partner') {
      return filteredPartnerActivities
    }
    return userLogsArray
  }, [type, filteredPartnerActivities, userLogsArray])
  
  const totalActivities = React.useMemo(() => {
    return type === 'partner'
      ? filteredActivitiesLength
      : (activityLogsData?.total || 0)
  }, [type, filteredActivitiesLength, activityLogsData?.total])
  
  const activityPages = React.useMemo(() => {
    return Math.ceil(totalActivities / pageLimit)
  }, [totalActivities, pageLimit])

  // Create wallet balance object for components
  const balance: WalletBalance = React.useMemo(() => {
    if (wallet) {
      return {
        walletId: wallet.id,
        balance: wallet.balance,
        currency: wallet.currency,
        lastUpdated: wallet.updatedAt
      }
    }
    return {
      walletId: '',
      balance: 0,
      currency: 'UGX',
      lastUpdated: new Date().toISOString()
    }
  }, [wallet])

  // Calculate stats from real data - use full filtered list for partners, paginated for display
  // Use stable query responses as dependencies
  const statsTransactions = React.useMemo(() => {
    if (type === 'partner') {
      return Array.isArray(filteredPartnerTransactions) ? filteredPartnerTransactions : EMPTY_ARRAY
    }
    // For non-partners, get transactions directly from query
    const txData = transactionsData?.transactions
    return Array.isArray(txData) ? txData : EMPTY_ARRAY
  }, [type, filteredPartnerTransactions, transactionsData])
  
  // Find escrow/reserve wallets for partners
  const escrowWallets = React.useMemo(() => {
    if (type !== 'partner' || !Array.isArray(partnerWallets) || partnerWallets.length === 0) return EMPTY_ARRAY
    return partnerWallets.filter((w: Wallet) => 
      w?.walletType?.toUpperCase().includes('ESCROW') || 
      w?.walletType?.toUpperCase().includes('RESERVE') ||
      w?.walletType?.toUpperCase().includes('SUSPENSION')
    )
  }, [type, partnerWallets])
  
  // Calculate suspension fund (escrow balance)
  // Access data directly from stable query/state sources
  const suspensionFund = React.useMemo(() => {
    if (type === 'partner') {
      // For partners: Use escrow wallet balance if available (most accurate)
      if (Array.isArray(escrowWallets) && escrowWallets.length > 0) {
        return escrowWallets.reduce((sum, w) => {
          const balance = w?.balance ? parseFloat(w.balance.toString()) : 0
          return sum + (isNaN(balance) ? 0 : balance)
        }, 0)
      }
      // Otherwise, calculate from fees of completed transactions
      // Get transactions directly from query to avoid dependency on filteredPartnerTransactions
      const txData = partnerTransactionsData?.data?.data || partnerTransactionsData?.data || partnerTransactionsData?.transactions
      const transactions = Array.isArray(txData) ? txData : []
      if (transactions.length > 0 && partnerWalletIds.length > 0) {
        const walletIdSet = new Set(partnerWalletIds)
        const escrowFees = transactions
          .filter((tx: any) => {
            if (!tx) return false
            const sourceWalletId = tx.sourceWalletId || tx.sourceWallet?.id || tx.fromWalletId
            const destWalletId = tx.destinationWalletId || tx.destinationWallet?.id || tx.toWalletId
            const walletId = tx.walletId || tx.wallet?.id
            const isPartnerTx = walletIdSet.has(sourceWalletId) || 
                                 walletIdSet.has(destWalletId) ||
                                 walletIdSet.has(walletId) ||
                                 (tx.partnerId && partnerId && tx.partnerId === partnerId)
            return isPartnerTx && (tx.status === 'SUCCESS' || tx.status === 'COMPLETED')
          })
          .reduce((sum: number, tx: any) => {
            if (!tx) return sum
            const fee = parseFloat(tx.fee?.toString() || '0') || 0
            const rukapayFee = parseFloat(tx.rukapayFee?.toString() || '0') || 0
            const thirdPartyFee = parseFloat(tx.thirdPartyFee?.toString() || '0') || 0
            const processingFee = parseFloat(tx.processingFee?.toString() || '0') || 0
            return sum + (fee > 0 ? fee : (rukapayFee + thirdPartyFee + processingFee))
          }, 0)
        return escrowFees
      }
      return 0
    } else {
      // For regular users: Use escrow wallet if available, otherwise 0
      // Use wallets from the wallets memoized value (handles merchants, partners, and regular users)
      const userWallets = wallets || []
      if (Array.isArray(userWallets) && userWallets.length > 0) {
        const userEscrowWallet = userWallets.find((w: any) => 
          w?.walletType?.toUpperCase().includes('ESCROW') || 
          w?.walletType?.toUpperCase().includes('RESERVE') ||
          w?.walletType?.toUpperCase().includes('SUSPENSION')
        )
        if (userEscrowWallet) {
          const balance = parseFloat(userEscrowWallet.balance?.toString() || '0')
          return isNaN(balance) ? 0 : balance
        }
      }
      return 0
    }
  }, [type, escrowWallets.length, partnerWalletIdsStr, partnerId, partnerTransactionsData, wallets.length])
  
  const currentBalance = React.useMemo(() => {
    if (type === 'partner') {
      if (!Array.isArray(partnerWallets) || partnerWallets.length === 0) return 0
      return partnerWallets.reduce((sum, w) => {
        const balance = w?.balance ? parseFloat(w.balance.toString()) : 0
        return sum + (isNaN(balance) ? 0 : balance)
      }, 0)
    }
    const balance = wallet?.balance ? parseFloat(wallet.balance.toString()) : 0
    return isNaN(balance) ? 0 : balance
  }, [type, partnerWallets, wallet])
  
  const avgTransactionValue = React.useMemo(() => {
    if (!Array.isArray(statsTransactions) || statsTransactions.length === 0) return 0
    const total = statsTransactions.reduce((sum: number, tx: any) => {
      if (!tx) return sum
      const amount = parseFloat(tx.amount?.toString() || '0')
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
    return total / statsTransactions.length
  }, [statsTransactions])
  
  const successRate = React.useMemo(() => {
    if (!Array.isArray(statsTransactions) || statsTransactions.length === 0) return 0
    const successful = statsTransactions.filter((tx: any) => tx && tx.status === 'SUCCESS').length
    return (successful / statsTransactions.length) * 100
  }, [statsTransactions])
  
  // Memoize tags array to prevent re-renders
  const profileTags = React.useMemo(() => {
    if (type === 'partner') {
      // Gateway partners use partner.isActive, regular partners use customer status
      if (isGatewayPartner) {
        return partner?.isActive ? ['Active'] : EMPTY_ARRAY
      } else if (regularPartner) {
        return regularPartner?.isVerified ? ['Verified'] : EMPTY_ARRAY
      }
      return EMPTY_ARRAY
    }
    return customer?.isVerified ? ['Verified'] : EMPTY_ARRAY
  }, [type, partner?.isActive, customer?.isVerified, isGatewayPartner, regularPartner])

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

  // Safety check: Ensure we have valid data before rendering
  // This prevents React errors from undefined/null access
  if (type === 'merchant' && !merchantData && merchantsLoading === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Merchant Not Found</h1>
                <p className="text-gray-600 mb-4">The merchant you're looking for doesn't exist or you don't have permission to view it.</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Customer Profile Header */}
          <CustomerProfileHeader
            customer={{
              id: partner?.id || merchantData?.id || customer?.id || id as string,
              // For partners, show partner name; for merchants, show business name; for others, show personal name with fallbacks
              name: type === 'partner' && isGatewayPartner && partner?.partnerName
                ? partner.partnerName
                : type === 'partner' && regularPartner
                  ? (
                      // Regular partner - use customer name
                      `${regularPartner?.profile?.firstName || ''} ${regularPartner?.profile?.lastName || ''}`.trim() ||
                      `${regularPartner?.firstName || ''} ${regularPartner?.lastName || ''}`.trim() ||
                      regularPartner?.email ||
                      'Unknown Partner'
                    )
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
              email: type === 'partner' && isGatewayPartner && partner?.contactEmail
                ? partner.contactEmail
                : type === 'partner' && regularPartner
                  ? regularPartner?.email || 'N/A'
                : type === 'merchant' && merchantData?.businessEmail
                  ? merchantData.businessEmail
                  : customer?.email || 'N/A',
              phone: type === 'partner' && isGatewayPartner && partner?.contactPhone
                ? partner.contactPhone
                : type === 'partner' && regularPartner
                  ? regularPartner?.profile?.phone || regularPartner?.phone || 'N/A'
                : type === 'merchant' && merchantData?.registeredPhoneNumber
                  ? merchantData.registeredPhoneNumber
                  : customer?.profile?.phone || customer?.phone || 'N/A',
              status: type === 'partner' && isGatewayPartner
                ? (partner?.isActive && !partner?.isSuspended ? 'ACTIVE' : partner?.isSuspended ? 'SUSPENDED' : 'INACTIVE')
                : type === 'partner' && regularPartner
                  ? (regularPartner?.status || 'unknown')
                : type === 'merchant' && merchantData
                  ? (merchantData.isActive && !merchantData.isSuspended ? 'ACTIVE' : merchantData.isSuspended ? 'SUSPENDED' : 'INACTIVE')
                  : customer?.status || 'unknown',
              joinDate: (isGatewayPartner && partner?.createdAt) || merchantData?.onboardedAt || customer?.createdAt || 'N/A',
              location: (isGatewayPartner && partner?.country) || customer?.profile?.country || 'Kampala, Uganda',
              address: 'N/A',
              totalTransactions: totalTransactions,
              currentBalance: currentBalance,
              avgTransactionValue: avgTransactionValue,
              successRate: successRate,
              kycStatus: type === 'partner' && isGatewayPartner ? 'APPROVED' : (customer?.kycStatus || 'unknown'),
              riskLevel: 'low',
              tags: profileTags,
              notes: type === 'partner' && isGatewayPartner ? `Partner Type: ${partner?.partnerType || 'N/A'}, Tier: ${partner?.tier || 'N/A'}` : 'Customer profile from database',
              walletBalance: type === 'partner' ? null : (wallet || null),
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
                  name: type === 'partner' && isGatewayPartner && partner?.partnerName
                    ? partner.partnerName
                    : type === 'partner' && regularPartner
                      ? (
                          // Regular partner - use customer name
                          `${regularPartner?.profile?.firstName || ''} ${regularPartner?.profile?.lastName || ''}`.trim() ||
                          `${regularPartner?.firstName || ''} ${regularPartner?.lastName || ''}`.trim() ||
                          regularPartner?.email ||
                          'Unknown Partner'
                        )
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
                  email: type === 'partner' && isGatewayPartner && partner?.contactEmail
                    ? partner.contactEmail
                    : type === 'partner' && regularPartner
                      ? regularPartner?.email || 'N/A'
                    : type === 'merchant' && merchantData?.businessEmail
                      ? merchantData.businessEmail
                      : customer?.email || 'N/A',
                  phone: type === 'partner' && isGatewayPartner && partner?.contactPhone
                    ? partner.contactPhone
                    : type === 'partner' && regularPartner
                      ? regularPartner?.profile?.phone || regularPartner?.phone || 'N/A'
                    : type === 'merchant' && merchantData?.registeredPhoneNumber
                      ? merchantData.registeredPhoneNumber
                      : customer?.phone || 'N/A',
                  status: type === 'partner' && isGatewayPartner
                    ? (partner?.isActive && !partner?.isSuspended ? 'ACTIVE' : partner?.isSuspended ? 'SUSPENDED' : 'INACTIVE')
                    : type === 'partner' && regularPartner
                      ? (regularPartner?.status || 'unknown')
                    : type === 'merchant' && merchantData
                      ? (merchantData.isActive && !merchantData.isSuspended ? 'ACTIVE' : merchantData.isSuspended ? 'SUSPENDED' : 'INACTIVE')
                      : (customer?.status || 'unknown'),
                  joinDate: (isGatewayPartner && partner?.createdAt) || merchantData?.onboardedAt || customer?.createdAt || 'N/A',
                  location: (isGatewayPartner && partner?.country) || customer?.profile?.country || 'Kampala, Uganda',
                  address: 'N/A',
                  walletBalance: type === 'partner' && isGatewayPartner ? 0 : (wallet?.balance ?? 0)
                }}
                type={type as string}
                profileDetails={{
                  // Gateway partner-specific profile details (not for regular partners)
                  ...(type === 'partner' && isGatewayPartner && partner ? {
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