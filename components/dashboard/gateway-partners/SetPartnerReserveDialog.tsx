"use client"

import React from 'react'
import { WalletFreezeDialog } from '@/components/dashboard/wallets/WalletFreezeDialog'

interface SetPartnerReserveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partnerId: string
  partnerName: string
  currentBalance: number
  currentReserve: number
  currency?: string
  walletId?: string
  onSuccess?: () => void
  setReserveMutation: {
    mutateAsync: (payload: {
      partnerId: string
      amount: number
      reason: string
      reference?: string
      walletId?: string
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
  walletId,
  onSuccess,
  setReserveMutation,
}) => {
  return (
    <WalletFreezeDialog
      open={open}
      onOpenChange={onOpenChange}
      subjectLabel={`ESCROW wallet for ${partnerName}`}
      currentBalance={currentBalance}
      currentFrozen={currentReserve}
      currency={currency}
      variant="reserve"
      isPending={setReserveMutation.isPending}
      onSubmit={async (payload) => {
        await setReserveMutation.mutateAsync({
          partnerId,
          amount: payload.amount,
          reason: payload.reason,
          reference: payload.reference,
          walletId,
        })
        onSuccess?.()
      }}
    />
  )
}
