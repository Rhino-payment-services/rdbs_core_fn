export type PartnerRole = 'sender' | 'receiver'

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

  const candidatePrimary =
    partner?.partnerName ||
    m?.apiPartnerName ||
    partner?.partnerCode ||
    null

  const primary = isMeaningfulLabel(candidatePrimary, secondary) ? String(candidatePrimary) : 'API Partner'

  return { primary, secondary: secondary ? String(secondary) : undefined }
}

