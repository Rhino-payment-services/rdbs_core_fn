"use client"

import { TableCell } from '@/components/ui/table'
import { formatAmount } from '@/lib/utils/transactions'
import { getDisplayNetAmount } from '@/lib/utils/transactionNetDisplay'

interface FeeCellProps {
  transaction: any
}

function getNormalizedRukapayFee(transaction: any) {
  const feeBreakdown = transaction?.metadata?.feeBreakdown || {}

  const rukapayFeeFromBreakdown = feeBreakdown.rukapayFee || 0
  let rukapayFee =
    rukapayFeeFromBreakdown > 0 ? rukapayFeeFromBreakdown : (Number(transaction?.rukapayFee) || 0)

  const partnerFeeFromBreakdown = feeBreakdown.partnerFee || feeBreakdown.thirdPartyFee || 0
  const partnerFee =
    partnerFeeFromBreakdown > 0 ? partnerFeeFromBreakdown : (Number(transaction?.thirdPartyFee) || 0)

  const govTaxFromBreakdown = feeBreakdown.governmentTax || feeBreakdown.govTax || 0
  const governmentTax =
    govTaxFromBreakdown > 0 ? govTaxFromBreakdown : (Number(transaction?.governmentTax) || 0)

  const processingFee = feeBreakdown.processingFee || Number(transaction?.processingFee) || 0
  const networkFee = feeBreakdown.networkFee || Number(transaction?.networkFee) || 0
  const complianceFee = feeBreakdown.complianceFee || Number(transaction?.complianceFee) || 0
  const telecomBankCharge = feeBreakdown.telecomBankCharge || 0

  let totalFee: number
  if (feeBreakdown.totalFee !== undefined && feeBreakdown.totalFee !== null) {
    totalFee = Number(feeBreakdown.totalFee)
  } else {
    const calculatedTotalFees =
      rukapayFee +
      partnerFee +
      governmentTax +
      processingFee +
      networkFee +
      complianceFee +
      telecomBankCharge
    totalFee =
      calculatedTotalFees > 0 ? calculatedTotalFees : (Number(transaction?.fee) || 0)
  }

  // When only aggregate fee is persisted, attribute residual to RukaPay fee
  // so list view stays consistent with the details modal.
  if (rukapayFee === 0 && totalFee > 0) {
    const otherComponents =
      partnerFee +
      governmentTax +
      processingFee +
      networkFee +
      complianceFee +
      telecomBankCharge
    const remaining = totalFee - otherComponents
    if (remaining > 0) {
      rukapayFee = remaining
    }
  }

  return rukapayFee
}

export const RukapayFeeCell = ({ transaction }: FeeCellProps) => {
  const metadata = transaction.metadata || {}

  // Special case: internal sweep (Liquidate) from collection → disbursement
  // Use sweepFeeAmount attached in metadata so we see the 2.5% fee clearly.
  const sweepFee =
    (metadata.sweepToDisbursement || metadata.sweepFromCollection)
      ? Number(metadata.sweepFeeAmount) || 0
      : 0

  // Only show the sweep fee on the DEBIT leg for sweeps; CREDIT leg shows 0 in the RukaPay fee column
  const effectiveSweepFee =
    sweepFee > 0 && transaction.direction === 'DEBIT' ? sweepFee : 0

  const rukapayFee = effectiveSweepFee > 0
    ? effectiveSweepFee
    : getNormalizedRukapayFee(transaction)

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

  // Use the shared helper so table, modal, and exports always match.
  const netForDisplay = getDisplayNetAmount(transaction)

  return (
    <TableCell className="font-medium text-green-600">
      {netForDisplay == null ? '-' : formatAmount(netForDisplay)}
    </TableCell>
  )
}
