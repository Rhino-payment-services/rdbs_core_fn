'use client'

import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ArrowLeft, 
  ArrowLeftRight, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Users,
  Zap,
  Building2,
  CreditCard,
  Smartphone,
  ChevronRight,
  Eye,
  Edit,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

interface Partner {
  id: string
  partnerName: string
  partnerCode: string
  isActive: boolean
  isSuspended: boolean
  supportedServices: string[]
  costPerTransaction: number
  priority: number
  failoverPriority: number
  successRate: number
  averageResponseTime: number
  geographicRegions: string[]
}

interface TransactionMapping {
  serviceType: string
  primaryPartner: Partner | null
  alternativePartners: Partner[]
  impactAnalysis: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    estimatedCostChange: number
    estimatedResponseTimeChange: number
    affectedTransactions: number
  } | null
  lastSwitched: string | null
  switchedBy: string | null
  switchReason: string | null
}

interface SwitchForm {
  serviceType: string
  primaryPartnerId: string
  reason: string
}

const TransactionMappingPage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { hasPermission, userRole } = usePermissions()

  const [activeTab, setActiveTab] = useState('external')
  const [activeExternalTab, setActiveExternalTab] = useState('utility-bills')
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false)
  const [selectedMapping, setSelectedMapping] = useState<TransactionMapping | null>(null)
  const [switchForm, setSwitchForm] = useState<SwitchForm>({
    serviceType: '',
    primaryPartnerId: '',
    reason: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const canManageMapping = hasPermission(PERMISSIONS.TARIFFS_UPDATE) || hasPermission(PERMISSIONS.TARIFFS_CREATE)

  // External transaction types (Partner integrations)
  const externalTransactionTypes = {
    'BILL_PAYMENT': {
      name: 'Utility Bills',
      description: 'Electricity, Water, TV subscriptions',
      icon: Zap,
      color: 'bg-purple-600',
      tabId: 'utility-bills'
    },
    'WITHDRAWAL': {
      name: 'Wallet to MNO',
      description: 'Wallet to Mobile Network Operator transfers',
      icon: Smartphone,
      color: 'bg-green-500',
      tabId: 'wallet-to-mno'
    },
    'DEPOSIT': {
      name: 'MNO to Wallet',
      description: 'Mobile Network Operator to Wallet transfers',
      icon: Smartphone,
      color: 'bg-blue-500',
      tabId: 'mno-to-wallet'
    },
    'WALLET_TO_EXTERNAL_MERCHANT': {
      name: 'Bank Transfers',
      description: 'Wallet to Bank account transfers',
      icon: Building2,
      color: 'bg-orange-500',
      tabId: 'bank-transfers'
    }
  }

  // Fetch current transaction mappings
  const { data: mappingsData, isLoading: mappingsLoading, error: mappingsError, refetch } = useQuery({
    queryKey: ['transaction-mappings'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/external-payment-partners/mapping/transaction-types')
        return response.data
      } catch (error: any) {
        // If API fails, return empty mappings structure
        if (error.response?.status === 404 || error.response?.status === 401) {
          console.log('Transaction mappings API not available, using empty structure')
          return {
            timestamp: new Date().toISOString(),
            mappings: {}
          }
        }
        throw error
      }
    },
    staleTime: 2 * 60 * 1000,
  })

  // Fetch available partners
  const { data: partnersData } = useQuery({
    queryKey: ['external-payment-partners'],
    queryFn: async () => {
      const response = await api.get('/admin/external-payment-partners')
      return response.data || []
    },
    staleTime: 5 * 60 * 1000,
  })

  // Mock partners for demonstration when API is not available
  // NOTE: Performance metrics (successRate, averageResponseTime) are demo data
  // In production, these should come from actual transaction analytics in the database
  const mockPartners = [
    {
      id: 'mock-pegasus',
      partnerName: 'Pegasus Bill Payments',
      partnerCode: 'PEGASUS',
      isActive: true,
      isSuspended: false,
      supportedServices: ['BILL_PAYMENT', 'WITHDRAWAL'],
      costPerTransaction: 500,
      priority: 1,
      failoverPriority: 2,
      successRate: 98.5, // Demo data - should come from transaction analytics
      averageResponseTime: 1200, // Demo data - should come from transaction analytics
      geographicRegions: [] // Should come from backend partner configuration
    },
    {
      id: 'mock-abc',
      partnerName: 'ABC Payment Services',
      partnerCode: 'ABC',
      isActive: true,
      isSuspended: false,
      supportedServices: ['BILL_PAYMENT', 'DEPOSIT', 'WALLET_TO_EXTERNAL_MERCHANT'],
      costPerTransaction: 750,
      priority: 2,
      failoverPriority: 1,
      successRate: 96.2, // Demo data - should come from transaction analytics
      averageResponseTime: 1500, // Demo data - should come from transaction analytics
      geographicRegions: [] // Should come from backend partner configuration
    }
  ]

  const partners = partnersData && partnersData.length > 0 ? partnersData : mockPartners
  const mappings = mappingsData?.mappings || {}

  // Mock data for demonstration when API is not available
  // NOTE: Performance metrics are demo data - should come from transaction analytics
  // Geographic regions should come from backend partner configuration
  const mockMappings = {
    'BILL_PAYMENT': {
      serviceType: 'BILL_PAYMENT',
      primaryPartner: {
        id: 'mock-pegasus',
        partnerName: 'Pegasus Bill Payments',
        partnerCode: 'PEGASUS',
        isActive: true,
        isSuspended: false,
        supportedServices: ['BILL_PAYMENT'],
        costPerTransaction: 500,
        priority: 1,
        failoverPriority: 2,
        successRate: 98.5,
        averageResponseTime: 1200,
        geographicRegions: [] // Should come from backend partner configuration
      },
      alternativePartners: [{
        id: 'mock-abc',
        partnerName: 'ABC Payment Services',
        partnerCode: 'ABC',
        isActive: true,
        isSuspended: false,
        supportedServices: ['BILL_PAYMENT'],
        costPerTransaction: 750,
        priority: 2,
        failoverPriority: 1,
        successRate: 96.2,
        averageResponseTime: 1500,
        geographicRegions: [] // Should come from backend partner configuration
      }],
      impactAnalysis: {
        riskLevel: 'LOW' as const,
        estimatedCostChange: 0,
        estimatedResponseTimeChange: 0,
        affectedTransactions: 1250
      },
      lastSwitched: '2025-01-15T10:30:00Z',
      switchedBy: 'admin@rukapay.co.ug',
      switchReason: 'Performance optimization'
    },
    'WITHDRAWAL': {
      serviceType: 'WITHDRAWAL',
      primaryPartner: {
        id: 'mock-abc',
        partnerName: 'ABC Payment Services',
        partnerCode: 'ABC',
        isActive: true,
        isSuspended: false,
        supportedServices: ['WITHDRAWAL'],
        costPerTransaction: 750,
        priority: 1,
        failoverPriority: 2,
        successRate: 96.2,
        averageResponseTime: 1500,
        geographicRegions: [] // Should come from backend partner configuration
      },
      alternativePartners: [{
        id: 'mock-pegasus',
        partnerName: 'Pegasus Bill Payments',
        partnerCode: 'PEGASUS',
        isActive: true,
        isSuspended: false,
        supportedServices: ['WITHDRAWAL'],
        costPerTransaction: 500,
        priority: 2,
        failoverPriority: 1,
        successRate: 98.5,
        averageResponseTime: 1200,
        geographicRegions: [] // Should come from backend partner configuration
      }],
      impactAnalysis: {
        riskLevel: 'MEDIUM' as const,
        estimatedCostChange: 0,
        estimatedResponseTimeChange: 0,
        affectedTransactions: 850
      },
      lastSwitched: '2025-01-10T14:20:00Z',
      switchedBy: 'admin@rukapay.co.ug',
      switchReason: 'Cost optimization'
    }
  }

  // Use mock data if no real mappings available (force mock for demo)
  const displayMappings = mockMappings
  

  // Switch partner mutation
  const switchPartnerMutation = useMutation({
    mutationFn: async (data: SwitchForm) => {
      const response = await api.post('/admin/external-payment-partners/switch', {
        serviceType: data.serviceType,
        primaryPartnerId: data.primaryPartnerId,
        reason: data.reason
      })
      return response.data
    },
    onSuccess: () => {
      toast.success('Partner switched successfully')
      setSwitchDialogOpen(false)
      setSwitchForm({ serviceType: '', primaryPartnerId: '', reason: '' })
      queryClient.invalidateQueries({ queryKey: ['transaction-mappings'] })
    },
    onError: (error: any) => {
      console.error('Failed to switch partner:', error)
      toast.error(error.response?.data?.message || 'Failed to switch partner.')
    },
    onSettled: () => {
      setIsLoading(false)
    }
  })

  const handleSwitchPartner = (mapping: TransactionMapping) => {
    setSelectedMapping(mapping)
    setSwitchForm({
      serviceType: mapping.serviceType,
      primaryPartnerId: mapping.primaryPartner?.id || '',
      reason: ''
    })
    setSwitchDialogOpen(true)
  }

  const handleSubmitSwitch = async () => {
    if (!switchForm.primaryPartnerId || !switchForm.reason.trim()) {
      toast.error('Please select a partner and provide a reason for the switch.')
      return
    }

    setIsLoading(true)
    switchPartnerMutation.mutate(switchForm)
  }

  const getRiskBadge = (riskLevel: string) => {
    const variants = {
      LOW: 'default',
      MEDIUM: 'secondary',
      HIGH: 'destructive'
    } as const

    return (
      <Badge variant={variants[riskLevel as keyof typeof variants] || 'default'}>
        {riskLevel} Risk
      </Badge>
    )
  }

  const getAvailablePartners = (serviceType: string) => {
    return partners.filter((partner: Partner) => 
      partner.isActive && 
      !partner.isSuspended && 
      partner.supportedServices.includes(serviceType)
    )
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await refetch()
      toast.success('Transaction mappings refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh transaction mappings')
    } finally {
      setIsLoading(false)
    }
  }

  const MappingTable = ({ type, mapping }: { type: string, mapping: TransactionMapping | null }) => {
    const config = externalTransactionTypes[type as keyof typeof externalTransactionTypes]
    if (!config) return null

    const availablePartners = getAvailablePartners(type)

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 mb-6">
          <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center`}>
            <config.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{config.name}</h3>
            <p className="text-gray-600">{config.description}</p>
          </div>
        </div>
        
        {!mapping ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Partner Assigned</h3>
              <p className="text-gray-500 mb-4">This transaction type has no active partner mapping.</p>
              {canManageMapping && availablePartners.length > 0 && (
                <Button onClick={() => handleSwitchPartner({ serviceType: type, primaryPartner: null, alternativePartners: availablePartners, impactAnalysis: null, lastSwitched: null, switchedBy: null, switchReason: null })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Partner
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Current Partner</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    {mapping.primaryPartner ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">
                            {mapping.primaryPartner.partnerCode.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{mapping.primaryPartner.partnerName}</p>
                          <p className="text-sm text-gray-500">
                            {mapping.primaryPartner.geographicRegions.length > 0 
                              ? mapping.primaryPartner.geographicRegions.join(', ')
                              : 'Regions not configured'
                            }
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm text-gray-500">No partner assigned</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {mapping.primaryPartner ? (
                      <div className="text-sm">
                        <p className="font-medium">{mapping.primaryPartner.successRate || 0}% success</p>
                        <p className="text-gray-500">{mapping.primaryPartner.averageResponseTime || 0}ms avg</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {mapping.primaryPartner ? (
                      <span className="font-medium">{mapping.primaryPartner.costPerTransaction || 0} UGX</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {mapping.primaryPartner ? (
                      <div className="text-sm">
                        <p>Priority: {mapping.primaryPartner.priority}</p>
                        <p className="text-gray-500">Failover: {mapping.primaryPartner.failoverPriority}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {mapping.primaryPartner ? (
                      <Badge variant={mapping.primaryPartner.isActive ? "default" : "secondary"}>
                        {mapping.primaryPartner.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Unassigned</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {canManageMapping && (
                        <>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSwitchPartner(mapping)}
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }

  if (mappingsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (mappingsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Mappings</h3>
                <p className="text-gray-500 mb-4">Unable to fetch transaction mappings from the server.</p>
                <Button onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <PermissionGuard permissions={[PERMISSIONS.PARTNERS_VIEW, PERMISSIONS.PARTNERS_UPDATE]} fallback={<div>Access Denied</div>}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumbs */}
            <div className="mb-4">
              <nav className="flex items-center space-x-2 text-sm text-gray-600">
                <Link href="/dashboard/finance" className="hover:text-[#08163d]">
                  Finance
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-gray-900 font-medium">Transaction Mapping</span>
              </nav>
            </div>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Link href="/dashboard/finance">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Back to Finance
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Transaction Mapping</h1>
                    <p className="text-gray-600">Manage which external payment partner handles each transaction type</p>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        Demo Mode - Mock data (Performance metrics)
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/finance/partners')}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Manage Partners
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ArrowLeftRight className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Mappings</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Object.keys(displayMappings).filter(key => (displayMappings as any)[key]?.primaryPartner).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Available Partners</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {partners.filter((p: Partner) => p.isActive && !p.isSuspended).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">High Risk</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Object.keys(displayMappings).filter(key => (displayMappings as any)[key]?.impactAnalysis?.riskLevel === 'HIGH').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Clock className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {partners.length > 0 ? Math.round(partners.reduce((sum: number, p: Partner) => sum + (p.averageResponseTime || 0), 0) / partners.length) : 0}ms
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="external" className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>External Transaction Mappings ({Object.keys(externalTransactionTypes).length})</span>
                </TabsTrigger>
              </TabsList>

              {/* External Transaction Mappings Tab */}
              <TabsContent value="external">
                {mappingsLoading ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading transaction mappings...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Tabs value={activeExternalTab} onValueChange={setActiveExternalTab} className="space-y-6">
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(externalTransactionTypes).length}, 1fr)` }}>
                      {Object.keys(externalTransactionTypes).map((type) => {
                        const config = externalTransactionTypes[type as keyof typeof externalTransactionTypes]
                        return (
                          <TabsTrigger key={type} value={config.tabId} className="flex items-center space-x-2">
                            <config.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{config.name}</span>
                          </TabsTrigger>
                        )
                      })}
                    </TabsList>

                    {Object.keys(externalTransactionTypes).map((type) => {
                      const config = externalTransactionTypes[type as keyof typeof externalTransactionTypes]
                      const mapping = (displayMappings as any)[type] || null
                      return (
                        <TabsContent key={type} value={config.tabId}>
                          <MappingTable type={type} mapping={mapping} />
                        </TabsContent>
                      )
                    })}
                  </Tabs>
                )}
              </TabsContent>
            </Tabs>

            {/* Switch Partner Dialog */}
            <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Switch Partner</DialogTitle>
                  <DialogDescription>
                    Select a new partner for {selectedMapping?.serviceType} transactions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="partner">New Partner</Label>
                    <Select value={switchForm.primaryPartnerId} onValueChange={(value) => setSwitchForm(prev => ({ ...prev, primaryPartnerId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedMapping && getAvailablePartners(selectedMapping.serviceType).length > 0 ? (
                          getAvailablePartners(selectedMapping.serviceType).map((partner: Partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold">{partner.partnerCode.charAt(0)}</span>
                                </div>
                                <span className="font-medium">{partner.partnerCode}</span>
                                <span className="text-gray-500">- {partner.partnerName}</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-partners" disabled>
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              <span className="text-gray-500">No available partners</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason for Switch</Label>
                    <Textarea
                      id="reason"
                      placeholder="Explain why you're switching partners..."
                      value={switchForm.reason}
                      onChange={(e) => setSwitchForm(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSwitchDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitSwitch} disabled={isLoading}>
                    {isLoading ? 'Switching...' : 'Switch Partner'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </PermissionGuard>
  )
}

export default TransactionMappingPage