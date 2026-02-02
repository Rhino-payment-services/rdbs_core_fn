"use client"

import React from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Crown, AlertTriangle, Loader2 } from 'lucide-react'

interface SuperMerchantConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'promote' | 'revoke'
  merchantName: string
  ownerName?: string
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

export const SuperMerchantConfirmModal: React.FC<SuperMerchantConfirmModalProps> = ({
  open,
  onOpenChange,
  action,
  merchantName,
  ownerName,
  onConfirm,
  isLoading = false,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const loading = isLoading || isSubmitting

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPromote = action === 'promote'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isPromote ? 'bg-yellow-100' : 'bg-red-100'}`}>
              {isPromote ? (
                <Crown className="h-6 w-6 text-yellow-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <AlertDialogTitle className="text-xl">
              {isPromote ? 'Promote to Super Merchant' : 'Revoke Super Merchant Status'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-left">
              {isPromote ? (
                <>
                  <p>
                    You are about to promote <strong className="text-gray-900">{merchantName}</strong>
                    {ownerName && (
                      <span> (Owner: {ownerName})</span>
                    )}{' '}
                    to Super Merchant status.
                  </p>
                  <p className="text-sm text-gray-500">
                    As a Super Merchant, they will be able to view financial performance of all businesses assigned under them. You can assign other merchants to them after promotion.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    You are about to revoke Super Merchant status for <strong className="text-gray-900">{merchantName}</strong>.
                  </p>
                  <p className="text-sm text-amber-600">
                    Note: All child merchants must be unassigned first before revoking.
                  </p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2 sm:gap-2 sm:justify-end">
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={isPromote ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-red-600 text-white hover:bg-red-700'}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isPromote ? 'Promoting...' : 'Revoking...'}
              </>
            ) : (
              isPromote ? 'Promote to Super Merchant' : 'Revoke Status'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
