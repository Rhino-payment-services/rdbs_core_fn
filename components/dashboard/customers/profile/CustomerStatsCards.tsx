"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { 
  CreditCard,
  TrendingUp,
  Shield,
  Wallet as WalletIcon,
} from 'lucide-react'

/** Human-readable label for wallet type */
function walletTypeLabel(walletType: string | undefined): string {
  if (!walletType) return 'Wallet'
  const t = walletType.toUpperCase()
  if (t === 'PERSONAL') return 'Personal'
  if (t === 'BUSINESS') return 'Business'
  if (t === 'BUSINESS_COLLECTION') return 'Collection'
  if (t === 'BUSINESS_DISBURSEMENT' || t === 'BUSINESS_LIQUIDATION') return 'Disbursement'
  if (t.includes('ESCROW') || t.includes('RESERVE') || t.includes('SUSPENSION')) return 'Escrow / Reserve'
  return walletType.replace(/_/g, ' ')
}

interface WalletItem {
  id?: string
  walletType?: string
  balance?: number | string | null
  currency?: string
}

interface CustomerStatsCardsProps {
  stats: {
    totalTransactions: number
    currentBalance: number
    suspensionFund: number
    disbursementWalletBalance: number | null
    successRate: number
    status: string
    joinDate: string
    kycStatus: string
    riskLevel: string
    currency: string
  }
  wallets?: WalletItem[]
}

const CustomerStatsCards = ({ stats, wallets = [] }: CustomerStatsCardsProps) => {
  const currency = stats.currency || 'UGX'
  const hasMultipleWallets = Array.isArray(wallets) && wallets.length > 1

  return (
    <div className="space-y-6 mb-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Transactions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Disbursement Wallet (if available and not showing all wallets) */}
      {stats.disbursementWalletBalance !== null && !hasMultipleWallets && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disbursement Wallet</p>
                <p className="text-xl font-bold text-gray-900">
                  {(stats.disbursementWalletBalance ?? 0).toLocaleString()} {currency}
                </p>
              </div>
              <Shield className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* All wallets when user has multiple */}
    {hasMultipleWallets && (
      <div>
        <p className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
          <WalletIcon className="h-4 w-4" />
          Wallets
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {wallets.map((w) => {
            const bal = w.balance != null ? Number(w.balance) : 0
            const curr = w.currency || currency
            return (
              <Card key={w.id || w.walletType || Math.random()}>
                <CardContent className="p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {walletTypeLabel(w.walletType)}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-0.5">
                    {Number.isNaN(bal) ? '0' : bal.toLocaleString()} {curr}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )}
    </div>
  )
}

export default CustomerStatsCards 