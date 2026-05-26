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
  const txType = String(transaction.type || '').toUpperCase()

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

  const isSweep =
    metadata?.sweepToDisbursement ||
    metadata?.sweepFromCollection ||
    metadata?.internalWalletTransfer ||
    (transaction.reference && String(transaction.reference).startsWith('SWEEP_'))
  const debitLabel = isSweep && (metadata?.debitWalletType || 'Collection')

  if (isSweep) {
    const business =
      String(metadata?.merchantName || '').trim() ||
      transaction.wallet?.merchant?.businessTradeName ||
      transaction.user?.merchants?.find(
        (m: { merchantCode?: string }) =>
          m?.merchantCode && m.merchantCode === metadata?.merchantCode,
      )?.businessTradeName ||
      transaction.user?.merchant?.businessTradeName ||
      'Merchant'
    const direction = String(transaction.direction || '').toUpperCase()
    const name =
      direction === 'DEBIT'
        ? business
        : `${String(metadata?.debitWalletType || 'Collection').trim()} wallet`
    return (
      <TableCell>
        <div className="flex flex-col gap-[0.5px]">
          <span className="font-medium">{name}</span>
          {debitLabel && (
            <span className="text-xs text-amber-700 font-medium">
              Debited: {metadata.debitWalletType || 'Collection'} wallet
            </span>
          )}
        </div>
      </TableCell>
    )
  }

  // LIQUIDATION: always show API partner + which SACCO (institution) — do not fall through to phone-only partner row.
  if (String(transaction.type || '').toUpperCase() === 'LIQUIDATION') {
    const m = metadata || {}
    const base = transaction.senderInfo || {}
    const code = String(
      base.institutionCode ||
      m.nexenInstitutionCode ||
      m.partnerInstitutionCode ||
      m.institutionCode ||
      m.saccoCode ||
      m.organizationCode ||
      transaction.partnerInstitution?.code ||
      transaction.wallet?.partnerInstitution?.code ||
      ''
    ).trim()
    const instName = String(
      base.institutionName ||
      m.nexenInstitutionName ||
      m.partnerInstitutionName ||
      m.institutionName ||
      m.saccoName ||
      m.organizationName ||
      transaction.partnerInstitution?.name ||
      transaction.wallet?.partnerInstitution?.name ||
      ''
    ).trim()
    const institutionLine =
      base.institutionLine ||
      ([code && `Code ${code}`, instName].filter(Boolean).join(' · ') || undefined)
    const institutionDisplayName =
      instName ||
      (code ? `Code ${code}` : '') ||
      String(base.name || '').trim() ||
      'SACCO settlement wallet'
    const partnerName = String(
      base.partnerName ||
      transaction.partner?.partnerName ||
      transaction.wallet?.partner?.partnerName ||
      m.apiPartnerName ||
      m.partnerName ||
      ''
    ).trim()

    const liquidInfo = normalizePartyInfoForDisplay(
      {
        ...base,
        name: institutionDisplayName,
        contact: null,
        type: 'PARTNER_INSTITUTION',
        partnerName: partnerName || null,
        institutionCode: base.institutionCode ?? (code || null),
        institutionName: base.institutionName ?? (instName || null),
        institutionLine,
      },
      transaction,
      'sender'
    )
    return (
      <TableCell>
        <div className="flex flex-col gap-[0.5px]">
          <PartyDisplay info={liquidInfo} />
          {debitLabel && (
            <span className="text-xs text-amber-700 font-medium">Debited: {metadata.debitWalletType || 'Collection'} wallet</span>
          )}
        </div>
      </TableCell>
    )
  }

  // Prefer API-provided senderInfo when available (backend builds correct sender/receiver for SCHOOL_FEES etc.)
  if (transaction.senderInfo) {
    const trustApiCollectSender =
      getPartnerRole(transaction) === 'receiver' &&
      transaction.senderInfo.type === 'EXTERNAL_MNO' &&
      String(transaction.senderInfo.name || '').trim()
    const senderInfo = trustApiCollectSender
      ? {
          ...transaction.senderInfo,
          contact:
            transaction.senderInfo.contact ||
            metadata?.customerPhone ||
            metadata?.phoneNumber ||
            null,
        }
      : normalizePartyInfoForDisplay(transaction.senderInfo, transaction, 'sender')
    const isPlatformRevenue =
      metadata?.withdrawalType === 'PLATFORM_REVENUE_LIQUIDATION' ||
      transaction.platformRevenueSettlement === true ||
      senderInfo.platformRevenueSettlement === true
    return (
      <TableCell>
        <div className="flex flex-col gap-[0.5px]">
          <PartyDisplay
            info={senderInfo}
            nameClassName={senderInfo.type === 'ADMIN' ? 'text-purple-900' : ''}
          />
          {isPlatformRevenue && (
            <span className="text-xs text-indigo-700 font-medium">Platform revenue wallet</span>
          )}
          {debitLabel && (
            <span className="text-xs text-amber-700 font-medium">Debited: {metadata.debitWalletType || 'Collection'} wallet</span>
          )}
        </div>
      </TableCell>
    )
  }

  // Partner-institution debit leg without senderInfo: derive SACCO from metadata.
  if (txType === 'PARTNER_INSTITUTION_TO_WALLET') {
    const code = String(
      metadata?.nexenInstitutionCode ||
      metadata?.partnerInstitutionCode ||
      metadata?.institutionCode ||
      metadata?.saccoCode ||
      metadata?.organizationCode ||
      ''
    ).trim()
    const instName = String(
      metadata?.nexenInstitutionName ||
      metadata?.partnerInstitutionName ||
      metadata?.institutionName ||
      metadata?.saccoName ||
      metadata?.organizationName ||
      ''
    ).trim()
    const partnerName = String(
      metadata?.apiPartnerName ||
      metadata?.partnerName ||
      transaction?.partner?.partnerName ||
      ''
    ).trim()

    const syntheticInfo = normalizePartyInfoForDisplay(
      {
        name: instName || (code ? `Code ${code}` : 'SACCO settlement wallet'),
        contact: transaction?.partner?.contactPhone || transaction?.partner?.contactEmail || null,
        type: 'PARTNER_INSTITUTION',
        partnerName: partnerName || null,
        institutionCode: code || null,
        institutionName: instName || null,
        institutionLine: [code && `Code ${code}`, instName].filter(Boolean).join(' · ') || null,
      },
      transaction,
      'sender'
    )
    return (
      <TableCell>
        <div className="flex flex-col gap-[0.5px]">
          <PartyDisplay info={syntheticInfo} />
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

  // A subscriber who also owns a merchant account has user-level merchant associations
  // (merchantCode, merchant, merchants). When they transact from their PERSONAL wallet
  // those associations must NOT cause the row to show the merchant as the sender.
  // senderMeta already strips merchantName/merchantCode from metadata for PERSONAL wallets,
  // but the user-level checks below would still fire. Guard against that explicitly.
  const walletType = (transaction.wallet?.walletType || '').toUpperCase()
  const isPersonalWallet = walletType === 'PERSONAL'
  const hasMerchantAssociation =
    (!isPersonalWallet && (
      transaction.wallet?.merchant?.businessTradeName ||
      transaction.user?.merchantCode ||
      transaction.user?.merchant?.businessTradeName ||
      (transaction.user?.merchants?.length > 0)
    )) ||
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
    if (isPersonalWallet) {
      // Personal wallet: always use the user's personal (subscriber) identity.
      // getDisplayName() checks user.merchantCode and would return the business name for
      // users who also own a merchant account — bypass it entirely here.
      const p = transaction.user?.profile
      name = (p?.firstName && p?.lastName)
        ? `${p.firstName} ${p.lastName}`
        : transaction.user?.phone || transaction.user?.email || 'RukaPay User'
      contact = transaction.user?.phone || null
      if (contact === 'N/A') contact = null
      badgeType = transaction.user?.userType === 'SUBSCRIBER' ? 'SUBSCRIBER' : null
    } else {
      name = getDisplayName(
        transaction.user,
        transaction.metadata,
        transaction.counterpartyUser,
        transaction.wallet,
        transaction,
        'sender',
      )
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
    }
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
      const payerName = String(metadata.customerName || metadata.payerName || '').trim()
      const portalUser = String(metadata.userName || '').trim().toLowerCase()
      const looksLikeOwner =
        payerName &&
        portalUser &&
        (payerName.toLowerCase() === portalUser ||
          portalUser.startsWith(payerName.toLowerCase()))
      name =
        (payerName && !looksLikeOwner ? payerName : null) ||
        (metadata.mnoProvider ? `${metadata.mnoProvider} Mobile Money` : null) ||
        metadata.phoneNumber ||
        'Customer'
      contact = metadata.customerPhone || metadata.phoneNumber || null
      badgeType = 'EXTERNAL_MNO'
    } else if (transaction.type === 'WALLET_TO_WALLET' || transaction.counterpartyUser || transaction.counterpartyId) {
      name = transaction.counterpartyUser?.profile?.firstName && transaction.counterpartyUser?.profile?.lastName
        ? `${transaction.counterpartyUser.profile.firstName} ${transaction.counterpartyUser.profile.lastName}`
        : metadata.counterpartyInfo?.name || metadata.userName || 'RukaPay User'
      badgeType = 'SUBSCRIBER'
    } else if (metadata.counterpartyInfo?.name) {
      name = metadata.counterpartyInfo.name
      badgeType = null
    } else {
      name = getDisplayName(
        transaction.user,
        transaction.metadata,
        transaction.counterpartyUser,
        transaction.wallet,
        transaction,
        'sender',
      )
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
