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
  Plus, 
  Edit, 
  Search, 
  Building2,
  Activity,
  Globe,
  Shield,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Key,
  Eye,
  Ban,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { useGatewayPartners, useSuspendGatewayPartner } from '@/lib/hooks/useGatewayPartners'

const GatewayPartnersPage = () => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { hasPermission } = usePermissions()
  const canManagePartners = hasPermission(PERMISSIONS.TARIFF_CREATE)

  // Fetch gateway partners
  const { data: partnersResponse, isLoading, error, refetch } = useGatewayPartners(1, 50)
  const partners = partnersResponse?.data || []
  const suspendPartner = useSuspendGatewayPartner()

  // Filter partners
  const filteredPartners = partners.filter((partner: any) => {
    const matchesSearch = 
      partner.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.country.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && partner.isActive && !partner.isSuspended) ||
      (statusFilter === 'suspended' && partner.isSuspended) ||
      (statusFilter === 'inactive' && !partner.isActive)
    
    return matchesSearch && matchesStatus
  })

  const handleSuspend = async (partnerId: string, isSuspended: boolean) => {
    const reason = isSuspended 
      ? prompt('Enter suspension reason:') || undefined
      : undefined

    if (isSuspended && !reason) return

    suspendPartner.mutate({ partnerId, isSuspended, reason })
  }

  const getStatusBadge = (partner: any) => {
    if (partner.isSuspended) {
      return <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" />Suspended</Badge>
    } else if (partner.isActive) {
      return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Active</Badge>
    } else {
      return <Badge variant="secondary">Inactive</Badge>
    }
  }

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      SILVER: 'bg-gray-500',
      GOLD: 'bg-yellow-500',
      PLATINUM: 'bg-purple-500',
    }
    return <Badge className={colors[tier] || 'bg-blue-500'}>{tier}</Badge>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Partners</h1>
                <p className="text-gray-600 mb-4">Unable to retrieve gateway partner data.</p>
                <Button onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
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
              <span className="font-semibold text-gray-900">Gateway Partners</span>
            </nav>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gateway Partners</h1>
              <p className="text-gray-600">Manage partners who use RukaPay as a gateway to send money to Uganda</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {canManagePartners && (
                <Button onClick={() => router.push('/dashboard/gateway-partners/create')}>
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
                    <h3 className="text-sm font-medium text-gray-500">Total Partners</h3>
                    <p className="text-2xl font-bold text-gray-900">{partners.length}</p>
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
                    <h3 className="text-sm font-medium text-gray-500">Active</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {partners.filter((p: any) => p.isActive && !p.isSuspended).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Ban className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Suspended</h3>
                    <p className="text-2xl font-bold text-orange-600">
                      {partners.filter((p: any) => p.isSuspended).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Countries</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {new Set(partners.map((p: any) => p.country)).size}
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
                      placeholder="Search by name, email, or country..."
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
              <CardTitle>Gateway Partners ({filteredPartners.length})</CardTitle>
              <CardDescription>
                External partners using RukaPay as a gateway to send money to Uganda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading partners...</p>
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="py-8 text-center">
                  <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Partners Found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'No partners match your current filters.' 
                      : 'No gateway partners have been configured yet.'
                    }
                  </p>
                  {canManagePartners && (
                    <Button onClick={() => router.push('/dashboard/gateway-partners/create')}>
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
                        <TableHead>Status</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Rate Limits</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartners.map((partner: any) => (
                        <TableRow key={partner.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{partner.partnerName}</div>
                              <div className="text-sm text-gray-500">{partner.contactEmail}</div>
                              <div className="text-xs text-gray-400 mt-1">{partner.partnerType}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(partner)}</TableCell>
                          <TableCell>{getTierBadge(partner.tier)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <span>{partner.country}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="text-gray-600">
                                {partner.rateLimits?.requests_per_minute?.toLocaleString() || 'N/A'}/min
                              </div>
                              <div className="text-gray-400 text-xs">
                                {partner.rateLimits?.requests_per_day?.toLocaleString() || 'N/A'}/day
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {partner.permissions && partner.permissions.length > 0 ? (
                                <>
                                  {partner.permissions.slice(0, 2).map((perm: string) => (
                                    <Badge key={perm} variant="outline" className="text-xs">
                                      {perm.split(':')[1] || perm}
                                    </Badge>
                                  ))}
                                  {partner.permissions.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{partner.permissions.length - 2}
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-gray-400">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(partner.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.push(`/dashboard/gateway-partners/${partner.id}`)}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {canManagePartners && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleSuspend(partner.id, !partner.isSuspended)}
                                    disabled={suspendPartner.isPending}
                                    title={partner.isSuspended ? 'Reactivate' : 'Suspend'}
                                  >
                                    {partner.isSuspended ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Ban className="w-4 h-4 text-orange-600" />
                                    )}
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

export default GatewayPartnersPage

