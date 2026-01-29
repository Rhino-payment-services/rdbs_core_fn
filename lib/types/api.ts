// User types
export interface User {
  id: string
  old_id?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  phone?: string | null
  pin?: string | null
  role: string
  userType: string
  status: string
  isVerified: boolean
  kycStatus: string
  verificationLevel: string
  canHaveWallet: boolean
  merchantCode?: string | null  // ✅ Deprecated: Use merchants array instead
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
  permissions?: Permission[]
  subscriberType: string
  profile?: {
    id: string
    userId: string
    firstName: string
    middleName?: string | null
    lastName: string
    dateOfBirth?: string | null
    gender?: string | null
    nationalId?: string | null
    address?: string | null
    city?: string | null
    country: string
    typeData: any
    profileType: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    // Merchant properties (may exist in typeData at runtime)
    merchantBusinessTradeName?: string
    businessTradeName?: string
    merchant_names?: string
    owner_name?: string
  }
  // ✅ Updated: Merchant information - now an array to support multiple merchant accounts per user
  merchants?: Array<{
    id: string
    userId: string
    merchantCode: string
    businessTradeName: string
    businessType: string
    ownerFirstName: string
    ownerLastName: string
    registeredPhoneNumber: string
    businessEmail: string
    isVerified: boolean
    isActive: boolean
    createdAt: string
    updatedAt: string
  }>
  // ✅ Deprecated: Use merchants array instead
  merchant?: {
    id: string
    businessTradeName: string
    businessType: string
    ownerFirstName: string
    ownerLastName: string
    registeredPhoneNumber: string
    businessEmail: string
    isVerified: boolean
    isActive: boolean
  }
}

// API Partner types
export interface ApiPartner {
  id: string
  partnerName: string
  partnerType: string
  contactEmail: string
  contactPhone: string
  country?: string
  tier: string
  isActive: boolean
  isSuspended: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  pin?: string
  password?: string
  role: string
  userType: string
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  pin?: string
  password?: string
  role?: string
  userType?: string
  status?: string
  isVerified?: boolean
  kycStatus?: string
  verificationLevel?: string
  canHaveWallet?: boolean
}

export interface CreateRoleRequest {
  name: string
  description?: string
  permissions?: string[]
  permissionIds?: string[]
}

export interface AssignRoleRequest {
  userId: string
  roleId: string
}

export interface PermissionsResponse {
  permissions: Permission[]
}

export interface Role {
  id: string
  name: string
  description?: string
  isActive: boolean
  permissions?: Permission[]
  userRoles?: any[]
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  name: string
  description?: string
  category: string
  permissions?: string[]
}

// Transaction types
export interface Transaction {
  id: string
  userId: string
  walletId?: string | null
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'WALLET_TO_WALLET' | 'WALLET_TO_EXTERNAL_MERCHANT' | 'BILL_PAYMENT' | 'MERCHANT_WITHDRAWAL'
  mode?: string | null
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  direction?: 'INCOMING' | 'OUTGOING' | null
  amount: number
  currency: string
  fee: number
  netAmount: number
  
  // Enhanced Fee Breakdown
  rukapayFee?: number | null
  thirdPartyFee?: number | null
  governmentTax?: number | null
  processingFee?: number | null
  networkFee?: number | null
  complianceFee?: number | null
  feeBreakdown?: any | null
  
  // External references
  reference?: string | null
  externalId?: string | null
  externalReference?: string | null
  partnerMappingId?: string | null
  partnerId?: string | null  // ✅ API Partner ID (from api_partners table)
  
  // Transaction details
  description?: string | null
  metadata?: any | null
  errorMessage?: string | null
  
  // Counterparty information
  counterpartyId?: string | null
  counterpartyType?: string | null
  
  // Bulk transaction
  bulkTransactionId?: string | null
  
  // Timestamps
  processedAt?: string | null
  createdAt: string
  updatedAt: string
  
  // Relations
  user: User
  wallet?: Wallet | null
  bulkTransaction?: BulkTransaction | null
  counterpartyUser?: User | null
  ledgerEntries?: LedgerEntry[]
  
  // API Partner Information (from api_partners table)
  partner?: {
    id: string
    partnerName: string
    partnerType: string
    isActive: boolean
  } | null
  
  // Partner Information (from partnerMapping relation - external payment partners like ABC, Pegasus)
  partnerMapping?: {
    id: string
    transactionType: string
    geographicRegion: string
    partnerId: string
    isActive: boolean
    priority: number
    
    // Partner details
    partner: {
      id: string
      partnerName: string
      partnerCode: string
      isActive: boolean
      supportedServices: string[]
      baseUrl: string
      description?: string | null
      website?: string | null
      contactEmail?: string | null
      contactPhone?: string | null
    }
  }
}

// Customer types
export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  type: 'subscribers' | 'merchants' | 'partners' | 'agents' | 'super-agents' | 'banks'
  status: 'active' | 'inactive' | 'suspended'
  joinDate: string
  lastActivity: string
  totalTransactions: number
  totalVolume: number
  location: string
  balance?: number
  commission?: number
  merchantId?: string
  bankCode?: string
}

// Analytics types
export interface AnalyticsData {
  totalTransactions: number
  totalVolume: number
  totalUsers: number
  totalCustomers: number
  transactionVolumeData: Array<{
    day: string
    volume: number
    transactions: number
  }>
  transactionAmountDistribution: Array<{
    range: string
    count: number
    percentage: number
  }>
  userDemographics: Array<{
    age: string
    count: number
    percentage: number
  }>
  transactionTypes: Array<{
    type: string
    count: number
    volume: number
  }>
  geographicData: Array<{
    location: string
    transactions: number
    volume: number
  }>
}

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  category: 'transaction' | 'security' | 'system' | 'user' | 'payment'
  action?: {
    label: string
    url: string
  }
}

// Wallet types
export interface Wallet {
  id: string
  userId: string
  balance: number
  currency: string
  isActive: boolean
  isSuspended: boolean
  suspendedAt?: string
  suspendedBy?: string
  suspensionReason?: string
  walletType: string
  description?: string
  createdAt: string
  updatedAt: string
  dailyLimit?: number
  dailyUsed?: number
  lastResetDate?: string
  partnerId?: string | null  // API Partner ID (from api_partners table)
  merchantId?: string | null  // Merchant ID
}

export interface WalletBalance {
  walletId: string
  balance: number
  currency: string
  lastUpdated: string
}

export interface CreateWalletRequest {
  userId?: string
  currency: string
  description?: string
}

// Transaction types
export interface TransactionStats {
  totalTransactions: number
  totalAmount: number
  currency: string
  successfulTransactions: number
  failedTransactions: number
  pendingTransactions: number
  averageTransactionAmount: number
  monthlyStats: {
    month: string
    count: number
    amount: number
  }[]
  typeBreakdown: {
    type: string
    count: number
    amount: number
  }[]
}

export interface WalletToWalletRequest {
  recipientUserId: string
  amount: number
  currency: string
  description?: string
  reference?: string
}

export interface MnoTransactionRequest {
  phoneNumber: string
  amount: number
  currency: string
  mnoProvider: 'MTN' | 'AIRTEL' | 'MPESA'
  description?: string
  reference?: string
}

export interface BankTransactionRequest {
  bankCode: string
  accountNumber: string
  accountName: string
  amount: number
  currency: string
  description?: string
  reference?: string
}

export interface UtilityTransactionRequest {
  utilityType: 'ELECTRICITY' | 'WATER' | 'INTERNET' | 'TV'
  meterNumber: string
  amount: number
  currency: string
  description?: string
  reference?: string
}

export interface MerchantTransactionRequest {
  merchantId: string
  amount: number
  currency: string
  description?: string
  reference?: string
}

// Bulk Transaction types
export interface BulkTransaction {
  id: string
  initiatedBy: string
  bulkType: string
  totalAmount: number
  totalTransactions: number
  successfulTransactions: number
  failedTransactions: number
  status: string
  processedAt?: string
  createdAt: string
  updatedAt: string
}

// Ledger Entry types
export interface LedgerEntry {
  id: string
  transactionId: string
  walletId: string
  amount: number
  balance: number
  entryType: 'DEBIT' | 'CREDIT'
  createdAt: string
}

// KYC types
export interface KycStatus {
  userId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_STARTED'
  verificationLevel: 'BASIC' | 'ENHANCED' | 'FULL'
  canPerformTransactions: boolean
  transactionLimits: {
    daily: number
    monthly: number
    yearly: number
  }
  lastUpdated: string
}

export interface UpdateKycRequest {
  firstName?: string
  lastName?: string
  middleName?: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  nationality?: string
  address?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  kycData?: {
    nationalId?: string
    passportNumber?: string
    occupation?: string
    employer?: string
    monthlyIncome?: number
    sourceOfFunds?: string
  }
}

// Admin KYC types
export interface KycApproval {
  userId: string
  userEmail: string
  userPhone: string
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedAt: string
  documents: {
    id: string
    type: string
    filename: string
    uploadedAt: string
  }[]
  kycData: {
    firstName: string
    lastName: string
    dateOfBirth: string
    nationality: string
    nationalId?: string
    passportNumber?: string
    occupation?: string
    employer?: string
    monthlyIncome?: number
  }
}

// System Log types
export interface UserDetails {
  id: string
  email: string
  phone: string | null
  role: string
  userType: string
  firstName: string
  lastName: string
  fullName: string
  department: string
  position: string
}

export interface SystemLog {
  _id: string
  userId: string
  userEmail?: string
  userPhone?: string
  userDetails?: UserDetails
  action: string
  category: string
  description: string
  status: string
  metadata?: Record<string, unknown>
  channel: string
  requestId: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  updatedAt: string
}

export interface SystemLogsResponse {
  logs: SystemLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Query parameters
export interface TransactionFilters {
  type?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  senderId?: string
  receiverId?: string
  partnerId?: string
}

export interface CustomerFilters {
  type?: string
  status?: string
  search?: string
  location?: string
}

export interface AnalyticsFilters {
  timeRange?: '7d' | '30d' | '90d' | '1y'
  type?: string
  location?: string
}

// Transaction System Stats
export interface TransactionSystemStats {
  totalTransactions: number
  totalVolume: number
  totalFees: number
  successRate: number
  averageTransactionAmount: number
  transactionsByType: Record<string, number>
  transactionsByStatus: Record<string, number>
  transactionsByCurrency: Record<string, number>
  partnerStats: Record<string, {
    totalTransactions: number
    totalVolume: number
    successRate: number
    averageResponseTime: number
  }>
}

export interface ApiFetchOptions {
  method?: string
  data?: unknown
  params?: Record<string, string>
}

// Merchant types
export interface Merchant {
  id: string
  businessName: string
  businessType: string
  registrationNumber: string
  taxId?: string
  contactPerson: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED'
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  wallet?: {
    id: string
    balance: number
    currency: string
    status: string
  }
}

// KYC Stats types
export interface KycStats {
  totalSubmissions: number
  approved: number
  pending: number
  rejected: number
  approvalRate: number
  averageProcessingTime: number
}

// System Stats types
export interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalTransactions: number
  totalVolume: number
  totalFees: number
  successRate: number
  averageTransactionAmount: number
  transactionsByType: Record<string, number>
  transactionsByStatus: Record<string, number>
  transactionsByCurrency: Record<string, number>
  systemHealth: {
    apiResponseTime: number
    uptime: number
    activeSessions: number
    failedTransactions: number
  }
}

// Partner types
export interface ExternalPaymentPartner {
  id: string
  partnerName: string
  partnerCode: string
  isActive: boolean
  isSuspended: boolean
  suspendedAt?: string
  suspensionReason?: string
  supportedServices: string[]
  baseUrl: string
  apiKey?: string
  secretKey?: string
  additionalConfig?: any
  rateLimit: number
  dailyQuota?: number
  monthlyQuota?: number
  costPerTransaction?: number
  costCurrency: string
  averageResponseTime?: number
  successRate?: number
  lastHealthCheck?: string
  priority: number
  failoverPriority: number
  geographicRegions: string[]
  description?: string
  website?: string
  contactEmail?: string
  contactPhone?: string
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}
