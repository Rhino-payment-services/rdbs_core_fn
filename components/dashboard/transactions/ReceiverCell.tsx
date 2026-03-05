"use client"

import { TableCell } from '@/components/ui/table'
import { getDisplayName, getContactInfo } from '@/lib/utils/transactions'
import { PartyDisplay } from './PartyDisplay'
import type { TransactionDerived } from './types'

interface ReceiverCellProps {
  transaction: any
  derived: TransactionDerived
}

export const ReceiverCell = ({ transaction, derived }: ReceiverCellProps) => {
  const { metadata } = derived

  if (transaction.type === 'REVERSAL') {
    return (
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-green-600">
            {transaction.receiverInfo?.name || getDisplayName(transaction.user, transaction.metadata) || 'Wallet Owner'}
          </span>
          <span className="text-xs text-gray-500">
            📱 {transaction.receiverInfo?.contact || transaction.user?.phone || transaction.user?.email || 'N/A'}
          </span>
          <span className="text-xs text-green-600 font-medium">💰 Credited Back</span>
          {metadata.reversalReason && (
            <span className="text-xs text-gray-500 italic">
              Reason: {metadata.reversalReason}
            </span>
          )}
        </div>
      </TableCell>
    )
  }

  if (transaction.receiverInfo) {
    return (
      <TableCell>
        <div className="flex flex-col">
          <PartyDisplay
            info={transaction.receiverInfo}
            nameClassName={transaction.type === 'DEPOSIT' && metadata.fundedByAdmin ? 'text-green-600' : ''}
            extras={transaction.type === 'DEPOSIT' && metadata.fundedByAdmin ? (
              <span className="text-xs text-green-600 font-medium">💰 Wallet Credit</span>
            ) : undefined}
          />
        </div>
      </TableCell>
    )
  }

  return (
    <TableCell>
      <div className="flex flex-col">
        <LegacyReceiverDisplay transaction={transaction} derived={derived} />
      </div>
    </TableCell>
  )
}

function LegacyReceiverDisplay({ transaction, derived }: ReceiverCellProps) {
  const {
    metadata, receiverMeta, isBusinessLikeRecipientWallet,
    resolvedPartner, hasPartnerSignal, isPartnerSubscriberWithdraw,
  } = derived

  if (transaction.type === 'DEPOSIT' && (resolvedPartner || transaction.partner || metadata.apiPartnerName || metadata.isApiPartnerTransaction)) {
    return <PartnerDepositReceiver transaction={transaction} metadata={metadata} />
  }

  if (
    (transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) &&
    isBusinessLikeRecipientWallet &&
    (metadata.merchantCode || metadata.merchantName || metadata.isPublicPayment)
  ) {
    return <QrPaymentMerchantReceiver transaction={transaction} metadata={metadata} />
  }

  if (isPartnerSubscriberWithdraw) {
    return <PartnerWithdrawReceiver transaction={transaction} metadata={metadata} />
  }

  if (transaction.direction === 'DEBIT') {
    return <DebitReceiver transaction={transaction} derived={derived} />
  }

  return <CreditReceiver transaction={transaction} derived={derived} />
}

function PartnerDepositReceiver({ transaction, metadata }: { transaction: any; metadata: any }) {
  return (
    <>
      <span className="font-medium">
        {metadata.receiverName || metadata.recipientName || (metadata.userPhoneNumber ? 'RukaPay Subscriber' : getDisplayName(transaction.user, transaction.metadata) || 'Wallet Owner')}
      </span>
      <span className="text-xs text-gray-500">
        📱 {metadata.receiverPhone || metadata.userPhoneNumber || transaction.user?.phone || transaction.user?.email || 'N/A'}
      </span>
      <span className="text-xs text-blue-600 font-medium">🏦 RukaPay Subscriber</span>
    </>
  )
}

function QrPaymentMerchantReceiver({ transaction, metadata }: { transaction: any; metadata: any }) {
  return (
    <>
      <span className="font-medium">
        {metadata.merchantName ||
          transaction.user?.merchants?.[0]?.businessTradeName ||
          transaction.user?.merchant?.businessTradeName ||
          transaction.user?.profile?.merchantBusinessTradeName ||
          transaction.user?.profile?.businessTradeName ||
          transaction.user?.profile?.merchant_names ||
          (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant')}
      </span>
      {metadata.merchantCode && (
        <span className="text-xs text-gray-500">🏪 Code: {metadata.merchantCode}</span>
      )}
    </>
  )
}

function PartnerWithdrawReceiver({ transaction, metadata }: { transaction: any; metadata: any }) {
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
      <span className="font-medium">{subscriberDisplayName}</span>
      <span className="text-xs text-gray-500">📱 {subscriberContact}</span>
      {transaction.user?.userType === 'SUBSCRIBER' && (
        <span className="text-xs text-blue-600 font-medium">🏦 RukaPay Subscriber</span>
      )}
    </>
  )
}

function DebitReceiver({ transaction, derived }: ReceiverCellProps) {
  const { metadata, receiverMeta, hasPartnerSignal } = derived

  if (transaction.type === 'DEPOSIT' && hasPartnerSignal && metadata.mode === 'DEPOSIT') {
    return <DebitPartnerDepositReceiver transaction={transaction} metadata={metadata} />
  }

  if (transaction.type === 'MERCHANT_TO_WALLET' || transaction.type === 'MERCHANT_TO_INTERNAL_WALLET') {
    return <DebitMerchantToWalletReceiver transaction={transaction} receiverMeta={receiverMeta} metadata={metadata} />
  }

  if (transaction.type === 'WALLET_TO_WALLET' || transaction.counterpartyId || transaction.counterpartyUser) {
    return <DebitWalletToWalletReceiver transaction={transaction} receiverMeta={receiverMeta} metadata={metadata} />
  }

  if (transaction.type === 'WALLET_TO_INTERNAL_MERCHANT') {
    return <DebitInternalMerchantReceiver transaction={transaction} metadata={metadata} />
  }

  if (transaction.type === 'WALLET_TO_MERCHANT' || (transaction.type?.includes('MERCHANT') && transaction.type !== 'MERCHANT_TO_WALLET')) {
    return <DebitExternalMerchantReceiver transaction={transaction} metadata={metadata} />
  }

  if (metadata.counterpartyInfo) {
    return <CounterpartyInfoReceiver transaction={transaction} metadata={metadata} />
  }

  return <FallbackDebitReceiver transaction={transaction} metadata={metadata} />
}

function DebitPartnerDepositReceiver({ transaction, metadata }: { transaction: any; metadata: any }) {
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
      <span className="font-medium">{receiverName}</span>
      <span className="text-xs text-gray-500">📱 {receiverContact}</span>
      <span className="text-xs text-blue-600 font-medium">🏦 RukaPay Subscriber</span>
    </>
  )
}

function DebitMerchantToWalletReceiver({ transaction, receiverMeta, metadata }: { transaction: any; receiverMeta: any; metadata: any }) {
  const displayName = getDisplayName(transaction.counterpartyUser, receiverMeta, transaction.user)
    || metadata.recipientName
    || transaction.counterpartyUser?.phone
    || metadata.recipientPhone
    || 'RukaPay User'
  const contact = getContactInfo(transaction.counterpartyUser, receiverMeta, transaction.user)

  return (
    <>
      <span className="font-medium">{displayName}</span>
      {contact && (
        <span className="text-xs text-gray-500">📱 {contact}</span>
      )}
      {transaction.counterpartyId && (
        <span className="text-xs text-gray-500">📱 RukaPay ID: {transaction.counterpartyId.slice(0, 8)}...</span>
      )}
      <span className="text-xs text-blue-600 font-medium">🏦 RukaPay Subscriber</span>
    </>
  )
}

function DebitWalletToWalletReceiver({ transaction, receiverMeta, metadata }: { transaction: any; receiverMeta: any; metadata: any }) {
  return (
    <>
      <span className="font-medium">
        {getDisplayName(transaction.counterpartyUser, receiverMeta, transaction.user) || metadata.counterpartyInfo?.name || metadata.userName || 'RukaPay User'}
      </span>
      {transaction.counterpartyUser?.phone && (
        <span className="text-xs text-gray-500">📱 {transaction.counterpartyUser.phone}</span>
      )}
      {transaction.counterpartyId && (
        <span className="text-xs text-gray-500">📱 RukaPay ID: {transaction.counterpartyId.slice(0, 8)}...</span>
      )}
      <span className="text-xs text-blue-600 font-medium">🏦 RukaPay Subscriber</span>
    </>
  )
}

function DebitInternalMerchantReceiver({ transaction, metadata }: { transaction: any; metadata: any }) {
  return (
    <>
      <span className="font-medium">
        {metadata.merchantName ||
          metadata.counterpartyInfo?.name ||
          transaction.user?.merchants?.[0]?.businessTradeName ||
          transaction.user?.merchant?.businessTradeName ||
          transaction.user?.profile?.merchantBusinessTradeName ||
          transaction.user?.profile?.businessTradeName ||
          transaction.user?.profile?.merchant_names ||
          (metadata.merchantCode ? `Merchant (${metadata.merchantCode})` : 'Merchant')}
      </span>
      {metadata.merchantCode && (
        <span className="text-xs text-gray-500">Code: {metadata.merchantCode}</span>
      )}
      <span className="text-xs text-blue-600 font-medium">🏦 Internal Account</span>
    </>
  )
}

function DebitExternalMerchantReceiver({ transaction, metadata }: { transaction: any; metadata: any }) {
  return (
    <>
      <span className="font-medium">
        {metadata.merchantName ||
          metadata.counterpartyInfo?.name ||
          metadata.userName ||
          transaction.user?.merchants?.[0]?.businessTradeName ||
          transaction.user?.merchant?.businessTradeName ||
          transaction.user?.profile?.merchantBusinessTradeName ||
          transaction.user?.profile?.businessTradeName ||
          transaction.user?.profile?.merchant_names ||
          (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant')}
      </span>
      {metadata.accountNumber && (
        <span className="text-xs text-gray-500">🏪 Account: {metadata.accountNumber}</span>
      )}
      {metadata.merchantCode && (
        <span className="text-xs text-gray-500">Code: {metadata.merchantCode}</span>
      )}
      <span className="text-xs text-blue-600 font-medium">🏦 Internal Account</span>
    </>
  )
}

function CounterpartyInfoReceiver({ transaction, metadata }: { transaction: any; metadata: any }) {
  return (
    <>
      <span className="font-medium">{metadata.counterpartyInfo.name}</span>
      <span className="text-xs text-gray-500">
        {metadata.counterpartyInfo.type === 'USER'
          ? (transaction.type === 'WALLET_TO_WALLET'
            ? `📱 ${transaction.counterpartyId ? 'RukaPay ID: ' + transaction.counterpartyId.slice(0, 8) + '...' : 'RukaPay User'}`
            : '👤 Mobile User')
          : metadata.counterpartyInfo.type === 'UTILITY'
            ? `⚡ ${metadata.counterpartyInfo.accountNumber || 'Utility'}`
            : metadata.counterpartyInfo.type === 'MERCHANT'
              ? `🏪 ${metadata.counterpartyInfo.accountNumber || 'Merchant'}`
              : metadata.counterpartyInfo.type === 'MNO'
                ? `📱 ${metadata.counterpartyInfo.accountNumber || 'Mobile Money'}`
                : metadata.counterpartyInfo.type
        }
      </span>
      {metadata.counterpartyInfo.type === 'USER' && transaction.type === 'WALLET_TO_WALLET' && (
        <span className="text-xs text-blue-600 font-medium">🏦 RukaPay Subscriber</span>
      )}
    </>
  )
}

function FallbackDebitReceiver({ transaction, metadata }: { transaction: any; metadata: any }) {
  if (metadata.mnoProvider) {
    return (
      <>
        <span className="font-medium">
          {metadata.userName || metadata.recipientName || `${metadata.mnoProvider} Mobile Money`}
        </span>
        {metadata.phoneNumber && (
          <span className="text-xs text-gray-500">📱 {metadata.phoneNumber}</span>
        )}
        <span className="text-xs text-blue-600 font-medium">{metadata.mnoProvider} Network</span>
      </>
    )
  }

  if (metadata.phoneNumber) {
    return (
      <>
        <span className="font-medium">{metadata.userName || metadata.recipientName || 'Mobile Money User'}</span>
        <span className="text-xs text-gray-500">📱 {metadata.phoneNumber}</span>
        {(transaction.type?.includes('MNO') || transaction.type?.includes('WALLET_TO_MNO')) && (
          <span className="text-xs text-gray-500">📱 Mobile Money</span>
        )}
      </>
    )
  }

  if (metadata.accountNumber) {
    return (
      <>
        <span className="font-medium">{metadata.userName || metadata.recipientName || 'External Account'}</span>
        <span className="text-xs text-gray-500">
          {transaction.type?.includes('BANK')
            ? `🏦 Bank: ${metadata.accountNumber}`
            : transaction.type?.includes('UTILITY')
              ? `⚡ Utility: ${metadata.accountNumber}`
              : `Account: ${metadata.accountNumber}`
          }
        </span>
      </>
    )
  }

  if (transaction.type?.includes('MNO') || transaction.type?.includes('WALLET_TO_MNO')) {
    return (
      <>
        <span className="font-medium">Mobile Money</span>
        <span className="text-xs text-gray-500">📱 External Network</span>
      </>
    )
  }

  return <span className="text-gray-500">External</span>
}

function CreditReceiver({ transaction, derived }: ReceiverCellProps) {
  const { metadata, isBusinessLikeRecipientWallet } = derived

  if (
    (transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) &&
    (transaction.direction === 'CREDIT' || metadata.direction === 'CREDIT') &&
    isBusinessLikeRecipientWallet &&
    (metadata.merchantCode || metadata.merchantName || metadata.isPublicPayment)
  ) {
    return <CreditQrPaymentReceiver transaction={transaction} metadata={metadata} />
  }

  if (
    (transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET')) &&
    (transaction.direction === 'CREDIT' || metadata.direction === 'CREDIT') &&
    (transaction.channel === 'API' || metadata.channel === 'API') &&
    (transaction.mode === 'PARTNER_COLLECT_MNO' || metadata.transactionModeCode === 'PARTNER_COLLECT_MNO' || metadata.mode === 'PARTNER_COLLECT_MNO')
  ) {
    return <CreditPartnerCollectReceiver transaction={transaction} metadata={metadata} />
  }

  if (transaction.type === 'MERCHANT_TO_WALLET' || transaction.type === 'MERCHANT_TO_INTERNAL_WALLET') {
    return <CreditMerchantToWalletReceiver transaction={transaction} metadata={metadata} />
  }

  return <CreditGenericReceiver transaction={transaction} metadata={metadata} />
}

function CreditQrPaymentReceiver({ transaction, metadata }: { transaction: any; metadata: any }) {
  const walletType =
    metadata.recipientWalletType ||
    metadata.walletType ||
    transaction.wallet?.walletType
  const isBusinessWallet =
    walletType === 'BUSINESS' ||
    walletType === 'BUSINESS_COLLECTION' ||
    walletType === 'BUSINESS_DISBURSEMENT' ||
    walletType === 'BUSINESS_LIQUIDATION'

  if (isBusinessWallet || metadata.isPublicPayment) {
    const businessName =
      metadata.merchantName ||
      transaction.user?.merchants?.[0]?.businessTradeName ||
      transaction.user?.merchant?.businessTradeName ||
      (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant')
    return (
      <>
        <span className="font-medium">{businessName}</span>
        {metadata.merchantCode && (
          <span className="text-xs text-gray-500">🏪 Code: {metadata.merchantCode}</span>
        )}
        <span className="text-xs text-blue-600 font-medium">🏦 Merchant Account</span>
      </>
    )
  }

  const personalName =
    (transaction.user?.profile?.firstName && transaction.user?.profile?.lastName)
      ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
      : transaction.user?.phone || transaction.user?.email || 'RukaPay User'
  return (
    <>
      <span className="font-medium">{personalName}</span>
      <span className="text-xs text-gray-500">
        📱 {transaction.user?.phone || transaction.user?.email || 'N/A'}
      </span>
      {transaction.user?.userType === 'SUBSCRIBER' && (
        <span className="text-xs text-blue-600 font-medium">🏦 RukaPay Subscriber</span>
      )}
    </>
  )
}

function CreditPartnerCollectReceiver({ transaction, metadata }: { transaction: any; metadata: any }) {
  const isPartnerApi =
    transaction.partner ||
    transaction.partnerId ||
    metadata.isApiPartnerTransaction ||
    metadata.isPartnerTransaction ||
    metadata.apiPartnerName

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
    metadata.apiPartnerName ||
    transaction.partner?.partnerCode ||
    'API Partner'

  const partnerContact =
    transaction.partner?.contactPhone ||
    metadata.partnerPhone ||
    null

  return (
    <>
      <span className="font-medium">{displayName}</span>
      {partnerContact && (
        <span className="text-xs text-gray-500">📱 {partnerContact}</span>
      )}
      <span className="text-xs text-blue-600 font-medium">API Partner</span>
    </>
  )
}

function CreditMerchantToWalletReceiver({ transaction, metadata }: { transaction: any; metadata: any }) {
  const isUserMerchant = transaction.user?.merchantCode || transaction.user?.merchant?.businessTradeName
  let displayName = ''
  let contact = ''

  if (!isUserMerchant) {
    if (transaction.user?.profile?.firstName && transaction.user?.profile?.lastName) {
      displayName = `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
      contact = transaction.user?.phone || transaction.user?.email || ''
    } else if (transaction.user?.phone) {
      displayName = transaction.user.phone
      contact = transaction.user.phone
    } else if (transaction.user?.email) {
      displayName = transaction.user.email
      contact = transaction.user.email
    } else {
      displayName = 'RukaPay User'
    }
  } else {
    if (metadata.recipientName) {
      displayName = metadata.recipientName
      contact = metadata.recipientPhone || ''
    } else if (transaction.counterpartyUser?.profile?.firstName && transaction.counterpartyUser?.profile?.lastName) {
      displayName = `${transaction.counterpartyUser.profile.firstName} ${transaction.counterpartyUser.profile.lastName}`
      contact = transaction.counterpartyUser.phone || ''
    } else {
      displayName = 'RukaPay User'
    }
  }

  return (
    <>
      <span className="font-medium">{displayName}</span>
      {contact && (
        <span className="text-xs text-gray-500">📱 {contact}</span>
      )}
      <span className="text-xs text-blue-600 font-medium">🏦 RukaPay Subscriber</span>
    </>
  )
}

function CreditGenericReceiver({ transaction, metadata }: { transaction: any; metadata: any }) {
  const recipientWalletType =
    metadata.recipientWalletType ||
    metadata.walletType ||
    transaction.wallet?.walletType

  const isBusinessWallet =
    recipientWalletType === 'BUSINESS' ||
    recipientWalletType === 'BUSINESS_COLLECTION' ||
    recipientWalletType === 'BUSINESS_DISBURSEMENT' ||
    recipientWalletType === 'BUSINESS_LIQUIDATION'

  const hasMerchantMetadata =
    !!metadata.merchantName ||
    !!metadata.merchantCode ||
    metadata.paymentType === 'MERCHANT_COLLECTION'

  const isMerchantTransaction = isBusinessWallet || hasMerchantMetadata

  if (isMerchantTransaction) {
    const merchantName =
      transaction.user?.displayName ||
      transaction.user?.merchants?.[0]?.businessTradeName ||
      transaction.user?.merchant?.businessTradeName ||
      (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : null)

    const merchantCode =
      metadata.merchantCode ||
      transaction.user?.merchants?.[0]?.merchantCode ||
      transaction.user?.merchantCode

    return (
      <>
        <span className="font-medium">{merchantName || 'Merchant'}</span>
        {merchantCode && (
          <span className="text-xs text-gray-500">🏪 Code: {merchantCode}</span>
        )}
        <span className="text-xs text-blue-600 font-medium">🏦 Merchant Account</span>
      </>
    )
  }

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
        <span className="text-xs text-blue-600 font-medium">🏦 RukaPay Subscriber</span>
      )}
    </>
  )
}
