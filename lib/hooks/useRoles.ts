import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { 
  Role, 
  CreateRoleRequest,
  AssignRoleRequest,
  PermissionsResponse,
  ApiResponse
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
export const roleQueryKeys = {
  roles: ['roles'] as const,
  permissions: ['permissions'] as const,
}

// Hook to get roles
export const useRoles = () => {
  return useQuery<{ roles: Role[] }>({
    queryKey: roleQueryKeys.roles,
    queryFn: () => apiFetch('/roles'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook to get permissions
export const usePermissions = () => {
  return useQuery<PermissionsResponse>({
    queryKey: roleQueryKeys.permissions,
    queryFn: () => apiFetch('/roles/permissions'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook to create role
export const useCreateRole = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Role>, Error, CreateRoleRequest>({
    mutationFn: (roleData) => apiFetch('/roles', {
      method: 'POST',
      data: roleData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles })
    },
  })
}

// Hook to update role
export const useUpdateRole = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Role>, Error, { id: string; roleData: any }>({
    mutationFn: ({ id, roleData }) => apiFetch(`/roles/${id}`, {
      method: 'PUT',
      data: roleData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles })
    },
  })
}

// Hook to delete role
export const useDeleteRole = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<void>, Error, string>({
    mutationFn: (id) => apiFetch(`/roles/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles })
    },
  })
}

// Hook to assign role to user
export const useAssignRole = () => {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Role>, Error, AssignRoleRequest>({
    mutationFn: (roleData) => apiFetch('/roles/assign', {
      method: 'POST',
      data: roleData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: roleQueryKeys.roles })
    },
  })
}

// Hook to update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      apiFetch(`/users/${userId}/role`, {
        method: 'PATCH',
        data: { roleId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Hook to remove role from user
export const useRemoveRole = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      apiFetch(`/roles/remove/${userId}/${roleId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Hook to assign permissions to user
export const useAssignPermissions = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      apiFetch(`/users/${userId}/permissions`, {
        method: 'PUT',
        data: { permissions },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
