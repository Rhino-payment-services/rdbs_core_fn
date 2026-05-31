import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export type DuplicateWalletSummary = {
  id: string
  walletType: string
  balance: number
  currency: string
  isActive: boolean
  isSuspended: boolean
}

export type DuplicateAccountSummary = {
  id: string
  email: string | null
  phone: string | null
  userType: string
  status: string
  createdAt: string
  name: string | null
  wallets: DuplicateWalletSummary[]
}

export type DuplicatePhoneGroup = {
  canonicalPhone: string
  accountCount: number
  accounts: DuplicateAccountSummary[]
}

type DuplicatePhonesResponse = {
  total: number
  limit: number
  offset: number
  groups: DuplicatePhoneGroup[]
}

const duplicatePhonesKey = ['admin', 'duplicate-phones'] as const

export function useDuplicatePhoneGroups(limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...duplicatePhonesKey, limit, offset],
    queryFn: async () => {
      const { data } = await api.get<DuplicatePhonesResponse>(
        `/admin/users/duplicate-phones?limit=${limit}&offset=${offset}`,
      )
      return data
    },
  })
}

export function useDeactivateWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ walletId, reason }: { walletId: string; reason?: string }) => {
      const { data } = await api.post(`/admin/wallets/${walletId}/deactivate`, { reason })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: duplicatePhonesKey })
    },
  })
}

export function useGrantStaffAccess() {
  return useMutation({
    mutationFn: async (payload: {
      existingUserId: string
      email: string
      firstName?: string
      lastName?: string
      department?: string
      position?: string
      country?: string
    }) => {
      const { data } = await api.post('/admin/users/grant-staff-access', payload)
      return data
    },
  })
}
