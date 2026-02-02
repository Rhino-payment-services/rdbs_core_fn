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

interface MerchantOption {
  id: string
  merchantCode: string
  businessTradeName: string
  isSuperMerchant?: boolean
}

interface PromoteSubscriberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscriberName: string
  subscriberId: string
  merchants: MerchantOption[]  // This subscriber's merchants (excluding already super merchants)
  onConfirm: (merchantId: string) => Promise<void>
}

export const PromoteSubscriberModal: React.FC<PromoteSubscriberModalProps> = ({
  open,
  onOpenChange,
  subscriberName,
  subscriberId,
  merchants,
  onConfirm,
}) => {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-select if only one merchant
  const eligibleMerchants = useMemo(
    () => merchants.filter((m) => !m.isSuperMerchant),
    [merchants]
  )

  React.useEffect(() => {
    if (open) {
      setSelectedMerchantId(eligibleMerchants.length === 1 ? eligibleMerchants[0].id : '')
    }
  }, [open, eligibleMerchants])

  const handleConfirm = async () => {
    const merchantId = selectedMerchantId || (eligibleMerchants[0]?.id)
    if (!merchantId) return
    setIsSubmitting(true)
    try {
      await onConfirm(merchantId)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasNoEligibleMerchants = eligibleMerchants.length === 0
  const hasSingleMerchant = eligibleMerchants.length === 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Crown className="h-6 w-6 text-yellow-600" />
            </div>
            <DialogTitle className="text-xl">Promote to Super Merchant</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="space-y-2 text-left">
              {hasNoEligibleMerchants ? (
                <div className="flex items-start gap-2 py-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">No merchants available</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {subscriberName} has no merchant accounts, or all their merchants are already Super Merchants.
                      They need at least one merchant account to promote.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p>
                    Select a merchant account to promote to Super Merchant for{' '}
                    <strong className="text-gray-900">{subscriberName}</strong>.
                  </p>
                  <p className="text-sm text-gray-500">
                    Only the selected merchant will become a Super Merchant. Other merchant accounts under this user
                    will remain regular merchants.
                  </p>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {!hasNoEligibleMerchants && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Merchant</Label>
              <Select
                value={selectedMerchantId}
                onValueChange={setSelectedMerchantId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a merchant to promote" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleMerchants.map((m) => (
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
            {hasNoEligibleMerchants ? 'Close' : 'Cancel'}
          </Button>
          {!hasNoEligibleMerchants && (
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || !(selectedMerchantId || hasSingleMerchant)}
              className="bg-yellow-600 text-white hover:bg-yellow-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Promoting...
                </>
              ) : (
                'Promote to Super Merchant'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
