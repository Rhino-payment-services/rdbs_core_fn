"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, ArrowRightLeft, Loader2 } from 'lucide-react'
import api from '@/lib/axios'
import { useSweepCollectionToDisbursement } from '@/lib/hooks/useWallets'
import toast from 'react-hot-toast'

const SWEEP_FEE_PERCENT = 2.5

interface LiquidateToDisbursementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  merchantCode?: string
}

interface WalletLite {
  id: string
  walletType: string
  balance: number | string | null
  currency: string
}

const formatCurrency = (amount: number, currency = 'UGX') =>
  new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

const LiquidateToDisbursementModal: React.FC<LiquidateToDisbursementModalProps> = ({
  open,
  onOpenChange,
  userId,
  merchantCode,
}) => {
  const [wallets, setWallets] = useState<WalletLite[]>([])
  const [loadingWallets, setLoadingWallets] = useState(false)
  const [amountInput, setAmountInput] = useState('')

  const sweepMutation = useSweepCollectionToDisbursement()

  useEffect(() => {
    const fetchWallets = async () => {
      if (!open || !userId) return
      setLoadingWallets(true)
      try {
        const response = await api({
          url: `/wallet/${userId}/all`,
          method: 'GET',
        })
        const data = response.data?.data || response.data || []
        setWallets(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching wallets for liquidation modal:', error)
        setWallets([])
      } finally {
        setLoadingWallets(false)
      }
    }
    fetchWallets()
  }, [open, userId])

  const collectionWallet = useMemo(
    () =>
      wallets.find(
        (w) => w.walletType === 'BUSINESS_COLLECTION' || w.walletType === 'BUSINESS',
      ),
    [wallets],
  )

  const disbursementWallet = useMemo(
    () =>
      wallets.find(
        (w) =>
          w.walletType === 'BUSINESS_DISBURSEMENT' ||
          w.walletType === 'BUSINESS_LIQUIDATION',
      ),
    [wallets],
  )

  const collectionBalance = useMemo(() => {
    if (!collectionWallet) return 0
    const raw = collectionWallet.balance
    if (typeof raw === 'number') return raw
    if (raw == null) return 0
    return Number(raw)
  }, [collectionWallet])

  const currency = collectionWallet?.currency || disbursementWallet?.currency || 'UGX'

  const gross = parseFloat(amountInput) || 0
  const fee = Number((gross * SWEEP_FEE_PERCENT / 100).toFixed(0))
  const net = gross - fee

  const canLiquidate =
    !!collectionWallet &&
    !!disbursementWallet &&
    collectionWallet.id !== disbursementWallet.id

  const isValidAmount =
    gross > 0 &&
    net > 0 &&
    gross <= collectionBalance &&
    !Number.isNaN(gross) &&
    canLiquidate

  const handleClose = () => {
    if (sweepMutation.isPending) return
    setAmountInput('')
    onOpenChange(false)
  }

  const handleConfirm = async () => {
    if (!isValidAmount || !userId) return
    try {
      await sweepMutation.mutateAsync({
        userId,
        amount: gross,
        merchantCode,
      })
      toast.success(
        `Liquidated ${formatCurrency(gross, currency)} gross → ${formatCurrency(
          net,
          currency,
        )} to disbursement`,
      )
      setAmountInput('')
      onOpenChange(false)
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to liquidate collections'
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-amber-600" />
            Liquidate collections → disbursement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loadingWallets ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading wallets…
            </div>
          ) : !canLiquidate ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <p>
                This merchant must have separate <strong>collection</strong> and{' '}
                <strong>disbursement</strong> wallets to liquidate. Check their wallet
                configuration.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-amber-200 bg-white px-4 py-2">
                  <p className="text-xs text-gray-500">Collection balance</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(collectionBalance, currency)}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-white px-4 py-2">
                  <p className="text-xs text-gray-500">Disbursement wallet</p>
                  <p className="font-semibold text-blue-600">
                    {formatCurrency(
                      Number(disbursementWallet?.balance || 0),
                      disbursementWallet?.currency || currency,
                    )}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="liquidate-amount">Gross amount ({currency})</Label>
                <Input
                  id="liquidate-amount"
                  type="number"
                  min={1}
                  max={collectionBalance}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Enter gross amount to liquidate"
                  className="mt-2"
                />
                {gross > collectionBalance && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    Amount exceeds collection balance
                  </p>
                )}
              </div>

              {gross > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Gross amount</span>
                    <span className="font-medium">
                      {formatCurrency(gross, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>RukaPay fee ({SWEEP_FEE_PERCENT}%)</span>
                    <span>− {formatCurrency(fee, currency)}</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-amber-200 pt-1 font-semibold text-green-700">
                    <span>Net to disbursement</span>
                    <span>{formatCurrency(net, currency)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} disabled={sweepMutation.isPending}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!isValidAmount || sweepMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {sweepMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Confirm liquidation
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default LiquidateToDisbursementModal

