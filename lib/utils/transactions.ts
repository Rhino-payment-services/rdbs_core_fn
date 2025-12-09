import { 
  Smartphone,
  Phone,
  Code,
  Building2,
  Store,
  Users
} from 'lucide-react'

/**
 * Shorten long transaction IDs for display
 */
export const shortenTransactionId = (id: string): string => {
  if (!id) return 'N/A';
  
  // If ID contains WALLET_INIT with UUID, shorten it
  if (id.includes('WALLET_INIT_')) {
    const parts = id.split('_');
    // Return: WALLET_INIT_[last 6 digits]
    const timestamp = parts[parts.length - 1];
    return `WALLET_INIT_${timestamp.slice(-6)}`;
  }
  
  // If ID starts with REV- (reversal transaction), shorten it
  if (id.startsWith('REV-')) {
    const parts = id.split('-');
    if (parts.length >= 3) {
      // Format: REV-TXN672778856-1764600481633
      // Return: REV-TXN672778856-[last 6 digits of timestamp]
      const originalTxn = parts[1]; // TXN672778856
      const timestamp = parts[2]; // 1764600481633
      return `REV-${originalTxn}-${timestamp.slice(-6)}`;
    }
  }
  
  // If ID contains ADMIN_FUND (admin fund transaction), shorten it
  if (id.includes('ADMIN_FUND_')) {
    const parts = id.split('_');
    if (parts.length >= 3) {
      // Format: ADMIN_FUND_1764600481633
      // Return: ADMIN_FUND_[last 6 digits]
      const timestamp = parts[parts.length - 1];
      return `ADMIN_FUND_${timestamp.slice(-6)}`;
    }
  }
  
  // If ID contains FUND- (other fund transaction formats), shorten it
  if (id.includes('FUND-') || id.includes('ADMIN-FUND')) {
    const parts = id.split('-');
    if (parts.length >= 2) {
      // Show prefix and last 8 characters
      const prefix = parts[0];
      const lastPart = parts[parts.length - 1];
      return `${prefix}-${lastPart.slice(-8)}`;
    }
  }
  
  // If ID is very long (>30 chars), shorten it
  if (id.length > 30) {
    // Show first 15 and last 8 characters
    return `${id.substring(0, 15)}...${id.slice(-8)}`;
  }
  
  return id;
};

/**
 * Format amount as currency
 */
export const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0
  }).format(amount)
}

/**
 * Format date string
 */
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get status badge config (returns config object, not JSX)
 */
export const getStatusBadgeConfig = (status: string) => {
  const statusConfig = {
    SUCCESS: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
    COMPLETED: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
    PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
    PROCESSING: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Processing' },
    FAILED: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Failed' },
    CANCELLED: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Cancelled' },
    REVERSED: { color: 'bg-orange-100 text-orange-800 border-orange-200', label: 'Reversed' }
  }
  return statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status || 'Unknown' }
}

/**
 * Get display name - shows merchant business name for merchants, user name for individuals
 */
export const getDisplayName = (user: any, metadata?: any, counterpartyUser?: any) => {
  // Check if it's a merchant (has merchantCode or merchant relation)
  const isMerchant = user?.merchantCode || user?.merchant?.businessTradeName || metadata?.merchantName || metadata?.merchantCode
  
  if (isMerchant) {
    // Show merchant business name
    return metadata?.merchantName || 
           user?.merchant?.businessTradeName ||
           user?.profile?.merchantBusinessTradeName ||
           user?.profile?.businessTradeName ||
           user?.profile?.merchant_names ||
           (user?.merchantCode ? `Merchant (${user.merchantCode})` : 'Merchant')
  } else {
    // Show individual user name - prioritize counterpartyUser if available (for receiver in DEBIT)
    if (counterpartyUser?.profile?.firstName && counterpartyUser?.profile?.lastName) {
      return `${counterpartyUser.profile.firstName} ${counterpartyUser.profile.lastName}`
    }
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName} ${user.profile.lastName}`
    }
    // Fallback to metadata recipient name
    if (metadata?.recipientName) {
      return metadata.recipientName
    }
    return user?.phone || user?.email || counterpartyUser?.phone || counterpartyUser?.email || 'RukaPay User'
  }
}

/**
 * Get contact info
 */
export const getContactInfo = (user: any, metadata?: any, counterpartyUser?: any) => {
  return counterpartyUser?.phone || metadata?.recipientPhone || user?.phone || user?.email || 'N/A'
}

/**
 * Get transaction type display name
 */
export const getTypeDisplay = (type: string, direction?: string) => {
  // Special handling for MERCHANT_TO_WALLET based on direction
  if ((type === 'MERCHANT_TO_WALLET' || type === 'MERCHANT_TO_INTERNAL_WALLET') && direction === 'DEBIT') {
    return 'Sent from Merchant'
  }
  
  const typeMap = {
    // P2P and Internal Transfers
    WALLET_TO_WALLET: 'P2P Transfer',
    
    // Mobile Money Transactions
    WALLET_TO_MNO: 'Send to Mobile Money',
    MNO_TO_WALLET: 'Receive from Mobile Money',
    WALLET_TOPUP_PULL: 'Mobile Money Top-up',
    
    // Merchant Transactions
    WALLET_TO_MERCHANT: 'Pay Merchant',
    WALLET_TO_INTERNAL_MERCHANT: 'Pay Merchant', // Legacy naming
    WALLET_TO_EXTERNAL_MERCHANT: 'Pay External Merchant',
    MERCHANT_TO_WALLET: 'Receive from Merchant',
    MERCHANT_TO_INTERNAL_WALLET: 'Receive from Merchant', // Legacy naming
    MERCHANT_WITHDRAWAL: 'Merchant Withdrawal',
    
    // Bank Transactions
    WALLET_TO_BANK: 'Bank Transfer',
    BANK_TO_WALLET: 'Receive from Bank',
    
    // Card Transactions
    CARD_TO_WALLET: 'Card Top-up',
    
    // Utility and Bill Payments
    WALLET_TO_UTILITY: 'Utility Payment',
    BILL_PAYMENT: 'Bill Payment',
    
    // Wallet Operations
    DEPOSIT: 'Wallet Deposit',
    WITHDRAWAL: 'Wallet Withdrawal',
    WALLET_CREATION: 'Wallet Created',
    WALLET_INIT: 'Wallet Initialized',
    
    // System Transactions
    REVERSAL: 'Transaction Reversal',
    REFUND: 'Refund',
    FEE_CHARGE: 'Fee Charge',
    CUSTOM: 'Custom Transaction'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

/**
 * Get channel display information
 */
export const getChannelDisplay = (channel: string | null | undefined, metadata?: any) => {
  const channelValue = channel || metadata?.channel || 'APP'
  const channelUpper = channelValue.toUpperCase()
  
  // Map WEB to MERCHANT_PORTAL since they are the same thing
  const normalizedChannel = channelUpper === 'WEB' ? 'MERCHANT_PORTAL' : channelUpper
  
  const channelMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
    APP: {
      label: 'Mobile App',
      icon: Smartphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    USSD: {
      label: 'USSD',
      icon: Phone,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200'
    },
    API: {
      label: 'API',
      icon: Code,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200'
    },
    BACKOFFICE: {
      label: 'Back Office',
      icon: Building2,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-200'
    },
    MERCHANT_PORTAL: {
      label: 'Merchant Portal',
      icon: Store,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200'
    },
    AGENT_PORTAL: {
      label: 'Agent Portal',
      icon: Users,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 border-teal-200'
    },
    PARTNER_PORTAL: {
      label: 'Partner Portal',
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 border-pink-200'
    }
  }
  
  // Find exact match or pattern match
  let matchedChannel = channelMap[normalizedChannel]
  
  if (!matchedChannel) {
    // Pattern matching for variations
    if (normalizedChannel.includes('APP') || normalizedChannel.includes('MOBILE')) {
      matchedChannel = channelMap.APP
    } else if (normalizedChannel.includes('USSD')) {
      matchedChannel = channelMap.USSD
    } else if (normalizedChannel.includes('WEB') || normalizedChannel.includes('BROWSER')) {
      matchedChannel = channelMap.MERCHANT_PORTAL // Map WEB to MERCHANT_PORTAL
    } else if (normalizedChannel.includes('API')) {
      matchedChannel = channelMap.API
    } else if (normalizedChannel.includes('BACKOFFICE') || normalizedChannel.includes('ADMIN')) {
      matchedChannel = channelMap.BACKOFFICE
    } else if (normalizedChannel.includes('MERCHANT')) {
      matchedChannel = channelMap.MERCHANT_PORTAL
    } else if (normalizedChannel.includes('AGENT')) {
      matchedChannel = channelMap.AGENT_PORTAL
    } else if (normalizedChannel.includes('PARTNER')) {
      matchedChannel = channelMap.PARTNER_PORTAL
    } else {
      // Default to APP
      matchedChannel = channelMap.APP
    }
  }
  
  return matchedChannel
}

