"use client"

import { TableCell } from '@/components/ui/table'
import { formatAmount } from '@/lib/utils/transactions'
import { getDisplayNetAmount } from '@/lib/utils/transactionNetDisplay'

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

  // Use the shared helper so table, modal, and exports always match.
  const netForDisplay = getDisplayNetAmount(transaction)

  return (
    <TableCell className="font-medium text-green-600">
      {netForDisplay == null ? '-' : formatAmount(netForDisplay)}
    </TableCell>
  )
}
