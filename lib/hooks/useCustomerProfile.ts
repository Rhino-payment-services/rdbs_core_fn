import { useMemo, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUsers, useWalletTransactions, useUserActivityLogs, useApiPartner } from '@/lib/hooks/useApi'
import { useMerchants } from '@/lib/hooks/useMerchants'
import { useAllTransactions } from '@/lib/hooks/useTransactions'
import { useActivityLogs } from '@/lib/hooks/useActivityLogs'
import type { Wallet } from '@/lib/types/api'
import api from '@/lib/axios'

const EMPTY_ARRAY: any[] = []

export const useCustomerProfile = (currentPage: number, pageLimit: number) => {
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

  // Determine transaction user ID
  const transactionUserId = useMemo(() => {
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

  // Fetch transactions
  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError } = useWalletTransactions(
    transactionUserId, 
    currentPage, 
    pageLimit
  )

  const { data: partnerTransactionsData, isLoading: partnerTransactionsLoading } = useAllTransactions(
    isGatewayPartner && partnerWalletIds.length > 0
      ? { page: currentPage, limit: pageLimit }
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

  const { data: activityLogsData, isLoading: activityLogsLoading, error: activityLogsError } = useUserActivityLogs(
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

  const walletBalance = personalWallet || businessWallet || null

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
