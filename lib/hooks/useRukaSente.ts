import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export type RukaSenteExistsResponse = {
  exists: boolean
  customer?: {
    id: string
    full_name: string
    phone: string
    email?: string
    kyc_status?: string
    status?: string
  } | null
}

export function useRukaSenteStatus(userId?: string, enabled = true) {
  return useQuery({
    queryKey: ['rukasente-status', userId],
    enabled: Boolean(userId) && enabled,
    queryFn: async () => {
      const { data } = await api.get(`/admin/users/${userId}/rukasente/status`)
      return data as {
        success: boolean
        data: RukaSenteExistsResponse
        configured?: boolean
      }
    },
    retry: false,
  })
}

export function useLinkRukaSente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post(
        `/admin/users/${userId}/rukasente/link`,
        {},
        { timeout: 30000 },
      )
      return data
    },
    onSuccess: (_data, userId) => {
      void qc.invalidateQueries({ queryKey: ['rukasente-status', userId] })
    },
  })
}
