import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface SaccoWallet {
  id: string
  walletType: string
  balance: number | string
  currency: string
}

export interface SaccoPartner {
  id: string
  partnerName: string
  partnerType: string
}

export interface SaccoOwner {
  id: string
  email?: string | null
  phone?: string | null
  profile?: {
    firstName?: string | null
    lastName?: string | null
  } | null
}

export interface Sacco {
  id: string
  apiPartnerId: string
  code: string
  name: string
  externalOrgId?: string | null
  licenseNumber?: string | null
  status: string
  settlementMode: string
  metadata?: Record<string, unknown> | null
  ownerUserId?: string | null
  createdAt: string
  updatedAt: string
  totalCollectedBalance: number
  balanceCurrency: string
  _count: {
    members: number
  }
  wallets: SaccoWallet[]
  apiPartner?: SaccoPartner
  owner?: SaccoOwner | null
}

export function useSaccos(apiPartnerId?: string) {
  return useQuery({
    queryKey: ['saccos', apiPartnerId ?? 'all'],
    queryFn: async () => {
      const params = apiPartnerId ? `?apiPartnerId=${encodeURIComponent(apiPartnerId)}` : ''
      const response = await api.get(`/api/v1/admin/partner-management/saccos${params}`)
      return (response.data ?? []) as Sacco[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useSacco(institutionId: string) {
  return useQuery({
    queryKey: ['saccos', institutionId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/admin/partner-management/saccos/${institutionId}`)
      return response.data as Sacco
    },
    enabled: Boolean(institutionId),
    staleTime: 2 * 60 * 1000,
  })
}
