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
  isPlatformRevenueLiquidationTx,
} from '@/lib/utils/transactions'
import {
  isOwnWalletTransfer,
  normalizeOwnWalletReference,
} from '@/lib/utils/transactionPartyClassification'
import {
  hasPartnerApprovalSignal,
  isPartnerSubscriberWithdraw,
  resolvePaymentPartnerLabel,
} from './partyResolver'
import { SenderCell } from './SenderCell'
import { ReceiverCell } from './ReceiverCell'
import { RukapayFeeCell, PartnerFeeCell, NetAmountCell } from './FeeCell'
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
  const displayReference = isOwnWalletTransfer(transaction)
    ? normalizeOwnWalletReference(transaction.reference)
    : transaction.reference
  const txMeta = transaction.metadata || {}
  const bulkQueuePosition =
    txMeta.bulkQueuePosition ??
    txMeta.queuePosition ??
    txMeta.queueIndex
  const hasDebitAudit = txMeta.debitAppliedAt || txMeta.debitAmount != null
  const hasRefundAudit = txMeta.refundAppliedAt || txMeta.refundAmount != null

  return (
    <TableRow key={transaction.id}>
      <TableCell className="font-medium font-mono text-sm" title={displayReference || transaction.id}>
        <div className="flex flex-col">
          <span>{shortenTransactionId(displayReference || transaction.id)}</span>
          {(bulkQueuePosition != null || hasDebitAudit || hasRefundAudit) && (
            <span className="text-[10px] text-gray-500 mt-0.5">
              {bulkQueuePosition != null ? `Q#${String(bulkQueuePosition)} ` : ''}
              {hasDebitAudit ? 'Debited ' : ''}
              {hasRefundAudit ? 'Refunded' : ''}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {isPlatformRevenueLiquidationTx(transaction) ? (
          <span
            className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium"
            title="Fee revenue settled from the consolidated platform revenue wallet"
          >
            Platform revenue
          </span>
        ) : paymentPartnerLabel ? (
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
      <PartnerFeeCell transaction={transaction} />
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

  // ApiPartner: the business/company that uses RukaPay's rails (integrated via API key).
  const resolvedPartner = transaction.partner || null

  // ExternalPaymentPartner: the payment rail/gateway RukaPay routes through (MTN, Airtel, ABC bank).
  const extPaymentPartner = transaction.partnerMapping?.partner || null

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

  const paymentPartnerLabel = resolvePaymentPartnerLabel(transaction)

  const paymentPartnerTitle = (() => {
    if (!paymentPartnerLabel) return undefined
    const fromExecutedBill =
      String(metadata.utilityProvider || '').toUpperCase() === 'AIRTIME' ||
      String(metadata.utilityProvider || '').toUpperCase() === 'DATA_BUNDLES' ||
      metadata.payment_type === 'airtime' ||
      metadata.payment_type === 'mobile_data'
    if (fromExecutedBill) {
      const code = String(metadata.partnerCode || '').trim()
      const name = String(metadata.partnerName || '').trim()
      const pt = metadata.payment_type
      const util = metadata.utilityProvider
      const product =
        pt === 'airtime' || util === 'AIRTIME'
          ? 'Airtime'
          : pt === 'mobile_data' || util === 'DATA_BUNDLES'
            ? 'Mobile data'
            : ''
      const codeDisp = (code || paymentPartnerLabel).toUpperCase()
      const base = name ? `${name} (${codeDisp})` : codeDisp
      return [base, product].filter(Boolean).join(' · ')
    }
    const code = String(metadata.partnerCode || '').trim()
    if (code && paymentPartnerLabel === code.toUpperCase()) {
      const name = String(metadata.partnerName || '').trim()
      return name ? `${name} (${paymentPartnerLabel})` : paymentPartnerLabel
    }
    if (extPaymentPartner?.partnerCode && paymentPartnerLabel) {
      return `${extPaymentPartner.partnerName || extPaymentPartner.partnerCode} (${extPaymentPartner.partnerCode})`
    }
    return paymentPartnerLabel
  })()

  const hasPartnerSignal = hasPartnerApprovalSignal(transaction)

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
    isPartnerSubscriberWithdraw: isPartnerSubscriberWithdraw(transaction),
  }
}
