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

/** Government tax is always shown as a percentage. */
export function formatTariffGovernmentTax(value: unknown): string | null {
  const n = finiteNumber(value)
  if (n === null) return null
  if (Math.abs(n) <= 1 && n !== 0) {
    return `${(n * 100).toFixed(2)}%`
  }
  return `${n}%`
}
