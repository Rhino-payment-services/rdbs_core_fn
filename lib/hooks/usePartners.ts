import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse, PaginatedResponse } from '@/lib/types/api'

export interface ApiPartner {
  id: string
  partnerName: string
  partnerType: string
  contactEmail: string
  contactPhone: string
  country?: string
  tier: string
  isActive: boolean
  isSuspended: boolean
  createdAt: string
  updatedAt: string
}

interface PartnersResponse {
  success: boolean
  data: ApiPartner[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Generic API wrapper
const apiFetch = async (endpoint: string, options: any = {}) => {
  try {
    const response = await api({
      url: endpoint,
      method: options.method || 'GET',
      data: options.data,
      ...options,
    })
    
    return response.data
  } catch (error: unknown) {
    throw error
  }
}

// Query keys for better cache management
export const partnerQueryKeys = {
  partners: ['api-partners'] as const,
  partner: (id: string) => ['api-partner', id] as const,
}

// Custom hook for API partners (gateway partners)
export const useApiPartners = (filters?: {
  page?: number
  limit?: number
}) => {
  const page = filters?.page || 1
  const limit = filters?.limit || 100 // Get all partners by default
  
  return useQuery<PartnersResponse>({
    queryKey: [...partnerQueryKeys.partners, filters],
    queryFn: async () => {
      console.log('🤝 Fetching API partners from /api/v1/admin/gateway-partners with filters:', { page, limit })
      const result = await apiFetch(`/api/v1/admin/gateway-partners?page=${page}&limit=${limit}`)
      console.log('🤝 API Partners response:', result)
      console.log('🤝 Partners count:', result?.data?.length || 0)
      return result
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    enabled: true, // Always fetch (can be conditionally enabled if needed)
  })
}

// Custom hook to fetch a single partner by ID
export const useApiPartner = (id: string | undefined) => {
  return useQuery<ApiResponse<ApiPartner>>({
    queryKey: partnerQueryKeys.partner(id || ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Partner ID is required')
      }
      console.log('🤝 Fetching single partner from /api/v1/admin/gateway-partners with id:', id)
      // First try to fetch all partners and find the one with matching ID
      // (assuming there's no direct endpoint for single partner)
      const result = await apiFetch(`/api/v1/admin/gateway-partners?page=1&limit=1000`)
      const partner = result?.data?.find((p: ApiPartner) => p.id === id)
      if (!partner) {
        throw new Error('Partner not found')
      }
      return {
        success: true,
        data: partner
      }
    },
    enabled: !!id,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  })
}
