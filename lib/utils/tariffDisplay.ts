export type TariffFeeDisplayInput = {
  feeType?: string
  currency?: string
  feeAmount?: unknown
  feePercentage?: unknown
  telecomBankCharge?: unknown
  rukapayFee?: unknown
  partnerFee?: unknown
}

function finiteNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Format rukapay / telecom / partner split for tariff tables.
 *
 * Detection logic mirrors the backend `tariffSplitFieldsAreFixedUgx`:
 *   - abs(value) > 100  → fixed UGX amount (shown as "600 UGX")
 *   - abs(value) ≤ 100  → human percent point (shown as "2%")
 *   - value === 0       → null (zero means "no configured split" or "residual — computed at runtime")
 */
export function formatTariffSplitField(
  value: unknown,
  tariff: TariffFeeDisplayInput,
): string | null {
  const n = finiteNumber(value)
  if (n === null || n === 0) return null

  const currency = tariff.currency || 'UGX'

  // Fixed UGX: any non-zero value whose magnitude exceeds 100 is a currency amount.
  if (Math.abs(n) > 100) {
    return `${n.toLocaleString()} ${currency}`
  }

  // Decimal rate stored as 0.017 → 1.7%
  if (Math.abs(n) < 0.1) {
    return `${(n * 100).toFixed(3)}%`
  }

  // Human percent point: 0.5, 2, 1.5 → shown as-is with %
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

/** RukaPay share is not stored; computed as total fee minus fixed MNO amount. */
export function shouldShowRukapayResidual(tariff: TariffFeeDisplayInput): boolean {
  const rukapay = finiteNumber(tariff.rukapayFee)
  if (rukapay !== null && rukapay !== 0) return false
  return tariffUsesPercentageWithFixedMnoDeduction(tariff)
}

/** Government tax is always shown as a percentage. */
export function formatTariffGovernmentTax(value: unknown): string | null {
  const n = finiteNumber(value)
  if (n === null) return null
  if (Math.abs(n) <= 1 && n !== 0) {
    return `${(n * 100).toFixed(2)}%`
  }
  return `${n}%`
}
