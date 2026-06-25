import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

export interface AmountRoutingRulePartner {
  id: string;
  partnerName: string;
  partnerCode: string;
  isActive: boolean;
}

export interface AmountRoutingRule {
  id: string;
  minAmount: number;
  maxAmount: number;
  currency: string;
  partnerId: string;
  partner: AmountRoutingRulePartner | null;
  isActive: boolean;
  priority: number;
  transactionType: string | null;
  geographicRegion: string | null;
  network: string | null;
  apiPartnerId: string | null;
  paymentMethod: string | null;
  totalTransactions: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAmountRoutingRuleRequest {
  minAmount: number;
  maxAmount: number;
  currency: string;
  partnerId: string;
  apiPartnerId: string;
  priority?: number;
}

export interface UpdateAmountRoutingRuleRequest {
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  partnerId?: string;
  apiPartnerId?: string;
  priority?: number;
}

export interface DeleteAmountRoutingRuleResponse {
  success: boolean;
  message: string;
}

export interface AmountRoutingRulesListParams {
  currency?: string;
  isActive?: boolean;
  apiPartnerId?: string;
}

export const amountRoutingRulesQueryKey = (params?: AmountRoutingRulesListParams) =>
  ['amount-routing-rules', params ?? {}] as const;

function parseApiMessage(error: unknown, fallback: string): string {
  const err = error as {
    response?: { data?: { message?: string | string[]; error?: string } };
    message?: string;
  };
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) {
    return message.join('; ');
  }
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  return (
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

function unwrapListData(response: { data: unknown }): AmountRoutingRule[] {
  const payload = response.data as { data?: AmountRoutingRule[] } | AmountRoutingRule[];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function unwrapRuleData(response: { data: unknown }): AmountRoutingRule {
  const payload = response.data as { data?: AmountRoutingRule } | AmountRoutingRule;
  if (payload && typeof payload === 'object' && 'id' in payload) {
    return payload as AmountRoutingRule;
  }
  return (payload as { data?: AmountRoutingRule }).data as AmountRoutingRule;
}

export const useAmountRoutingRules = (params?: AmountRoutingRulesListParams) => {
  return useQuery({
    queryKey: amountRoutingRulesQueryKey(params),
    queryFn: async () => {
      const response = await api.get('/admin/routing-rules', {
        params: {
          ...(params?.currency ? { currency: params.currency } : {}),
          ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
          ...(params?.apiPartnerId ? { apiPartnerId: params.apiPartnerId } : {}),
        },
      });
      return unwrapListData(response);
    },
    staleTime: 30000,
  });
};

export const useAmountRoutingRule = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['amount-routing-rules', id],
    queryFn: async () => {
      const response = await api.get(`/admin/routing-rules/${id}`);
      return unwrapRuleData(response);
    },
    enabled: !!id && enabled,
    staleTime: 30000,
  });
};

export const useCreateAmountRoutingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAmountRoutingRuleRequest) => {
      const response = await api.post('/admin/routing-rules', data);
      return unwrapRuleData(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amount-routing-rules'] });
      toast.success('Amount routing rule created successfully!');
    },
  });
};

export const useUpdateAmountRoutingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAmountRoutingRuleRequest;
    }) => {
      const response = await api.patch(`/admin/routing-rules/${id}`, data);
      return unwrapRuleData(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['amount-routing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['amount-routing-rules', variables.id] });
      toast.success('Amount routing rule updated successfully!');
    },
  });
};

export const useUpdateAmountRoutingRuleStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch(`/admin/routing-rules/${id}/status`, { isActive });
      return unwrapRuleData(response);
    },
    onSuccess: (rule) => {
      queryClient.invalidateQueries({ queryKey: ['amount-routing-rules'] });
      queryClient.invalidateQueries({ queryKey: ['amount-routing-rules', rule.id] });
      toast.success(
        rule.isActive
          ? 'Amount routing rule activated successfully!'
          : 'Amount routing rule deactivated successfully!',
      );
    },
    onError: (error: unknown) => {
      toast.error(parseApiMessage(error, 'Failed to update rule status'));
    },
  });
};

export const useDeleteAmountRoutingRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/routing-rules/${id}`);
      return response.data as DeleteAmountRoutingRuleResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['amount-routing-rules'] });
      toast.success(data?.message || 'Amount routing rule deleted successfully!');
    },
    onError: (error: unknown) => {
      toast.error(parseApiMessage(error, 'Failed to delete amount routing rule'));
    },
  });
};

export { parseApiMessage as extractAmountRoutingApiMessage };
