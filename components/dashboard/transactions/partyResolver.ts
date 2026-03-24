export type PartnerRole = 'sender' | 'receiver'
export type PartySide = 'sender' | 'receiver'

function upper(v: any) {
  return String(v ?? '').toUpperCase()
}

export function isApiDrivenTransaction(tx: any): boolean {
  const m = tx?.metadata || {}
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
  const partner = tx?.partner || null

  const secondary =
    partner?.contactPhone ||
    partner?.contactEmail ||
    m?.partnerPhone ||
    m?.partnerEmail ||
    m?.partnerContact ||
    undefined

  const candidates = [
    partner?.partnerName,
    partner?.businessName,
    partner?.name,
    m?.apiPartnerBusinessName,
    m?.partnerBusinessName,
    m?.apiPartnerName,
    m?.partnerName,
    partner?.partnerCode,
  ]
  const candidatePrimary = candidates.find((c) => isMeaningfulLabel(c, secondary)) || null
  const primary = candidatePrimary ? String(candidatePrimary) : 'API Partner'

  return { primary, secondary: secondary ? String(secondary) : undefined }
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
  const contact = String(info?.contact ?? '').trim() || null
  const partnerDisplay = resolvePartnerDisplay(tx)
  const partnerRole = getPartnerRole(tx)
  const isPartnerSide = partnerRole === side
  const userProfileName = fullNameFromProfile(tx?.user?.profile)
  const counterpartyProfileName = fullNameFromProfile(tx?.counterpartyUser?.profile)

  const roleSpecificCandidates = side === 'sender'
    ? [
        metadata.senderName,
        metadata.userName,
        metadata.counterpartyInfo?.name,
        counterpartyProfileName,
        userProfileName,
      ]
    : [
        metadata.receiverName,
        metadata.recipientName,
        metadata.userName,
        userProfileName,
        counterpartyProfileName,
        metadata.counterpartyInfo?.name,
      ]

  const partnerCandidates = [
    partnerDisplay.primary,
    metadata.apiPartnerName,
    metadata.partnerBusinessName,
    metadata.apiPartnerBusinessName,
    tx?.partner?.partnerName,
    tx?.partner?.businessName,
    tx?.partner?.name,
    metadata.partnerName,
    tx?.partnerMapping?.partner?.partnerName,
    tx?.partnerMapping?.partner?.businessName,
  ]

  const normalizedName =
    ((info?.type === 'PARTNER' || isPartnerSide)
      ? firstMeaningfulName(partnerCandidates, contact)
      : null) ||
    firstMeaningfulName([info?.name], contact) ||
    firstMeaningfulName(roleSpecificCandidates, contact) ||
    (info?.type === 'PARTNER' || isPartnerSide ? 'API Partner' : null) ||
    info?.name

  return {
    ...info,
    name: normalizedName,
  }
}

