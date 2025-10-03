"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard } from 'lucide-react'

interface FinancialInfoFormProps {
  formData: {
    bankName: string
    bankAccountName: string
    bankAccountNumber: string
    mobileMoneyNumber: string
    mobileMoneyProvider: string
  }
  onFormDataChange: (data: any) => void
}

export const FinancialInfoForm: React.FC<FinancialInfoFormProps> = ({
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
          <CreditCard className="h-5 w-5" />
          Financial Information
        </CardTitle>
        <CardDescription>
          Enter banking and mobile money details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Banking Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Select value={formData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equity_bank">Equity Bank Uganda</SelectItem>
                  <SelectItem value="stanbic_bank">Stanbic Bank Uganda Limited</SelectItem>
                  <SelectItem value="absa_bank">ABSA Bank Uganda Limited</SelectItem>
                  <SelectItem value="centenary_bank">Centenary Bank</SelectItem>
                  <SelectItem value="dfcu_bank">DFCU BANK</SelectItem>
                  <SelectItem value="kcb_bank">KCB Bank Uganda</SelectItem>
                  <SelectItem value="orient_bank">Orient Bank Limited</SelectItem>
                  <SelectItem value="bank_of_africa">Bank of Africa Uganda Limited</SelectItem>
                  <SelectItem value="exim_bank">EXIM Bank Uganda Limited</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountName">Account Name *</Label>
              <Input
                id="bankAccountName"
                value={formData.bankAccountName}
                onChange={(e) => handleInputChange('bankAccountName', e.target.value)}
                placeholder="Enter account holder name"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountNumber">Account Number *</Label>
            <Input
              id="bankAccountNumber"
              value={formData.bankAccountNumber}
              onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
              placeholder="Enter account number"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Mobile Money Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="mobileMoneyProvider">Mobile Money Provider *</Label>
              <Select value={formData.mobileMoneyProvider} onValueChange={(value) => handleInputChange('mobileMoneyProvider', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                  <SelectItem value="AIRTEL">Airtel Money</SelectItem>
                  <SelectItem value="AFRICELL">Africell Money</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobileMoneyNumber">Mobile Money Number *</Label>
              <Input
                id="mobileMoneyNumber"
                value={formData.mobileMoneyNumber}
                onChange={(e) => handleInputChange('mobileMoneyNumber', e.target.value)}
                placeholder="Enter mobile money number"
                required
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
