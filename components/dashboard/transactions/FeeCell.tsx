"use client"

import { TableCell } from '@/components/ui/table'
import { formatAmount } from '@/lib/utils/transactions'
import { getNormalizedRukapayFee } from '@/lib/utils/feeBreakdown'
import { getDisplayNetAmount } from '@/lib/utils/transactionNetDisplay'

interface FeeCellProps {
  transaction: any
}

export const RukapayFeeCell = ({ transaction }: FeeCellProps) => {
  const rukapayFee = getNormalizedRukapayFee(transaction)

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
