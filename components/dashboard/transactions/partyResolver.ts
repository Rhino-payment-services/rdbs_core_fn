import {
  isMerchantToWalletType,
  isPersonalOutboundExternalDebit,
  isWalletToMerchantType,
  isWalletToSubscriberType,
  resolveMerchantBusinessName,
  shouldUseMerchantPartyLabel,
} from '@/lib/utils/transactionPartyClassification'

export type PartnerRole = 'sender' | 'receiver'
export type PartySide = 'sender' | 'receiver'

export { isPersonalOutboundExternalDebit } from '@/lib/utils/transactionPartyClassification'

function upper(v: any) {
  return String(v ?? '').toUpperCase()
}

export function isApiDrivenTransaction(tx: any): boolean {
  const m = tx?.metadata || {}
  if (
    m.withdrawalType === 'PLATFORM_REVENUE_LIQUIDATION' ||
    tx?.platformRevenueSettlement === true
  ) {
    return false
  }
  const ref = String(tx?.reference || '')
  if (/^(PREV_OFFSET_|PREV_REV_|PREV_MNO_)/.test(ref)) return false
  return !!(
    tx?.partner ||
    tx?.partnerId ||
    m?.isApiPartnerTransaction === true ||
    m?.isPartnerTransaction === true ||
    m?.apiPartnerName ||
    upper(tx?.channel) === 'API' ||
    upper(m?.channel) === 'API'
  )
}

export function isMeaningfulLabel(primary: string | null | undefined, secondary?: string | null): boolean {
  const p = String(primary ?? '').trim()
  if (!p) return false
  const s = String(secondary ?? '').trim()
  if (s && p === s) return false
  if (/^\+?\d[\d\s-]{5,}$/.test(p)) return false
  // UUID-ish / reference-ish
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p)) return false
  if (/^(TXN|GW)\w{6,}/i.test(p)) return false
  return true
}

export function getPartnerRole(tx: any): PartnerRole | null {
  if (!isApiDrivenTransaction(tx)) return null

  const m = tx?.metadata || {}
  const type = upper(tx?.type)
  const mode = upper(tx?.mode || m?.mode || m?.transactionModeCode)
  const direction = upper(tx?.direction || m?.direction)
  const util = upper(m?.utilityProvider)
  const pt = String(m?.payment_type || '').toLowerCase()
  const isAirtimeOrDataBill =
    (type === 'BILL_PAYMENT' ||
      mode.includes('AIRTIME') ||
      mode.includes('DATA_BUNDLES')) &&
    (util === 'AIRTIME' ||
      util === 'DATA_BUNDLES' ||
      pt === 'airtime' ||
      pt === 'mobile_data' ||
      mode.includes('AIRTIME') ||
      mode.includes('DATA_BUNDLES'))

  // For airtime/data bill rails, partner should be shown in "Partner" column only;
  // sender/receiver should remain merchant <-> mobile user, not partner actor.
  if (isAirtimeOrDataBill) return null

  // Partner-institution rails are directional and should not be inferred by
  // generic SEND/WITHDRAW heuristics.
  if (type === 'WALLET_TO_PARTNER_INSTITUTION') return 'receiver'
  if (type === 'PARTNER_INSTITUTION_TO_WALLET') return 'sender'

  const isInbound =
    type.includes('MNO_TO_WALLET') ||
    type.includes('BANK_TO_WALLET') ||
    type.includes('CARD_TO_WALLET') ||
    mode.includes('COLLECT') ||
    mode.includes('TOPUP') ||
    mode.includes('TOP_UP') ||
    mode.includes('RECEIVE')

  const isOutbound =
    type.includes('WALLET_TO_MNO') ||
    type.includes('WALLET_TO_BANK') ||
    mode.includes('DISBURSE') ||
    mode.includes('PAYOUT') ||
    mode.includes('WITHDRAW') ||
    mode.includes('SEND')

  if (isInbound) return 'receiver'
  if (isOutbound) return 'sender'

  // Last-resort guidance from direction
  if (direction === 'CREDIT') return 'receiver'
  if (direction === 'DEBIT') return 'sender'

  return null
}

export function resolvePartnerDisplay(tx: any): { primary: string; secondary?: string } {
  const m = tx?.metadata || {}
  const codeUpper = String(m.partnerCode || '').toUpperCase()
  const isAfricaTalkingRail =
    codeUpper === 'AFRICASTALKING' ||
    String(tx?.externalReference || '').startsWith('ATQid_') ||
    String(tx?.externalReference || '').startsWith('ATPid_')
  const isBillUtilitySubtype =
    m.payment_type === 'airtime' ||
    m.payment_type === 'mobile_data' ||
    m.utilityProvider === 'AIRTIME' ||
    m.utilityProvider === 'DATA_BUNDLES'
  // Executing partner is stamped on metadata (e.g. Africa's Talking) while partnerMapping
  // may still point at the default bill partner (e.g. Pegasus) — prefer metadata for display.
  if (isAfricaTalkingRail && isBillUtilitySubtype) {
    const primary =
      String(m.partnerName || '').trim() || "Africa's Talking"
    // Omit external partner refs here — they are long (e.g. ATQid_…) and clutter the table.
    return { primary }
  }

  // tx.partner = ApiPartner (the API caller / business) — preferred for display
  // tx.partnerMapping.partner = ExternalPaymentPartner (MNO gateway) — fallback only
  const apiPartner = tx?.partner || null
  const extPartner = tx?.partnerMapping?.partner || null

  const secondary =
    apiPartner?.contactPhone ||
    apiPartner?.contactEmail ||
    extPartner?.contactPhone ||
    extPartner?.contactEmail ||
    m?.partnerPhone ||
    m?.partnerEmail ||
    m?.partnerContact ||
    undefined

  const candidates = [
    m?.apiPartnerName,
    m?.apiPartnerBusinessName,
    m?.partnerBusinessName,
    apiPartner?.partnerName,
    apiPartner?.businessName,
    apiPartner?.name,
    extPartner?.partnerName,
    extPartner?.businessName,
    m?.partnerName,
    apiPartner?.partnerCode,
    extPartner?.partnerCode,
  ]
  const candidatePrimary = candidates.find((c) => isMeaningfulLabel(c, secondary)) || null
  const primary = candidatePrimary ? String(candidatePrimary) : 'API Partner'

  return { primary, secondary: secondary ? String(secondary) : undefined }
}

/**
 * Partner line in transaction details (and similar): for utility bill payments the executing
 * rail is on metadata while partnerMapping may still be the default (e.g. Pegasus).
 */
export function getBasicPartnerDisplayLabel(tx: any): string {
  const m = tx?.metadata || {}

  if (
    m.withdrawalType === 'PLATFORM_REVENUE_LIQUIDATION' ||
    tx?.platformRevenueSettlement === true
  ) {
    return 'Platform revenue'
  }
  const ref = String(tx?.reference || '')
  if (/^(PREV_OFFSET_|PREV_REV_|PREV_MNO_)/.test(ref)) {
    return 'Platform revenue'
  }

  if (upper(tx?.type) === 'BILL_PAYMENT') {
    const pt = m.payment_type
    const util = m.utilityProvider
    const isUtilityAirtimeOrData =
      pt === 'airtime' ||
      pt === 'mobile_data' ||
      util === 'AIRTIME' ||
      util === 'DATA_BUNDLES'
    if (isUtilityAirtimeOrData) {
      const codeRaw = String(m.partnerCode || '').trim()
      const atRef =
        String(tx?.externalReference || '').startsWith('ATQid_') ||
        String(tx?.externalReference || '').startsWith('ATPid_')
      const codeDisp =
        codeRaw && !isNumericLikeLabel(codeRaw)
          ? codeRaw.toUpperCase()
          : atRef
            ? 'AFRICASTALKING'
            : ''
      const name = String(m.partnerName || '').trim()
      if (codeDisp || name) {
        if (name && codeDisp) return `${name} (${codeDisp})`
        return name || codeDisp
      }
    }
  }

  const mapping = tx?.partnerMapping?.partner
  const pd = resolvePartnerDisplay(tx).primary

  return (
    mapping?.partnerName ||
    mapping?.partnerCode ||
    m.apiPartnerBusinessName ||
    m.partnerBusinessName ||
    m.apiPartnerName ||
    tx?.partner?.partnerName ||
    tx?.partner?.businessName ||
    m.partnerName ||
    pd ||
    'Direct'
  )
}

function isNumericLikeLabel(value: any): boolean {
  const s = String(value ?? '').trim()
  if (!s) return false
  return /^\+?\d[\d\s-]{5,}$/.test(s)
}

function fullNameFromProfile(profile: any): string | null {
  if (profile?.firstName && profile?.lastName) {
    return `${profile.firstName} ${profile.lastName}`.trim()
  }
  return null
}

function firstMeaningfulName(candidates: any[], secondary?: string | null): string | null {
  const sec = String(secondary ?? '').trim()
  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim()
    if (!value) continue
    if (sec && value === sec) continue
    if (isNumericLikeLabel(value)) continue
    return value
  }
  return null
}

export function normalizePartyInfoForDisplay(info: any, tx: any, side: PartySide): any {
  if (!info) return info

  const metadata = tx?.metadata || {}
  const type = upper(tx?.type)
  const mode = upper(tx?.mode || metadata?.mode || metadata?.transactionModeCode)

  if (type === 'LIQUIDATION' && side === 'sender') {
    const code = String(
      info.institutionCode || metadata.partnerInstitutionCode || tx?.partnerInstitution?.code || tx?.wallet?.partnerInstitution?.code || ''
    ).trim()
    const instName = String(
      info.institutionName || metadata.partnerInstitutionName || tx?.partnerInstitution?.name || tx?.wallet?.partnerInstitution?.name || ''
    ).trim()
    const institutionLine =
      info.institutionLine ||
      ([code && `Code ${code}`, instName].filter(Boolean).join(' · ') || undefined)
    return {
      ...info,
      type: 'PARTNER',
      contact: null,
      institutionLine,
      institutionCode: info.institutionCode ?? (code || null),
      institutionName: info.institutionName ?? (instName || null),
    }
  }

  // NEXEN / partner-institution wallet rails: show which SACCO (metadata + relations).
  if (type === 'WALLET_TO_PARTNER_INSTITUTION' && side === 'receiver') {
    const code = String(
      info.institutionCode ||
        metadata.nexenInstitutionCode ||
        metadata.partnerInstitutionCode ||
        metadata.institutionCode ||
        metadata.saccoCode ||
        metadata.organizationCode ||
        tx?.partnerInstitution?.code ||
        tx?.wallet?.partnerInstitution?.code ||
        ''
    ).trim()
    const instName = String(
      info.institutionName ||
        metadata.nexenInstitutionName ||
        metadata.partnerInstitutionName ||
        metadata.institutionName ||
        metadata.saccoName ||
        metadata.organizationName ||
        tx?.partnerInstitution?.name ||
        tx?.wallet?.partnerInstitution?.name ||
        ''
    ).trim()
    const institutionLine =
      info.institutionLine ||
      ([code && `Code ${code}`, instName].filter(Boolean).join(' · ') || undefined)
    const institutionDisplayName =
      instName ||
      (code ? `Code ${code}` : '') ||
      String(info.name || '').trim() ||
      'SACCO settlement wallet'
    const partnerName = String(
      info.partnerName ||
      metadata.apiPartnerName ||
      metadata.partnerName ||
      tx?.partner?.partnerName ||
      tx?.wallet?.partner?.partnerName ||
      ''
    ).trim()
    return {
      ...info,
      name: institutionDisplayName,
      type: 'PARTNER_INSTITUTION',
      partnerName: partnerName || null,
      institutionLine,
      institutionCode: info.institutionCode ?? (code || null),
      institutionName: info.institutionName ?? (instName || null),
    }
  }
  if (type === 'PARTNER_INSTITUTION_TO_WALLET' && side === 'sender') {
    const code = String(
      info.institutionCode ||
        metadata.nexenInstitutionCode ||
        metadata.partnerInstitutionCode ||
        metadata.institutionCode ||
        metadata.saccoCode ||
        metadata.organizationCode ||
        tx?.partnerInstitution?.code ||
        tx?.wallet?.partnerInstitution?.code ||
        ''
    ).trim()
    const instName = String(
      info.institutionName ||
        metadata.nexenInstitutionName ||
        metadata.partnerInstitutionName ||
        metadata.institutionName ||
        metadata.saccoName ||
        metadata.organizationName ||
        tx?.partnerInstitution?.name ||
        tx?.wallet?.partnerInstitution?.name ||
        ''
    ).trim()
    const institutionLine =
      info.institutionLine ||
      ([code && `Code ${code}`, instName].filter(Boolean).join(' · ') || undefined)
    const institutionDisplayName =
      instName ||
      (code ? `Code ${code}` : '') ||
      String(info.name || '').trim() ||
      'SACCO settlement wallet'
    const partnerName = String(
      info.partnerName ||
      metadata.apiPartnerName ||
      metadata.partnerName ||
      tx?.partner?.partnerName ||
      tx?.wallet?.partner?.partnerName ||
      ''
    ).trim()
    return {
      ...info,
      name: institutionDisplayName,
      type: 'PARTNER_INSTITUTION',
      partnerName: partnerName || null,
      institutionLine,
      institutionCode: info.institutionCode ?? (code || null),
      institutionName: info.institutionName ?? (instName || null),
    }
  }
  const direction = upper(tx?.direction || metadata?.direction)
  const contact = String(info?.contact ?? '').trim() || null
  const partnerDisplay = resolvePartnerDisplay(tx)
  const partnerRole = getPartnerRole(tx)
  const isPartnerSide = partnerRole === side
  const userProfileName = fullNameFromProfile(tx?.user?.profile)
  const counterpartyProfileName = fullNameFromProfile(tx?.counterpartyUser?.profile)

  const walletType = upper(
    tx?.wallet?.walletType || metadata?.walletType || metadata?.recipientWalletType,
  )
  const isBusinessWallet =
    walletType === 'BUSINESS' ||
    walletType === 'BUSINESS_COLLECTION' ||
    walletType === 'BUSINESS_DISBURSEMENT' ||
    walletType === 'BUSINESS_LIQUIDATION' ||
    walletType === 'ESCROW' ||
    walletType === 'PARTNER'

  const isApiPartnerMnoCollect =
    isApiDrivenTransaction(tx) &&
    getPartnerRole(tx) === 'receiver' &&
    direction === 'CREDIT' &&
    (type.includes('MNO_TO_WALLET') ||
      mode.includes('COLLECT') ||
      mode.includes('RECEIVE'))

  const isMerchantCollectionFlow =
    !isApiPartnerMnoCollect &&
    type.includes('MNO_TO_WALLET') &&
    direction === 'CREDIT' &&
  (metadata?.paymentType === 'MERCHANT_COLLECTION' ||
      metadata?.isPublicPayment === true ||
      (isBusinessWallet &&
        !!(metadata?.merchantCode || metadata?.merchantName)) ||
      upper(tx?.channel) === 'MERCHANT_PORTAL')

  const isPartnerOutboundSend =
    side === 'sender' &&
    isApiDrivenTransaction(tx) &&
    getPartnerRole(tx) === 'sender'

  const isMerchantOutboundDebit =
    !isPartnerOutboundSend &&
    direction === 'DEBIT' &&
    (type.includes('WALLET_TO_MNO') ||
      type.includes('WALLET_TO_BANK') ||
      type === 'BILL_PAYMENT' ||
      type === 'UTILITIES' ||
      type.includes('UTILIT')) &&
    (upper(tx?.channel) === 'MERCHANT_PORTAL' ||
      !!tx?.bulkTransactionId ||
      metadata?.bulkPayment === true ||
      isBusinessWallet)

  if (isPartnerOutboundSend) {
    return {
      ...info,
      type: 'PARTNER',
      name: partnerDisplay.primary,
      contact: contact || partnerDisplay.secondary || null,
      merchantCode: null,
      merchantName: null,
    }
  }

  if (side === 'sender' && isMerchantOutboundDebit && info?.type === 'MERCHANT') {
    const merchantName =
      info?.merchantName ||
      info?.name ||
      (metadata?.merchantCode ? `Merchant (${metadata.merchantCode})` : null) ||
      'Merchant'
    return {
      ...info,
      type: 'MERCHANT',
      name: merchantName,
      contact: null,
      merchantCode: info?.merchantCode || metadata?.merchantCode || null,
      merchantName: info?.merchantName || metadata?.merchantName || null,
    }
  }

  // Personal wallet → MNO: beneficiary is external MM; never use owner merchant metadata.
  if (side === 'receiver' && isPersonalOutboundExternalDebit(tx)) {
    let receiverLabel = String(metadata?.receiverName || '').trim()
    if (receiverLabel.includes(' · ')) {
      receiverLabel = receiverLabel.split(' · ')[0].trim()
    }
    const beneficiaryName =
      firstMeaningfulName(
        [
          info?.name,
          metadata?.recipientName,
          metadata?.receiverName,
          metadata?.accountName,
          metadata?.customerName,
          metadata?.validationResult?.customerName,
          metadata?.mnoReceiverValidation?.data?.customerName,
          metadata?.mnoReceiverValidation?.data?.name,
          receiverLabel,
        ],
        contact,
      ) || info?.name || 'Recipient'
    const beneficiaryContact =
      contact ||
      String(
        metadata?.phoneNumber ||
          metadata?.recipientPhone ||
          metadata?.receiverPhone ||
          '',
      ).trim() ||
      null

    return {
      ...info,
      name: beneficiaryName,
      contact: beneficiaryContact,
      type: info?.type || 'EXTERNAL_MNO',
      merchantCode: null,
      merchantName: null,
    }
  }

  if (side === 'receiver' && isMerchantOutboundDebit) {
    let receiverLabel = String(metadata?.receiverName || '').trim()
    if (receiverLabel.includes(' · ')) {
      receiverLabel = receiverLabel.split(' · ')[0].trim()
    }
    const beneficiaryName = firstMeaningfulName(
      [
        metadata?.recipientName,
        metadata?.accountName,
        metadata?.customerName,
        metadata?.validationResult?.customerName,
        metadata?.mnoReceiverValidation?.data?.customerName,
        metadata?.mnoReceiverValidation?.data?.name,
        receiverLabel,
        info?.name,
      ],
      contact,
    )
    const beneficiaryContact =
      contact ||
      String(
        metadata?.phoneNumber ||
          metadata?.recipientPhone ||
          metadata?.utilityAccountNumber ||
          metadata?.customerRef ||
          '',
      ).trim() ||
      null

    return {
      ...info,
      name: beneficiaryName || info?.name || 'Recipient',
      contact: beneficiaryContact,
      merchantCode: null,
      merchantName: null,
    }
  }

  // API partner collect: payer is external MNO customer; partner is receiver only.
  if (side === 'sender' && isApiPartnerMnoCollect) {
    const partnerLabels = [
      metadata?.apiPartnerName,
      metadata?.partnerName,
      tx?.partner?.partnerName,
    ]
      .map((v) => String(v ?? '').trim().toLowerCase())
      .filter(Boolean)
    const isPartnerLabel = (value: unknown) => {
      const label = String(value ?? '').trim().toLowerCase()
      if (!label) return true
      return partnerLabels.some((p) => p === label || label.includes(p))
    }
    const provider = String(metadata?.mnoProvider || metadata?.network || '').trim()
    const apiSenderName = String(info?.name || '').trim()
    const customerName =
      (apiSenderName && info?.type === 'EXTERNAL_MNO' && !isPartnerLabel(apiSenderName)
        ? apiSenderName
        : null) ||
      firstMeaningfulName(
        [
          metadata?.customerName,
          metadata?.payerName,
          metadata?.mnoReceiverValidation?.data?.customerName,
          metadata?.mnoReceiverValidation?.data?.name,
          metadata?.validationResult?.customerName,
          metadata?.validationResult?.data?.customerName,
          metadata?.senderType === 'EXTERNAL_MNO' && !isPartnerLabel(metadata?.senderName)
            ? metadata?.senderName
            : null,
        ],
        contact,
      ) ||
      (provider ? `${provider} Mobile Money` : 'Customer')
    const customerContact =
      String(info?.contact || '').trim() ||
      String(
        metadata?.customerPhone ||
          metadata?.phoneNumber ||
          metadata?.senderPhone ||
          '',
      ).trim() ||
      null

    return {
      ...info,
      type: 'EXTERNAL_MNO',
      name: customerName,
      contact: customerContact,
      merchantCode: null,
      merchantName: null,
    }
  }

  if (side === 'receiver' && isApiPartnerMnoCollect) {
    return {
      ...info,
      type: 'PARTNER',
      name: partnerDisplay.primary,
      contact: partnerDisplay.secondary || null,
      merchantCode: null,
      merchantName: null,
    }
  }

  // For merchant collections, sender is always the paying customer (not merchant account).
  if (side === 'sender' && isMerchantCollectionFlow) {
    const portalUser = String(metadata?.userName || '').trim().toLowerCase()
    const merchantBiz = String(metadata?.merchantName || '').trim().toLowerCase()
    const senderRaw = String(metadata?.senderName || '').trim()
    const senderLower = senderRaw.toLowerCase()
    const senderLooksLikeMerchant =
      !!senderLower &&
      (senderLower === portalUser ||
        senderLower === merchantBiz ||
        (portalUser && portalUser.includes(senderLower)) ||
        (portalUser && senderLower.split(/\s+/).length === 1 && portalUser.startsWith(senderLower)))

    const customerName =
      firstMeaningfulName(
        [
          metadata?.customerName,
          metadata?.payerName,
          metadata?.mnoReceiverValidation?.data?.customerName,
          metadata?.mnoReceiverValidation?.data?.name,
          metadata?.validationResult?.customerName,
          metadata?.validationResult?.data?.customerName,
          metadata?.senderType === 'EXTERNAL_MNO' && !senderLooksLikeMerchant
            ? metadata?.senderName
            : null,
        ],
        contact,
      ) || 'Customer'
    const customerContact =
      contact ||
      String(
        metadata?.customerPhone ||
          metadata?.phoneNumber ||
          metadata?.counterpartyInfo?.phone ||
          ''
      ).trim() ||
      null

    return {
      ...info,
      type: 'EXTERNAL_MNO',
      name: customerName,
      contact: customerContact,
    }
  }

  const isWalletToSubscriber = isWalletToSubscriberType(type)
  const isWalletToMerchant = isWalletToMerchantType(type)
  const isMerchantToWallet = isMerchantToWalletType(type)
  const isMerchantToWalletDebit = direction === 'DEBIT' && isMerchantToWallet
  const isMerchantToWalletCredit = direction === 'CREDIT' && isMerchantToWallet

  // P2P: receiver is always another subscriber wallet, never the sender's merchant business.
  if (isWalletToSubscriber) {
    if (side === 'receiver' && direction === 'DEBIT') {
      const subscriberName =
        firstMeaningfulName(
          [
            info?.name,
            metadata?.recipientName,
            metadata?.receiverName,
            counterpartyProfileName,
            metadata?.counterpartyInfo?.name,
          ],
          contact,
        ) || 'RukaPay User'
      const subscriberContact =
        contact ||
        String(metadata?.recipientPhone || metadata?.receiverPhone || '').trim() ||
        tx?.counterpartyUser?.phone ||
        null
      return {
        ...info,
        type: 'SUBSCRIBER',
        name: subscriberName,
        contact: subscriberContact,
        merchantCode: null,
        merchantName: null,
      }
    }
    if (side === 'sender' && direction === 'DEBIT') {
      const senderName =
        firstMeaningfulName([userProfileName, info?.name, metadata?.senderName], contact) ||
        'RukaPay User'
      return {
        ...info,
        type: 'SUBSCRIBER',
        name: senderName,
        contact: contact || tx?.user?.phone || null,
        merchantCode: null,
        merchantName: null,
      }
    }
  }

  // Pay merchant: receiver is the business account; sender is subscriber unless debiting a business wallet.
  if (isWalletToMerchant) {
    if (side === 'receiver') {
      const merchantName = resolveMerchantBusinessName(tx, info)
      return {
        ...info,
        type: 'MERCHANT',
        name: merchantName,
        contact: null,
        merchantCode: String(metadata?.merchantCode || info?.merchantCode || '').trim() || null,
        merchantName,
      }
    }
    if (side === 'sender' && direction === 'DEBIT' && !isBusinessWallet) {
      const senderName =
        firstMeaningfulName([userProfileName, info?.name, metadata?.senderName], contact) ||
        'RukaPay User'
      return {
        ...info,
        type: 'SUBSCRIBER',
        name: senderName,
        contact: contact || tx?.user?.phone || null,
        merchantCode: null,
        merchantName: null,
      }
    }
  }

  // Merchant MNO collection (and similar) must run before MERCHANT_TO_WALLET overrides.
  if (side === 'receiver' && isMerchantCollectionFlow) {
    const merchantName =
      metadata?.merchantName ||
      (metadata?.merchantCode ? `Merchant (${metadata.merchantCode})` : null) ||
      info?.merchantName ||
      info?.name
    return {
      ...info,
      type: 'MERCHANT',
      name: merchantName,
      merchantCode: metadata?.merchantCode || info?.merchantCode || null,
      merchantName: metadata?.merchantName || info?.merchantName || null,
      contact: null,
    }
  }

  if (side === 'sender' && isMerchantToWalletCredit) {
    const merchantName =
      metadata?.initiatingMerchantName ||
      metadata?.merchantName ||
      metadata?.senderName ||
      info?.merchantName ||
      info?.name ||
      (metadata?.initiatingMerchantCode || metadata?.merchantCode
        ? `Merchant (${metadata.initiatingMerchantCode || metadata.merchantCode})`
        : null) ||
      'Merchant'
    return {
      ...info,
      type: 'MERCHANT',
      name: merchantName,
      contact: null,
      merchantCode:
        metadata?.initiatingMerchantCode ||
        metadata?.merchantCode ||
        info?.merchantCode ||
        null,
      merchantName:
        metadata?.initiatingMerchantName ||
        metadata?.merchantName ||
        info?.merchantName ||
        merchantName,
    }
  }

  if (side === 'receiver' && isMerchantToWalletCredit) {
    const merchantBiz = String(
      metadata?.merchantName || metadata?.initiatingMerchantName || info?.merchantName || '',
    ).trim().toLowerCase()
    const isMerchantLabel = (value: unknown) => {
      const label = String(value ?? '').trim().toLowerCase()
      if (!label) return true
      if (merchantBiz && label === merchantBiz) return true
      if (merchantBiz && merchantBiz.length >= 4 && label.includes(merchantBiz)) return true
      return false
    }
    const subscriberName = firstMeaningfulName(
      [
        !isMerchantLabel(info?.name) ? info?.name : null,
        !isMerchantLabel(metadata?.recipientName) ? metadata?.recipientName : null,
        !isMerchantLabel(metadata?.receiverName) ? metadata?.receiverName : null,
        userProfileName,
      ],
      contact,
    )
    const subscriberContact =
      contact ||
      String(metadata?.receiverPhone || metadata?.recipientPhone || '').trim() ||
      tx?.user?.phone ||
      null
    return {
      ...info,
      type: 'SUBSCRIBER',
      name: subscriberName || 'RukaPay User',
      contact: subscriberContact,
      merchantCode: null,
      merchantName: null,
    }
  }

  if (side === 'sender' && isMerchantToWalletDebit) {
    const merchantName =
      metadata?.merchantName ||
      (metadata?.merchantCode ? `Merchant (${metadata.merchantCode})` : null) ||
      info?.merchantName ||
      info?.name
    return {
      ...info,
      type: 'MERCHANT',
      name: merchantName || 'Merchant',
      contact: null,
      merchantCode: metadata?.merchantCode || info?.merchantCode || null,
      merchantName: metadata?.merchantName || info?.merchantName || null,
    }
  }

  if (side === 'receiver' && isMerchantToWalletDebit) {
    const receiverLabel = firstMeaningfulName(
      [
        metadata?.recipientName,
        metadata?.counterpartyInfo?.name,
        tx?.counterpartyUser?.profile?.firstName &&
        tx?.counterpartyUser?.profile?.lastName
          ? `${tx.counterpartyUser.profile.firstName} ${tx.counterpartyUser.profile.lastName}`.trim()
          : null,
      ],
      contact,
    )
    const beneficiaryContact =
      String(metadata?.recipientPhone || metadata?.recipientPhoneNumber || '').trim() ||
      tx?.counterpartyUser?.phone ||
      contact ||
      null
    return {
      ...info,
      type: 'SUBSCRIBER',
      name: receiverLabel || 'RukaPay User',
      contact: beneficiaryContact,
      merchantCode: null,
      merchantName: null,
    }
  }

  const useMerchantLabel = shouldUseMerchantPartyLabel(tx, side)
  const omitMerchantFromCandidates =
    !useMerchantLabel ||
    isWalletToSubscriber ||
    isWalletToMerchant ||
    isPersonalOutboundExternalDebit(tx) ||
    isMerchantOutboundDebit ||
    isMerchantToWalletCredit

  const roleSpecificCandidates = side === 'sender'
    ? [
        ...(omitMerchantFromCandidates ? [] : [metadata.merchantName]),
        ...(isApiPartnerMnoCollect ? [] : [metadata.senderName]),
        metadata.userName,
        metadata.counterpartyInfo?.name,
        counterpartyProfileName,
        userProfileName,
      ]
    : [
        ...(omitMerchantFromCandidates ? [] : [metadata.merchantName]),
        metadata.receiverName,
        metadata.recipientName,
        metadata.customerName,
        metadata?.validationResult?.customerName,
        metadata?.mnoReceiverValidation?.data?.customerName,
        metadata?.mnoReceiverValidation?.data?.name,
        metadata.counterpartyInfo?.name,
      ]

  const partnerCandidates = [
    partnerDisplay.primary,
    metadata.apiPartnerName,
    metadata.partnerBusinessName,
    metadata.apiPartnerBusinessName,
    tx?.partner?.partnerName,
    tx?.wallet?.partner?.partnerName,
    tx?.partner?.businessName,
    tx?.partner?.name,
    metadata.partnerName,
    tx?.partnerMapping?.partner?.partnerName,
    tx?.partnerMapping?.partner?.businessName,
  ]

  const normalizedName =
    (side === 'sender' &&
    isApiPartnerMnoCollect &&
    info?.type === 'EXTERNAL_MNO' &&
    String(info?.name || '').trim()
      ? String(info.name).trim()
      : null) ||
    ((info?.type === 'PARTNER' || isPartnerSide)
      ? firstMeaningfulName(partnerCandidates, contact)
      : null) ||
    firstMeaningfulName(roleSpecificCandidates, contact) ||
    firstMeaningfulName([info?.name], contact) ||
    (info?.type === 'PARTNER' || isPartnerSide ? 'API Partner' : null) ||
    info?.name

  let normalizedType = isPartnerSide ? 'PARTNER' : info?.type
  if (isWalletToSubscriber) {
    normalizedType = 'SUBSCRIBER'
  } else if (isWalletToMerchant && side === 'receiver') {
    normalizedType = 'MERCHANT'
  } else if (isPersonalOutboundExternalDebit(tx) && side === 'receiver') {
    normalizedType = info?.type || 'EXTERNAL_MNO'
  } else if (useMerchantLabel && side === 'receiver') {
    normalizedType = 'MERCHANT'
  } else if (
    !useMerchantLabel &&
    (side === 'receiver' || isWalletToSubscriber || isMerchantToWalletDebit)
  ) {
    normalizedType =
      info?.type === 'EXTERNAL_MNO' || info?.type === 'EXTERNAL_BANK' || info?.type === 'UTILITY'
        ? info.type
        : 'SUBSCRIBER'
  }

  const isMerchantParty = normalizedType === 'MERCHANT'

  return {
    ...info,
    type: normalizedType,
    name: normalizedName,
    merchantCode: isMerchantParty
      ? info?.merchantCode || metadata?.merchantCode || null
      : null,
    merchantName: isMerchantParty
      ? info?.merchantName || metadata?.merchantName || null
      : null,
  }
}

