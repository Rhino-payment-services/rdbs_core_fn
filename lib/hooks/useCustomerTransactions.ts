import { useMemo } from 'react'

const EMPTY_ARRAY: any[] = []

/** Keep one row per logical transaction (same reference). Prefer the user-facing leg (has fee or is the wallet debit/credit). */
function deduplicateByReference(list: any[]): any[] {
  if (!Array.isArray(list) || list.length === 0) return list
  const byRef = new Map<string, any>()
  // Sort by createdAt desc so we process most recent first; when we prefer "has fee", we'll overwrite with the fee leg if we see it later
  const sorted = [...list].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )
  for (const tx of sorted) {
    const ref = tx.reference || tx.externalReference || tx.id || ''
    const key = ref || tx.id
    if (!key) continue
    const existing = byRef.get(key)
    if (!existing) {
      byRef.set(key, tx)
      continue
    }
    // Prefer the row that has fee (customer-facing leg with net amount)
    const hasFee = (t: any) => (Number(t?.fee) || 0) > 0
    if (hasFee(tx) && !hasFee(existing)) {
      byRef.set(key, tx)
    } else if (hasFee(existing) && !hasFee(tx)) {
      // keep existing
    } else {
      // Keep the one with balance info if any
      const hasBalance = (t: any) =>
        (t?.balanceBefore != null && t?.balanceBefore !== '') ||
        (t?.balanceAfter != null && t?.balanceAfter !== '')
      if (hasBalance(tx) && !hasBalance(existing)) byRef.set(key, tx)
    }
  }
  return [...byRef.values()].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )
}

/** Fill balanceBefore/balanceAfter when missing using running balance (chronological order). */
function computeRunningBalance(list: any[]): any[] {
  if (!Array.isArray(list) || list.length === 0) return list
  const sorted = [...list].sort(
    (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  )
  let running = 0
  const result = sorted.map((tx) => {
    const hasBefore = tx.balanceBefore != null && tx.balanceBefore !== ''
    const hasAfter = tx.balanceAfter != null && tx.balanceAfter !== ''
    const isFailed = (tx.status || '').toUpperCase() === 'FAILED'

    // For failed transactions, balance did not change — never trust API balanceAfter for running total
    if (hasBefore && hasAfter && !isFailed) {
      running = Number(tx.balanceAfter)
      return tx
    }
    if (hasBefore && hasAfter && isFailed) {
      const before = Number(tx.balanceBefore)
      running = before
      return { ...tx, balanceBefore: before, balanceAfter: before }
    }

    const net = Number(tx.netAmount) || Math.max(0, (Number(tx.amount) || 0) - (Number(tx.fee) || 0))
    const isCredit = (tx.direction || '').toUpperCase() === 'CREDIT'
    const balanceBefore = hasBefore ? Number(tx.balanceBefore) : running
    let balanceAfter = balanceBefore
    if (!isFailed) {
      balanceAfter = isCredit ? balanceBefore + net : balanceBefore - net
    }
    running = balanceAfter
    return {
      ...tx,
      balanceBefore: hasBefore ? tx.balanceBefore : balanceBefore,
      balanceAfter: hasAfter && !isFailed ? tx.balanceAfter : balanceAfter
    }
  })
  return result.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )
}

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
  // otherwise use system transactions filtered by this partner (partnerId or partner wallets).
  // Deduplicate so we show one row per logical transaction (double-entry ledger) and compute balance before/after when missing.
  const transactions = useMemo(() => {
    let list: any[]
    if (type === 'partner') {
      list = userTxArray.length > 0 ? userTxArray : paginatedPartnerTransactions
    } else {
      list = userTxArray
    }
    const deduped = deduplicateByReference(list)
    return computeRunningBalance(deduped)
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
