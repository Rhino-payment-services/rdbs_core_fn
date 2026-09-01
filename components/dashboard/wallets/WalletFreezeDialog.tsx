"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Unlock, AlertTriangle, Loader2 } from 'lucide-react'
import { getAvailableBalance } from '@/lib/utils/wallet-balance'

export type WalletFreezeDialogVariant = 'freeze' | 'reserve'

export interface WalletFreezeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** e.g. "Personal wallet — Jane Doe" or "ESCROW wallet — Partner X" */
  subjectLabel: string
  currentBalance: number
  currentFrozen: number
  currency?: string
  /** reserve = partner ESCROW copy; freeze = generic dispute floor copy */
  variant?: WalletFreezeDialogVariant
  isPending?: boolean
  onSubmit: (payload: {
    amount: number
    reason: string
    reference?: string
  }) => Promise<void>
}

const COPY = {
  freeze: {
    setTitle: 'Set Frozen Funds',
    clearTitle: 'Clear Frozen Funds',
    setDescription: 'frozen floor on',
    amountLabel: 'Freeze amount',
    currentLabel: 'Current frozen',
    setButton: 'Set Freeze',
    clearButton: 'Clear Freeze',
  },
  reserve: {
    setTitle: 'Set Reserved Funds',
    clearTitle: 'Clear Reserve',
    setDescription: 'reserve on',
    amountLabel: 'Reserve amount',
    currentLabel: 'Current reserve',
    setButton: 'Set Reserve',
    clearButton: 'Clear Reserve',
  },
} as const

export const WalletFreezeDialog: React.FC<WalletFreezeDialogProps> = ({
  open,
  onOpenChange,
  subjectLabel,
  currentBalance,
  currentFrozen,
  currency = 'UGX',
  variant = 'freeze',
  isPending = false,
  onSubmit,
}) => {
  const labels = COPY[variant]
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setAmount(currentFrozen > 0 ? String(currentFrozen) : '')
      setReason('')
      setReference('')
      setError('')
    }
  }, [open, currentFrozen])

  const parsedAmount = parseFloat(amount)
  const effectiveAmount =
    amount === '' || amount === '0' ? 0 : parsedAmount
  const availableAfter = getAvailableBalance(
    currentBalance,
    Number.isNaN(effectiveAmount) ? currentFrozen : effectiveAmount,
  )

  const validate = (): string | null => {
    if (amount !== '' && amount !== '0') {
      if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
        return 'Enter a valid amount (0 to clear)'
      }
      if (parsedAmount > currentBalance) {
        return `Amount cannot exceed wallet balance (${currentBalance.toLocaleString()} ${currency})`
      }
    }
    if (!reason.trim()) return 'Reason is required'
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    try {
      await onSubmit({
        amount: effectiveAmount,
        reason: reason.trim(),
        reference: reference.trim() || undefined,
      })
      onOpenChange(false)
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to update frozen balance',
      )
    }
  }

  const isClearAction = effectiveAmount === 0 && currentFrozen > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isClearAction ? (
              <Unlock className="h-5 w-5 text-green-600" />
            ) : (
              <Lock className="h-5 w-5 text-orange-600" />
            )}
            {isClearAction ? labels.clearTitle : labels.setTitle}
          </DialogTitle>
          <DialogDescription>
            Set an absolute {labels.setDescription}{' '}
            <span className="font-medium">{subjectLabel}</span>. Only the
            remaining available balance can be spent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-blue-700">Total balance</span>
              <span className="font-semibold text-blue-900">
                {currentBalance.toLocaleString()} {currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-700">{labels.currentLabel}</span>
              <span className="font-semibold text-orange-900">
                {currentFrozen.toLocaleString()} {currency}
              </span>
            </div>
            {amount !== '' && !Number.isNaN(effectiveAmount) && (
              <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                <span className="text-blue-700">Available after</span>
                <span
                  className={`font-semibold ${
                    availableAfter <= 0 ? 'text-red-700' : 'text-green-700'
                  }`}
                >
                  {availableAfter.toLocaleString()} {currency}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="freeze-amount">
              {labels.amountLabel} ({currency})
              <span className="ml-1 text-xs text-muted-foreground">
                — enter 0 or leave blank to clear
              </span>
            </Label>
            <Input
              id="freeze-amount"
              type="number"
              min="0"
              step="1000"
              placeholder="e.g. 5000000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError('')
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="freeze-reason">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="freeze-reason"
              placeholder="e.g. Customer dispute TICKET-12345"
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError('')
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="freeze-reference">
              Reference{' '}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="freeze-reference"
              placeholder="e.g. TICKET-12345"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {isClearAction && (
            <Alert className="border-green-200 bg-green-50">
              <Unlock className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                This will clear the current {variant === 'reserve' ? 'reserve' : 'freeze'} of{' '}
                <strong>
                  {currentFrozen.toLocaleString()} {currency}
                </strong>
                , making the full balance available.
              </AlertDescription>
            </Alert>
          )}

          {!isClearAction &&
            !Number.isNaN(effectiveAmount) &&
            effectiveAmount > 0 &&
            availableAfter === 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 text-sm">
                  Available balance will be 0 — outbound transactions will be
                  rejected until the wallet is topped up or the freeze is reduced.
                </AlertDescription>
              </Alert>
            )}

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !reason.trim()}
            className={
              isClearAction
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : isClearAction ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                {labels.clearButton}
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                {labels.setButton}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
