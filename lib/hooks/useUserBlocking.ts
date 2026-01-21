"use client"

import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../axios'
import toast from 'react-hot-toast'

interface BlockUserRequest {
  userId: string
  reason: string
  notifyUser?: boolean
}

interface UnblockUserRequest {
  userId: string
  reason?: string
}

// Block a user
async function blockUser({ userId, reason, notifyUser = false }: BlockUserRequest) {
  try {
    // Backend endpoint: PATCH /admin/users/:id/status
    // Only accepts { status: string } in body
    const response = await api.patch(`/admin/users/${userId}/status`, {
      status: 'SUSPENDED'
    })
    
    // Log reason for audit purposes (if activity logging endpoint exists)
    if (reason) {
      try {
        await api.post('/activity-logs', {
          action: 'USER_BLOCKED',
          category: 'SECURITY',
          description: `User ${userId} blocked. Reason: ${reason}`,
          metadata: { reason, notifyUser }
        }).catch(() => {
          // Silently fail if activity logging is not available
        })
      } catch {
        // Activity logging is optional
      }
    }
    
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to block user')
  }
}

// Unblock a user
async function unblockUser({ userId, reason }: UnblockUserRequest) {
  try {
    // Backend endpoint: PATCH /admin/users/:id/status
    // Only accepts { status: string } in body
    const response = await api.patch(`/admin/users/${userId}/status`, {
      status: 'ACTIVE'
    })
    
    // Log reason for audit purposes (if activity logging endpoint exists)
    const unblockReason = reason || 'Account restored by administrator'
    try {
      await api.post('/activity-logs', {
        action: 'USER_UNBLOCKED',
        category: 'SECURITY',
        description: `User ${userId} unblocked. Reason: ${unblockReason}`,
        metadata: { reason: unblockReason }
      }).catch(() => {
        // Silently fail if activity logging is not available
      })
    } catch {
      // Activity logging is optional
    }
    
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to unblock user')
  }
}

// Hook to block a user
export function useBlockUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: blockUser,
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['suspicious-users'] })
      queryClient.invalidateQueries({ queryKey: ['security-stats'] })
      queryClient.invalidateQueries({ queryKey: ['userSearch'] })
      
      toast.success(`User blocked successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to block user')
    }
  })
}

// Hook to unblock a user
export function useUnblockUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: unblockUser,
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['suspicious-users'] })
      queryClient.invalidateQueries({ queryKey: ['security-stats'] })
      queryClient.invalidateQueries({ queryKey: ['userSearch'] })
      
      toast.success(`User unblocked successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unblock user')
    }
  })
}
