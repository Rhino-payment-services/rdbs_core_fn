/** Spendable = total balance minus dispute floor. Never negative. */
export function getAvailableBalance(
  balance: unknown,
  frozenBalance?: unknown,
): number {
  const bal = toMoneyNumber(balance)
  const frozen = toMoneyNumber(frozenBalance)
  const available = bal - frozen
  return available > 0 ? available : 0
}

export function toMoneyNumber(value: unknown): number {
  if (value == null) return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}
