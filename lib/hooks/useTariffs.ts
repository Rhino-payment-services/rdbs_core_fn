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
  isActive: boolean;
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
  minFee?: number;
  maxFee?: number;
  minAmount?: number;
  maxAmount?: number;
  userType?: string;
  subscriberType?: string;
  isActive?: boolean;
}

export interface TariffFilters {
  transactionType?: string;
  currency?: string;
  feeType?: string;
  userType?: string;
  subscriberType?: string;
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

// Constants for form options
export const TRANSACTION_TYPES = [
  { value: 'WALLET_TO_WALLET', label: 'Wallet to Wallet' },
  { value: 'WALLET_TO_MNO', label: 'Wallet to Mobile Money' },
  { value: 'WALLET_TO_BANK', label: 'Wallet to Bank' },
  { value: 'WALLET_TO_UTILITY', label: 'Wallet to Utility' },
  { value: 'WALLET_TO_MERCHANT', label: 'Wallet to Merchant' },
  { value: 'BILL_PAYMENT', label: 'Bill Payment' },
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'WITHDRAWAL', label: 'Withdrawal' },
  { value: 'REFUND', label: 'Refund' },
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
