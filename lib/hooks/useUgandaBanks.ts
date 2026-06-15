import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import { UGANDA_BANKS } from '@/lib/constants/ugandaBanks'
import type { UgandanBank } from '@/lib/types/api'

const BANKS_QUERY_KEY = ['uganda-banks'] as const
const BANK_ROUTING_PARTNER_CODES = ['ABC', 'PEGASUS', 'ETRANZACT'] as const

function fallbackBanksFromStatic(): UgandanBank[] {
  const seen = new Set<string>()
  return UGANDA_BANKS.filter((b) => {
    if (seen.has(b.code)) return false
    seen.add(b.code)
    return true
  }).map((b, index) => ({
    id: `fallback-${b.code}-${index}`,
    bankName: b.name,
    bankSortCode: b.code,
    country: 'UG',
    isActive: true,
    partner: null,
    mappingId: null,
    isRoutable: true,
  }))
}

function normalizeBanksResponse(data: unknown): UgandanBank[] {
  if (Array.isArray(data)) return data as UgandanBank[]
  if (data && typeof data === 'object') {
    const wrapped = data as Record<string, unknown>
    if (Array.isArray(wrapped.data)) return wrapped.data as UgandanBank[]
    if (Array.isArray(wrapped.banks)) return wrapped.banks as UgandanBank[]
  }
  return []
}

export function useUgandaBanks(options?: { country?: string; enabled?: boolean }) {
  const country = options?.country ?? 'UG'
  return useQuery<UgandanBank[]>({
    queryKey: [...BANKS_QUERY_KEY, country],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/external-payment-partners/banks', {
          params: { country },
        })
        const banks = normalizeBanksResponse(response.data)
        if (banks.length > 0) return banks
        return fallbackBanksFromStatic()
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status === 404 || status === 401) {
          return fallbackBanksFromStatic()
        }
        throw error
      }
    },
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useBankRoutingPartners() {
  return useQuery({
    queryKey: ['external-payment-partners', 'bank-routing'],
    queryFn: async () => {
      const response = await api.get('/admin/external-payment-partners')
      const raw = Array.isArray(response.data) ? response.data : []
      return raw.filter(
        (p: {
          partnerCode?: string
          isActive?: boolean
          isSuspended?: boolean
        }) =>
          BANK_ROUTING_PARTNER_CODES.includes(
            String(p.partnerCode || '').toUpperCase() as (typeof BANK_ROUTING_PARTNER_CODES)[number],
          ) &&
          p.isActive !== false &&
          p.isSuspended !== true,
      )
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useBankPartnerMappingMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: BANKS_QUERY_KEY })
  }

  const assignMapping = useMutation({
    mutationFn: async ({
      bankId,
      partnerId,
      isUpdate,
    }: {
      bankId: string
      partnerId: string
      isUpdate: boolean
    }) => {
      const url = `/admin/external-payment-partners/banks/${bankId}/partner-mapping`
      const method = isUpdate ? 'put' : 'post'
      const response = await api[method](url, { partnerId })
      return response.data
    },
    onSuccess: () => {
      invalidate()
      toast.success('Bank partner mapping saved')
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save bank partner mapping'
      toast.error(message)
    },
  })

  const removeMapping = useMutation({
    mutationFn: async (bankId: string) => {
      const response = await api.delete(
        `/admin/external-payment-partners/banks/${bankId}/partner-mapping`,
      )
      return response.data
    },
    onSuccess: () => {
      invalidate()
      toast.success('Bank partner mapping removed')
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to remove bank partner mapping'
      toast.error(message)
    },
  })

  return { assignMapping, removeMapping }
}

export { BANK_ROUTING_PARTNER_CODES }
