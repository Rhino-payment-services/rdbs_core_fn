"use client"

import { TableCell } from '@/components/ui/table'
import { formatAmount } from '@/lib/utils/transactions'

interface FeeCellProps {
  transaction: any
}

export const RukapayFeeCell = ({ transaction }: FeeCellProps) => {
  const feeBreakdown = transaction.metadata?.feeBreakdown || {}
  const rukapayFeeFromBreakdown = feeBreakdown.rukapayFee || 0
  const rukapayFee = rukapayFeeFromBreakdown > 0
    ? rukapayFeeFromBreakdown
    : (Number(transaction.rukapayFee) || 0)

  return (
    <TableCell className="font-medium text-blue-600">
      {formatAmount(rukapayFee)}
    </TableCell>
  )
}

export const NetAmountCell = ({ transaction }: FeeCellProps) => {
  if (transaction.direction !== 'DEBIT') {
    return (
      <TableCell className="font-medium text-green-600">
        {formatAmount(Number(transaction.netAmount))}
      </TableCell>
    )
  }

  const amount = Number(transaction.amount) || 0
  const feeBreakdown = transaction.metadata?.feeBreakdown || {}

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
