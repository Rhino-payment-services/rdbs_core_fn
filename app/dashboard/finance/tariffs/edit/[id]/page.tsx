"use client"
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Save, 
  X, 
  ChevronRight,
  Building2,
  Zap,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

interface TariffForm {
  name: string
  description: string
  transactionType: string
  feeType: 'FIXED' | 'PERCENTAGE' | 'HYBRID' | 'TIERED'
  feeAmount: number
  feePercentage: number
  minAmount: number
  maxAmount: number
  userTypes: string[]
  profileTypes: string[]
  partnerId?: string
  isActive: boolean
  reason?: string
}

interface Tariff {
  id: string
  name: string
  description: string
  transactionType: string
  feeType: string
  feeAmount: number
  feePercentage: number
  minAmount: number
  maxAmount: number
  userTypes: string[]
  profileTypes: string[]
  partnerId?: string
  isActive: boolean
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'REJECTED'
  createdBy: string
  approvedBy?: string
  createdAt: string
  updatedAt: string
}

const EditTariffPage = () => {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const tariffId = params.id as string
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { hasPermission, userRole } = usePermissions()
  const canEditTariffs = hasPermission(PERMISSIONS.TARIFFS_UPDATE) || userRole === 'SUPER_ADMIN'
  const canApproveTariffs = hasPermission(PERMISSIONS.TARIFFS_APPROVE) || userRole === 'SUPER_ADMIN'
  
  const [form, setForm] = useState<TariffForm>({
    name: '',
    description: '',
    transactionType: '',
    feeType: 'FIXED',
    feeAmount: 0,
    feePercentage: 0,
    minAmount: 0,
    maxAmount: 0,
    userTypes: [],
    profileTypes: [],
    partnerId: '',
    isActive: true,
    reason: ''
  })

  const [selectedUserTypes, setSelectedUserTypes] = useState<string[]>([])
  const [selectedProfileTypes, setSelectedProfileTypes] = useState<string[]>([])

  // Fetch tariff data
  const { data: tariff, isLoading: tariffLoading, error: tariffError } = useQuery({
    queryKey: ['tariff', tariffId],
    queryFn: () => api.get(`/finance/tariffs/${tariffId}`).then(res => res.data),
    enabled: !!tariffId,
  })

  // Fetch partners for external tariffs
  const { data: partners } = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.get('/admin/partners').then(res => res.data),
  })

  // Update form when tariff data loads
  useEffect(() => {
    if (tariff) {
      setForm({
        name: tariff.name || '',
        description: tariff.description || '',
        transactionType: tariff.transactionType || '',
        feeType: tariff.feeType || 'FIXED',
        feeAmount: tariff.feeAmount || 0,
        feePercentage: tariff.feePercentage || 0,
        minAmount: tariff.minAmount || 0,
        maxAmount: tariff.maxAmount || 0,
        userTypes: tariff.userTypes || [],
        profileTypes: tariff.profileTypes || [],
        partnerId: tariff.partnerId || '',
        isActive: tariff.isActive ?? true,
        reason: ''
      })
      setSelectedUserTypes(tariff.userTypes || [])
      setSelectedProfileTypes(tariff.profileTypes || [])
    }
  }, [tariff])

  const updateTariffMutation = useMutation({
    mutationFn: (data: TariffForm) => api.put(`/finance/tariffs/${tariffId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariff', tariffId] })
      queryClient.invalidateQueries({ queryKey: ['tariffs'] })
      toast.success('Tariff updated successfully! Pending approval.')
      router.push('/dashboard/finance/tariffs')
    },
    onError: (error: any) => {
      console.error('Failed to update tariff:', error)
      toast.error(error.response?.data?.message || 'Failed to update tariff.')
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })

  const approveTariffMutation = useMutation({
    mutationFn: (data: { approved: boolean; reason?: string }) => 
      api.post(`/finance/tariffs/${tariffId}/approve`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tariff', tariffId] })
      queryClient.invalidateQueries({ queryKey: ['tariffs'] })
      toast.success('Tariff approval processed successfully!')
      router.push('/dashboard/finance/tariffs')
    },
    onError: (error: any) => {
      console.error('Failed to process approval:', error)
      toast.error(error.response?.data?.message || 'Failed to process approval.')
    },
    onSettled: () => {
      setIsSubmitting(false)
    }
  })

  const handleInputChange = (field: keyof TariffForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleUserTypeToggle = (userType: string) => {
    const newUserTypes = selectedUserTypes.includes(userType)
      ? selectedUserTypes.filter(t => t !== userType)
      : [...selectedUserTypes, userType]
    
    setSelectedUserTypes(newUserTypes)
    setForm(prev => ({ ...prev, userTypes: newUserTypes }))
  }

  const handleProfileTypeToggle = (profileType: string) => {
    const newProfileTypes = selectedProfileTypes.includes(profileType)
      ? selectedProfileTypes.filter(t => t !== profileType)
      : [...selectedProfileTypes, profileType]
    
    setSelectedProfileTypes(newProfileTypes)
    setForm(prev => ({ ...prev, profileTypes: newProfileTypes }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Basic validation
    if (!form.name || !form.transactionType || !form.feeType) {
      toast.error('Please fill in all required fields.')
      setIsSubmitting(false)
      return
    }

    if (selectedUserTypes.length === 0) {
      toast.error('Please select at least one user type.')
      setIsSubmitting(false)
      return
    }

    if (selectedProfileTypes.length === 0) {
      toast.error('Please select at least one profile type.')
      setIsSubmitting(false)
      return
    }

    try {
      await updateTariffMutation.mutateAsync(form)
    } catch (error) {
      // Error handled by mutation's onError
    }
  }

  const handleApproval = async (approved: boolean) => {
    if (!form.reason && !approved) {
      toast.error('Please provide a reason for rejection.')
      return
    }

    setIsSubmitting(true)
    try {
      await approveTariffMutation.mutateAsync({ 
        approved, 
        reason: form.reason 
      })
    } catch (error) {
      // Error handled by mutation's onError
    }
  }

  const availableUserTypes = ['SUBSCRIBER', 'MERCHANT', 'AGENT']
  const availableProfileTypes = ['INDIVIDUAL', 'BUSINESS', 'CORPORATE']
  const availableFeeTypes = ['FIXED', 'PERCENTAGE', 'HYBRID', 'TIERED']
  const availableTransactionTypes = [
    'WALLET_TO_WALLET',
    'WALLET_TO_MOBILE',
    'WALLET_TO_BANK',
    'WALLET_TO_INTERNAL_MERCHANT',
    'WALLET_TO_EXTERNAL_MERCHANT',
    'BILL_PAYMENT',
    'MERCHANT_WITHDRAWAL'
  ]

  if (!canEditTariffs && !canApproveTariffs) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-4">You do not have permission to edit tariffs.</p>
                <Button onClick={() => router.push('/dashboard/finance/tariffs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tariffs
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (tariffLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (tariffError || !tariff) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Tariff Not Found</h1>
                <p className="text-gray-600 mb-4">The requested tariff could not be found.</p>
                <Button onClick={() => router.push('/dashboard/finance/tariffs')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tariffs
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const isPendingApproval = tariff.status === 'PENDING_APPROVAL'
  const isApprover = canApproveTariffs && isPendingApproval

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/dashboard" className="hover:text-gray-800">Dashboard</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/dashboard/finance" className="hover:text-gray-800">Finance</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/dashboard/finance/tariffs" className="hover:text-gray-800">Tariffs</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-gray-900">Edit Tariff</span>
            </nav>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="outline" onClick={() => router.push('/dashboard/finance/tariffs')} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tariffs
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Tariff</h1>
              <p className="text-gray-600">Update tariff configuration and pricing</p>
            </div>
          </div>

          {/* Status Banner */}
          {isPendingApproval && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-orange-900">Pending Approval</h3>
                    <p className="text-sm text-orange-700">
                      This tariff is awaiting approval. Changes will require re-approval.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Tariff Information</span>
                </CardTitle>
                <CardDescription>
                  Basic information about the tariff
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Tariff Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Mobile Money Transfer Fee"
                      required
                      disabled={isApprover}
                    />
                  </div>
                  <div>
                    <Label htmlFor="transactionType">Transaction Type *</Label>
                    <Select 
                      value={form.transactionType} 
                      onValueChange={(value) => handleInputChange('transactionType', value)}
                      disabled={isApprover}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTransactionTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the tariff"
                    rows={3}
                    disabled={isApprover}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={isApprover}
                  />
                  <Label htmlFor="isActive">Active Tariff</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Pricing Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure fee structure and amount ranges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="feeType">Fee Type *</Label>
                  <Select 
                    value={form.feeType} 
                    onValueChange={(value) => handleInputChange('feeType', value)}
                    disabled={isApprover}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFeeTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="feeAmount">Fixed Fee Amount (UGX)</Label>
                    <Input
                      id="feeAmount"
                      type="number"
                      value={form.feeAmount}
                      onChange={(e) => handleInputChange('feeAmount', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      disabled={isApprover}
                    />
                  </div>
                  <div>
                    <Label htmlFor="feePercentage">Fee Percentage (%)</Label>
                    <Input
                      id="feePercentage"
                      type="number"
                      value={form.feePercentage}
                      onChange={(e) => handleInputChange('feePercentage', parseFloat(e.target.value))}
                      min="0"
                      max="100"
                      step="0.01"
                      disabled={isApprover}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="minAmount">Minimum Amount (UGX)</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      value={form.minAmount}
                      onChange={(e) => handleInputChange('minAmount', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      disabled={isApprover}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAmount">Maximum Amount (UGX)</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      value={form.maxAmount}
                      onChange={(e) => handleInputChange('maxAmount', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      disabled={isApprover}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Target Users</span>
                </CardTitle>
                <CardDescription>
                  Select user types and profile types this tariff applies to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>User Types *</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {availableUserTypes.map((userType) => (
                      <div key={userType} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={userType}
                          checked={selectedUserTypes.includes(userType)}
                          onChange={() => handleUserTypeToggle(userType)}
                          className="rounded border-gray-300"
                          disabled={isApprover}
                        />
                        <Label htmlFor={userType} className="text-sm">
                          {userType}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Profile Types *</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {availableProfileTypes.map((profileType) => (
                      <div key={profileType} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={profileType}
                          checked={selectedProfileTypes.includes(profileType)}
                          onChange={() => handleProfileTypeToggle(profileType)}
                          className="rounded border-gray-300"
                          disabled={isApprover}
                        />
                        <Label htmlFor={profileType} className="text-sm">
                          {profileType}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {form.transactionType.includes('EXTERNAL') && (
                  <div>
                    <Label htmlFor="partnerId">Partner</Label>
                    <Select 
                      value={form.partnerId} 
                      onValueChange={(value) => handleInputChange('partnerId', value)}
                      disabled={isApprover}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners?.map((partner: any) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.partnerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approval Section */}
            {isApprover && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Approval Decision</span>
                  </CardTitle>
                  <CardDescription>
                    Review and approve or reject this tariff change
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="reason">Reason for Decision</Label>
                    <Textarea
                      id="reason"
                      value={form.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="Provide reason for approval or rejection"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/finance/tariffs')}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              
              {isApprover ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleApproval(false)}
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Rejecting...' : 'Reject'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleApproval(true)}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Approving...' : 'Approve'}
                  </Button>
                </>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Updating...' : 'Update Tariff'}
                </Button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default EditTariffPage
