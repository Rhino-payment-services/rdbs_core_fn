"use client"
import React, { useState } from 'react'
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
  Globe,
  DollarSign,
  Activity,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

interface CreatePartnerForm {
  partnerName: string
  partnerCode: string
  baseUrl: string
  isActive: boolean
  supportedServices: string[]
  rateLimit: number
  dailyQuota: number
  monthlyQuota: number
  costPerTransaction: number
  priority: number
  failoverPriority: number
  geographicRegions: string[]
  description?: string
}

const CreatePartnerPage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  
  const { hasPermission } = usePermissions()
  const canCreatePartners = hasPermission(PERMISSIONS.TARIFFS_CREATE) || hasPermission(PERMISSIONS.TARIFFS_UPDATE) || hasPermission(PERMISSIONS.TARIFFS_DELETE)
  
  const [form, setForm] = useState<CreatePartnerForm>({
    partnerName: '',
    partnerCode: '',
    baseUrl: '',
    isActive: true,
    supportedServices: [],
    rateLimit: 100,
    dailyQuota: 10000,
    monthlyQuota: 300000,
    costPerTransaction: 500,
    priority: 1,
    failoverPriority: 2,
    geographicRegions: ['UGANDA'],
    description: ''
  })

  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['UGANDA'])

  const availableServices = [
    'UTILITIES',
    'BILL_PAYMENTS',
    'WALLET_TO_MNO',
    'MNO_TO_WALLET',
    'WALLET_TO_BANK',
    'AIRTIME',
    'DATA_BUNDLES',
    'UTILITY_VALIDATION'
  ]

  const availableRegions = [
    'UGANDA',
    'KENYA',
    'TANZANIA',
    'RWANDA',
    'BURUNDI',
    'SOUTH_SUDAN'
  ]

  const createPartnerMutation = useMutation({
    mutationFn: (data: CreatePartnerForm) => api.post('/admin/external-payment-partners', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-payment-partners'] })
      toast.success('Partner created successfully!')
      router.push('/dashboard/finance/partners')
    },
    onError: (error: any) => {
      console.error('Failed to create partner:', error)
      toast.error(error.response?.data?.message || 'Failed to create partner.')
    },
    onSettled: () => {
      setIsLoading(false)
    }
  })

  const handleInputChange = (field: keyof CreatePartnerForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleServiceToggle = (service: string) => {
    const newServices = selectedServices.includes(service)
      ? selectedServices.filter(s => s !== service)
      : [...selectedServices, service]
    
    setSelectedServices(newServices)
    setForm(prev => ({ ...prev, supportedServices: newServices }))
  }

  const handleRegionToggle = (region: string) => {
    const newRegions = selectedRegions.includes(region)
      ? selectedRegions.filter(r => r !== region)
      : [...selectedRegions, region]
    
    setSelectedRegions(newRegions)
    setForm(prev => ({ ...prev, geographicRegions: newRegions }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Basic validation
    if (!form.partnerName || !form.partnerCode || !form.baseUrl) {
      toast.error('Please fill in all required fields.')
      setIsLoading(false)
      return
    }

    if (selectedServices.length === 0) {
      toast.error('Please select at least one supported service.')
      setIsLoading(false)
      return
    }

    if (selectedRegions.length === 0) {
      toast.error('Please select at least one geographic region.')
      setIsLoading(false)
      return
    }

    try {
      await createPartnerMutation.mutateAsync(form)
    } catch (error) {
      // Error handled by mutation's onError
    }
  }

  if (!canCreatePartners) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-4">You do not have permission to create partners.</p>
                <Button onClick={() => router.push('/dashboard/finance/partners')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Partners
                </Button>
              </div>
            </div>
          </div>
        </main>
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
              <Link href="/dashboard" className="hover:text-gray-800">Dashboard</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/dashboard/finance" className="hover:text-gray-800">Finance</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/dashboard/finance/partners" className="hover:text-gray-800">Partners</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-gray-900">Create Partner</span>
            </nav>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="outline" onClick={() => router.push('/dashboard/finance/partners')} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Partners
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Partner</h1>
              <p className="text-gray-600">Add a new external payment partner to the system</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Partner Information</span>
                </CardTitle>
                <CardDescription>
                  Basic information about the payment partner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="partnerName">Partner Name *</Label>
                    <Input
                      id="partnerName"
                      value={form.partnerName}
                      onChange={(e) => handleInputChange('partnerName', e.target.value)}
                      placeholder="e.g., ABC Payment Services"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="partnerCode">Partner Code *</Label>
                    <Input
                      id="partnerCode"
                      value={form.partnerCode}
                      onChange={(e) => handleInputChange('partnerCode', e.target.value.toUpperCase())}
                      placeholder="e.g., ABC"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="baseUrl">Base URL *</Label>
                  <Input
                    id="baseUrl"
                    value={form.baseUrl}
                    onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                    placeholder="https://api.partner.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the partner and their services"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive">Active Partner</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Services & Configuration</span>
                </CardTitle>
                <CardDescription>
                  Configure supported services and operational parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Supported Services *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {availableServices.map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={service}
                          checked={selectedServices.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={service} className="text-sm">
                          {service.replace(/_/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="rateLimit">Rate Limit (requests/min)</Label>
                    <Input
                      id="rateLimit"
                      type="number"
                      value={form.rateLimit}
                      onChange={(e) => handleInputChange('rateLimit', parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dailyQuota">Daily Quota</Label>
                    <Input
                      id="dailyQuota"
                      type="number"
                      value={form.dailyQuota}
                      onChange={(e) => handleInputChange('dailyQuota', parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyQuota">Monthly Quota</Label>
                    <Input
                      id="monthlyQuota"
                      type="number"
                      value={form.monthlyQuota}
                      onChange={(e) => handleInputChange('monthlyQuota', parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Pricing & Priority</span>
                </CardTitle>
                <CardDescription>
                  Set pricing and priority levels for partner routing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="costPerTransaction">Cost Per Transaction (UGX)</Label>
                  <Input
                    id="costPerTransaction"
                    type="number"
                    value={form.costPerTransaction}
                    onChange={(e) => handleInputChange('costPerTransaction', parseInt(e.target.value))}
                    min="0"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={form.priority.toString()} onValueChange={(value) => handleInputChange('priority', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            Level {level} {level === 1 ? '(Highest)' : level === 10 ? '(Lowest)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="failoverPriority">Failover Priority</Label>
                    <Select value={form.failoverPriority.toString()} onValueChange={(value) => handleInputChange('failoverPriority', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            Level {level} {level === 1 ? '(Primary)' : level === 5 ? '(Last Resort)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Geographic Coverage</span>
                </CardTitle>
                <CardDescription>
                  Select the regions where this partner operates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableRegions.map((region) => (
                    <div key={region} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={region}
                        checked={selectedRegions.includes(region)}
                        onChange={() => handleRegionToggle(region)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={region} className="text-sm">
                        {region.replace(/_/g, ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/finance/partners')}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Partner'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default CreatePartnerPage
