import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'

// Tariff types
export interface Tariff {
  id: string;
  name: string;
  description?: string;
  transactionType: string;
  currency: string;
  feeType: 'FIXED' | 'PERCENTAGE' | 'HYBRID' | 'TIERED';
  feeAmount: number;
  feePercentage?: number;
  minFee?: number;
  maxFee?: number;
  minAmount?: number;
  maxAmount?: number;
  userType?: string;
  subscriberType?: string;
  partnerId?: string;
  group?: string; // Added group field
  partnerFee?: number; // Partner fee amount for external tariffs
  rukapayFee?: number; // RukaPay fee amount for external tariffs
  telecomBankCharge?: number; // Telecom/Bank charge (optional)
  isActive: boolean;
  // Approval workflow fields
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'DRAFT';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CreateTariffRequest {
  name: string;
  description?: string;
  transactionType: string;
  currency?: string;
  feeType: 'FIXED' | 'PERCENTAGE' | 'HYBRID' | 'TIERED';
  feeAmount: number;
  feePercentage?: number;
  minAmount?: number;
  maxAmount?: number;
  userType?: string;
  subscriberType?: string;
  partnerId?: string;
  group?: string; // Added group field
  partnerFee?: number; // Partner fee amount for external tariffs
  rukapayFee?: number; // RukaPay fee amount for external tariffs
  telecomBankCharge?: number; // Telecom/Bank charge (optional)
  isActive?: boolean;
}

export interface TariffFilters {
  transactionType?: string;
  currency?: string;
  feeType?: string;
  userType?: string;
  subscriberType?: string;
  partnerId?: string;
  group?: string; // Added group filter
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FeeCalculationRequest {
  transactionType: string;
  amount: number;
  currency?: string;
  userType: string;
  subscriberType?: string;
}

export interface FeeCalculationResponse {
  tariffId: string;
  tariffName: string;
  totalFee: number;
  netAmount: number;
  amountWithinLimits: boolean;
  feeCalculationValid: boolean;
  appliedRules: string[];
  warnings?: string[];
}

// Query keys for better cache management
export const tariffQueryKeys = {
  all: ['tariffs'] as const,
  lists: () => [...tariffQueryKeys.all, 'list'] as const,
  list: (filters: TariffFilters) => [...tariffQueryKeys.lists(), filters] as const,
  details: () => [...tariffQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...tariffQueryKeys.details(), id] as const,
  calculation: ['tariff-calculation'] as const,
}

// Generic API wrapper using centralized Axios instance
const apiFetch = async (endpoint: string, options: any = {}) => {
  try {
    const response = await api({
      url: endpoint,
      method: options.method || 'GET',
      data: options.data,
      params: options.params,
    });
    return response.data;
  } catch (error: any) {
    console.error(`API Error (${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
}

// Custom hooks for tariffs
export const useTariffs = (filters?: TariffFilters) => {
  return useQuery<ApiResponse<PaginatedResponse<Tariff>>>({
    queryKey: tariffQueryKeys.list(filters || {}),
    queryFn: () => apiFetch('/finance/tariffs', { params: filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useTariff = (id: string) => {
  return useQuery<ApiResponse<Tariff>>({
    queryKey: tariffQueryKeys.detail(id),
    queryFn: () => apiFetch(`/finance/tariffs/${id}`),
    enabled: !!id,
  })
}

export const useCreateTariff = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<Tariff>, Error, CreateTariffRequest>({
    mutationFn: (data: CreateTariffRequest) => 
      apiFetch('/finance/tariffs', { 
        method: 'POST', 
        data 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.lists() })
    },
  })
}

export const useUpdateTariff = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<Tariff>, Error, { id: string; data: Partial<CreateTariffRequest> }>({
    mutationFn: ({ id, data }) => 
      apiFetch(`/finance/tariffs/${id}`, { 
        method: 'PUT', 
        data 
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.detail(variables.id) })
    },
  })
}

export const useDeleteTariff = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<void>, Error, string>({
    mutationFn: (id: string) => 
      apiFetch(`/finance/tariffs/${id}`, { 
        method: 'DELETE' 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.lists() })
    },
  })
}

export const useCalculateFee = () => {
  return useMutation<ApiResponse<FeeCalculationResponse>, Error, FeeCalculationRequest>({
    mutationFn: (data: FeeCalculationRequest) => 
      apiFetch('/finance/tariffs/calculate-fee', { 
        method: 'POST', 
        data 
      }),
  })
}

// Enhanced fee calculation with breakdown
export const useCalculateEnhancedFee = () => {
  return useMutation<ApiResponse<any>, Error, FeeCalculationRequest & {
    thirdPartyProvider?: string;
    isAgentPayout?: boolean;
    country?: string;
  }>({
    mutationFn: (data) => 
      apiFetch('/finance/tariffs/calculate-enhanced-fee', { 
        method: 'POST', 
        data 
      }),
  })
}

// Approval workflow mutations
export const useApproveTariff = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<Tariff>, Error, { id: string; notes?: string }>({
    mutationFn: ({ id, notes }) => 
      apiFetch(`/finance/tariffs/${id}/approve`, { 
        method: 'POST', 
        data: { notes } 
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.detail(variables.id) })
    },
  })
}

export const useRejectTariff = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<Tariff>, Error, { id: string; notes: string }>({
    mutationFn: ({ id, notes }) => 
      apiFetch(`/finance/tariffs/${id}/reject`, { 
        method: 'POST', 
        data: { notes } 
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.detail(variables.id) })
    },
  })
}

export const useSubmitTariffForApproval = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<Tariff>, Error, string>({
    mutationFn: (id: string) => 
      apiFetch(`/finance/tariffs/${id}/submit-for-approval`, { 
        method: 'POST' 
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.detail(variables) })
    },
  })
}

// Constants for form options
export const TRANSACTION_TYPES = [
  // Internal types
  { value: 'WALLET_TO_WALLET', label: 'Wallet to Wallet' },
  { value: 'WALLET_TO_INTERNAL_MERCHANT', label: 'Wallet to Internal Merchant' },
  { value: 'WALLET_INIT', label: 'Wallet Initialization' },
  { value: 'FEE_CHARGE', label: 'Fee Charge' },
  { value: 'REVERSAL', label: 'Reversal' },
  // External types
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'WITHDRAWAL', label: 'Withdrawal' },
  { value: 'WALLET_TO_MNO', label: 'Wallet to MNO' },
  { value: 'BILL_PAYMENT', label: 'Bill Payment' },
  { value: 'SCHOOL_FEES', label: 'School Fees' },
  { value: 'WALLET_TO_EXTERNAL_MERCHANT', label: 'Wallet to External Merchant' },
  { value: 'MERCHANT_WITHDRAWAL', label: 'Merchant Withdrawal' },
  { value: 'MERCHANT_TO_WALLET', label: 'Merchant to Wallet' },
  { value: 'WALLET_TO_UTILITY', label: 'Wallet to Utility' },
  { value: 'WALLET_TO_MERCHANT', label: 'Wallet to Merchant' },
  { value: 'WALLET_TO_BANK', label: 'Wallet to Bank' },
  { value: 'BANK_TO_WALLET', label: 'Bank to Wallet' },
  { value: 'MNO_TO_WALLET', label: 'MNO to Wallet' },
  { value: 'CARD_TO_WALLET', label: 'Card to Wallet' },
  // Custom type for flexible use cases
  { value: 'CUSTOM', label: 'Custom' },
]

export const FEE_TYPES = [
  { value: 'FIXED', label: 'Fixed Amount', description: 'Charge a fixed amount regardless of transaction value' },
  { value: 'PERCENTAGE', label: 'Percentage', description: 'Charge a percentage of the transaction amount' },
  { value: 'HYBRID', label: 'Fixed + Percentage', description: 'Combine fixed amount with percentage' },
  { value: 'TIERED', label: 'Tiered', description: 'Different rates based on amount ranges' },
]

export const USER_TYPES = [
  { value: 'SUBSCRIBER', label: 'Subscriber' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'PARTNER', label: 'Partner' },
  { value: 'AGENT', label: 'Agent' },
]

export const SUBSCRIBER_TYPES = [
  { value: 'MERCHANT', label: 'Merchant' },
  { value: 'END_USER', label: 'End User' },
]

export const CURRENCIES = [
  { value: 'UGX', label: 'Ugandan Shilling (UGX)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
]
