"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAssignRole, useRoles, useUsers } from '@/lib/hooks/useApi'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import { extractErrorMessage } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { User, Role } from '@/lib/types/api'

/**
 * Example component demonstrating different error handling approaches
 */
const ErrorHandlingExample = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  const { data: users } = useUsers()
  const { data: roles } = useRoles()
  const assignRole = useAssignRole()
  const { handleError, handleSpecificError, handleApiError } = useErrorHandler()

  // Handle different API response structures
  const usersArray: User[] = Array.isArray(users) ? users : []
  const rolesArray: Role[] = Array.isArray(roles?.roles) ? roles.roles : Array.isArray(roles) ? roles : []

  // Method 1: Using extractErrorMessage directly
  const handleAssignRoleBasic = async () => {
    if (!selectedUser || !selectedRoleId) {
      toast.error('Please select a user and a role')
      return
    }

    setIsAssigning(true)
    try {
      await assignRole.mutateAsync({ 
        userId: selectedUser.id, 
        roleId: selectedRoleId 
      })
      toast.success('Role assigned successfully!')
      setSelectedUser(null)
      setSelectedRoleId('')
    } catch (error: unknown) {
      // This will extract the backend error message like "User already has this role"
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    } finally {
      setIsAssigning(false)
    }
  }

  // Method 2: Using the error handler hook
  const handleAssignRoleWithHook = async () => {
    if (!selectedUser || !selectedRoleId) {
      toast.error('Please select a user and a role')
      return
    }

    setIsAssigning(true)
    try {
      await assignRole.mutateAsync({ 
        userId: selectedUser.id, 
        roleId: selectedRoleId 
      })
      toast.success('Role assigned successfully!')
      setSelectedUser(null)
      setSelectedRoleId('')
    } catch (error: unknown) {
      // Using the error handler hook
      handleError(error, 'Failed to assign role')
    } finally {
      setIsAssigning(false)
    }
  }

  // Method 3: Using specific error handling with custom messages
  const handleAssignRoleWithCustomMessages = async () => {
    if (!selectedUser || !selectedRoleId) {
      toast.error('Please select a user and a role')
      return
    }

    setIsAssigning(true)
    try {
      await assignRole.mutateAsync({ 
        userId: selectedUser.id, 
        roleId: selectedRoleId 
      })
      toast.success('Role assigned successfully!')
      setSelectedUser(null)
      setSelectedRoleId('')
    } catch (error: unknown) {
      // Custom error messages for specific backend errors
      handleSpecificError(error, {
        'User already has this role': 'This user is already assigned to the selected role. Please choose a different role.',
        'User not found': 'The selected user could not be found. Please refresh and try again.',
        'Role not found': 'The selected role could not be found. Please refresh and try again.',
        'Insufficient permissions': 'You do not have permission to assign this role. Please contact an administrator.'
      })
    } finally {
      setIsAssigning(false)
    }
  }

  // Method 4: Using API error handler with retry
  const handleAssignRoleWithRetry = async () => {
    if (!selectedUser || !selectedRoleId) {
      toast.error('Please select a user and a role')
      return
    }

    setIsAssigning(true)
    try {
      await assignRole.mutateAsync({ 
        userId: selectedUser.id, 
        roleId: selectedRoleId 
      })
      toast.success('Role assigned successfully!')
      setSelectedUser(null)
      setSelectedRoleId('')
    } catch (error: unknown) {
      // Using API error handler with retry suggestion
      handleApiError(error, () => {
        // Retry function
        handleAssignRoleWithRetry()
      })
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Error Handling Examples</CardTitle>
          <CardDescription>
            Different approaches to handle backend error messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Selection */}
          <div className="space-y-4">
            <Label>Select User</Label>
            <Select onValueChange={(value) => {
              const user = usersArray.find(u => u.id === value)
              setSelectedUser(user || null)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {usersArray.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <Label>Select Role</Label>
            <Select onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {rolesArray.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error Handling Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Method 1: Basic Error Extraction</h3>
              <p className="text-sm text-gray-600">
                Uses extractErrorMessage directly to show backend error messages
              </p>
              <Button 
                onClick={handleAssignRoleBasic}
                disabled={isAssigning || !selectedUser || !selectedRoleId}
                variant="outline"
                className="w-full"
              >
                {isAssigning ? 'Assigning...' : 'Assign Role (Basic)'}
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Method 2: Error Handler Hook</h3>
              <p className="text-sm text-gray-600">
                Uses the useErrorHandler hook for consistent error handling
              </p>
              <Button 
                onClick={handleAssignRoleWithHook}
                disabled={isAssigning || !selectedUser || !selectedRoleId}
                variant="outline"
                className="w-full"
              >
                {isAssigning ? 'Assigning...' : 'Assign Role (Hook)'}
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Method 3: Custom Error Messages</h3>
              <p className="text-sm text-gray-600">
                Maps specific backend errors to user-friendly messages
              </p>
              <Button 
                onClick={handleAssignRoleWithCustomMessages}
                disabled={isAssigning || !selectedUser || !selectedRoleId}
                variant="outline"
                className="w-full"
              >
                {isAssigning ? 'Assigning...' : 'Assign Role (Custom)'}
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Method 4: API Error with Retry</h3>
              <p className="text-sm text-gray-600">
                Shows error with retry suggestion for network issues
              </p>
              <Button 
                onClick={handleAssignRoleWithRetry}
                disabled={isAssigning || !selectedUser || !selectedRoleId}
                variant="outline"
                className="w-full"
              >
                {isAssigning ? 'Assigning...' : 'Assign Role (Retry)'}
              </Button>
            </div>
          </div>

          {/* Error Examples */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Backend Error Examples</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <code>{"{ \"message\": \"User already has this role\", \"error\": \"Conflict\", \"statusCode\": 409 }"}</code></p>
              <p>• <code>{"{ \"message\": \"User not found\", \"error\": \"Not Found\", \"statusCode\": 404 }"}</code></p>
              <p>• <code>{"{ \"message\": \"Insufficient permissions\", \"error\": \"Forbidden\", \"statusCode\": 403 }"}</code></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ErrorHandlingExample 