import { useMemo } from 'react'

const EMPTY_ARRAY: any[] = []

export const useCustomerTransactions = ({
  type,
  isGatewayPartner,
  partnerTxData,
  userTxData,
  partnerWalletIds,
  partnerId,
  currentPage,
  pageLimit
}: {
  type: string
  isGatewayPartner: boolean
  partnerTxData: any
  userTxData: any
  partnerWalletIds: string[]
  partnerId: string
  currentPage: number
  pageLimit: number
}) => {
  // Process transaction arrays
  const partnerTxArray = useMemo(() => {
    const data = partnerTxData?.data?.data || partnerTxData?.data || partnerTxData?.transactions
    return Array.isArray(data) ? data : []
  }, [partnerTxData])

  const userTxArray = useMemo(() => {
    return Array.isArray(userTxData) ? userTxData : []
  }, [userTxData])

  // Filter partner transactions
  const filteredTransactionsResult = useMemo(() => {
    if (type !== 'partner' || partnerWalletIds.length === 0) {
      return { transactions: EMPTY_ARRAY, length: 0 }
    }
    
    if (partnerTxArray.length === 0) {
      return { transactions: EMPTY_ARRAY, length: 0 }
    }
    
    const walletIdSet = new Set(partnerWalletIds)
    const filtered = partnerTxArray.filter((tx: any) => {
      if (!tx) return false
      const sourceWalletId = tx.sourceWalletId || tx.sourceWallet?.id || tx.fromWalletId
      const destWalletId = tx.destinationWalletId || tx.destinationWallet?.id || tx.toWalletId
      const walletId = tx.walletId || tx.wallet?.id
      
      return walletIdSet.has(sourceWalletId) || 
             walletIdSet.has(destWalletId) ||
             walletIdSet.has(walletId) ||
             (tx.partnerId && partnerId && tx.partnerId === partnerId)
    })
    
    return { transactions: filtered, length: filtered.length }
  }, [type, partnerWalletIds, partnerId, partnerTxArray])

  // Paginate partner transactions
  const paginatedPartnerTransactions = useMemo(() => {
    if (type !== 'partner' || filteredTransactionsResult.length === 0) return EMPTY_ARRAY
    const start = (currentPage - 1) * pageLimit
    const end = start + pageLimit
    return filteredTransactionsResult.transactions.slice(start, end)
  }, [type, filteredTransactionsResult, currentPage, pageLimit])

  // Final transactions array
  const transactions = useMemo(() => {
    return type === 'partner' ? paginatedPartnerTransactions : userTxArray
  }, [type, paginatedPartnerTransactions, userTxArray])

  // Calculate totals
  const totalTransactions = useMemo(() => {
    if (type === 'partner') {
      return filteredTransactionsResult.length
    }
    // userTxData might be an array or an object with total property
    if (typeof userTxData === 'object' && userTxData !== null && 'total' in userTxData) {
      return (userTxData as any).total || 0
    }
    return Array.isArray(userTxData) ? userTxData.length : 0
  }, [type, filteredTransactionsResult.length, userTxData])

  const totalPages = useMemo(() => {
    if (type === 'partner') {
      return Math.ceil(filteredTransactionsResult.length / pageLimit)
    }
    const limit = (typeof userTxData === 'object' && userTxData !== null && 'limit' in userTxData) 
      ? (userTxData as any).limit 
      : 10
    return Math.ceil(totalTransactions / limit)
  }, [type, filteredTransactionsResult.length, pageLimit, totalTransactions, userTxData])

  return {
    transactions,
    totalTransactions,
    totalPages
  }
}
