"use client"
import React, { useState } from 'react'
import { useProfile } from '@/lib/hooks/useApi'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'
import Navbar from '@/components/dashboard/Navbar'
import api from '@/lib/axios'
import type { User } from '@/lib/types/api'
import { PasswordChangeForm } from '@/components/dashboard/profile/PasswordChangeForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  User as UserIcon, 
  AlertCircle
} from 'lucide-react'

const ProfilePage = () => {
  const { data: profile, isLoading, error } = useProfile()
  const { data: session } = useSession()
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Get user data from profile response
  const user = profile || session?.user as User
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [isLoadingAction, setIsLoadingAction] = useState(false)

  const handleSavePassword = async () => {
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    // Validate password strength
    const passwordValidation = {
      minLength: passwordData.newPassword.length >= 8,
      hasUppercase: /[A-Z]/.test(passwordData.newPassword),
      hasLowercase: /[a-z]/.test(passwordData.newPassword),
      hasNumber: /\d/.test(passwordData.newPassword),
    }

    if (!passwordValidation.minLength || !passwordValidation.hasUppercase || 
        !passwordValidation.hasLowercase || !passwordValidation.hasNumber) {
      toast.error('Password must be at least 8 characters with uppercase, lowercase, and number')
      return
    }

    setIsLoadingAction(true)
    try {
      const response = await api.patch('/users/me/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      if (response.data.message) {
        toast.success('Password updated successfully!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast.error('Failed to update password')
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      if (errorMessage.includes('Current password is incorrect')) {
        toast.error('Current password is incorrect')
      } else if (errorMessage.includes('does not have a password set')) {
        toast.error('Password change is not available for your account type')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoadingAction(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading profile...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center text-red-600">
                <AlertCircle className="h-8 w-8 mr-2" />
                <h3 className="text-sm font-medium text-red-800">Error loading profile</h3>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Don't render if user data is not available or doesn't have profile
  if (!user || !('profile' in user) || !user.profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center text-yellow-600">
                <AlertCircle className="h-8 w-8 mr-2" />
                <h3 className="text-sm font-medium text-yellow-800">No profile data available</h3>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'verified':
        return <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>
    }
  }

  const getUserTypeBadge = (userType: string) => {
    const colors = {
      'SUBSCRIBER': 'bg-purple-100 text-purple-800',
      'MERCHANT': 'bg-blue-100 text-blue-800',
      'PARTNER': 'bg-green-100 text-green-800',
      'AGENT': 'bg-orange-100 text-orange-800',
      'STAFF': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={colors[userType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {userType?.replace('_', ' ') || 'Unknown'}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account settings</p>
        </div>

        <div className="space-y-8">
          {/* Personal Information - Read Only */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your personal details (read-only)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xl font-medium text-gray-600">
                      {user.profile.firstName?.[0]}{user.profile.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{user.profile.firstName} {user.profile.lastName}</h3>
                    <p className="text-sm text-gray-500">ID: {user.id.slice(-8)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(user.status)}
                      {getUserTypeBadge(user.userType)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-sm text-gray-900">{user.profile.firstName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-sm text-gray-900">{user.profile.lastName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{user.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm text-gray-900">{user.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-sm text-gray-900">{user.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Country</label>
                  <p className="text-sm text-gray-900">{user.profile.country || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <PasswordChangeForm
            formData={passwordData}
            onFormDataChange={setPasswordData}
            onSave={handleSavePassword}
            onCancel={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
            isLoading={isLoadingAction}
            showPasswords={showPasswords}
            onTogglePasswordVisibility={togglePasswordVisibility}
          />
        </div>
      </div>
    </div>
  )
}

export default ProfilePage 
