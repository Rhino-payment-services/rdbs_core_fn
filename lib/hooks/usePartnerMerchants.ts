import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export type PartnerMerchantStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'

export interface PartnerMerchantDocument {
  id: string
  partnerMerchantId: string
  documentType: string
  documentUrl?: string | null
  documentNumber?: string | null
  requirement: string
  status: string
  rejectionReason?: string | null
  verifiedBy?: string | null
  verifiedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface PartnerMerchantPartner {
  id: string
  partnerName: string
  partnerType?: string
  contactEmail?: string
}

export interface PartnerMerchant {
  id: string
  merchantId: string
  apiPartnerId: string
  merchantName: string
  industry: string
  contactEmail?: string | null
  contactPhone?: string | null
  contactPerson?: string | null
  status: PartnerMerchantStatus | string
  isBaseMerchant: boolean
  blockedAt?: string | null
  blockedReason?: string | null
  blockedBy?: string | null
  createdAt: string
  updatedAt: string
  documents?: PartnerMerchantDocument[]
  apiPartner?: PartnerMerchantPartner
}

export interface PartnerMerchantListResponse {
  items: PartnerMerchant[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PartnerMerchantTransaction {
  id: string
  type: string
  status: string
  amount: number | string
  currency: string
  fee?: number | string
  netAmount?: number | string
  reference?: string | null
  description?: string | null
  mode?: string | null
  channel?: string | null
  partnerId?: string | null
  partnerMerchantId?: string | null
  createdAt: string
  updatedAt?: string
  processedAt?: string | null
}

export interface PartnerMerchantTransactionsResponse {
  merchant: {
    id: string
    merchantId: string
    merchantName: string
    apiPartnerId: string
    status: string
  }
  items: PartnerMerchantTransaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PartnerMerchantListParams {
  apiPartnerId?: string
  industry?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}

function buildQuery(params: PartnerMerchantListParams = {}) {
  const query = new URLSearchParams()
  if (params.apiPartnerId) query.set('apiPartnerId', params.apiPartnerId)
  if (params.industry) query.set('industry', params.industry)
  if (params.status) query.set('status', params.status)
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  const qs = query.toString()
  return qs ? `?${qs}` : ''
}

export function usePartnerMerchants(params: PartnerMerchantListParams = {}) {
  return useQuery({
    queryKey: ['partner-merchants', params],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/admin/partner-management/merchants${buildQuery(params)}`,
      )
      return response.data as PartnerMerchantListResponse
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function usePartnerMerchant(merchantId: string) {
  return useQuery({
    queryKey: ['partner-merchants', merchantId],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/admin/partner-management/merchants/${encodeURIComponent(merchantId)}`,
      )
      return response.data as PartnerMerchant
    },
    enabled: Boolean(merchantId),
    staleTime: 2 * 60 * 1000,
  })
}

export function usePartnerMerchantTransactions(
  merchantId: string,
  page = 1,
  limit = 20,
) {
  return useQuery({
    queryKey: ['partner-merchants', merchantId, 'transactions', page, limit],
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/admin/partner-management/merchants/${encodeURIComponent(merchantId)}/transactions?page=${page}&limit=${limit}`,
      )
      return response.data as PartnerMerchantTransactionsResponse
    },
    enabled: Boolean(merchantId),
    staleTime: 60 * 1000,
  })
}

export function useBlockPartnerMerchant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      merchantId: string
      blocked: boolean
      reason?: string
    }) => {
      const response = await api.post(
        `/api/v1/admin/partner-management/merchants/${encodeURIComponent(payload.merchantId)}/block`,
        {
          blocked: payload.blocked,
          reason: payload.reason,
        },
      )
      return response.data as PartnerMerchant
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partner-merchants'] })
      queryClient.invalidateQueries({
        queryKey: ['partner-merchants', data.merchantId],
      })
    },
  })
}

export function useUpdatePartnerMerchant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      merchantId: string
      merchantName?: string
      industry?: string
      contactEmail?: string
      contactPhone?: string
      contactPerson?: string
      status?: 'ACTIVE' | 'INACTIVE'
    }) => {
      const { merchantId, ...body } = payload
      const response = await api.patch(
        `/api/v1/admin/partner-management/merchants/${encodeURIComponent(merchantId)}`,
        body,
      )
      return response.data as PartnerMerchant
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['partner-merchants'] })
      queryClient.invalidateQueries({
        queryKey: ['partner-merchants', data.merchantId],
      })
    },
  })
}
