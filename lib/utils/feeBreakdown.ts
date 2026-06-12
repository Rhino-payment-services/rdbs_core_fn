export interface NormalizedFeeBreakdown {
  rukapayFee: number
  partnerFee: number
  governmentTax: number
  totalFee: number
  processingFee: number
  networkFee: number
  complianceFee: number
  telecomBankCharge: number
}

function finiteOrZero(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Airtime sold via Africa's Talking: face value is split (RukaPay margin vs partner settlement), not customer fees. */
export function isAirtimeFaceValueLedger(transaction: {
  type?: string | null
  externalReference?: string | null
  amount?: number | string | null
  metadata?: Record<string, unknown> | null
}): boolean {
  const meta = transaction?.metadata || {}
  const fb = (meta.feeBreakdown as Record<string, unknown>) || {}
  if (fb.allocationOfFaceValue === true) {
    const util = String(meta.utilityProvider || '').toUpperCase()
    const pt = String(meta.payment_type || '').toLowerCase()
    return util === 'AIRTIME' || pt === 'airtime'
  }

  const type = String(transaction?.type || '').toUpperCase()
  if (type !== 'BILL_PAYMENT' && type !== 'UTILITIES') return false

  const util = String(meta.utilityProvider || '').toUpperCase()
  const pt = String(meta.payment_type || '').toLowerCase()
  if (util !== 'AIRTIME' && pt !== 'airtime') return false

  const code = String(meta.partnerCode || '').toUpperCase()
  const atRef =
    String(transaction?.externalReference || '').startsWith('ATQid_') ||
    String(transaction?.externalReference || '').startsWith('ATPid_')
  const partnerName = String(meta.partnerName || '').toLowerCase()

  return (
    code === 'AFRICASTALKING' ||
    atRef ||
    partnerName.includes("africa's talking") ||
    partnerName.includes('africastalking')
  )
}

function resolveAirtimeFaceValueRukapayFee(
  transaction: {
    amount?: number | string | null
    rukapayFee?: number | string | null
    metadata?: Record<string, unknown> | null
  },
  feeBreakdown: Record<string, unknown>,
): number {
  const amount = Number(transaction.amount) || 0
  const fromStored = Number(feeBreakdown.rukapayFee ?? transaction.rukapayFee)
  if (Number.isFinite(fromStored) && fromStored > 0) {
    return fromStored
  }
  const marginPct = Number(feeBreakdown.marginPercent)
  const pct = Number.isFinite(marginPct) && marginPct > 0 ? marginPct : 3
  return Math.round((amount * pct) / 100)
}

function pickFee(
  breakdownValue: unknown,
  transactionValue: unknown,
  metadataFallback?: unknown,
): number {
  if (breakdownValue != null && Number.isFinite(Number(breakdownValue))) {
    return Number(breakdownValue)
  }
  if (transactionValue != null && Number.isFinite(Number(transactionValue))) {
    return Number(transactionValue)
  }
  if (metadataFallback != null && Number.isFinite(Number(metadataFallback))) {
    return Number(metadataFallback)
  }
  return 0
}

/**
 * Normalize fee components from metadata.feeBreakdown and transaction fields.
 * Supports negative fees (e.g. gateway partner subsidy on rukapayFee).
 */
export function normalizeFeeBreakdown(transaction: {
  fee?: number | string | null
  rukapayFee?: number | string | null
  thirdPartyFee?: number | string | null
  governmentTax?: number | string | null
  processingFee?: number | string | null
  networkFee?: number | string | null
  complianceFee?: number | string | null
  metadata?: {
    feeBreakdown?: Record<string, unknown>
    gatewayPartnerRukapayFee?: number | string | null
    gatewayPartnerMnoFee?: number | string | null
    gatewayPartnerTelecomCharge?: number | string | null
  } | null
}): NormalizedFeeBreakdown {
  const metadata = transaction?.metadata || {}
  const feeBreakdown = metadata.feeBreakdown || {}

  if (isAirtimeFaceValueLedger(transaction)) {
    const rukapayFee = resolveAirtimeFaceValueRukapayFee(transaction, feeBreakdown)
    return {
      rukapayFee,
      partnerFee: 0,
      governmentTax: 0,
      totalFee: rukapayFee,
      processingFee: 0,
      networkFee: 0,
      complianceFee: 0,
      telecomBankCharge: 0,
    }
  }

  const hasExplicitRukapayInBreakdown =
    feeBreakdown.rukapayFee != null && Number.isFinite(Number(feeBreakdown.rukapayFee))

  let rukapayFee = pickFee(
    feeBreakdown.rukapayFee,
    transaction?.rukapayFee,
    metadata.gatewayPartnerRukapayFee,
  )

  const partnerFee = pickFee(
    feeBreakdown.partnerFee ?? feeBreakdown.thirdPartyFee,
    transaction?.thirdPartyFee,
    metadata.gatewayPartnerMnoFee ?? metadata.gatewayPartnerTelecomCharge,
  )

  const governmentTax = pickFee(
    feeBreakdown.governmentTax ?? feeBreakdown.govTax,
    transaction?.governmentTax,
  )

  const processingFee = finiteOrZero(
    feeBreakdown.processingFee ?? transaction?.processingFee,
  )
  const networkFee = finiteOrZero(feeBreakdown.networkFee ?? transaction?.networkFee)
  const complianceFee = finiteOrZero(
    feeBreakdown.complianceFee ?? transaction?.complianceFee,
  )
  const telecomBankCharge = finiteOrZero(
    feeBreakdown.telecomBankCharge ?? metadata.gatewayPartnerTelecomCharge,
  )

  let totalFee: number
  if (feeBreakdown.totalFee != null && Number.isFinite(Number(feeBreakdown.totalFee))) {
    totalFee = Number(feeBreakdown.totalFee)
  } else {
    const calculatedTotalFees =
      rukapayFee +
      partnerFee +
      governmentTax +
      processingFee +
      networkFee +
      complianceFee +
      telecomBankCharge
    totalFee =
      calculatedTotalFees !== 0
        ? calculatedTotalFees
        : finiteOrZero(transaction?.fee)
  }

  // When only aggregate fee is persisted, attribute residual to RukaPay fee (signed)
  if (!hasExplicitRukapayInBreakdown && rukapayFee === 0 && totalFee !== 0) {
    const otherComponents =
      partnerFee +
      governmentTax +
      processingFee +
      networkFee +
      complianceFee +
      telecomBankCharge
    const remaining = totalFee - otherComponents
    if (remaining !== 0) {
      rukapayFee = remaining
    }
  }

  return {
    rukapayFee,
    partnerFee,
    governmentTax,
    totalFee,
    processingFee,
    networkFee,
    complianceFee,
    telecomBankCharge,
  }
}

/** RukaPay fee only — used by ledger table column. */
export function getNormalizedRukapayFee(transaction: Parameters<typeof normalizeFeeBreakdown>[0]): number {
  return normalizeFeeBreakdown(transaction).rukapayFee
}

export interface ExportFeeColumns {
  rukapayFee: number
  telecomFee: number
  partnerFee: number
}

function exportFinite(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function feesAreSame(a: number, b: number): boolean {
  return a > 0 && b > 0 && Math.abs(a - b) < 0.02
}

function isMnoCodeOrName(value: string): boolean {
  const normalized = value.trim().toUpperCase()
  if (!normalized) return false
  return (
    /^(MTN|AIRTEL)$/.test(normalized) ||
    /\bMTN\b/.test(normalized) ||
    /\bAIRTEL\b/.test(normalized)
  )
}

/** External payment integrator (ABC, Pegasus) — not the MNO rail. */
function isExternalIntegratorCode(code: string): boolean {
  const normalized = code.trim().toUpperCase()
  if (!normalized || isMnoCodeOrName(normalized)) return false
  return /^(ABC|PEGASUS|NEXEN)/.test(normalized) || normalized.includes('PEGASUS')
}

type ExternalFeeRailKind = 'mno' | 'integrator' | 'unknown'

/** Underlying payment rail is Airtel/MTN (not BOBPLUS/LIPAD gateway). */
export function isMnoRailTransaction(tx: {
  partnerMapping?: {
    partner?: { partnerCode?: string | null; partnerName?: string | null }
    network?: string | null
  } | null
  metadata?: Record<string, unknown> | null
}): boolean {
  const mappingCode = String(tx.partnerMapping?.partner?.partnerCode || '')
  if (isMnoCodeOrName(mappingCode)) return true
  const mappingName = String(tx.partnerMapping?.partner?.partnerName || '')
  if (isMnoCodeOrName(mappingName)) return true
  const mappingNetwork = String(tx.partnerMapping?.network || '')
  if (isMnoCodeOrName(mappingNetwork)) return true
  const meta = tx.metadata || {}
  const mnoProvider = String(
    meta.mnoProvider || meta.network || meta.mnoNetwork || '',
  ).toLowerCase()
  if (mnoProvider.includes('mtn') || mnoProvider.includes('airtel')) return true
  const collBreakdown = meta.collectionFeeBreakdown as Record<string, unknown> | undefined
  if (collBreakdown && exportFinite(collBreakdown.mnoPartnerFee) > 0) return true
  return false
}

/** API gateway partner (BOBPLUS, LIPAD) routing through an MNO product. */
function isApiGatewayMnoTransaction(tx: {
  channel?: string | null
  type?: string | null
  partner?: { partnerCode?: string | null; partnerName?: string | null } | null
  partnerId?: string | null
  metadata?: Record<string, unknown> | null
}): boolean {
  const meta = tx.metadata || {}
  const type = String(tx.type || '').toUpperCase()
  const channel = String(tx.channel || meta.channel || '').toUpperCase()
  const isMnoType =
    type.includes('MNO_TO_WALLET') ||
    type.includes('WALLET_TO_MNO') ||
    String(meta.transactionModeCode || meta.mode || '').includes('MNO')
  if (!isMnoType || channel !== 'API') return false
  return Boolean(
    tx.partnerId ||
      tx.partner?.partnerCode ||
      tx.partner?.partnerName ||
      meta.isApiPartnerTransaction ||
      meta.isPartnerTransaction ||
      meta.apiPartnerName,
  )
}

function resolveExternalIntegratorPartnerCode(tx: {
  partnerMapping?: { partner?: { partnerCode?: string | null } } | null
  metadata?: Record<string, unknown> | null
}): string {
  const mappingCode = String(tx.partnerMapping?.partner?.partnerCode || '').toUpperCase()
  if (isExternalIntegratorCode(mappingCode)) return mappingCode
  const meta = tx.metadata || {}
  const metaCode = String(meta.partnerCode || meta.integration || '').toUpperCase()
  if (isExternalIntegratorCode(metaCode)) return metaCode
  return ''
}

function resolveExternalFeeRailKind(
  tx: Parameters<typeof resolveExportFeeColumns>[0],
  partnerLabel?: string,
): ExternalFeeRailKind {
  if (resolveExternalIntegratorPartnerCode(tx)) return 'integrator'
  if (isMnoRailTransaction(tx) || isApiGatewayMnoTransaction(tx)) return 'mno'
  if (partnerLabel && isMnoCodeOrName(partnerLabel)) return 'mno'
  return 'unknown'
}

/**
 * Collapse duplicate external fees into a single bucket.
 * Both columns are only kept when telecom and partner are genuinely different
 * (e.g. Pegasus integrator fee + separate MNO rail charge).
 */
function collapseExternalFeeBuckets(
  telecomFee: number,
  partnerFee: number,
  thirdPartyFee: number,
  railKind: ExternalFeeRailKind,
): { telecomFee: number; partnerFee: number } {
  const hasDistinctTripleSplit =
    telecomFee > 0 && partnerFee > 0 && !feesAreSame(telecomFee, partnerFee)

  if (hasDistinctTripleSplit) {
    return { telecomFee, partnerFee }
  }

  const externalShare = Math.max(telecomFee, partnerFee, thirdPartyFee)
  if (externalShare <= 0) {
    return { telecomFee: 0, partnerFee: 0 }
  }

  if (railKind === 'mno') {
    return { telecomFee: externalShare, partnerFee: 0 }
  }
  if (railKind === 'integrator') {
    return { telecomFee: 0, partnerFee: externalShare }
  }

  // Unknown rail: never double-count the same external fee in both columns.
  if (feesAreSame(telecomFee, partnerFee) || partnerFee === 0 || telecomFee === 0) {
    return { telecomFee: externalShare, partnerFee: 0 }
  }

  return { telecomFee, partnerFee }
}

/**
 * Export columns: Telecom Fee / Partner Fee / RukaPay Fee.
 * Usually only one of telecom or partner is populated — both only when the tariff
 * has a genuine extra split (e.g. Pegasus integrator + separate MNO rail charge).
 */
export function resolveExportFeeColumns(tx: {
  fee?: number | string | null
  rukapayFee?: number | string | null
  thirdPartyFee?: number | string | null
  direction?: string | null
  channel?: string | null
  type?: string | null
  partnerId?: string | null
  partner?: { partnerCode?: string | null; partnerName?: string | null } | null
  partnerMapping?: {
    partner?: { partnerCode?: string | null; partnerName?: string | null }
    network?: string | null
  } | null
  metadata?: Record<string, unknown> | null
  partnerLabel?: string
}): ExportFeeColumns {
  const metadata = tx.metadata || {}
  const feeBreakdown = (metadata.feeBreakdown as Record<string, unknown>) || {}
  const normalized = normalizeFeeBreakdown(tx)

  if (isAirtimeFaceValueLedger(tx)) {
    const rukapayFee = resolveAirtimeFaceValueRukapayFee(tx, feeBreakdown)
    return { rukapayFee, telecomFee: 0, partnerFee: 0 }
  }

  const isSweep =
    metadata.sweepToDisbursement === true || metadata.sweepFromCollection === true
  const isLiquidationLike =
    isSweep ||
    (String(tx.channel || '').toUpperCase() === 'BACKOFFICE' &&
      String(tx.type || '').toUpperCase() === 'WALLET_TO_WALLET' &&
      /liquidate:/i.test(String(metadata.description || '')))

  if (isSweep) {
    const sweepFeeAmount = exportFinite(metadata.sweepFeeAmount)
    if (String(tx.direction || '').toUpperCase() === 'CREDIT' || sweepFeeAmount <= 0) {
      return { rukapayFee: 0, telecomFee: 0, partnerFee: 0 }
    }
    const rukapayFee =
      exportFinite(metadata.sweepRukapayFeeAmount) ||
      exportFinite(tx.rukapayFee) ||
      Number((sweepFeeAmount * 0.2).toFixed(2))
    const telecomFee =
      exportFinite(metadata.sweepPartnerFeeAmount) ||
      exportFinite(tx.thirdPartyFee) ||
      Number((sweepFeeAmount * 0.8).toFixed(2))
    return { rukapayFee, telecomFee, partnerFee: 0 }
  }

  if (isLiquidationLike && normalized.rukapayFee === 0) {
    return {
      rukapayFee: exportFinite(tx.fee),
      telecomFee: 0,
      partnerFee: 0,
    }
  }

  let rukapayFee = exportFinite(
    feeBreakdown.rukapayFee ?? metadata.gatewayPartnerRukapayFee ?? normalized.rukapayFee,
  )

  let telecomFee = exportFinite(
    feeBreakdown.telecomBankCharge ?? metadata.gatewayPartnerTelecomCharge,
  )
  let partnerFee = exportFinite(
    feeBreakdown.partnerFee ?? feeBreakdown.thirdPartyFee ?? tx.thirdPartyFee,
  )

  // gatewayPartnerMnoFee is always the MNO rail share — belongs in telecom, never partner.
  const gwMnoFee = exportFinite(metadata.gatewayPartnerMnoFee)
  if (gwMnoFee > 0) {
    telecomFee = Math.max(telecomFee, gwMnoFee)
  }

  const thirdPartyFee =
    exportFinite(tx.thirdPartyFee) || normalized.partnerFee || normalized.telecomBankCharge

  const railKind = resolveExternalFeeRailKind(tx, tx.partnerLabel)
  const collapsed = collapseExternalFeeBuckets(
    telecomFee,
    partnerFee,
    thirdPartyFee,
    railKind,
  )
  telecomFee = collapsed.telecomFee
  partnerFee = collapsed.partnerFee

  if (rukapayFee === 0 && normalized.rukapayFee !== 0) {
    rukapayFee = normalized.rukapayFee
  }

  return { rukapayFee, telecomFee, partnerFee }
}
