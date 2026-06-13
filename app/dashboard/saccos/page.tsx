"use client"

import React, { useMemo, useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Activity,
  AlertTriangle,
  Building2,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  Users,
  Wallet,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { useSaccos } from '@/lib/hooks/useSaccos'
import { useGatewayPartners, type GatewayPartner } from '@/lib/hooks/useGatewayPartners'
import { formatCompactUgx } from '@/lib/utils/transactions'

function formatDate(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getStatusBadge(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === 'ACTIVE') {
    return <Badge className="bg-green-500">Active</Badge>
  }
  if (normalized === 'INACTIVE' || normalized === 'SUSPENDED') {
    return <Badge variant="destructive">{status}</Badge>
  }
  return <Badge variant="secondary">{status}</Badge>
}

const SaccosPage = () => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [partnerFilter, setPartnerFilter] = useState('all')

  const { hasPermission } = usePermissions()
  const canViewSaccos = hasPermission(PERMISSIONS.PARTNERS_VIEW)

  const { data: partnersResponse } = useGatewayPartners(1, 200)
  const partners: GatewayPartner[] = partnersResponse?.data ?? []

  const selectedPartnerId = partnerFilter === 'all' ? undefined : partnerFilter
  const { data: saccos = [], isLoading, error, refetch } = useSaccos(selectedPartnerId)

  const filteredSaccos = useMemo(() => {
    return saccos.filter((sacco) => {
      const query = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !query ||
        sacco.name.toLowerCase().includes(query) ||
        sacco.code.toLowerCase().includes(query) ||
        sacco.apiPartner?.partnerName?.toLowerCase().includes(query) ||
        sacco.licenseNumber?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'all' || sacco.status.toUpperCase() === statusFilter.toUpperCase()

      return matchesSearch && matchesStatus
    })
  }, [saccos, searchTerm, statusFilter])

  const stats = useMemo(() => {
    const active = saccos.filter((s) => s.status.toUpperCase() === 'ACTIVE').length
    const members = saccos.reduce((sum, s) => sum + (s._count?.members ?? 0), 0)
    const totalBalance = saccos.reduce((sum, s) => sum + (s.totalCollectedBalance ?? 0), 0)
    return { total: saccos.length, active, members, totalBalance }
  }, [saccos])

  if (!canViewSaccos) {
    return (
      <DashboardPageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to view onboarded SACCOs.</p>
          </div>
        </div>
      </DashboardPageLayout>
    )
  }

  if (error) {
    return (
      <DashboardPageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load SACCOs</h1>
            <p className="text-gray-600 mb-4">Unable to retrieve onboarded SACCO data.</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </DashboardPageLayout>
    )
  }

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('saccos')} />
      <DashboardPageHeader
        title="Onboarded SACCOs"
        description="View SACCO institutions onboarded under gateway partners"
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total SACCOs</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Members</h3>
                <p className="text-2xl font-bold text-purple-600">{stats.members.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Settlement Balance</h3>
                <p className="text-2xl font-bold text-orange-600">{formatCompactUgx(stats.totalBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search SACCOs</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name, code, partner, or license..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="lg:w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:w-56">
              <Label htmlFor="partner">Gateway Partner</Label>
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger id="partner">
                  <SelectValue placeholder="Filter by partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All partners</SelectItem>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.partnerName}
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
          <CardTitle>SACCOs ({filteredSaccos.length})</CardTitle>
          <CardDescription>
            Partner institutions onboarded for SACCO settlement and member management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading SACCOs...</p>
            </div>
          ) : filteredSaccos.length === 0 ? (
            <div className="py-8 text-center">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No SACCOs Found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' || partnerFilter !== 'all'
                  ? 'No SACCOs match your current filters.'
                  : 'No SACCO institutions have been onboarded yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SACCO</TableHead>
                    <TableHead>Gateway Partner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Settlement Balance</TableHead>
                    <TableHead>Settlement Mode</TableHead>
                    <TableHead>Onboarded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSaccos.map((sacco) => (
                    <TableRow key={sacco.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{sacco.name}</div>
                          <div className="text-sm text-gray-500">Code: {sacco.code}</div>
                          {sacco.licenseNumber && (
                            <div className="text-xs text-gray-400 mt-1">License: {sacco.licenseNumber}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {sacco.apiPartner?.partnerName ?? '—'}
                        </div>
                        {sacco.apiPartner?.partnerType && (
                          <div className="text-xs text-gray-400">{sacco.apiPartner.partnerType}</div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(sacco.status)}</TableCell>
                      <TableCell>{sacco._count?.members ?? 0}</TableCell>
                      <TableCell>
                        {formatCompactUgx(sacco.totalCollectedBalance)} {sacco.balanceCurrency}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sacco.settlementMode}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(sacco.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/saccos/${sacco.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardPageLayout>
  )
}

export default SaccosPage
