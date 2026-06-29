import {
  getFeeSplitModeFromMetadata,
  type FeeSplitFieldKey,
} from '@/lib/constants/tariff-fee-split'

export type TariffFeeDisplayInput = {
  feeType?: string
  currency?: string
  feeAmount?: unknown
  feePercentage?: unknown
  telecomBankCharge?: unknown
  rukapayFee?: unknown
  partnerFee?: unknown
  governmentTax?: unknown
  metadata?: unknown
}

function finiteNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function fieldKeyFromTariffField(
  field: 'partnerFee' | 'rukapayFee' | 'telecomBankCharge' | 'governmentTax',
): FeeSplitFieldKey {
  return field
}

/**
 * Format rukapay / telecom / partner / government split for tariff tables.
 */
export function formatTariffSplitField(
  value: unknown,
  tariff: TariffFeeDisplayInput,
  field?: 'partnerFee' | 'rukapayFee' | 'telecomBankCharge' | 'governmentTax',
): string | null {
  const n = finiteNumber(value)
  if (n === null || n === 0) return null

  const currency = tariff.currency || 'UGX'
  const metadata = tariff.metadata as Record<string, unknown> | undefined
  const explicitMode =
    field != null
      ? getFeeSplitModeFromMetadata(metadata, fieldKeyFromTariffField(field))
      : null

  if (explicitMode === 'FIXED_UGX') {
    return `${n.toLocaleString()} ${currency}`
  }
  if (explicitMode === 'PERCENT_OF_FEE') {
    return `${n}% of charge`
  }
  if (explicitMode === 'PERCENT_OF_PRINCIPAL') {
    return `${n}% of amount`
  }
  if (explicitMode === 'RESIDUAL') {
    return 'Residual'
  }

  if (Math.abs(n) > 100) {
    return `${n.toLocaleString()} ${currency}`
  }

  if (Math.abs(n) < 0.1) {
    return `${(n * 100).toFixed(3)}%`
  }

  return `${n}%`
}

/** Split field stored as fixed UGX (e.g. 600), not a percent point. Mirrors backend. */
export function tariffSplitFieldIsFixedUgx(value: unknown): boolean {
  const n = finiteNumber(value)
  return n !== null && n !== 0 && Math.abs(n) > 100
}

/**
 * Customer fee is a % of principal; a fixed UGX share goes to MNO; RukaPay keeps the remainder.
 * Applies to PERCENTAGE and HYBRID tariffs (LIPAD G3/G5 are often still HYBRID in the DB).
 */
export function tariffUsesPercentageWithFixedMnoDeduction(
  tariff: TariffFeeDisplayInput,
): boolean {
  if (!tariffSplitFieldIsFixedUgx(tariff.telecomBankCharge)) {
    return false
  }
  const pct = finiteNumber(tariff.feePercentage)
  if (pct === null || pct === 0) {
    return false
  }
  return tariff.feeType === 'PERCENTAGE' || tariff.feeType === 'HYBRID'
}

export function formatTariffPercentRate(feePercentage: unknown): string | null {
  const n = finiteNumber(feePercentage)
  if (n === null) return null
  const pct = n > 0 && n <= 1 ? n * 100 : n
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(pct) + '%'
}

/** RukaPay share is not stored; computed as total fee minus other shares. */
export function shouldShowRukapayResidual(tariff: TariffFeeDisplayInput): boolean {
  const rukapay = finiteNumber(tariff.rukapayFee)
  if (rukapay !== null && rukapay !== 0) return false
  const metadata = tariff.metadata as Record<string, unknown> | undefined
  const rukapayMode = getFeeSplitModeFromMetadata(metadata, 'rukapayFee')
  if (rukapayMode === 'RESIDUAL') return true
  return tariffUsesPercentageWithFixedMnoDeduction(tariff)
}

/** Government tax split — uses feeSplitMode when set, else legacy percent display. */
export function formatTariffGovernmentTax(
  value: unknown,
  tariff?: TariffFeeDisplayInput,
): string | null {
  const n = finiteNumber(value)
  if (n === null || n === 0) return null

  const metadata = tariff?.metadata as Record<string, unknown> | undefined
  const explicitMode = getFeeSplitModeFromMetadata(metadata, 'governmentTax')
  if (explicitMode === 'FIXED_UGX') {
    const currency = tariff?.currency || 'UGX'
    return `${n.toLocaleString()} ${currency}`
  }
  if (explicitMode === 'PERCENT_OF_FEE') {
    return `${n}% of charge`
  }
  if (explicitMode === 'PERCENT_OF_PRINCIPAL') {
    return `${n}% of amount`
  }
  if (explicitMode === 'RESIDUAL') {
    return 'Residual'
  }

  if (Math.abs(n) <= 1 && n !== 0) {
    return `${(n * 100).toFixed(2)}%`
  }
  return `${n}%`
}
