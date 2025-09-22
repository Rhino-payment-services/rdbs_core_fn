"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

interface CreateTariffForm {
  name: string
  description: string
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'BILL_PAYMENT'
  currency: string
  feeType: 'FIXED' | 'PERCENTAGE' | 'HYBRID'
  feeAmount: number
  feePercentage: number
  minFee: number
  maxFee: number
  minAmount: number
  maxAmount: number
  userType: 'STAFF' | 'SUBSCRIBER' | 'MERCHANT'
  subscriberType: 'INDIVIDUAL' | 'BUSINESS'
}

const CreateTariffPage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  
  const { hasPermission } = usePermissions()
  const canCreateTariffs = hasPermission(PERMISSIONS.TARIFFS_CREATE)
  
  const [form, setForm] = useState<CreateTariffForm>({
    name: '',
    description: '',
    transactionType: 'TRANSFER_OUT',
    currency: 'UGX',
    feeType: 'FIXED',
    feeAmount: 0,
    feePercentage: 0,
    minFee: 0,
    maxFee: 0,
    minAmount: 0,
    maxAmount: 0,
    userType: 'SUBSCRIBER',
    subscriberType: 'INDIVIDUAL'
  })

  const createTariffMutation = useMutation({
    mutationFn: (data: CreateTariffForm) => api.post('/finance/tariffs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] })
      toast.success('Tariff created successfully')
      router.push('/dashboard/tariffs')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create tariff')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name || !form.description) {
      toast.error('Please fill in all required fields')
      return
    }

    if (form.feeType === 'FIXED' && form.feeAmount <= 0) {
      toast.error('Fee amount must be greater than 0 for fixed fees')
      return
    }

    if (form.feeType === 'PERCENTAGE' && form.feePercentage <= 0) {
      toast.error('Fee percentage must be greater than 0 for percentage fees')
      return
    }

    if (form.feeType === 'HYBRID' && (form.feeAmount <= 0 || form.feePercentage <= 0)) {
      toast.error('Both fee amount and percentage must be greater than 0 for hybrid fees')
      return
    }

    createTariffMutation.mutate(form)
  }

  const handleInputChange = (field: keyof CreateTariffForm, value: string | number) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (!canCreateTariffs) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to create tariffs.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/dashboard/tariffs">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Tariffs
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Tariff</h1>
            <p className="text-gray-600">Configure a new transaction fee structure</p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Tariff Details</CardTitle>
              <CardDescription>Fill in the details for the new tariff</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="e.g., Micro Transfer"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Brief description of this tariff"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="transactionType">Transaction Type *</Label>
                      <Select value={form.transactionType} onValueChange={(value) => handleInputChange('transactionType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TRANSFER_OUT">Wallet to Wallet</SelectItem>
                          <SelectItem value="WITHDRAWAL">Wallet to MNO</SelectItem>
                          <SelectItem value="BILL_PAYMENT">Bill Payments</SelectItem>
                          <SelectItem value="DEPOSIT">Wallet to Bank</SelectItem>
                          <SelectItem value="TRANSFER_IN">External to Wallet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="currency">Currency *</Label>
                      <Select value={form.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UGX">UGX</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Fee Configuration */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="feeType">Fee Type *</Label>
                      <Select value={form.feeType} onValueChange={(value) => handleInputChange('feeType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIXED">Fixed Amount</SelectItem>
                          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                          <SelectItem value="HYBRID">Fixed + Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {form.feeType === 'FIXED' && (
                      <div>
                        <Label htmlFor="feeAmount">Fee Amount *</Label>
                        <Input
                          id="feeAmount"
                          type="number"
                          value={form.feeAmount}
                          onChange={(e) => handleInputChange('feeAmount', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    )}

                    {form.feeType === 'PERCENTAGE' && (
                      <div>
                        <Label htmlFor="feePercentage">Fee Percentage *</Label>
                        <Input
                          id="feePercentage"
                          type="number"
                          value={form.feePercentage}
                          onChange={(e) => handleInputChange('feePercentage', parseFloat(e.target.value) || 0)}
                          placeholder="0.01"
                          min="0"
                          max="1"
                          step="0.001"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter as decimal (0.01 = 1%)</p>
                      </div>
                    )}

                    {form.feeType === 'HYBRID' && (
                      <>
                        <div>
                          <Label htmlFor="feeAmount">Fixed Fee Amount *</Label>
                          <Input
                            id="feeAmount"
                            type="number"
                            value={form.feeAmount}
                            onChange={(e) => handleInputChange('feeAmount', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="feePercentage">Percentage Fee *</Label>
                          <Input
                            id="feePercentage"
                            type="number"
                            value={form.feePercentage}
                            onChange={(e) => handleInputChange('feePercentage', parseFloat(e.target.value) || 0)}
                            placeholder="0.01"
                            min="0"
                            max="1"
                            step="0.001"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter as decimal (0.01 = 1%)</p>
                        </div>
                      </>
                    )}

                    <div>
                      <Label htmlFor="minFee">Minimum Fee</Label>
                      <Input
                        id="minFee"
                        type="number"
                        value={form.minFee}
                        onChange={(e) => handleInputChange('minFee', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxFee">Maximum Fee</Label>
                      <Input
                        id="maxFee"
                        type="number"
                        value={form.maxFee}
                        onChange={(e) => handleInputChange('maxFee', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                {/* Amount Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="minAmount">Minimum Transaction Amount</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      value={form.minAmount}
                      onChange={(e) => handleInputChange('minAmount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxAmount">Maximum Transaction Amount</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      value={form.maxAmount}
                      onChange={(e) => handleInputChange('maxAmount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* User Type Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="userType">User Type *</Label>
                    <Select value={form.userType} onValueChange={(value) => handleInputChange('userType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUBSCRIBER">Subscriber</SelectItem>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        <SelectItem value="MERCHANT">Merchant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subscriberType">Subscriber Type *</Label>
                    <Select value={form.subscriberType} onValueChange={(value) => handleInputChange('subscriberType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                        <SelectItem value="BUSINESS">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                  <Link href="/dashboard/tariffs">
                    <Button variant="outline" type="button">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={createTariffMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {createTariffMutation.isPending ? 'Creating...' : 'Create Tariff'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default CreateTariffPage 