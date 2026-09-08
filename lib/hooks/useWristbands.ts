import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse } from '@/lib/types/api'

const apiFetch = async (endpoint: string, options: Record<string, unknown> = {}) => {
  try {
    const response = await api({
      url: endpoint,
      method: (options.method as string) || 'GET',
      data: options.data,
      ...options,
    })
    return response.data
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    if (err?.response?.data) {
      throw new Error(err.response.data.message || 'Request failed')
    }
    throw error
  }
}

export type WristbandStatus =
  | 'INACTIVE'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'LOST'
  | 'STOLEN'

export interface Wristband {
  id: string
  userId: string | null
  walletId: string | null
  serialNumber: string
  status: WristbandStatus
  nickname: string | null
  activatedAt: string | null
  linkedAt: string | null
  unlinkedAt: string | null
  lastUsedAt: string | null
  isLocked: boolean
  createdAt: string
  updatedAt: string
}

export interface WristbandWithUser extends Wristband {
  user: {
    id: string
    email: string | null
    phone: string | null
    name: string
  } | null
  wallet?: {
    id: string
    walletType: string
    currency: string
    walletPinEnabled: boolean
    walletUsername?: string | null
    publicWalletId?: string | null
  } | null
}

export interface RegisterWristbandRequest {
  serialNumber: string
  nickname?: string
}

export interface LinkWristbandToUserRequest {
  serialNumber: string
  userId: string
  walletId: string
}

export interface UpdateWristbandStatusRequest {
  status: WristbandStatus
}

export const wristbandQueryKeys = {
  wristbands: ['wristbands'] as const,
  wristbandBySerial: (serial: string) => ['wristband', 'serial', serial] as const,
}

export const useWristbands = () => {
  return useQuery<ApiResponse<WristbandWithUser[]>>({
    queryKey: wristbandQueryKeys.wristbands,
    queryFn: () => apiFetch('/wristbands'),
    staleTime: 2 * 60 * 1000,
  })
}

export const useWristbandBySerial = (serialNumber: string) => {
  return useQuery({
    queryKey: wristbandQueryKeys.wristbandBySerial(serialNumber),
    queryFn: () => apiFetch(`/wristbands/serial/${encodeURIComponent(serialNumber)}`),
    enabled: !!serialNumber,
  })
}

export const useRegisterWristband = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Wristband>, Error, RegisterWristbandRequest>({
    mutationFn: (data) =>
      apiFetch('/wristbands/register', {
        method: 'POST',
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wristbandQueryKeys.wristbands })
    },
  })
}

export const useLinkWristbandToUser = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Wristband>, Error, LinkWristbandToUserRequest>({
    mutationFn: (data) =>
      apiFetch('/wristbands/link', {
        method: 'POST',
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wristbandQueryKeys.wristbands })
    },
  })
}

export const useUpdateWristbandStatus = () => {
  const queryClient = useQueryClient()
  return useMutation<
    ApiResponse<Wristband>,
    Error,
    { wristbandId: string; data: UpdateWristbandStatusRequest }
  >({
    mutationFn: ({ wristbandId, data }) =>
      apiFetch(`/wristbands/${wristbandId}/status`, {
        method: 'PATCH',
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wristbandQueryKeys.wristbands })
    },
  })
}

export const useActivateWristband = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Wristband>, Error, string>({
    mutationFn: (wristbandId) =>
      apiFetch(`/wristbands/${wristbandId}/activate`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wristbandQueryKeys.wristbands })
    },
  })
}

export const useUnlinkWristband = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Wristband>, Error, string>({
    mutationFn: (wristbandId) =>
      apiFetch(`/wristbands/${wristbandId}/unlink`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wristbandQueryKeys.wristbands })
    },
  })
}
