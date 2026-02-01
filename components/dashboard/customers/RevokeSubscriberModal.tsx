"use client"

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Crown, Loader2, AlertCircle } from 'lucide-react'

interface SuperMerchantOption {
  id: string
  merchantCode: string
  businessTradeName: string
  isSuperMerchant: boolean
}

interface RevokeSubscriberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriberName: string
  superMerchantAccounts: SuperMerchantOption[]
  onConfirm: (merchantId: string) => Promise<void>
}

export const RevokeSubscriberModal: React.FC<RevokeSubscriberModalProps> = ({
  open,
  onOpenChange,
  subscriberName,
  superMerchantAccounts,
  onConfirm,
}) => {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    if (open) {
      setSelectedMerchantId(
        superMerchantAccounts.length === 1 ? superMerchantAccounts[0].id : ''
      )
    }
  }, [open, superMerchantAccounts])

  const handleConfirm = async () => {
    const merchantId = selectedMerchantId || superMerchantAccounts[0]?.id
    if (!merchantId) return
    setIsSubmitting(true)
    try {
      await onConfirm(merchantId)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasNoSuperMerchants = superMerchantAccounts.length === 0
  const hasSingleSuperMerchant = superMerchantAccounts.length === 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Crown className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl">Revoke Super Merchant Status</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="space-y-2 text-left">
              {hasNoSuperMerchants ? (
                <div className="flex items-start gap-2 py-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">No super merchant accounts</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {subscriberName} has no merchant accounts with Super Merchant status.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p>
                    Select the merchant account to revoke Super Merchant status from{' '}
                    <strong className="text-gray-900">{subscriberName}</strong>.
                  </p>
                  <p className="text-sm text-amber-600">
                    Note: All child merchants must be unassigned first before revoking.
                  </p>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {!hasNoSuperMerchants && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Merchant to Revoke</Label>
              <Select value={selectedMerchantId} onValueChange={setSelectedMerchantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a merchant" />
                </SelectTrigger>
                <SelectContent>
                  {superMerchantAccounts.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.businessTradeName} ({m.merchantCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {hasNoSuperMerchants ? 'Close' : 'Cancel'}
          </Button>
          {!hasNoSuperMerchants && (
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || !(selectedMerchantId || hasSingleSuperMerchant)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Super Merchant'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
