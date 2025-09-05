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
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
  permissions?: Permission[]
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions?: string[]
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: string
  name: string
  description?: string
  resource: string
  action: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateRoleRequest {
  name: string
  description: string
  permissionIds: string[]
}

export interface AssignRoleRequest {
  userId: string
  roleId: string
}

export interface PermissionsResponse {
  permissions: Permission[]
  total: number
}

export interface CreateUserRequest {
  email: string
  password: string
  role: string
  userType: string
  firstName: string
  lastName: string
  department: string
  position: string
  country: string
}

export interface UpdateUserRequest {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  position?: string
  department?: string
  role?: string
  permissions?: string[]
}

// Transaction types
export interface Transaction {
  id: string
  type: 'Wallet to Wallet' | 'Wallet to Mobile Money' | 'Mobile Money to Wallet' | 'Merchant Payment' | 'Deposit from Agent'
  amount: number
  fee: number
  status: 'completed' | 'pending' | 'failed'
  date: string
  sender: {
    id: string
    name: string
    type: 'subscribers' | 'merchants' | 'partners' | 'agents' | 'super-agents' | 'banks'
    phone: string
  }
  receiver: {
    id: string
    name: string
    type: 'subscribers' | 'merchants' | 'partners' | 'agents' | 'super-agents' | 'banks'
    phone: string
  }
  reference: string
  description: string
  failureReason?: string
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
  currency: string
  balance: number
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED'
  description?: string
  createdAt: string
  updatedAt: string
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
} 
export interface ApiFetchOptions {
  method?: string
  data?: unknown
  params?: Record<string, string>
}