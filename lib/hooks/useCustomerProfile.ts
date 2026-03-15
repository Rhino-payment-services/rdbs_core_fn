import { useMemo, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUsers, useWalletTransactions, useApiPartner } from '@/lib/hooks/useApi'
import { useMerchants } from '@/lib/hooks/useMerchants'
import { useAllTransactions } from '@/lib/hooks/useTransactions'
import { useActivityLogs, useUserActivityLogsByUserId } from '@/lib/hooks/useActivityLogs'
import { useWallet, useAllWalletsByUserId } from '@/lib/hooks/useWallets'
import type { Wallet } from '@/lib/types/api'
import api from '@/lib/axios'

const EMPTY_ARRAY: any[] = []

export const useCustomerProfile = (
  currentPage: number,
  pageLimit: number,
  selectedWalletId?: string
) => {
  const params = useParams()
  const router = useRouter()
  const { type, id } = params

  // Fetch partner data ONLY when type is 'partner'
  const { data: partnerData, isLoading: partnerLoading, error: partnerError } = useApiPartner(
    type === 'partner' ? (id as string) : undefined
  )
  
  // Fetch customer data
  const { data: customerData, isLoading: customerLoading, error: customerError } = useUsers()
  
  // Fetch merchants data when type is 'merchant'
  const { data: merchantsData, isLoading: merchantsLoading } = useMerchants({
    page: 1,
    pageSize: 1000
  })

  // State for partner wallets
  const [partnerWallets, setPartnerWallets] = useState<Wallet[]>([])
  const [partnerWalletIds, setPartnerWalletIds] = useState<string[]>([])

  // Process users data
  const users = useMemo(() => {
    return Array.isArray(customerData) ? customerData : ((customerData as any)?.data || EMPTY_ARRAY)
  }, [customerData])

  // Get partner data
  const partner = type === 'partner' ? (partnerData?.data || null) : null

  // Find regular partner in users array
  const regularPartner = useMemo(() => {
    if (type === 'partner' && !partner) {
      return users.find((user: any) => 
        user.id === id && 
        (user.subscriberType === 'AGENT' || user.userType === 'PARTNER' || user.userType === 'AGENT')
      ) || null
    }
    return null
  }, [type, users, id, partner])

  // Process merchants data
  const merchants = useMemo(() => {
    return merchantsData?.merchants || EMPTY_ARRAY
  }, [merchantsData])

  const merchantData = useMemo(() => {
    if (type !== 'merchant') return null
    
    let merchant = merchants.find((m: any) => m.id === id)
    if (!merchant) {
      merchant = merchants.find((m: any) => m.userId === id)
    }
    if (!merchant) {
      merchant = merchants.find((m: any) => m.merchantCode === id)
    }
    
    return merchant || null
  }, [type, merchants, id])

  // User ID to fetch wallet from wallet service (same source as Wallets page) for consistent balance
  const userIdForWallet = useMemo(() => {
    if (type === 'merchant' && merchantData?.userId) return merchantData.userId
    if (type !== 'partner' && id) return id as string
    return undefined
  }, [type, merchantData?.userId, id])

  // Poll wallet balance every 15 s: top-ups are confirmed asynchronously by the backend
  // (polling the MNO partner), so the balance updates in the background and we need to
  // keep re-fetching to show it immediately when it changes.
  const { data: walletByUserIdData } = useWallet(userIdForWallet || '', { refetchInterval: 15 * 1000 })

  // Determine if gateway partner
  const isGatewayPartner: boolean = useMemo(() => {
    if (type === 'merchant') return false
    if (type !== 'partner') return false
    
    const hasPartnerName = partner?.partnerName && typeof partner.partnerName === 'string' && partner.partnerName.trim() !== ''
    const isSuccessfullyLoaded = !partnerLoading && !partnerError && partner !== null
    
    return !!(hasPartnerName && isSuccessfullyLoaded)
  }, [type, partner, partnerError, partnerLoading])

  // Fetch partner wallets
  useEffect(() => {
    if (type === 'partner' && partner?.id) {
      Promise.all([
        api.get(`/finance/wallets/partner?partnerId=${partner.id}&limit=1000`).catch(() => null),
        api.get(`/finance/wallets/partner?id=${partner.id}&limit=1000`).catch(() => null),
        api.get(`/finance/wallets/partner?limit=1000`).catch(() => null),
      ])
        .then((responses) => {
          const response = responses.find(r => r !== null)
          if (response) {
            const wallets = response.data?.wallets || response.data?.data || []
            const filteredWallets = wallets.filter((w: Wallet) => w.partnerId === partner.id)
            setPartnerWallets(filteredWallets)
            setPartnerWalletIds(filteredWallets.map((w: Wallet) => w.id))
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

  // For gateway partners: find linked user by same email so we show the same wallet transactions
  // (unifies "one account" - partner view and subscriber view show same transaction log)
  const linkedUserByEmail = useMemo(() => {
    if (type !== 'partner' || !partner?.contactEmail || !users?.length) return null
    const email = (partner.contactEmail as string).trim().toLowerCase()
    if (!email) return null
    return users.find((u: any) => (u.email || '').trim().toLowerCase() === email) || null
  }, [type, partner?.contactEmail, users])

  // Determine transaction user ID: prefer wallet-based (same source as subscriber) when we have a linked user
  const transactionUserId = useMemo(() => {
    if (type === 'merchant' && merchantData?.userId) {
      return merchantData.userId
    }
    if (type === 'partner' && regularPartner?.id) {
      return regularPartner.id
    }
    // Gateway partner with linked user (same email) -> use that user's wallet transactions for consistent logs
    if (type === 'partner' && isGatewayPartner && linkedUserByEmail?.id) {
      return linkedUserByEmail.id
    }
    if (type !== 'partner') {
      return id as string
    }
    return undefined
  }, [type, merchantData, regularPartner, id, isGatewayPartner, linkedUserByEmail])

  // Fetch all wallets for this user (subscriber/merchant) so we can show each when they have multiple
  const userIdForAllWallets = type !== 'partner' ? (transactionUserId || userIdForWallet) : undefined
  const { data: allUserWalletsData } = useAllWalletsByUserId(userIdForAllWallets, { refetchInterval: 15 * 1000 })
  const allUserWallets = Array.isArray(allUserWalletsData) ? allUserWalletsData : EMPTY_ARRAY

  // Fetch transactions (optional walletId for single-wallet statement with consistent balances)
  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError } = useWalletTransactions(
    transactionUserId,
    currentPage,
    pageLimit,
    selectedWalletId
  )

  // For gateway partners: always fetch system transactions so we can filter by partnerId (and/or partner wallets).
  // Same wallet source: when linked user exists we prefer their wallet tx; otherwise we use system tx filtered by this partner.
  const usePartnerSystemTransactions = isGatewayPartner && !!partner?.id
  const { data: partnerTransactionsData, isLoading: partnerTransactionsLoading } = useAllTransactions(
    usePartnerSystemTransactions
      ? { page: currentPage, limit: pageLimit, partnerId: partner?.id }
      : undefined
  )

  // Determine activity log user ID
  const activityLogUserId = useMemo(() => {
    if (type === 'merchant' && merchantData?.userId) {
      return merchantData.userId
    }
    if (type === 'partner' && regularPartner?.id) {
      return regularPartner.id
    }
    if (type !== 'partner') {
      return id as string
    }
    return undefined
  }, [type, merchantData, regularPartner, id])

  const { data: activityLogsData, isLoading: activityLogsLoading, error: activityLogsError } = useUserActivityLogsByUserId(
    activityLogUserId,
    currentPage,
    pageLimit
  )

  const { data: partnerActivityLogsData, isLoading: partnerActivityLogsLoading } = useActivityLogs(
    isGatewayPartner
      ? { page: currentPage, limit: pageLimit * 2 }
      : undefined
  )

  // Find customer
  const customer = useMemo(() => {
    if (type === 'partner' && regularPartner) {
      return regularPartner
    }
    if (type === 'merchant' && merchantData?.userId) {
      return users.find((user: any) => user.id === merchantData.userId) || null
    }
    return type !== 'partner' ? (users.find((user: any) => user.id === id) || null) : null
  }, [type, users, id, regularPartner, merchantData])

  // Process wallets
  const wallets = useMemo(() => {
    if (type === 'partner' && regularPartner) {
      const partnerWallets = regularPartner?.wallets || EMPTY_ARRAY
      return Array.isArray(partnerWallets) ? partnerWallets.filter((w: any) => w && typeof w === 'object' && Object.keys(w).length > 0) : EMPTY_ARRAY
    }
    if (type === 'merchant' && merchantData?.userId) {
      const merchantUser = users.find((u: any) => u.id === merchantData.userId)
      const merchantWallets = merchantUser?.wallets || EMPTY_ARRAY
      return Array.isArray(merchantWallets) ? merchantWallets.filter((w: any) => w && typeof w === 'object' && Object.keys(w).length > 0) : EMPTY_ARRAY
    }
    const customerWallets = customer?.wallets || EMPTY_ARRAY
    return Array.isArray(customerWallets) ? customerWallets.filter((w: any) => w && typeof w === 'object' && Object.keys(w).length > 0) : EMPTY_ARRAY
  }, [customer, type, regularPartner, merchantData, users])

  const personalWallet = useMemo(() => {
    if (!Array.isArray(wallets) || wallets.length === 0) return null
    return wallets.find((wallet: any) => wallet && wallet.walletType === 'PERSONAL') || null
  }, [wallets])

  const businessWallet = useMemo(() => {
    if (!Array.isArray(wallets) || wallets.length === 0) return null
    return wallets.find((wallet: any) => wallet && wallet.walletType === 'BUSINESS') || null
  }, [wallets])

  // Prefer wallet from wallet service (GET /wallet/:userId) so balance matches Wallets page and statement
  const walletFromApi = useMemo(() => {
    const raw = walletByUserIdData as any
    return raw?.data ?? raw ?? null
  }, [walletByUserIdData])

  const walletBalance = walletFromApi || personalWallet || businessWallet || null

  // Loading state
  const isLoading = (type === 'partner' ? (partnerLoading || customerLoading) : customerLoading) || (type === 'merchant' && merchantsLoading)

  return {
    // Data
    type: type as string,
    id: id as string,
    customer,
    merchantData,
    partner,
    regularPartner,
    isGatewayPartner,
    wallets,
    walletBalance,
    allUserWallets: type === 'partner' ? partnerWallets : allUserWallets,
    partnerWallets,
    partnerWalletIds,
    
    // Transactions
    transactionsData,
    transactionsLoading,
    transactionsError,
    partnerTransactionsData,
    partnerTransactionsLoading,
    
    // Activity logs
    activityLogsData,
    activityLogsLoading,
    activityLogsError,
    partnerActivityLogsData,
    partnerActivityLogsLoading,
    
    // Loading states
    isLoading,
    partnerLoading,
    customerLoading,
    merchantsLoading,
    partnerError,
    customerError,
    
    // Router
    router
  }
}
