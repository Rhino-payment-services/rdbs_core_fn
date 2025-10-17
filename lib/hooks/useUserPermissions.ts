import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse } from '@/lib/types/api'

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

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

export interface UserPermissions {
  userId: string
  permissions: Permission[]
}

export interface UpdateUserPermissionsRequest {
  permissionIds: string[]
  action: 'add' | 'remove' | 'replace'
}

// Get user permissions
export const useUserPermissions = (userId: string) => {
  return useQuery<UserPermissions>({
    queryKey: ['user-permissions', userId],
    queryFn: () => apiFetch(`/users/${userId}/permissions`),
    enabled: !!userId,
  })
}

// Update user permissions
export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient()
  
  return useMutation<ApiResponse<any>, Error, { userId: string; data: UpdateUserPermissionsRequest }>({
    mutationFn: ({ userId, data }) =>
      apiFetch(`/users/${userId}/permissions`, {
        method: 'PATCH',
        data,
      }),
    onSuccess: (data, variables) => {
      // Invalidate user permissions query
      queryClient.invalidateQueries({ queryKey: ['user-permissions', variables.userId] })
      // Invalidate users list to refresh user data
      queryClient.invalidateQueries({ queryKey: ['users'] })
      // Invalidate current user session to refresh permissions
      queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })
}

// Get all available permissions
export const useAllPermissions = () => {
  return useQuery<Permission[]>({
    queryKey: ['all-permissions'],
    queryFn: () => apiFetch('/permissions'),
  })
}
