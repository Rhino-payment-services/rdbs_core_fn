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

interface SetPartnerReserveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId: string
  partnerName: string
  currentBalance: number
  currentReserve: number
  currency?: string
  onSuccess?: () => void
  /** Mutation from useSetPartnerReserve */
  setReserveMutation: {
    mutateAsync: (payload: {
      partnerId: string
      amount: number
      reason: string
      reference?: string
    }) => Promise<any>
    isPending: boolean
  }
}

export const SetPartnerReserveDialog: React.FC<SetPartnerReserveDialogProps> = ({
  open,
  onOpenChange,
  partnerId,
  partnerName,
  currentBalance,
  currentReserve,
  currency = 'UGX',
  onSuccess,
  setReserveMutation,
}) => {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')

  // Pre-fill with current reserve when dialog opens
  useEffect(() => {
    if (open) {
      setAmount(currentReserve > 0 ? String(currentReserve) : '')
      setReason('')
      setReference('')
      setError('')
    }
  }, [open, currentReserve])

  const parsedAmount = parseFloat(amount)
  const isClearing = amount === '0' || amount === ''
  const effectiveAmount = isClearing ? 0 : parsedAmount
  const availableAfter = Math.max(0, currentBalance - effectiveAmount)

  const validate = (): string | null => {
    if (amount !== '' && amount !== '0') {
      if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
        return 'Enter a valid amount (0 to clear reserve)'
      }
      if (parsedAmount > currentBalance) {
        return `Reserve cannot exceed wallet balance (${currentBalance.toLocaleString()} ${currency})`
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
      await setReserveMutation.mutateAsync({
        partnerId,
        amount: effectiveAmount,
        reason: reason.trim(),
        reference: reference.trim() || undefined,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to update reserve',
      )
    }
  }

  const isClearAction = effectiveAmount === 0 && currentReserve > 0

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
            {isClearAction ? 'Clear Reserve' : 'Set Reserved Funds'}
          </DialogTitle>
          <DialogDescription>
            Reserve funds on the ESCROW wallet for{' '}
            <span className="font-medium">{partnerName}</span>. The partner
            can only transact using the remaining available balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Balance summary */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-blue-700">Total balance</span>
              <span className="font-semibold text-blue-900">
                {currentBalance.toLocaleString()} {currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-700">Current reserve</span>
              <span className="font-semibold text-orange-900">
                {currentReserve.toLocaleString()} {currency}
              </span>
            </div>
            {!Number.isNaN(effectiveAmount) && amount !== '' && (
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
            <Label htmlFor="reserve-amount">
              Reserve amount ({currency})
              <span className="ml-1 text-xs text-muted-foreground">
                — enter 0 or leave blank to clear
              </span>
            </Label>
            <Input
              id="reserve-amount"
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
            <Label htmlFor="reserve-reason">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reserve-reason"
              placeholder="e.g. Minimum float per contract clause 3.2"
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError('')
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reserve-reference">
              Reference{' '}
              <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="reserve-reference"
              placeholder="e.g. CONTRACT-2026-08"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {isClearAction && (
            <Alert className="border-green-200 bg-green-50">
              <Unlock className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                This will clear the current reserve of{' '}
                <strong>
                  {currentReserve.toLocaleString()} {currency}
                </strong>
                , making the full balance available for transactions.
              </AlertDescription>
            </Alert>
          )}

          {!isClearAction && !Number.isNaN(effectiveAmount) && effectiveAmount > 0 && availableAfter === 0 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-sm">
                Available balance will be 0 — all transactions for this
                partner will be rejected until the wallet is topped up.
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
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={setReserveMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={setReserveMutation.isPending || !reason.trim()}
            variant={isClearAction ? 'default' : 'default'}
            className={
              isClearAction
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-orange-600 hover:bg-orange-700'
            }
          >
            {setReserveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : isClearAction ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Clear Reserve
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Set Reserve
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
