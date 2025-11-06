import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

// Types
export interface GatewayPartner {
  id: string;
  partnerName: string;
  partnerType: string;
  contactEmail: string;
  contactPhone: string;
  contactPerson?: string;
  country: string;
  tier: string;
  securityLevel: string;
  isActive: boolean;
  isSuspended: boolean;
  suspendedAt?: string;
  suspensionReason?: string;
  permissions: string[];
  allowedEndpoints: string[];
  rateLimits: {
    requests_per_second: number;
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
  };
  usageQuotas: {
    monthly_transactions: number;
    monthly_volume_ugx: number;
    daily_transactions: number;
    daily_volume_ugx: number;
    max_transaction_amount: number;
    min_transaction_amount: number;
  };
  description?: string;
  website?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GatewayPartnerDetails extends GatewayPartner {
  apiKeys: Array<{
    id: string;
    keyPrefix: string;
    description?: string;
    isActive: boolean;
    isRevoked: boolean;
    expiresAt?: string;
    lastUsedAt?: string;
    createdAt: string;
    permissions: string[];
  }>;
  tariffs: Array<{
    id: string;
    destinationType: string;
    commissionPercentage: number;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface CreateGatewayPartnerRequest {
  partnerName: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  contactPerson?: string;
  partnerType?: string;
  tier?: 'SILVER' | 'GOLD' | 'PLATINUM';
  website?: string;
  address?: string;
  description?: string;
  permissions?: string[];
  rateLimits?: {
    requests_per_second?: number;
    requests_per_minute?: number;
    requests_per_hour?: number;
    requests_per_day?: number;
  };
  usageQuotas?: {
    monthly_transactions?: number;
    monthly_volume_ugx?: number;
    daily_transactions?: number;
    daily_volume_ugx?: number;
    max_transaction_amount?: number;
    min_transaction_amount?: number;
  };
}

export interface GenerateApiKeyRequest {
  partnerId: string;
  description?: string;
  expiresInDays?: number;
  permissions?: string[];
}

export interface CreateTariffsRequest {
  partnerId: string;
  percentageFee?: number; // RukaPay commission only
  destinationType?: string; // Optional: MTN, AIRTEL, BANK, WALLET (if not provided, creates all)
}

// Hook: Get all gateway partners
export const useGatewayPartners = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['gateway-partners', page, limit],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/admin/gateway-partners?page=${page}&limit=${limit}`,
      );
      return response.data;
    },
    staleTime: 30000, // 30 seconds
  });
};

// Hook: Get single gateway partner details
export const useGatewayPartner = (partnerId: string) => {
  return useQuery({
    queryKey: ['gateway-partner', partnerId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/admin/gateway-partners/${partnerId}`);
      return response.data.data as GatewayPartnerDetails;
    },
    enabled: !!partnerId,
    staleTime: 30000,
  });
};

// Hook: Create gateway partner
export const useCreateGatewayPartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGatewayPartnerRequest) => {
      const response = await api.post('/api/v1/admin/gateway-partners', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-partners'] });
      toast.success('Gateway partner created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.data?.message || 'Failed to create gateway partner');
    },
  });
};

// Hook: Generate API key
export const useGenerateApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateApiKeyRequest) => {
      const response = await api.post('/api/v1/admin/gateway-partners/api-keys', data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner', variables.partnerId],
      });
      toast.success('API key generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.data?.message || 'Failed to generate API key');
    },
  });
};

// Hook: Create tariffs for partner
export const useCreateTariffs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTariffsRequest) => {
      const response = await api.post('/api/v1/admin/gateway-partners/tariffs', data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner', variables.partnerId],
      });
      toast.success('Tariffs created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.data?.message || 'Failed to create tariffs');
    },
  });
};

// Hook: Update gateway partner
export const useUpdateGatewayPartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      partnerId,
      data,
    }: {
      partnerId: string;
      data: Partial<CreateGatewayPartnerRequest>;
    }) => {
      const response = await api.put(`/api/v1/admin/gateway-partners/${partnerId}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gateway-partners'] });
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner', variables.partnerId],
      });
      toast.success('Partner updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.data?.message || 'Failed to update partner');
    },
  });
};

// Hook: Suspend/Unsuspend partner
export const useSuspendGatewayPartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      partnerId,
      isSuspended,
      reason,
    }: {
      partnerId: string;
      isSuspended: boolean;
      reason?: string;
    }) => {
      const response = await api.post(
        `/api/v1/admin/gateway-partners/${partnerId}/suspend`,
        { isSuspended, reason },
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gateway-partners'] });
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner', variables.partnerId],
      });
      toast.success(
        variables.isSuspended
          ? 'Partner suspended successfully!'
          : 'Partner reactivated successfully!',
      );
    },
    onError: (error: any) => {
      toast.error(error?.data?.message || 'Failed to update partner status');
    },
  });
};

// Hook: Revoke API key
export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keyId, reason }: { keyId: string; reason: string }) => {
      const response = await api.post(
        `/api/v1/admin/gateway-partners/api-keys/${keyId}/revoke`,
        { reason },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gateway-partner'] });
      toast.success('API key revoked successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.data?.message || 'Failed to revoke API key');
    },
  });
};

