import type { ReactNode } from 'react'

export interface TransactionTableRowProps {
  transaction: any
  onViewTransaction: (transaction: any) => void
  onViewApiLogs: (transaction: any) => void
  onManualStatusCheck: (transaction: any) => void
  onReverseTransaction: (transaction: any) => void
}

export interface TransactionDerived {
  metadata: Record<string, any>
  senderMeta: Record<string, any>
  receiverMeta: Record<string, any>
  recipientWalletType: string | null
  isBusinessLikeRecipientWallet: boolean
  resolvedPartner: any
  resolvedPartnerCode: string | null
  resolvedPartnerName: string | null
  /** External payment rail partner (e.g. MTN/Airtel/ABC) for the Partner column. */
  paymentPartnerLabel?: string
  /** Optional tooltip for the payment partner label. */
  paymentPartnerTitle?: string
  hasPartnerSignal: any
  isPartnerSubscriberWithdraw: boolean
}

export interface PartyDisplayProps {
  info: any
  nameClassName?: string
  extras?: ReactNode
}
