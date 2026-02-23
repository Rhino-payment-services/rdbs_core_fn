import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

export interface OvaAccount {
  id: string
  code: string
  name: string
  partnerId: string
  partnerCode: string
  ovaType: string
  network: string | null
  transactionTypes: string[]
  currency: string
  expectedBalance: number | string
  actualBalance: number | string | null
  actualBalanceUpdatedAt: string | null
  isActive: boolean
  description: string | null
  partner?: { partnerName: string; partnerCode: string }
  createdAt: string
  updatedAt: string
}

export interface OvaAccountMapping {
  id: string
  transactionType: string
  partnerCode: string
  network: string | null
  ovaAccountId: string
  action: string
  isActive: boolean
  ovaAccount?: { id: string; code: string; name: string; partnerCode: string }
  createdAt: string
  updatedAt: string
}

const ovaQueryKeys = {
  accounts: ['ova-accounts'] as const,
  account: (id: string) => ['ova-account', id] as const,
  mappings: ['ova-mappings'] as const,
}

export function useOvaAccounts(filters?: { partnerCode?: string; ovaType?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: [...ovaQueryKeys.accounts, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.partnerCode) params.set('partnerCode', filters.partnerCode)
      if (filters?.ovaType) params.set('ovaType', filters.ovaType)
      if (filters?.isActive !== undefined) params.set('isActive', String(filters.isActive))
      const qs = params.toString()
      const res = await api.get(`/api/v1/admin/ova-accounts${qs ? `?${qs}` : ''}`)
      return res.data as OvaAccount[]
    },
    staleTime: 30000,
  })
}

export function useOvaAccount(id: string | undefined) {
  return useQuery({
    queryKey: ovaQueryKeys.account(id || ''),
    queryFn: async () => {
      const res = await api.get(`/api/v1/admin/ova-accounts/${id}`)
      return res.data as OvaAccount
    },
    enabled: !!id,
    staleTime: 30000,
  })
}

export function useOvaExpectedVsActual(id: string | undefined) {
  return useQuery({
    queryKey: ['ova-expected-vs-actual', id],
    queryFn: async () => {
      const res = await api.get(`/api/v1/admin/ova-accounts/${id}/expected-vs-actual`)
      return res.data as {
        ovaAccountId: string
        code: string
        name: string
        expectedBalance: number
        actualBalance: number | null
        drift: number | null
        actualBalanceUpdatedAt: string | null
      }
    },
    enabled: !!id,
    staleTime: 15000,
  })
}

export function useCreateOvaAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      code: string
      name: string
      partnerId: string
      partnerCode: string
      ovaType: 'COLLECTION' | 'DISBURSEMENT' | 'SINGLE'
      network?: string | null
      transactionTypes: string[]
      currency?: string
      description?: string
    }) => {
      const res = await api.post('/api/v1/admin/ova-accounts', data)
      return res.data as OvaAccount
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ovaQueryKeys.accounts })
      toast.success('OVA account created')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create OVA account')
    },
  })
}

export function useUpdateOvaAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: { name?: string; description?: string; isActive?: boolean }
    }) => {
      const res = await api.patch(`/api/v1/admin/ova-accounts/${id}`, data)
      return res.data as OvaAccount
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ovaQueryKeys.accounts })
      queryClient.invalidateQueries({ queryKey: ovaQueryKeys.account(id) })
      toast.success('OVA account updated')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update OVA account')
    },
  })
}

export function useSetOvaBalance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: { actualBalance?: number; expectedBalance?: number }
    }) => {
      const res = await api.patch(`/api/v1/admin/ova-accounts/${id}/balance`, data)
      return res.data as OvaAccount
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ovaQueryKeys.accounts })
      queryClient.invalidateQueries({ queryKey: ovaQueryKeys.account(id) })
      queryClient.invalidateQueries({ queryKey: ['ova-expected-vs-actual', id] })
      toast.success('Balance updated')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update balance')
    },
  })
}

export function useOvaMappings(filters?: {
  transactionType?: string
  partnerCode?: string
  ovaAccountId?: string
}) {
  return useQuery({
    queryKey: [...ovaQueryKeys.mappings, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.transactionType) params.set('transactionType', filters.transactionType)
      if (filters?.partnerCode) params.set('partnerCode', filters.partnerCode)
      if (filters?.ovaAccountId) params.set('ovaAccountId', filters.ovaAccountId)
      const qs = params.toString()
      const res = await api.get(`/api/v1/admin/ova-account-mappings${qs ? `?${qs}` : ''}`)
      return res.data as OvaAccountMapping[]
    },
    staleTime: 30000,
  })
}

export function useCreateOvaMapping() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      transactionType: string
      partnerCode: string
      network?: string | null
      ovaAccountId: string
      action: 'CREDIT' | 'DEBIT'
    }) => {
      const res = await api.post('/api/v1/admin/ova-account-mappings', data)
      return res.data as OvaAccountMapping
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ovaQueryKeys.mappings })
      toast.success('OVA mapping created')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create OVA mapping')
    },
  })
}

export function useUpdateOvaMapping() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ovaAccountId,
    }: {
      id: string
      ovaAccountId: string
    }) => {
      const res = await api.patch(`/api/v1/admin/ova-account-mappings/${id}`, {
        ovaAccountId,
      })
      return res.data as OvaAccountMapping
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ovaQueryKeys.mappings })
      toast.success('OVA mapping updated')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update OVA mapping')
    },
  })
}

export function useDeleteOvaMapping() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/api/v1/admin/ova-account-mappings/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ovaQueryKeys.mappings })
      toast.success('OVA mapping deactivated')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete OVA mapping')
    },
  })
}
