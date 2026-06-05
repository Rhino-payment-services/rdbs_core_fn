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

/** External payment integrator (ABC, Pegasus) — not the MNO rail. */
function isExternalIntegratorCode(code: string): boolean {
  const normalized = code.trim().toUpperCase()
  if (!normalized || /^(MTN|AIRTEL)$/.test(normalized)) return false
  return /^(ABC|PEGASUS|NEXEN)/.test(normalized) || normalized.includes('PEGASUS')
}

/** Underlying payment rail is Airtel/MTN (not BOBPLUS/LIPAD gateway). */
export function isMnoRailTransaction(tx: {
  partnerMapping?: { partner?: { partnerCode?: string | null }; network?: string | null } | null
  metadata?: Record<string, unknown> | null
}): boolean {
  const mappingCode = String(tx.partnerMapping?.partner?.partnerCode || '').toUpperCase()
  if (/^(MTN|AIRTEL)$/.test(mappingCode)) return true
  const mappingNetwork = String(tx.partnerMapping?.network || '').toUpperCase()
  if (/^(MTN|AIRTEL)$/.test(mappingNetwork)) return true
  const meta = tx.metadata || {}
  const mnoProvider = String(meta.mnoProvider || meta.network || '').toLowerCase()
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
  partnerMapping?: { partner?: { partnerCode?: string | null }; network?: string | null } | null
  metadata?: Record<string, unknown> | null
}): ExportFeeColumns {
  const metadata = tx.metadata || {}
  const feeBreakdown = (metadata.feeBreakdown as Record<string, unknown>) || {}
  const normalized = normalizeFeeBreakdown(tx)

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

  // gatewayPartnerMnoFee is the MNO rail share — not a separate gateway cut when it
  // duplicates telecomBankCharge.
  const gwMnoFee = exportFinite(metadata.gatewayPartnerMnoFee)
  if (partnerFee === 0 && gwMnoFee > 0) {
    partnerFee = gwMnoFee
  }

  const thirdPartyFallback = exportFinite(tx.thirdPartyFee) || normalized.partnerFee
  if (telecomFee === 0 && partnerFee === 0 && thirdPartyFallback > 0) {
    if (resolveExternalIntegratorPartnerCode(tx)) {
      partnerFee = thirdPartyFallback
    } else if (isMnoRailTransaction(tx) || isApiGatewayMnoTransaction(tx)) {
      telecomFee = thirdPartyFallback
    } else {
      partnerFee = thirdPartyFallback
    }
  }

  // Same value stored twice (common for BOBPLUS/LIPAD API MNO) — keep one bucket only.
  if (feesAreSame(telecomFee, partnerFee)) {
    if (resolveExternalIntegratorPartnerCode(tx)) {
      telecomFee = 0
    } else if (isMnoRailTransaction(tx) || isApiGatewayMnoTransaction(tx)) {
      partnerFee = 0
    } else {
      partnerFee = 0
    }
  }

  if (rukapayFee === 0 && normalized.rukapayFee !== 0) {
    rukapayFee = normalized.rukapayFee
  }

  return { rukapayFee, telecomFee, partnerFee }
}
