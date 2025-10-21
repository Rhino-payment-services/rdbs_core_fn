"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

interface CreateTariffForm {
  name: string
  description?: string
  tariffType: 'INTERNAL' | 'EXTERNAL'
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'BILL_PAYMENT' | 'WALLET_CREATION' | 'WALLET_INIT' | 'WALLET_TO_INTERNAL_MERCHANT' | 'WALLET_TO_EXTERNAL_MERCHANT' | 'MERCHANT_WITHDRAWAL' | 'WALLET_TO_WALLET' | 'WALLET_TO_MNO' | 'WALLET_TO_UTILITY' | 'MNO_TO_WALLET' | 'WALLET_TO_MERCHANT' | 'WALLET_TO_BANK' | 'BANK_TO_WALLET' | 'REVERSAL' | 'FEE_CHARGE'
  currency: string
  feeType: 'FIXED' | 'PERCENTAGE' | 'TIERED' | 'HYBRID'
  feeAmount: number
  feePercentage?: number
  minAmount?: number
  maxAmount?: number
  userType?: 'STAFF' | 'SUBSCRIBER'
  subscriberType?: 'INDIVIDUAL' | 'MERCHANT' | 'AGENT'
  partnerId?: string
  group?: string
  partnerFee?: number
  rukapayFee?: number
  telecomBankCharge?: number
  governmentTax?: number
}

interface Partner {
  id: string
  partnerName: string
  partnerCode: string
}

const CreateTariffPage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  
  const { hasPermission } = usePermissions()
  const canCreateTariffs = hasPermission(PERMISSIONS.TARIFF_CREATE)
  
  const [form, setForm] = useState<CreateTariffForm>({
    name: '',
    description: '',
    tariffType: 'INTERNAL',
    transactionType: 'WALLET_TO_WALLET',
    currency: 'UGX',
    feeType: 'FIXED',
    feeAmount: 0,
    feePercentage: 0,
    maxAmount: 0,
    minAmount: 0,
    userType: 'SUBSCRIBER',
    subscriberType: 'INDIVIDUAL',
    partnerId: undefined,
    group: '',
    partnerFee: 0,
    rukapayFee: 0,
    telecomBankCharge: 0,
    governmentTax: 0
  })

  // Calculate total fee amount
  const totalFeeAmount = (form.partnerFee || 0) + (form.rukapayFee || 0) + (form.telecomBankCharge || 0)

  const createTariffMutation = useMutation({
    mutationFn: (data: CreateTariffForm) => api.post('/finance/tariffs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] })
      toast.success('Tariff created successfully')
      router.push('/dashboard/finance/tariffs')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create tariff')
    }
  })

  // Fetch partners for external tariffs
  const { data: partnersData } = useQuery({
    queryKey: ['external-payment-partners'],
    queryFn: () => api.get('/admin/external-payment-partners').then(res => res.data),
    enabled: form.tariffType === 'EXTERNAL' // Only fetch if tariffType is EXTERNAL
  })

  const partners: Partner[] = partnersData || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name) {
      toast.error('Please fill in the tariff name')
      return
    }

    // Use the appropriate fee amount for validation
    const currentFeeAmount = form.tariffType === 'EXTERNAL' ? totalFeeAmount : form.feeAmount

    if (form.feeType === 'FIXED' && currentFeeAmount <= 0) {
      toast.error('Fee amount must be greater than 0 for fixed fees')
      return
    }

    if (form.feeType === 'PERCENTAGE' && (!form.feePercentage || form.feePercentage <= 0)) {
      toast.error('Fee percentage must be greater than 0 for percentage fees')
      return
    }

    if (form.feeType === 'HYBRID' && (currentFeeAmount <= 0 || !form.feePercentage || form.feePercentage <= 0)) {
      toast.error('Both fee amount and percentage must be greater than 0 for hybrid fees')
      return
    }

    if (form.tariffType === 'EXTERNAL' && !form.partnerId) {
      toast.error('Partner is required for external tariffs')
      return
    }

    // Clean up the data before sending
    const submitData = {
      ...form,
      // Set feeAmount to the calculated total for external tariffs
      feeAmount: form.tariffType === 'EXTERNAL' ? totalFeeAmount : form.feeAmount,
      // Convert feePercentage from percentage (e.g., 2.5) to decimal (0.025)
      feePercentage: form.feePercentage ? Number(form.feePercentage) / 100 : undefined,
      // Keep government tax as percentage value (no conversion needed)
      governmentTax: form.governmentTax || undefined,
      // Remove undefined values
      description: form.description || undefined,
      minAmount: form.minAmount || undefined,
      maxAmount: form.maxAmount || undefined,
      userType: form.userType || undefined,
      subscriberType: form.subscriberType || undefined,
      partnerId: form.partnerId || undefined,
      group: form.group || undefined,
      partnerFee: form.partnerFee || undefined,
      rukapayFee: form.rukapayFee || undefined,
      telecomBankCharge: form.telecomBankCharge || undefined
    }

    createTariffMutation.mutate(submitData)
  }

  const handleInputChange = (field: keyof CreateTariffForm, value: string | number | undefined) => {
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
          {/* Breadcrumbs */}
          <div className="mb-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/dashboard/finance" className="hover:text-[#08163d]">
                Finance
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/dashboard/finance/tariffs" className="hover:text-[#08163d]">
                Tariffs
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">Create Tariff</span>
            </nav>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/dashboard/finance/tariffs">
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
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Brief description of this tariff"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tariffType">Tariff Type *</Label>
                      <Select value={form.tariffType} onValueChange={(value) => handleInputChange('tariffType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INTERNAL">Internal (RukaPay operations)</SelectItem>
                          <SelectItem value="EXTERNAL">External (Partner integrations)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="transactionType">Transaction Type *</Label>
                      <Select value={form.transactionType} onValueChange={(value) => handleInputChange('transactionType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {form.tariffType === 'INTERNAL' ? (
                            <>
                              <SelectItem value="WALLET_TO_WALLET">Wallet to Wallet</SelectItem>
                              <SelectItem value="WALLET_TO_INTERNAL_MERCHANT">Wallet to Internal Merchant</SelectItem>
                              <SelectItem value="WALLET_CREATION">Wallet Creation</SelectItem>
                              <SelectItem value="WALLET_INIT">Wallet Initialization</SelectItem>
                              <SelectItem value="FEE_CHARGE">Fee Charge</SelectItem>
                              <SelectItem value="REVERSAL">Reversal</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="DEPOSIT">Deposit</SelectItem>
                              <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                              <SelectItem value="BILL_PAYMENT">Bill Payment</SelectItem>
                              <SelectItem value="WALLET_TO_EXTERNAL_MERCHANT">Wallet to External Merchant</SelectItem>
                              <SelectItem value="MERCHANT_WITHDRAWAL">Merchant Withdrawal</SelectItem>
                              <SelectItem value="WALLET_TO_MNO">Wallet to MNO</SelectItem>
                              <SelectItem value="WALLET_TO_UTILITY">Wallet to Utility</SelectItem>
                              <SelectItem value="WALLET_TO_MERCHANT">Wallet to Merchant</SelectItem>
                              <SelectItem value="WALLET_TO_BANK">Wallet to Bank</SelectItem>
                              <SelectItem value="BANK_TO_WALLET">Bank to Wallet</SelectItem>
                              <SelectItem value="MNO_TO_WALLET">MNO to Wallet</SelectItem>
                            </>
                          )}
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

                    {form.tariffType === 'EXTERNAL' && (
                      <div>
                        <Label htmlFor="partnerId">Partner *</Label>
                        <Select value={form.partnerId || ''} onValueChange={(value) => handleInputChange('partnerId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a partner" />
                          </SelectTrigger>
                          <SelectContent>
                            {partners.map((partner) => (
                              <SelectItem key={partner.id} value={partner.id}>
                                {partner.partnerName} ({partner.partnerCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
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
                          <SelectItem value="TIERED">Tiered</SelectItem>
                          <SelectItem value="HYBRID">Fixed + Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {form.feeType === 'FIXED' && form.tariffType === 'INTERNAL' && (
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

                    {form.feeType === 'FIXED' && form.tariffType === 'EXTERNAL' && (
                      <div>
                        <Label htmlFor="feeAmount">Fee Amount *</Label>
                        <Input
                          id="feeAmount"
                          type="number"
                          value={totalFeeAmount}
                          disabled
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <p className="text-xs text-gray-500 mt-1">Calculated automatically from partner fees</p>
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
                            value={form.tariffType === 'EXTERNAL' ? totalFeeAmount : form.feeAmount}
                            onChange={form.tariffType === 'EXTERNAL' ? undefined : (e) => handleInputChange('feeAmount', parseFloat(e.target.value) || 0)}
                            disabled={form.tariffType === 'EXTERNAL'}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            required
                          />
                          {form.tariffType === 'EXTERNAL' && (
                            <p className="text-xs text-gray-500 mt-1">Calculated automatically from partner fees</p>
                          )}
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

                    {form.feeType === 'TIERED' && (
                      <div>
                        <Label htmlFor="feeAmount">Base Fee Amount *</Label>
                        <Input
                          id="feeAmount"
                          type="number"
                          value={form.tariffType === 'EXTERNAL' ? totalFeeAmount : form.feeAmount}
                          onChange={form.tariffType === 'EXTERNAL' ? undefined : (e) => handleInputChange('feeAmount', parseFloat(e.target.value) || 0)}
                          disabled={form.tariffType === 'EXTERNAL'}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          required
                        />
                        {form.tariffType === 'EXTERNAL' && (
                          <p className="text-xs text-gray-500 mt-1">Calculated automatically from partner fees</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Base fee for tiered structure</p>
                      </div>
                    )}
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
                    <Label htmlFor="userType">User Type</Label>
                    <Select value={form.userType || ''} onValueChange={(value) => handleInputChange('userType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUBSCRIBER">Subscriber</SelectItem>
                        <SelectItem value="STAFF">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subscriberType">Subscriber Type</Label>
                    <Select value={form.subscriberType || ''} onValueChange={(value) => handleInputChange('subscriberType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subscriber type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                        <SelectItem value="MERCHANT">Merchant</SelectItem>
                        <SelectItem value="AGENT">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* External Tariff Specific Fields */}
                {form.tariffType === 'EXTERNAL' && (
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-medium">External Tariff Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="group">Tariff Group</Label>
                        <Input
                          id="group"
                          value={form.group}
                          onChange={(e) => handleInputChange('group', e.target.value)}
                          placeholder="e.g., G1, G2, G3"
                        />
                        <p className="text-xs text-gray-500 mt-1">Group for partner-specific amount ranges</p>
                      </div>

                      <div>
                        <Label htmlFor="partnerFee">Partner Fee</Label>
                        <Input
                          id="partnerFee"
                          type="number"
                          value={form.partnerFee}
                          onChange={(e) => handleInputChange('partnerFee', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <p className="text-xs text-gray-500 mt-1">Fee amount for the partner</p>
                      </div>

                      <div>
                        <Label htmlFor="rukapayFee">RukaPay Fee</Label>
                        <Input
                          id="rukapayFee"
                          type="number"
                          value={form.rukapayFee}
                          onChange={(e) => handleInputChange('rukapayFee', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <p className="text-xs text-gray-500 mt-1">RukaPay fee amount</p>
                      </div>

                      <div>
                        <Label htmlFor="telecomBankCharge">Telecom/Bank Charge</Label>
                        <Input
                          id="telecomBankCharge"
                          type="number"
                          value={form.telecomBankCharge}
                          onChange={(e) => handleInputChange('telecomBankCharge', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <p className="text-xs text-gray-500 mt-1">Optional telecom/bank charge</p>
                      </div>

                      <div>
                        <Label htmlFor="governmentTax">Government Tax (%)</Label>
                        <Input
                          id="governmentTax"
                          type="number"
                          value={form.governmentTax}
                          onChange={(e) => handleInputChange('governmentTax', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <p className="text-xs text-gray-500 mt-1">Optional government tax percentage (e.g., 18 for 18%)</p>
                      </div>
                    </div>
                    
                    {/* Total Fee Display */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Total Fee Amount:</span>
                        <span className="text-lg font-bold text-[#08163d]">
                          {form.currency} {totalFeeAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Partner Fee: {form.currency} {(form.partnerFee || 0).toFixed(2)} + 
                        RukaPay Fee: {form.currency} {(form.rukapayFee || 0).toFixed(2)} + 
                        Telecom/Bank Charge: {form.currency} {(form.telecomBankCharge || 0).toFixed(2)}
                        {form.governmentTax && form.governmentTax > 0 && (
                          <span> + Gov Tax: {(form.governmentTax || 0).toFixed(2)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                  <Link href="/dashboard/finance/tariffs">
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