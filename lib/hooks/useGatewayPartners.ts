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
  authenticationType?: 'API_KEY_ONLY' | 'API_KEY_AND_TOKEN';
  canDepositAndWithdraw?: boolean;
  canAccessWalletTransactions?: boolean;
  /** When true, PARTNER_PAY_AIRTIME margin credits the partner COMMISSION wallet instead of RukaPay revenue. */
  retainAirtimeMarginInCommissionWallet?: boolean;
  isAggregator?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GatewayPartnerDetails extends GatewayPartner {
  apiKeys: Array<{
    id: string;
    keyPrefix: string;
    description?: string;
    environment?: string;
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

export type GatewayPartnerTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'AGGREGATOR';

export interface CreateGatewayPartnerRequest {
  partnerName: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  contactPerson?: string;
  partnerType?: string;
  tier?: GatewayPartnerTier;
  isAggregator?: boolean;
  website?: string;
  address?: string;
  description?: string;
  canDepositAndWithdraw?: boolean;
  canAccessWalletTransactions?: boolean;
  /** When true, PARTNER_PAY_AIRTIME margin credits the partner COMMISSION wallet instead of RukaPay revenue. */
  retainAirtimeMarginInCommissionWallet?: boolean;
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
  environment?: 'DEVELOPMENT' | 'PRODUCTION';
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

// Hook: Update partner authentication type
export const useUpdatePartnerAuthType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      partnerId,
      authenticationType,
    }: {
      partnerId: string;
      authenticationType: 'API_KEY_ONLY' | 'API_KEY_AND_TOKEN';
    }) => {
      const response = await api.put(
        `/api/v1/admin/gateway-partners/${partnerId}`,
        { authenticationType },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gateway-partners'] });
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner', variables.partnerId],
      });
      toast.success('Authentication type updated successfully!');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || 'Failed to update authentication type',
      );
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

// Hook: Get partner wallet balance
export const usePartnerWalletBalance = (
  partnerId: string,
  currency = 'UGX',
  walletType: 'ESCROW' | 'COMMISSION' = 'ESCROW',
) => {
  return useQuery({
    queryKey: ['gateway-partner-wallet', partnerId, currency, walletType],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/admin/gateway-partners/wallets/${partnerId}/balance?currency=${currency}&walletType=${walletType}`,
      );
      return response.data;
    },
    enabled: !!partnerId,
    staleTime: 15000,
  });
};

export interface TopUpPartnerWalletRequest {
  partnerId: string;
  amount: number;
  currency?: string;
  walletType?: 'ESCROW' | 'COMMISSION';
  /** Specific wallet UUID when partner has multiple ESCROW wallets */
  walletId?: string;
  reference: string;
  description?: string;
  approvedBy?: string;
}

export interface PartnerWalletListItem {
  id: string;
  walletType: string;
  currency: string;
  balance: number;
  isDefault: boolean;
  isActive: boolean;
  isSuspended: boolean;
  description: string | null;
  createdAt: string;
}

// Hook: List all wallets for a gateway partner
export const usePartnerWallets = (
  partnerId: string,
  walletType?: 'ESCROW' | 'COMMISSION',
) => {
  return useQuery({
    queryKey: ['gateway-partner-wallets', partnerId, walletType || 'ALL'],
    queryFn: async () => {
      const qs = walletType ? `?walletType=${walletType}` : '';
      const response = await api.get(
        `/api/v1/admin/gateway-partners/wallets/${partnerId}${qs}`,
      );
      return response.data as {
        success: boolean;
        partnerId: string;
        partnerName: string;
        wallets: PartnerWalletListItem[];
      };
    },
    enabled: !!partnerId,
    staleTime: 15000,
  });
};

// Hook: Create additional ESCROW wallet under ApiPartner
export const useCreatePartnerEscrowWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      partnerId: string;
      currency?: string;
      description?: string;
    }) => {
      const response = await api.post(
        '/api/v1/admin/gateway-partners/wallets/escrow',
        {
          partnerId: data.partnerId,
          currency: data.currency || 'UGX',
          description: data.description,
        },
      );
      return response.data as {
        success: boolean;
        message: string;
        wallet: PartnerWalletListItem & { partnerId: string };
      };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner-wallets', variables.partnerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner-wallet', variables.partnerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner', variables.partnerId],
      });
      toast.success(
        data?.wallet?.id
          ? `ESCROW wallet created: ${data.wallet.id}`
          : 'ESCROW wallet created',
      );
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to create ESCROW wallet';
      toast.error(message);
    },
  });
};

// Hook: Top up partner wallet
export const useTopUpPartnerWallet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TopUpPartnerWalletRequest) => {
      const response = await api.post(
        '/api/v1/admin/gateway-partners/wallets/top-up',
        {
          ...data,
          currency: data.currency || 'UGX',
          walletType: data.walletType || 'ESCROW',
        },
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner-wallet', variables.partnerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner-wallets', variables.partnerId],
      });
      queryClient.invalidateQueries({
        queryKey: ['gateway-partner', variables.partnerId],
      });
      toast.success('Partner wallet funded successfully!');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to fund partner wallet';
      toast.error(message);
    },
  });
};

