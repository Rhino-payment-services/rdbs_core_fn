"use client"
import React, { useEffect, useRef, useState } from 'react'
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
import { TARIFF_CHANNEL_ALL, TARIFF_CHANNEL_OPTIONS } from '@/lib/constants/tariff-channels'
import type { CreateTariffForm } from './types'
import { mapTariffToForm, type ApiTariffRecord } from './mapTariffToForm'
import { buildTariffSubmitPayload } from './buildTariffSubmitPayload'
import { TransactionModeSelect } from './TransactionModeSelect'
import { transactionModeDescription } from './transactionModeLabels'
import { AlertTriangle } from 'lucide-react'
import {
  DASHBOARD_MAIN_CLASS,
  dashboardFormShellClass,
} from '@/lib/constants/dashboard-layout'

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

const NETWORK_TELECOM_BANK_CHARGE: Record<'MTN' | 'AIRTEL', number> = {
  MTN: 1.5,
  AIRTEL: 2,
}

function computeMnoRukapayFee(
  feePercentage: number | undefined,
  telecomBankCharge: number | undefined,
): number {
  return Number((Number(feePercentage ?? 0) - Number(telecomBankCharge ?? 0)).toFixed(4))
}

export type TariffFormPageProps = {
  mode: 'create' | 'edit'
  tariffId?: string
}

export function TariffFormPage({ mode, tariffId }: TariffFormPageProps) {
  const isEdit = mode === 'edit'
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  
  // Get apiPartnerId from query params if present
  const apiPartnerIdFromQuery = searchParams?.get('apiPartnerId')
  
  const { hasPermission } = usePermissions()
  const canCreateTariffs = hasPermission(PERMISSIONS.TARIFF_CREATE)
  const canUpdateTariffs = hasPermission(PERMISSIONS.TARIFF_UPDATE)
  const canSubmit = isEdit ? canUpdateTariffs : canCreateTariffs
  
  const [form, setForm] = useState<CreateTariffForm>({
    name: '',
    description: '',
    tariffType: apiPartnerIdFromQuery ? 'EXTERNAL' : 'INTERNAL',
    transactionType: 'WALLET_TO_WALLET',
    network: undefined,
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
    governmentTax: 0,
    institutionSpreadRukapayBps: 0,
    institutionSpreadNexenBps: 0,
    channel: TARIFF_CHANNEL_ALL,
  })

  // Fetch transaction modes for selection
  const { data: transactionModes, isLoading: transactionModesLoading } = useTransactionModes({ isActive: true })

  // Calculate total fee amount (create external); edit may use stored feeAmount for FIXED
  const splitTotal =
    (form.partnerFee || 0) + (form.rukapayFee || 0) + (form.telecomBankCharge || 0)
  const totalFeeAmount =
    isEdit && form.tariffType === 'EXTERNAL' && form.feeType === 'FIXED'
      ? form.feeAmount || splitTotal
      : splitTotal

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
        const base =
          tabParam === 'external' && form.apiPartnerId
            ? `/dashboard/finance/tariffs-new?tab=external&partner=api:${form.apiPartnerId}`
            : `/dashboard/finance/tariffs-new?tab=${tabParam}`
        router.push(subTabParam ? `${base}` : base)
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
  const prevNetworkRef = useRef<string | undefined>(undefined)
  const skipMnoAutoCalcRef = useRef(true)

  // Tracks which tariff has been hydrated into form state.
  // A ref (not state) is used deliberately: mutating it during render doesn't
  // schedule an extra re-render, so the guard below calls only ONE setState
  // (setForm), which is the safe in-render pattern React documents.
  const hydratedTariffIdRef = useRef<string | null>(null)
  const modeReconciledTariffIdRef = useRef<string | null>(null)

  const {
    data: existingTariff,
    isLoading: tariffLoading,
    error: tariffLoadError,
  } = useQuery({
    queryKey: ['tariff', tariffId],
    queryFn: async () => {
      const res = await api.get(`/finance/tariffs/${tariffId}`)
      const body = res.data as { data?: ApiTariffRecord } & ApiTariffRecord
      return (body?.data ?? body) as ApiTariffRecord
    },
    enabled: isEdit && !!tariffId,
  })

  // ─── Derived-state initialisation ────────────────────────────────────────────
  // React allows calling setState during render when guarded by a changed-value
  // check (see React docs: "Storing information from previous renders").
  // React discards the in-progress render output and immediately re-renders with
  // the new form state, so Select components ALWAYS see the correct value on
  // their very first visible render — no async effects or key-remounting needed.
  //
  // IMPORTANT: only ONE setState call (setForm) is made here. The guard uses a
  // ref so its mutation does not itself trigger a re-render — using a state
  // variable for the guard would produce two batched-or-sequential setState
  // calls, which can leave form at defaults if not batched together.
  if (isEdit && existingTariff?.id && hydratedTariffIdRef.current !== existingTariff.id) {
    hydratedTariffIdRef.current = existingTariff.id
    modeReconciledTariffIdRef.current = null
    prevNetworkRef.current = existingTariff.network ?? undefined
    skipMnoAutoCalcRef.current = true
    // Hydrate immediately even if modes are still loading so core fields always prefill.
    setForm(mapTariffToForm(existingTariff, transactionModes))
  } else if (
    isEdit &&
    existingTariff?.id &&
    transactionModes?.length &&
    modeReconciledTariffIdRef.current !== existingTariff.id
  ) {
    modeReconciledTariffIdRef.current = existingTariff.id
    const remapped = mapTariffToForm(existingTariff, transactionModes)
    setForm((prev) => {
      if (
        prev.transactionModeId === remapped.transactionModeId &&
        prev.tariffType === remapped.tariffType &&
        prev.transactionType === remapped.transactionType
      ) {
        return prev
      }
      return {
        ...prev,
        tariffType: remapped.tariffType,
        transactionType: remapped.transactionType,
        transactionModeId: remapped.transactionModeId,
        metadata: remapped.metadata,
      }
    })
  }
  // ─────────────────────────────────────────────────────────────────────────────

  // Reset skipMnoAutoCalcRef so MNO fee auto-calc works after hydration.
  // Each MNO effect runs once right after the hydration render; they each check
  // skipMnoAutoCalcRef and also have their own equality guards so they won't
  // overwrite correctly stored fee values. Reset here so they work normally
  // thereafter when the user changes tariff type, network, or fee percentage.
  useEffect(() => {
    if (!isEdit) return
    const t = setTimeout(() => { skipMnoAutoCalcRef.current = false }, 0)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingTariff?.id, transactionModes])

  // When navigating between edit pages, reset the hydration guard so the new
  // tariff's data is picked up by the derived-state block above.
  useEffect(() => {
    hydratedTariffIdRef.current = null
    modeReconciledTariffIdRef.current = null
    skipMnoAutoCalcRef.current = true
  }, [tariffId])

  const updateTariffMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.put(`/finance/tariffs/${tariffId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariffs'] })
      queryClient.invalidateQueries({ queryKey: ['tariff', tariffId] })
      toast.success('Tariff updated successfully')
      router.push('/dashboard/finance/tariffs-new')
    },
    onError: (error: unknown) => {
      const err = error as { message?: string; response?: { data?: { message?: string } } }
      toast.error(err?.message || err?.response?.data?.message || 'Failed to update tariff')
    },
  })

  const isExternalMnoToWallet =
    form.tariffType === 'EXTERNAL' && form.transactionType === 'MNO_TO_WALLET'
  const showPercentLabels = form.feeType === 'PERCENTAGE'

  // Prefill telecom charge from network default only when network changes
  useEffect(() => {
    if (skipMnoAutoCalcRef.current) return
    if (!isExternalMnoToWallet || !form.network) {
      prevNetworkRef.current = undefined
      return
    }

    if (form.network === prevNetworkRef.current) {
      return
    }

    const telecomCharge = NETWORK_TELECOM_BANK_CHARGE[form.network]
    prevNetworkRef.current = form.network

    setForm((prev) => ({
      ...prev,
      telecomBankCharge: telecomCharge,
      rukapayFee: computeMnoRukapayFee(prev.feePercentage, telecomCharge),
    }))
  }, [isExternalMnoToWallet, form.network])

  // Always recalculate RukaPay fee when fee percentage or telecom charge changes
  useEffect(() => {
    if (skipMnoAutoCalcRef.current) return
    if (!isExternalMnoToWallet || form.feePercentage === undefined || form.feePercentage === null) {
      return
    }

    const computedRukapayFee = computeMnoRukapayFee(form.feePercentage, form.telecomBankCharge)

    setForm((prev) => {
      if (prev.rukapayFee === computedRukapayFee) {
        return prev
      }
      return { ...prev, rukapayFee: computedRukapayFee }
    })
  }, [isExternalMnoToWallet, form.feePercentage, form.telecomBankCharge])

  useEffect(() => {
    if (skipMnoAutoCalcRef.current) return
    const isExternalMnoToWallet = form.tariffType === 'EXTERNAL' && form.transactionType === 'MNO_TO_WALLET'
    if (!isExternalMnoToWallet || !form.network || form.feePercentage === undefined || form.feePercentage === null) {
      return
    }

    const telecomCharge = NETWORK_TELECOM_BANK_CHARGE[form.network]
    const computedRukapayFee = Number((Number(form.feePercentage) - telecomCharge).toFixed(4))

    setForm((prev) => {
      if (prev.telecomBankCharge === telecomCharge && prev.rukapayFee === computedRukapayFee) {
        return prev
      }
      return {
        ...prev,
        telecomBankCharge: telecomCharge,
        rukapayFee: computedRukapayFee,
      }
    })
  }, [form.tariffType, form.transactionType, form.network, form.feePercentage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name) {
      toast.error('Please fill in the tariff name')
      return
    }

    if (!isEdit && !form.transactionModeId) {
      toast.error('Transaction mode is required')
      return
    }

    const isExternalMnoToWallet = form.tariffType === 'EXTERNAL' && form.transactionType === 'MNO_TO_WALLET'
    const effectiveFeeType = isExternalMnoToWallet ? 'PERCENTAGE' : form.feeType

    const externalFeeTotal =
      form.tariffType === 'EXTERNAL'
        ? isEdit && form.feeType === 'FIXED'
          ? form.feeAmount
          : totalFeeAmount
        : form.feeAmount

    const currentFeeAmount = externalFeeTotal

    if (effectiveFeeType === 'FIXED' && currentFeeAmount < 0) {
      toast.error('Fee amount cannot be negative for fixed fees')
      return
    }

    if (
      effectiveFeeType === 'PERCENTAGE' &&
      (form.feePercentage === undefined || form.feePercentage === null || form.feePercentage < 0)
    ) {
      toast.error('Fee percentage is required for percentage fees (use 0 for a free tariff)')
      return
    }

    if (effectiveFeeType === 'HYBRID' && (currentFeeAmount <= 0 || !form.feePercentage || form.feePercentage <= 0)) {
      toast.error('Both fee amount and percentage must be greater than 0 for hybrid fees')
      return
    }

    if (form.tariffType === 'EXTERNAL' && !form.partnerId && !form.apiPartnerId) {
      toast.error('Partner is required for external tariffs')
      return
    }

    if (form.tariffType === 'EXTERNAL' && form.transactionType === 'MNO_TO_WALLET' && !form.network) {
      toast.error('Network is required for EXTERNAL MNO_TO_WALLET tariffs.')
      return
    }

    // Validate transactionType is one of the allowed values
    const allowedTransactionTypes = [
      'DEPOSIT', 'WITHDRAWAL', 'BILL_PAYMENT', 'WALLET_CREATION', 'WALLET_INIT',
      'WALLET_TO_INTERNAL_MERCHANT', 'WALLET_TO_EXTERNAL_MERCHANT', 'MERCHANT_WITHDRAWAL',
      'MERCHANT_TO_WALLET', 'WALLET_TO_WALLET', 'WALLET_TO_MNO', 'WALLET_TO_UTILITY',
      'MNO_TO_WALLET', 'WALLET_TO_MERCHANT', 'WALLET_TO_BANK', 'BANK_TO_WALLET',
      'CARD_TO_WALLET', 'REVERSAL', 'FEE_CHARGE', 'CUSTOM',
      'WALLET_TO_PARTNER_INSTITUTION', 'PARTNER_INSTITUTION_TO_WALLET',
    ]
    
    // If transactionType is not in allowed list, default to CUSTOM
    const validTransactionType = allowedTransactionTypes.includes(form.transactionType) 
      ? form.transactionType 
      : 'CUSTOM'
    
    if (form.transactionType !== validTransactionType) {
      console.warn(`Invalid transactionType "${form.transactionType}" replaced with "CUSTOM"`)
    }

    const submitData = buildTariffSubmitPayload(
      { ...form, transactionType: validTransactionType as CreateTariffForm['transactionType'] },
      externalFeeTotal,
    )

    if (isEdit) {
      const { transactionModeId: _omit, ...updatePayload } = submitData
      updateTariffMutation.mutate(updatePayload)
    } else {
      createTariffMutation.mutate(submitData as unknown as CreateTariffForm)
    }
  }

  const handleInputChange = (
    field: keyof CreateTariffForm,
    value: string | number | undefined | Record<string, unknown>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleTelecomBankChargeChange = (value: number) => {
    if (isExternalMnoToWallet) {
      setForm((prev) => ({
        ...prev,
        telecomBankCharge: value,
        rukapayFee: computeMnoRukapayFee(prev.feePercentage, value),
      }))
      return
    }

    handleInputChange('telecomBankCharge', value)
  }

  if (!canSubmit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don&apos;t have permission to {isEdit ? 'edit' : 'create'} tariffs.
          </p>
        </div>
      </div>
    )
  }

  if (isEdit && (tariffLoading || transactionModesLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08163d]" />
      </div>
    )
  }

  if (isEdit && (tariffLoadError || !existingTariff)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Tariff not found</p>
          <Link href="/dashboard/finance/tariffs-new">
            <Button variant="outline">Back to tariffs</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isPending =
    createTariffMutation.isPending || updateTariffMutation.isPending

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className={DASHBOARD_MAIN_CLASS}>
        <div className={dashboardFormShellClass}>
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
              <span className="text-gray-900 font-medium">
                {isEdit ? 'Edit Tariff' : 'Create Tariff'}
              </span>
            </nav>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link href="/dashboard/finance/tariffs-new">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Tariffs
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isEdit ? 'Edit Tariff' : 'Create New Tariff'}
            </h1>
            <p className="text-gray-600">
              {isEdit
                ? 'Update fee structure, partner assignment, and tier settings'
                : 'Configure a new transaction fee structure'}
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Tariff Details</CardTitle>
              <CardDescription>
                {isEdit ? 'Update tariff configuration' : 'Fill in the details for the new tariff'}
              </CardDescription>
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
                            handleInputChange('network', undefined)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tariff type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INTERNAL">Internal (RukaPay operations)</SelectItem>
                          <SelectItem value="EXTERNAL">External (Partner integrations)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="transactionModeId">
                        Transaction Mode{isEdit ? '' : ' *'}
                      </Label>
                      <TransactionModeSelect
                        modes={transactionModes}
                        value={form.transactionModeId || ''}
                        onValueChange={(value) => {
                          handleInputChange('transactionModeId', value)
                          const selectedMode = transactionModes?.find((m) => m.id === value)
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
                                'WALLET_TO_PARTNER_INSTITUTION': 'WALLET_TO_PARTNER_INSTITUTION',
                                'PARTNER_INSTITUTION_TO_WALLET': 'PARTNER_INSTITUTION_TO_WALLET',
                              }
                              const mappedType = codeToType[selectedMode.code] || form.transactionType
                              handleInputChange('transactionType', mappedType as any)
                              if (form.tariffType === 'EXTERNAL' && mappedType === 'MNO_TO_WALLET') {
                                handleInputChange('feeType', 'PERCENTAGE')
                              }
                              if (mappedType !== 'MNO_TO_WALLET') {
                                handleInputChange('network', undefined)
                              }
                              // Clear metadata for system modes
                              handleInputChange('metadata', undefined)
                            }
                          }
                        }}
                      />
                      {transactionModeDescription(
                        transactionModes?.find((m) => m.id === form.transactionModeId),
                      ) && (
                        <p className="text-xs text-gray-600 mt-1.5 rounded-md bg-gray-50 border border-gray-100 px-2.5 py-2 leading-relaxed">
                          {transactionModeDescription(
                            transactionModes?.find((m) => m.id === form.transactionModeId),
                          )}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {isEdit ? (
                          <>
                            Resolved from saved tariff when possible. Changing the mode updates
                            transaction type metadata on save only when a mode is selected.
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-blue-600">Required:</span> Select the
                            transaction mode this tariff applies to.
                          </>
                        )}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="transactionType">Transaction Type *</Label>
                      <Select 
                        value={form.transactionType} 
                      onValueChange={(value) => {
                        handleInputChange('transactionType', value)
                        if (form.tariffType === 'EXTERNAL' && value === 'MNO_TO_WALLET') {
                          handleInputChange('feeType', 'PERCENTAGE')
                        }
                        if (value !== 'MNO_TO_WALLET') {
                          handleInputChange('network', undefined)
                        }
                      }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction type" />
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
                              <SelectItem value="WALLET_TO_PARTNER_INSTITUTION">
                                Wallet to Partner Institution (SACCO settlement in)
                              </SelectItem>
                              <SelectItem value="PARTNER_INSTITUTION_TO_WALLET">
                                Partner Institution to Wallet (SACCO settlement out)
                              </SelectItem>
                              <SelectItem value="CUSTOM">Custom</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Used for backward compatibility. Transaction mode takes precedence.
                      </p>
                    </div>

                    {form.tariffType === 'EXTERNAL' && form.transactionType === 'MNO_TO_WALLET' && (
                      <div>
                        <Label htmlFor="network">Network *</Label>
                        <Select
                          value={form.network || ''}
                          onValueChange={(value) => handleInputChange('network', value as 'MTN' | 'AIRTEL')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select network" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MTN">MTN</SelectItem>
                            <SelectItem value="AIRTEL">AIRTEL</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          Create separate tariffs for MTN and AIRTEL.
                        </p>
                      </div>
                    )}

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

                    <div>
                      <Label htmlFor="channel">Channel (optional)</Label>
                      <Select
                        value={form.channel ?? ''}
                        onValueChange={(value) => handleInputChange('channel', value)}
                      >
                        <SelectTrigger id="channel">
                          <SelectValue placeholder="All channels (default)" />
                        </SelectTrigger>
                        <SelectContent>
                          {TARIFF_CHANNEL_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value || 'all'} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {form.transactionType === 'WALLET_TO_INTERNAL_MERCHANT' ? (
                          <>
                            Use <span className="font-medium">Card / NFC</span> for card payment fees; leave as{' '}
                            <span className="font-medium">All channels</span> for a default (e.g. free APP/USSD) tariff.
                            Multiple tariffs per type are allowed (one per channel).
                          </>
                        ) : (
                          <>Restrict this tariff to a specific channel, or leave as all channels.</>
                        )}
                      </p>
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
                      <Select
                        value={form.feeType}
                        onValueChange={(value) => handleInputChange('feeType', value)}
                        disabled={form.tariffType === 'EXTERNAL' && form.transactionType === 'MNO_TO_WALLET'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIXED">Fixed Amount</SelectItem>
                          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                          <SelectItem value="TIERED">Tiered</SelectItem>
                          <SelectItem value="HYBRID">Fixed + Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                      {form.tariffType === 'EXTERNAL' && form.transactionType === 'MNO_TO_WALLET' && (
                        <p className="text-xs text-gray-500 mt-1">
                          EXTERNAL MNO_TO_WALLET tariffs use percentage fees.
                        </p>
                      )}
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
                          value={isEdit ? form.feeAmount : totalFeeAmount}
                          onChange={
                            isEdit
                              ? (e) =>
                                  handleInputChange('feeAmount', parseFloat(e.target.value) || 0)
                              : undefined
                          }
                          disabled={!isEdit}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {isEdit
                            ? 'Total fixed fee (should match partner + RukaPay + telecom split when configured)'
                            : 'Calculated automatically from partner fees'}
                        </p>
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

                {form.transactionType === 'WALLET_TO_PARTNER_INSTITUTION' && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        SACCO / NEXEN net — principal spread (metadata)
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        Enter <strong>basis points</strong> of the member&apos;s principal withheld before SACCO
                        settlement and NEXEN posting (100 bps = 1%). The subscriber is still charged{' '}
                        <strong>principal + customer fee</strong> from the fee section above. Use 0 and 0 so SACCO
                        receives the full principal. If no tariff matches this flow, the system also credits full
                        principal.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="institutionSpreadRukapayBps">RukaPay spread (bps)</Label>
                        <Input
                          id="institutionSpreadRukapayBps"
                          type="number"
                          min={0}
                          max={10000}
                          step={1}
                          value={form.institutionSpreadRukapayBps ?? 0}
                          onChange={(e) =>
                            handleInputChange(
                              'institutionSpreadRukapayBps',
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">Stored as metadata.institutionSpreadBps.rukapay</p>
                      </div>
                      <div>
                        <Label htmlFor="institutionSpreadNexenBps">NEXEN spread (bps)</Label>
                        <Input
                          id="institutionSpreadNexenBps"
                          type="number"
                          min={0}
                          max={10000}
                          step={1}
                          value={form.institutionSpreadNexenBps ?? 0}
                          onChange={(e) =>
                            handleInputChange(
                              'institutionSpreadNexenBps',
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                        />
                        <p className="text-xs text-gray-500 mt-1">Stored as metadata.institutionSpreadBps.nexen</p>
                      </div>
                    </div>
                  </div>
                )}

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
                        <Label htmlFor="rukapayFee">
                          {showPercentLabels ? 'RukaPay Fee (%)' : 'RukaPay Fee'}
                        </Label>
                        <Input
                          id="rukapayFee"
                          type="number"
                          value={form.rukapayFee}
                          onChange={(e) => handleInputChange('rukapayFee', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          step="0.001"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {isExternalMnoToWallet
                            ? 'Auto-calculated as Fee Percentage − Telecom/Bank Charge whenever either changes. Can be negative.'
                            : 'Decimal percentage. Can be negative (e.g., -0.002).'}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="telecomBankCharge">
                          {showPercentLabels ? 'Telecom/Bank Charge (%)' : 'Telecom/Bank Charge'}
                        </Label>
                        <Input
                          id="telecomBankCharge"
                          type="number"
                          value={form.telecomBankCharge}
                          onChange={(e) =>
                            handleTelecomBankChargeChange(parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                          step="0.001"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {isExternalMnoToWallet
                            ? 'Defaults from network (MTN 1.5%, AIRTEL 2%) but editable when rates change.'
                            : 'Optional decimal percentage (e.g., 0.001 = 0.1%).'}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="governmentTax">
                          {showPercentLabels ? 'Government Tax (%)' : 'Government Tax'}
                        </Label>
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
                          <span>
                            {' '}
                            + Gov Tax: {(form.governmentTax || 0).toFixed(2)}
                            {showPercentLabels ? '%' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                  <Link href="/dashboard/finance/tariffs-new">
                    <Button variant="outline" type="button">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isPending
                      ? isEdit
                        ? 'Saving...'
                        : 'Creating...'
                      : isEdit
                        ? 'Save changes'
                        : 'Create Tariff'}
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
