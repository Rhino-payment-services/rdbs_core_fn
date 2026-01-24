import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession, signOut } from 'next-auth/react'
import api from '@/lib/axios'
import type { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest,
  ApiResponse,
  PaginatedResponse
} from '@/lib/types/api'

// Generic API wrapper using centralized Axios instance
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
    // Error is already handled by Axios interceptors
    throw error
  }
}

// Query keys for better cache management
export const authQueryKeys = {
  users: ['users'] as const,
  user: (id: string) => ['user', id] as const,
  profile: ['profile', 'me'] as const,
}

// Custom hooks for users
export const useUsers = () => {
  return useQuery({
    queryKey: authQueryKeys.users,
    queryFn: async () => {
      console.log('🔍 Fetching users from /users?include=profile')
      const result = await apiFetch('/users?include=profile')
      console.log('📊 Raw API Response:', result)
      console.log('📊 Response type:', typeof result, Array.isArray(result) ? 'array' : 'object')
      
      // Log first merchant user with full detail
      const users = Array.isArray(result) ? result : (result?.data || [])
      console.log(`📊 Processed ${users.length} users`)
      
      // ✅ Updated: Check for merchants array instead of merchantCode
      const merchantUser = users.find((u: any) => u.merchants && u.merchants.length > 0)
      if (merchantUser) {
        console.log('🏢 Merchant user found:', {
          email: merchantUser.email,
          merchants: merchantUser.merchants,
          merchantCodes: merchantUser.merchants?.map((m: any) => m.merchantCode).join(', '),
          canHaveWallet: merchantUser.canHaveWallet,
          hasMerchants: !!(merchantUser.merchants && merchantUser.merchants.length > 0),
          merchantKeys: merchantUser.merchant ? Object.keys(merchantUser.merchant) : []
        })
        if (merchantUser.merchant) {
          console.log('🏢 Merchant object:', merchantUser.merchant)
        } else {
          console.log('❌ No merchant object in response!')
        }
      }
      
      return result
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

export const useUser = (id: string) => {
  return useQuery<ApiResponse<User>>({
    queryKey: authQueryKeys.user(id),
    queryFn: () => apiFetch(`/users/${id}`),
    enabled: !!id,
  })
}

// Hook to get current user profile
export const useProfile = () => {
  return useQuery<ApiResponse<User>>({
    queryKey: authQueryKeys.profile,
    queryFn: async () => {
      console.log('🔍 Fetching profile from /users/me')
      const result = await apiFetch('/users/me')
      console.log('📊 API Response:', result)
      return result
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Mutation hooks
export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<any>, Error, CreateUserRequest>({
    mutationFn: (userData) => apiFetch('/admin/users', {
      method: 'POST',
      data: userData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.users })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<User>, Error, { id: string; userData: UpdateUserRequest }>({
    mutationFn: ({ id, userData }) => 
      apiFetch(`/users/${id}`, {
        method: 'PUT',
        data: userData,
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.users })
      queryClient.invalidateQueries({ queryKey: authQueryKeys.user(id) })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<void>, Error, string>({
    mutationFn: (id) => apiFetch(`/users/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.users })
      queryClient.removeQueries({ queryKey: authQueryKeys.user(id) })
    },
  })
}

// Email sending hooks
export const useSendWelcomeEmail = () => {
  return useMutation<ApiResponse<any>, Error, {
    email: string;
    userName: string;
    userId: string;
    metadata?: {
      channel?: string;
      referralCode?: string;
    };
  }>({
    mutationFn: (emailData) => apiFetch('/mail/send-welcome', {
      method: 'POST',
      data: emailData,
    }),
  })
}

// Set password hook
export const useSetPassword = () => {
  return useMutation<ApiResponse<any>, Error, {
    token: string;
    newPassword: string;
    confirmPassword: string;
  }>({
    mutationFn: (passwordData) => apiFetch('/auth/set-password', {
      method: 'POST',
      data: passwordData,
    }),
  })
}

// Forgot password hook
export const useForgotPassword = () => {
  return useMutation<ApiResponse<any>, Error, {
    email: string;
  }>({
    mutationFn: (emailData) => apiFetch('/auth/forgot-password', {
      method: 'POST',
      data: emailData,
    }),
  })
}

// Main useAuth hook for session management
export const useAuth = () => {
  const { data: session, status } = useSession()

  const logout = async () => {
    await signOut({ 
      redirect: true, 
      callbackUrl: '/auth/login' 
    })
  }

  return {
    user: session?.user || null,
    logout,
    isLoading: status === 'loading',
    isAuthenticated: !!session?.user,
    session
  }
}