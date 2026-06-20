import type { TransactionMode } from '@/lib/hooks/useTransactionModes'

/** Prefer product labels over legacy DB display names */
const TRANSACTION_MODE_DISPLAY_OVERRIDES: Record<string, string> = {
  MERCHANT_TO_WALLET: 'Merchant Payment',
}

/** Compact label for trigger and selected value */
export function transactionModeShortLabel(mode: TransactionMode): string {
  const title =
    TRANSACTION_MODE_DISPLAY_OVERRIDES[mode.code] ||
    mode.displayName?.trim() ||
    mode.name?.trim() ||
    mode.code
  return `${title} (${mode.code})`
}

/** Optional one-line hint under the field after selection */
export function transactionModeDescription(mode: TransactionMode | undefined): string | null {
  if (!mode?.description?.trim()) return null
  return mode.description.trim()
}
