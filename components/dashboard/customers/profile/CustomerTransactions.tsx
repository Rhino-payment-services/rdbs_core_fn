"use client"

import React, { useMemo, useState } from 'react'
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
  FileText,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Eye,
  ChevronDown,
  Receipt,
  RefreshCw,
  Loader2,
  Wallet,
} from 'lucide-react'
import type { Transaction } from '@/lib/types/api'
import { getDisplayNetAmount } from '@/lib/utils/transactionNetDisplay'
import { downloadProofOfPayment } from '@/lib/utils/proofOfPaymentPdf'
import { useManualTransactionStatusCheck } from '@/lib/hooks/useTransactions'
import toast from 'react-hot-toast'

function isCollectionTxn(tx: Transaction | any): boolean {
  const meta = (tx?.metadata || {}) as Record<string, unknown>
  return (
    tx?.type === 'MNO_TO_WALLET' ||
    tx?.type === 'WALLET_TOPUP_PULL' ||
    meta.paymentType === 'MERCHANT_COLLECTION' ||
    String(meta.mode || '').includes('COLLECT')
  )
}

function isUncreditedCollection(tx: Transaction | any): boolean {
  const meta = (tx?.metadata || {}) as Record<string, unknown>
  const status = String(tx?.status || '').toUpperCase()
  return (
    isCollectionTxn(tx) &&
    status === 'SUCCESS' &&
    meta.walletCredited !== true
  )
}

interface CustomerTransactionsProps {
  transactions: Transaction[]
  onExportCurrentPage: () => void
  onExportOverall?: () => void
  onExportDateRange?: (startDate: string, endDate: string) => void
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
  onGenerateStatement?: () => void
  /** Refetch statement rows after a credit recovery */
  onTransactionsRefresh?: () => void | Promise<void>
}

function walletRowLabel(w: any): string {
  const type = String(w?.walletType || 'Wallet').replace(/_/g, ' ')
  const bal = Number(w?.balance ?? 0).toLocaleString()
  const cur = w?.currency ? String(w.currency) : 'UGX'
  return `${type} — ${bal} ${cur}`
}

const CustomerTransactions = ({
  transactions,
  onExportCurrentPage,
  onExportOverall,
  onExportDateRange,
  onFilter,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  allUserWallets = [],
  statementWalletId,
  transactionUserId,
  onExportWalletTransactions,
  onGenerateStatement,
  onTransactionsRefresh,
}: CustomerTransactionsProps) => {
  const statusCheck = useManualTransactionStatusCheck()
  const [creditingId, setCreditingId] = useState<string | null>(null)
  const [bulkCrediting, setBulkCrediting] = useState(false)

  const uncreditedCollections = useMemo(
    () => transactions.filter(isUncreditedCollection),
    [transactions],
  )

  const creditCollection = async (tx: Transaction) => {
    setCreditingId(tx.id)
    try {
      const result = await statusCheck.mutateAsync(tx.id)
      const outcome = result?.data?.walletCredit?.outcome
      if (outcome === 'CREDITED_NOW') {
        toast.success(
          result.message ||
            `Credited ${Number(result?.data?.walletCredit?.creditAmount || 0).toLocaleString()} UGX to merchant wallet`,
        )
      } else if (outcome === 'ALREADY_CREDITED') {
        toast.success(result.message || 'Merchant wallet already credited')
      } else if (outcome === 'CREDIT_FAILED') {
        toast.error(
          result?.data?.walletCredit?.error ||
            result?.data?.walletCredit?.message ||
            'Partner SUCCESS but merchant wallet was not credited',
        )
      } else {
        toast.success(result?.message || 'Status checked')
      }
      await onTransactionsRefresh?.()
    } catch (err: any) {
      toast.error(
        err?.message ||
          err?.response?.data?.message ||
          'Could not check/credit this collection',
      )
    } finally {
      setCreditingId(null)
    }
  }

  const creditAllMissing = async () => {
    if (!uncreditedCollections.length) return
    setBulkCrediting(true)
    let credited = 0
    let failed = 0
    try {
      for (const tx of uncreditedCollections) {
        try {
          const result = await statusCheck.mutateAsync(tx.id)
          const outcome = result?.data?.walletCredit?.outcome
          if (outcome === 'CREDITED_NOW' || outcome === 'ALREADY_CREDITED') {
            credited += 1
          } else if (outcome === 'CREDIT_FAILED') {
            failed += 1
          }
        } catch {
          failed += 1
        }
      }
      if (credited > 0) {
        toast.success(`Credited/confirmed ${credited} collection(s)`)
      }
      if (failed > 0) {
        toast.error(`${failed} collection(s) still uncredited`)
      }
      await onTransactionsRefresh?.()
    } finally {
      setBulkCrediting(false)
    }
  }

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
  const hasAdvancedExport = !canExportByWallet
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const activeWallet = React.useMemo(
    () => allUserWallets.find((w: any) => w?.id === statementWalletId),
    [allUserWallets, statementWalletId],
  )
  const activeWalletScopeLabel = activeWallet
    ? `Selected wallet: ${(activeWallet.walletType || 'Wallet').replace(/_/g, ' ')}`
    : 'Selected wallet: All wallets'

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
          {onGenerateStatement && (
            <Button variant="outline" size="sm" onClick={onGenerateStatement}>
              <FileText className="h-4 w-4 mr-2" />
              Generate statement
            </Button>
          )}
          {uncreditedCollections.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100"
              disabled={bulkCrediting || !!creditingId}
              onClick={creditAllMissing}
            >
              {bulkCrediting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4 mr-2" />
              )}
              Credit missing ({uncreditedCollections.length})
            </Button>
          )}
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
                <DropdownMenuLabel>Export transactions</DropdownMenuLabel>
                <div className="px-2 pb-2 text-xs text-gray-500">{activeWalletScopeLabel}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onExportCurrentPage}>
                  Current page
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!onExportOverall}
                  onClick={() => onExportOverall?.()}
                >
                  Overall (all pages)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-gray-500">Export by date range</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 rounded-md border px-2 text-xs"
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 rounded-md border px-2 text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!startDate || !endDate || !onExportDateRange}
                    onClick={() => onExportDateRange?.(startDate, endDate)}
                  >
                    Export date range
                  </Button>
                </div>
                <DropdownMenuSeparator />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[min(100vw-2rem,22rem)]">
                <DropdownMenuLabel>Export transactions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onExportCurrentPage}>
                  Current page
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!onExportOverall}
                  onClick={() => onExportOverall?.()}
                >
                  Overall (all pages)
                </DropdownMenuItem>
                {hasAdvancedExport && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs text-gray-500">Export by date range</p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="h-8 rounded-md border px-2 text-xs"
                        />
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="h-8 rounded-md border px-2 text-xs"
                        />
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={!startDate || !endDate || !onExportDateRange}
                        onClick={() => onExportDateRange?.(startDate, endDate)}
                      >
                        Export date range
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
                  const uncredited = isUncreditedCollection(transaction)
                  const busy = creditingId === transaction.id || bulkCrediting
                  return (
                  <TableRow
                    key={transaction.id}
                    className={uncredited ? 'bg-amber-50/60' : undefined}
                  >
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
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(transaction.status)}
                        {uncredited && (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px]">
                            Wallet not credited
                          </Badge>
                        )}
                      </div>
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
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isCollectionTxn(transaction) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title={
                              uncredited
                                ? 'Check partner & credit merchant wallet'
                                : 'Re-check partner status / wallet credit'
                            }
                            disabled={busy}
                            className={uncredited ? 'text-amber-700' : undefined}
                            onClick={() => creditCollection(transaction)}
                          >
                            {creditingId === transaction.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Generate proof of payment"
                          onClick={async () => {
                            try {
                              await downloadProofOfPayment(transaction)
                              toast.success('Proof of payment downloaded')
                            } catch {
                              toast.error('Could not generate proof of payment')
                            }
                          }}
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                      </div>
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
