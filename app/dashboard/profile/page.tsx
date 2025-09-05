"use client"

import React, { useState } from 'react'
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  MapPin, 
  Edit3, 
  Save, 
  X, 
  Camera,
  Key,
  Bell,
  Globe,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Plus,
  Users
} from 'lucide-react'
import { useProfile } from '@/lib/hooks/useApi'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'
import Navbar from '@/components/dashboard/Navbar'
import api from '@/lib/axios'
import type { User } from '@/lib/types/api'
import { Badge } from '@/components/ui/badge'

const ProfilePage = () => {
  const { data: profile, isLoading, error } = useProfile()
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Get user data from profile response
  const user = profile?.data || session?.user
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    kycStatus: '',
    verificationLevel: ''
  })

  // Update form data when user data changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        phone: user.phone || '',
        kycStatus: user.kycStatus || '',
        verificationLevel: user.verificationLevel || ''
      })
    }
  }, [user])
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Create user form state
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [createUserData, setCreateUserData] = useState({
    email: '',
    password: '',
    role: 'USER',
    userType: 'STAFF',
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    country: 'UG'
  })
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = () => {
    // TODO: Implement profile update API call
    toast.success('Profile updated successfully!')
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      email: user?.email || '',
      phone: user?.phone || '',
      kycStatus: user?.kycStatus || '',
      verificationLevel: user?.verificationLevel || ''
    })
    setIsEditing(false)
  }

  const handlePasswordUpdate = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters!')
      return
    }
    
    // TODO: Implement password update API call
    toast.success('Password updated successfully!')
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  const handleCreateUser = async () => {
    if (!createUserData.email || !createUserData.password || !createUserData.firstName || !createUserData.lastName) {
      toast.error('Please fill in all required fields')
      return
    }

    if (createUserData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsCreatingUser(true)

    try {
      const response = await api.post('/admin/users', createUserData)
      
      toast.success('User created successfully!')
      
      // Reset form
      setCreateUserData({
        email: '',
        password: '',
        role: 'USER',
        userType: 'STAFF',
        firstName: '',
        lastName: '',
        department: '',
        position: '',
        country: 'UG'
      })
      
      setShowCreateUser(false)
    } catch (error: any) {
      console.error('Create user error:', error)
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleCreateUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCreateUserData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Unknown
      </span>
    )
    
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        )
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Inactive
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        )
    }
  }

  const getRoleBadge = (role: string | undefined) => {
    if (!role) return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Unknown
      </span>
    )
    
    const roleColors: { [key: string]: string } = {
      'SUPERADMIN': 'bg-purple-100 text-purple-800',
      'ADMIN': 'bg-blue-100 text-blue-800',
      'USER': 'bg-green-100 text-green-800',
      'STAFF': 'bg-orange-100 text-orange-800'
    }
    
    const color = roleColors[role.toUpperCase()] || 'bg-gray-100 text-gray-800'
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {role}
      </span>
    )
  }

  // Helper function to safely access user properties
  const getUserProperty = (property: keyof User) => {
    if (user && typeof user === 'object' && property in user) {
      return (user as any)[property]
    }
    return ''
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error loading profile</h3>
                  <p className="text-sm text-red-700 mt-1">
                    {error.message || 'Failed to load profile data. Please try again.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Content */}
          {!isLoading && !error && user && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {/* Profile Picture */}
                  <div className="text-center mb-6">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 bg-gradient-to-br from-[#08163d] to-[#0a1f4f] rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="w-12 h-12 text-white" />
                      </div>
                      <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <Camera className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {user.email ? user.email.split('@')[0] : 'User'}
                    </h2>
                    <p className="text-gray-500">{user.role || 'User'}</p>
                    <p className="text-sm text-gray-400 mt-1">{user.userType || 'Unknown Type'}</p>
                    <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                  </div>

                  {/* Profile Stats */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-700">Account Status</span>
                      </div>
                      <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {user.status === 'ACTIVE' ? 'Active' : user.status || 'Unknown'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-700">User Type</span>
                      </div>
                      <Badge variant="outline">
                        {user.userType === 'STAFF_USER' ? 'Staff Member' : user.userType || 'Unknown'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-700">Email Verified</span>
                      </div>
                      <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                        {user.isVerified ? 'Verified' : 'Not Verified'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-700">KYC Status</span>
                      </div>
                      <Badge variant={user.kycStatus === 'APPROVED' ? 'default' : user.kycStatus === 'PENDING' ? 'secondary' : 'destructive'}>
                        {user.kycStatus === 'APPROVED' ? 'Approved' : user.kycStatus === 'PENDING' ? 'Pending' : user.kycStatus || 'Unknown'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-700">Last Login</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Never'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-700">Member Since</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric'
                        }) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Settings Forms */}
              <div className="lg:col-span-2 space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                      <p className="text-gray-600 text-sm">Update your personal details</p>
                    </div>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#08163d] transition-colors"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-[#08163d] hover:bg-[#0a1f4f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#08163d] transition-colors"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#08163d] transition-colors"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                        />
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <div className="relative">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                        />
                        <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">KYC Status</label>
                      <input
                        type="text"
                        name="kycStatus"
                        value={formData.kycStatus}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Verification Level</label>
                      <input
                        type="text"
                        name="verificationLevel"
                        value={formData.verificationLevel}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-6">
                    <Key className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                      <p className="text-gray-600 text-sm">Update your password to keep your account secure</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-colors"
                          placeholder="Enter current password"
                        />
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-colors"
                          placeholder="Enter new password"
                        />
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-colors"
                          placeholder="Confirm new password"
                        />
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={handlePasswordUpdate}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-[#08163d] hover:bg-[#0a1f4f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#08163d] transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Update Password
                    </button>
                  </div>
                </div>

                {/* Preferences */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center mb-6">
                    <Bell className="w-5 h-5 text-gray-600 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
                      <p className="text-gray-600 text-sm">Manage your notification and privacy settings</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-600">Receive email updates about your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#08163d]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#08163d]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                        <p className="text-sm text-gray-600">Receive SMS updates about your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#08163d]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#08163d]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                      <button className="inline-flex items-center px-3 py-1.5 border border-[#08163d] rounded-lg text-sm font-medium text-[#08163d] bg-white hover:bg-[#08163d] hover:text-white transition-colors">
                        Enable
                      </button>
                    </div>
                  </div>
                </div>

                {/* Create User Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-600 mr-3" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
                        <p className="text-gray-600 text-sm">Add new staff members to the system</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCreateUser(!showCreateUser)}
                      className="inline-flex items-center px-4 py-2 border border-[#08163d] rounded-lg text-sm font-medium text-[#08163d] bg-white hover:bg-[#08163d] hover:text-white transition-colors"
                    >
                      {showCreateUser ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create User
                        </>
                      )}
                    </button>
                  </div>

                  {showCreateUser && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                          <input
                            type="text"
                            name="firstName"
                            value={createUserData.firstName}
                            onChange={handleCreateUserInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-colors"
                            placeholder="Enter first name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                          <input
                            type="text"
                            name="lastName"
                            value={createUserData.lastName}
                            onChange={handleCreateUserInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-colors"
                            placeholder="Enter last name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                          <input
                            type="email"
                            name="email"
                            value={createUserData.email}
                            onChange={handleCreateUserInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-colors"
                            placeholder="Enter email address"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                          <div className="relative">
                            <input
                              type={showCreatePassword ? "text" : "password"}
                              name="password"
                              value={createUserData.password}
                              onChange={handleCreateUserInputChange}
                              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-colors"
                              placeholder="Enter password"
                            />
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <button
                              type="button"
                              onClick={() => setShowCreatePassword(!showCreatePassword)}
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                              {showCreatePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                          <select
                            name="role"
                            value={createUserData.role}
                            onChange={handleCreateUserInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-colors"
                          >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPERADMIN">Super Admin</option>
                            <option value="STAFF">Staff</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                          <select
                            name="userType"
                            value={createUserData.userType}
                            onChange={handleCreateUserInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-colors"
                          >
                            <option value="STAFF_USER">Staff User</option>
                            <option value="END_USER">End User</option>
                            <option value="ADMIN_USER">Admin User</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                          <input
                            type="text"
                            name="department"
                            value={createUserData.department}
                            onChange={handleCreateUserInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-colors"
                            placeholder="Enter department"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                          <input
                            type="text"
                            name="position"
                            value={createUserData.position}
                            onChange={handleCreateUserInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-colors"
                            placeholder="Enter position"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                          <select
                            name="country"
                            value={createUserData.country}
                            onChange={handleCreateUserInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-colors"
                          >
                            <option value="UG">Uganda</option>
                            <option value="KE">Kenya</option>
                            <option value="TZ">Tanzania</option>
                            <option value="RW">Rwanda</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => setShowCreateUser(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateUser}
                          disabled={isCreatingUser}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-[#08163d] hover:bg-[#0a1f4f] disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#08163d] transition-colors"
                        >
                          {isCreatingUser ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Create User
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default ProfilePage 