/** Classify transaction rails so ledger/UI never mix merchant business vs subscriber wallet parties. */

function upper(value: unknown): string {
  return String(value ?? '').trim().toUpperCase()
}

export function isWalletToSubscriberType(type: string | null | undefined): boolean {
  const t = upper(type)
  return t === 'WALLET_TO_WALLET' || t.includes('WALLET_TO_WALLET')
}

export function isWalletToMerchantType(type: string | null | undefined): boolean {
  const t = upper(type)
  return (
    t === 'WALLET_TO_MERCHANT' ||
    t === 'WALLET_TO_INTERNAL_MERCHANT' ||
    t === 'WALLET_TO_EXTERNAL_MERCHANT' ||
    (t.includes('WALLET_TO') && t.includes('MERCHANT') && !t.includes('MERCHANT_TO'))
  )
}

export function isMerchantToWalletType(type: string | null | undefined): boolean {
  const t = upper(type)
  return t === 'MERCHANT_TO_WALLET' || t === 'MERCHANT_TO_INTERNAL_WALLET'
}

export function isExternalBeneficiaryType(type: string | null | undefined): boolean {
  const t = upper(type)
  return (
    t.includes('WALLET_TO_MNO') ||
    t.includes('WALLET_TO_BANK') ||
    t === 'BILL_PAYMENT' ||
    t === 'UTILITIES' ||
    t.includes('UTILIT')
  )
}

export function isBusinessWalletType(walletType: string | null | undefined): boolean {
  const w = upper(walletType)
  return (
    w === 'BUSINESS' ||
    w === 'BUSINESS_COLLECTION' ||
    w === 'BUSINESS_DISBURSEMENT' ||
    w === 'BUSINESS_LIQUIDATION' ||
    w === 'ESCROW' ||
    w === 'PARTNER'
  )
}

/** Personal wallet send to MNO/bank/bill — not merchant-portal bulk. */
export function isPersonalOutboundExternalDebit(tx: {
  type?: string | null
  direction?: string | null
  channel?: string | null
  bulkTransactionId?: string | null
  metadata?: Record<string, unknown> | null
  wallet?: { walletType?: string | null } | null
}): boolean {
  const metadata = (tx?.metadata as Record<string, unknown>) || {}
  const type = upper(tx?.type || metadata?.type)
  const direction = upper(tx?.direction || metadata?.direction)
  if (direction !== 'DEBIT') return false

  const walletType = upper(
    tx?.wallet?.walletType || metadata?.walletType || metadata?.debitWalletType,
  )
  if (walletType !== 'PERSONAL') return false
  if (!isExternalBeneficiaryType(type)) return false

  const channel = upper(tx?.channel || metadata?.channel)
  return (
    channel !== 'MERCHANT_PORTAL' &&
    !tx?.bulkTransactionId &&
    !metadata?.bulkTransactionId &&
    metadata?.bulkPayment !== true
  )
}

export type PartySide = 'sender' | 'receiver'

/**
 * Whether a party column should show merchant business identity (vs subscriber / external).
 */
export function shouldUseMerchantPartyLabel(
  tx: {
    type?: string | null
    direction?: string | null
    channel?: string | null
    bulkTransactionId?: string | null
    metadata?: Record<string, unknown> | null
    wallet?: { walletType?: string | null; merchant?: { businessTradeName?: string | null } | null } | null
  },
  side: PartySide,
): boolean {
  const metadata = (tx?.metadata as Record<string, unknown>) || {}
  const type = upper(tx?.type || metadata?.type)
  const direction = upper(tx?.direction || metadata?.direction)
  const walletType = upper(
    tx?.wallet?.walletType || metadata?.walletType || metadata?.debitWalletType,
  )
  const channel = upper(tx?.channel || metadata?.channel)

  if (isWalletToSubscriberType(type)) return false
  if (isPersonalOutboundExternalDebit(tx)) return false

  if (isWalletToMerchantType(type)) {
    return side === 'receiver'
  }

  if (isMerchantToWalletType(type)) {
    if (side === 'sender' && direction === 'DEBIT') return true
    if (side === 'receiver' && direction === 'DEBIT') return false
    if (side === 'receiver' && direction === 'CREDIT') return false
    if (side === 'sender' && direction === 'CREDIT') return true
  }

  const isMerchantPortal =
    channel === 'MERCHANT_PORTAL' ||
    metadata?.bulkPayment === true ||
    !!tx?.bulkTransactionId ||
    !!metadata?.bulkTransactionId

  if (
    isExternalBeneficiaryType(type) &&
    direction === 'DEBIT' &&
    (isMerchantPortal || isBusinessWalletType(walletType))
  ) {
    return side === 'sender'
  }

  if (metadata?.paymentType === 'MERCHANT_COLLECTION' || metadata?.isPublicPayment === true) {
    return side === 'receiver'
  }

  return isBusinessWalletType(walletType) && !!tx?.wallet?.merchant?.businessTradeName
}

export function resolveMerchantBusinessName(
  tx: {
    user?: {
      merchants?: Array<{ merchantCode?: string; businessTradeName?: string }>
      merchant?: { businessTradeName?: string; merchantCode?: string }
    }
    wallet?: { merchant?: { businessTradeName?: string; merchantCode?: string } | null }
    metadata?: Record<string, unknown>
  },
  info?: { merchantName?: string | null; merchantCode?: string | null; name?: string | null },
): string {
  const metadata = (tx?.metadata as Record<string, unknown>) || {}
  const code = String(metadata?.merchantCode || info?.merchantCode || '').trim()
  const merchants = Array.isArray(tx?.user?.merchants) ? tx.user!.merchants! : []
  const matched = code
    ? merchants.find((m) => String(m?.merchantCode || '').trim() === code)
    : null

  return (
    String(metadata?.merchantName || '').trim() ||
    String(info?.merchantName || info?.name || '').trim() ||
    matched?.businessTradeName ||
    tx?.wallet?.merchant?.businessTradeName ||
    tx?.user?.merchant?.businessTradeName ||
    (code ? `Merchant (${code})` : 'Merchant')
  )
}
