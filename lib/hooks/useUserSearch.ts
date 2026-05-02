import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { normalizePhoneForSearch } from '@/lib/utils'

export interface UserSearchResult {
  id: string
  phone: string
  email?: string
  firstName?: string
  lastName?: string
  middleName?: string
  dateOfBirth?: string
  gender?: string
  nationalId?: string
  subscriberType: string
  userType: string
  status: string
  profile?: {
    firstName?: string
    lastName?: string
    middleName?: string
    dateOfBirth?: string
    gender?: string
    nationalId?: string
  }
  merchants?: Array<{ id: string }>
  wallets?: Array<{ id: string }>
}

interface UseUserSearchProps {
  phone?: string
  email?: string
  enabled?: boolean
}

export const useUserSearch = ({ phone, email, enabled = true }: UseUserSearchProps) => {
  const searchByEmail = !!email?.trim()
  const normalizedPhone = phone ? normalizePhoneForSearch(phone) : ''
  const searchKey = searchByEmail ? `email:${email?.trim()}` : `phone:${normalizedPhone}`
  const isValid = searchByEmail ? email!.trim().length > 0 : normalizedPhone.length > 0

  return useQuery({
    queryKey: ['userSearch', searchKey],
    queryFn: async (): Promise<UserSearchResult> => {
      const params = new URLSearchParams()
      if (searchByEmail) {
        params.set('email', email!.trim())
      } else {
        params.set('phone', normalizedPhone)
      }
      const response = await api.get(`/users/search?${params.toString()}`)
      return response.data
    },
    enabled: enabled && isValid,
    retry: false,
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  })
}
