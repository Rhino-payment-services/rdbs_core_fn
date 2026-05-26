type TariffFeeDisplayInput = {
  feeType?: string
  currency?: string
}

function finiteNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** True when FIXED tariff stores split fields as UGX (e.g. 500) not percent points (e.g. 2). */
export function tariffSplitFieldsAreFixedUgx(tariff: TariffFeeDisplayInput & {
  rukapayFee?: unknown
  telecomBankCharge?: unknown
  partnerFee?: unknown
}): boolean {
  if (tariff.feeType !== 'FIXED') return false
  const fields = [tariff.rukapayFee, tariff.telecomBankCharge, tariff.partnerFee]
  return fields.some((field) => {
    const n = finiteNumber(field)
    return n !== null && Math.abs(n) > 100
  })
}

/**
 * Format rukapay / telecom / partner split for tariff tables.
 * FIXED tiers with large values → UGX; otherwise human percent points or decimal %.
 */
export function formatTariffSplitField(
  value: unknown,
  tariff: TariffFeeDisplayInput,
): string | null {
  const n = finiteNumber(value)
  if (n === null) return null

  const currency = tariff.currency || 'UGX'

  if (tariffSplitFieldsAreFixedUgx(tariff)) {
    return `${n.toLocaleString()} ${currency}`
  }

  // Decimal rate stored as 0.017 → 1.7%; human point 0.5 or 2 → 0.5% / 2%
  if (n !== 0 && Math.abs(n) < 0.1) {
    return `${(n * 100).toFixed(3)}%`
  }
  if (Math.abs(n) <= 1 && n !== 0) {
    return `${n}%`
  }
  if ((n > 1 && n <= 100) || (n < -1 && n >= -100)) {
    return `${n}%`
  }

  return `${n.toLocaleString()} ${currency}`
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
