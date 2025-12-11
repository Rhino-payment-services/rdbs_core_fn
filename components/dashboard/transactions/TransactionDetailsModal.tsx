"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Users, 
  Info, 
  DollarSign, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react'
import { 
  formatAmount, 
  formatDate, 
  getStatusBadgeConfig, 
  getTypeDisplay, 
  getChannelDisplay,
  shortenTransactionId
} from '@/lib/utils/transactions'
import toast from 'react-hot-toast'

interface TransactionDetailsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  transaction: any | null
  transactions?: any[] // For finding original transaction in reversals
  onSelectTransaction?: (transaction: any) => void
}

export const TransactionDetailsModal = ({
  isOpen,
  onOpenChange,
  transaction,
  transactions = [],
  onSelectTransaction
}: TransactionDetailsModalProps) => {
  if (!transaction) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[60vw] max-w-[60vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg border-2 ${
            transaction.status === 'SUCCESS' 
              ? 'bg-green-50 border-green-200' 
              : transaction.status === 'FAILED'
              ? 'bg-red-50 border-red-200'
              : transaction.status === 'PENDING'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              {transaction.status === 'SUCCESS' ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : transaction.status === 'FAILED' ? (
                <XCircle className="h-8 w-8 text-red-600" />
              ) : (
                <Info className="h-8 w-8 text-yellow-600" />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-bold ${
                  transaction.status === 'SUCCESS' 
                    ? 'text-green-900' 
                    : transaction.status === 'FAILED'
                    ? 'text-red-900'
                    : 'text-yellow-900'
                }`}>
                  Transaction {transaction.status === 'SUCCESS' ? 'Completed' : transaction.status === 'FAILED' ? 'Failed' : transaction.status}
                </h3>
                <p className={`text-sm ${
                  transaction.status === 'SUCCESS' 
                    ? 'text-green-700' 
                    : transaction.status === 'FAILED'
                    ? 'text-red-700'
                    : 'text-yellow-700'
                }`}>
                  {transaction.status === 'SUCCESS' 
                    ? 'This transaction was processed successfully'
                    : transaction.status === 'FAILED'
                    ? 'This transaction could not be completed'
                    : 'This transaction is being processed'
                  }
                </p>
              </div>
              {(() => {
                const statusConfig = getStatusBadgeConfig(transaction.status)
                return <Badge className={`${statusConfig.color} border`}>{statusConfig.label}</Badge>
              })()}
            </div>

            {/* Failure Reason */}
            {transaction.status === 'FAILED' && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 text-sm">Failure Reason:</p>
                    <p className="text-red-800 text-sm mt-1 font-medium">
                      {transaction.errorMessage || 
                       transaction.metadata?.abcErrorMessage || 
                       transaction.metadata?.abcResponse?.message || 
                       transaction.metadata?.externalMessage || 
                       transaction.failureReason || 
                       transaction.metadata?.failureReason || 
                       transaction.metadata?.errorMessage || 
                       'Transaction failed due to processing error. Please contact support for more details.'}
                    </p>
                    {transaction.partnerMapping?.partner?.partnerCode === 'ABC' && (
                      <p className="text-red-700 text-xs mt-1 italic">
                        Error from ABC partner
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                <Info className="h-4 w-4" />
                Basic Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono font-medium text-gray-900 text-xs">
                    {transaction.reference || transaction.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900">{getTypeDisplay(transaction.type, transaction.direction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Partner:</span>
                  <span className="font-medium text-gray-900">
                    {transaction.partnerMapping?.partner?.partnerCode || 'Direct'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Channel:</span>
                  <span className="font-medium text-gray-900">
                    {(() => {
                      const channelInfo = getChannelDisplay(transaction.channel, transaction.metadata)
                      const ChannelIcon = channelInfo.icon
                      return (
                        <Badge className={`${channelInfo.bgColor} ${channelInfo.color} border flex items-center gap-1.5 px-2 py-1`}>
                          <ChannelIcon className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{channelInfo.label}</span>
                        </Badge>
                      )
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-medium text-gray-900">{formatDate(transaction.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Direction:</span>
                  <span className="font-medium text-gray-900">
                    {/* Check both direction field and metadata.direction for QR code payments */}
                    {(transaction.direction === 'DEBIT' && transaction.metadata?.direction !== 'CREDIT') ? '📤 Outgoing' : '📥 Incoming'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                <DollarSign className="h-4 w-4" />
                Amount Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Amount:</span>
                  <span className="font-bold text-gray-900">{formatAmount(Number(transaction.amount))}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-blue-600">RukaPay Fee:</span>
                  <span className="font-medium text-blue-600">
                    {(() => {
                      // Use feeBreakdown as source of truth if available, otherwise use transaction fields
                      const feeBreakdown = transaction.metadata?.feeBreakdown || {};
                      const rukapayFeeFromBreakdown = feeBreakdown.rukapayFee || 0;
                      const rukapayFee = rukapayFeeFromBreakdown > 0 
                        ? rukapayFeeFromBreakdown 
                        : (Number(transaction.rukapayFee) || 0);
                      
                      return formatAmount(rukapayFee);
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-600">Partner Fee:</span>
                  <span className="font-medium text-orange-600">
                    {(() => {
                      // Use feeBreakdown as source of truth if available, otherwise use transaction fields
                      const feeBreakdown = transaction.metadata?.feeBreakdown || {};
                      const partnerFeeFromBreakdown = feeBreakdown.partnerFee || feeBreakdown.thirdPartyFee || 0;
                      const partnerFee = partnerFeeFromBreakdown > 0 
                        ? partnerFeeFromBreakdown 
                        : (Number(transaction.thirdPartyFee) || 0);
                      
                      return formatAmount(partnerFee);
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Government Tax:</span>
                  <span className="font-medium text-red-600">
                    {(() => {
                      // Use feeBreakdown as source of truth if available, otherwise use transaction fields
                      const feeBreakdown = transaction.metadata?.feeBreakdown || {};
                      const govTaxFromBreakdown = feeBreakdown.governmentTax || feeBreakdown.govTax || 0;
                      const govTax = govTaxFromBreakdown > 0 
                        ? govTaxFromBreakdown 
                        : (Number(transaction.governmentTax) || 0);
                      
                      return formatAmount(govTax);
                    })()}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-yellow-600 font-semibold">Total Fees:</span>
                  <span className="font-bold text-yellow-600">
                    {(() => {
                      // Use feeBreakdown as source of truth if available
                      const feeBreakdown = transaction.metadata?.feeBreakdown || {};
                      
                      if (feeBreakdown.totalFee !== undefined && feeBreakdown.totalFee !== null) {
                        return formatAmount(Number(feeBreakdown.totalFee));
                      }
                      
                      // Otherwise, calculate from displayed individual fees (must match what's shown above)
                      const rukapayFeeFromBreakdown = feeBreakdown.rukapayFee || 0;
                      const rukapayFee = rukapayFeeFromBreakdown > 0 
                        ? rukapayFeeFromBreakdown 
                        : (Number(transaction.rukapayFee) || 0);
                      
                      const partnerFeeFromBreakdown = feeBreakdown.partnerFee || feeBreakdown.thirdPartyFee || 0;
                      const thirdPartyFee = partnerFeeFromBreakdown > 0 
                        ? partnerFeeFromBreakdown 
                        : (Number(transaction.thirdPartyFee) || 0);
                      
                      const govTaxFromBreakdown = feeBreakdown.governmentTax || feeBreakdown.govTax || 0;
                      const governmentTax = govTaxFromBreakdown > 0 
                        ? govTaxFromBreakdown 
                        : (Number(transaction.governmentTax) || 0);
                      
                      const processingFee = feeBreakdown.processingFee || Number(transaction.processingFee) || 0;
                      const networkFee = feeBreakdown.networkFee || Number(transaction.networkFee) || 0;
                      const complianceFee = feeBreakdown.complianceFee || Number(transaction.complianceFee) || 0;
                      const telecomBankCharge = feeBreakdown.telecomBankCharge || 0;
                      
                      // Sum all fees (including telecomBankCharge if present)
                      const calculatedTotalFees = rukapayFee + thirdPartyFee + governmentTax + processingFee + networkFee + complianceFee + telecomBankCharge;
                      
                      // Use calculated total if > 0, otherwise fall back to transaction.fee
                      return formatAmount(calculatedTotalFees > 0 ? calculatedTotalFees : (Number(transaction.fee) || 0));
                    })()}
                  </span>
                </div>
                <div className="flex justify-between border-t-2 pt-2 mt-2">
                  <span className="text-green-600 font-bold">Net Amount:</span>
                  <span className="font-bold text-green-600 text-lg">
                    {(() => {
                      // Net Amount should show the total amount debited from sender (amount + all fees)
                      // For DEBIT transactions: amount + all fees (total debited)
                      // For CREDIT transactions: netAmount (amount received)
                      if (transaction.direction === 'DEBIT') {
                        const amount = Number(transaction.amount) || 0;
                        
                        // Calculate total fees by summing all individual fee components
                        const rukapayFee = Number(transaction.rukapayFee) || 0;
                        const thirdPartyFee = Number(transaction.thirdPartyFee) || 0;
                        const governmentTax = Number(transaction.governmentTax) || 0;
                        const processingFee = Number(transaction.processingFee) || 0;
                        const networkFee = Number(transaction.networkFee) || 0;
                        const complianceFee = Number(transaction.complianceFee) || 0;
                        
                        // Sum all fees
                        const calculatedTotalFees = rukapayFee + thirdPartyFee + governmentTax + processingFee + networkFee + complianceFee;
                        
                        // Use calculated total fees if available, otherwise fall back to transaction.fee
                        const totalFee = calculatedTotalFees > 0 ? calculatedTotalFees : (Number(transaction.fee) || 0);
                        
                        // If still 0 but there's a difference, calculate it
                        if (totalFee === 0 && amount > 0) {
                          const netAmount = Number(transaction.netAmount) || 0;
                          if (netAmount > 0 && amount !== netAmount) {
                            const calculatedFee = amount - netAmount;
                            return formatAmount(amount + calculatedFee);
                          }
                        }
                        
                        return formatAmount(amount + totalFee);
                      } else {
                        // For CREDIT transactions, show netAmount (amount received)
                        return formatAmount(Number(transaction.netAmount));
                      }
                    })()}
                  </span>
                </div>
                {/* Balance Information */}
                {(transaction.balanceBefore !== null && transaction.balanceBefore !== undefined) || 
                 (transaction.balanceAfter !== null && transaction.balanceAfter !== undefined) ? (
                  <>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-purple-600 font-semibold">Balance Before:</span>
                      <span className="font-bold text-purple-600">
                        {transaction.balanceBefore !== null && transaction.balanceBefore !== undefined
                          ? formatAmount(Number(transaction.balanceBefore))
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-indigo-600 font-bold">Balance After:</span>
                      <span className="font-bold text-indigo-600 text-lg">
                        {transaction.balanceAfter !== null && transaction.balanceAfter !== undefined
                          ? formatAmount(Number(transaction.balanceAfter))
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 italic">
                      * Balance at the time of this transaction
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Sender & Receiver Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sender */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                <Users className="h-4 w-4" />
                {transaction.type === 'REVERSAL' ? 'Reversal Source' : 'Sender'}
              </h4>
              <div className="space-y-2 text-sm">
                {transaction.type === 'REVERSAL' ? (
                  <>
                    <div>
                      <span className="text-orange-600">Source:</span>
                      <p className="font-medium text-orange-900">System Reversal</p>
                    </div>
                    <div>
                      <span className="text-orange-600">Original Transaction:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-medium text-orange-900 font-mono text-xs" title={transaction.metadata?.originalTransactionReference || transaction.metadata?.originalTransactionId || 'N/A'}>
                          {shortenTransactionId(
                            transaction.metadata?.originalTransactionReference || 
                            transaction.metadata?.originalTransactionId || 
                            'N/A'
                          )}
                        </p>
                        {transaction.metadata?.originalTransactionId && onSelectTransaction && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => {
                              const originalTx = transactions.find((tx: any) => tx.id === transaction.metadata.originalTransactionId)
                              if (originalTx) {
                                onSelectTransaction(originalTx)
                              } else {
                                toast.error('Original transaction not found in current page. Please search for it.')
                              }
                            }}
                          >
                            View Original
                          </Button>
                        )}
                      </div>
                    </div>
                    {transaction.metadata?.reversalReason && (
                      <div>
                        <span className="text-orange-600">Reversal Reason:</span>
                        <p className="font-medium text-orange-900">
                          {transaction.metadata.reversalReason.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </p>
                      </div>
                    )}
                    {transaction.metadata?.reversalDetails && (
                      <div>
                        <span className="text-orange-600">Reversal Details:</span>
                        <p className="font-medium text-orange-900 text-xs">{transaction.metadata.reversalDetails}</p>
                      </div>
                    )}
                    {transaction.metadata?.processedByUser && (
                      <div>
                        <span className="text-orange-600">Processed By:</span>
                        <p className="font-medium text-orange-900">
                          {transaction.metadata.processedByUser.name || 'Admin User'}
                        </p>
                        {transaction.metadata.processedByUser.email && (
                          <p className="text-xs text-gray-500 mt-1">
                            {transaction.metadata.processedByUser.email}
                          </p>
                        )}
                      </div>
                    )}
                    <Badge className="bg-orange-600 text-white">Reversal Transaction</Badge>
                  </>
                ) : transaction.type === 'DEPOSIT' && transaction.metadata?.fundedByAdmin ? (
                  <>
                    <div>
                      <span className="text-blue-600">Admin:</span>
                      <p className="font-medium text-blue-900">
                        {transaction.metadata.adminName || 'Admin User'}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-600">Contact:</span>
                      <p className="font-medium text-blue-900">
                        {transaction.metadata.adminPhone || transaction.metadata.adminEmail || 'N/A'}
                      </p>
                    </div>
                    <Badge className="bg-purple-600 text-white">Admin Funding</Badge>
                  </>
                ) : (transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) &&
                    (transaction.metadata?.merchantCode || transaction.metadata?.merchantName || transaction.metadata?.isPublicPayment) ? (
                  <>
                    {/* QR Code Payment - customer is the sender (check this FIRST before DEBIT check) */}
                    <div>
                      <span className="text-blue-600">Name:</span>
                      <p className="font-medium text-blue-900">
                        {transaction.metadata?.customerName || 'Customer'}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-600">Phone Number:</span>
                      <p className="font-medium text-blue-900">
                        {transaction.metadata?.customerPhone || transaction.metadata?.phoneNumber || 'N/A'}
                      </p>
                    </div>
                    <Badge className="bg-blue-600 text-white">Mobile Money</Badge>
                  </>
                ) : transaction.direction === 'DEBIT' ? (
                  <>
                    {transaction.type === 'MERCHANT_TO_WALLET' || transaction.type === 'MERCHANT_TO_INTERNAL_WALLET' ? (
                      <>
                        <div>
                          <span className="text-blue-600">Merchant:</span>
                          <p className="font-medium text-blue-900">
                            {transaction.metadata?.merchantName || 
                             transaction.user?.merchant?.businessTradeName ||
                             transaction.user?.profile?.merchantBusinessTradeName ||
                             transaction.user?.profile?.businessTradeName ||
                             transaction.user?.profile?.merchant_names ||
                             (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant')}
                          </p>
                        </div>
                        {transaction.metadata?.merchantCode && (
                          <div>
                            <span className="text-blue-600">Merchant Code:</span>
                            <p className="font-medium text-blue-900">
                              {transaction.metadata.merchantCode}
                            </p>
                          </div>
                        )}
                        <Badge className="bg-blue-600 text-white">Internal Account</Badge>
                        <Badge className="bg-red-500 text-white ml-1">DEBIT</Badge>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-blue-600">Name:</span>
                          <p className="font-medium text-blue-900">
                            {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName 
                              ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                              : 'Unknown User'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600">Contact:</span>
                          <p className="font-medium text-blue-900">
                            {transaction.user?.phone || transaction.user?.email}
                          </p>
                        </div>
                        {transaction.user?.userType === 'SUBSCRIBER' && (
                          <Badge className="bg-blue-600 text-white">RukaPay Subscriber</Badge>
                        )}
                        <Badge className="bg-red-500 text-white ml-1">DEBIT</Badge>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {transaction.type === 'MERCHANT_TO_WALLET' || transaction.type === 'MERCHANT_TO_INTERNAL_WALLET' ? (
                      <>
                        <div>
                          <span className="text-blue-600">Merchant:</span>
                          <p className="font-medium text-blue-900">
                            {transaction.metadata?.merchantName || transaction.metadata?.counterpartyInfo?.name || 'Merchant'}
                          </p>
                        </div>
                        {transaction.metadata?.merchantCode && (
                          <div>
                            <span className="text-blue-600">Merchant Code:</span>
                            <p className="font-medium text-blue-900">
                              {transaction.metadata.merchantCode}
                            </p>
                          </div>
                        )}
                        <Badge className="bg-blue-600 text-white">Internal Account</Badge>
                        <Badge className="bg-green-500 text-white ml-1">CREDIT</Badge>
                      </>
                    ) : transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET') ? (
                      <>
                        {/* QR Code Payment - customer is the sender (identified by customerPhone + merchantCode + CREDIT direction) */}
                        {/* Also check metadata.direction as fallback for older transactions */}
                        {(transaction.direction === 'CREDIT' || transaction.metadata?.direction === 'CREDIT') && 
                         (transaction.metadata?.customerPhone || transaction.metadata?.phoneNumber) && 
                         (transaction.metadata?.merchantCode || transaction.metadata?.merchantName || transaction.metadata?.isPublicPayment) ? (
                          <>
                            <div>
                              <span className="text-blue-600">Name:</span>
                              <p className="font-medium text-blue-900">
                                {transaction.metadata.customerName || 'Customer'}
                              </p>
                            </div>
                            <div>
                              <span className="text-blue-600">Phone Number:</span>
                              <p className="font-medium text-blue-900">
                                {transaction.metadata.customerPhone || transaction.metadata.phoneNumber}
                              </p>
                            </div>
                            <Badge className="bg-blue-600 text-white">Mobile Money</Badge>
                          </>
                        ) : transaction.metadata?.mnoProvider ? (
                          <>
                            <div>
                              <span className="text-blue-600">Source:</span>
                              <p className="font-medium text-blue-900">
                                {transaction.metadata.mnoProvider} Mobile Money
                              </p>
                            </div>
                            {transaction.metadata.phoneNumber && (
                              <div>
                                <span className="text-blue-600">Phone Number:</span>
                                <p className="font-medium text-blue-900">
                                  {transaction.metadata.phoneNumber}
                                </p>
                              </div>
                            )}
                            <Badge className="bg-blue-600 text-white">
                              {transaction.metadata.mnoProvider} Network
                            </Badge>
                          </>
                        ) : transaction.metadata?.phoneNumber ? (
                          <>
                            <div>
                              <span className="text-blue-600">Name:</span>
                              <p className="font-medium text-blue-900">
                                {transaction.metadata.userName || 'Mobile Money User'}
                              </p>
                            </div>
                            <div>
                              <span className="text-blue-600">Phone Number:</span>
                              <p className="font-medium text-blue-900">
                                {transaction.metadata.phoneNumber}
                              </p>
                            </div>
                            <Badge className="bg-blue-600 text-white">Mobile Money</Badge>
                          </>
                        ) : (
                          <div>
                            <span className="text-blue-600">Source:</span>
                            <p className="font-medium text-blue-900">External Source</p>
                          </div>
                        )}
                      </>
                    ) : transaction.type === 'WALLET_TO_WALLET' || transaction.counterpartyId || transaction.counterpartyUser ? (
                      <>
                        <div>
                          <span className="text-blue-600">Name:</span>
                          <p className="font-medium text-blue-900">
                            {transaction.counterpartyUser?.profile?.firstName && transaction.counterpartyUser?.profile?.lastName
                              ? `${transaction.counterpartyUser.profile.firstName} ${transaction.counterpartyUser.profile.lastName}`
                              : transaction.metadata?.counterpartyInfo?.name || transaction.metadata?.userName || 'RukaPay User'
                            }
                          </p>
                        </div>
                        {transaction.counterpartyUser?.phone && (
                          <div>
                            <span className="text-blue-600">Contact:</span>
                            <p className="font-medium text-blue-900">
                              {transaction.counterpartyUser.phone}
                            </p>
                          </div>
                        )}
                        <Badge className="bg-blue-600 text-white">RukaPay Subscriber</Badge>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-blue-600">Source:</span>
                          <p className="font-medium text-blue-900">
                            {transaction.metadata?.mnoProvider 
                              ? `${transaction.metadata.mnoProvider} Mobile Money`
                              : 'External Source'
                            }
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Receiver */}
            <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 flex items-center gap-2">
                <Users className="h-4 w-4" />
                {transaction.type === 'REVERSAL' ? 'Credited To' : 'Receiver'}
              </h4>
              <div className="space-y-2 text-sm">
                {transaction.type === 'REVERSAL' ? (
                  <>
                    <div>
                      <span className="text-green-600">Name:</span>
                      <p className="font-medium text-green-900">
                        {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName 
                          ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                          : transaction.user?.phone || transaction.user?.email || 'Wallet Owner'
                        }
                      </p>
                    </div>
                    <div>
                      <span className="text-green-600">Contact:</span>
                      <p className="font-medium text-green-900">
                        {transaction.user?.phone || transaction.user?.email || 'N/A'}
                      </p>
                    </div>
                    <Badge className="bg-green-600 text-white">💰 Credited Back</Badge>
                  </>
                ) : (transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) &&
                    (transaction.metadata?.merchantCode || transaction.metadata?.merchantName || transaction.metadata?.isPublicPayment) ? (
                  <>
                    {/* QR Code Payment - merchant is the receiver (check this FIRST before DEBIT check) */}
                    <div>
                      <span className="text-green-600">Name:</span>
                      <p className="font-medium text-green-900">
                        {transaction.metadata?.merchantName ||
                         transaction.user?.merchant?.businessTradeName ||
                         transaction.user?.profile?.merchantBusinessTradeName ||
                         transaction.user?.profile?.businessTradeName ||
                         transaction.user?.profile?.merchant_names ||
                         (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant')}
                      </p>
                    </div>
                    {transaction.metadata?.merchantCode && (
                      <div>
                        <span className="text-green-600">Merchant Code:</span>
                        <p className="font-medium text-green-900">
                          {transaction.metadata.merchantCode}
                        </p>
                      </div>
                    )}
                    <Badge className="bg-green-600 text-white">Merchant Account</Badge>
                    <Badge className="bg-green-500 text-white ml-1">CREDIT</Badge>
                  </>
                ) : transaction.direction === 'DEBIT' ? (
                  <>
                    {transaction.type === 'MERCHANT_TO_WALLET' ? (
                      <>
                        <div>
                          <span className="text-green-600">Name:</span>
                          <p className="font-medium text-green-900">
                            {transaction.counterpartyUser?.profile?.firstName && transaction.counterpartyUser?.profile?.lastName
                              ? `${transaction.counterpartyUser.profile.firstName} ${transaction.counterpartyUser.profile.lastName}`
                              : transaction.metadata?.recipientName || transaction.metadata?.userName || 'RukaPay User'
                            }
                          </p>
                        </div>
                        {transaction.counterpartyUser?.phone && (
                          <div>
                            <span className="text-green-600">Contact:</span>
                            <p className="font-medium text-green-900">
                              {transaction.counterpartyUser.phone}
                            </p>
                          </div>
                        )}
                        <Badge className="bg-green-600 text-white">RukaPay Subscriber</Badge>
                      </>
                    ) : transaction.metadata?.counterpartyInfo ? (
                      <>
                        <div>
                          <span className="text-green-600">Name:</span>
                          <p className="font-medium text-green-900">
                            {transaction.metadata.counterpartyInfo.name}
                          </p>
                        </div>
                        <div>
                          <span className="text-green-600">Type:</span>
                          <p className="font-medium text-green-900">
                            {transaction.metadata.counterpartyInfo.type}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        {transaction.metadata?.mnoProvider ? (
                          <>
                            <div>
                              <span className="text-green-600">Name:</span>
                              <p className="font-medium text-green-900">
                                {transaction.metadata.userName || transaction.metadata.recipientName || `${transaction.metadata.mnoProvider} Mobile Money`}
                              </p>
                            </div>
                            {transaction.metadata.phoneNumber && (
                              <div>
                                <span className="text-green-600">Phone Number:</span>
                                <p className="font-medium text-green-900">
                                  {transaction.metadata.phoneNumber}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <span className="text-green-600">Type:</span>
                            <p className="font-medium text-green-900">External Account</p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Check for QR Code Payment FIRST (MNO_TO_WALLET CREDIT with merchant indicators) */}
                    {/* Also check metadata.direction as fallback for older transactions */}
                    {(transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) &&
                     (transaction.direction === 'CREDIT' || transaction.metadata?.direction === 'CREDIT') &&
                     (transaction.metadata?.merchantCode || transaction.metadata?.merchantName || transaction.metadata?.isPublicPayment) ? (
                      <>
                        {/* QR Code Payment - merchant is the receiver */}
                        <div>
                          <span className="text-green-600">Name:</span>
                          <p className="font-medium text-green-900">
                            {transaction.metadata?.merchantName ||
                             transaction.user?.merchant?.businessTradeName ||
                             transaction.user?.profile?.merchantBusinessTradeName ||
                             transaction.user?.profile?.businessTradeName ||
                             transaction.user?.profile?.merchant_names ||
                             (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant')}
                          </p>
                        </div>
                        {transaction.metadata?.merchantCode && (
                          <div>
                            <span className="text-green-600">Merchant Code:</span>
                            <p className="font-medium text-green-900">
                              {transaction.metadata.merchantCode}
                            </p>
                          </div>
                        )}
                        <Badge className="bg-green-600 text-white">Merchant Account</Badge>
                        <Badge className="bg-green-500 text-white ml-1">CREDIT</Badge>
                      </>
                    ) : transaction.type === 'MERCHANT_TO_WALLET' || transaction.type === 'MERCHANT_TO_INTERNAL_WALLET' ? (
                      <>
                        <div>
                          <span className="text-green-600">Name:</span>
                          <p className="font-medium text-green-900">
                            {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName 
                              ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                              : transaction.counterpartyUser?.profile?.firstName && transaction.counterpartyUser?.profile?.lastName
                              ? `${transaction.counterpartyUser.profile.firstName} ${transaction.counterpartyUser.profile.lastName}`
                              : transaction.metadata?.recipientName || 'RukaPay User'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-green-600">Contact:</span>
                          <p className="font-medium text-green-900">
                            {transaction.user?.phone || transaction.counterpartyUser?.phone || transaction.metadata?.recipientPhone || 'N/A'}
                          </p>
                        </div>
                        <Badge className="bg-green-600 text-white">RukaPay Subscriber</Badge>
                        <Badge className="bg-green-500 text-white ml-1">CREDIT</Badge>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-green-600">Name:</span>
                          <p className="font-medium text-green-900">
                            {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName 
                              ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                              : 'Unknown User'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-green-600">Contact:</span>
                          <p className="font-medium text-green-900">
                            {transaction.user?.phone || transaction.user?.email}
                          </p>
                        </div>
                        {transaction.user?.userType === 'SUBSCRIBER' && (
                          <Badge className="bg-green-600 text-white">RukaPay Subscriber</Badge>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                <Info className="h-4 w-4" />
                Additional Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {transaction.metadata.mode && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500 block mb-1">Transaction Mode</span>
                    <p className="font-medium text-gray-900">
                      {transaction.metadata.mode.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {transaction.metadata.narration && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500 block mb-1">Narration</span>
                    <p className="font-medium text-gray-900">{transaction.metadata.narration}</p>
                  </div>
                )}
                {transaction.metadata.tariffName && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500 block mb-1">Tariff</span>
                    <p className="font-medium text-gray-900">{transaction.metadata.tariffName}</p>
                  </div>
                )}
                {transaction.metadata.walletType && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500 block mb-1">Wallet Type</span>
                    <p className="font-medium text-gray-900">{transaction.metadata.walletType}</p>
                  </div>
                )}
                {transaction.metadata.externalTransactionId && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-xs text-gray-500 block mb-1">External Transaction ID</span>
                    <p className="font-mono text-xs font-medium text-gray-900">
                      {transaction.metadata.externalTransactionId}
                    </p>
                  </div>
                )}
              </div>

              {/* Partner Response Details */}
              {transaction.metadata.partnerResponse && (
                <div className="mt-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Partner Response Details</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {transaction.metadata.partnerResponse.amount && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <span className="text-xs text-blue-600 block mb-1">Amount</span>
                        <p className="font-medium text-blue-900">
                          {formatAmount(Number(transaction.metadata.partnerResponse.amount))}
                        </p>
                      </div>
                    )}
                    {transaction.metadata.partnerResponse.transactionId && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <span className="text-xs text-blue-600 block mb-1">Transaction ID</span>
                        <p className="font-mono text-xs font-medium text-blue-900">
                          {transaction.metadata.partnerResponse.transactionId}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fee Breakdown Details */}
              {transaction.metadata.feeBreakdown && Object.keys(transaction.metadata.feeBreakdown).length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Fee Breakdown Details</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(transaction.metadata.feeBreakdown).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500 block mb-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <p className="font-medium text-gray-900">
                          {typeof value === 'number' ? formatAmount(value) : value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="default">
              <Download className="h-4 w-4 mr-2" />
              Export Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

