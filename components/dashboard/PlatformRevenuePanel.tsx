'use client'

import React, { useMemo, useState } from 'react'
import { CreditCard, ExternalLink, FileText, Loader2 } from 'lucide-react'
import api from '@/lib/axios'
import { TransactionDetailsModal } from '@/components/dashboard/transactions/TransactionDetailsModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  usePlatformRevenueBalance,
  usePlatformRevenueEntries,
  usePlatformRevenuePartnerSummary,
  useLiquidatePlatformRevenue,
  type PlatformRevenuePartnerSummaryRow,
  type PlatformRevenuePayoutMethod,
} from '@/lib/hooks/useWallets'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import { UGANDA_BANKS } from '@/lib/constants/ugandaBanks'
import toast from 'react-hot-toast'

const formatCurrency = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

function normalizeTransactionPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  const payload = raw as Record<string, unknown>
  if (payload.id) return payload
  if (payload.data && typeof payload.data === 'object' && (payload.data as Record<string, unknown>).id) {
    return payload.data as Record<string, unknown>
  }
  return null
}

function extractPartnerSummaryItems(summaryRes: unknown) {
  if (!summaryRes || typeof summaryRes !== 'object') return []
  const res = summaryRes as Record<string, unknown>
  if (Array.isArray(res.items)) return res.items as PlatformRevenuePartnerSummaryRow[]
  if (res.data && typeof res.data === 'object') {
    const data = res.data as Record<string, unknown>
    if (Array.isArray(data.items)) return data.items as PlatformRevenuePartnerSummaryRow[]
  }
  return []
}

function extractPartnerSummaryMeta(summaryRes: unknown) {
  const empty = {
    totals: null as {
      accruedAmount: number
      liquidatedAmount: number
      unsettledAmount: number
      entryCount: number
    } | null,
    walletBalance: undefined as number | undefined,
    lifetimeAccruedInEntries: undefined as number | undefined,
    orphanWalletBalance: undefined as number | undefined,
  }
  if (!summaryRes || typeof summaryRes !== 'object') return empty
  const data =
    'data' in (summaryRes as object) && (summaryRes as { data?: unknown }).data
      ? ((summaryRes as { data: Record<string, unknown> }).data)
      : (summaryRes as Record<string, unknown>)
  if (!data || typeof data !== 'object') return empty
  const totalsRaw = data.totals
  const totals =
    totalsRaw && typeof totalsRaw === 'object'
      ? (totalsRaw as {
          accruedAmount: number
          liquidatedAmount: number
          unsettledAmount: number
          entryCount: number
        })
      : null
  return {
    totals,
    walletBalance: typeof data.walletBalance === 'number' ? data.walletBalance : undefined,
    lifetimeAccruedInEntries:
      typeof data.lifetimeAccruedInEntries === 'number' ? data.lifetimeAccruedInEntries : undefined,
    orphanWalletBalance:
      typeof data.orphanWalletBalance === 'number' ? data.orphanWalletBalance : undefined,
  }
}

type SettleTarget = {
  partnerId?: string
  externalPartnerId?: string
  partnerLabel: string
  suggestedAmount?: number
  payoutMethod?: PlatformRevenuePayoutMethod
}

interface PlatformRevenuePanelProps {
  walletDescription?: string
}

export function PlatformRevenuePanel({ walletDescription }: PlatformRevenuePanelProps) {
  const { handleError } = useErrorHandler()
  const [showLiquidate, setShowLiquidate] = useState(false)
  const [settleTarget, setSettleTarget] = useState<SettleTarget | null>(null)

  const [statementPage, setStatementPage] = useState(1)
  const [statementPartnerKey, setStatementPartnerKey] = useState<string>('all')
  const [statementReference, setStatementReference] = useState('')

  const [liquidateForm, setLiquidateForm] = useState({
    payoutMethod: 'BANK' as PlatformRevenuePayoutMethod,
    amount: '',
    bankCode: '',
    bankAccountNumber: '',
    bankAccountName: '',
    phoneNumber: '',
    mnoProvider: 'MTN',
    recipientName: '',
    narration: '',
    partnerId: '',
    externalPartnerId: '',
  })
  const [validationMessage, setValidationMessage] = useState('')
  const [validationError, setValidationError] = useState('')
  const [validationBusy, setValidationBusy] = useState(false)
  const [destinationValidated, setDestinationValidated] = useState(false)
  const [detailTransaction, setDetailTransaction] = useState<Record<string, unknown> | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const { data: balanceRes, refetch: refetchBalance } = usePlatformRevenueBalance()
  const currency = balanceRes?.data?.currency ?? 'UGX'
  const balance = balanceRes?.data?.balance ?? 0

  const {
    data: summaryRes,
    refetch: refetchSummary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = usePlatformRevenuePartnerSummary(currency)
  const partnerRows = useMemo(() => extractPartnerSummaryItems(summaryRes), [summaryRes])
  const partnerMeta = useMemo(() => extractPartnerSummaryMeta(summaryRes), [summaryRes])
  const partnerTotals = partnerMeta.totals
  const orphanBalance = partnerMeta.orphanWalletBalance ?? 0
  const showReconciliationGap = orphanBalance > 1000

  const selectedPartnerFilter = useMemo(() => {
    if (statementPartnerKey === 'all') return null
    return partnerRows.find((row) => {
      const key = row.partnerId
        ? `g:${row.partnerId}`
        : row.externalPartnerId
          ? `e:${row.externalPartnerId}`
          : 'unattributed'
      return key === statementPartnerKey
    })
  }, [statementPartnerKey, partnerRows])

  const entriesParams = useMemo(
    () => ({
      page: statementPage,
      limit: 15,
      currency,
      partnerId: selectedPartnerFilter?.partnerId ?? undefined,
      externalPartnerId: selectedPartnerFilter?.externalPartnerId ?? undefined,
      reference: statementReference.trim() || undefined,
    }),
    [statementPage, currency, selectedPartnerFilter, statementReference],
  )

  const { data: entriesRes, isLoading: entriesLoading, refetch: refetchEntries } =
    usePlatformRevenueEntries(entriesParams)
  const entries = entriesRes?.data?.items ?? []
  const pagination = entriesRes?.data?.pagination

  const liquidateMutation = useLiquidatePlatformRevenue()
  const selectedBank = UGANDA_BANKS.find((b) => b.code === liquidateForm.bankCode)

  const partnerFilterOptions = useMemo(() => {
    return partnerRows
      .filter((r) => r.partnerId || r.externalPartnerId)
      .map((r) => ({
        key: r.partnerId
          ? `g:${r.partnerId}`
          : r.externalPartnerId
            ? `e:${r.externalPartnerId}`
            : 'unattributed',
        label: r.partnerLabel,
      }))
  }, [partnerRows])

  const handleViewTransaction = async (transactionId: string) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailTransaction(null)
    try {
      const response = await api.get(`/transactions/${transactionId}`)
      const tx = normalizeTransactionPayload(response.data)
      if (!tx) {
        toast.error('Transaction not found')
        setDetailModalOpen(false)
        return
      }
      setDetailTransaction(tx)
    } catch {
      toast.error('Failed to load transaction details')
      setDetailModalOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const openSettle = (target: SettleTarget) => {
    setSettleTarget(target)
    setLiquidateForm({
      payoutMethod: target.payoutMethod ?? 'BANK',
      amount: target.suggestedAmount ? String(target.suggestedAmount) : '',
      bankCode: '',
      bankAccountNumber: '',
      bankAccountName: '',
      phoneNumber: '',
      mnoProvider: 'MTN',
      recipientName: '',
      narration: '',
      partnerId: target.partnerId ?? '',
      externalPartnerId: target.externalPartnerId ?? '',
    })
    setValidationMessage('')
    setValidationError('')
    setDestinationValidated(false)
    setShowLiquidate(true)
  }

  const resetLiquidate = () => {
    setLiquidateForm({
      payoutMethod: 'BANK',
      amount: '',
      bankCode: '',
      bankAccountNumber: '',
      bankAccountName: '',
      phoneNumber: '',
      mnoProvider: 'MTN',
      recipientName: '',
      narration: '',
      partnerId: '',
      externalPartnerId: '',
    })
    setValidationMessage('')
    setValidationError('')
    setDestinationValidated(false)
    setSettleTarget(null)
  }

  const clearValidation = () => {
    setValidationMessage('')
    setValidationError('')
    setDestinationValidated(false)
  }

  const handleValidateBankAccount = async () => {
    const accountNumber = liquidateForm.bankAccountNumber.trim()
    const bankCode = liquidateForm.bankCode.trim()
    if (!accountNumber || !bankCode) {
      toast.error('Select a bank and enter the account number')
      return
    }
    setValidationBusy(true)
    clearValidation()
    try {
      const res = await fetch('/api/transactions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionType: 'WALLET_TO_BANK',
          accountNumber,
          bankCode,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Bank account validation failed')
      const name =
        (payload?.beneficiary?.name ||
          payload?.validationResult?.data?.name ||
          'Account validated') as string
      setValidationMessage(name)
      setDestinationValidated(true)
      if (name && name !== 'Account validated') {
        setLiquidateForm((prev) => ({ ...prev, bankAccountName: name }))
      }
    } catch (e: unknown) {
      setValidationError(e instanceof Error ? e.message : 'Validation failed')
    } finally {
      setValidationBusy(false)
    }
  }

  const handleValidateMno = async () => {
    const phoneNumber = liquidateForm.phoneNumber.trim()
    const network = liquidateForm.mnoProvider.trim()
    if (!phoneNumber || !network) {
      toast.error('Select a network and enter the mobile number')
      return
    }
    setValidationBusy(true)
    clearValidation()
    try {
      const res = await fetch('/api/transactions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionType: 'WALLET_TO_MNO',
          phoneNumber,
          network,
        }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || 'Mobile money validation failed')
      const name =
        (payload?.beneficiary?.name ||
          payload?.validationResult?.data?.name ||
          'Mobile number validated') as string
      setValidationMessage(name)
      setDestinationValidated(true)
      if (name && name !== 'Mobile number validated') {
        setLiquidateForm((prev) => ({ ...prev, recipientName: name }))
      }
    } catch (e: unknown) {
      setValidationError(e instanceof Error ? e.message : 'Validation failed')
    } finally {
      setValidationBusy(false)
    }
  }

  const handleLiquidate = async () => {
    const amount = parseFloat(liquidateForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    if (amount > balance) {
      toast.error('Amount exceeds available platform revenue balance')
      return
    }

    const method = liquidateForm.payoutMethod
    const isOffset = method === 'PARTNER_OFFSET'
    const isMno = method === 'MNO'
    const isBank = method === 'BANK'

    if (isOffset) {
      if (!liquidateForm.partnerId && !liquidateForm.externalPartnerId) {
        toast.error('Select a partner for offset settlement')
        return
      }
      if (!liquidateForm.narration.trim()) {
        toast.error('Narration is required (e.g. settled on ABC platform)')
        return
      }
    } else if (isMno) {
      if (!liquidateForm.phoneNumber.trim() || !liquidateForm.mnoProvider.trim()) {
        toast.error('Select a network and enter the mobile number')
        return
      }
      if (!destinationValidated) {
        toast.error('Validate the mobile number before sending')
        return
      }
    } else if (isBank) {
      if (!liquidateForm.bankCode || !liquidateForm.bankAccountNumber.trim()) {
        toast.error('Select a bank and enter the account number')
        return
      }
      if (!liquidateForm.bankAccountName.trim()) {
        toast.error('Enter the account holder name')
        return
      }
      if (!destinationValidated) {
        toast.error('Validate the bank account before sending')
        return
      }
    }

    const bankName = selectedBank?.name || liquidateForm.bankCode

    try {
      const result = await liquidateMutation.mutateAsync({
        amount,
        currency,
        payoutMethod: method,
        partnerId: liquidateForm.partnerId || undefined,
        externalPartnerId: liquidateForm.externalPartnerId || undefined,
        narration: liquidateForm.narration || undefined,
        ...(isOffset
          ? {}
          : isMno
            ? {
                phoneNumber: liquidateForm.phoneNumber.trim(),
                mnoProvider: liquidateForm.mnoProvider.trim(),
                recipientName: liquidateForm.recipientName.trim() || undefined,
              }
            : {
                bankName,
                bankAccountNumber: liquidateForm.bankAccountNumber.trim(),
                bankAccountName: liquidateForm.bankAccountName.trim(),
                bankCode: liquidateForm.bankCode,
              }),
      })
      toast.success(
        isOffset
          ? `Recorded ${formatCurrency(amount, currency)} partner offset`
          : isMno
            ? `Sent ${formatCurrency(amount, currency)} to ${liquidateForm.mnoProvider} ${liquidateForm.phoneNumber}${
                result?.data?.partnerReference ? ` (ref: ${result.data.partnerReference})` : ''
              }`
            : `Sent ${formatCurrency(amount, currency)} to ${bankName}${
                result?.data?.partnerReference ? ` (ref: ${result.data.partnerReference})` : ''
              }`,
      )
      setShowLiquidate(false)
      resetLiquidate()
      refetchBalance()
      refetchSummary()
      refetchEntries()
    } catch (error) {
      handleError(
        error,
        isOffset
          ? 'Failed to record partner offset'
          : isMno
            ? 'Failed to send to mobile money'
            : 'Failed to send to bank',
      )
    }
  }

  const renderPartnerActions = (row: PlatformRevenuePartnerSummaryRow) => {
    if (row.unsettledAmount <= 0) return null
    const target: SettleTarget = {
      partnerId: row.partnerId ?? undefined,
      externalPartnerId: row.externalPartnerId ?? undefined,
      partnerLabel: row.partnerLabel,
      suggestedAmount: row.unsettledAmount,
    }
    return (
      <div className="flex flex-wrap gap-1 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => openSettle({ ...target, payoutMethod: 'BANK' })}
        >
          Send to bank
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => openSettle({ ...target, payoutMethod: 'MNO' })}
        >
          Send to MNO
        </Button>
        {row.partnerKind !== 'unattributed' && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openSettle({ ...target, payoutMethod: 'PARTNER_OFFSET' })}
          >
            Partner offset
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <Card className="mb-6 border-indigo-200 bg-indigo-50/40">
        <CardHeader>
          <CardTitle className="text-indigo-900">Platform revenue (consolidated)</CardTitle>
          <CardDescription>
            Wallet balance is all cash in the consolidated fee wallet. Partner rows below only
            count fees recorded in platform revenue entries (per-transaction accruals).
            {walletDescription ? ` Wallet: ${walletDescription}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">Available to liquidate (wallet balance)</p>
            <p className="text-3xl font-bold text-indigo-700">{formatCurrency(balance, currency)}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setStatementPage(1)
                refetchEntries()
                refetchSummary()
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              Refresh statement
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => openSettle({ partnerLabel: 'All partners' })}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Settle revenue
            </Button>
          </div>
        </CardContent>
      </Card>

      {showReconciliationGap && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium text-amber-900">Wallet balance vs entry totals</p>
          <p className="mt-1 text-amber-900/90">
            Wallet holds {formatCurrency(balance, currency)}, but platform revenue entries only
            account for {formatCurrency(partnerMeta.lifetimeAccruedInEntries ?? 0, currency)} in
            accrued fees
            {partnerTotals && partnerTotals.liquidatedAmount > 0
              ? ` (${formatCurrency(partnerTotals.liquidatedAmount, currency)} already settled from entries)`
              : ''}
            . About {formatCurrency(orphanBalance, currency)} is from legacy fee wallet sweeps or
            older backfills that credited the wallet without a matching entry row — it is safe to
            liquidate but will not appear in the partner table until backfilled.
          </p>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue by partner</CardTitle>
          <CardDescription>
            Accrued fees from platform revenue entries vs amounts already settled (bank or partner
            offset). Use partner offset when settlement happens on another platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : summaryError ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-red-600">
                Could not load revenue by partner. The summary API may not be deployed yet.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetchSummary()}>
                Retry
              </Button>
            </div>
          ) : partnerRows.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No partner accruals yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead className="text-right">Accrued</TableHead>
                  <TableHead className="text-right">Settled</TableHead>
                  <TableHead className="text-right">Unsettled</TableHead>
                  <TableHead className="text-right">Entries</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partnerRows.map((row, idx) => (
                  <TableRow
                    key={`${row.partnerId ?? ''}-${row.externalPartnerId ?? ''}-${idx}`}
                  >
                    <TableCell className="font-medium">{row.partnerLabel}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.accruedAmount, currency)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.liquidatedAmount, currency)}</TableCell>
                    <TableCell className="text-right font-medium text-indigo-700">
                      {formatCurrency(row.unsettledAmount, currency)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">{row.entryCount}</TableCell>
                    <TableCell>{renderPartnerActions(row)}</TableCell>
                  </TableRow>
                ))}
                {partnerTotals && (
                  <TableRow className="bg-gray-50 font-medium border-t">
                    <TableCell>Total (from entries)</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(partnerTotals.accruedAmount, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(partnerTotals.liquidatedAmount, currency)}
                    </TableCell>
                    <TableCell className="text-right text-indigo-700">
                      {formatCurrency(partnerTotals.unsettledAmount, currency)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">{partnerTotals.entryCount}</TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue statement</CardTitle>
          <CardDescription>
            Each row is a fee credited to platform revenue from a successful transaction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={statementPartnerKey}
              onValueChange={(v) => {
                setStatementPartnerKey(v)
                setStatementPage(1)
              }}
            >
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="Partner filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All partners</SelectItem>
                {partnerFilterOptions.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search reference..."
              value={statementReference}
              onChange={(e) => {
                setStatementReference(e.target.value)
                setStatementPage(1)
              }}
              className="sm:max-w-xs"
            />
          </div>

          {entriesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No revenue entries found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Txn amount</TableHead>
                    <TableHead className="text-right">Fee amount</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => {
                    const tx = entry.transaction
                    return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDate(entry.creditedAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.partnerLabel ? (
                          <Badge variant="secondary">{entry.partnerLabel}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.transactionType || tx?.type || '—'}
                      </TableCell>
                      <TableCell className="text-sm font-mono max-w-[140px] truncate" title={tx?.reference ?? ''}>
                        {tx?.reference || entry.transactionId.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        {tx?.amount != null
                          ? formatCurrency(tx.amount, tx.currency || entry.currency)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(entry.amount, entry.currency)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={detailLoading}
                          onClick={() => handleViewTransaction(entry.transactionId)}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} entries)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setStatementPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setStatementPage((p) => p + 1)}
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

      <Dialog
        open={showLiquidate}
        onOpenChange={(open) => {
          setShowLiquidate(open)
          if (!open) resetLiquidate()
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settle platform revenue</DialogTitle>
            <DialogDescription>
              {settleTarget?.partnerLabel
                ? `Settling: ${settleTarget.partnerLabel}`
                : 'Debit consolidated revenue — bank, mobile money (MNO), or partner offset.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Wallet balance</Label>
              <p className="text-xl font-bold text-indigo-700">{formatCurrency(balance, currency)}</p>
            </div>

            <div>
              <Label>Settlement method</Label>
              <Select
                value={liquidateForm.payoutMethod}
                onValueChange={(v) => {
                  setLiquidateForm((prev) => ({
                    ...prev,
                    payoutMethod: v as PlatformRevenuePayoutMethod,
                  }))
                  clearValidation()
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK">Send to bank</SelectItem>
                  <SelectItem value="MNO">Send to mobile money (MTN / Airtel)</SelectItem>
                  <SelectItem value="PARTNER_OFFSET">Partner offset (no payout)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Bank and MNO send funds via payment partners. Partner offset only debits the wallet
                when settlement happens on another platform.
              </p>
            </div>

            <div>
              <Label htmlFor="liquidateAmount">Amount *</Label>
              <Input
                id="liquidateAmount"
                type="number"
                value={liquidateForm.amount}
                onChange={(e) => setLiquidateForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="mt-1"
              />
            </div>

            {liquidateForm.payoutMethod === 'BANK' ? (
              <>
                <div>
                  <Label>Bank *</Label>
                  <Select
                    value={liquidateForm.bankCode || undefined}
                    onValueChange={(code) => {
                      setLiquidateForm((prev) => ({ ...prev, bankCode: code }))
                      clearValidation()
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {UGANDA_BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Account number *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={liquidateForm.bankAccountNumber}
                      onChange={(e) => {
                        setLiquidateForm((prev) => ({ ...prev, bankAccountNumber: e.target.value }))
                        clearValidation()
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidateBankAccount}
                      disabled={validationBusy}
                    >
                      {validationBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validate'}
                    </Button>
                  </div>
                  {validationMessage && liquidateForm.payoutMethod === 'BANK' && (
                    <p className="text-sm text-green-700 mt-1">{validationMessage}</p>
                  )}
                  {validationError && liquidateForm.payoutMethod === 'BANK' && (
                    <p className="text-sm text-red-600 mt-1">{validationError}</p>
                  )}
                </div>
                <div>
                  <Label>Account name *</Label>
                  <Input
                    value={liquidateForm.bankAccountName}
                    onChange={(e) =>
                      setLiquidateForm((prev) => ({ ...prev, bankAccountName: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
              </>
            ) : liquidateForm.payoutMethod === 'MNO' ? (
              <>
                <div>
                  <Label>Network *</Label>
                  <Select
                    value={liquidateForm.mnoProvider}
                    onValueChange={(network) => {
                      setLiquidateForm((prev) => ({ ...prev, mnoProvider: network }))
                      clearValidation()
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MTN">MTN</SelectItem>
                      <SelectItem value="Airtel">Airtel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Mobile number *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="e.g. 256701234567"
                      value={liquidateForm.phoneNumber}
                      onChange={(e) => {
                        setLiquidateForm((prev) => ({ ...prev, phoneNumber: e.target.value }))
                        clearValidation()
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidateMno}
                      disabled={validationBusy}
                    >
                      {validationBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validate'}
                    </Button>
                  </div>
                  {validationMessage && liquidateForm.payoutMethod === 'MNO' && (
                    <p className="text-sm text-green-700 mt-1">{validationMessage}</p>
                  )}
                  {validationError && liquidateForm.payoutMethod === 'MNO' && (
                    <p className="text-sm text-red-600 mt-1">{validationError}</p>
                  )}
                </div>
                <div>
                  <Label>Recipient name</Label>
                  <Input
                    value={liquidateForm.recipientName}
                    onChange={(e) =>
                      setLiquidateForm((prev) => ({ ...prev, recipientName: e.target.value }))
                    }
                    placeholder="Filled from validation when available"
                    className="mt-1"
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
                No bank or mobile money transfer. Wallet is debited and the settlement is attributed
                to the selected partner for reporting.
              </p>
            )}

            <div>
              <Label>Narration {liquidateForm.payoutMethod === 'PARTNER_OFFSET' ? '*' : '(optional)'}</Label>
              <Input
                value={liquidateForm.narration}
                onChange={(e) => setLiquidateForm((prev) => ({ ...prev, narration: e.target.value }))}
                placeholder={
                  liquidateForm.payoutMethod === 'PARTNER_OFFSET'
                    ? 'e.g. Settled on ABC partner float — March 2026'
                    : 'Optional'
                }
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowLiquidate(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleLiquidate}
                disabled={
                  liquidateMutation.isPending ||
                  ((liquidateForm.payoutMethod === 'BANK' ||
                    liquidateForm.payoutMethod === 'MNO') &&
                    !destinationValidated)
                }
              >
                {liquidateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : liquidateForm.payoutMethod === 'PARTNER_OFFSET' ? (
                  'Record offset'
                ) : liquidateForm.payoutMethod === 'MNO' ? (
                  'Send to mobile money'
                ) : (
                  'Send to bank'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TransactionDetailsModal
        isOpen={detailModalOpen}
        onOpenChange={(open) => {
          setDetailModalOpen(open)
          if (!open) setDetailTransaction(null)
        }}
        transaction={detailLoading ? null : detailTransaction}
      />
    </>
  )
}
