import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

interface User {
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
}

interface UseUserSearchProps {
  phone: string
  enabled?: boolean
}

export const useUserSearch = ({ phone, enabled = true }: UseUserSearchProps) => {
  return useQuery({
    queryKey: ['userSearch', phone],
    queryFn: async (): Promise<User> => {
      const response = await api.get(`/users/search?phone=${encodeURIComponent(phone)}`)
      return response.data
    },
    enabled: enabled && phone.length > 0,
    retry: false,
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  })
}
