"use client"
import React, { useState } from 'react'
import { useProfile } from '@/lib/hooks/useApi'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'
import Navbar from '@/components/dashboard/Navbar'
import api from '@/lib/axios'
import type { User } from '@/lib/types/api'
import { PersonalInfoForm } from '@/components/dashboard/profile/PersonalInfoForm'
import { PasswordChangeForm } from '@/components/dashboard/profile/PasswordChangeForm'
import { PreferencesForm } from '@/components/dashboard/profile/PreferencesForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  User as UserIcon, 
  Key, 
  Bell, 
  Save,
  X,
  AlertCircle
} from 'lucide-react'

const ProfilePage = () => {
  const { data: profile, isLoading, error } = useProfile()
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Get user data from profile response
  const user = profile?.data || session?.user
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    country: 'UG',
    bio: ''
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    twoFactorAuth: false,
    language: 'en',
    timezone: 'Africa/Kampala',
    theme: 'light'
  })


  const [isLoadingAction, setIsLoadingAction] = useState(false)

  // Initialize form data when user data is available
  React.useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        firstName: (user as any)?.firstName || (user as any)?.profile?.firstName || '',
        lastName: (user as any)?.lastName || (user as any)?.profile?.lastName || '',
        middleName: (user as any)?.middleName || (user as any)?.profile?.middleName || '',
        phone: user.phone || '',
        dateOfBirth: (user as any)?.dateOfBirth || (user as any)?.profile?.dateOfBirth || '',
        gender: (user as any)?.gender || (user as any)?.profile?.gender || '',
        address: (user as any)?.address || (user as any)?.profile?.address || '',
        city: (user as any)?.city || (user as any)?.profile?.city || '',
        country: (user as any)?.country || (user as any)?.profile?.country || 'UG',
        bio: (user as any)?.bio || (user as any)?.profile?.bio || ''
      })
    }
  }, [user])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to original values
    if (user) {
      setFormData({
        email: user.email || '',
        firstName: (user as any)?.firstName || (user as any)?.profile?.firstName || '',
        lastName: (user as any)?.lastName || (user as any)?.profile?.lastName || '',
        middleName: (user as any)?.middleName || (user as any)?.profile?.middleName || '',
        phone: user.phone || '',
        dateOfBirth: (user as any)?.dateOfBirth || (user as any)?.profile?.dateOfBirth || '',
        gender: (user as any)?.gender || (user as any)?.profile?.gender || '',
        address: (user as any)?.address || (user as any)?.profile?.address || '',
        city: (user as any)?.city || (user as any)?.profile?.city || '',
        country: (user as any)?.country || (user as any)?.profile?.country || 'UG',
        bio: (user as any)?.bio || (user as any)?.profile?.bio || ''
      })
    }
  }

  const handleSaveProfile = async () => {
    setIsLoadingAction(true)
    try {
      const response = await api.put('/profile', formData)
      if (response.data.success) {
        toast.success('Profile updated successfully!')
        setIsEditing(false)
      } else {
        toast.error(response.data.message || 'Failed to update profile')
      }
    } catch (error) {
      toast.error(extractErrorMessage(error))
    } finally {
      setIsLoadingAction(false)
    }
  }

  const handleSavePassword = async () => {
    setIsLoadingAction(true)
    try {
      const response = await api.put('/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      if (response.data.success) {
      toast.success('Password updated successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      } else {
        toast.error(response.data.message || 'Failed to update password')
      }
    } catch (error) {
      toast.error(extractErrorMessage(error))
    } finally {
      setIsLoadingAction(false)
    }
  }

  const handleSavePreferences = async () => {
    setIsLoadingAction(true)
    try {
      const response = await api.put('/profile/preferences', preferences)
      if (response.data.success) {
        toast.success('Preferences updated successfully!')
      } else {
        toast.error(response.data.message || 'Failed to update preferences')
      }
    } catch (error) {
      toast.error(extractErrorMessage(error))
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

        <div className="space-y-8">
                {/* Personal Information */}
          {user && (
            <PersonalInfoForm
              user={user as any}
              isEditing={isEditing}
              formData={formData}
              onFormDataChange={setFormData}
              onEdit={handleEdit}
              onSave={handleSaveProfile}
              onCancel={handleCancel}
              isLoading={isLoadingAction}
            />
          )}

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

                {/* Preferences */}
          <PreferencesForm
            preferences={preferences}
            onPreferencesChange={setPreferences}
            onSave={handleSavePreferences}
            onCancel={() => setPreferences({
              emailNotifications: true,
              smsNotifications: true,
              pushNotifications: false,
              twoFactorAuth: false,
              language: 'en',
              timezone: 'Africa/Kampala',
              theme: 'light'
            })}
            isLoading={isLoadingAction}
          />

        </div>
      </div>
    </div>
  )
}

export default ProfilePage 
