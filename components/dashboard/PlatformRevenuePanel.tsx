'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { CreditCard, ExternalLink, FileText, Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
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
  useSyncPlatformRevenueAccruals,
  type PlatformRevenuePartnerSummaryRow,
  type PlatformRevenuePayoutMethod,
  type PlatformRevenueSettlementAllocation,
  type PlatformRevenueSummarySort,
} from '@/lib/hooks/useWallets'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import { UGANDA_BANKS } from '@/lib/constants/ugandaBanks'
import toast from 'react-hot-toast'

/** Match ledger formatting: show decimals when the amount is not a whole number. */
const formatCurrency = (amount: number, currency: string) => {
  const n = Number(amount)
  const hasFraction = Number.isFinite(n) && Math.abs(n % 1) > 1e-9
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: currency || 'UGX',
    minimumFractionDigits: hasFraction ? 1 : 0,
    maximumFractionDigits: 2,
  }).format(n)
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatDateOnly = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

/** Calendar date in Uganda (EAT) for period filters — matches backend date bounds. */
function todayInEastAfrica(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala' }).format(new Date())
}

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
      transactionVolume?: number
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
          transactionVolume?: number
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
  bucketKey?: string
  partnerId?: string
  externalPartnerId?: string
  revenueSegment?: string
  partnerLabel: string
  suggestedAmount?: number
  payoutMethod?: PlatformRevenuePayoutMethod
}

function buildSettleTargetFromRow(row: PlatformRevenuePartnerSummaryRow): SettleTarget {
  const isGateway = row.partnerKind === 'gateway' && row.partnerId
  const isExternal = row.partnerKind === 'external' && row.externalPartnerId
  return {
    bucketKey: row.bucketKey,
    partnerId: isGateway ? (row.partnerId ?? undefined) : undefined,
    externalPartnerId: isExternal ? (row.externalPartnerId ?? undefined) : undefined,
    revenueSegment:
      row.partnerKind === 'rukapay' ? (row.revenueSegment ?? undefined) : undefined,
    partnerLabel: row.partnerLabel,
    suggestedAmount: row.unsettledAmount,
    payoutMethod: isGateway || isExternal ? 'PARTNER_OFFSET' : 'BANK',
  }
}

function defaultPayoutForRows(
  rows: PlatformRevenuePartnerSummaryRow[],
): PlatformRevenuePayoutMethod {
  if (rows.length === 0) return 'BANK'
  return rows.every((r) => r.partnerKind === 'gateway' || r.partnerKind === 'external')
    ? 'PARTNER_OFFSET'
    : 'BANK'
}

function buildSettlementAllocations(
  rows: PlatformRevenuePartnerSummaryRow[],
  totalAmount: number,
): PlatformRevenueSettlementAllocation[] {
  if (rows.length === 0) return []
  const totalUnsettled = rows.reduce((sum, row) => sum + row.unsettledAmount, 0)
  if (totalUnsettled <= 0) return []

  const toAllocation = (row: PlatformRevenuePartnerSummaryRow, amount: number) => {
    const target = buildSettleTargetFromRow(row)
    return {
      bucketKey: row.bucketKey,
      amount: Number(amount.toFixed(2)),
      partnerId: target.partnerId,
      externalPartnerId: target.externalPartnerId,
      revenueSegment: target.revenueSegment,
      partnerLabel: row.partnerLabel,
    }
  }

  if (rows.length === 1) {
    return [toAllocation(rows[0], totalAmount)]
  }

  if (Math.abs(totalAmount - totalUnsettled) < 0.02) {
    return rows.map((row) => toAllocation(row, row.unsettledAmount))
  }

  const amounts: number[] = []
  let allocated = 0
  for (let i = 0; i < rows.length; i++) {
    if (i === rows.length - 1) {
      amounts.push(Number((totalAmount - allocated).toFixed(2)))
    } else {
      const share = Number(((totalAmount * rows[i].unsettledAmount) / totalUnsettled).toFixed(2))
      amounts.push(share)
      allocated += share
    }
  }

  return rows.map((row, index) => toAllocation(row, amounts[index]))
}

interface PlatformRevenuePanelProps {
  walletDescription?: string
}

export function PlatformRevenuePanel({ walletDescription }: PlatformRevenuePanelProps) {
  const { handleError } = useErrorHandler()
  const [showLiquidate, setShowLiquidate] = useState(false)
  const [selectedSettleKeys, setSelectedSettleKeys] = useState<string[]>([])

  const [statementPage, setStatementPage] = useState(1)
  const [statementPartnerKey, setStatementPartnerKey] = useState<string>('all')
  const [statementTxnType, setStatementTxnType] = useState<'all' | 'WALLET_TO_WALLET'>('all')
  const [statementReference, setStatementReference] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [sourceSort, setSourceSort] = useState<PlatformRevenueSummarySort>('lastActivity')
  const [statementSortOrder, setStatementSortOrder] = useState<'asc' | 'desc'>('desc')

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
    revenueSegment: '',
    bucketKey: '',
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
  const availableToLiquidate =
    balanceRes?.data?.availableToLiquidate ??
    balanceRes?.data?.unsettledFromEntries ??
    balanceRes?.data?.balance ??
    0
  const walletCashBalance = balanceRes?.data?.walletCashBalance
  const legacyOrphanBalance = balanceRes?.data?.legacyOrphanBalance ?? 0

  const {
    data: summaryRes,
    refetch: refetchSummary,
    isLoading: summaryLoading,
    isError: summaryError,
  } = usePlatformRevenuePartnerSummary({
    currency,
    startDate: periodStart || undefined,
    endDate: periodEnd || undefined,
    sortBy: sourceSort,
  })
  const partnerRows = useMemo(() => extractPartnerSummaryItems(summaryRes), [summaryRes])
  const partnerMeta = useMemo(() => extractPartnerSummaryMeta(summaryRes), [summaryRes])
  const partnerTotals = partnerMeta.totals
  const selectableSettleRows = useMemo(
    () => partnerRows.filter((r) => r.unsettledAmount > 0),
    [partnerRows],
  )
  const selectedSettleRows = useMemo(
    () => partnerRows.filter((r) => selectedSettleKeys.includes(r.bucketKey)),
    [partnerRows, selectedSettleKeys],
  )
  const selectedUnsettledTotal = useMemo(
    () => selectedSettleRows.reduce((sum, row) => sum + row.unsettledAmount, 0),
    [selectedSettleRows],
  )
  const allSelectableSelected =
    selectableSettleRows.length > 0 &&
    selectableSettleRows.every((row) => selectedSettleKeys.includes(row.bucketKey))
  const periodFiltered = Boolean(periodStart || periodEnd)
  const displayAvailableToLiquidate =
    periodFiltered && partnerTotals ? partnerTotals.unsettledAmount : availableToLiquidate
  const selectedPartnerFilter = useMemo(() => {
    if (statementPartnerKey === 'all') return null
    return partnerRows.find((row) => row.bucketKey === statementPartnerKey) ?? null
  }, [statementPartnerKey, partnerRows])

  const entriesParams = useMemo(
    () => ({
      page: statementPage,
      limit: 15,
      currency,
      bucketKey:
        statementTxnType === 'WALLET_TO_WALLET'
          ? undefined
          : selectedPartnerFilter?.bucketKey ??
            (statementPartnerKey !== 'all' ? statementPartnerKey : undefined),
      transactionType:
        statementTxnType === 'WALLET_TO_WALLET' ? 'WALLET_TO_WALLET' : undefined,
      reference: statementReference.trim() || undefined,
      startDate: periodStart || undefined,
      endDate: periodEnd || undefined,
      sortOrder: statementSortOrder,
    }),
    [
      statementPage,
      currency,
      selectedPartnerFilter,
      statementPartnerKey,
      statementTxnType,
      statementReference,
      periodStart,
      periodEnd,
      statementSortOrder,
    ],
  )

  const { data: entriesRes, isLoading: entriesLoading, refetch: refetchEntries } =
    usePlatformRevenueEntries(entriesParams)
  const entries = entriesRes?.data?.items ?? []
  const pagination = entriesRes?.data?.pagination

  const liquidateMutation = useLiquidatePlatformRevenue()
  const syncAccrualsMutation = useSyncPlatformRevenueAccruals()
  const selectedBank = UGANDA_BANKS.find((b) => b.code === liquidateForm.bankCode)

  // Keep statement in sync when returning from Transaction Management after new fees post.
  useEffect(() => {
    const refresh = () => {
      refetchBalance()
      refetchSummary()
      refetchEntries()
    }
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refetchBalance, refetchSummary, refetchEntries])

  const partnerFilterOptions = useMemo(() => {
    return partnerRows.map((r) => ({
      key: r.bucketKey,
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

  const toggleSettleKey = (bucketKey: string, checked: boolean) => {
    setSelectedSettleKeys((prev) => {
      if (checked) {
        return prev.includes(bucketKey) ? prev : [...prev, bucketKey]
      }
      return prev.filter((key) => key !== bucketKey)
    })
  }

  const toggleSelectAllSettle = (checked: boolean) => {
    if (checked) {
      setSelectedSettleKeys(selectableSettleRows.map((row) => row.bucketKey))
    } else {
      setSelectedSettleKeys([])
    }
  }

  const openSettle = (preselectKeys?: string[]) => {
    const keys = preselectKeys?.length ? preselectKeys : selectedSettleKeys
    const rows = partnerRows.filter(
      (row) => keys.includes(row.bucketKey) && row.unsettledAmount > 0,
    )
    if (rows.length === 0) {
      toast.error('Select one or more sources with unsettled balance using the checkboxes')
      return
    }

    const total = Number(rows.reduce((sum, row) => sum + row.unsettledAmount, 0).toFixed(2))
    setSelectedSettleKeys(rows.map((row) => row.bucketKey))
    setLiquidateForm({
      payoutMethod: defaultPayoutForRows(rows),
      amount: String(total),
      bankCode: '',
      bankAccountNumber: '',
      bankAccountName: '',
      phoneNumber: '',
      mnoProvider: 'MTN',
      recipientName: '',
      narration: '',
      partnerId: '',
      externalPartnerId: '',
      revenueSegment: '',
      bucketKey: '',
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
      revenueSegment: '',
      bucketKey: '',
    })
    setValidationMessage('')
    setValidationError('')
    setDestinationValidated(false)
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
    const rowsForSettle = partnerRows.filter(
      (row) => selectedSettleKeys.includes(row.bucketKey) && row.unsettledAmount > 0,
    )
    if (rowsForSettle.length === 0) {
      toast.error('Select at least one revenue source')
      return
    }

    const maxForTarget = selectedUnsettledTotal
    if (maxForTarget <= 0) {
      toast.error('Selected sources have no unsettled revenue')
      return
    }
    if (amount > maxForTarget + 0.01) {
      toast.error('Amount exceeds unsettled revenue for selected sources')
      return
    }

    const settlementAllocations = buildSettlementAllocations(rowsForSettle, amount)
    if (walletCashBalance != null && amount > walletCashBalance) {
      toast.error('Amount exceeds cash in the consolidated revenue wallet')
      return
    }

    const method = liquidateForm.payoutMethod
    const isOffset = method === 'PARTNER_OFFSET'
    const isMno = method === 'MNO'
    const isBank = method === 'BANK'

    if (isOffset) {
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
        settlementAllocations,
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
      setSelectedSettleKeys([])
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


  return (
    <>
      <Card className="mb-6 border-indigo-200 bg-indigo-50/40">
        <CardHeader>
          <CardTitle className="text-indigo-900">Platform revenue (consolidated)</CardTitle>
          <CardDescription>
            Totals are from platform revenue entries (per-transaction fee accruals). Legacy fee
            wallet sweeps are excluded from accrued and unsettled figures below.
            {walletDescription ? ` Wallet: ${walletDescription}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600">Available to liquidate (from entries)</p>
            <p className="text-3xl font-bold text-indigo-700">
              {formatCurrency(displayAvailableToLiquidate, currency)}
            </p>
            {periodFiltered && (
              <p className="text-xs text-indigo-600/80 mt-0.5">Filtered by selected period</p>
            )}
            {walletCashBalance != null && (
              <p className="text-xs text-gray-500 mt-1">
                Wallet cash (max you can send out): {formatCurrency(walletCashBalance, currency)}
                {legacyOrphanBalance > 1000
                  ? ` · ${formatCurrency(legacyOrphanBalance, currency)} is legacy cash not tied to entries`
                  : ''}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              disabled={syncAccrualsMutation.isPending}
              onClick={async () => {
                try {
                  const res = await syncAccrualsMutation.mutateAsync({
                    currency,
                    days: 365,
                    transactionType: 'WALLET_TO_WALLET',
                  })
                  const credited = res?.data?.credited ?? 0
                  const attempted = res?.data?.attempted ?? 0
                  toast.success(
                    credited > 0
                      ? `Synced ${credited} P2P fee accrual(s) (${attempted} debit legs checked)`
                      : `No missing P2P accruals in the last 365 days (${attempted} checked)`,
                  )
                  setStatementPage(1)
                  refetchBalance()
                  refetchSummary()
                  refetchEntries()
                } catch (e) {
                  handleError(e, 'Failed to sync missing fee accruals')
                }
              }}
            >
              {syncAccrualsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Sync P2P & internal fees
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStatementPage(1)
                refetchEntries()
                refetchSummary()
              }}
            >
              Refresh statement
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={selectedSettleKeys.length === 0}
              onClick={() => openSettle()}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Settle revenue
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue by source</CardTitle>
          <CardDescription>
            Select sources with the checkboxes, then settle in one payout. Each selected source is
            updated in this table.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedSettleKeys.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50/80 px-4 py-3">
              <p className="text-sm text-indigo-900">
                <strong>{selectedSettleKeys.length}</strong> source
                {selectedSettleKeys.length === 1 ? '' : 's'} selected ·{' '}
                <strong>{formatCurrency(selectedUnsettledTotal, currency)}</strong> unsettled
              </p>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => openSettle()}>
                Settle selected
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedSettleKeys([])}>
                Clear selection
              </Button>
            </div>
          )}
          <div className="flex flex-col lg:flex-row flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500">From</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => {
                  setPeriodStart(e.target.value)
                  setStatementPage(1)
                }}
                className="w-full sm:w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500">To</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => {
                  setPeriodEnd(e.target.value)
                  setStatementPage(1)
                }}
                className="w-full sm:w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-gray-500">Sort by</Label>
              <Select
                value={sourceSort}
                onValueChange={(v) => setSourceSort(v as PlatformRevenueSummarySort)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastActivity">Last activity (newest)</SelectItem>
                  <SelectItem value="unsettled">Unsettled (high to low)</SelectItem>
                  <SelectItem value="tpv">TPV (high to low)</SelectItem>
                  <SelectItem value="accrued">Fees accrued (high to low)</SelectItem>
                  <SelectItem value="source">Source name (A–Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="self-end"
              onClick={() => {
                const today = todayInEastAfrica()
                setPeriodStart(today)
                setPeriodEnd(today)
                setStatementPage(1)
              }}
            >
              Today
            </Button>
            {(periodStart || periodEnd) && (
              <Button
                variant="ghost"
                size="sm"
                className="self-end"
                onClick={() => {
                  setPeriodStart('')
                  setPeriodEnd('')
                  setStatementPage(1)
                }}
              >
                Clear dates
              </Button>
            )}
          </div>

          {summaryLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : summaryError ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-red-600">
                Could not load revenue by source. The summary API may not be deployed yet.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetchSummary()}>
                Retry
              </Button>
            </div>
          ) : partnerRows.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No fee accruals yet.</p>
          ) : (
            <Table className="table-fixed min-w-[960px] [&_th]:!align-top [&_td]:!align-top [&_th]:!py-2.5 [&_td]:!py-2.5 [&_th]:leading-snug [&_td]:leading-snug">
              <colgroup>
                <col className="w-[40px]" />
                <col className="w-[26%]" />
                <col className="w-[13%]" />
                <col className="w-[6%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
                <col className="w-[8%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-2 align-top text-center w-10">
                    <Checkbox
                      checked={allSelectableSelected}
                      onCheckedChange={(checked) => toggleSelectAllSettle(checked === true)}
                      disabled={selectableSettleRows.length === 0}
                      aria-label="Select all sources with unsettled balance"
                    />
                  </TableHead>
                  <TableHead className="px-3 align-top text-left font-semibold">Source</TableHead>
                  <TableHead className="px-3 align-top text-left font-semibold tabular-nums">TPV</TableHead>
                  <TableHead className="px-3 align-top text-left font-semibold tabular-nums">Txns</TableHead>
                  <TableHead className="px-3 align-top text-left font-semibold tabular-nums">
                    Fees accrued
                  </TableHead>
                  <TableHead className="px-3 align-top text-left font-semibold tabular-nums">Settled</TableHead>
                  <TableHead className="px-3 align-top text-left font-semibold tabular-nums">
                    Unsettled
                  </TableHead>
                  <TableHead className="px-3 align-top text-left font-semibold whitespace-nowrap">
                    Last activity
                  </TableHead>
                  <TableHead className="px-2 align-top text-center font-semibold w-12">
                    <span className="sr-only">Settle</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partnerRows.map((row) => {
                  const isSelected = selectedSettleKeys.includes(row.bucketKey)
                  const canSelect = row.unsettledAmount > 0
                  return (
                  <TableRow
                    key={row.bucketKey}
                    className={`cursor-pointer hover:bg-gray-50/80 ${isSelected ? 'bg-indigo-50/60' : ''}`}
                    onClick={() => {
                      setStatementPartnerKey(row.bucketKey)
                      setStatementPage(1)
                    }}
                  >
                    <TableCell
                      className="px-2 align-top text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={!canSelect}
                        onCheckedChange={(checked) =>
                          toggleSettleKey(row.bucketKey, checked === true)
                        }
                        aria-label={`Select ${row.partnerLabel} for settlement`}
                      />
                    </TableCell>
                    <TableCell
                      className="px-3 align-top font-medium truncate"
                      title={row.partnerLabel}
                    >
                      {row.partnerLabel}
                    </TableCell>
                    <TableCell className="px-3 align-top text-left tabular-nums">
                      {formatCurrency(row.transactionVolume ?? 0, currency)}
                    </TableCell>
                    <TableCell className="px-3 align-top text-left tabular-nums text-gray-600">
                      {row.entryCount}
                    </TableCell>
                    <TableCell className="px-3 align-top text-left tabular-nums">
                      {formatCurrency(row.accruedAmount, currency)}
                    </TableCell>
                    <TableCell className="px-3 align-top text-left tabular-nums">
                      {formatCurrency(row.liquidatedAmount, currency)}
                    </TableCell>
                    <TableCell className="px-3 align-top text-left tabular-nums font-medium text-indigo-700">
                      {formatCurrency(row.unsettledAmount, currency)}
                    </TableCell>
                    <TableCell className="px-3 align-top text-left text-gray-600 whitespace-nowrap">
                      {row.lastCreditedAt ? formatDateOnly(row.lastCreditedAt) : '—'}
                    </TableCell>
                    <TableCell className="px-2 align-top text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                        title={
                          row.unsettledAmount > 0
                            ? `Settle ${row.partnerLabel}`
                            : 'Nothing unsettled for this source'
                        }
                        disabled={row.unsettledAmount <= 0}
                        onClick={(e) => {
                          e.stopPropagation()
                          openSettle([row.bucketKey])
                        }}
                      >
                        <CreditCard className="h-4 w-4" aria-hidden />
                        <span className="sr-only">Settle {row.partnerLabel}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )})}
                {partnerTotals && (
                  <TableRow className="bg-gray-50 font-medium border-t hover:bg-gray-50">
                    <TableCell className="px-2 align-top" />
                    <TableCell className="px-3 align-top">
                      Total{periodFiltered ? ' (period)' : ''}
                    </TableCell>
                    <TableCell className="px-3 align-top text-left tabular-nums">
                      {formatCurrency(partnerTotals.transactionVolume ?? 0, currency)}
                    </TableCell>
                    <TableCell className="px-3 align-top text-left tabular-nums text-gray-600">
                      {partnerTotals.entryCount}
                    </TableCell>
                    <TableCell className="px-3 align-top text-left tabular-nums">
                      {formatCurrency(partnerTotals.accruedAmount, currency)}
                    </TableCell>
                    <TableCell className="px-3 align-top text-left tabular-nums">
                      {formatCurrency(partnerTotals.liquidatedAmount, currency)}
                    </TableCell>
                    <TableCell className="px-3 align-top text-left tabular-nums text-indigo-700">
                      {formatCurrency(partnerTotals.unsettledAmount, currency)}
                    </TableCell>
                    <TableCell className="px-3 align-top" />
                    <TableCell className="px-2 align-top text-center" />
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
            Per-transaction fee accruals after transactions succeed. P2P and internal wallet flows
            appear under <strong>Rukapay (P2P &amp; internal)</strong>; partnerless mobile-money and
            bank fees have their own source rows (e.g. <strong>Mobile money (wallet to MNO)</strong>).
            If P2P fees are missing, click <strong>Sync P2P &amp; internal fees</strong>. Uses the same date range as the table
            above when set.
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
              disabled={statementTxnType === 'WALLET_TO_WALLET'}
            >
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="Partner filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {partnerFilterOptions.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statementTxnType}
              onValueChange={(v) => {
                setStatementTxnType(v as 'all' | 'WALLET_TO_WALLET')
                setStatementPage(1)
                if (v === 'WALLET_TO_WALLET') setStatementPartnerKey('all')
              }}
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Txn type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All txn types</SelectItem>
                <SelectItem value="WALLET_TO_WALLET">P2P only</SelectItem>
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
            <Select
              value={statementSortOrder}
              onValueChange={(v) => {
                setStatementSortOrder(v as 'asc' | 'desc')
                setStatementPage(1)
              }}
            >
              <SelectTrigger className="sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Date (newest first)</SelectItem>
                <SelectItem value="asc">Date (oldest first)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {entriesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-sm text-gray-500 py-6 text-center space-y-2">
              <p>No revenue entries found.</p>
              {periodFiltered ? (
                <p className="text-xs">
                  Try <strong>Clear dates</strong> or search by transaction reference. Fees only
                  appear here after successful transactions with a RukaPay fee.
                </p>
              ) : statementTxnType === 'WALLET_TO_WALLET' ? (
                <p className="text-xs">
                  P2P fees appear on the <strong>debit</strong> leg after successful transfers.
                  Click <strong>Sync P2P &amp; internal fees</strong> to backfill missing accruals
                  (last 365 days), then refresh.
                </p>
              ) : (
                <p className="text-xs">
                  Use <strong>Today</strong> above to filter this period, or search by reference
                  (e.g. TXN_1779181274973). For P2P, use the type filter and sync button above.
                </p>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
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
        <DialogContent className="flex h-[min(94vh,900px)] max-h-[94vh] w-[min(98vw,76rem)] !max-w-[min(98vw,76rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:!max-w-[min(98vw,76rem)]">
          <div className="shrink-0 border-b px-6 py-5 pr-12">
            <DialogHeader>
              <DialogTitle className="text-xl">Settle platform revenue</DialogTitle>
              <DialogDescription className="text-base">
                One payout for all checked sources. Each row in Revenue by source is updated by its
                share of this settlement.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid min-h-[min(520px,58vh)] grid-cols-1 gap-8 md:grid-cols-2 md:gap-10">
            <div className="space-y-4">
              <div>
                <Label>Selected sources ({selectedSettleRows.length})</Label>
                <div className="mt-2 min-h-[280px] max-h-[min(42vh,360px)] overflow-y-auto rounded-lg border bg-gray-50/50">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[58%]">Source</TableHead>
                        <TableHead className="text-right">Unsettled</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSettleRows.map((row) => (
                        <TableRow key={row.bucketKey}>
                          <TableCell className="py-2.5 text-sm font-medium">{row.partnerLabel}</TableCell>
                          <TableCell className="py-2.5 text-right text-sm tabular-nums">
                            {formatCurrency(row.unsettledAmount, currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                <Label className="text-sm text-indigo-900">Total unsettled (selected)</Label>
                <p className="text-3xl font-bold text-indigo-700">
                  {formatCurrency(selectedUnsettledTotal, currency)}
                </p>
                {walletCashBalance != null && (
                  <p className="mt-1 text-sm text-indigo-800/80">
                    Wallet cash cap: {formatCurrency(walletCashBalance, currency)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
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
                No bank or mobile money transfer. Wallet is debited once; each checked source is
                credited in Revenue by source.
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
            </div>
          </div>
          </div>

          <div className="flex shrink-0 gap-3 border-t bg-gray-50/80 px-6 py-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowLiquidate(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleLiquidate}
                disabled={
                  liquidateMutation.isPending ||
                  selectedSettleRows.length === 0 ||
                  selectedUnsettledTotal <= 0 ||
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
