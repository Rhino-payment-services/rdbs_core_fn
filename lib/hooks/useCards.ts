import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse } from '@/lib/types/api'

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
  } catch (error: any) {
    // Re-throw the error with the response data for better error messages
    if (error?.response?.data) {
      throw new Error(error.response.data.message || 'Request failed')
    }
    throw error
  }
}

// Card Types
export interface Card {
  id: string
  userId: string | null
  serialNumber: string
  cardLast4: string
  expiryMonth: string
  expiryYear: string
  cardHolderName: string | null
  cardType: 'PHYSICAL' | 'VIRTUAL'
  cardTier: 'STANDARD' | 'PREMIUM' | 'GOLD' | 'PLATINUM'
  status: 'INACTIVE' | 'ACTIVE' | 'BLOCKED' | 'EXPIRED' | 'LOST' | 'STOLEN'
  isDefault: boolean
  activatedAt: string | null
  isLocked: boolean
  lastUsedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateSystemCardRequest {
  serialNumber: string
  cardLast4: string
  expiryMonth: string
  expiryYear: string
  cardType: 'PHYSICAL' | 'VIRTUAL'
  cardTier: 'STANDARD' | 'PREMIUM' | 'GOLD' | 'PLATINUM'
  partnerCode?: string
  externalId?: string
}

export interface LinkCardToUserRequest {
  serialNumber: string
  userId: string
  walletId: string
}

export interface ActivateCardRequest {
  activatedBy: string
}

export interface UpdateCardStatusRequest {
  status: 'BLOCKED' | 'UNBLOCKED'
}

export interface ChangeCardTierRequest {
  cardTier: 'STANDARD' | 'PREMIUM' | 'GOLD' | 'PLATINUM'
}

export interface CardWithUser extends Card {
  user: {
    id: string
    email: string
    phone: string
    name: string
    walletBalance: number
    walletCurrency: string
  } | null
}

// Query keys
export const cardQueryKeys = {
  cards: ['cards'] as const,
  card: (id: string) => ['card', id] as const,
  cardBySerial: (serial: string) => ['card', 'serial', serial] as const,
}

// Card Hooks
export const useCards = () => {
  return useQuery<ApiResponse<Card[]>>({
    queryKey: cardQueryKeys.cards,
    queryFn: () => apiFetch('/cards'),
    staleTime: 2 * 60 * 1000,
  })
}

export const useCard = (id: string) => {
  return useQuery<ApiResponse<Card>>({
    queryKey: cardQueryKeys.card(id),
    queryFn: () => apiFetch(`/cards/${id}`),
    enabled: !!id,
  })
}

export const useCardBySerial = (serialNumber: string) => {
  return useQuery<ApiResponse<CardWithUser>>({
    queryKey: cardQueryKeys.cardBySerial(serialNumber),
    queryFn: () => apiFetch(`/cards/serial/${serialNumber}`),
    enabled: !!serialNumber,
  })
}

// Mutations
export const useCreateSystemCard = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Card>, Error, CreateSystemCardRequest>({
    mutationFn: (data) => apiFetch('/cards/register', {
      method: 'POST',
      data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards })
    },
  })
}

export const useLinkCardToUser = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Card>, Error, LinkCardToUserRequest>({
    mutationFn: (data) => apiFetch('/cards/link', {
      method: 'POST',
      data,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards })
    },
  })
}

export const useUpdateCardStatus = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Card>, Error, { cardId: string; data: UpdateCardStatusRequest }>({
    mutationFn: ({ cardId, data }) => apiFetch(`/cards/${cardId}/status`, {
      method: 'PATCH',
      data,
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards })
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.card(variables.cardId) })
    },
  })
}

export const useActivateCard = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Card>, Error, { cardId: string; data: ActivateCardRequest }>({
    mutationFn: ({ cardId, data }) => apiFetch(`/cards/${cardId}/activate`, {
      method: 'POST',
      data,
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards })
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.card(variables.cardId) })
    },
  })
}

export const useChangeCardTier = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Card>, Error, { cardId: string; data: ChangeCardTierRequest }>({
    mutationFn: ({ cardId, data }) => apiFetch(`/cards/${cardId}/tier`, {
      method: 'PATCH',
      data,
    }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.cards })
      queryClient.invalidateQueries({ queryKey: cardQueryKeys.card(variables.cardId) })
    },
  })
}

