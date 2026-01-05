'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';

export interface TransactionMode {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  category: string;
  isSystem: boolean;
  isActive: boolean;
  minAmount?: number;
  maxAmount?: number;
  supportedCurrencies: string[];
  requiresApproval?: boolean;
  approvalThreshold?: number;
  defaultTariffId?: string;
  defaultTariff?: {
    id: string;
    name: string;
    isActive: boolean;
  };
  customFeePercentage?: number;
  customFeeAmount?: number;
  requiredFields: string[];
  validationRules?: any;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateTransactionModeDto {
  code: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  category: string;
  minAmount?: number;
  maxAmount?: number;
  supportedCurrencies: string[];
  requiresApproval?: boolean;
  approvalThreshold?: number;
  defaultTariffId?: string;
  customFeePercentage?: number;
  customFeeAmount?: number;
  requiredFields: string[];
  validationRules?: any;
  metadata?: any;
  systemTransactionModeCode?: string;
  isSystem?: boolean;
}

export interface UpdateTransactionModeDto extends CreateTransactionModeDto {
  isActive?: boolean;
}

export interface TransactionModeFilters {
  category?: string;
  isActive?: boolean;
  isSystem?: boolean;
  search?: string;
}

// Fetch all transaction modes with filters
export function useTransactionModes(filters?: TransactionModeFilters) {
  return useQuery({
    queryKey: ['transaction-modes', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.isSystem !== undefined) params.append('isSystem', filters.isSystem.toString());
      if (filters?.search) params.append('search', filters.search);

      const { data } = await axios.get<TransactionMode[]>(
        `/transaction-modes${params.toString() ? `?${params.toString()}` : ''}`
      );
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch system transaction modes (read-only)
export function useSystemTransactionModes() {
  return useQuery({
    queryKey: ['transaction-modes', 'system'],
    queryFn: async () => {
      const { data } = await axios.get<TransactionMode[]>('/transaction-modes/system');
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (system modes rarely change)
  });
}

// Fetch single transaction mode by ID
export function useTransactionMode(id: string | null) {
  return useQuery({
    queryKey: ['transaction-mode', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await axios.get<TransactionMode>(`/transaction-modes/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Create transaction mode
export function useCreateTransactionMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateTransactionModeDto) => {
      const { data } = await axios.post<TransactionMode>('/transaction-modes', dto);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-modes'] });
      toast.success(`Transaction mode "${data.name}" created successfully`);
    },
    onError: (error: any) => {
      if (error.status === 403 || error.response?.status === 403) {
        toast.error('Action forbidden - You do not have permission to create transaction modes');
      } else {
        const message = error.response?.data?.message || error.message || 'Failed to create transaction mode';
        toast.error(message);
      }
    },
  });
}

// Update transaction mode
export function useUpdateTransactionMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateTransactionModeDto }) => {
      const { data } = await axios.patch<TransactionMode>(`/transaction-modes/${id}`, dto);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-modes'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-mode', data.id] });
      toast.success(`Transaction mode "${data.name}" updated successfully`);
    },
    onError: (error: any) => {
      if (error.status === 403 || error.response?.status === 403) {
        toast.error('Action forbidden - You do not have permission to update transaction modes');
      } else {
        const message = error.response?.data?.message || error.message || 'Failed to update transaction mode';
        toast.error(message);
      }
    },
  });
}

// Delete transaction mode
export function useDeleteTransactionMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/transaction-modes/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-modes'] });
      toast.success('Transaction mode deleted successfully');
    },
    onError: (error: any) => {
      if (error.status === 403 || error.response?.status === 403) {
        toast.error('Action forbidden - You do not have permission to delete transaction modes');
      } else {
        const message = error.response?.data?.message || error.message || 'Failed to delete transaction mode';
        toast.error(message);
      }
    },
  });
}

// Activate transaction mode
export function useActivateTransactionMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post<TransactionMode>(`/transaction-modes/${id}/activate`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-modes'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-mode', data.id] });
      toast.success(`Transaction mode "${data.name}" activated`);
    },
    onError: (error: any) => {
      if (error.status === 403 || error.response?.status === 403) {
        toast.error('Action forbidden - You do not have permission to activate transaction modes');
      } else {
        const message = error.response?.data?.message || error.message || 'Failed to activate transaction mode';
        toast.error(message);
      }
    },
  });
}

// Deactivate transaction mode
export function useDeactivateTransactionMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post<TransactionMode>(`/transaction-modes/${id}/deactivate`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transaction-modes'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-mode', data.id] });
      toast.success(`Transaction mode "${data.name}" deactivated`);
    },
    onError: (error: any) => {
      if (error.status === 403 || error.response?.status === 403) {
        toast.error('Action forbidden - You do not have permission to deactivate transaction modes');
      } else {
        const message = error.response?.data?.message || error.message || 'Failed to deactivate transaction mode';
        toast.error(message);
      }
    },
  });
}

