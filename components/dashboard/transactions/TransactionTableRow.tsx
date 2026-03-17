"use client"

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  shortenTransactionId,
  formatAmount,
  formatDate,
  getStatusBadgeConfig,
  getTypeDisplay,
  getChannelDisplay,
} from '@/lib/utils/transactions'
import { SenderCell } from './SenderCell'
import { ReceiverCell } from './ReceiverCell'
import { RukapayFeeCell, NetAmountCell } from './FeeCell'
import { ActionCell } from './ActionCell'
import type { TransactionTableRowProps, TransactionDerived } from './types'

export type { TransactionTableRowProps }

export const TransactionTableRow = ({
  transaction,
  onViewTransaction,
  onViewApiLogs,
  onManualStatusCheck,
  onReverseTransaction
}: TransactionTableRowProps) => {
  const derived = useTransactionDerived(transaction)
  const { paymentPartnerLabel, paymentPartnerTitle } = derived

  return (
    <TableRow key={transaction.id}>
      <TableCell className="font-medium font-mono text-sm" title={transaction.reference || transaction.id}>
        {shortenTransactionId(transaction.reference || transaction.id)}
      </TableCell>
      <TableCell>
        {paymentPartnerLabel ? (
          <span
            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
            title={paymentPartnerTitle}
          >
            {paymentPartnerLabel}
          </span>
        ) : (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">Direct</span>
        )}
      </TableCell>
      <TableCell>{getTypeDisplay(transaction.type, transaction.direction, transaction)}</TableCell>
      <ChannelCell transaction={transaction} />
      <SenderCell transaction={transaction} derived={derived} />
      <ReceiverCell transaction={transaction} derived={derived} />
      <TableCell className="font-medium">{formatAmount(Number(transaction.amount))}</TableCell>
      <RukapayFeeCell transaction={transaction} />
      <NetAmountCell transaction={transaction} />
      <StatusCell transaction={transaction} />
      <TableCell className="text-sm">{formatDate(transaction.createdAt)}</TableCell>
      <ActionCell
        transaction={transaction}
        onViewTransaction={onViewTransaction}
        onViewApiLogs={onViewApiLogs}
        onManualStatusCheck={onManualStatusCheck}
        onReverseTransaction={onReverseTransaction}
      />
    </TableRow>
  )
}

function ChannelCell({ transaction }: { transaction: any }) {
  const channelInfo = getChannelDisplay(transaction.channel, transaction.metadata)
  const ChannelIcon = channelInfo.icon
  return (
    <TableCell>
      <Badge className={`${channelInfo.bgColor} ${channelInfo.color} border flex items-center gap-1.5 px-2 py-1`}>
        <ChannelIcon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{channelInfo.label}</span>
      </Badge>
    </TableCell>
  )
}

function StatusCell({ transaction }: { transaction: any }) {
  const statusConfig = getStatusBadgeConfig(transaction.status)
  return (
    <TableCell>
      <Badge className={`${statusConfig.color} border`}>{statusConfig.label}</Badge>
    </TableCell>
  )
}

function useTransactionDerived(transaction: any): TransactionDerived {
  const metadata = transaction.metadata || {}

  const recipientWalletType =
    transaction.wallet?.walletType ||
    metadata.recipientWalletType ||
    metadata.walletType ||
    transaction.user?.walletType ||
    null

  const isBusinessLikeRecipientWallet =
    recipientWalletType === 'BUSINESS' || recipientWalletType === 'ESCROW' || recipientWalletType === 'PARTNER'

  const senderMeta = (() => {
    if (transaction.direction !== 'DEBIT') return metadata
    if (transaction.wallet?.walletType !== 'PERSONAL') return metadata
    if (transaction.type?.includes('MERCHANT')) return metadata
    const m = { ...metadata }
    delete m.merchantName
    delete m.merchantCode
    return m
  })()

  const receiverMeta = (() => {
    if (transaction.direction !== 'DEBIT') return metadata
    const m = { ...metadata }
    delete m.merchantName
    delete m.merchantCode
    delete m.senderName
    return m
  })()

  const resolvedPartner = transaction.partnerMapping?.partner || transaction.partner || null
  const resolvedPartnerCode =
    resolvedPartner?.partnerCode ||
    metadata.partnerCode ||
    metadata.apiPartnerName ||
    metadata.partnerName ||
    null
  const resolvedPartnerName =
    resolvedPartner?.partnerName ||
    metadata.apiPartnerName ||
    metadata.partnerName ||
    null

  // Partner column should represent the external payment rail partner (e.g. MTN/Airtel/ABC),
  // NOT the API (gateway) partner company initiating the transaction.
  const apiPartnerName = metadata.apiPartnerName || transaction.partner?.partnerName || null
  const rawMnoProvider =
    metadata.mnoProvider ||
    metadata.network ||
    metadata.operator ||
    metadata.counterpartyInfo?.provider ||
    metadata.counterpartyInfo?.providerName ||
    null

  const paymentPartnerFromMapping = transaction.partnerMapping?.partner
    ? (transaction.partnerMapping.partner.partnerName || transaction.partnerMapping.partner.partnerCode || null)
    : null

  const paymentPartnerFromMno = rawMnoProvider ? `${rawMnoProvider} Mobile Money` : null

  const paymentPartnerFromMetadata =
    metadata.partnerCode && metadata.partnerCode !== apiPartnerName ? String(metadata.partnerCode) : null

  const paymentPartnerLabel =
    paymentPartnerFromMapping ||
    paymentPartnerFromMno ||
    paymentPartnerFromMetadata ||
    null

  const paymentPartnerTitle =
    paymentPartnerFromMapping && transaction.partnerMapping?.partner?.partnerCode
      ? `${transaction.partnerMapping.partner.partnerName || transaction.partnerMapping.partner.partnerCode} (${transaction.partnerMapping.partner.partnerCode})`
      : paymentPartnerLabel || undefined

  const hasPartnerSignal =
    transaction.partnerId ||
    resolvedPartner ||
    metadata.partnerId ||
    metadata.isApiPartnerTransaction ||
    metadata.apiPartnerName

  const isPartnerSubscriberWithdraw =
    transaction.type === 'WITHDRAWAL' &&
    transaction.direction === 'DEBIT' &&
    metadata.mode === 'WITHDRAW' &&
    !!hasPartnerSignal

  return {
    metadata,
    senderMeta,
    receiverMeta,
    recipientWalletType,
    isBusinessLikeRecipientWallet,
    resolvedPartner,
    resolvedPartnerCode,
    resolvedPartnerName,
    paymentPartnerLabel: paymentPartnerLabel || undefined,
    paymentPartnerTitle,
    hasPartnerSignal,
    isPartnerSubscriberWithdraw,
  }
}
