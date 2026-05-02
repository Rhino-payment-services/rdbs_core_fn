"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Download,
  Filter,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Eye,
  ChevronDown,
} from 'lucide-react'
import type { Transaction } from '@/lib/types/api'
import { getDisplayNetAmount } from '@/lib/utils/transactionNetDisplay'

interface CustomerTransactionsProps {
  transactions: Transaction[]
  onExport: () => void
  onFilter: () => void
  isLoading?: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  /** When provided with onExportWalletTransactions, Export downloads CSV per wallet via admin API. */
  allUserWallets?: any[]
  statementWalletId?: string
  transactionUserId?: string
  onExportWalletTransactions?: (walletId: string | undefined, label: string) => Promise<void>
}

function walletRowLabel(w: any): string {
  const type = String(w?.walletType || 'Wallet').replace(/_/g, ' ')
  const bal = Number(w?.balance ?? 0).toLocaleString()
  const cur = w?.currency ? String(w.currency) : 'UGX'
  return `${type} — ${bal} ${cur}`
}

const CustomerTransactions = ({
  transactions,
  onExport,
  onFilter,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  allUserWallets = [],
  statementWalletId,
  transactionUserId,
  onExportWalletTransactions,
}: CustomerTransactionsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTransactionTypeIcon = (type: string) => {
    if (type.includes('DEPOSIT') || type.includes('WALLET_TO_WALLET')) {
      return <ArrowDownLeft className="h-4 w-4 text-green-600" />
    } else if (type.includes('WITHDRAWAL') || type.includes('BILL_PAYMENT')) {
      return <ArrowUpRight className="h-4 w-4 text-red-600" />
    } else {
      return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPartnerBadge = (transaction: Transaction) => {
    const txAny = transaction as any
    const metadataPartnerName = txAny?.metadata?.partnerName || txAny?.metadata?.apiPartnerName
    const apiPartnerName = txAny?.partner?.partnerName
    const reasonText = String(txAny?.metadata?.reason || transaction.description || '')
    const reasonMatch = reasonText.match(/—\s*(.+)$/)
    const partnerNameFromReason = reasonMatch?.[1]?.trim()

    const partnerName = apiPartnerName || metadataPartnerName || partnerNameFromReason
    if (partnerName) {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
          {partnerName}
        </Badge>
      )
    }

    if (!transaction.partnerMapping?.partner) {
      return <Badge variant="outline">Direct</Badge>
    }

    const partner = transaction.partnerMapping.partner
    
    return (
      <div className="flex items-center gap-1">
        <ExternalLink className="h-3 w-3 text-blue-600" />
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          {partner.partnerCode}
        </Badge>
      </div>
    )
  }

  const getTransactionTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'DEPOSIT': 'Deposit',
      'WITHDRAWAL': 'Withdrawal',
      'WALLET_TO_WALLET': 'Wallet Transfer',
      'WALLET_TO_EXTERNAL_MERCHANT': 'Merchant Payment',
      'BILL_PAYMENT': 'Bill Payment',
      'MERCHANT_WITHDRAWAL': 'Merchant Withdrawal',
      'MNO_TO_WALLET': 'Mobile Money to Wallet',
      'WALLET_TO_MNO': 'Wallet to Mobile Money',
      'WALLET_TO_BANK': 'Wallet to Bank',
      'BANK_TO_WALLET': 'Bank to Wallet',
      'MERCHANT_TO_WALLET': 'Merchant to Wallet',
      'MERCHANT_TO_INTERNAL_WALLET': 'Merchant to Wallet',
      'WALLET_TO_MERCHANT': 'Wallet to Merchant',
      'WALLET_TO_INTERNAL_MERCHANT': 'Wallet to Merchant',
      'REVERSAL': 'Reversal'
    }
    if (type && typeLabels[type]) return typeLabels[type]
    if (type?.includes('MNO_TO_WALLET')) return 'Mobile Money to Wallet'
    if (type?.includes('WALLET_TO_MNO')) return 'Wallet to Mobile Money'
    if (type?.includes('WALLET_TO_BANK')) return 'Wallet to Bank'
    if (type?.includes('WALLET_TO_MERCHANT') || type?.includes('MERCHANT')) return type.includes('TO_WALLET') ? 'Merchant to Wallet' : 'Wallet to Merchant'
    return type || 'Transaction'
  }

  const canExportByWallet =
    !!transactionUserId &&
    !!onExportWalletTransactions &&
    Array.isArray(allUserWallets) &&
    allUserWallets.length > 0

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>Loading transaction history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Transaction History
        </CardTitle>
        <CardDescription>
          Complete transaction history for this customer
        </CardDescription>
        <div className="flex gap-2 mt-4 flex-wrap items-center">
          <Button variant="outline" size="sm" onClick={onFilter}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          {canExportByWallet ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[min(100vw-2rem,22rem)]">
                <DropdownMenuLabel>Choose wallet for CSV</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {statementWalletId && (
                  <DropdownMenuItem
                    onClick={() =>
                      onExportWalletTransactions!(
                        statementWalletId,
                        `statement_table_${statementWalletId.slice(0, 8)}`,
                      )
                    }
                  >
                    Current statement (matches table)
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onExportWalletTransactions!(undefined, 'all_wallets_combined')}
                >
                  All wallets (combined)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {allUserWallets.map((w: any) => {
                  if (!w?.id) return null
                  const label = walletRowLabel(w)
                  const isStatement = statementWalletId === w.id
                  return (
                    <DropdownMenuItem
                      key={w.id}
                      onClick={() => onExportWalletTransactions!(w.id, label)}
                    >
                      <span className={isStatement ? 'font-medium' : undefined}>
                        {label}
                        {isStatement ? ' — same as table' : ''}
                      </span>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
            <p className="text-sm text-gray-400">This customer hasn't made any transactions yet</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Bal. Before</TableHead>
                  <TableHead>Bal. After</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const netDisplay = getDisplayNetAmount(transaction)
                  return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionTypeIcon(transaction.type)}
                        <div>
                          <div className="font-medium text-sm">
                            {getTransactionTypeLabel(transaction.type)}
                          </div>
                          {transaction.description && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPartnerBadge(transaction)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {transaction.fee > 0 ? formatCurrency(transaction.fee) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {netDisplay == null ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        formatCurrency(netDisplay)
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 font-mono">
                      {transaction.balanceBefore != null
                        ? formatCurrency(Number(transaction.balanceBefore))
                        : <span className="text-gray-300">—</span>}
                    </TableCell>
                    <TableCell className={`text-sm font-mono font-medium ${transaction.balanceAfter != null ? 'text-blue-700' : ''}`}>
                      {transaction.balanceAfter != null
                        ? formatCurrency(Number(transaction.balanceAfter))
                        : <span className="text-gray-300">—</span>}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-500">
                      <div className="flex flex-col">
                        <span>{transaction.reference || transaction.externalReference || '-'}</span>
                        {(() => {
                          const meta = (transaction as any)?.metadata || {}
                          const queue =
                            meta.bulkQueuePosition ??
                            meta.queuePosition ??
                            meta.queueIndex
                          const debited = meta.debitAppliedAt || meta.debitAmount != null
                          const refunded = meta.refundAppliedAt || meta.refundAmount != null
                          if (queue == null && !debited && !refunded) return null
                          return (
                            <span className="text-[10px] text-gray-400 mt-0.5">
                              {queue != null ? `Q#${String(queue)} ` : ''}
                              {debited ? 'Debited ' : ''}
                              {refunded ? 'Refunded' : ''}
                            </span>
                          )
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default CustomerTransactions
