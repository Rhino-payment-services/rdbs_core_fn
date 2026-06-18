import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import type { ExternalPaymentPartner } from '@/lib/types/api';

export interface GatewayPartnerRoutingRule {
  id: string;
  apiPartnerId: string;
  transactionType: string;
  geographicRegion: string;
  network?: string | null;
  externalPartnerId: string;
  externalPartner: {
    id: string;
    partnerName: string;
    partnerCode: string;
  };
  priority: number;
  isActive: boolean;
  minAmount?: number | null;
  maxAmount?: number | null;
  dailyLimit?: number | null;
  monthlyLimit?: number | null;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGatewayPartnerRoutingRequest {
  transactionType: string;
  network?: string;
  partnerCode?: string;
  externalPartnerId?: string;
  geographicRegion?: string;
  priority?: number;
  minAmount?: number;
  maxAmount?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
}

export interface UpdateGatewayPartnerRoutingRequest {
  transactionType?: string;
  network?: string;
  partnerCode?: string;
  externalPartnerId?: string;
  geographicRegion?: string;
  priority?: number;
  isActive?: boolean;
  minAmount?: number | null;
  maxAmount?: number | null;
  dailyLimit?: number | null;
  monthlyLimit?: number | null;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const err = error as {
    response?: { data?: { message?: string; error?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback
  );
}

function unwrapListData(response: { data: unknown }): GatewayPartnerRoutingRule[] {
  const payload = response.data as { data?: GatewayPartnerRoutingRule[] } | GatewayPartnerRoutingRule[];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export const useExternalPaymentPartners = () => {
  return useQuery({
    queryKey: ['external-payment-partners'],
    queryFn: async () => {
      const response = await api.get('/admin/external-payment-partners');
      const raw = response.data;
      const partners: ExternalPaymentPartner[] = Array.isArray(raw) ? raw : raw?.data ?? [];
      return partners.filter((p) => p.isActive && !p.isSuspended);
    },
    staleTime: 60000,
  });
};

export const useGatewayPartnerRouting = (partnerId: string) => {
  return useQuery({
    queryKey: ['gateway-partner-routing', partnerId],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/admin/gateway-partners/${partnerId}/routing`,
      );
      return unwrapListData(response);
    },
    enabled: !!partnerId,
    staleTime: 30000,
  });
};

export const useCreateGatewayPartnerRouting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      partnerId,
      data,
    }: {
      partnerId: string;
      data: CreateGatewayPartnerRoutingRequest;
    }) => {
      const response = await api.post(
        `/api/v1/admin/gateway-partners/${partnerId}/routing`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner-routing', variables.partnerId],
      });
      toast.success('Routing rule created successfully!');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to create routing rule'));
    },
  });
};

export const useUpdateGatewayPartnerRouting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      partnerId,
      routingId,
      data,
    }: {
      partnerId: string;
      routingId: string;
      data: UpdateGatewayPartnerRoutingRequest;
    }) => {
      const response = await api.put(
        `/api/v1/admin/gateway-partners/${partnerId}/routing/${routingId}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner-routing', variables.partnerId],
      });
      toast.success('Routing rule updated successfully!');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to update routing rule'));
    },
  });
};

export const useDeactivateGatewayPartnerRouting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      partnerId,
      routingId,
    }: {
      partnerId: string;
      routingId: string;
    }) => {
      const response = await api.delete(
        `/api/v1/admin/gateway-partners/${partnerId}/routing/${routingId}`,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner-routing', variables.partnerId],
      });
      toast.success('Routing rule deactivated successfully!');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to deactivate routing rule'));
    },
  });
};
