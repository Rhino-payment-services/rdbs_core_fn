import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

const apiFetch = async (endpoint: string, options: Record<string, unknown> = {}) => {
  const response = await api({
    url: endpoint,
    method: (options.method as string) || 'GET',
    data: options.data,
    ...options,
  })
  return response.data
}

export interface WalletPinStatus {
  hasPin: boolean
  pinEnabled: boolean
  failedAttempts: number
  maxAttempts: number
  isLocked: boolean
  lockExpiresAt?: string
  nextAttemptIn: number
}

export const walletPinQueryKeys = {
  status: (walletId: string) => ['wallet-pin-status', walletId] as const,
}

export const useWalletPinStatus = (walletId?: string) => {
  return useQuery<WalletPinStatus>({
    queryKey: walletPinQueryKeys.status(walletId || ''),
    queryFn: async () => {
      const raw = await apiFetch(`/wallets/admin/${walletId}/pin/status`)
      return (raw as { data?: WalletPinStatus })?.data ?? raw
    },
    enabled: !!walletId,
  })
}

export const useAdminSetupWalletPin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      walletId,
      newPin,
      confirmPin,
    }: {
      walletId: string
      newPin: string
      confirmPin: string
    }) =>
      apiFetch(`/wallets/admin/${walletId}/pin/setup`, {
        method: 'POST',
        data: { newPin, confirmPin },
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: walletPinQueryKeys.status(variables.walletId),
      })
    },
  })
}
