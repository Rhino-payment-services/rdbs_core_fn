"use client"

import { TableCell } from '@/components/ui/table'
import { formatAmount } from '@/lib/utils/transactions'

interface FeeCellProps {
  transaction: any
}

export const RukapayFeeCell = ({ transaction }: FeeCellProps) => {
  const metadata = transaction.metadata || {}
  const feeBreakdown = metadata.feeBreakdown || {}

  // Special case: internal sweep (Liquidate) from collection → disbursement
  // Use sweepFeeAmount attached in metadata so we see the 2.5% fee clearly.
  const sweepFee =
    (metadata.sweepToDisbursement || metadata.sweepFromCollection)
      ? Number(metadata.sweepFeeAmount) || 0
      : 0

  const rukapayFeeFromBreakdown = feeBreakdown.rukapayFee || 0

  // Only show the sweep fee on the DEBIT leg for sweeps; CREDIT leg shows 0 in the RukaPay fee column
  const effectiveSweepFee =
    sweepFee > 0 && transaction.direction === 'DEBIT' ? sweepFee : 0

  const rukapayFee = effectiveSweepFee > 0
    ? effectiveSweepFee
    : rukapayFeeFromBreakdown > 0
      ? rukapayFeeFromBreakdown
      : (Number(transaction.rukapayFee) || 0)

  return (
    <TableCell className="font-medium text-blue-600">
      {formatAmount(rukapayFee)}
    </TableCell>
  )
}

export const NetAmountCell = ({ transaction }: FeeCellProps) => {
  const metadata = transaction.metadata || {}

  // Special case: internal sweep/liquidate — always show the net credited to disbursement
  // (gross - sweep fee) for BOTH legs so table stays consistent.
  if (metadata.sweepToDisbursement || metadata.sweepFromCollection) {
    const net = (metadata.netToDisbursement ?? Number(transaction.netAmount)) || 0
    return (
      <TableCell className="font-medium text-green-600">
        {formatAmount(net)}
      </TableCell>
    )
  }

  // For non-sweep CREDIT legs (receiver side)
  if (transaction.direction !== 'DEBIT') {
    return (
      <TableCell className="font-medium text-green-600">
        {formatAmount(Number(transaction.netAmount))}
      </TableCell>
    )
  }

  // For DEBIT legs (sender side), Net Amount = amount + all fees (total debited)
  const amount = Number(transaction.amount) || 0
  const feeBreakdown = metadata.feeBreakdown || {}

  const rukapayFeeFromBreakdown = feeBreakdown.rukapayFee || 0
  const rukapayFee = rukapayFeeFromBreakdown > 0
    ? rukapayFeeFromBreakdown
    : (Number(transaction.rukapayFee) || 0)

  const partnerFeeFromBreakdown = feeBreakdown.partnerFee || feeBreakdown.thirdPartyFee || 0
  const thirdPartyFee = partnerFeeFromBreakdown > 0
    ? partnerFeeFromBreakdown
    : (Number(transaction.thirdPartyFee) || 0)

  const govTaxFromBreakdown = feeBreakdown.governmentTax || feeBreakdown.govTax || 0
  const governmentTax = govTaxFromBreakdown > 0
    ? govTaxFromBreakdown
    : (Number(transaction.governmentTax) || 0)

  const processingFee = feeBreakdown.processingFee || Number(transaction.processingFee) || 0
  const networkFee = feeBreakdown.networkFee || Number(transaction.networkFee) || 0
  const complianceFee = feeBreakdown.complianceFee || Number(transaction.complianceFee) || 0
  const telecomBankCharge = feeBreakdown.telecomBankCharge || 0

  let calculatedTotalFees = rukapayFee + thirdPartyFee + governmentTax + processingFee + networkFee + complianceFee + telecomBankCharge

  if (feeBreakdown.totalFee !== undefined && feeBreakdown.totalFee !== null) {
    calculatedTotalFees = Number(feeBreakdown.totalFee)
  }

  let finalTotalFee = calculatedTotalFees

  if (finalTotalFee === 0) {
    const fee = Number(transaction.fee) || 0
    if (fee > 0) {
      finalTotalFee = fee
    } else {
      const netAmount = Number(transaction.netAmount) || 0
      if (netAmount > 0 && amount !== netAmount) {
        finalTotalFee = amount - netAmount
      }
    }
  }

  return (
    <TableCell className="font-medium text-green-600">
      {formatAmount(amount + finalTotalFee)}
    </TableCell>
  )
}
