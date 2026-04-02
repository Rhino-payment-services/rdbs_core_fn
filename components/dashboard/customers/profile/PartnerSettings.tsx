"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Wallet, TrendingUp, RefreshCw, PlusCircle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface PartnerSettingsProps {
  partnerId: string
  partnerName: string
  isSuperAdmin?: boolean
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

const PartnerSettings: React.FC<PartnerSettingsProps> = ({
  partnerId,
  partnerName,
  isSuperAdmin = false,
  onActionComplete,
}) => {
  const queryClient = useQueryClient()
  const [fundDialogOpen, setFundDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [form, setForm] = useState({
    walletType: 'ESCROW' as 'ESCROW' | 'COMMISSION',
    amount: '',
    reference: '',
    description: '',
  })

  const { data: escrowData, isLoading: escrowLoading, refetch: refetchEscrow } = usePartnerWalletBalance(partnerId, 'ESCROW')
  const { data: commissionData, isLoading: commissionLoading, refetch: refetchCommission } = usePartnerWalletBalance(partnerId, 'COMMISSION')

  const escrowBalance = escrowData?.wallet
  const commissionBalance = commissionData?.wallet

  const handleRefresh = () => {
    refetchEscrow()
    refetchCommission()
  }

  const handleOpenFund = (walletType: 'ESCROW' | 'COMMISSION') => {
    setForm({
      walletType,
      amount: '',
      reference: `TOPUP_${walletType}_${Date.now()}`,
      description: '',
    })
    setFundDialogOpen(true)
  }

  const handleFundWallet = async () => {
    const parsedAmount = parseFloat(form.amount)
    if (!form.amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid positive amount')
      return
    }
    if (!form.reference.trim()) {
      toast.error('A reference is required')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/api/v1/admin/gateway-partners/wallets/top-up', {
        partnerId,
        amount: parsedAmount,
        currency: 'UGX',
        walletType: form.walletType,
        reference: form.reference.trim(),
        description: form.description.trim() || `Manual top-up for ${partnerName}`,
      })

      toast.success(`${form.walletType} wallet funded with ${parsedAmount.toLocaleString()} UGX`)
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
        {isSuperAdmin && (
          <Button
            size="sm"
            variant="outline"
            className={`mt-4 w-full gap-1.5 border-${color === 'blue' ? 'blue' : 'green'}-300 hover:bg-${color === 'blue' ? 'blue' : 'green'}-100`}
            onClick={() => handleOpenFund(type)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Fund Wallet
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balances */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Partner Wallet Balances
              </CardTitle>
              <CardDescription>Current balances for ESCROW and COMMISSION wallets</CardDescription>
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
          {!isSuperAdmin && (
            <p className="text-xs text-gray-500 mt-4">
              Only Super Admins can fund partner wallets.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Fund Wallet Dialog */}
      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              Fund {form.walletType} Wallet
            </DialogTitle>
            <DialogDescription>
              Add funds to the {form.walletType.toLowerCase()} wallet for{' '}
              <span className="font-medium">{partnerName}</span>.
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
              <Label>Amount (UGX)</Label>
              <Input
                type="number"
                min="1"
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
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm">
                <p className="text-blue-800 font-medium">
                  Funding {form.walletType} with{' '}
                  <span className="font-bold">
                    {parseFloat(form.amount).toLocaleString('en-UG')} UGX
                  </span>
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
                  <PlusCircle className="h-4 w-4" />
                  Confirm Funding
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
