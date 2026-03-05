"use client"

import { TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Eye, RotateCcw, FileText, Download, RefreshCcw } from 'lucide-react'

const REVERSIBLE_TYPES = new Set([
  'WALLET_TO_MNO',
  'WALLET_TO_BANK',
  'WALLET_TO_MERCHANT',
  'WALLET_TO_EXTERNAL_MERCHANT',
  'WALLET_TO_INTERNAL_MERCHANT',
  'WALLET_TO_WALLET',
  'MERCHANT_TO_WALLET',
  'MERCHANT_TO_INTERNAL_WALLET',
  'MERCHANT_WITHDRAWAL',
  'BILL_PAYMENT',
  'MNO_TO_WALLET',
  'WALLET_TOPUP_PULL',
  'SCHOOL_FEES',
])

interface ActionCellProps {
  transaction: any
  onViewTransaction: (transaction: any) => void
  onViewApiLogs: (transaction: any) => void
  onManualStatusCheck: (transaction: any) => void
  onReverseTransaction: (transaction: any) => void
}

export const ActionCell = ({
  transaction,
  onViewTransaction,
  onViewApiLogs,
  onManualStatusCheck,
  onReverseTransaction,
}: ActionCellProps) => {
  const isDisplayLeg = transaction.metadata?.displayLeg === true

  const showRecheckButton =
    !isDisplayLeg &&
    transaction.type !== 'WALLET_TO_WALLET' &&
    transaction.type !== 'WALLET_TO_INTERNAL_MERCHANT' &&
    transaction.type !== 'REVERSAL' &&
    transaction.status !== 'SUCCESS'

  const showReversalButton = !isDisplayLeg && REVERSIBLE_TYPES.has(transaction.type as string)

  const handleDownloadJson = () => {
    try {
      const fileName = `transaction-${transaction.id || transaction.reference || 'details'}.json`
      const json = JSON.stringify(transaction, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download transaction JSON:', error)
    }
  }

  return (
    <TableCell>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewTransaction(transaction)}
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </Button>
        {showRecheckButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onManualStatusCheck(transaction)}
            title="Check partner status"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewApiLogs(transaction)}
          title="View API Logs"
        >
          <FileText className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadJson}
          title="Download Transaction JSON"
        >
          <Download className="h-4 w-4" />
        </Button>
        {showReversalButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReverseTransaction(transaction)}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-600 font-medium"
            title={Number(transaction.amount) >= 50000 ? "Reverse (Requires Approval)" : "Reverse Transaction"}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </TableCell>
  )
}
