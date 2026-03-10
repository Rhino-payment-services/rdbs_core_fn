import { useMemo } from 'react'
import type { Wallet } from '@/lib/types/api'

const EMPTY_ARRAY: any[] = []

export const useCustomerStats = ({
  type,
  transactions,
  partnerTransactions,
  partnerWallets,
  partnerWalletIds,
  partnerId,
  wallets,
  walletBalance
}: {
  type: string
  transactions: any[]
  partnerTransactions: any[]
  partnerWallets: Wallet[]
  partnerWalletIds: string[]
  partnerId: string
  wallets: any[]
  walletBalance: any
}) => {
  // Process transactions for stats
  const statsTransactions = useMemo(() => {
    if (type === 'partner') {
      return Array.isArray(partnerTransactions) ? partnerTransactions : EMPTY_ARRAY
    }
    return Array.isArray(transactions) ? transactions : EMPTY_ARRAY
  }, [type, partnerTransactions, transactions])

  // Find escrow wallets
  const escrowWallets = useMemo(() => {
    if (type !== 'partner' || !Array.isArray(partnerWallets) || partnerWallets.length === 0) return EMPTY_ARRAY
    return partnerWallets.filter((w: Wallet) => 
      w?.walletType?.toUpperCase().includes('ESCROW') || 
      w?.walletType?.toUpperCase().includes('RESERVE') ||
      w?.walletType?.toUpperCase().includes('SUSPENSION')
    )
  }, [type, partnerWallets])

  // Calculate suspension fund (escrow / reserve / suspension wallets)
  const suspensionFund = useMemo(() => {
    if (type === 'partner') {
      if (Array.isArray(escrowWallets) && escrowWallets.length > 0) {
        return escrowWallets.reduce((sum, w) => {
          const balance = w?.balance ? parseFloat(w.balance.toString()) : 0
          return sum + (isNaN(balance) ? 0 : balance)
        }, 0)
      }
      return 0
    } else {
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
  }, [type, escrowWallets, wallets])

  // Disbursement wallet balance (BUSINESS_DISBURSEMENT or BUSINESS_LIQUIDATION)
  const disbursementWalletBalance = useMemo(() => {
    const sourceWallets =
      type === 'partner'
        ? Array.isArray(partnerWallets) ? partnerWallets : EMPTY_ARRAY
        : Array.isArray(wallets) ? wallets : EMPTY_ARRAY

    if (!Array.isArray(sourceWallets) || sourceWallets.length === 0) return null

    const disbursementWallet = sourceWallets.find((w: any) =>
      w?.walletType === 'BUSINESS_DISBURSEMENT' ||
      w?.walletType === 'BUSINESS_LIQUIDATION'
    )

    if (!disbursementWallet) return null

    const balance = disbursementWallet.balance ? parseFloat(disbursementWallet.balance.toString()) : 0
    return isNaN(balance) ? 0 : balance
  }, [type, partnerWallets, wallets])

  // Calculate current balance
  const currentBalance = useMemo(() => {
    if (type === 'partner') {
      if (!Array.isArray(partnerWallets) || partnerWallets.length === 0) return 0
      return partnerWallets.reduce((sum, w) => {
        const balance = w?.balance ? parseFloat(w.balance.toString()) : 0
        return sum + (isNaN(balance) ? 0 : balance)
      }, 0)
    }
    const balance = walletBalance?.balance ? parseFloat(walletBalance.balance.toString()) : 0
    return isNaN(balance) ? 0 : balance
  }, [type, partnerWallets, walletBalance])

  // Calculate average transaction value
  const avgTransactionValue = useMemo(() => {
    if (!Array.isArray(statsTransactions) || statsTransactions.length === 0) return 0
    const total = statsTransactions.reduce((sum: number, tx: any) => {
      if (!tx) return sum
      const amount = parseFloat(tx.amount?.toString() || '0')
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)
    return total / statsTransactions.length
  }, [statsTransactions])

  // Calculate success rate
  const successRate = useMemo(() => {
    if (!Array.isArray(statsTransactions) || statsTransactions.length === 0) return 0
    const successful = statsTransactions.filter((tx: any) => tx && tx.status === 'SUCCESS').length
    return (successful / statsTransactions.length) * 100
  }, [statsTransactions])

  return {
    currentBalance,
    suspensionFund,
    disbursementWalletBalance,
    avgTransactionValue,
    successRate
  }
}
