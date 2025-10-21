"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2 } from 'lucide-react'

interface BusinessInfoFormProps {
  formData: {
    businessTradeName: string
    registeredBusinessName: string
    certificateOfIncorporation: string
    taxIdentificationNumber: string
    businessType: string
    businessRegistrationDate: string
    businessAddress: string
    businessCity: string
    businessCountry: string
  }
  onFormDataChange: (data: any) => void
}

export const BusinessInfoForm: React.FC<BusinessInfoFormProps> = ({
  formData,
  onFormDataChange
}) => {
  const handleInputChange = (field: string, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Business Information
        </CardTitle>
        <CardDescription>
          Enter your business details and registration information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="businessTradeName">Business Trade Name *</Label>
          <Input
            id="businessTradeName"
            value={formData.businessTradeName}
            onChange={(e) => handleInputChange('businessTradeName', e.target.value)}
            placeholder="Enter business trade name (display name)"
            required
            minLength={2}
            maxLength={100}
          />
          <p className="text-xs text-gray-500">
            Business trade name (2-100 characters)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="registeredBusinessName">Registered Business Name *</Label>
            <Input
              id="registeredBusinessName"
              value={formData.registeredBusinessName}
              onChange={(e) => handleInputChange('registeredBusinessName', e.target.value)}
              placeholder="Enter registered business name"
              required
              minLength={2}
              maxLength={150}
            />
            <p className="text-xs text-gray-500">
              Registered business name (2-150 characters)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="certificateOfIncorporation">Certificate of Incorporation *</Label>
            <Input
              id="certificateOfIncorporation"
              value={formData.certificateOfIncorporation}
              onChange={(e) => handleInputChange('certificateOfIncorporation', e.target.value)}
              placeholder="Enter certificate number"
              required
              minLength={5}
              maxLength={50}
            />
            <p className="text-xs text-gray-500">
              Certificate number (5-50 characters)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxIdentificationNumber">Tax Identification Number *</Label>
            <Input
              id="taxIdentificationNumber"
              value={formData.taxIdentificationNumber}
              onChange={(e) => handleInputChange('taxIdentificationNumber', e.target.value)}
              placeholder="Enter TIN number"
              required
              minLength={5}
              maxLength={20}
            />
            <p className="text-xs text-gray-500">
              Tax identification number (5-20 characters)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type *</Label>
            <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                <SelectItem value="LIMITED_COMPANY">Limited Company</SelectItem>
                <SelectItem value="PUBLIC_COMPANY">Public Company</SelectItem>
                <SelectItem value="COOPERATIVE">Cooperative</SelectItem>
                <SelectItem value="NGO">NGO</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessRegistrationDate">Business Registration Date *</Label>
            <Input
              id="businessRegistrationDate"
              type="date"
              value={formData.businessRegistrationDate}
              onChange={(e) => handleInputChange('businessRegistrationDate', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="businessAddress">Business Address *</Label>
            <Input
              id="businessAddress"
              value={formData.businessAddress}
              onChange={(e) => handleInputChange('businessAddress', e.target.value)}
              placeholder="Enter full business address"
              required
              minLength={10}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              Full business address (10-200 characters)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessCity">Business City *</Label>
            <Input
              id="businessCity"
              value={formData.businessCity}
              onChange={(e) => handleInputChange('businessCity', e.target.value)}
              placeholder="Enter business city"
              required
              minLength={2}
              maxLength={50}
            />
            <p className="text-xs text-gray-500">
              Business city (2-50 characters)
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessCountry">Business Country *</Label>
          <Select value={formData.businessCountry} onValueChange={(value) => handleInputChange('businessCountry', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UG">Uganda</SelectItem>
              <SelectItem value="KE">Kenya</SelectItem>
              <SelectItem value="TZ">Tanzania</SelectItem>
              <SelectItem value="RW">Rwanda</SelectItem>
              <SelectItem value="BI">Burundi</SelectItem>
              <SelectItem value="SS">South Sudan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
