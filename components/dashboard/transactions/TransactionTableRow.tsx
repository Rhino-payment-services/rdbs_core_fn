"use client"

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, RotateCcw } from 'lucide-react'
import { 
  shortenTransactionId, 
  formatAmount, 
  formatDate, 
  getStatusBadgeConfig, 
  getTypeDisplay, 
  getChannelDisplay,
  getDisplayName,
  getContactInfo
} from '@/lib/utils/transactions'

interface TransactionTableRowProps {
  transaction: any
  onViewTransaction: (transaction: any) => void
  onReverseTransaction: (transaction: any) => void
}

export const TransactionTableRow = ({ 
  transaction, 
  onViewTransaction, 
  onReverseTransaction 
}: TransactionTableRowProps) => {
  return (
    <TableRow key={transaction.id}>
      <TableCell className="font-medium font-mono text-sm" title={transaction.reference || transaction.id}>
        {shortenTransactionId(transaction.reference || transaction.id)}
      </TableCell>
      <TableCell>
        {transaction.partnerMapping?.partner ? (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
            {transaction.partnerMapping.partner.partnerCode}
          </span>
        ) : (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">Direct</span>
        )}
      </TableCell>
      <TableCell>{getTypeDisplay(transaction.type, transaction.direction)}</TableCell>
      {/* Channel Column */}
      <TableCell>
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
      </TableCell>
      {/* Sender Column */}
      <TableCell>
        <div className="flex flex-col">
          {transaction.type === 'REVERSAL' ? (
            <>
              {/* Reversal transaction - sender is the system crediting back */}
              <span className="font-medium text-orange-600">
                System Reversal
              </span>
              <span className="text-xs text-gray-500">
                Reversing transaction {transaction.metadata?.originalTransactionReference || transaction.metadata?.originalTransactionId?.substring(0, 8) || 'N/A'}
              </span>
              <span className="text-xs text-orange-600 font-medium">
                🔄 Reversal
              </span>
            </>
          ) : transaction.type === 'DEPOSIT' && transaction.metadata?.fundedByAdmin ? (
            <>
              {/* Admin funded wallet */}
              <span className="font-medium text-purple-900">
                {transaction.metadata.adminName || 'Admin User'}
              </span>
              <span className="text-xs text-gray-500">
                📱 {transaction.metadata.adminPhone || transaction.metadata.adminEmail || 'Admin'}
              </span>
              <span className="text-xs text-purple-600 font-medium">
                👨‍💼 Admin Funding
              </span>
            </>
          ) : (transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) &&
              (transaction.metadata?.merchantCode || transaction.metadata?.merchantName || transaction.metadata?.isPublicPayment) ? (
            <>
              {/* QR Code Payment - customer is the sender (check FIRST before DEBIT) */}
              <span className="font-medium">
                {transaction.metadata?.customerName || 'Customer'}
              </span>
              <span className="text-xs text-gray-500">
                📱 {transaction.metadata?.customerPhone || transaction.metadata?.phoneNumber || 'Mobile Money'}
              </span>
              <span className="text-xs text-gray-500">
                📱 Mobile Money
              </span>
            </>
          ) : transaction.direction === 'DEBIT' ? (
            <>
              {/* Outgoing transaction */}
              {transaction.type === 'MERCHANT_TO_WALLET' || transaction.type === 'MERCHANT_TO_INTERNAL_WALLET' ? (
                <>
                  {/* MERCHANT_TO_WALLET DEBIT - sender is always the merchant */}
                  {(() => {
                    const merchantName = transaction.metadata?.merchantName || 
                                       transaction.user?.merchant?.businessTradeName ||
                                       transaction.user?.profile?.merchantBusinessTradeName ||
                                       transaction.user?.profile?.businessTradeName ||
                                       transaction.user?.profile?.merchant_names ||
                                       (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant');
                    const merchantCode = transaction.metadata?.merchantCode || transaction.user?.merchantCode;
                    
                    return (
                      <>
                        <span className="font-medium">
                          {merchantName}
                        </span>
                        {merchantCode && (
                          <span className="text-xs text-gray-500">
                            🏪 Code: {merchantCode}
                          </span>
                        )}
                        <span className="text-xs text-blue-600 font-medium">
                          🏦 Internal Account
                        </span>
                      </>
                    )
                  })()}
                </>
              ) : (
                <>
                  {/* Other DEBIT transactions - sender is wallet owner */}
                  {(() => {
                    const isMerchant = transaction.user?.merchantCode || transaction.user?.merchant?.businessTradeName || transaction.metadata?.merchantName || transaction.metadata?.merchantCode
                    const displayName = getDisplayName(transaction.user, transaction.metadata, transaction.counterpartyUser)
                    
                    return (
                      <>
                        <span className="font-medium">
                          {displayName}
                        </span>
                        {isMerchant && transaction.metadata?.merchantCode && (
                          <span className="text-xs text-gray-500">
                            🏪 Code: {transaction.metadata.merchantCode}
                          </span>
                        )}
                        {!isMerchant && (
                          <span className="text-xs text-gray-500">
                            📱 {getContactInfo(transaction.user, transaction.metadata, transaction.counterpartyUser)}
                          </span>
                        )}
                        {isMerchant ? (
                          <span className="text-xs text-blue-600 font-medium">
                            🏦 Internal Account
                          </span>
                        ) : transaction.user?.userType === 'SUBSCRIBER' && (
                          <span className="text-xs text-blue-600 font-medium">
                            🏦 RukaPay Subscriber
                          </span>
                        )}
                        {(transaction.partnerId || transaction.metadata?.isApiPartnerTransaction) && (
                          <span className="text-xs text-purple-600 font-medium">
                            🔑 API Partner
                          </span>
                        )}
                      </>
                    )
                  })()}
                </>
              )}
            </>
          ) : (
            <>
              {/* Incoming transaction - extract sender info */}
              {/* Check for QR Code Payment FIRST (MNO_TO_WALLET CREDIT with merchant indicators) */}
              {/* Also check metadata.direction as fallback for older transactions */}
              {(transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) &&
               (transaction.direction === 'CREDIT' || transaction.metadata?.direction === 'CREDIT') &&
               (transaction.metadata?.merchantCode || transaction.metadata?.merchantName || transaction.metadata?.isPublicPayment) ? (
                <>
                  {/* QR Code Payment - customer is the sender */}
                  {transaction.metadata?.customerPhone ? (
                    <>
                      <span className="font-medium">
                        {transaction.metadata.customerName || 'Customer'}
                      </span>
                      <span className="text-xs text-gray-500">
                        📱 {transaction.metadata.customerPhone}
                      </span>
                      <span className="text-xs text-gray-500">
                        📱 Mobile Money
                      </span>
                    </>
                  ) : transaction.metadata?.phoneNumber ? (
                    <>
                      <span className="font-medium">
                        {transaction.metadata.userName || 'Mobile Money User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        📱 {transaction.metadata.phoneNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        📱 Mobile Money
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500">External</span>
                  )}
                </>
              ) : transaction.type === 'MERCHANT_TO_WALLET' || transaction.type === 'MERCHANT_TO_INTERNAL_WALLET' || transaction.type?.includes('MERCHANT_TO_WALLET') || transaction.type?.includes('MERCHANT_TO_INTERNAL_WALLET') ? (
                <>
                  {(() => {
                    const isMerchant = transaction.metadata?.merchantName || transaction.metadata?.merchantCode
                    const displayName = transaction.metadata?.merchantName || 
                                       transaction.metadata?.counterpartyInfo?.name ||
                                       getDisplayName(transaction.user, transaction.metadata, transaction.counterpartyUser)
                    
                    return (
                      <>
                        <span className="font-medium">
                          {displayName}
                        </span>
                        {isMerchant && transaction.metadata?.merchantCode && (
                          <span className="text-xs text-gray-500">
                            🏪 Code: {transaction.metadata.merchantCode}
                          </span>
                        )}
                        {transaction.metadata?.accountNumber && (
                          <span className="text-xs text-gray-500">
                            Account: {transaction.metadata.accountNumber}
                          </span>
                        )}
                        {isMerchant && (
                          <span className="text-xs text-blue-600 font-medium">
                            🏦 Internal Account
                          </span>
                        )}
                      </>
                    )
                  })()}
                </>
              ) : transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET') ? (
                <>
                  {/* Regular MNO_TO_WALLET (not QR code payment) */}
                  {transaction.metadata?.mnoProvider ? (
                    <>
                      <span className="font-medium">
                        {transaction.metadata.mnoProvider} Mobile Money
                      </span>
                      {transaction.metadata.phoneNumber && (
                        <span className="text-xs text-gray-500">
                          📱 {transaction.metadata.phoneNumber}
                        </span>
                      )}
                      {transaction.metadata.userName && (
                        <span className="text-xs text-gray-500">
                          👤 {transaction.metadata.userName}
                        </span>
                      )}
                      <span className="text-xs text-blue-600 font-medium">
                        {transaction.metadata.mnoProvider} Network
                      </span>
                    </>
                  ) : transaction.metadata?.phoneNumber ? (
                    <>
                      <span className="font-medium">
                        {transaction.metadata.userName || 'Mobile Money User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        📱 {transaction.metadata.phoneNumber}
                      </span>
                      <span className="text-xs text-gray-500">
                        📱 Mobile Money
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500">External</span>
                  )}
                </>
              ) : transaction.type === 'WALLET_TO_WALLET' || transaction.counterpartyId || transaction.counterpartyUser ? (
                <>
                  <span className="font-medium">
                    {transaction.counterpartyUser?.profile?.firstName && transaction.counterpartyUser?.profile?.lastName
                      ? `${transaction.counterpartyUser.profile.firstName} ${transaction.counterpartyUser.profile.lastName}`
                      : transaction.metadata?.counterpartyInfo?.name || transaction.metadata?.userName || 'RukaPay User'
                    }
                  </span>
                  {transaction.counterpartyUser?.phone && (
                    <span className="text-xs text-gray-500">
                      📱 {transaction.counterpartyUser.phone}
                    </span>
                  )}
                  {transaction.counterpartyId && (
                    <span className="text-xs text-gray-500">
                      📱 RukaPay ID: {transaction.counterpartyId.slice(0, 8)}...
                    </span>
                  )}
                  <span className="text-xs text-blue-600 font-medium">
                    🏦 RukaPay Subscriber
                  </span>
                </>
              ) : transaction.metadata?.counterpartyInfo ? (
                <>
                  <span className="font-medium">
                    {transaction.metadata.counterpartyInfo.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {transaction.metadata.counterpartyInfo.type === 'USER' 
                      ? '👤 Mobile User'
                      : transaction.metadata.counterpartyInfo.type === 'UTILITY'
                      ? '⚡ Utility'
                      : transaction.metadata.counterpartyInfo.type === 'MERCHANT'
                      ? '🏪 Merchant'
                      : transaction.metadata.counterpartyInfo.type === 'MNO'
                      ? '📱 Mobile Money'
                      : transaction.metadata.counterpartyInfo.type
                    }
                  </span>
                  {transaction.metadata.counterpartyInfo.type === 'USER' && (
                    <span className="text-xs text-blue-600 font-medium">
                      🏦 RukaPay Subscriber
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-500">External</span>
              )}
            </>
          )}
        </div>
      </TableCell>

      {/* Receiver Column */}
      <TableCell>
        <div className="flex flex-col">
          {transaction.type === 'REVERSAL' ? (
            <>
              <span className="font-medium text-green-600">
                {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName 
                  ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                  : transaction.user?.phone || transaction.user?.email || 'Wallet Owner'
                }
              </span>
              <span className="text-xs text-gray-500">
                📱 {transaction.user?.phone || transaction.user?.email || 'N/A'}
              </span>
              <span className="text-xs text-green-600 font-medium">
                💰 Credited Back
              </span>
              {transaction.metadata?.reversalReason && (
                <span className="text-xs text-gray-500 italic">
                  Reason: {transaction.metadata.reversalReason}
                </span>
              )}
            </>
          ) : transaction.type === 'DEPOSIT' && transaction.metadata?.fundedByAdmin ? (
            <>
              <span className="font-medium text-green-600">
                {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName 
                  ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                  : transaction.user?.phone || transaction.user?.email || 'RukaPay User'
                }
              </span>
              <span className="text-xs text-gray-500">
                📱 {transaction.user?.phone || transaction.user?.email || 'N/A'}
              </span>
              {transaction.user?.userType === 'SUBSCRIBER' && (
                <span className="text-xs text-blue-600 font-medium">
                  🏦 RukaPay Subscriber
                </span>
              )}
              <span className="text-xs text-green-600 font-medium">
                💰 Wallet Credit
              </span>
            </>
          ) : (transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) &&
              (transaction.metadata?.merchantCode || transaction.metadata?.merchantName || transaction.metadata?.isPublicPayment) ? (
            <>
              {/* QR Code Payment - merchant is the receiver (check FIRST before DEBIT) */}
              <span className="font-medium">
                {transaction.metadata?.merchantName ||
                 transaction.user?.merchant?.businessTradeName ||
                 transaction.user?.profile?.merchantBusinessTradeName ||
                 transaction.user?.profile?.businessTradeName ||
                 transaction.user?.profile?.merchant_names ||
                 (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant')}
              </span>
              {transaction.metadata?.merchantCode && (
                <span className="text-xs text-gray-500">
                  🏪 Code: {transaction.metadata.merchantCode}
                </span>
              )}
              <span className="text-xs text-blue-600 font-medium">
                🏦 Merchant Account
              </span>
            </>
          ) : transaction.direction === 'DEBIT' ? (
            <>
              {transaction.type === 'MERCHANT_TO_WALLET' || transaction.type === 'MERCHANT_TO_INTERNAL_WALLET' ? (
                <>
                  {(() => {
                    let displayName = '';
                    let contact = '';
                    
                    if (transaction.counterpartyUser?.profile?.firstName && transaction.counterpartyUser?.profile?.lastName) {
                      displayName = `${transaction.counterpartyUser.profile.firstName} ${transaction.counterpartyUser.profile.lastName}`;
                      contact = transaction.counterpartyUser.phone || '';
                    } else if (transaction.metadata?.recipientName) {
                      displayName = transaction.metadata.recipientName;
                      contact = transaction.metadata?.recipientPhone || '';
                    } else if (transaction.counterpartyUser?.phone) {
                      displayName = transaction.counterpartyUser.phone;
                      contact = transaction.counterpartyUser.phone;
                    } else if (transaction.metadata?.recipientPhone) {
                      displayName = transaction.metadata.recipientPhone;
                      contact = transaction.metadata.recipientPhone;
                    } else {
                      displayName = 'RukaPay User';
                      contact = '';
                    }
                    
                    return (
                      <>
                        <span className="font-medium">
                          {displayName}
                        </span>
                        {contact && (
                          <span className="text-xs text-gray-500">
                            📱 {contact}
                          </span>
                        )}
                        {transaction.counterpartyId && (
                          <span className="text-xs text-gray-500">
                            📱 RukaPay ID: {transaction.counterpartyId.slice(0, 8)}...
                          </span>
                        )}
                        <span className="text-xs text-blue-600 font-medium">
                          🏦 RukaPay Subscriber
                        </span>
                      </>
                    )
                  })()}
                </>
              ) : transaction.type === 'WALLET_TO_WALLET' || transaction.counterpartyId || transaction.counterpartyUser ? (
                <>
                  <span className="font-medium">
                    {transaction.counterpartyUser?.profile?.firstName && transaction.counterpartyUser?.profile?.lastName
                      ? `${transaction.counterpartyUser.profile.firstName} ${transaction.counterpartyUser.profile.lastName}`
                      : transaction.metadata?.counterpartyInfo?.name || transaction.metadata?.userName || 'RukaPay User'
                    }
                  </span>
                  {transaction.counterpartyUser?.phone && (
                    <span className="text-xs text-gray-500">
                      📱 {transaction.counterpartyUser.phone}
                    </span>
                  )}
                  {transaction.counterpartyId && (
                    <span className="text-xs text-gray-500">
                      📱 RukaPay ID: {transaction.counterpartyId.slice(0, 8)}...
                    </span>
                  )}
                  <span className="text-xs text-blue-600 font-medium">
                    🏦 RukaPay Subscriber
                  </span>
                </>
              ) : transaction.type === 'WALLET_TO_INTERNAL_MERCHANT' ? (
                <>
                  <span className="font-medium">
                    Merchant
                  </span>
                  {transaction.metadata?.merchantCode && (
                    <span className="text-xs text-gray-500">
                      Code: {transaction.metadata.merchantCode}
                    </span>
                  )}
                  <span className="text-xs text-blue-600 font-medium">
                    🏦 Internal Account
                  </span>
                </>
              ) : transaction.type === 'WALLET_TO_MERCHANT' || (transaction.type?.includes('MERCHANT') && transaction.type !== 'MERCHANT_TO_WALLET') || transaction.metadata?.merchantName ? (
                <>
                  <span className="font-medium">
                    {transaction.metadata?.merchantName || 
                     transaction.metadata?.counterpartyInfo?.name || 
                     transaction.metadata?.userName ||
                     transaction.user?.merchant?.businessTradeName ||
                     transaction.user?.profile?.merchantBusinessTradeName ||
                     transaction.user?.profile?.businessTradeName ||
                     transaction.user?.profile?.merchant_names ||
                     (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant')}
                  </span>
                  {transaction.metadata?.accountNumber && (
                    <span className="text-xs text-gray-500">
                      🏪 Account: {transaction.metadata.accountNumber}
                    </span>
                  )}
                  {transaction.metadata?.merchantCode && (
                    <span className="text-xs text-gray-500">
                      Code: {transaction.metadata.merchantCode}
                    </span>
                  )}
                  <span className="text-xs text-blue-600 font-medium">
                    🏦 Internal Account
                  </span>
                </>
              ) : transaction.metadata?.counterpartyInfo ? (
                <>
                  <span className="font-medium">
                    {transaction.metadata.counterpartyInfo.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {transaction.metadata.counterpartyInfo.type === 'USER' 
                      ? (transaction.type === 'WALLET_TO_WALLET' 
                         ? `📱 ${transaction.counterpartyId ? 'RukaPay ID: ' + transaction.counterpartyId.slice(0, 8) + '...' : 'RukaPay User'}`
                         : '👤 Mobile User')
                      : transaction.metadata.counterpartyInfo.type === 'UTILITY'
                      ? `⚡ ${transaction.metadata.counterpartyInfo.accountNumber || 'Utility'}`
                      : transaction.metadata.counterpartyInfo.type === 'MERCHANT'
                      ? `🏪 ${transaction.metadata.counterpartyInfo.accountNumber || 'Merchant'}`
                      : transaction.metadata.counterpartyInfo.type === 'MNO'
                      ? `📱 ${transaction.metadata.counterpartyInfo.accountNumber || 'Mobile Money'}`
                      : transaction.metadata.counterpartyInfo.type
                    }
                  </span>
                  {transaction.metadata.counterpartyInfo.type === 'USER' && transaction.type === 'WALLET_TO_WALLET' && (
                    <span className="text-xs text-blue-600 font-medium">
                      🏦 RukaPay Subscriber
                    </span>
                  )}
                </>
              ) : (
                <>
                  {transaction.metadata?.mnoProvider ? (
                    <>
                      <span className="font-medium">
                        {transaction.metadata.userName || transaction.metadata.recipientName || `${transaction.metadata.mnoProvider} Mobile Money`}
                      </span>
                      {transaction.metadata.phoneNumber && (
                        <span className="text-xs text-gray-500">
                          📱 {transaction.metadata.phoneNumber}
                        </span>
                      )}
                      <span className="text-xs text-blue-600 font-medium">
                        {transaction.metadata.mnoProvider} Network
                      </span>
                    </>
                  ) : transaction.metadata?.phoneNumber ? (
                    <>
                      <span className="font-medium">
                        {transaction.metadata.userName || transaction.metadata.recipientName || 'Mobile Money User'}
                      </span>
                      <span className="text-xs text-gray-500">
                        📱 {transaction.metadata.phoneNumber}
                      </span>
                      {transaction.type?.includes('MNO') || transaction.type?.includes('WALLET_TO_MNO') ? (
                        <span className="text-xs text-gray-500">
                          📱 Mobile Money
                        </span>
                      ) : null}
                    </>
                  ) : transaction.metadata?.accountNumber ? (
                    <>
                      <span className="font-medium">
                        {transaction.metadata.userName || transaction.metadata.recipientName || 'External Account'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {transaction.type?.includes('BANK') 
                          ? `🏦 Bank: ${transaction.metadata.accountNumber}`
                          : transaction.type?.includes('UTILITY')
                          ? `⚡ Utility: ${transaction.metadata.accountNumber}`
                          : `Account: ${transaction.metadata.accountNumber}`
                        }
                      </span>
                    </>
                  ) : transaction.type?.includes('MNO') || transaction.type?.includes('WALLET_TO_MNO') ? (
                    <>
                      <span className="font-medium">Mobile Money</span>
                      <span className="text-xs text-gray-500">📱 External Network</span>
                    </>
                  ) : (
                    <span className="text-gray-500">External</span>
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
                  <span className="font-medium">
                    {transaction.metadata?.merchantName ||
                     transaction.user?.merchant?.businessTradeName ||
                     transaction.user?.profile?.merchantBusinessTradeName ||
                     transaction.user?.profile?.businessTradeName ||
                     transaction.user?.profile?.merchant_names ||
                     (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant')}
                  </span>
                  {transaction.metadata?.merchantCode && (
                    <span className="text-xs text-gray-500">
                      🏪 Code: {transaction.metadata.merchantCode}
                    </span>
                  )}
                  <span className="text-xs text-blue-600 font-medium">
                    🏦 Merchant Account
                  </span>
                </>
              ) : transaction.type === 'MERCHANT_TO_WALLET' || transaction.type === 'MERCHANT_TO_INTERNAL_WALLET' ? (
                <>
                  {(() => {
                    let displayName = '';
                    let contact = '';
                    
                    const isUserMerchant = transaction.user?.merchantCode || transaction.user?.merchant?.businessTradeName;
                    
                    if (!isUserMerchant) {
                      if (transaction.user?.profile?.firstName && transaction.user?.profile?.lastName) {
                        displayName = `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`;
                        contact = transaction.user?.phone || transaction.user?.email || '';
                      } else if (transaction.user?.phone) {
                        displayName = transaction.user.phone;
                        contact = transaction.user.phone;
                      } else if (transaction.user?.email) {
                        displayName = transaction.user.email;
                        contact = transaction.user.email;
                      } else {
                        displayName = 'RukaPay User';
                        contact = '';
                      }
                    } else {
                      if (transaction.metadata?.recipientName) {
                        displayName = transaction.metadata.recipientName;
                        contact = transaction.metadata?.recipientPhone || '';
                      } else if (transaction.counterpartyUser?.profile?.firstName && transaction.counterpartyUser?.profile?.lastName) {
                        displayName = `${transaction.counterpartyUser.profile.firstName} ${transaction.counterpartyUser.profile.lastName}`;
                        contact = transaction.counterpartyUser.phone || '';
                      } else {
                        displayName = 'RukaPay User';
                        contact = '';
                      }
                    }
                    
                    return (
                      <>
                        <span className="font-medium">
                          {displayName}
                        </span>
                        {contact && (
                          <span className="text-xs text-gray-500">
                            📱 {contact}
                          </span>
                        )}
                        <span className="text-xs text-blue-600 font-medium">
                          🏦 RukaPay Subscriber
                        </span>
                      </>
                    )
                  })()}
                </>
              ) : (() => {
                const isMerchantTransaction = 
                  transaction.metadata?.merchantName || 
                  transaction.metadata?.paymentType === 'MERCHANT_COLLECTION' || 
                  transaction.metadata?.walletType === 'BUSINESS' ||
                  transaction.user?.merchantCode ||
                  transaction.user?.merchant?.businessTradeName;
                
                const merchantName = 
                  transaction.metadata?.merchantName ||
                  transaction.user?.merchant?.businessTradeName ||
                  transaction.user?.profile?.merchantBusinessTradeName ||
                  transaction.user?.profile?.businessTradeName ||
                  transaction.user?.profile?.merchant_names ||
                  (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : null);
                
                const merchantCode = 
                  transaction.metadata?.merchantCode ||
                  transaction.user?.merchantCode;
                
                return isMerchantTransaction ? (
                  <>
                    <span className="font-medium">
                      {merchantName || 'Merchant'}
                    </span>
                    {merchantCode && (
                      <span className="text-xs text-gray-500">
                        🏪 Code: {merchantCode}
                      </span>
                    )}
                    <span className="text-xs text-blue-600 font-medium">
                      🏦 Merchant Account
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-medium">
                      {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName 
                        ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                        : transaction.user?.phone || transaction.user?.email || 'Unknown User'
                      }
                    </span>
                    <span className="text-xs text-gray-500">
                      📱 {transaction.user?.phone || transaction.user?.email || 'N/A'}
                    </span>
                    {transaction.user?.userType === 'SUBSCRIBER' && (
                      <span className="text-xs text-blue-600 font-medium">
                        🏦 RukaPay Subscriber
                      </span>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </TableCell>
      <TableCell className="font-medium">
        {formatAmount(Number(transaction.amount))}
      </TableCell>
      <TableCell className="font-medium text-blue-600">
        {(() => {
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
          
          // If still 0, try to calculate from amount - netAmount
          if (totalFee === 0) {
            const amount = Number(transaction.amount) || 0;
            const netAmount = Number(transaction.netAmount) || 0;
            if (amount > 0 && netAmount > 0 && amount !== netAmount) {
              const calculatedFee = amount - netAmount;
              return formatAmount(calculatedFee);
            }
          }
          
          return formatAmount(totalFee);
        })()}
      </TableCell>
      <TableCell className="font-medium text-green-600">
        {(() => {
          // Net Amount should show the total amount debited from sender (amount + fee)
          // For DEBIT transactions: amount + fee (total debited)
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
            
            // Use calculated total fees if available, otherwise fall back to transaction.fee or calculate from difference
            let finalTotalFee = calculatedTotalFees;
            
            if (finalTotalFee === 0) {
              const fee = Number(transaction.fee) || 0;
              if (fee > 0) {
                finalTotalFee = fee;
              } else {
                // If still 0, try to calculate from amount - netAmount
                const netAmount = Number(transaction.netAmount) || 0;
                if (netAmount > 0 && amount !== netAmount) {
                  finalTotalFee = amount - netAmount;
                }
              }
            }
            
            return formatAmount(amount + finalTotalFee);
          } else {
            // For CREDIT transactions, show netAmount (amount received)
            return formatAmount(Number(transaction.netAmount));
          }
        })()}
      </TableCell>
      <TableCell>
        {(() => {
          const statusConfig = getStatusBadgeConfig(transaction.status)
          return <Badge className={`${statusConfig.color} border`}>{statusConfig.label}</Badge>
        })()}
      </TableCell>
      <TableCell className="text-sm">{formatDate(transaction.createdAt)}</TableCell>
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
          {transaction.type === 'WALLET_TO_MNO' && 
           (transaction.status === 'FAILED' || transaction.status === 'SUCCESS') && (
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
    </TableRow>
  )
}
