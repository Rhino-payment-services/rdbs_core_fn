'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Search, User } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import { useAuth } from '@/lib/hooks/useAuth'
import { useUserSearch, type UserSearchResult } from '@/lib/hooks/useUserSearch'
import { useCalculateFee } from '@/lib/hooks/useTariffs'
import { getTypeDisplay } from '@/lib/utils/transactions'
import { useUgandaBanks } from '@/lib/hooks/useUgandaBanks'
import { BankSortCodeSelect } from '@/components/dashboard/finance/BankSortCodeSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type LedgerKind = 'CUSTOMER' | 'PLATFORM_REVENUE' | 'PLATFORM_REVENUE_LIQUIDATION'

export type LedgerWalletOption = {
  id: string
  label: string
  balance?: number
}

const CREDIT_TYPES = new Set([
  'DEPOSIT',
  'MNO_TO_WALLET',
  'BANK_TO_WALLET',
  'CARD_TO_WALLET',
  'PARTNER_INSTITUTION_TO_WALLET',
  'LOAN_DISBURSEMENT',
])

const CUSTOMER_TYPE_GROUPS: Array<{ label: string; types: string[] }> = [
  {
    label: 'Mobile money',
    types: ['WALLET_TO_MNO', 'MNO_TO_WALLET'],
  },
  {
    label: 'Bank',
    types: ['WALLET_TO_BANK', 'BANK_TO_WALLET'],
  },
  {
    label: 'Wallet',
    types: ['WALLET_TO_WALLET', 'WALLET_TO_OWN_WALLET', 'DEPOSIT', 'WITHDRAWAL'],
  },
  {
    label: 'Merchant',
    types: [
      'WALLET_TO_MERCHANT',
      'MERCHANT_TO_WALLET',
      'MERCHANT_WITHDRAWAL',
      'WALLET_TO_INTERNAL_MERCHANT',
      'WALLET_TO_EXTERNAL_MERCHANT',
    ],
  },
  {
    label: 'Bills',
    types: ['BILL_PAYMENT', 'SCHOOL_FEES', 'WALLET_TO_UTILITY'],
  },
  {
    label: 'Other',
    types: [
      'CARD_TO_WALLET',
      'WALLET_TO_PARTNER_INSTITUTION',
      'PARTNER_INSTITUTION_TO_WALLET',
      'LOAN_DISBURSEMENT',
      'LOAN_REPAYMENT',
      'FEE_CHARGE',
      'REVERSAL',
      'CUSTOM',
      'LIQUIDATION',
      'MERCHANT_SELF_LIQUIDATION',
    ],
  },
]

const PLATFORM_TYPE_GROUPS: Array<{ label: string; types: string[] }> = [
  {
    label: 'Revenue',
    types: ['FEE_CHARGE', 'DEPOSIT', 'WITHDRAWAL', 'CUSTOM'],
  },
  {
    label: 'Looks like a normal payment',
    types: ['WALLET_TO_MNO', 'MNO_TO_WALLET', 'WALLET_TO_BANK', 'BANK_TO_WALLET'],
  },
]

function toLocalDateTimeInput(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function inferredDirection(type: string, customDirection: 'CREDIT' | 'DEBIT'): 'CREDIT' | 'DEBIT' {
  if (type === 'CUSTOM') return customDirection
  return CREDIT_TYPES.has(type) ? 'CREDIT' : 'DEBIT'
}

function needsMnoFields(type: string, kind: LedgerKind, payoutRail: 'MNO' | 'BANK'): boolean {
  if (kind === 'PLATFORM_REVENUE_LIQUIDATION') return payoutRail === 'MNO'
  return type === 'WALLET_TO_MNO' || type === 'MNO_TO_WALLET'
}

function needsBankFields(type: string, kind: LedgerKind, payoutRail: 'MNO' | 'BANK'): boolean {
  if (kind === 'PLATFORM_REVENUE_LIQUIDATION') return payoutRail === 'BANK'
  return type === 'WALLET_TO_BANK' || type === 'BANK_TO_WALLET'
}

function needsMerchantFields(type: string): boolean {
  return type.includes('MERCHANT')
}

function tariffTypeForForm(
  kind: LedgerKind,
  transactionType: string,
  payoutRail: 'MNO' | 'BANK',
): string | null {
  if (kind === 'PLATFORM_REVENUE_LIQUIDATION') {
    return payoutRail === 'MNO' ? 'WALLET_TO_MNO' : 'WALLET_TO_BANK'
  }
  const feeTypes = new Set([
    'WALLET_TO_MNO',
    'WALLET_TO_BANK',
    'WALLET_TO_MERCHANT',
    'WALLET_TO_INTERNAL_MERCHANT',
    'WALLET_TO_EXTERNAL_MERCHANT',
    'BILL_PAYMENT',
    'WALLET_TO_UTILITY',
    'WALLET_TO_PARTNER_INSTITUTION',
    'MNO_TO_WALLET',
    'BANK_TO_WALLET',
    'MERCHANT_WITHDRAWAL',
    'MERCHANT_SELF_LIQUIDATION',
  ])
  return feeTypes.has(transactionType) ? transactionType : null
}

function asUserList(data: unknown): any[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const wrapped = data as Record<string, unknown>
    if (Array.isArray(wrapped.data)) return wrapped.data
    if (Array.isArray(wrapped.users)) return wrapped.users
  }
  return []
}

function isSystemUser(u: any): boolean {
  const type = String(u?.userType || '').toUpperCase()
  const role = String(u?.role || '').toUpperCase()
  return (
    type === 'STAFF' ||
    type === 'STAFF_USER' ||
    role === 'ADMIN' ||
    role === 'SUPER_ADMIN' ||
    role === 'MANAGER'
  )
}

function systemUserName(u: any): string {
  return (
    [u?.profile?.firstName, u?.profile?.lastName].filter(Boolean).join(' ') ||
    [u?.firstName, u?.lastName].filter(Boolean).join(' ') ||
    u?.email ||
    u?.phone ||
    u?.id
  )
}

function toCreatorResult(u: any): UserSearchResult {
  return {
    id: u.id,
    phone: u.phone || '',
    email: u.email,
    firstName: u.profile?.firstName || u.firstName,
    lastName: u.profile?.lastName || u.lastName,
    subscriberType: u.subscriberType || '',
    userType: u.userType || '',
    status: u.status || '',
    profile: u.profile,
  }
}

type FormState = {
  kind: LedgerKind
  transactionType: string
  direction: 'CREDIT' | 'DEBIT'
  amount: string
  description: string
  reference: string
  createdAt: string
  createdBy: 'me' | 'customer' | 'other'
  partyName: string
  payoutRail: 'MNO' | 'BANK'
  phoneNumber: string
  mnoProvider: string
  bankSortCode: string
  bankAccountNumber: string
  bankAccountName: string
  merchantCode: string
  fee: string
  feeLockedFromTariff: boolean
}

function emptyForm(mode: 'customer' | 'platform-revenue', customerPhone = ''): FormState {
  if (mode === 'platform-revenue') {
    return {
      kind: 'PLATFORM_REVENUE',
      transactionType: 'FEE_CHARGE',
      direction: 'CREDIT',
      amount: '',
      description: '',
      reference: '',
      createdAt: toLocalDateTimeInput(),
      createdBy: 'me',
      partyName: '',
      payoutRail: 'BANK',
      phoneNumber: '',
      mnoProvider: 'MTN',
      bankSortCode: '',
      bankAccountNumber: '',
      bankAccountName: '',
      merchantCode: '',
      fee: '',
      feeLockedFromTariff: true,
    }
  }
  return {
    kind: 'CUSTOMER',
    transactionType: 'WALLET_TO_MNO',
    direction: 'DEBIT',
    amount: '',
    description: '',
    reference: '',
    createdAt: toLocalDateTimeInput(),
    createdBy: 'me',
    partyName: '',
    payoutRail: 'MNO',
    phoneNumber: customerPhone,
    mnoProvider: 'MTN',
    bankSortCode: '',
    bankAccountNumber: '',
    bankAccountName: '',
    merchantCode: '',
    fee: '',
    feeLockedFromTariff: true,
  }
}

interface RecordLedgerEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'customer' | 'platform-revenue'
  currency?: string
  wallets?: LedgerWalletOption[]
  walletId?: string
  onWalletChange?: (walletId: string) => void
  customerId?: string
  customerName?: string
  customerPhone?: string
  onSuccess?: () => void
}

export function RecordLedgerEntryDialog({
  open,
  onOpenChange,
  mode,
  currency = 'UGX',
  wallets = [],
  walletId,
  onWalletChange,
  customerId,
  customerName = '',
  customerPhone = '',
  onSuccess,
}: RecordLedgerEntryDialogProps) {
  const { user } = useAuth()
  const { data: ugandaBanks = [] } = useUgandaBanks()
  const calculateFee = useCalculateFee()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState<FormState>(() => emptyForm(mode, customerPhone))
  const [creatorSearch, setCreatorSearch] = useState('')
  const [creatorSearchTriggered, setCreatorSearchTriggered] = useState(false)
  const [selectedCreator, setSelectedCreator] = useState<UserSearchResult | null>(null)
  const [systemUserFilter, setSystemUserFilter] = useState('')
  const [tariffLabel, setTariffLabel] = useState<string | null>(null)

  const creatorSearchIsEmail = creatorSearch.trim().includes('@')
  const { data: searchedCreator, isLoading: creatorSearchLoading, error: creatorSearchError } = useUserSearch({
    phone: creatorSearchTriggered && !creatorSearchIsEmail ? creatorSearch.trim() : undefined,
    email: creatorSearchTriggered && creatorSearchIsEmail ? creatorSearch.trim() : undefined,
    enabled: creatorSearchTriggered && form.createdBy === 'other',
  })

  useEffect(() => {
    if (searchedCreator?.id) setSelectedCreator(searchedCreator)
  }, [searchedCreator])

  useEffect(() => {
    if (open) {
      setForm(emptyForm(mode, customerPhone))
      setSelectedCreator(null)
      setCreatorSearch('')
      setCreatorSearchTriggered(false)
      setSystemUserFilter('')
      setTariffLabel(null)
    }
  }, [open, mode, customerPhone])

  useEffect(() => {
    if (!open) return
    const amount = parseFloat(form.amount)
    const tariffType = tariffTypeForForm(form.kind, form.transactionType, form.payoutRail)
    if (!tariffType || !Number.isFinite(amount) || amount <= 0) {
      if (form.feeLockedFromTariff) patch({ fee: '' })
      setTariffLabel(null)
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await calculateFee.mutateAsync({
          transactionType: tariffType,
          amount,
          currency,
          userType: 'END_USER',
          channel: 'BACKOFFICE',
        })
        const payload = (res as any)?.data || res
        const totalFee = Number(payload?.totalFee ?? payload?.feeAmount ?? 0)
        if (form.feeLockedFromTariff) {
          patch({ fee: Number.isFinite(totalFee) ? String(totalFee) : '0' })
        }
        setTariffLabel(
          payload?.tariffName
            ? `${payload.tariffName} · ${tariffType}`
            : `Tariff for ${tariffType}`,
        )
      } catch {
        if (form.feeLockedFromTariff) patch({ fee: '0' })
        setTariffLabel(`No tariff found for ${tariffType}`)
      }
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    form.amount,
    form.kind,
    form.transactionType,
    form.payoutRail,
    form.mnoProvider,
    form.feeLockedFromTariff,
    currency,
  ])

  const { data: usersData, isLoading: systemUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const result = await api.get('/users?include=profile')
      return result.data
    },
    enabled: open && form.createdBy === 'other',
    staleTime: 5 * 60 * 1000,
  })

  const systemUsers = useMemo(() => {
    const q = systemUserFilter.trim().toLowerCase()
    return asUserList(usersData)
      .filter(isSystemUser)
      .filter((u) => u.id !== user?.id)
      .filter((u) => {
        if (!q) return true
        const haystack = [
          systemUserName(u),
          u.email,
          u.phone,
          u.role,
          u.userType,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
      .sort((a, b) => systemUserName(a).localeCompare(systemUserName(b)))
  }, [systemUserFilter, user?.id, usersData])

  const typeGroups = mode === 'customer' ? CUSTOMER_TYPE_GROUPS : PLATFORM_TYPE_GROUPS
  const resolvedType =
    form.kind === 'PLATFORM_REVENUE_LIQUIDATION' ? 'LIQUIDATION' : form.transactionType
  const direction = inferredDirection(resolvedType, form.direction)
  const selectedWallet = wallets.find((w) => w.id === walletId)
  const balanceNum = Number(selectedWallet?.balance ?? 0) || 0
  const parsedAmount = parseFloat(form.amount)
  const parsedFee = parseFloat(form.fee)
  const safeFee = !Number.isNaN(parsedFee) && parsedFee > 0 ? parsedFee : 0
  const typeLabel = getTypeDisplay(resolvedType, direction)
  const showMno = needsMnoFields(resolvedType, form.kind, form.payoutRail)
  const showBank = needsBankFields(resolvedType, form.kind, form.payoutRail)
  const selectedBank = ugandaBanks.find((b) => b.bankSortCode === form.bankSortCode)
  const partyField = useMemo(() => {
    if (showBank) return null
    if (showMno) {
      return direction === 'DEBIT'
        ? { label: 'Receiver name', hint: 'Name of the person who received the mobile money' }
        : { label: 'Sender name', hint: 'Name of the person who sent the mobile money' }
    }
    if (needsMerchantFields(resolvedType)) {
      return { label: 'Merchant name', hint: 'Business name shown on the transaction' }
    }
    if (resolvedType === 'WALLET_TO_WALLET' || resolvedType === 'WALLET_TO_OWN_WALLET') {
      return { label: 'Other party name', hint: 'The other wallet holder on this transfer' }
    }
    return null
  }, [direction, resolvedType, showBank, showMno])

  const helper = useMemo(() => {
    if (form.kind === 'PLATFORM_REVENUE_LIQUIDATION') {
      return 'Records a platform revenue payout in the ledger only. No money is sent to a bank or mobile money.'
    }
    if (direction === 'CREDIT') {
      return `Records as a credit — same as a live ${typeLabel} (${resolvedType}).`
    }
    return `Records as a debit — same as a live ${typeLabel} (${resolvedType}).`
  }, [direction, form.kind, resolvedType, typeLabel])

  const patch = (next: Partial<FormState>) => setForm((prev) => ({ ...prev, ...next }))

  const handleSubmit = async () => {
    if (!form.amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid positive amount')
      return
    }
    if (!form.description.trim()) {
      toast.error('Please enter a description')
      return
    }
    if (mode === 'customer' && !walletId) {
      toast.error('Select a wallet')
      return
    }
    if (resolvedType === 'CUSTOM' && !form.direction) {
      toast.error('Select credit or debit for a custom transaction')
      return
    }

    let createdByUserId = user?.id
    if (form.createdBy === 'customer') {
      createdByUserId = customerId
    } else if (form.createdBy === 'other') {
      createdByUserId = selectedCreator?.id
      if (!createdByUserId) {
        toast.error('Search and select the user who created this transaction')
        return
      }
    }
    if (!createdByUserId) {
      toast.error('Could not determine who created this transaction')
      return
    }

    const phone = form.phoneNumber.trim()
    const partyName = form.partyName.trim() || form.bankAccountName.trim()
    const bankName = selectedBank?.bankName || ''
    const metadata: Record<string, unknown> = {}
    if (phone) {
      if (direction === 'DEBIT') metadata.recipientPhone = phone
      else metadata.senderPhone = phone
    }
    if (partyName) {
      if (direction === 'DEBIT') metadata.recipientName = partyName
      else metadata.senderName = partyName
    }
    if (showMno && form.mnoProvider) metadata.network = form.mnoProvider
    if (showBank && bankName) metadata.bankName = bankName
    if (showBank && form.bankSortCode) metadata.bankSortCode = form.bankSortCode

    setIsLoading(true)
    try {
      const res = await api.post('/admin/manual-transactions', {
        kind: form.kind,
        transactionType:
          form.kind === 'PLATFORM_REVENUE_LIQUIDATION' ? undefined : resolvedType,
        walletId: mode === 'customer' ? walletId : undefined,
        amount: parsedAmount,
        currency,
        createdAt: form.createdAt
          ? new Date(form.createdAt).toISOString()
          : new Date().toISOString(),
        description: form.description.trim(),
        reference: form.reference.trim() || undefined,
        createdByUserId,
        direction: resolvedType === 'CUSTOM' ? form.direction : undefined,
        phoneNumber: phone || undefined,
        mnoProvider: showMno ? form.mnoProvider : undefined,
        bankName: showBank ? bankName || undefined : undefined,
        bankSortCode: showBank ? form.bankSortCode || undefined : undefined,
        bankAccountNumber: showBank ? form.bankAccountNumber.trim() || undefined : undefined,
        bankAccountName: showBank ? form.bankAccountName.trim() || undefined : undefined,
        merchantCode: form.merchantCode.trim() || undefined,
        fee: form.fee.trim() === '' ? undefined : safeFee,
        rukapayFee: form.fee.trim() === '' ? undefined : safeFee,
        accruePlatformRevenue: false,
        metadata: Object.keys(metadata).length ? metadata : undefined,
      })

      toast.success(
        `${typeLabel} of ${parsedAmount.toLocaleString()} ${currency}${
          safeFee > 0 ? ` (fee ${safeFee.toLocaleString()} ${currency})` : ''
        } recorded on the ledger. Wallet cash unchanged.`,
      )
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      const raw = error?.response?.data?.message
      const message = Array.isArray(raw)
        ? raw.join(', ')
        : raw || error?.message || 'Failed to record ledger entry'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'platform-revenue' ? 'Record platform revenue ledger' : 'Record ledger entry'}
          </DialogTitle>
          <DialogDescription>
            Ledger only. Creates a transaction record for history. Wallet cash is not changed, and no money is sent to MTN, Airtel, or banks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'platform-revenue' && (
            <div>
              <Label>Entry kind *</Label>
              <Select
                value={form.kind}
                onValueChange={(value: LedgerKind) =>
                  patch({
                    kind: value,
                    transactionType:
                      value === 'PLATFORM_REVENUE_LIQUIDATION' ? 'LIQUIDATION' : 'FEE_CHARGE',
                    payoutRail: value === 'PLATFORM_REVENUE_LIQUIDATION' ? 'BANK' : form.payoutRail,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLATFORM_REVENUE">Platform revenue</SelectItem>
                  <SelectItem value="PLATFORM_REVENUE_LIQUIDATION">
                    Revenue liquidation (record payout)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === 'customer' && wallets.length > 1 && (
            <div>
              <Label>Wallet *</Label>
              <Select value={walletId} onValueChange={(value) => onWalletChange?.(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.label}
                      {w.balance != null ? ` — ${Number(w.balance).toLocaleString()} ${currency}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === 'customer' && (
            <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-2 text-sm">
              <span className="text-gray-500">Current balance</span>
              <span className="font-semibold text-gray-800">
                {balanceNum.toLocaleString()} {currency}
              </span>
            </div>
          )}

          {form.kind !== 'PLATFORM_REVENUE_LIQUIDATION' && (
            <div>
              <Label>Transaction type *</Label>
              <Select
                value={form.transactionType}
                onValueChange={(value) =>
                  patch({
                    transactionType: value,
                    payoutRail:
                      value === 'WALLET_TO_BANK' || value === 'BANK_TO_WALLET'
                        ? 'BANK'
                        : value === 'WALLET_TO_MNO' || value === 'MNO_TO_WALLET'
                          ? 'MNO'
                          : form.payoutRail,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeGroups.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getTypeDisplay(type)} · {type}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">{helper}</p>
            </div>
          )}

          {form.kind === 'PLATFORM_REVENUE_LIQUIDATION' && (
            <div>
              <p className="mb-2 text-xs text-gray-500">{helper}</p>
              <Label>Paid out via *</Label>
              <Select
                value={form.payoutRail}
                onValueChange={(value: 'MNO' | 'BANK') => patch({ payoutRail: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK">Bank</SelectItem>
                  <SelectItem value="MNO">Mobile money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {resolvedType === 'CUSTOM' && (
            <div>
              <Label>Direction *</Label>
              <Select
                value={form.direction}
                onValueChange={(value: 'CREDIT' | 'DEBIT') => patch({ direction: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit</SelectItem>
                  <SelectItem value="DEBIT">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Amount ({currency}) *</Label>
            <Input
              type="number"
              min={1}
              placeholder="Enter amount"
              value={form.amount}
              onChange={(e) => patch({ amount: e.target.value })}
            />
            {mode === 'customer' && !Number.isNaN(parsedAmount) && parsedAmount > 0 && (
              <div className="mt-1 space-y-1 rounded border border-dashed px-3 py-1.5 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Balance snapshot after this record</span>
                  <span className={`font-semibold ${direction === 'CREDIT' ? 'text-green-700' : 'text-red-600'}`}>
                    {(
                      direction === 'CREDIT'
                        ? balanceNum + parsedAmount
                        : balanceNum - parsedAmount - safeFee
                    ).toLocaleString()}{' '}
                    {currency}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Snapshot only — wallet cash is not changed by Record Ledger.
                </p>
              </div>
            )}
          </div>

          {tariffTypeForForm(form.kind, form.transactionType, form.payoutRail) && (
            <div>
              <Label>Fee ({currency})</Label>
              <Input
                type="number"
                min={0}
                placeholder={calculateFee.isPending ? 'Looking up tariff…' : 'Auto from tariff'}
                value={form.fee}
                onChange={(e) =>
                  patch({
                    fee: e.target.value,
                    feeLockedFromTariff: false,
                  })
                }
              />
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-500">
                <span>
                  {tariffLabel ||
                    (showBank
                      ? 'Uses WALLET_TO_BANK tariff when left for auto'
                      : showMno
                        ? 'Uses WALLET_TO_MNO tariff when left for auto'
                        : 'Uses the matching tariff when left for auto')}
                </span>
                {!form.feeLockedFromTariff && (
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => patch({ feeLockedFromTariff: true })}
                  >
                    Use tariff
                  </button>
                )}
              </div>
            </div>
          )}

          {partyField && (
            <div>
              <Label>{partyField.label}</Label>
              <Input
                placeholder={partyField.label}
                value={form.partyName}
                onChange={(e) => patch({ partyName: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500">{partyField.hint}</p>
            </div>
          )}

          {showMno && (
            <>
              <div>
                <Label>Mobile money number</Label>
                <Input
                  placeholder="2567…"
                  value={form.phoneNumber}
                  onChange={(e) => patch({ phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Network</Label>
                <Select value={form.mnoProvider} onValueChange={(value) => patch({ mnoProvider: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">MTN</SelectItem>
                    <SelectItem value="AIRTEL">Airtel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {showBank && (
            <>
              <div>
                <Label>Bank</Label>
                <BankSortCodeSelect
                  value={form.bankSortCode}
                  onValueChange={(code) => patch({ bankSortCode: code })}
                />
              </div>
              <div>
                <Label>Account number</Label>
                <Input
                  placeholder="Account number"
                  value={form.bankAccountNumber}
                  onChange={(e) => patch({ bankAccountNumber: e.target.value })}
                />
              </div>
              <div>
                <Label>Account name</Label>
                <Input
                  placeholder="Account holder name"
                  value={form.bankAccountName}
                  onChange={(e) => patch({ bankAccountName: e.target.value })}
                />
              </div>
            </>
          )}

          {needsMerchantFields(resolvedType) && (
            <div>
              <Label>Merchant code</Label>
              <Input
                placeholder="Merchant code"
                value={form.merchantCode}
                onChange={(e) => patch({ merchantCode: e.target.value })}
              />
            </div>
          )}

          <div>
            <Label>Description / Reason *</Label>
            <Textarea
              placeholder="Enter reason for this ledger entry..."
              value={form.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </div>
          <div>
            <Label>Reference (Optional)</Label>
            <Input
              placeholder="Auto-generated if left blank"
              value={form.reference}
              onChange={(e) => patch({ reference: e.target.value })}
            />
          </div>
          <div>
            <Label>Transaction date *</Label>
            <Input
              type="datetime-local"
              value={form.createdAt}
              onChange={(e) => patch({ createdAt: e.target.value })}
            />
          </div>
          <div>
            <Label>Created by *</Label>
            <Select
              value={form.createdBy}
              onValueChange={(value: 'me' | 'customer' | 'other') => {
                patch({ createdBy: value })
                if (value !== 'other') {
                  setSelectedCreator(null)
                  setCreatorSearchTriggered(false)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Me{user?.email ? ` (${user.email})` : ''}</SelectItem>
                {mode === 'customer' && (
                  <SelectItem value="customer">
                    This customer{customerName ? ` (${customerName})` : customerPhone ? ` (${customerPhone})` : ''}
                  </SelectItem>
                )}
                <SelectItem value="other">Another system user</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.createdBy === 'other' && (
            <div className="space-y-3 rounded-lg border bg-gray-50 p-3">
              <div>
                <Label>Pick a staff / admin user</Label>
                <Input
                  className="mt-1 mb-2"
                  placeholder="Filter by name or email"
                  value={systemUserFilter}
                  onChange={(e) => setSystemUserFilter(e.target.value)}
                />
                <Select
                  value={
                    selectedCreator && systemUsers.some((u) => u.id === selectedCreator.id)
                      ? selectedCreator.id
                      : undefined
                  }
                  onValueChange={(id) => {
                    const picked = asUserList(usersData).find((u) => u.id === id)
                    if (picked) {
                      setSelectedCreator(toCreatorResult(picked))
                      setCreatorSearch('')
                      setCreatorSearchTriggered(false)
                    }
                  }}
                  disabled={systemUsersLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        systemUsersLoading ? 'Loading system users...' : 'Select a system user'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {systemUsers.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        {systemUsersLoading ? 'Loading...' : 'No matching system users'}
                      </div>
                    ) : (
                      systemUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {systemUserName(u)}
                          {u.email ? ` · ${u.email}` : ''}
                          {u.role ? ` · ${u.role}` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selectedCreator && (
                <div className="flex items-center gap-2 text-sm text-gray-800">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>
                    {[selectedCreator.profile?.firstName, selectedCreator.profile?.lastName].filter(Boolean).join(' ') ||
                      selectedCreator.email ||
                      selectedCreator.phone}
                  </span>
                </div>
              )}
              <div className="space-y-2 border-t pt-3">
                <Label>Or search any user by phone or email</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="2567… or email@…"
                    value={creatorSearch}
                    onChange={(e) => {
                      setCreatorSearch(e.target.value)
                      setCreatorSearchTriggered(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (creatorSearch.trim()) setCreatorSearchTriggered(true)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={creatorSearchLoading || !creatorSearch.trim()}
                    onClick={() => setCreatorSearchTriggered(true)}
                  >
                    {creatorSearchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {creatorSearchTriggered &&
                  !creatorSearchLoading &&
                  !selectedCreator &&
                  (creatorSearchError as any)?.response?.status === 404 && (
                    <p className="text-xs text-red-600">No user found for that phone or email.</p>
                  )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (mode === 'customer' && !walletId)}
            className={direction === 'DEBIT' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isLoading ? 'Recording...' : `Record ${typeLabel}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
