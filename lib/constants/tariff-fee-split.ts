export type FeeSplitFieldKey =
  | 'partnerFee'
  | 'rukapayFee'
  | 'telecomBankCharge'
  | 'governmentTax'

export type FeeSplitFieldMode =
  | 'FIXED_UGX'
  | 'PERCENT_OF_PRINCIPAL'
  | 'PERCENT_OF_FEE'
  | 'RESIDUAL'

export type FeeSplitModeMetadata = Partial<
  Record<FeeSplitFieldKey, FeeSplitFieldMode>
>

export const FEE_SPLIT_FIELD_KEYS: FeeSplitFieldKey[] = [
  'partnerFee',
  'rukapayFee',
  'telecomBankCharge',
  'governmentTax',
]

export const FEE_SPLIT_FIELD_LABELS: Record<FeeSplitFieldKey, string> = {
  partnerFee: 'Partner fee',
  rukapayFee: 'RukaPay fee',
  telecomBankCharge: 'Telecom / bank charge',
  governmentTax: 'Government tax',
}

export const FEE_SPLIT_MODE_OPTIONS: {
  value: FeeSplitFieldMode
  label: string
}[] = [
  { value: 'FIXED_UGX', label: 'Fixed amount (UGX)' },
  { value: 'PERCENT_OF_FEE', label: '% of total charge' },
  { value: 'PERCENT_OF_PRINCIPAL', label: '% of transaction amount' },
  { value: 'RESIDUAL', label: 'Residual (remainder)' },
]

export const DEFAULT_FEE_SPLIT_MODE: FeeSplitModeMetadata = {
  partnerFee: 'PERCENT_OF_FEE',
  telecomBankCharge: 'PERCENT_OF_FEE',
  governmentTax: 'PERCENT_OF_FEE',
  rukapayFee: 'RESIDUAL',
}

/** Merchant tariffs default to fixed UGX so the four shares add to a real total. */
export const MERCHANT_DEFAULT_FEE_SPLIT_MODE: FeeSplitModeMetadata = {
  partnerFee: 'FIXED_UGX',
  telecomBankCharge: 'FIXED_UGX',
  governmentTax: 'FIXED_UGX',
  rukapayFee: 'FIXED_UGX',
}

export function defaultFeeSplitModeForTariffType(
  tariffType: string,
): FeeSplitModeMetadata {
  return tariffType === 'MERCHANT'
    ? MERCHANT_DEFAULT_FEE_SPLIT_MODE
    : DEFAULT_FEE_SPLIT_MODE
}

export type FeeSplitValues = Partial<Record<FeeSplitFieldKey, number | undefined>>

export function getEffectiveFeeSplitMode(
  metadata: Record<string, unknown> | undefined,
  field: FeeSplitFieldKey,
): FeeSplitFieldMode {
  return getFeeSplitModeFromMetadata(metadata, field) ?? 'FIXED_UGX'
}

export function sumFixedUgxFeeSplit(
  values: FeeSplitValues,
  metadata: Record<string, unknown> | undefined,
): number {
  return FEE_SPLIT_FIELD_KEYS.reduce((sum, key) => {
    if (getEffectiveFeeSplitMode(metadata, key) !== 'FIXED_UGX') return sum
    return sum + (Number(values[key]) || 0)
  }, 0)
}

export function percentOfFeeAllocated(
  values: FeeSplitValues,
  metadata: Record<string, unknown> | undefined,
): number {
  return FEE_SPLIT_FIELD_KEYS.reduce((sum, key) => {
    if (getEffectiveFeeSplitMode(metadata, key) !== 'PERCENT_OF_FEE') return sum
    return sum + (Number(values[key]) || 0)
  }, 0)
}

export function formatFeeSplitPart(
  key: FeeSplitFieldKey,
  value: number | undefined,
  currency: string,
  metadata: Record<string, unknown> | undefined,
): string {
  const mode = getEffectiveFeeSplitMode(metadata, key)
  const n = Number(value) || 0
  const label = FEE_SPLIT_FIELD_LABELS[key]
  switch (mode) {
    case 'PERCENT_OF_FEE':
      return `${label}: ${n}% of charge`
    case 'PERCENT_OF_PRINCIPAL':
      return `${label}: ${n}% of amount`
    case 'RESIDUAL':
      return `${label}: residual`
    default:
      return `${label}: ${currency} ${n.toFixed(2)}`
  }
}

export function getFeeSplitModeFromMetadata(
  metadata: Record<string, unknown> | undefined,
  field: FeeSplitFieldKey,
): FeeSplitFieldMode | null {
  const modes = metadata?.feeSplitMode as FeeSplitModeMetadata | undefined
  return modes?.[field] ?? null
}

export function feeSplitModeHint(mode: FeeSplitFieldMode): string {
  switch (mode) {
    case 'FIXED_UGX':
      return 'Enter a flat UGX amount (e.g. 400).'
    case 'PERCENT_OF_FEE':
      return 'Percent of the customer charge (e.g. 40 = 40% of fee).'
    case 'PERCENT_OF_PRINCIPAL':
      return 'Percent of payout/transaction amount (e.g. 2 = 2%).'
    case 'RESIDUAL':
      return 'Receives whatever remains after other shares.'
    default:
      return ''
  }
}

export function feeSplitValueSuffix(mode: FeeSplitFieldMode): string {
  switch (mode) {
    case 'PERCENT_OF_FEE':
    case 'PERCENT_OF_PRINCIPAL':
      return '%'
    case 'RESIDUAL':
      return 'auto'
    default:
      return ''
  }
}

export function isFeeSplitTariffType(tariffType: string): boolean {
  return tariffType === 'EXTERNAL' || tariffType === 'MERCHANT'
}

export function shouldShowFeeSplitModeSelectors(input: {
  tariffType: string
  feeType: string
  transactionType: string
  isExternalMnoToWallet: boolean
}): boolean {
  if (input.isExternalMnoToWallet) {
    return false
  }
  if (input.tariffType === 'MERCHANT') {
    return (
      input.feeType === 'HYBRID' ||
      input.feeType === 'FIXED' ||
      input.feeType === 'PERCENTAGE'
    )
  }
  if (input.tariffType !== 'EXTERNAL') {
    return false
  }
  return (
    input.feeType === 'HYBRID' ||
    (input.feeType === 'FIXED' && input.transactionType === 'WITHDRAWAL')
  )
}

export function mergeFeeSplitModeIntoMetadata(
  metadata: Record<string, unknown> | undefined,
  feeSplitMode: FeeSplitModeMetadata | undefined,
  persist: boolean,
): Record<string, unknown> | undefined {
  const base = { ...(metadata ?? {}) }
  if (!persist || !feeSplitMode) {
    return Object.keys(base).length > 0 ? base : undefined
  }
  return {
    ...base,
    feeSplitMode,
  }
}
