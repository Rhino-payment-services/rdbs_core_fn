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
    if (Array.isArray(userTxData)) return userTxData
    if (userTxData?.transactions) return Array.isArray(userTxData.transactions) ? userTxData.transactions : []
    return []
  }, [userTxData])

  // Filter partner transactions: by partnerId (so we show all tx for this partner) and/or by partner wallet IDs
  const filteredTransactionsResult = useMemo(() => {
    if (type !== 'partner') {
      return { transactions: EMPTY_ARRAY, length: 0 }
    }
    if (partnerTxArray.length === 0) {
      return { transactions: EMPTY_ARRAY, length: 0 }
    }

    const hasWalletIds = partnerWalletIds.length > 0
    const walletIdSet = new Set(partnerWalletIds)

    const filtered = partnerTxArray.filter((tx: any) => {
      if (!tx) return false
      // Include if transaction is for this partner (same wallet source as backend assigns partnerId)
      if (partnerId && (tx.partnerId === partnerId || tx.apiPartnerId === partnerId)) return true
      if (!hasWalletIds) return false
      const sourceWalletId = tx.sourceWalletId || tx.sourceWallet?.id || tx.fromWalletId
      const destWalletId = tx.destinationWalletId || tx.destinationWallet?.id || tx.toWalletId
      const walletId = tx.walletId || tx.wallet?.id
      return (
        walletIdSet.has(sourceWalletId) ||
        walletIdSet.has(destWalletId) ||
        walletIdSet.has(walletId)
      )
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

  // Final transactions array: for partners use same wallet source when we have linked-user wallet tx;
  // otherwise use system transactions filtered by this partner (partnerId or partner wallets)
  const transactions = useMemo(() => {
    if (type === 'partner') {
      if (userTxArray.length > 0) return userTxArray
      return paginatedPartnerTransactions
    }
    return userTxArray
  }, [type, paginatedPartnerTransactions, userTxArray])

  const userTxTotal = useMemo(() => {
    if (typeof userTxData === 'object' && userTxData !== null && 'total' in userTxData) {
      return (userTxData as any).total ?? 0
    }
    return Array.isArray(userTxData) ? userTxData.length : 0
  }, [userTxData])

  // Calculate totals
  const totalTransactions = useMemo(() => {
    if (type === 'partner' && userTxArray.length > 0) {
      return userTxTotal > 0 ? userTxTotal : userTxArray.length
    }
    if (type === 'partner') {
      return filteredTransactionsResult.length
    }
    return userTxTotal
  }, [type, filteredTransactionsResult.length, userTxArray.length, userTxTotal])

  const userTxLimit = useMemo(() => {
    if (typeof userTxData === 'object' && userTxData !== null && 'limit' in userTxData) {
      return (userTxData as any).limit ?? 10
    }
    return 10
  }, [userTxData])

  const totalPages = useMemo(() => {
    if (type === 'partner' && userTxArray.length > 0) {
      const total = userTxTotal > 0 ? userTxTotal : userTxArray.length
      return Math.ceil(total / userTxLimit)
    }
    if (type === 'partner') {
      return Math.ceil(filteredTransactionsResult.length / pageLimit)
    }
    return Math.ceil(totalTransactions / userTxLimit)
  }, [type, filteredTransactionsResult.length, pageLimit, totalTransactions, userTxArray.length, userTxTotal, userTxLimit])

  return {
    transactions,
    totalTransactions,
    totalPages
  }
}
