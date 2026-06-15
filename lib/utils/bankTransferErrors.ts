/** Map backend bank-transfer errors to user-friendly UI copy. */
export function mapBankTransferError(message: string): string {
  const raw = message?.trim() || ''
  const upper = raw.toUpperCase()

  if (
    upper.includes('NO EXTERNAL PARTNER MAPPED') ||
    upper.includes('NOT AVAILABLE FOR TRANSFERS') ||
    upper.includes('NOT ROUTABLE')
  ) {
    return 'Transfers to this bank are temporarily unavailable.'
  }

  if (
    (upper.includes('UNKNOWN') && upper.includes('SORT CODE')) ||
    upper.includes('INACTIVE SORT CODE') ||
    upper.includes('INVALID BANK') ||
    upper.includes('BANK NOT FOUND')
  ) {
    return 'Invalid bank selected.'
  }

  if (
    upper.includes('PARTNER NOT AVAILABLE') ||
    upper.includes('PARTNER IS SUSPENDED') ||
    upper.includes('PARTNER SUSPENDED') ||
    upper.includes('TEMPORARILY UNAVAILABLE')
  ) {
    return 'Bank transfers via this bank are temporarily unavailable.'
  }

  if (
    upper.includes('INVALID SORT CODE') ||
    upper.includes('SORT CODE FORMAT') ||
    upper.includes('MUST BE 6') ||
    upper.includes('6-DIGIT')
  ) {
    return 'Please select a valid bank from the list.'
  }

  return raw || 'Bank transfer validation failed.'
}
