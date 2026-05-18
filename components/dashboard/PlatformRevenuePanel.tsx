'use client'

import React, { useMemo, useState } from 'react'
import { CreditCard, FileText, Loader2 } from 'lucide-react'
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
  const [statementPartnerId, setStatementPartnerId] = useState<string>('all')
  const [statementReference, setStatementReference] = useState('')

  const [liquidateForm, setLiquidateForm] = useState({
    payoutMethod: 'BANK' as PlatformRevenuePayoutMethod,
    amount: '',
    bankCode: '',
    bankAccountNumber: '',
    bankAccountName: '',
    narration: '',
    partnerId: '',
    externalPartnerId: '',
  })
  const [bankValidationMessage, setBankValidationMessage] = useState('')
  const [bankValidationError, setBankValidationError] = useState('')
  const [bankValidationBusy, setBankValidationBusy] = useState(false)
  const [bankValidated, setBankValidated] = useState(false)

  const { data: balanceRes, refetch: refetchBalance } = usePlatformRevenueBalance()
  const currency = balanceRes?.data?.currency ?? 'UGX'
  const balance = balanceRes?.data?.balance ?? 0

  const { data: summaryRes, refetch: refetchSummary } = usePlatformRevenuePartnerSummary(currency)
  const partnerRows = summaryRes?.data?.items ?? []

  const entriesParams = useMemo(
    () => ({
      page: statementPage,
      limit: 15,
      currency,
      partnerId: statementPartnerId !== 'all' ? statementPartnerId : undefined,
      reference: statementReference.trim() || undefined,
    }),
    [statementPage, currency, statementPartnerId, statementReference],
  )

  const { data: entriesRes, isLoading: entriesLoading, refetch: refetchEntries } =
    usePlatformRevenueEntries(entriesParams)
  const entries = entriesRes?.data?.items ?? []
  const pagination = entriesRes?.data?.pagination

  const liquidateMutation = useLiquidatePlatformRevenue()
  const selectedBank = UGANDA_BANKS.find((b) => b.code === liquidateForm.bankCode)

  const gatewayPartnerOptions = useMemo(() => {
    const seen = new Set<string>()
    return partnerRows
      .filter((r) => r.partnerId && !seen.has(r.partnerId) && seen.add(r.partnerId))
      .map((r) => ({ id: r.partnerId!, label: r.partnerLabel }))
  }, [partnerRows])

  const openSettle = (target: SettleTarget) => {
    setSettleTarget(target)
    setLiquidateForm({
      payoutMethod: target.payoutMethod ?? 'BANK',
      amount: target.suggestedAmount ? String(target.suggestedAmount) : '',
      bankCode: '',
      bankAccountNumber: '',
      bankAccountName: '',
      narration: '',
      partnerId: target.partnerId ?? '',
      externalPartnerId: target.externalPartnerId ?? '',
    })
    setBankValidationMessage('')
    setBankValidationError('')
    setBankValidated(false)
    setShowLiquidate(true)
  }

  const resetLiquidate = () => {
    setLiquidateForm({
      payoutMethod: 'BANK',
      amount: '',
      bankCode: '',
      bankAccountNumber: '',
      bankAccountName: '',
      narration: '',
      partnerId: '',
      externalPartnerId: '',
    })
    setBankValidationMessage('')
    setBankValidationError('')
    setBankValidated(false)
    setSettleTarget(null)
  }

  const handleValidateBankAccount = async () => {
    const accountNumber = liquidateForm.bankAccountNumber.trim()
    const bankCode = liquidateForm.bankCode.trim()
    if (!accountNumber || !bankCode) {
      toast.error('Select a bank and enter the account number')
      return
    }
    setBankValidationBusy(true)
    setBankValidationError('')
    setBankValidationMessage('')
    setBankValidated(false)
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
      setBankValidationMessage(name)
      setBankValidated(true)
      if (name && name !== 'Account validated') {
        setLiquidateForm((prev) => ({ ...prev, bankAccountName: name }))
      }
    } catch (e: unknown) {
      setBankValidationError(e instanceof Error ? e.message : 'Validation failed')
    } finally {
      setBankValidationBusy(false)
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

    const isOffset = liquidateForm.payoutMethod === 'PARTNER_OFFSET'

    if (isOffset) {
      if (!liquidateForm.partnerId && !liquidateForm.externalPartnerId) {
        toast.error('Select a partner for offset settlement')
        return
      }
      if (!liquidateForm.narration.trim()) {
        toast.error('Narration is required (e.g. settled on ABC platform)')
        return
      }
    } else {
      if (!liquidateForm.bankCode || !liquidateForm.bankAccountNumber.trim()) {
        toast.error('Select a bank and enter the account number')
        return
      }
      if (!liquidateForm.bankAccountName.trim()) {
        toast.error('Enter the account holder name')
        return
      }
      if (!bankValidated) {
        toast.error('Validate the bank account before sending')
        return
      }
    }

    const bankName = selectedBank?.name || liquidateForm.bankCode

    try {
      const result = await liquidateMutation.mutateAsync({
        amount,
        currency,
        payoutMethod: liquidateForm.payoutMethod,
        partnerId: liquidateForm.partnerId || undefined,
        externalPartnerId: liquidateForm.externalPartnerId || undefined,
        narration: liquidateForm.narration || undefined,
        ...(isOffset
          ? {}
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
      handleError(error, isOffset ? 'Failed to record partner offset' : 'Failed to send to bank')
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
            Fee accruals and settlements for {currency}. Wallet cash may differ slightly from
            per-partner unsettled totals until all legacy fees are migrated.
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue by partner</CardTitle>
          <CardDescription>
            Accrued fees from platform revenue entries vs amounts already settled (bank or partner
            offset). Use partner offset when settlement happens on another platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partnerRows.length === 0 ? (
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
                {partnerRows.map((row) => (
                  <TableRow key={`${row.partnerId ?? ''}-${row.externalPartnerId ?? ''}`}>
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
              value={statementPartnerId}
              onValueChange={(v) => {
                setStatementPartnerId(v)
                setStatementPage(1)
              }}
            >
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="Partner filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All partners</SelectItem>
                {gatewayPartnerOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
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
                    <TableHead className="text-right">Fee amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
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
                        {entry.transactionType || entry.transaction?.type || '—'}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {entry.transaction?.reference || entry.transactionId.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(entry.amount, entry.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
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
                : 'Debit consolidated revenue — bank transfer or partner offset.'}
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
                  setBankValidated(false)
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK">Send to bank</SelectItem>
                  <SelectItem value="PARTNER_OFFSET">Partner offset (no bank)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Partner offset records a deduction when fees are settled on another platform (e.g.
                ABC, Pegasus float).
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
                      setBankValidated(false)
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
                        setBankValidated(false)
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleValidateBankAccount}
                      disabled={bankValidationBusy}
                    >
                      {bankValidationBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validate'}
                    </Button>
                  </div>
                  {bankValidationMessage && (
                    <p className="text-sm text-green-700 mt-1">{bankValidationMessage}</p>
                  )}
                  {bankValidationError && (
                    <p className="text-sm text-red-600 mt-1">{bankValidationError}</p>
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
            ) : (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3">
                No bank transfer. Wallet is debited and the settlement is attributed to the selected
                partner for reporting.
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
                  (liquidateForm.payoutMethod === 'BANK' && !bankValidated)
                }
              >
                {liquidateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : liquidateForm.payoutMethod === 'PARTNER_OFFSET' ? (
                  'Record offset'
                ) : (
                  'Send to bank'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
