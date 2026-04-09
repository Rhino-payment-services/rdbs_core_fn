"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Wallet, TrendingUp, RefreshCw, PlusCircle, MinusCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'

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

interface WalletBalance {
  partnerId: string
  partnerName: string
  walletId: string | null
  walletType: string
  balance: number
  currency: string
  isActive: boolean
}

function usePartnerWalletBalance(partnerId: string, walletType: 'ESCROW' | 'COMMISSION') {
  return useQuery<{ success: boolean; wallet: WalletBalance }>({
    queryKey: ['partner-wallet-balance', partnerId, walletType],
    queryFn: async () => {
      const res = await api.get(
        `/api/v1/admin/gateway-partners/wallets/${partnerId}/balance?currency=UGX&walletType=${walletType}`,
      )
      return res.data
    },
    enabled: !!partnerId,
    staleTime: 15000,
  })
}

function findPartnerWalletId(
  partnerWallets: PartnerWalletRow[] | undefined,
  walletType: 'ESCROW' | 'COMMISSION',
): string | undefined {
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

  const [form, setForm] = useState({
    walletType: 'ESCROW' as 'ESCROW' | 'COMMISSION',
    actionType: 'CREDIT' as 'CREDIT' | 'DEBIT',
    amount: '',
    reference: '',
    description: '',
  })

  const { data: escrowData, isLoading: escrowLoading, refetch: refetchEscrow } = usePartnerWalletBalance(partnerId, 'ESCROW')
  const { data: commissionData, isLoading: commissionLoading, refetch: refetchCommission } = usePartnerWalletBalance(partnerId, 'COMMISSION')

  const escrowBalance = escrowData?.wallet
  const commissionBalance = commissionData?.wallet

  const resolveWalletId = (wt: 'ESCROW' | 'COMMISSION'): string | undefined => {
    const fromList = findPartnerWalletId(partnerWallets, wt)
    if (fromList) return fromList
    const fromApi = wt === 'ESCROW' ? escrowBalance?.walletId : commissionBalance?.walletId
    return fromApi || undefined
  }

  const handleRefresh = () => {
    refetchEscrow()
    refetchCommission()
  }

  const handleOpenAdjustment = (
    walletType: 'ESCROW' | 'COMMISSION',
    actionType: 'CREDIT' | 'DEBIT',
  ) => {
    setForm({
      walletType,
      actionType,
      amount: '',
      reference: `${actionType === 'DEBIT' ? 'DEBIT' : 'TOPUP'}_${walletType}_${Date.now()}`,
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

    const signedAmount = form.actionType === 'DEBIT' ? -parsedAmount : parsedAmount
    const walletId = resolveWalletId(form.walletType)
    const reason =
      form.description.trim() ||
      `Manual ${form.actionType === 'DEBIT' ? 'debit' : 'funding'} (${form.walletType}) — ${partnerName}`
    const reference = form.reference.trim()

    setIsLoading(true)
    try {
      if (walletId) {
        // Same path as CustomerSettings manual credit — admin wallet fund
        await api.post(`/wallet/admin/${walletId}/fund`, {
          amount: signedAmount,
          reason,
          reference,
        })
      } else {
        if (form.actionType === 'DEBIT') {
          throw new Error(`Cannot deduct: ${form.walletType} wallet does not exist yet.`)
        }
        // No wallet row yet — gateway flow creates ESCROW/COMMISSION wallet if missing
        await api.post('/api/v1/admin/gateway-partners/wallets/top-up', {
          partnerId,
          amount: parsedAmount,
          currency: 'UGX',
          walletType: form.walletType,
          reference,
          description: reason,
        })
      }

      toast.success(
        `${form.walletType} wallet ${form.actionType === 'DEBIT' ? 'debited' : 'funded'} with ${parsedAmount.toLocaleString()} UGX`,
      )
      setFundDialogOpen(false)

      queryClient.invalidateQueries({ queryKey: ['partner-wallet-balance', partnerId] })
      refetchEscrow()
      refetchCommission()
      onActionComplete?.()
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fund wallet'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const WalletCard = ({
    label,
    data,
    loading,
    type,
    color,
  }: {
    label: string
    data: WalletBalance | undefined
    loading: boolean
    type: 'ESCROW' | 'COMMISSION'
    color: 'blue' | 'green'
  }) => {
    const bg = color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
    const textColor = color === 'blue' ? 'text-blue-700' : 'text-green-700'
    const badgeClass = color === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
    const btnOutline =
      color === 'blue'
        ? 'mt-4 w-full gap-1.5 border-blue-300 hover:bg-blue-100'
        : 'mt-4 w-full gap-1.5 border-green-300 hover:bg-green-100'

    return (
      <div className={`rounded-lg border p-5 ${bg}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className={`h-4 w-4 ${textColor}`} />
            <span className={`text-sm font-semibold ${textColor}`}>{label}</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
            {data ? (data.isActive ? 'Active' : 'Inactive') : '—'}
          </span>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        ) : (
          <>
            <p className={`text-2xl font-bold ${textColor}`}>
              {data ? Number(data.balance).toLocaleString('en-UG') : '0'}{' '}
              <span className="text-sm font-medium">{data?.currency || 'UGX'}</span>
            </p>
            {data?.walletId && (
              <p className="text-xs text-gray-500 mt-1 truncate">ID: {data.walletId}</p>
            )}
          </>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className={btnOutline.replace('mt-4 w-full ', '')} onClick={() => handleOpenAdjustment(type, 'CREDIT')}>
            <PlusCircle className="h-3.5 w-3.5" />
            Fund
          </Button>
          <Button size="sm" variant="outline" className={btnOutline.replace('mt-4 w-full ', '')} onClick={() => handleOpenAdjustment(type, 'DEBIT')}>
            <MinusCircle className="h-3.5 w-3.5" />
            Deduct
          </Button>
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
                Add money to ESCROW or COMMISSION the same way as manual transactions on customer profiles (admin wallet
                fund when a wallet exists).
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WalletCard
              label="ESCROW Wallet"
              data={escrowBalance}
              loading={escrowLoading}
              type="ESCROW"
              color="blue"
            />
            <WalletCard
              label="COMMISSION Wallet"
              data={commissionBalance}
              loading={commissionLoading}
              type="COMMISSION"
              color="green"
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              {form.actionType === 'DEBIT' ? 'Deduct from' : 'Fund'} {form.walletType} Wallet
            </DialogTitle>
            <DialogDescription>
              {form.actionType === 'DEBIT' ? 'Remove funds from' : 'Add funds to'} the {form.walletType.toLowerCase()} wallet for{' '}
              <span className="font-medium">{partnerName}</span>.
              {resolveWalletId(form.walletType) ? (
                <span className="block mt-1 text-xs text-muted-foreground">
                  Uses admin wallet funding (same as customer manual credit).
                </span>
              ) : (
                <span className="block mt-1 text-xs text-amber-700">
                  Wallet will be created on first funding if it does not exist yet.
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
              <Label>Action</Label>
              <Select
                value={form.actionType}
                onValueChange={(v) => setForm((f) => ({ ...f, actionType: v as 'CREDIT' | 'DEBIT' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">Fund (Add Money)</SelectItem>
                  <SelectItem value="DEBIT">Deduct (Remove Money)</SelectItem>
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

            {form.amount && !Number.isNaN(parseFloat(form.amount)) && (
              <div className={`rounded-md p-3 text-sm border ${form.actionType === 'DEBIT' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                <p className={`font-medium ${form.actionType === 'DEBIT' ? 'text-amber-800' : 'text-blue-800'}`}>
                  {form.actionType === 'DEBIT' ? 'Debiting' : 'Funding'} {form.walletType} with{' '}
                  <span className="font-bold">{parseFloat(form.amount).toLocaleString('en-UG')} UGX</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFundDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleFundWallet} disabled={isLoading} className="gap-1.5">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {form.actionType === 'DEBIT' ? <MinusCircle className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                  {form.actionType === 'DEBIT' ? 'Confirm Deduction' : 'Confirm Funding'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PartnerSettings
