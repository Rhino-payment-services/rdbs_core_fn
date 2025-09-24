"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X } from 'lucide-react'
import type { User as UserType } from '@/lib/types/api'

interface PersonalInfoFormProps {
  user: UserType
  isEditing: boolean
  formData: {
    firstName: string
    lastName: string
    middleName: string
    email: string
    phone: string
    dateOfBirth: string
    gender: string
    address: string
    city: string
    country: string
    bio: string
  }
  onFormDataChange: (data: any) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  isLoading: boolean
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  user,
  isEditing,
  formData,
  onFormDataChange,
  onEdit,
  onSave,
  onCancel,
  isLoading
}) => {
  const handleInputChange = (field: string, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value
    })
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
      'STAFF_USER': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={colors[userType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {userType?.replace('_', ' ') || 'Unknown'}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Manage your personal details and profile information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xl font-medium text-gray-600">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium">{user.firstName} {user.lastName}</h3>
              <p className="text-sm text-gray-500">ID: {user.id.slice(-8)}</p>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(user.status)}
                {getUserTypeBadge(user.userType)}
              </div>
            </div>
          </div>
          {!isEditing && (
            <Button onClick={onEdit} variant="outline" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              disabled={!isEditing}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              disabled={!isEditing}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              value={formData.middleName}
              onChange={(e) => handleInputChange('middleName', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={!isEditing}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={!isEditing}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date of Birth
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select 
              value={formData.gender} 
              onValueChange={(value) => handleInputChange('gender', value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select 
              value={formData.country} 
              onValueChange={(value) => handleInputChange('country', value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UG">Uganda</SelectItem>
                <SelectItem value="KE">Kenya</SelectItem>
                <SelectItem value="TZ">Tanzania</SelectItem>
                <SelectItem value="RW">Rwanda</SelectItem>
                <SelectItem value="BI">Burundi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Address
          </Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            disabled={!isEditing}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            disabled={!isEditing}
            placeholder="Tell us about yourself..."
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={onSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
