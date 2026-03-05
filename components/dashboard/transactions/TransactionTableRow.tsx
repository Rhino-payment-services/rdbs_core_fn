"use client"

import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, RotateCcw, FileText, Download, RefreshCcw } from 'lucide-react'
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
  onViewApiLogs: (transaction: any) => void
  onManualStatusCheck: (transaction: any) => void
  onReverseTransaction: (transaction: any) => void
}

export const TransactionTableRow = ({
  transaction,
  onViewTransaction,
  onViewApiLogs,
  onManualStatusCheck,
  onReverseTransaction
}: TransactionTableRowProps) => {
  const metadata = transaction.metadata || {}

  const recipientWalletType =
    transaction.wallet?.walletType ||
    metadata.recipientWalletType ||
    metadata.walletType ||
    transaction.user?.walletType ||
    null

  const isBusinessLikeRecipientWallet =
    recipientWalletType === 'BUSINESS' || recipientWalletType === 'ESCROW' || recipientWalletType === 'PARTNER'

  // For DEBIT sender display: when the source wallet is PERSONAL, merchant
  // fields in metadata (merchantName, merchantCode) describe the business the
  // user is associated with, not the wallet owner. Strip them so
  // getDisplayName doesn't render a merchant when the debit is from a personal
  // subscriber wallet.
  const senderMeta = (() => {
    if (transaction.direction !== 'DEBIT') return metadata
    if (transaction.wallet?.walletType !== 'PERSONAL') return metadata
    if (transaction.type?.includes('MERCHANT')) return metadata

    const m = { ...metadata }
    delete m.merchantName
    delete m.merchantCode
    return m
  })()

  // For DEBIT receiver display: metadata carries sender merchant fields (merchantName,
  // merchantCode, senderName). Strip them so getDisplayName doesn't confuse the
  // sender's business name for the receiver.
  const receiverMeta = (() => {
    if (transaction.direction !== 'DEBIT') return metadata;
    const m = { ...metadata };
    delete m.merchantName;
    delete m.merchantCode;
    delete m.senderName;
    return m;
  })();

  // Resolve partner from the two places the API can return it, then fall back to metadata
  const resolvedPartner = transaction.partnerMapping?.partner || transaction.partner || null
  const resolvedPartnerCode =
    resolvedPartner?.partnerCode ||
    metadata.partnerCode ||
    metadata.apiPartnerName ||
    metadata.partnerName ||
    null
  const resolvedPartnerName =
    resolvedPartner?.partnerName ||
    metadata.apiPartnerName ||
    metadata.partnerName ||
    null

  const hasPartnerSignal =
    transaction.partnerId ||
    resolvedPartner ||
    metadata.partnerId ||
    metadata.isApiPartnerTransaction ||
    metadata.apiPartnerName

  // Display-leg rows (metadata.displayLeg === true) are UX-only mirror entries of an external
  // transaction. Rechecking a display leg would redirect to the primary on the backend anyway,
  // but hiding the button here prevents confusion and duplicate work.
  const isDisplayLeg = transaction.metadata?.displayLeg === true

  // Show recheck for everything that isn't a pure internal transfer, internal merchant move,
  // reversal, display-only leg, or already-successful transaction
  const showRecheckButton =
    !isDisplayLeg &&
    transaction.type !== 'WALLET_TO_WALLET' &&
    transaction.type !== 'WALLET_TO_INTERNAL_MERCHANT' &&
    transaction.type !== 'REVERSAL' &&
    transaction.status !== 'SUCCESS'

  // Reversal makes sense only for real money-movement transactions (in or out of a RukaPay wallet)
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
  const showReversalButton = !isDisplayLeg && REVERSIBLE_TYPES.has(transaction.type as string)

  const isPartnerSubscriberWithdraw =
    transaction.type === 'WITHDRAWAL' &&
    transaction.direction === 'DEBIT' &&
    metadata.mode === 'WITHDRAW' &&
    !!hasPartnerSignal

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
    <TableRow key={transaction.id}>
      <TableCell className="font-medium font-mono text-sm" title={transaction.reference || transaction.id}>
        {shortenTransactionId(transaction.reference || transaction.id)}
      </TableCell>
      <TableCell>
        {resolvedPartnerCode ? (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium" title={resolvedPartnerName || resolvedPartnerCode}>
            {resolvedPartnerCode}
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
        <div className="flex flex-col gap-[0.5px]">
          {transaction.type === 'REVERSAL' ? (
            <>
              <span className="font-medium text-orange-600">System Reversal</span>
              <span className="text-xs text-gray-500">
                Reversing {transaction.metadata?.originalTransactionReference || transaction.metadata?.originalTransactionId?.substring(0, 8) || 'N/A'}
              </span>
              <span className="text-xs text-orange-600 font-medium">🔄 Reversal</span>
            </>
          ) : transaction.senderInfo ? (
            <>
              <span className={`font-medium ${transaction.senderInfo.type === 'ADMIN' ? 'text-purple-900' : ''}`}>
                {transaction.senderInfo.name}
              </span>
              {transaction.senderInfo.contact && (
                <span className="text-xs text-gray-500">📱 {transaction.senderInfo.contact}</span>
              )}
              {transaction.senderInfo.merchantCode && (
                <span className="text-xs text-gray-500">🏪 Code: {transaction.senderInfo.merchantCode}</span>
              )}
              {transaction.senderInfo.walletType && (
                <span className="text-xs text-gray-400">
                  {transaction.senderInfo.walletType.replace(/_/g, ' ')} wallet
                </span>
              )}
              <span className={`text-xs font-medium ${
                transaction.senderInfo.type === 'MERCHANT' ? 'text-blue-600' :
                transaction.senderInfo.type === 'PARTNER' ? 'text-blue-600' :
                transaction.senderInfo.type === 'ADMIN' ? 'text-purple-600' :
                transaction.senderInfo.type === 'SUBSCRIBER' ? 'text-blue-600' :
                'text-gray-500'
              }`}>
                {transaction.senderInfo.type === 'MERCHANT' ? '🏦 Merchant Account' :
                 transaction.senderInfo.type === 'PARTNER' ? 'API Partner' :
                 transaction.senderInfo.type === 'ADMIN' ? '👨‍💼 Admin Funding' :
                 transaction.senderInfo.type === 'SUBSCRIBER' ? '🏦 RukaPay Subscriber' :
                 transaction.senderInfo.type === 'EXTERNAL_MNO' ? '📱 Mobile Money' :
                 transaction.senderInfo.type === 'EXTERNAL_BANK' ? '🏦 Bank' :
                 'External'}
              </span>
            </>
          ) : (
            <span className="font-medium">
              {getDisplayName(transaction.user, transaction.metadata, transaction.counterpartyUser, transaction.wallet)}
            </span>
          )}
        </div>
      </TableCell>

      {/* Receiver Column */}
      <TableCell>
        <div className="flex flex-col">
          {transaction.type === 'REVERSAL' ? (
            <>
              <span className="font-medium text-green-600">
                {transaction.receiverInfo?.name || getDisplayName(transaction.user, transaction.metadata) || 'Wallet Owner'}
              </span>
              <span className="text-xs text-gray-500">
                📱 {transaction.receiverInfo?.contact || transaction.user?.phone || transaction.user?.email || 'N/A'}
              </span>
              {transaction.receiverInfo?.walletType && (
                <span className="text-xs text-gray-400">
                  {transaction.receiverInfo.walletType.replace(/_/g, ' ')} wallet
                </span>
              )}
              <span className="text-xs text-green-600 font-medium">💰 Credited Back</span>
              {transaction.metadata?.reversalReason && (
                <span className="text-xs text-gray-500 italic">
                  Reason: {transaction.metadata.reversalReason}
                </span>
              )}
            </>
          ) : transaction.receiverInfo ? (
            <>
              <span className={`font-medium ${transaction.type === 'DEPOSIT' && transaction.metadata?.fundedByAdmin ? 'text-green-600' : ''}`}>
                {transaction.receiverInfo.name}
              </span>
              {transaction.receiverInfo.contact && (
                <span className="text-xs text-gray-500">📱 {transaction.receiverInfo.contact}</span>
              )}
              {transaction.receiverInfo.merchantCode && (
                <span className="text-xs text-gray-500">🏪 Code: {transaction.receiverInfo.merchantCode}</span>
              )}
              {transaction.receiverInfo.walletType && (
                <span className="text-xs text-gray-400">
                  {transaction.receiverInfo.walletType.replace(/_/g, ' ')} wallet
                </span>
              )}
              <span className={`text-xs font-medium ${
                transaction.receiverInfo.type === 'MERCHANT' ? 'text-blue-600' :
                transaction.receiverInfo.type === 'SUBSCRIBER' ? 'text-blue-600' :
                transaction.receiverInfo.type === 'PARTNER' ? 'text-blue-600' :
                'text-gray-500'
              }`}>
                {transaction.receiverInfo.type === 'MERCHANT' ? '🏦 Merchant Account' :
                 transaction.receiverInfo.type === 'SUBSCRIBER' ? '🏦 RukaPay Subscriber' :
                 transaction.receiverInfo.type === 'PARTNER' ? 'API Partner' :
                 transaction.receiverInfo.type === 'EXTERNAL_MNO' ? '📱 Mobile Money' :
                 transaction.receiverInfo.type === 'EXTERNAL_BANK' ? '🏦 Bank Account' :
                 'External'}
              </span>
              {transaction.type === 'DEPOSIT' && transaction.metadata?.fundedByAdmin && (
                <span className="text-xs text-green-600 font-medium">💰 Wallet Credit</span>
              )}
            </>
          ) : (transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) &&
            isBusinessLikeRecipientWallet &&
            (transaction.metadata?.merchantCode || transaction.metadata?.merchantName || transaction.metadata?.isPublicPayment) ? (
            <>
              {/* QR Code Payment - merchant is the receiver: show business name, not owner name */}
              <span className="font-medium">
                {transaction.metadata?.merchantName ||
                  transaction.user?.merchants?.[0]?.businessTradeName ||
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
          ) : isPartnerSubscriberWithdraw ? (
            <>
              {(() => {
                const subscriberDisplayName =
                  metadata.receiverName ||
                  (transaction.user?.profile?.firstName && transaction.user?.profile?.lastName
                    ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                    : transaction.user?.phone || transaction.user?.email || 'RukaPay User')

                const subscriberContact =
                  metadata.receiverPhone ||
                  metadata.userPhoneNumber ||
                  transaction.user?.phone ||
                  transaction.user?.email ||
                  'N/A'

                return (
                  <>
                    <span className="font-medium">
                      {subscriberDisplayName}
                    </span>
                    <span className="text-xs text-gray-500">
                      📱 {subscriberContact}
                    </span>
                    {transaction.user?.userType === 'SUBSCRIBER' && (
                      <span className="text-xs text-blue-600 font-medium">
                        🏦 RukaPay Subscriber
                      </span>
                    )}
                  </>
                )
              })()}
            </>
          ) : transaction.direction === 'DEBIT' ? (
            <>
              {transaction.type === 'DEPOSIT' && hasPartnerSignal && metadata.mode === 'DEPOSIT' ? (
                <>
                  {(() => {
                    // Partner-initiated DEPOSIT: sender is the partner (left column),
                    // receiver should clearly be the RukaPay subscriber getting the money.
                    const receiverName =
                      metadata.receiverName ||
                      metadata.userName ||
                      (transaction.user?.profile?.firstName && transaction.user?.profile?.lastName
                        ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                        : null) ||
                      'RukaPay Subscriber'

                    const receiverContact =
                      metadata.receiverPhone ||
                      metadata.userPhoneNumber ||
                      metadata.phoneNumber ||
                      transaction.user?.phone ||
                      transaction.user?.email ||
                      'N/A'

                    return (
                      <>
                        <span className="font-medium">
                          {receiverName}
                        </span>
                        <span className="text-xs text-gray-500">
                          📱 {receiverContact}
                        </span>
                        <span className="text-xs text-blue-600 font-medium">
                          🏦 RukaPay Subscriber
                        </span>
                      </>
                    )
                  })()}
                </>
              ) : transaction.type === 'MERCHANT_TO_WALLET' || transaction.type === 'MERCHANT_TO_INTERNAL_WALLET' ? (
                <>
                  {(() => {
                    const displayName = getDisplayName(transaction.counterpartyUser, receiverMeta, transaction.user)
                      || transaction.metadata?.recipientName
                      || transaction.counterpartyUser?.phone
                      || transaction.metadata?.recipientPhone
                      || 'RukaPay User';
                    const contact = getContactInfo(transaction.counterpartyUser, receiverMeta, transaction.user);
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
                    {getDisplayName(transaction.counterpartyUser, receiverMeta, transaction.user) || transaction.metadata?.counterpartyInfo?.name || transaction.metadata?.userName || 'RukaPay User'}
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
                    {transaction.metadata?.merchantName ||
                      transaction.metadata?.counterpartyInfo?.name ||
                      transaction.user?.merchants?.[0]?.businessTradeName ||
                      transaction.user?.merchant?.businessTradeName ||
                      transaction.user?.profile?.merchantBusinessTradeName ||
                      transaction.user?.profile?.businessTradeName ||
                      transaction.user?.profile?.merchant_names ||
                      (transaction.metadata?.merchantCode ? `Merchant (${transaction.metadata.merchantCode})` : 'Merchant')}
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
              ) : transaction.type === 'WALLET_TO_MERCHANT' || (transaction.type?.includes('MERCHANT') && transaction.type !== 'MERCHANT_TO_WALLET') ? (
                <>
                  <span className="font-medium">
                    {transaction.metadata?.merchantName ||
                      transaction.metadata?.counterpartyInfo?.name ||
                      transaction.metadata?.userName ||
                      transaction.user?.merchants?.[0]?.businessTradeName ||
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
                isBusinessLikeRecipientWallet &&
                (transaction.metadata?.merchantCode || transaction.metadata?.merchantName || transaction.metadata?.isPublicPayment) ? (
                <>
                  {(() => {
                    const walletType =
                      transaction.metadata?.recipientWalletType ||
                      transaction.metadata?.walletType ||
                      transaction.wallet?.walletType;
                    const isBusinessWallet =
                      walletType === 'BUSINESS' ||
                      walletType === 'BUSINESS_COLLECTION' ||
                      walletType === 'BUSINESS_DISBURSEMENT' ||
                      walletType === 'BUSINESS_LIQUIDATION';

                    if (isBusinessWallet || transaction.metadata?.isPublicPayment) {
                      const businessName =
                        transaction.metadata?.merchantName ||
                        transaction.user?.merchants?.[0]?.businessTradeName ||
                        transaction.user?.merchant?.businessTradeName ||
                        (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant');
                      return (
                        <>
                          <span className="font-medium">{businessName}</span>
                          {transaction.metadata?.merchantCode && (
                            <span className="text-xs text-gray-500">
                              🏪 Code: {transaction.metadata.merchantCode}
                            </span>
                          )}
                          <span className="text-xs text-blue-600 font-medium">
                            🏦 Merchant Account
                          </span>
                        </>
                      );
                    }

                    const personalName =
                      (transaction.user?.profile?.firstName && transaction.user?.profile?.lastName)
                        ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                        : transaction.user?.phone || transaction.user?.email || 'RukaPay User';
                    return (
                      <>
                        <span className="font-medium">{personalName}</span>
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
              ) : (transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) &&
                (transaction.direction === 'CREDIT' || transaction.metadata?.direction === 'CREDIT') &&
                (transaction.channel === 'API' || transaction.metadata?.channel === 'API') &&
                (transaction.mode === 'PARTNER_COLLECT_MNO' ||
                  transaction.metadata?.transactionModeCode === 'PARTNER_COLLECT_MNO' ||
                  transaction.metadata?.mode === 'PARTNER_COLLECT_MNO') ? (
                <>
                  {(() => {
                    const isPartnerApi =
                      transaction.partner ||
                      transaction.partnerId ||
                      transaction.metadata?.isApiPartnerTransaction ||
                      transaction.metadata?.isPartnerTransaction ||
                      transaction.metadata?.apiPartnerName

                    if (!isPartnerApi) {
                      return (
                        <span className="font-medium">
                          {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName
                            ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                            : transaction.user?.phone || transaction.user?.email || 'RukaPay User'}
                        </span>
                      )
                    }

                    const displayName =
                      transaction.partner?.partnerName ||
                      transaction.metadata?.apiPartnerName ||
                      transaction.partner?.partnerCode ||
                      'API Partner'

                    const partnerContact =
                      transaction.partner?.contactPhone ||
                      transaction.metadata?.partnerPhone ||
                      null

                    return (
                      <>
                        <span className="font-medium">
                          {displayName}
                        </span>
                        {partnerContact && (
                          <span className="text-xs text-gray-500">
                            📱 {partnerContact}
                          </span>
                        )}
                        <span className="text-xs text-blue-600 font-medium">
                          API Partner
                        </span>
                      </>
                    )
                  })()}
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
                // For CREDIT rows, tx.user IS the receiver.
                // Decide whether to show a business (merchant) receiver or a personal subscriber
                // based on the actual wallet type that was credited, not just whether the user
                // happens to own one or more merchant accounts.
                const recipientWalletType =
                  transaction.metadata?.recipientWalletType ||
                  transaction.metadata?.walletType ||
                  transaction.wallet?.walletType

                const isBusinessWallet =
                  recipientWalletType === 'BUSINESS' ||
                  recipientWalletType === 'BUSINESS_COLLECTION' ||
                  recipientWalletType === 'BUSINESS_DISBURSEMENT' ||
                  recipientWalletType === 'BUSINESS_LIQUIDATION'

                const hasMerchantMetadata =
                  !!transaction.metadata?.merchantName ||
                  !!transaction.metadata?.merchantCode ||
                  transaction.metadata?.paymentType === 'MERCHANT_COLLECTION'

                const isMerchantTransaction = isBusinessWallet || hasMerchantMetadata

                // Prefer displayName (explicitly set by backend to wallet-linked company),
                // then fall back to merchants[0] if provided for that wallet.
                const merchantName =
                  transaction.user?.displayName ||
                  transaction.user?.merchants?.[0]?.businessTradeName ||
                  transaction.user?.merchant?.businessTradeName ||
                  (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : null)

                const merchantCode =
                  transaction.metadata?.merchantCode ||
                  transaction.user?.merchants?.[0]?.merchantCode ||
                  transaction.user?.merchantCode

                if (isMerchantTransaction) {
                  return (
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
                  )
                }

                // Otherwise, treat as personal / subscriber receiver
                return (
                  <>
                    <span className="font-medium">
                      {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName
                        ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                        : transaction.user?.phone || transaction.user?.email || 'Unknown User'}
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
                )
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
          // Show RukaPay Fee (RukaPay Revenue) only, not total fees
          // Use feeBreakdown as source of truth if available
          const feeBreakdown = transaction.metadata?.feeBreakdown || {};

          // Get RukaPay Fee from feeBreakdown first, then fall back to transaction field
          const rukapayFeeFromBreakdown = feeBreakdown.rukapayFee || 0;
          const rukapayFee = rukapayFeeFromBreakdown > 0
            ? rukapayFeeFromBreakdown
            : (Number(transaction.rukapayFee) || 0);

          // If still 0, return 0 (don't fall back to total fee)
          return formatAmount(rukapayFee);
        })()}
      </TableCell>
      <TableCell className="font-medium text-green-600">
        {(() => {
          // Net Amount should show the total amount debited from sender (amount + fee)
          // For DEBIT transactions: amount + fee (total debited)
          // For CREDIT transactions: netAmount (amount received)
          if (transaction.direction === 'DEBIT') {
            const amount = Number(transaction.amount) || 0;

            // Use feeBreakdown as source of truth if available
            const feeBreakdown = transaction.metadata?.feeBreakdown || {};

            // Get individual fees from feeBreakdown first, then fall back to transaction fields
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
            let calculatedTotalFees = rukapayFee + thirdPartyFee + governmentTax + processingFee + networkFee + complianceFee + telecomBankCharge;

            // Use feeBreakdown.totalFee if available, otherwise use calculated total
            if (feeBreakdown.totalFee !== undefined && feeBreakdown.totalFee !== null) {
              calculatedTotalFees = Number(feeBreakdown.totalFee);
            }

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
    </TableRow>
  )
}
