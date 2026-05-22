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
  const telecomBankCharge = finiteOrZero(feeBreakdown.telecomBankCharge)

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

  // When only aggregate fee is persisted, attribute residual to RukaPay fee
  if (!hasExplicitRukapayInBreakdown && rukapayFee === 0 && totalFee > 0) {
    const otherComponents =
      partnerFee +
      governmentTax +
      processingFee +
      networkFee +
      complianceFee +
      telecomBankCharge
    const remaining = totalFee - otherComponents
    if (remaining > 0) {
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
