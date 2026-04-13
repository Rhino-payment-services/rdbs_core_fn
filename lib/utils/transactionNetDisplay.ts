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
  const meta = (transaction as any)?.metadata || {}
  const feeBreakdown = meta?.feeBreakdown || {}

  const totalFeeFromBreakdown =
    feeBreakdown.totalFee != null ? Number(feeBreakdown.totalFee) : NaN
  const aggregateFeeComponents =
    (Number(feeBreakdown.rukapayFee) || Number((transaction as any)?.rukapayFee) || 0) +
    (Number(feeBreakdown.partnerFee) ||
      Number(feeBreakdown.thirdPartyFee) ||
      Number((transaction as any)?.thirdPartyFee) ||
      0) +
    (Number(feeBreakdown.governmentTax) ||
      Number(feeBreakdown.govTax) ||
      Number((transaction as any)?.governmentTax) ||
      0) +
    (Number(feeBreakdown.processingFee) || Number((transaction as any)?.processingFee) || 0) +
    (Number(feeBreakdown.networkFee) || Number((transaction as any)?.networkFee) || 0) +
    (Number(feeBreakdown.complianceFee) || Number((transaction as any)?.complianceFee) || 0) +
    (Number(feeBreakdown.telecomBankCharge) || 0)

  const totalCharges = Number.isFinite(totalFeeFromBreakdown)
    ? totalFeeFromBreakdown
    : aggregateFeeComponents > 0
      ? aggregateFeeComponents
      : fee

  const meta = (transaction as any)?.metadata || {}
  const feeBreakdown = meta?.feeBreakdown || {}

  const totalFeeFromBreakdown =
    feeBreakdown.totalFee != null ? Number(feeBreakdown.totalFee) : NaN
  const aggregateFeeComponents =
    (Number(feeBreakdown.rukapayFee) || Number((transaction as any)?.rukapayFee) || 0) +
    (Number(feeBreakdown.partnerFee) ||
      Number(feeBreakdown.thirdPartyFee) ||
      Number((transaction as any)?.thirdPartyFee) ||
      0) +
    (Number(feeBreakdown.governmentTax) ||
      Number(feeBreakdown.govTax) ||
      Number((transaction as any)?.governmentTax) ||
      0) +
    (Number(feeBreakdown.processingFee) || Number((transaction as any)?.processingFee) || 0) +
    (Number(feeBreakdown.networkFee) || Number((transaction as any)?.networkFee) || 0) +
    (Number(feeBreakdown.complianceFee) || Number((transaction as any)?.complianceFee) || 0) +
    (Number(feeBreakdown.telecomBankCharge) || 0)

  const totalCharges = Number.isFinite(totalFeeFromBreakdown)
    ? totalFeeFromBreakdown
    : aggregateFeeComponents > 0
      ? aggregateFeeComponents
      : fee

  const isWalletToMnoDebit =
    transaction.type === 'WALLET_TO_MNO' &&
    String(transaction.direction ?? '').toUpperCase() === 'DEBIT'
  const isDebit = String(transaction.direction ?? '').toUpperCase() === 'DEBIT'
  const isCollectionCredit =
    (transaction.type === 'MNO_TO_WALLET' || transaction.type === 'WALLET_TOPUP_PULL') &&
    String(transaction.direction ?? '').toUpperCase() !== 'DEBIT'
  const isCollectionCredit =
    (transaction.type === 'MNO_TO_WALLET' || transaction.type === 'WALLET_TOPUP_PULL') &&
    String(transaction.direction ?? '').toUpperCase() !== 'DEBIT'

  if (isWalletToMnoDebit || isDebit) {
    const totalDebit = amount + totalCharges
  if (isWalletToMnoDebit) {
    const totalDebit = amount + totalCharges
    if (Number.isFinite(net) && Math.abs(net - totalDebit) < 0.01) {
      return net
    }
    return totalDebit
  }

  if (isCollectionCredit) {
    if (Number.isFinite(net) && net > 0 && net !== amount) {
      return net
    }
    return Math.max(0, amount - totalCharges)
  }

  if (isCollectionCredit) {
    if (Number.isFinite(net) && net > 0 && net !== amount) {
      return net
    }
    return Math.max(0, amount - totalCharges)
  }

  if (Number.isFinite(net) && (fee === 0 || net !== amount)) {
    return net
  }
  return Math.max(0, amount - totalCharges)
  return Math.max(0, amount - totalCharges)
}
