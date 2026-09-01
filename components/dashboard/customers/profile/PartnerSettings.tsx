"use client"

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Wallet, TrendingUp, RefreshCw, PlusCircle, MinusCircle, Loader2, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import { useQueryClient } from '@tanstack/react-query'
import {
  usePartnerWallets,
  useSetPartnerReserve,
  type PartnerWalletListItem,
} from '@/lib/hooks/useGatewayPartners'
import { SetPartnerReserveDialog } from '@/components/dashboard/gateway-partners/SetPartnerReserveDialog'

interface PartnerWalletRow {
  id: string
  walletType?: string
  balance?: number | string
  currency?: string
}

interface PartnerSettingsProps {
  partnerId: string
  partnerName: string
  /** Wallets from finance API — same source as profile; used to fund via /wallet/admin/:id/fund like customers */
  partnerWallets?: PartnerWalletRow[]
  onActionComplete?: () => void
}

function escrowWalletLabel(w: PartnerWalletListItem): string {
  const parts = ['ESCROW Wallet']
  if (w.walletNumber != null) parts.push(`#${w.walletNumber}`)
  if (w.description?.trim()) parts.push(`— ${w.description.trim()}`)
  return parts.join(' ')
}

function findPartnerWalletId(
  partnerWallets: PartnerWalletRow[] | undefined,
  walletType: 'ESCROW' | 'COMMISSION',
  walletId?: string,
): string | undefined {
  if (walletId) return walletId
  if (!partnerWallets?.length) return undefined
  const t = walletType.toUpperCase()
  const row = partnerWallets.find((w) => (w.walletType || '').toUpperCase() === t)
  return row?.id
}

const PartnerSettings: React.FC<PartnerSettingsProps> = ({
  partnerId,
  partnerName,
  partnerWallets = [],
  onActionComplete,
}) => {
  const queryClient = useQueryClient()
  const [fundDialogOpen, setFundDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showReserveDialog, setShowReserveDialog] = useState(false)
  const [reserveWalletId, setReserveWalletId] = useState('')
  const [adjustWalletId, setAdjustWalletId] = useState('')
  const setReserve = useSetPartnerReserve()

  const [form, setForm] = useState({
    walletType: 'ESCROW' as 'ESCROW' | 'COMMISSION',
    transactionType: 'CREDIT' as 'CREDIT' | 'DEBIT',
    amount: '',
    reference: '',
    description: '',
  })

  const { data: walletsData, isLoading: walletsLoading, refetch: refetchWallets } =
    usePartnerWallets(partnerId)

  const allWallets = walletsData?.wallets ?? []
  const escrowWallets = allWallets.filter(
    (w) => (w.walletType || '').toUpperCase() === 'ESCROW',
  )
  const commissionWallet = allWallets.find(
    (w) => (w.walletType || '').toUpperCase() === 'COMMISSION',
  )

  const reserveDialogTarget = useMemo(() => {
    if (reserveWalletId) {
      const w = escrowWallets.find((x) => x.id === reserveWalletId)
      if (w) {
        return {
          walletId: w.id,
          balance: Number(w.balance ?? 0),
          frozen: Number(w.frozenBalance ?? 0),
          currency: w.currency || 'UGX',
        }
      }
    }
    const fallback = escrowWallets.find((w) => w.isDefault) || escrowWallets[0]
    return {
      walletId: fallback?.id,
      balance: Number(fallback?.balance ?? 0),
      frozen: Number(fallback?.frozenBalance ?? 0),
      currency: fallback?.currency || 'UGX',
    }
  }, [reserveWalletId, escrowWallets])

  const resolveWalletId = (wt: 'ESCROW' | 'COMMISSION'): string | undefined => {
    if (adjustWalletId) return adjustWalletId
    const fromList = findPartnerWalletId(partnerWallets, wt)
    if (fromList) return fromList
    if (wt === 'ESCROW') {
      const def = escrowWallets.find((w) => w.isDefault) || escrowWallets[0]
      return def?.id
    }
    return commissionWallet?.id
  }

  const handleRefresh = () => {
    refetchWallets()
  }

  const handleOpenAdjustment = (
    walletType: 'ESCROW' | 'COMMISSION',
    transactionType: 'CREDIT' | 'DEBIT',
    walletId?: string,
  ) => {
    setAdjustWalletId(walletId || '')
    setForm({
      walletType,
      transactionType,
      amount: '',
      reference: `${transactionType === 'DEBIT' ? 'DEBIT' : 'TOPUP'}_${walletType}_${Date.now()}`,
      description: '',
    })
    setFundDialogOpen(true)
  }

  const handleFundWallet = async () => {
    const parsedAmount = parseFloat(form.amount)
    if (!form.amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Amount must be a positive number')
      return
    }
    if (!form.reference.trim()) {
      toast.error('A reference is required')
      return
    }

    const walletId = resolveWalletId(form.walletType)
    if (form.transactionType === 'DEBIT' && !walletId) {
      toast.error('Debit is only available after the wallet exists. Use credit first to create the wallet, or wait for balances to load.')
      return
    }

    const reason =
      form.description.trim() ||
      (form.transactionType === 'DEBIT'
        ? `Manual debit (${form.walletType}) — ${partnerName}`
        : `Manual funding (${form.walletType}) — ${partnerName}`)
    const reference = form.reference.trim()
    // Same as CustomerSettings: fund API accepts positive (credit) or negative (debit)
    const signedAmount = form.transactionType === 'DEBIT' ? -parsedAmount : parsedAmount

    setIsLoading(true)
    try {
      if (walletId) {
        await api.post(`/wallet/admin/${walletId}/fund`, {
          amount: signedAmount,
          reason,
          reference,
        })
      } else {
        await api.post('/api/v1/admin/gateway-partners/wallets/top-up', {
          partnerId,
          amount: parsedAmount,
          currency: 'UGX',
          walletType: form.walletType,
          walletId: adjustWalletId || undefined,
          reference,
          description: reason,
        })
      }

      const action = form.transactionType === 'CREDIT' ? 'Credit' : 'Debit'
      toast.success(
        `${action}: ${parsedAmount.toLocaleString()} UGX on ${form.walletType} wallet for ${partnerName}`,
      )
      setFundDialogOpen(false)
      setAdjustWalletId('')

      queryClient.invalidateQueries({ queryKey: ['partner-wallet-balance', partnerId] })
      queryClient.invalidateQueries({ queryKey: ['gateway-partner-wallets', partnerId] })
      queryClient.invalidateQueries({ queryKey: ['gateway-partner-wallet', partnerId] })
      refetchWallets()
      onActionComplete?.()
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to apply wallet adjustment'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const WalletCard = ({
    label,
    wallet,
    loading,
    type,
    color,
    onSetReserve,
    onFund,
    onDeduct,
  }: {
    label: string
    wallet: PartnerWalletListItem | undefined
    loading: boolean
    type: 'ESCROW' | 'COMMISSION'
    color: 'blue' | 'green'
    onSetReserve?: () => void
    onFund?: () => void
    onDeduct?: () => void
  }) => {
    const bg = color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
    const textColor = color === 'blue' ? 'text-blue-700' : 'text-green-700'
    const badgeClass = color === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
    const btnOutline =
      color === 'blue'
        ? 'mt-4 w-full gap-1.5 border-blue-300 hover:bg-blue-100'
        : 'mt-4 w-full gap-1.5 border-green-300 hover:bg-green-100'

    const frozen = Number(wallet?.frozenBalance ?? 0)
    const available =
      wallet?.availableBalance ?? Math.max(0, Number(wallet?.balance ?? 0) - frozen)

    return (
      <div className={`rounded-lg border p-5 ${bg}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Wallet className={`h-4 w-4 shrink-0 ${textColor}`} />
                <span className={`text-sm font-semibold ${textColor} truncate`}>{label}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {wallet?.isDefault && (
                  <Badge variant="outline" className="text-[10px]">
                    Default
                  </Badge>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
                  {wallet ? (wallet.isActive ? 'Active' : 'Inactive') : '—'}
                </span>
              </div>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            ) : (
              <>
                {wallet?.publicWalletId ? (
                  <p className="text-xs text-gray-600">
                    RukaPay No. <span className="font-semibold">{wallet.publicWalletId}</span>
                    {wallet.walletNumber != null ? ` · Wallet #${wallet.walletNumber}` : ''}
                  </p>
                ) : null}
                {type === 'ESCROW' && wallet && (
                  <div className="mt-1 space-y-0.5 text-xs">
                    {frozen > 0 ? (
                      <p className="text-orange-700 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Reserved: {frozen.toLocaleString('en-UG')} {wallet.currency || 'UGX'}
                      </p>
                    ) : (
                      <p className="text-blue-500">No reserve — full balance available</p>
                    )}
                  </div>
                )}
                {wallet?.id && (
                  <p className="text-xs text-gray-500 mt-1 truncate">ID: {wallet.id}</p>
                )}
              </>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className={btnOutline.replace('mt-4 w-full ', '')}
                onClick={onFund ?? (() => handleOpenAdjustment(type, 'CREDIT', wallet?.id))}
                disabled={!wallet && !loading}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Fund
              </Button>
              <Button
                size="sm"
                variant="outline"
                className={btnOutline.replace('mt-4 w-full ', '')}
                onClick={onDeduct ?? (() => handleOpenAdjustment(type, 'DEBIT', wallet?.id))}
                disabled={!wallet && !loading}
              >
                <MinusCircle className="h-3.5 w-3.5" />
                Deduct
              </Button>
            </div>
            {type === 'ESCROW' && onSetReserve && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={onSetReserve}
                disabled={!wallet?.id}
              >
                <Lock className="h-3.5 w-3.5" />
                {frozen > 0 ? 'Manage Reserve' : 'Set Reserve'}
              </Button>
            )}
          </div>
          {!loading && (
            <div className="shrink-0 text-right">
              <p className={`text-2xl font-bold tabular-nums ${textColor}`}>
                {available.toLocaleString('en-UG')}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Available {wallet?.currency || 'UGX'}
              </p>
              {wallet ? (
                <p className="mt-1 text-xs text-gray-500">
                  Total {Number(wallet.balance).toLocaleString('en-UG')}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Partner wallets &amp; manual funding
              </CardTitle>
              <CardDescription>
                Credit or debit ESCROW and COMMISSION wallets using the same admin wallet fund API as merchant/customer
                profiles when a wallet exists; first-time credit can use gateway top-up to create the wallet.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {escrowWallets.length > 1 && (
            <p className="mb-3 text-xs text-gray-500">
              This partner has {escrowWallets.length} ESCROW wallets — fund, deduct, or set reserve on each
              individually.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {escrowWallets.length > 0 ? (
              escrowWallets.map((w) => (
                <WalletCard
                  key={w.id}
                  label={escrowWalletLabel(w)}
                  wallet={w}
                  loading={walletsLoading}
                  type="ESCROW"
                  color="blue"
                  onSetReserve={() => {
                    setReserveWalletId(w.id)
                    setShowReserveDialog(true)
                  }}
                />
              ))
            ) : (
              <WalletCard
                label="ESCROW Wallet"
                wallet={undefined}
                loading={walletsLoading}
                type="ESCROW"
                color="blue"
              />
            )}
            <WalletCard
              label="COMMISSION Wallet"
              wallet={commissionWallet}
              loading={walletsLoading}
              type="COMMISSION"
              color="green"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={fundDialogOpen}
        onOpenChange={(open) => {
          setFundDialogOpen(open)
          if (!open) setAdjustWalletId('')
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              Manual transaction — {form.walletType}
            </DialogTitle>
            <DialogDescription>
              Credit or debit the {form.walletType.toLowerCase()} wallet for{' '}
              <span className="font-medium">{partnerName}</span>.
              {resolveWalletId(form.walletType) ? (
                <span className="block mt-1 text-xs text-muted-foreground">
                  Uses admin wallet fund (positive = credit, negative = debit), same as customer/merchant settings.
                </span>
              ) : (
                <span className="block mt-1 text-xs text-amber-700">
                  Wallet not loaded yet: only credit is available; gateway top-up will create the wallet if needed. Debit
                  requires an existing wallet.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Wallet Type</Label>
              <Select
                value={form.walletType}
                onValueChange={(v) => setForm((f) => ({ ...f, walletType: v as 'ESCROW' | 'COMMISSION' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESCROW">ESCROW</SelectItem>
                  <SelectItem value="COMMISSION">COMMISSION</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Transaction type</Label>
              <Select
                value={form.transactionType}
                onValueChange={(v) => setForm((f) => ({ ...f, transactionType: v as 'CREDIT' | 'DEBIT' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Credit (add money)</SelectItem>
                  <SelectItem value="DEBIT">Debit (remove money)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Amount (UGX)</Label>
              <Input
                type="number"
                min="500"
                step="1"
                placeholder="e.g. 1000000"
                className="mt-1"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>

            <div>
              <Label>Reference</Label>
              <Input
                placeholder="Unique reference"
                className="mt-1"
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              />
            </div>

            <div>
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Reason for funding..."
                className="mt-1 resize-none"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {form.amount && !Number.isNaN(parseFloat(form.amount)) && parseFloat(form.amount) > 0 && (
              <div
                className={`rounded-md border p-3 text-sm ${
                  form.transactionType === 'CREDIT'
                    ? 'bg-green-50 border-green-200 text-green-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <p className="font-medium">
                  {form.transactionType === 'CREDIT' ? 'Credit' : 'Debit'}{' '}
                  <span className="font-bold">{parseFloat(form.amount).toLocaleString('en-UG')} UGX</span>
                  {` on ${form.walletType}`}
                </p>
                {(() => {
                  const target =
                    adjustWalletId
                      ? allWallets.find((w) => w.id === adjustWalletId)
                      : form.walletType === 'ESCROW'
                        ? escrowWallets.find((w) => w.isDefault) || escrowWallets[0]
                        : commissionWallet
                  const n = target?.balance != null ? Number(target.balance) : NaN
                  if (Number.isNaN(n)) return null
                  const amt = parseFloat(form.amount)
                  const after =
                    form.transactionType === 'CREDIT' ? n + amt : n - amt
                  return (
                    <p className="mt-1 text-xs opacity-90">
                      Balance after: <span className="font-semibold">{after.toLocaleString('en-UG')} UGX</span>
                      {after < 0 ? ' (invalid — insufficient balance)' : ''}
                    </p>
                  )
                })()}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFundDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleFundWallet}
              disabled={isLoading}
              className={`gap-1.5 ${form.transactionType === 'DEBIT' ? 'bg-red-600 hover:bg-red-700' : ''}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  {form.transactionType === 'CREDIT' ? 'Credit wallet' : 'Debit wallet'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SetPartnerReserveDialog
        open={showReserveDialog}
        onOpenChange={(open) => {
          setShowReserveDialog(open)
          if (!open) setReserveWalletId('')
        }}
        partnerId={partnerId}
        partnerName={partnerName}
        currentBalance={reserveDialogTarget.balance}
        currentReserve={reserveDialogTarget.frozen}
        currency={reserveDialogTarget.currency}
        walletId={reserveDialogTarget.walletId}
        onSuccess={() => {
          refetchWallets()
          onActionComplete?.()
        }}
        setReserveMutation={setReserve}
      />
    </div>
  )
}

export default PartnerSettings
