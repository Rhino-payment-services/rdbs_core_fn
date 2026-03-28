/**
 * Single definition for "Net Amount" / total wallet impact shown in admin UI and CSV exports.
 * Aligns with backend: disbursement netAmount = amount + fees (total debited).
 */
export function getDisplayNetAmount(transaction: {
  type?: string | null
  direction?: string | null
  amount?: number | string | null
  fee?: number | string | null
  netAmount?: number | string | null
  status?: string | null
}): number | null {
  const status = String(transaction.status ?? '').toUpperCase()
  if (status === 'FAILED' || status === 'CANCELLED') {
    return null
  }

  const amount = Number(transaction.amount) || 0
  const fee = Number(transaction.fee) || 0
  const net = Number(transaction.netAmount)
  const isWalletToMnoDebit =
    transaction.type === 'WALLET_TO_MNO' &&
    String(transaction.direction ?? '').toUpperCase() === 'DEBIT'

  if (isWalletToMnoDebit) {
    const totalDebit = amount + fee
    if (Number.isFinite(net) && Math.abs(net - totalDebit) < 0.01) {
      return net
    }
    return totalDebit
  }

  if (Number.isFinite(net) && (fee === 0 || net !== amount)) {
    return net
  }
  return Math.max(0, amount - fee)
}
