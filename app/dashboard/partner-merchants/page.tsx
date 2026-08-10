"use client"

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertTriangle,
  Building2,
  RefreshCw,
  Search,
  Store,
  ShieldBan,
} from 'lucide-react'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { useGatewayPartners, type GatewayPartner } from '@/lib/hooks/useGatewayPartners'
import { usePartnerMerchants } from '@/lib/hooks/usePartnerMerchants'

const INDUSTRIES = [
  'Betting',
  'E-commerce',
  'Retail',
  'Supermarket',
  'Pharmacy',
  'Fuel Station',
  'Utility Services',
  'Education',
  'SACCO',
  'Microfinance',
  'Other',
]

function formatDate(value?: string | null) {
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
  if (normalized === 'INACTIVE') {
    return <Badge variant="secondary">Inactive</Badge>
  }
  if (normalized === 'BLOCKED') {
    return <Badge variant="destructive">Blocked</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}

export default function PartnerMerchantsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [partnerFilter, setPartnerFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { hasPermission } = usePermissions()
  const canView = hasPermission(PERMISSIONS.PARTNERS_VIEW)

  const { data: partnersResponse } = useGatewayPartners(1, 200)
  const partners: GatewayPartner[] = partnersResponse?.data ?? []

  const listParams = useMemo(
    () => ({
      apiPartnerId: partnerFilter === 'all' ? undefined : partnerFilter,
      industry: industryFilter === 'all' ? undefined : industryFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchTerm.trim() || undefined,
      page,
      limit: 20,
    }),
    [partnerFilter, industryFilter, statusFilter, searchTerm, page],
  )

  const { data, isLoading, error, refetch } = usePartnerMerchants(listParams)
  const items = data?.items ?? []
  const pagination = data?.pagination

  const stats = useMemo(() => {
    const active = items.filter((m) => m.status.toUpperCase() === 'ACTIVE').length
    const blocked = items.filter((m) => m.status.toUpperCase() === 'BLOCKED').length
    const inactive = items.filter((m) => m.status.toUpperCase() === 'INACTIVE').length
    return {
      total: pagination?.total ?? items.length,
      active,
      blocked,
      inactive,
    }
  }, [items, pagination])

  if (!canView) {
    return (
      <DashboardPageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">
              You do not have permission to view partner merchants.
            </p>
          </div>
        </div>
      </DashboardPageLayout>
    )
  }

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('partner-merchants')} />
      <DashboardPageHeader
        title="Partner Merchants"
        description="Merchants registered under API partners — KYC, status, and transaction attribution"
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
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Active (page)</h3>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-slate-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Inactive (page)</h3>
                <p className="text-2xl font-bold text-slate-700">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <ShieldBan className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Blocked (page)</h3>
                <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by merchant name or merchantId..."
                  value={searchTerm}
                  onChange={(e) => {
                    setPage(1)
                    setSearchTerm(e.target.value)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="lg:w-48">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setPage(1)
                  setStatusFilter(v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lg:w-56">
              <Label>Industry</Label>
              <Select
                value={industryFilter}
                onValueChange={(v) => {
                  setPage(1)
                  setIndustryFilter(v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="lg:w-56">
              <Label>Partner</Label>
              <Select
                value={partnerFilter}
                onValueChange={(v) => {
                  setPage(1)
                  setPartnerFilter(v)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All partners</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.partnerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-gray-700 mb-4">Failed to load partner merchants.</p>
            <Button onClick={() => refetch()}>Try again</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      Loading merchants...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                      No partner merchants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((merchant) => (
                    <TableRow
                      key={merchant.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        router.push(`/dashboard/partner-merchants/${merchant.merchantId}`)
                      }
                    >
                      <TableCell>
                        <div className="font-medium text-gray-900">{merchant.merchantName}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {merchant.merchantId}
                        </div>
                      </TableCell>
                      <TableCell>
                        {merchant.apiPartner?.partnerName || merchant.apiPartnerId}
                      </TableCell>
                      <TableCell>{merchant.industry}</TableCell>
                      <TableCell>{getStatusBadge(merchant.status)}</TableCell>
                      <TableCell>
                        {merchant.isBaseMerchant ? (
                          <Badge variant="outline">Base</Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{formatDate(merchant.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardPageLayout>
  )
}
