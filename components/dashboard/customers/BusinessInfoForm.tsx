"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
          Enter the business details and registration information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="businessTradeName">Business Trade Name *</Label>
            <Input
              id="businessTradeName"
              value={formData.businessTradeName}
              onChange={(e) => handleInputChange('businessTradeName', e.target.value)}
              placeholder="Enter business trade name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registeredBusinessName">Registered Business Name *</Label>
            <Input
              id="registeredBusinessName"
              value={formData.registeredBusinessName}
              onChange={(e) => handleInputChange('registeredBusinessName', e.target.value)}
              placeholder="Enter registered business name"
              required
            />
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxIdentificationNumber">Tax Identification Number *</Label>
            <Input
              id="taxIdentificationNumber"
              value={formData.taxIdentificationNumber}
              onChange={(e) => handleInputChange('taxIdentificationNumber', e.target.value)}
              placeholder="Enter TIN number"
              required
            />
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
                <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="limited_liability_company">Limited Liability Company</SelectItem>
                <SelectItem value="corporation">Corporation</SelectItem>
                <SelectItem value="cooperative">Cooperative</SelectItem>
                <SelectItem value="ngo">NGO</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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

        <div className="space-y-2">
          <Label htmlFor="businessAddress">Business Address *</Label>
          <Textarea
            id="businessAddress"
            value={formData.businessAddress}
            onChange={(e) => handleInputChange('businessAddress', e.target.value)}
            placeholder="Enter complete business address"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="businessCity">City *</Label>
            <Input
              id="businessCity"
              value={formData.businessCity}
              onChange={(e) => handleInputChange('businessCity', e.target.value)}
              placeholder="Enter city"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessCountry">Country *</Label>
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
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
