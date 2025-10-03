"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Archive, 
  Search, 
  Building2,
  Activity,
  Globe,
  DollarSign,
  ChevronRight,
  RefreshCw,
  AlertTriangle
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
  suspendedAt?: string
  suspensionReason?: string
  supportedServices: string[]
  baseUrl: string
  apiKey?: string
  secretKey?: string
  additionalConfig?: any
  rateLimit: number
  dailyQuota?: number
  monthlyQuota?: number
  costPerTransaction?: number
  costCurrency: string
  averageResponseTime?: number
  successRate?: number
  lastHealthCheck?: string
  priority: number
  failoverPriority: number
  geographicRegions: string[]
  description?: string
  website?: string
  contactEmail?: string
  contactPhone?: string
  createdBy?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
  currentTransactionTypes: Record<string, boolean>
  activeRoutingRules: number
}

const PartnersPage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { hasPermission } = usePermissions()
  const canManagePartners = hasPermission(PERMISSIONS.TARIFFS_CREATE) || hasPermission(PERMISSIONS.TARIFFS_UPDATE) || hasPermission(PERMISSIONS.TARIFFS_DELETE)

  // Fetch external payment partners from real backend API
  const { data: partnersData, isLoading: partnersLoading, error: partnersError, refetch } = useQuery({
    queryKey: ['external-payment-partners'],
    queryFn: async () => {
      const response = await api.get('/admin/external-payment-partners')
      return response.data || []
    },
    staleTime: 5 * 60 * 1000,
  })

  const partners: Partner[] = partnersData || []

  // Filter partners based on search and status
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.partnerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (partner.contactEmail && partner.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && partner.isActive && !partner.isSuspended) ||
                         (statusFilter === 'suspended' && partner.isSuspended) ||
                         (statusFilter === 'inactive' && !partner.isActive)
    return matchesSearch && matchesStatus
  })

  const handleArchivePartner = async (partnerId: string) => {
    if (!window.confirm('Are you sure you want to delete this partner?')) {
      return
    }

    setIsLoading(true)
    try {
      await api.delete(`/admin/external-payment-partners/${partnerId}`)
      toast.success('Partner deleted successfully!')
      refetch()
    } catch (error) {
      console.error('Failed to delete partner:', error)
      toast.error('Failed to delete partner.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    refetch()
  }

  const getStatusBadge = (partner: Partner) => {
    if (partner.isSuspended) {
      return <Badge variant="destructive">Suspended</Badge>
    } else if (partner.isActive) {
      return <Badge variant="default">Active</Badge>
    } else {
      return <Badge variant="secondary">Inactive</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString()}`
  }

  if (partnersError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Partners</h1>
                <p className="text-gray-600 mb-4">Unable to retrieve partner data from the server.</p>
                <Button onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Try Again
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
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/dashboard" className="hover:text-gray-800">Dashboard</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/dashboard/finance" className="hover:text-gray-800">Finance</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-gray-900">Partners</span>
            </nav>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="outline" onClick={() => router.push('/dashboard/finance')} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Finance
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">External Payment Partners</h1>
              <p className="text-gray-600">Manage external payment partners (ABC, Pegasus, etc.) and their configurations</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {canManagePartners && (
                <Button onClick={() => router.push('/dashboard/finance/partners/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Partner
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Total Partners</h3>
                    <p className="text-2xl font-bold text-blue-600">{partners.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Active Partners</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {partners.filter(p => p.isActive && !p.isSuspended).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Suspended</h3>
                    <p className="text-2xl font-bold text-orange-600">
                      {partners.filter(p => p.isSuspended).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Avg Cost/Transaction</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {partners.length > 0 
                        ? `UGX ${Math.round(partners.reduce((sum, p) => sum + (p.costPerTransaction || 0), 0) / partners.length).toLocaleString()}`
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Partners</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Search by name or code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Label htmlFor="status">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Partners</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partners Table */}
          <Card>
            <CardHeader>
              <CardTitle>Partners ({filteredPartners.length})</CardTitle>
              <CardDescription>
                External payment partners and their current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {partnersLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading partners...</p>
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="py-8 text-center">
                  <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Partners Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No partners match your current filters.' 
                      : 'No partners have been configured yet.'
                    }
                  </p>
                  {canManagePartners && (
                    <Button className="mt-4" onClick={() => router.push('/dashboard/finance/partners/create')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Partner
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Cost/Transaction</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Regions</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{partner.partnerName}</div>
                              <div className="text-sm text-gray-500">{partner.baseUrl}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{partner.partnerCode}</Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(partner)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {partner.supportedServices.slice(0, 2).map((service) => (
                                <Badge key={service} variant="secondary" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                              {partner.supportedServices.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{partner.supportedServices.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {partner.costPerTransaction ? `UGX ${partner.costPerTransaction.toLocaleString()}` : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Primary: {partner.priority}</div>
                              <div>Failover: {partner.failoverPriority}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {partner.geographicRegions.slice(0, 2).map((region) => (
                                <Badge key={region} variant="outline" className="text-xs">
                                  {region}
                                </Badge>
                              ))}
                              {partner.geographicRegions.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{partner.geographicRegions.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(partner.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {canManagePartners && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => router.push(`/dashboard/finance/partners/edit/${partner.id}`)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleArchivePartner(partner.id)}
                                    disabled={isLoading}
                                  >
                                    <Archive className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default PartnersPage
