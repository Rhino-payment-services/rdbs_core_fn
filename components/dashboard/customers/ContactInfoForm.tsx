"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Phone, Globe } from 'lucide-react'

interface ContactInfoFormProps {
  formData: {
    registeredPhoneNumber: string
    businessEmail: string
    website: string
  }
  onFormDataChange: (data: any) => void
}

export const ContactInfoForm: React.FC<ContactInfoFormProps> = ({
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
          <Phone className="h-5 w-5" />
          Contact Information
        </CardTitle>
        <CardDescription>
          Enter contact details and communication preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="registeredPhoneNumber" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Registered Phone Number *
            </Label>
            <Input
              id="registeredPhoneNumber"
              type="tel"
              value={formData.registeredPhoneNumber}
              onChange={(e) => handleInputChange('registeredPhoneNumber', e.target.value)}
              placeholder="+256 700 000 000"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Business Email *
            </Label>
            <Input
              id="businessEmail"
              type="email"
              value={formData.businessEmail}
              onChange={(e) => handleInputChange('businessEmail', e.target.value)}
              placeholder="business@example.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://www.example.com"
          />
        </div>
      </CardContent>
    </Card>
  )
}
