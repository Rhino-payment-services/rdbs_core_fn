"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RotateCcw, Loader2, AlertTriangle } from 'lucide-react'
import { formatAmount, getStatusBadgeConfig } from '@/lib/utils/transactions'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

interface ReversalModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  transaction: any | null
  reversalReason: string
  reversalDetails: string
  reversalTicketRef: string
  reversalProcessing: boolean
  onReasonChange: (reason: string) => void
  onDetailsChange: (details: string) => void
  onTicketRefChange: (ref: string) => void
  onSubmit: () => Promise<void>
}

export const ReversalModal = ({
  isOpen,
  onOpenChange,
  transaction,
  reversalReason,
  reversalDetails,
  reversalTicketRef,
  reversalProcessing,
  onReasonChange,
  onDetailsChange,
  onTicketRefChange,
  onSubmit
}: ReversalModalProps) => {
  const handleSubmit = async () => {
    if (!reversalReason || !reversalDetails) {
      toast.error('Please provide reversal reason and details')
      return
    }
    await onSubmit()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            Reverse Transaction
          </DialogTitle>
          <DialogDescription>
            Submit a reversal request for this WALLET_TO_MNO transaction
          </DialogDescription>
        </DialogHeader>

        {transaction && (
          <div className="space-y-4">
            {/* Transaction Info */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono font-medium text-xs">{transaction.reference || transaction.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold">{formatAmount(Number(transaction.amount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total to Refund (incl. fees):</span>
                <span className="font-bold text-green-600">
                  {formatAmount(Number(transaction.amount) + Number(transaction.fee || 0))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                {(() => {
                  const statusConfig = getStatusBadgeConfig(transaction.status)
                  return <Badge className={`${statusConfig.color} border`}>{statusConfig.label}</Badge>
                })()}
              </div>
            </div>

            {/* High Value Warning */}
            {Number(transaction.amount) + Number(transaction.fee || 0) >= 50000 && (
              <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-900">High-Value Transaction</p>
                  <p className="text-yellow-800 mt-1">
                    This reversal requires approval from an admin with TRANSACTION_REVERSAL_APPROVE permission.
                    Your request will be reviewed before processing.
                  </p>
                </div>
              </div>
            )}

            {/* Reversal Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reversal Reason <span className="text-red-500">*</span>
                </label>
                <Select value={reversalReason} onValueChange={onReasonChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MNO_FAILURE">MNO Transfer Failed</SelectItem>
                    <SelectItem value="DUPLICATE">Duplicate Transaction</SelectItem>
                    <SelectItem value="CUSTOMER_REQUEST">Customer Dispute</SelectItem>
                    <SelectItem value="SYSTEM_ERROR">Technical Error</SelectItem>
                    <SelectItem value="FRAUD">Fraud Prevention</SelectItem>
                    <SelectItem value="INCORRECT_RECIPIENT">Incorrect Recipient</SelectItem>
                    <SelectItem value="SERVICE_UNAVAILABLE">Service Unavailable</SelectItem>
                    <SelectItem value="INSUFFICIENT_FUNDS">Insufficient Funds</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Explanation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reversalDetails}
                  onChange={(e) => onDetailsChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Provide detailed explanation of why this transaction needs to be reversed. Include verification steps taken with MNO if applicable."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Support Ticket Reference (Optional)
                </label>
                <Input
                  value={reversalTicketRef}
                  onChange={(e) => onTicketRefChange(e.target.value)}
                  placeholder="e.g., TICKET-12345"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={reversalProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!reversalReason || !reversalDetails || reversalProcessing}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {reversalProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Submit Reversal Request
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
