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
      <TableCell className="font-medium">
        {(() => {
          const metadata = transaction.metadata || {}
          // For internal sweeps/liquidate, always show the GROSS amount (what user entered)
          if (metadata.sweepToDisbursement || metadata.sweepFromCollection) {
            const gross = (metadata.grossAmount ?? Number(transaction.amount)) || 0
            return formatAmount(gross)
          }
          return formatAmount(Number(transaction.amount))
        })()}
      </TableCell>
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
  const isNumericLikePartnerCode = (value: any): boolean => {
    const s = String(value || '').trim()
    if (!s) return false
    // Phone-like / numeric identifiers should not be preferred as a partner label.
    return /^\+?\d[\d\s-]{5,}$/.test(s)
  }

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

  // Partner column must represent the external payment rail (e.g. MTN/Airtel/ABC),
  // NOT the API (gateway) partner company initiating the transaction.
  //
  // So we only derive it from:
  // - partnerMapping.partner (external payment partners like ABC, Pegasus, etc)
  // - MNO/bank metadata for MNO/BANK transactions
  const rawMnoProvider =
    metadata.mnoProvider ||
    metadata.network ||
    metadata.operator ||
    metadata.counterpartyInfo?.provider ||
    metadata.counterpartyInfo?.providerName ||
    metadata.counterpartyInfo?.mnoProvider ||
    null

  const paymentPartnerFromMapping = transaction.partnerMapping?.partner
    ? (() => {
        const p = transaction.partnerMapping.partner
        const name = String(p?.partnerName || '').trim()
        const code = String(p?.partnerCode || '').trim()
        if (!name) return code && !isNumericLikePartnerCode(code) ? code : null
        // Prefer a short label in the table (e.g. "ABC Payment Services" -> "ABC")
        const upperName = name.toUpperCase()
        if (upperName.includes('ABC')) return 'ABC'
        if (upperName.includes('PEGASUS')) return 'PEGASUS'
        if (upperName.includes('AIRTEL')) return 'AIRTEL'
        if (upperName.includes('MTN')) return 'MTN'
        if (code && !isNumericLikePartnerCode(code)) return code
        const firstToken = name.split(/\s+/)[0]
        return firstToken ? firstToken.toUpperCase() : name
      })()
    : null

  const counterpartyName = String(metadata.counterpartyInfo?.name || '')
  const paymentPartnerFromMnoName =
    counterpartyName.toLowerCase().includes('mobile money') ? counterpartyName : null

  const normalizeMno = (label: string) =>
    label
      .replace(/\s*mobile money\s*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const paymentPartnerFromMno =
    (paymentPartnerFromMnoName ? normalizeMno(paymentPartnerFromMnoName) : null) ||
    (rawMnoProvider ? normalizeMno(String(rawMnoProvider)) : null)

  const paymentPartnerFromBank =
    metadata.bankName ||
    metadata.bank ||
    metadata.counterpartyInfo?.bankName ||
    metadata.counterpartyInfo?.bank ||
    null

  const paymentPartnerLabel =
    paymentPartnerFromMapping ||
    paymentPartnerFromMno ||
    paymentPartnerFromBank ||
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
