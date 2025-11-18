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
  isActive?: boolean
  isSuspended?: boolean
  supportedServices?: string[]
  costPerTransaction?: number
  priority?: number
  failoverPriority?: number
  successRate?: number
  averageResponseTime?: number
  geographicRegions?: string[]
}

interface NetworkMapping {
  network: string
  mappingId: string | null
  primaryPartner: Partner | null
  secondaryPartner: Partner | null
  totalMappings: number
}

interface TransactionMapping {
  transactionType: string
  primaryPartner?: Partner | null
  secondaryPartner?: Partner | null
  totalMappings: number
  network?: string
  networks?: string[] // For MNO transactions with multiple network mappings
  networkMappings?: NetworkMapping[] // For MNO transactions - separate mappings per network
}

interface SwitchForm {
  serviceType: string
  primaryPartnerId: string
  reason: string
  network?: string // For MNO transactions
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

  const canManageMapping = hasPermission(PERMISSIONS.TARIFF_UPDATE) || hasPermission(PERMISSIONS.TARIFF_CREATE)

  // External transaction types (Partner integrations)
  const externalTransactionTypes = {
    'BILL_PAYMENT': {
      name: 'Utility Bills',
      description: 'Electricity, Water, TV subscriptions',
      icon: Zap,
      color: 'bg-purple-600',
      tabId: 'utility-bills',
      category: 'Utilities'
    },
    'WALLET_TO_MNO': {
      name: 'Wallet to MNO',
      description: 'Wallet to Mobile Network Operator transfers',
      icon: Smartphone,
      color: 'bg-green-500',
      tabId: 'wallet-to-mno',
      category: 'Mobile Money'
    },
    'MNO_TO_WALLET': {
      name: 'MNO to Wallet',
      description: 'Mobile Network Operator to Wallet transfers',
      icon: Smartphone,
      color: 'bg-blue-500',
      tabId: 'mno-to-wallet',
      category: 'Mobile Money'
    },
    'WALLET_TO_BANK': {
      name: 'Bank Transfers',
      description: 'Wallet to Bank account transfers',
      icon: Building2,
      color: 'bg-orange-500',
      tabId: 'bank-transfers',
      category: 'Banking'
    },
  }

  // Fetch current transaction mappings
  const { data: mappingsData, isLoading: mappingsLoading, error: mappingsError, refetch } = useQuery({
    queryKey: ['transaction-mappings'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/external-payment-partners/mapping/transaction-types')
        // The API returns the mappings directly, not wrapped in a 'mappings' property
        return response.data
      } catch (error: any) {
        // If API fails, return empty mappings structure
        if (error.response?.status === 404 || error.response?.status === 401) {
          console.log('Transaction mappings API not available, returning empty structure')
          return {}
        }
        throw error
      }
    },
    staleTime: 2 * 60 * 1000,
  })

  // Fetch available partners
  const { data: partnersData, isLoading: partnersLoading, error: partnersError, refetch: refetchPartners } = useQuery({
    queryKey: ['external-payment-partners'],
    queryFn: async () => {
      console.log('Fetching partners from API...')
      try {
        const response = await api.get('/admin/external-payment-partners')
        const rawPartners = response.data || []
        
        console.log('Raw partners from API:', rawPartners)
        
        // Transform the API response to match our interface
        const transformedPartners = rawPartners.map((partner: any) => ({
          id: partner.id || '',
          partnerName: partner.partnerName || partner.name || 'Unknown Partner',
          partnerCode: partner.partnerCode || partner.code || 'UNKNOWN',
          isActive: partner.isActive ?? true,
          isSuspended: partner.isSuspended ?? false,
          supportedServices: partner.supportedServices || [],
          costPerTransaction: partner.costPerTransaction || 0,
          priority: partner.priority || 1,
          failoverPriority: partner.failoverPriority || 1,
          successRate: partner.successRate || 0,
          averageResponseTime: partner.averageResponseTime || 0,
          geographicRegions: partner.geographicRegions || []
        }))
        
        console.log('Transformed partners:', transformedPartners)
        
        return transformedPartners
      } catch (error) {
        console.error('Error fetching partners:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
  })
  
  console.log('Partners query state:', { partnersData, partnersLoading, partnersError })


  const partners = partnersData || []
  const mappings = mappingsData || {}
  
  console.log('Component render - partnersData:', partnersData)
  console.log('Component render - partners:', partners)
  console.log('Component render - mappingsData:', mappingsData)

  // Use real data from backend only - ensure it's truly empty
  const displayMappings = mappings || {}
  
  // Calculate stats from real data - be explicit about empty state
  const activeMappingsCount = Object.keys(displayMappings).filter(key => {
    const mapping = (displayMappings as any)[key]
    return mapping && mapping.primaryPartner
  }).length
  
  const availablePartnersCount = partners.filter((p: Partner) => 
    p.isActive && !p.isSuspended
  ).length
  
  const highRiskCount = Object.keys(displayMappings).filter(key => 
    (displayMappings as any)[key]?.impactAnalysis?.riskLevel === 'HIGH'
  ).length

  

  // Switch partner mutation
  const switchPartnerMutation = useMutation({
    mutationFn: async (data: SwitchForm) => {
      console.log('Switch partner API call - data:', data)
      console.log('Switch partner API call - endpoint: /admin/external-payment-partners/switch')
      
      const payload: any = {
        serviceType: data.serviceType,
        primaryPartnerId: data.primaryPartnerId,
        reason: data.reason
      }
      
      // Include network for MNO transactions
      if (data.network) {
        payload.network = data.network
      }
      
      console.log('Switch partner API call - payload:', payload)
      
      const response = await api.post('/admin/external-payment-partners/switch', payload)
      return response.data
    },
    onSuccess: (data) => {
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

  const handleSwitchPartner = (mapping: TransactionMapping | NetworkMapping, transactionType?: string) => {
    // Check if it's a NetworkMapping (from MNO transactions)
    const isNetworkMapping = 'network' in mapping && mapping.network;
    const network = isNetworkMapping ? (mapping as NetworkMapping).network : undefined;
    const primaryPartner = isNetworkMapping 
      ? (mapping as NetworkMapping).primaryPartner 
      : (mapping as TransactionMapping).primaryPartner;
    
    setSelectedMapping(mapping as TransactionMapping)
    setSwitchForm({
      serviceType: transactionType || (mapping as TransactionMapping).transactionType,
      primaryPartnerId: primaryPartner?.id || '',
      reason: '',
      network: network
    })
    // Refetch partners data to ensure we have the latest information
    refetchPartners()
    setSwitchDialogOpen(true)
  }

  const handleSubmitSwitch = async () => {
    if (!switchForm.primaryPartnerId || !switchForm.reason.trim()) {
      toast.error('Please select a partner and provide a reason for the switch.')
      return
    }

    // Validate network for MNO transactions
    const isMno = switchForm.serviceType === 'MNO_TO_WALLET' || switchForm.serviceType === 'WALLET_TO_MNO'
    if (isMno && !switchForm.network) {
      toast.error('Please ensure network is specified for MNO transactions.')
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
    // Guard against undefined or empty serviceType
    if (!serviceType) {
      console.warn('getAvailablePartners called with undefined or empty serviceType')
      return []
    }
    
    console.log('getAvailablePartners called with serviceType:', serviceType)
    console.log('Available partners:', partners)
    
    const filteredPartners = partners.filter((partner: Partner) => {
      console.log(`Checking partner ${partner.partnerName} (${partner.partnerCode}):`)
      console.log('- isActive:', partner.isActive)
      console.log('- isSuspended:', partner.isSuspended)
      console.log('- supportedServices:', partner.supportedServices)
      console.log('- supports serviceType:', partner.supportedServices?.includes(serviceType))
      
      // Check if partner is active and not suspended
      if (!partner.isActive || partner.isSuspended) {
        console.log('Partner filtered out: not active or suspended')
        return false
      }
      
      // Check if partner supports this service type
      // Handle both singular and plural forms (e.g., BILL_PAYMENT vs BILL_PAYMENTS)
      // Also handle specific service type mappings
      const serviceTypeVariations = [
        serviceType,
        serviceType + 'S',
        ...(serviceType.length > 0 ? [serviceType.slice(0, -1)] : []), // Remove last 'S' if present (only if string has length)
        // Specific mappings
        ...(serviceType === 'BILL_PAYMENT' ? ['BILL_PAYMENTS', 'UTILITIES'] : []),
        ...(serviceType === 'WALLET_TO_MNO' ? ['WALLET_TO_MNO', 'MNO_DISBURSEMENT'] : []),
        ...(serviceType === 'MNO_TO_WALLET' ? ['MNO_TO_WALLET', 'MNO_TOPUP', 'WALLET_TOPUP_PULL'] : []),
        ...(serviceType === 'WALLET_TO_BANK' ? ['WALLET_TO_BANK', 'BANK_TRANSFER', 'BANK_TRANSFERS'] : []),
      ]
      
      const supportsServiceType = partner.supportedServices && 
        serviceTypeVariations.some(variation => partner.supportedServices!.includes(variation))
      
      if (!supportsServiceType) {
        console.log('Partner filtered out: does not support service type')
        console.log(`Looking for variations:`, serviceTypeVariations)
        return false
      }
      
      console.log('Partner passed all filters')
      return true
    })
    
    console.log('Filtered partners:', filteredPartners)
    return filteredPartners
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // Force refresh both queries
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['transaction-mappings'] }),
        queryClient.invalidateQueries({ queryKey: ['external-payment-partners'] })
      ])
      toast.success('Transaction mappings refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh transaction mappings')
    } finally {
      setIsLoading(false)
    }
  }

  const isMnoTransaction = (transactionType: string) => {
    return transactionType === 'MNO_TO_WALLET' || transactionType === 'WALLET_TO_MNO'
  }

  const MappingTable = ({ type, mapping }: { type: string, mapping: TransactionMapping | null }) => {
    const config = externalTransactionTypes[type as keyof typeof externalTransactionTypes]
    if (!config) return null

    const availablePartners = getAvailablePartners(type)
    const isMno = isMnoTransaction(type)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center`}>
              <config.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{config.name}</h3>
              <p className="text-gray-600">{config.description}</p>
            </div>
          </div>
          {isMno && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Network-based routing
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/finance/partners/configure-mapping')}
              >
                <Edit className="w-4 h-4 mr-2" />
                Configure Networks
              </Button>
            </div>
          )}
        </div>
        
        {!mapping || (isMno && (!mapping.networkMappings || mapping.networkMappings.length === 0)) ? (
          <Card>
            <CardContent className="py-8 text-center">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isMno ? 'No Network Mappings Configured' : 'No Partner Assigned'}
              </h3>
              <p className="text-gray-500 mb-4">
                {isMno 
                  ? 'This MNO transaction type requires separate mappings for each network (MTN and Airtel).'
                  : 'This transaction type has no active partner mapping.'
                }
              </p>
              {isMno && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4 max-w-md mx-auto mb-4">
                  <p className="text-xs text-yellow-700">
                    <strong>Required Networks:</strong> You need to create separate mappings for:
                    <ul className="list-disc list-inside mt-2">
                      <li>MTN network</li>
                      <li>Airtel network</li>
                    </ul>
                  </p>
                </div>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 max-w-sm mx-auto">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Partner assignments are managed through the backend API. 
                  Configure partners in the database first.
                </p>
              </div>
              {canManageMapping && availablePartners.length > 0 && (
                <Button 
                  onClick={() => router.push('/dashboard/finance/partners/configure-mapping')}
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isMno ? 'Configure Network Mappings' : 'Assign Partner'}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Current Partner</TableHead>
                  {isMno && <TableHead>Network</TableHead>}
                  <TableHead>Performance</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isMno && mapping.networkMappings ? (
                  // For MNO transactions, show separate row for each network
                  mapping.networkMappings.map((networkMapping: NetworkMapping) => (
                    <TableRow key={networkMapping.network}>
                      <TableCell>
                        {networkMapping.primaryPartner ? (
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-600">
                                {networkMapping.primaryPartner.partnerCode?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{networkMapping.primaryPartner.partnerName}</p>
                              <p className="text-sm text-gray-500">
                                {networkMapping.primaryPartner.geographicRegions && networkMapping.primaryPartner.geographicRegions.length > 0 
                                  ? networkMapping.primaryPartner.geographicRegions.join(', ')
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
                        <Badge variant="secondary">{networkMapping.network}</Badge>
                      </TableCell>
                      <TableCell>
                        {networkMapping.primaryPartner ? (
                          <div className="text-sm">
                            <p className="font-medium">{networkMapping.primaryPartner.successRate || 0}% success</p>
                            <p className="text-gray-500">{networkMapping.primaryPartner.averageResponseTime || 0}ms avg</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {networkMapping.primaryPartner ? (
                          <span className="font-medium">{networkMapping.primaryPartner.costPerTransaction || 0} UGX</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {networkMapping.primaryPartner ? (
                          <div className="text-sm">
                            <p>Priority: {networkMapping.primaryPartner.priority}</p>
                            <p className="text-gray-500">Failover: {networkMapping.primaryPartner.failoverPriority}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {networkMapping.primaryPartner ? (
                          <Badge variant={networkMapping.primaryPartner.isActive ? "default" : "secondary"}>
                            {networkMapping.primaryPartner.isActive ? 'Active' : 'Inactive'}
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
                              {networkMapping.mappingId && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/finance/partners/configure-mapping?edit=${networkMapping.mappingId}`)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleSwitchPartner(networkMapping, type)}
                              >
                                <ArrowLeftRight className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // For non-MNO transactions, show single row
                  <TableRow>
                    <TableCell>
                      {mapping.primaryPartner ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">
                              {mapping.primaryPartner.partnerCode?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{mapping.primaryPartner.partnerName}</p>
                            <p className="text-sm text-gray-500">
                              {mapping.primaryPartner.geographicRegions && mapping.primaryPartner.geographicRegions.length > 0 
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
                )}
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

  // Show empty state when no mappings are available
  if (!mappingsLoading && (!displayMappings || Object.keys(displayMappings).length === 0)) {
    return (
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
                    onClick={() => router.push('/dashboard/finance/partners/configure-mapping')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Configure Mapping
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

            {/* Empty State */}
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <ArrowLeftRight className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Transaction Mappings</h3>
                <p className="text-gray-500 mb-4">No transaction mappings have been configured yet.</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4 max-w-md mx-auto">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-yellow-800">Backend API Required</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        The transaction mapping API endpoints need to be implemented in the backend:
                      </p>
                      <ul className="text-xs text-yellow-700 mt-2 list-disc list-inside">
                        <li>GET /admin/external-payment-partners/mapping/transaction-types</li>
                        <li>POST /admin/external-payment-partners/switch</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <PermissionGuard 
      permissions={[PERMISSIONS.TARIFF_VIEW]} 
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                  <p className="text-gray-500 mb-4">You don't have permission to view this page.</p>
                  <p className="text-sm text-gray-400">Required permission: TARIFF_VIEW</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      }
      showFallback={true}
    >
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
                    onClick={() => router.push('/dashboard/finance/partners/configure-mapping')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Configure Mapping
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
                        {mappingsLoading ? '...' : activeMappingsCount}
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
                        {availablePartnersCount}
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
                        {highRiskCount}
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
                    Select a new partner for {selectedMapping?.transactionType} transactions
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
                        {(() => {
                          const availablePartners = selectedMapping?.transactionType 
                            ? getAvailablePartners(selectedMapping.transactionType) 
                            : []
                          console.log('Dialog - selectedMapping:', selectedMapping)
                          console.log('Dialog - availablePartners:', availablePartners)
                          console.log('Dialog - all partners:', partners)
                          
                          // Fallback: if no partners found, show all active partners
                          const allActivePartners = partners.filter((p: Partner) => p.isActive && !p.isSuspended)
                          const partnersToShow = availablePartners.length > 0 ? availablePartners : allActivePartners
                          
                          console.log('Dialog - availablePartners.length:', availablePartners.length)
                          console.log('Dialog - allActivePartners.length:', allActivePartners.length)
                          console.log('Dialog - partnersToShow:', partnersToShow)
                          console.log('Dialog - will show fallback?', availablePartners.length === 0)
                          
                          return partnersToShow.length > 0 ? (
                            partnersToShow.map((partner: Partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold">{partner.partnerCode?.charAt(0) || '?'}</span>
                                </div>
                                <span className="font-medium">{partner.partnerCode || 'Unknown'}</span>
                                <span className="text-gray-500">- {partner.partnerName || 'Unknown Partner'}</span>
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
                        )
                        })()}
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