import type { TransactionMode } from '@/lib/hooks/useTransactionModes'

/** Compact label for trigger and selected value */
export function transactionModeShortLabel(mode: TransactionMode): string {
  const title = mode.displayName?.trim() || mode.name?.trim() || mode.code
  return `${title} (${mode.code})`
}

/** Optional one-line hint under the field after selection */
export function transactionModeDescription(mode: TransactionMode | undefined): string | null {
  if (!mode?.description?.trim()) return null
  return mode.description.trim()
}
