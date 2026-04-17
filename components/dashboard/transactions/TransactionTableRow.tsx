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
  const txMeta = transaction.metadata || {}
  const bulkQueuePosition =
    txMeta.bulkQueuePosition ??
    txMeta.queuePosition ??
    txMeta.queueIndex
  const hasDebitAudit = txMeta.debitAppliedAt || txMeta.debitAmount != null
  const hasRefundAudit = txMeta.refundAppliedAt || txMeta.refundAmount != null

  return (
    <TableRow key={transaction.id}>
      <TableCell className="font-medium font-mono text-sm" title={transaction.reference || transaction.id}>
        <div className="flex flex-col">
          <span>{shortenTransactionId(transaction.reference || transaction.id)}</span>
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

  // ApiPartner: the business/company that uses RukaPay's rails (integrated via API key).
  // This drives the Sender column for API-initiated transactions.
  const resolvedPartner = transaction.partner || null

  // ExternalPaymentPartner: the payment rail/gateway RukaPay routes through (MTN, Airtel, ABC bank).
  // Accessed only via transaction.partnerMapping?.partner — used solely for paymentPartnerLabel below.
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

  const paymentPartnerFromMapping = extPaymentPartner
    ? (() => {
        const code = String(extPaymentPartner.partnerCode || '').trim()
        if (code && !isNumericLikePartnerCode(code)) return code.toUpperCase()
        const name = String(extPaymentPartner.partnerName || '').trim()
        if (!name) return null
        const upperName = name.toUpperCase()
        if (upperName.includes('ABC')) return 'ABC'
        if (upperName.includes('PEGASUS')) return 'PEGASUS'
        if (upperName.includes('AIRTEL')) return 'AIRTEL'
        if (upperName.includes('MTN')) return 'MTN'
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

  /** Bill payments where the executing partner is on metadata (e.g. Africa's Talking airtime). */
  const paymentPartnerFromExecutedBillMetadata = (() => {
    if (transaction.type !== 'BILL_PAYMENT') return null
    const code = String(metadata.partnerCode || '').trim()
    const atRef =
      String(transaction.externalReference || '').startsWith('ATQid_') ||
      String(transaction.externalReference || '').startsWith('ATPid_')
    if ((!code || isNumericLikePartnerCode(code)) && !atRef) return null
    const util = metadata.utilityProvider
    const pt = metadata.payment_type
    const isAirtimeOrData =
      util === 'AIRTIME' ||
      util === 'DATA_BUNDLES' ||
      pt === 'airtime' ||
      pt === 'mobile_data'
    if (!isAirtimeOrData) return null

    const codeUpper = (code || (atRef ? 'AFRICASTALKING' : '')).toUpperCase()
    if (!codeUpper || isNumericLikePartnerCode(codeUpper)) return null
    return codeUpper
  })()

  const paymentPartnerLabel =
    paymentPartnerFromExecutedBillMetadata ||
    paymentPartnerFromMapping ||
    paymentPartnerFromMno ||
    paymentPartnerFromBank ||
    null

  const paymentPartnerTitle = (() => {
    if (paymentPartnerFromExecutedBillMetadata) {
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
      const codeDisp = (code || paymentPartnerFromExecutedBillMetadata).toUpperCase()
      const base = name ? `${name} (${codeDisp})` : codeDisp
      return [base, product].filter(Boolean).join(' · ')
    }
    if (paymentPartnerFromMapping && extPaymentPartner?.partnerCode) {
      return `${extPaymentPartner.partnerName || extPaymentPartner.partnerCode} (${extPaymentPartner.partnerCode})`
    }
    return paymentPartnerLabel || undefined
  })()

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
