/** Extract account holder / recipient name from POST /transactions/validate response. */
export function extractValidationRecipientName(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null

  const p = payload as Record<string, unknown>
  const validationResult = p.validationResult as Record<string, unknown> | undefined
  const data = validationResult?.data as Record<string, unknown> | undefined
  const beneficiary = p.beneficiary as Record<string, unknown> | undefined
  const topData = p.data as Record<string, unknown> | undefined

  const candidates = [
    beneficiary?.name,
    validationResult?.accountName,
    validationResult?.customerName,
    data?.accountName,
    data?.name,
    data?.customerName,
    p.accountName,
    topData?.accountName,
    topData?.name,
    topData?.customerName,
  ]

  for (const raw of candidates) {
    if (typeof raw !== 'string') continue
    const trimmed = raw.trim()
    if (trimmed.length < 2) continue
    const upper = trimmed.toUpperCase()
    if (
      upper.includes('RECIPIENT NOT FOUND') ||
      upper.includes('NO WALLET') ||
      upper === 'BANK ACCOUNT HOLDER' ||
      upper === 'PEGASUS ACCOUNT HOLDER'
    ) {
      continue
    }
    return trimmed
  }

  return null
}
