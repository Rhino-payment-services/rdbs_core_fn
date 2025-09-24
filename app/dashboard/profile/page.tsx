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
  Plus,
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
    currency: 'UGX',
    theme: 'light'
  })

  const [newUserData, setNewUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    userType: 'SUBSCRIBER',
    role: 'USER'
  })

  const [isLoadingAction, setIsLoadingAction] = useState(false)

  // Initialize form data when user data is available
  React.useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || 'UG',
        bio: user.bio || ''
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
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || 'UG',
        bio: user.bio || ''
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

  const handleCreateUser = async () => {
    setIsLoadingAction(true)
    try {
      const response = await api.post('/users', newUserData)
      if (response.data.success) {
        toast.success('User created successfully!')
        setNewUserData({
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          userType: 'SUBSCRIBER',
          role: 'USER'
        })
      } else {
        toast.error(response.data.message || 'Failed to create user')
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
          <PersonalInfoForm
            user={user}
            isEditing={isEditing}
            formData={formData}
            onFormDataChange={setFormData}
            onEdit={handleEdit}
            onSave={handleSaveProfile}
            onCancel={handleCancel}
            isLoading={isLoadingAction}
          />

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
              currency: 'UGX',
              theme: 'light'
            })}
            isLoading={isLoadingAction}
          />

          {/* Create New User */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New User
              </CardTitle>
              <CardDescription>
                Create a new user account in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="newUserEmail">Email *</Label>
                  <Input
                    id="newUserEmail"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUserPhone">Phone *</Label>
                  <Input
                    id="newUserPhone"
                    type="tel"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                    placeholder="+256 700 000 000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUserFirstName">First Name *</Label>
                  <Input
                    id="newUserFirstName"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUserLastName">Last Name *</Label>
                  <Input
                    id="newUserLastName"
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUserType">User Type</Label>
                  <Select 
                    value={newUserData.userType} 
                    onValueChange={(value) => setNewUserData({...newUserData, userType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUBSCRIBER">Subscriber</SelectItem>
                      <SelectItem value="MERCHANT">Merchant</SelectItem>
                      <SelectItem value="PARTNER">Partner</SelectItem>
                      <SelectItem value="AGENT">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUserRole">Role</Label>
                  <Select 
                    value={newUserData.role} 
                    onValueChange={(value) => setNewUserData({...newUserData, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleCreateUser}
                  disabled={isLoadingAction || !newUserData.email || !newUserData.firstName || !newUserData.lastName || !newUserData.phone}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoadingAction ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
