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
import { Unlock, AlertTriangle, Loader2 } from 'lucide-react'
import { getAvailableBalance } from '@/lib/utils/wallet-balance'

export interface WalletUnfreezeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectLabel: string
  currentBalance: number
  currentFrozen: number
  currency?: string
  isPending?: boolean
  onSubmit: (payload: {
    amount?: number
    reason: string
    reference?: string
  }) => Promise<void>
}

export const WalletUnfreezeDialog: React.FC<WalletUnfreezeDialogProps> = ({
  open,
  onOpenChange,
  subjectLabel,
  currentBalance,
  currentFrozen,
  currency = 'UGX',
  isPending = false,
  onSubmit,
}) => {
  const [releaseAll, setReleaseAll] = useState(true)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setReleaseAll(true)
      setAmount('')
      setReason('')
      setReference('')
      setError('')
    }
  }, [open])

  const parsedAmount = parseFloat(amount)
  const releaseAmount = releaseAll
    ? currentFrozen
    : Number.isNaN(parsedAmount)
      ? 0
      : parsedAmount
  const newFrozen = Math.max(0, currentFrozen - releaseAmount)
  const availableAfter = getAvailableBalance(currentBalance, newFrozen)

  const validate = (): string | null => {
    if (currentFrozen <= 0) return 'Nothing is frozen on this wallet'
    if (!releaseAll) {
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        return 'Enter a valid release amount'
      }
      if (parsedAmount > currentFrozen) {
        return `Cannot release more than ${currentFrozen.toLocaleString()} ${currency}`
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
        amount: releaseAll ? undefined : releaseAmount,
        reason: reason.trim(),
        reference: reference.trim() || undefined,
      })
      onOpenChange(false)
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to release frozen funds',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-green-600" />
            Release Frozen Funds
          </DialogTitle>
          <DialogDescription>
            Release some or all frozen funds on{' '}
            <span className="font-medium">{subjectLabel}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-blue-700">Currently frozen</span>
              <span className="font-semibold text-orange-900">
                {currentFrozen.toLocaleString()} {currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Available after release</span>
              <span className="font-semibold text-green-700">
                {availableAfter.toLocaleString()} {currency}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="release-all"
              type="checkbox"
              checked={releaseAll}
              onChange={(e) => {
                setReleaseAll(e.target.checked)
                setError('')
              }}
              className="rounded border-gray-300"
            />
            <Label htmlFor="release-all" className="font-normal cursor-pointer">
              Release entire frozen amount ({currentFrozen.toLocaleString()} {currency})
            </Label>
          </div>

          {!releaseAll && (
            <div className="space-y-2">
              <Label htmlFor="unfreeze-amount">Amount to release ({currency})</Label>
              <Input
                id="unfreeze-amount"
                type="number"
                min="1"
                max={currentFrozen}
                step="1000"
                placeholder={`Max ${currentFrozen.toLocaleString()}`}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  setError('')
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="unfreeze-reason">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="unfreeze-reason"
              placeholder="e.g. Dispute resolved in customer favour"
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError('')
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unfreeze-reference">
              Reference{' '}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="unfreeze-reference"
              placeholder="e.g. TICKET-12345"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {releaseAll && currentFrozen > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <Unlock className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                The full frozen balance will be released. Available balance will
                become {getAvailableBalance(currentBalance, 0).toLocaleString()}{' '}
                {currency}.
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
            disabled={isPending || !reason.trim() || currentFrozen <= 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Releasing…
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Release Funds
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
