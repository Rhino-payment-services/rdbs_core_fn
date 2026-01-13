"use client"
import React, { useState, Suspense } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useTransactionModes } from '@/lib/hooks/useTransactionModes'

interface CreateTariffForm {
  name: string
  description?: string
  tariffType: 'INTERNAL' | 'EXTERNAL'
  transactionType: 'DEPOSIT' | 'WITHDRAWAL' | 'BILL_PAYMENT' | 'SCHOOL_FEES' | 'WALLET_INIT' | 'WALLET_TO_INTERNAL_MERCHANT' | 'WALLET_TO_EXTERNAL_MERCHANT' | 'MERCHANT_WITHDRAWAL' | 'MERCHANT_TO_WALLET' | 'WALLET_TO_WALLET' | 'WALLET_TO_MNO' | 'WALLET_TO_UTILITY' | 'MNO_TO_WALLET' | 'WALLET_TO_MERCHANT' | 'WALLET_TO_BANK' | 'BANK_TO_WALLET' | 'CARD_TO_WALLET' | 'REVERSAL' | 'FEE_CHARGE' | 'CUSTOM'
  transactionModeId?: string
  currency: string
  feeType: 'FIXED' | 'PERCENTAGE' | 'TIERED' | 'HYBRID'
  feeAmount: number
  feePercentage?: number
  minAmount?: number
  maxAmount?: number
  userType?: 'STAFF' | 'SUBSCRIBER'
  subscriberType?: 'INDIVIDUAL' | 'MERCHANT' | 'AGENT'
  partnerId?: string
  apiPartnerId?: string
  partnerType?: 'EXTERNAL_PARTNER' | 'API_PARTNER'
  group?: string
  partnerFee?: number
  rukapayFee?: number
  telecomBankCharge?: number
  governmentTax?: number
  metadata?: Record<string, any>
}

interface Partner {
  id: string
  partnerName: string
  partnerCode: string
}

interface ApiPartner {
  id: string
  partnerName: string
  partnerType: string
  contactEmail: string
  country?: string
}

function CreateTariffPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  
  // Get apiPartnerId from query params if present
  const apiPartnerIdFromQuery = searchParams?.get('apiPartnerId')
  
  const { hasPermission } = usePermissions()
  const canCreateTariffs = hasPermission(PERMISSIONS.TARIFF_CREATE)
  
  const [form, setForm] = useState<CreateTariffForm>({
    name: '',
    description: '',
    tariffType: apiPartnerIdFromQuery ? 'EXTERNAL' : 'INTERNAL',
    transactionType: 'WALLET_TO_WALLET',
    transactionModeId: undefined,
    currency: 'UGX',
    feeType: apiPartnerIdFromQuery ? 'PERCENTAGE' : 'FIXED',
    feeAmount: 0,
    feePercentage: 0,
    maxAmount: 0,
    minAmount: 0,
    userType: 'SUBSCRIBER',
    subscriberType: 'INDIVIDUAL',
    partnerId: undefined,
    apiPartnerId: apiPartnerIdFromQuery || undefined,
    partnerType: apiPartnerIdFromQuery ? 'API_PARTNER' : undefined,
    group: '',
    partnerFee: 0,
    rukapayFee: 0,
    telecomBankCharge: 0,
    governmentTax: 0
  })

  // Fetch transaction modes for selection
  const { data: transactionModes } = useTransactionModes({ isActive: true })

  // Calculate total fee amount
  const totalFeeAmount = (form.partnerFee || 0) + (form.rukapayFee || 0) + (form.telecomBankCharge || 0)

  const createTariffMutation = useMutation({
    mutationFn: (data: CreateTariffForm) => api.post('/finance/tariffs', data),
    onSuccess: (response: any) => {
      // Invalidate and refetch tariffs query
      queryClient.invalidateQueries({ queryKey: ['tariffs'] })
      queryClient.refetchQueries({ queryKey: ['tariffs'] })
      
      // Determine which tab to show based on tariff type
      const createdTariff = response?.data?.data || response?.data
      const tariffType = createdTariff?.tariffType || form.tariffType
      const transactionType = createdTariff?.transactionType || form.transactionType
      
      toast.success('Tariff created successfully')
      
      // Navigate to tariffs page with query params to show the correct tab
      // For INTERNAL CUSTOM tariffs, show internal tab with custom-internal tab
      // For EXTERNAL CUSTOM tariffs, show external tab with custom tab
      const tabParam = tariffType === 'INTERNAL' ? 'internal' : 'external'
      const subTabParam = transactionType === 'CUSTOM' 
        ? (tariffType === 'INTERNAL' ? 'custom-internal' : 'custom')
        : undefined
      
      const queryParams = new URLSearchParams()
      queryParams.set('tab', tabParam)
      if (subTabParam) {
        queryParams.set('subTab', subTabParam)
      }
      
      // Small delay to ensure query refetch completes before navigation
      setTimeout(() => {
        router.push(`/dashboard/finance/tariffs?${queryParams.toString()}`)
      }, 100)
    },
    onError: (error: any) => {
      // Extract error message from various possible locations
      // Handle case where message might be an array
      let errorMessage: string
      const rawMessage = error.response?.data?.message
      
      if (Array.isArray(rawMessage)) {
        // If message is an array, join it
        errorMessage = rawMessage.join('; ')
      } else {
        errorMessage = rawMessage || 
                      error.response?.data?.error?.message || 
                      error.response?.data?.error ||
                      error.message ||
                      'Failed to create tariff'
      }
      
      // Extract validation errors if present
      const validationErrors = error.response?.data?.errors || 
                              error.response?.data?.error?.errors ||
                              error.response?.data?.validationErrors
      
      // Build detailed error message
      let fullErrorMessage = errorMessage
      
      if (validationErrors) {
        // Format validation errors as a readable string
        if (typeof validationErrors === 'object' && !Array.isArray(validationErrors)) {
          const errorDetails = Object.entries(validationErrors)
            .map(([field, messages]: [string, any]) => {
              const fieldMessages = Array.isArray(messages) ? messages.join(', ') : messages
              return `${field}: ${fieldMessages}`
            })
            .join('; ')
          fullErrorMessage = `${errorMessage}${errorDetails ? ` (${errorDetails})` : ''}`
        } else if (Array.isArray(validationErrors)) {
          fullErrorMessage = `${errorMessage}${validationErrors.length > 0 ? ` (${validationErrors.join(', ')})` : ''}`
        }
      }
      
      // Show toast with error message
      toast.error(fullErrorMessage, {
        duration: 6000, // Show for 6 seconds to allow reading longer messages
      })
      
      // Also log full error details for debugging
      console.error('Tariff creation error:', {
        message: errorMessage,
        rawMessage,
        validationErrors,
        fullError: error.response?.data,
        status: error.response?.status,
        requestData: error.config?.data // Log what was sent
      })
    }
  })

  // Fetch external payment partners for external tariffs
  const { data: partnersData } = useQuery({
    queryKey: ['external-payment-partners'],
    queryFn: () => api.get('/admin/external-payment-partners').then(res => res.data),
    enabled: form.tariffType === 'EXTERNAL' // Only fetch if tariffType is EXTERNAL
  })

  // Fetch API partners (gateway partners) for external tariffs
  const { data: apiPartnersData } = useQuery({
    queryKey: ['gateway-partners'],
    queryFn: () => api.get('/api/v1/admin/gateway-partners?page=1&limit=100').then(res => res.data?.data || []),
    enabled: form.tariffType === 'EXTERNAL' // Only fetch if tariffType is EXTERNAL
  })

  const partners: Partner[] = partnersData || []
  const apiPartners: ApiPartner[] = apiPartnersData || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name) {
      toast.error('Please fill in the tariff name')
      return
    }

    if (!form.transactionModeId) {
      toast.error('Transaction mode is required')
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

    if (form.tariffType === 'EXTERNAL' && !form.partnerId && !form.apiPartnerId) {
      toast.error('Partner is required for external tariffs')
      return
    }

    // Validate transactionType is one of the allowed values
    const allowedTransactionTypes = [
      'DEPOSIT', 'WITHDRAWAL', 'BILL_PAYMENT', 'WALLET_CREATION', 'WALLET_INIT',
      'WALLET_TO_INTERNAL_MERCHANT', 'WALLET_TO_EXTERNAL_MERCHANT', 'MERCHANT_WITHDRAWAL',
      'MERCHANT_TO_WALLET', 'WALLET_TO_WALLET', 'WALLET_TO_MNO', 'WALLET_TO_UTILITY',
      'MNO_TO_WALLET', 'WALLET_TO_MERCHANT', 'WALLET_TO_BANK', 'BANK_TO_WALLET',
      'CARD_TO_WALLET', 'REVERSAL', 'FEE_CHARGE', 'CUSTOM'
    ]
    
    // If transactionType is not in allowed list, default to CUSTOM
    const validTransactionType = allowedTransactionTypes.includes(form.transactionType) 
      ? form.transactionType 
      : 'CUSTOM'
    
    if (form.transactionType !== validTransactionType) {
      console.warn(`Invalid transactionType "${form.transactionType}" replaced with "CUSTOM"`)
    }

    // Clean up the data before sending
    const submitData = {
      ...form,
      // Ensure transactionType is valid
      transactionType: validTransactionType,
      // Set feeAmount to the calculated total for external tariffs
      feeAmount: form.tariffType === 'EXTERNAL' ? totalFeeAmount : form.feeAmount,
      // Convert feePercentage based on partner type
      // API partners enter as percentage (e.g., 2.5), others as decimal (e.g., 0.025)
      feePercentage: form.feePercentage 
        ? (form.partnerType === 'API_PARTNER' 
            ? Number(form.feePercentage) / 100  // Convert percentage to decimal for API partners
            : Number(form.feePercentage))        // Already in decimal for others
        : undefined,
      // Keep government tax as percentage value (no conversion needed)
      governmentTax: form.governmentTax || undefined,
      // Include metadata (RTIS metadata for custom transaction modes)
      metadata: form.metadata || undefined,
      // Remove undefined values and UI-only fields
      description: form.description || undefined,
      minAmount: form.minAmount || undefined,
      maxAmount: form.maxAmount || undefined,
      userType: form.userType || undefined,
      subscriberType: form.subscriberType || undefined,
      partnerId: form.partnerId || undefined,
      apiPartnerId: form.apiPartnerId || undefined,
      group: form.group || undefined,
      partnerFee: form.partnerFee || undefined,
      rukapayFee: form.rukapayFee || undefined,
      telecomBankCharge: form.telecomBankCharge || undefined,
      // Remove UI-only field
      partnerType: undefined
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
                      <Select 
                        value={form.tariffType} 
                        onValueChange={(value) => {
                          handleInputChange('tariffType', value)
                          // Clear partner selections when switching to INTERNAL
                          if (value === 'INTERNAL') {
                            handleInputChange('partnerId', undefined)
                            handleInputChange('apiPartnerId', undefined)
                            handleInputChange('partnerType', undefined)
                          }
                        }}
                      >
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
                      <Label htmlFor="transactionModeId">Transaction Mode *</Label>
                      <Select 
                        value={form.transactionModeId || ''} 
                        onValueChange={(value) => {
                          handleInputChange('transactionModeId', value)
                          // Auto-set transaction type based on selected mode if available
                          const selectedMode = transactionModes?.find(m => m.id === value)
                          if (selectedMode && selectedMode.code) {
                            // For custom transaction modes, use CUSTOM type and include RTIS metadata
                            if (!selectedMode.isSystem) {
                              handleInputChange('transactionType', 'CUSTOM' as any)
                              
                              // Check if transaction mode has RTIS metadata or enable RTIS by default for custom modes
                              const modeMetadata = selectedMode.metadata as Record<string, any> | null
                              const rtisMetadata = modeMetadata?.rtis || {
                                enabled: true,
                                settlementMode: 'instant'
                              }
                              
                              // Set metadata with RTIS configuration for custom transaction modes
                              handleInputChange('metadata', {
                                rtis: rtisMetadata,
                                transactionModeCode: selectedMode.code,
                                transactionModeName: selectedMode.name
                              } as any)
                            } else {
                              // For system modes, map transaction mode code to transaction type
                              const codeToType: Record<string, string> = {
                                'WALLET_TO_MNO': 'WALLET_TO_MNO',
                                'WALLET_TO_BANK': 'WALLET_TO_BANK',
                                'MNO_TO_WALLET': 'MNO_TO_WALLET',
                                'BANK_TO_WALLET': 'BANK_TO_WALLET',
                                'BILL_PAYMENT': 'BILL_PAYMENT',
                                'WALLET_TO_WALLET': 'WALLET_TO_WALLET',
                              }
                              const mappedType = codeToType[selectedMode.code] || form.transactionType
                              handleInputChange('transactionType', mappedType as any)
                              // Clear metadata for system modes
                              handleInputChange('metadata', undefined)
                            }
                          }
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionModes && transactionModes.length > 0 ? (
                            transactionModes
                              .map((mode) => (
                                <SelectItem key={mode.id} value={mode.id}>
                                  {mode.displayName} ({mode.code})
                                  {mode.description && ` - ${mode.description}`}
                                </SelectItem>
                              ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-gray-500">Loading transaction modes...</div>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium text-blue-600">Required:</span> Select the transaction mode this tariff applies to. This provides more granular control than transaction types.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="transactionType">Transaction Type *</Label>
                      <Select 
                        value={form.transactionType} 
                        onValueChange={(value) => handleInputChange('transactionType', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {form.tariffType === 'INTERNAL' ? (
                            <>
                              <SelectItem value="WALLET_TO_WALLET">Wallet to Wallet</SelectItem>
                              <SelectItem value="WALLET_TO_INTERNAL_MERCHANT">Wallet to Internal Merchant</SelectItem>
                              <SelectItem value="WALLET_INIT">Wallet Initialization</SelectItem>
                              <SelectItem value="SCHOOL_FEES">School Fees</SelectItem>
                              <SelectItem value="FEE_CHARGE">Fee Charge</SelectItem>
                              <SelectItem value="REVERSAL">Reversal</SelectItem>
                              <SelectItem value="CUSTOM">Custom</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="DEPOSIT">Deposit</SelectItem>
                              <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                              <SelectItem value="BILL_PAYMENT">Bill Payment</SelectItem>
                              <SelectItem value="SCHOOL_FEES">School Fees</SelectItem>
                              <SelectItem value="WALLET_TO_EXTERNAL_MERCHANT">Wallet to External Merchant</SelectItem>
                              <SelectItem value="MERCHANT_WITHDRAWAL">Merchant Withdrawal</SelectItem>
                              <SelectItem value="MERCHANT_TO_WALLET">Merchant to Wallet</SelectItem>
                              <SelectItem value="WALLET_TO_MNO">Wallet to MNO</SelectItem>
                              <SelectItem value="WALLET_TO_UTILITY">Wallet to Utility</SelectItem>
                              <SelectItem value="WALLET_TO_BANK">Wallet to Bank</SelectItem>
                              <SelectItem value="BANK_TO_WALLET">Bank to Wallet</SelectItem>
                              <SelectItem value="MNO_TO_WALLET">MNO to Wallet</SelectItem>
                              <SelectItem value="CARD_TO_WALLET">Card to Wallet</SelectItem>
                              <SelectItem value="CUSTOM">Custom</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Used for backward compatibility. Transaction mode takes precedence.
                      </p>
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
                      <>
                        <div>
                          <Label htmlFor="partnerType">Partner Type *</Label>
                          <Select 
                            value={form.partnerType || ''} 
                            onValueChange={(value) => {
                              handleInputChange('partnerType', value)
                              // Clear partner selections when switching types
                              handleInputChange('partnerId', undefined)
                              handleInputChange('apiPartnerId', undefined)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select partner type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EXTERNAL_PARTNER">External Payment Partner</SelectItem>
                              <SelectItem value="API_PARTNER">API Partner (Gateway)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {form.partnerType === 'EXTERNAL_PARTNER' && (
                          <div>
                            <Label htmlFor="partnerId">External Payment Partner *</Label>
                            <Select 
                              value={form.partnerId || ''} 
                              onValueChange={(value) => {
                                handleInputChange('partnerId', value)
                                handleInputChange('apiPartnerId', undefined)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an external payment partner" />
                              </SelectTrigger>
                              <SelectContent>
                                {partners.length === 0 ? (
                                  <div className="px-2 py-1.5 text-sm text-gray-500">No partners available</div>
                                ) : (
                                  partners.map((partner) => (
                                    <SelectItem key={partner.id} value={partner.id}>
                                      {partner.partnerName} ({partner.partnerCode})
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {form.partnerType === 'API_PARTNER' && (
                          <div>
                            <Label htmlFor="apiPartnerId">API Partner (Gateway) *</Label>
                            <Select 
                              value={form.apiPartnerId || ''} 
                              onValueChange={(value) => {
                                handleInputChange('apiPartnerId', value)
                                handleInputChange('partnerId', undefined)
                                // API partners typically use percentage fees, so default to PERCENTAGE
                                if (form.feeType === 'FIXED') {
                                  handleInputChange('feeType', 'PERCENTAGE')
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an API partner" />
                              </SelectTrigger>
                              <SelectContent>
                                {apiPartners.length === 0 ? (
                                  <div className="px-2 py-1.5 text-sm text-gray-500">No API partners available</div>
                                ) : (
                                  apiPartners.map((partner) => (
                                    <SelectItem key={partner.id} value={partner.id}>
                                      {partner.partnerName} {partner.country ? `(${partner.country})` : ''}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                              API partners are gateway partners who use RukaPay to send money. 
                              <span className="font-medium text-blue-600"> Note: API partners typically use percentage-based fees.</span>
                            </p>
                          </div>
                        )}
                      </>
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
                          placeholder={form.partnerType === 'API_PARTNER' ? "2.5 (for 2.5%)" : "0.01"}
                          min="0"
                          max={form.partnerType === 'API_PARTNER' ? "100" : "1"}
                          step={form.partnerType === 'API_PARTNER' ? "0.1" : "0.001"}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {form.partnerType === 'API_PARTNER' 
                            ? 'Enter as percentage (e.g., 2.5 for 2.5%). Will be converted to decimal automatically.'
                            : 'Enter as decimal (0.01 = 1%)'
                          }
                        </p>
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

function CreateTariffPageContent() {
  return <CreateTariffPage />
}

export default function CreateTariffPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08163d] mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    }>
      <CreateTariffPageContent />
    </Suspense>
  )
} 