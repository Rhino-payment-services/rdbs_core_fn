"use client"

import React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertTriangle, ArrowLeft, Building2, RefreshCw } from 'lucide-react'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { useSacco } from '@/lib/hooks/useSaccos'
import { formatCompactUgx } from '@/lib/utils/transactions'

function formatDateTime(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ownerName(owner?: {
  profile?: { firstName?: string | null; lastName?: string | null } | null
  email?: string | null
  phone?: string | null
}) {
  if (!owner) return '—'
  const fullName = `${owner.profile?.firstName ?? ''} ${owner.profile?.lastName ?? ''}`.trim()
  return fullName || owner.email || owner.phone || '—'
}

export default function SaccoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const institutionId = String(params.id ?? '')

  const { hasPermission } = usePermissions()
  const canViewSaccos = hasPermission(PERMISSIONS.PARTNERS_VIEW)

  const { data: sacco, isLoading, error, refetch } = useSacco(institutionId)

  if (!canViewSaccos) {
    return (
      <DashboardPageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to view SACCO details.</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">SACCO Not Found</h1>
            <p className="text-gray-600 mb-4">Unable to load this SACCO institution.</p>
            <Button variant="outline" onClick={() => router.push('/dashboard/saccos')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to SACCOs
            </Button>
          </div>
        </div>
      </DashboardPageLayout>
    )
  }

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Onboarded SACCOs', href: '/dashboard/saccos' },
          { label: sacco?.name ?? 'SACCO Details' },
        ]}
      />

      <DashboardPageHeader
        title={isLoading ? 'Loading SACCO...' : sacco?.name ?? 'SACCO Details'}
        description={
          sacco
            ? `${sacco.code} · ${sacco.apiPartner?.partnerName ?? 'Unknown partner'}`
            : 'Partner institution details'
        }
        actions={
          <>
            <Button variant="outline" onClick={() => router.push('/dashboard/saccos')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </>
        }
      />

      {isLoading || !sacco ? (
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading SACCO details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Institution Profile
              </CardTitle>
              <CardDescription>Core onboarding and settlement configuration</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">SACCO Code</p>
                <p className="font-medium">{sacco.code}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <Badge className={sacco.status.toUpperCase() === 'ACTIVE' ? 'bg-green-500' : undefined}>
                  {sacco.status}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Gateway Partner</p>
                <p className="font-medium">{sacco.apiPartner?.partnerName ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Partner Type</p>
                <p className="font-medium">{sacco.apiPartner?.partnerType ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Settlement Mode</p>
                <p className="font-medium">{sacco.settlementMode}</p>
              </div>
              <div>
                <p className="text-gray-500">License Number</p>
                <p className="font-medium">{sacco.licenseNumber ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">External Org ID</p>
                <p className="font-medium">{sacco.externalOrgId ?? '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Owner</p>
                <p className="font-medium">{ownerName(sacco.owner ?? undefined)}</p>
              </div>
              <div>
                <p className="text-gray-500">Onboarded</p>
                <p className="font-medium">{formatDateTime(sacco.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDateTime(sacco.updatedAt)}</p>
              </div>
              <div>
                <p className="text-gray-500">Members</p>
                <p className="font-medium">{sacco._count?.members ?? 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Settlement Balance</p>
                <p className="font-medium">
                  {formatCompactUgx(sacco.totalCollectedBalance)} {sacco.balanceCurrency}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sacco.apiPartner?.id && (
                <Link
                  href={`/dashboard/gateway-partners/${sacco.apiPartner.id}`}
                  className="block text-sm text-blue-600 hover:underline"
                >
                  View gateway partner
                </Link>
              )}
              <Link href="/dashboard/transactions/liquidations" className="block text-sm text-blue-600 hover:underline">
                View SACCO liquidations
              </Link>
              <Link href="/dashboard/activity" className="block text-sm text-blue-600 hover:underline">
                View partner / SACCO activity
              </Link>
            </CardContent>
          </Card>

          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle>Settlement Wallets</CardTitle>
              <CardDescription>Wallets linked to this SACCO institution</CardDescription>
            </CardHeader>
            <CardContent>
              {sacco.wallets.length === 0 ? (
                <p className="text-sm text-gray-500">No settlement wallets configured.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Wallet Type</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Wallet ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sacco.wallets.map((wallet) => (
                        <TableRow key={wallet.id}>
                          <TableCell>{wallet.walletType}</TableCell>
                          <TableCell>{formatCompactUgx(Number(wallet.balance ?? 0))}</TableCell>
                          <TableCell>{wallet.currency}</TableCell>
                          <TableCell className="font-mono text-xs">{wallet.id}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardPageLayout>
  )
}
