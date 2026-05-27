type TariffFeeDisplayInput = {
  feeType?: string
  currency?: string
}

function finiteNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/**
 * Format rukapay / telecom / partner split for tariff tables.
 * Non-percentage tariffs are shown in currency amounts.
 */
export function formatTariffSplitField(
  value: unknown,
  tariff: TariffFeeDisplayInput,
): string | null {
  const n = finiteNumber(value)
  if (n === null) return null

  const currency = tariff.currency || 'UGX'

  if (tariff.feeType && tariff.feeType !== 'PERCENTAGE') {
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
