"use client"

import { TableCell } from '@/components/ui/table'
import { getDisplayName, getContactInfo } from '@/lib/utils/transactions'
import { PartyDisplay } from './PartyDisplay'
import type { TransactionDerived } from './types'
import { getPartnerRole, normalizePartyInfoForDisplay, resolvePartnerDisplay } from './partyResolver'

interface SenderCellProps {
  transaction: any
  derived: TransactionDerived
}

type BadgeType = 'MERCHANT' | 'ADMIN' | 'SUBSCRIBER' | 'PARTNER' | 'EXTERNAL_MNO' | 'EXTERNAL_BANK' | null

const BADGE_LABELS: Record<Exclude<BadgeType, null>, string> = {
  MERCHANT: '🏦 Merchant Account',
  ADMIN: '👨‍💼 Admin Funding',
  PARTNER: 'API Partner',
  SUBSCRIBER: '🏦 RukaPay Subscriber',
  EXTERNAL_MNO: '📱 Mobile Money',
  EXTERNAL_BANK: '🏦 Bank',
}

function getBadgeColor(type: BadgeType): string {
  if (type === 'ADMIN') return 'text-purple-600'
  if (type === 'MERCHANT' || type === 'SUBSCRIBER' || type === 'PARTNER') return 'text-blue-600'
  return 'text-gray-500'
}

export const SenderCell = ({ transaction, derived }: SenderCellProps) => {
  const { metadata, senderMeta, resolvedPartner, resolvedPartnerName } = derived

  if (transaction.type === 'REVERSAL') {
    return (
      <TableCell>
        <div className="flex flex-col gap-[0.5px]">
          <span className="font-medium text-orange-600">System Reversal</span>
          <span className="text-xs text-gray-500">
            Reversing {metadata.originalTransactionReference || metadata.originalTransactionId?.substring(0, 8) || 'N/A'}
          </span>
          <span className="text-xs text-orange-600 font-medium">🔄 Reversal</span>
        </div>
      </TableCell>
    )
  }

  const isSweep = metadata?.sweepToDisbursement || metadata?.sweepFromCollection
  const debitLabel = isSweep && (metadata?.debitWalletType || 'Collection')

  // Prefer API-provided senderInfo when available (backend builds correct sender/receiver for SCHOOL_FEES etc.)
  if (transaction.senderInfo) {
    const senderInfo = normalizePartyInfoForDisplay(transaction.senderInfo, transaction, 'sender')
    return (
      <TableCell>
        <div className="flex flex-col gap-[0.5px]">
          <PartyDisplay
            info={senderInfo}
            nameClassName={senderInfo.type === 'ADMIN' ? 'text-purple-900' : ''}
          />
          {debitLabel && (
            <span className="text-xs text-amber-700 font-medium">Debited: {metadata.debitWalletType || 'Collection'} wallet</span>
          )}
        </div>
      </TableCell>
    )
  }

  // If this is an API-driven transaction and the partner is the sender-side actor,
  // always show the partner name + contact (do not fall back to subscriber phone as name).
  if (getPartnerRole(transaction) === 'sender') {
    const { primary, secondary } = resolvePartnerDisplay(transaction)
    return (
      <TableCell>
        <div className="flex flex-col gap-[0.5px]">
          <span className="font-medium">{primary}</span>
          {secondary && <span className="text-xs text-gray-500">📱 {secondary}</span>}
          <span className="text-xs text-blue-600 font-medium">API Partner</span>
          {debitLabel && (
            <span className="text-xs text-amber-700 font-medium">Debited: {metadata.debitWalletType || 'Collection'} wallet</span>
          )}
        </div>
      </TableCell>
    )
  }

  return (
    <TableCell>
      <div className="flex flex-col gap-[0.5px]">
        <LegacySenderDisplay transaction={transaction} derived={derived} />
        {debitLabel && (
          <span className="text-xs text-amber-700 font-medium">Debited: {metadata.debitWalletType || 'Collection'} wallet</span>
        )}
      </div>
    </TableCell>
  )
}

function LegacySenderDisplay({ transaction, derived }: SenderCellProps) {
  const { metadata, senderMeta, resolvedPartner, resolvedPartnerName, isPartnerSubscriberWithdraw, hasPartnerSignal } = derived

  const isAdminFunding = transaction.type === 'DEPOSIT' && metadata.fundedByAdmin
  const isDebit = transaction.direction === 'DEBIT'

  const hasMerchantAssociation =
    transaction.wallet?.merchant?.businessTradeName ||
    transaction.user?.merchantCode ||
    transaction.user?.merchant?.businessTradeName ||
    transaction.user?.merchants?.length ||
    senderMeta.merchantName ||
    senderMeta.merchantCode
  const isMerchantSender = isDebit && !!hasMerchantAssociation

  const isQrPayment =
    (transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) &&
    (metadata.merchantCode || metadata.merchantName || metadata.isPublicPayment)

  let name: string = ''
  let contact: string | null = null
  let merchantCode: string | null = null
  let badgeType: BadgeType = null

  if (isAdminFunding) {
    name = metadata.adminName || 'Admin User'
    contact = metadata.adminPhone || metadata.adminEmail || null
    badgeType = 'ADMIN'
  } else if (isPartnerSubscriberWithdraw && hasPartnerSignal) {
    // Partner-initiated subscriber withdrawal: sender is the API partner company.
    name =
      metadata.apiPartnerName ||
      resolvedPartnerName ||
      transaction.partner?.partnerName ||
      transaction.partner?.partnerCode ||
      'API Partner'
    contact =
      transaction.partner?.contactPhone ||
      metadata.partnerPhone ||
      metadata.partnerContact ||
      transaction.partner?.partnerCode ||
      null
    badgeType = 'PARTNER'
  } else if (transaction.type === 'DEPOSIT' && (resolvedPartner || transaction.partner || metadata.apiPartnerName || metadata.isApiPartnerTransaction)) {
    name = resolvedPartnerName || metadata.apiPartnerName || transaction.partner?.partnerName || 'API Partner'
    contact = resolvedPartner?.contactPhone || transaction.partner?.contactPhone || metadata.partnerContact || resolvedPartner?.contactEmail || transaction.partner?.contactEmail || null
    badgeType = 'PARTNER'
  } else if (isQrPayment && !isDebit) {
    name = metadata.customerName || metadata.userName || 'Customer'
    contact = metadata.customerPhone || metadata.phoneNumber || null
    badgeType = 'EXTERNAL_MNO'
  } else if (isDebit) {
    name = getDisplayName(transaction.user, transaction.metadata, transaction.counterpartyUser, transaction.wallet)
    contact = !isMerchantSender
      ? getContactInfo(transaction.user, senderMeta, transaction.counterpartyUser)
      : null
    if (contact === 'N/A') contact = null
    merchantCode =
      (isMerchantSender ? senderMeta.merchantCode : null) ||
      transaction.wallet?.merchant?.merchantCode ||
      transaction.user?.merchantCode ||
      null
    badgeType = isMerchantSender ? 'MERCHANT' : transaction.user?.userType === 'SUBSCRIBER' ? 'SUBSCRIBER' : null
  } else {
    contact =
      transaction.counterpartyUser?.phone ||
      metadata.customerPhone ||
      metadata.phoneNumber ||
      metadata.recipientPhone ||
      null
    if (transaction.type === 'MERCHANT_TO_WALLET' || transaction.type?.includes('MERCHANT_TO_WALLET')) {
      name = metadata.merchantName || metadata.counterpartyInfo?.name || getDisplayName(transaction.user, transaction.metadata, transaction.counterpartyUser)
      merchantCode = metadata.merchantCode || null
      badgeType = 'MERCHANT'
    } else if (transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) {
      name = metadata.mnoProvider ? `${metadata.mnoProvider} Mobile Money` : (metadata.userName || metadata.phoneNumber || 'Mobile Money')
      contact = metadata.phoneNumber || null
      badgeType = metadata.mnoProvider ? 'EXTERNAL_MNO' : null
    } else if (transaction.type === 'WALLET_TO_WALLET' || transaction.counterpartyUser || transaction.counterpartyId) {
      name = transaction.counterpartyUser?.profile?.firstName && transaction.counterpartyUser?.profile?.lastName
        ? `${transaction.counterpartyUser.profile.firstName} ${transaction.counterpartyUser.profile.lastName}`
        : metadata.counterpartyInfo?.name || metadata.userName || 'RukaPay User'
      badgeType = 'SUBSCRIBER'
    } else if (metadata.counterpartyInfo?.name) {
      name = metadata.counterpartyInfo.name
      badgeType = null
    } else {
      name = getDisplayName(transaction.user, transaction.metadata, transaction.counterpartyUser, transaction.wallet)
    }
  }

  const badgeLabel = badgeType ? BADGE_LABELS[badgeType] : null

  return (
    <>
      <span className={`font-medium capitalize ${isAdminFunding ? 'text-purple-900' : ''}`}>
        {name}
      </span>
      {contact && (
        <span className="text-xs text-gray-500">📱 {contact}</span>
      )}
      {merchantCode && (
        <span className="text-xs text-gray-500">🏪 Code: {merchantCode}</span>
      )}
      {badgeLabel && (
        <span className={`text-xs font-medium ${getBadgeColor(badgeType)}`}>
          {badgeLabel}
        </span>
      )}
    </>
  )
}
