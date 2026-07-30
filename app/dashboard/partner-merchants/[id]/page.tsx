"use client"

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  ArrowLeft,
  RefreshCw,
  ShieldBan,
  ShieldCheck,
} from 'lucide-react'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import {
  useBlockPartnerMerchant,
  usePartnerMerchant,
  usePartnerMerchantTransactions,
} from '@/lib/hooks/usePartnerMerchants'

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusBadge(status: string) {
  const normalized = status.toUpperCase()
  if (normalized === 'ACTIVE') return <Badge className="bg-green-500">Active</Badge>
  if (normalized === 'INACTIVE') return <Badge variant="secondary">Inactive</Badge>
  if (normalized === 'BLOCKED') return <Badge variant="destructive">Blocked</Badge>
  return <Badge variant="outline">{status}</Badge>
}

export default function PartnerMerchantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const merchantId = String(params.id ?? '')
  const [txPage, setTxPage] = useState(1)
  const [blockReason, setBlockReason] = useState('')
  const [actionError, setActionError] = useState('')

  const { hasPermission } = usePermissions()
  const canView = hasPermission(PERMISSIONS.PARTNERS_VIEW)

  const { data: merchant, isLoading, error, refetch } = usePartnerMerchant(merchantId)
  const {
    data: txData,
    isLoading: txLoading,
    refetch: refetchTx,
  } = usePartnerMerchantTransactions(merchantId, txPage, 20)
  const blockMutation = useBlockPartnerMerchant()

  const handleBlockToggle = async () => {
    if (!merchant) return
    setActionError('')
    const isBlocked = merchant.status.toUpperCase() === 'BLOCKED'
    try {
      await blockMutation.mutateAsync({
        merchantId: merchant.merchantId,
        blocked: !isBlocked,
        reason: !isBlocked ? blockReason || undefined : undefined,
      })
      setBlockReason('')
      await refetch()
    } catch (err: any) {
      setActionError(err?.response?.data?.message || err?.message || 'Action failed')
    }
  }

  if (!canView) {
    return (
      <DashboardPageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to view this merchant.</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Merchant Not Found</h1>
            <Button variant="outline" onClick={() => router.push('/dashboard/partner-merchants')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to list
            </Button>
          </div>
        </div>
      </DashboardPageLayout>
    )
  }

  const isBlocked = merchant?.status?.toUpperCase() === 'BLOCKED'

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('partner-merchants/[id]')} />
      <DashboardPageHeader
        title={merchant?.merchantName || 'Partner Merchant'}
        description={merchant ? `merchantId: ${merchant.merchantId}` : 'Loading...'}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/partner-merchants')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                refetch()
                refetchTx()
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {isLoading || !merchant ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">Loading merchant...</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(merchant.status)}</div>
                </div>
                <div>
                  <p className="text-gray-500">Industry</p>
                  <p className="font-medium">{merchant.industry}</p>
                </div>
                <div>
                  <p className="text-gray-500">Partner</p>
                  <p className="font-medium">
                    {merchant.apiPartner?.partnerName || merchant.apiPartnerId}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Base merchant</p>
                  <p className="font-medium">{merchant.isBaseMerchant ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Contact email</p>
                  <p className="font-medium">{merchant.contactEmail || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Contact phone</p>
                  <p className="font-medium">{merchant.contactPhone || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Contact person</p>
                  <p className="font-medium">{merchant.contactPerson || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">{formatDateTime(merchant.createdAt)}</p>
                </div>
                {isBlocked && (
                  <>
                    <div>
                      <p className="text-gray-500">Blocked at</p>
                      <p className="font-medium">{formatDateTime(merchant.blockedAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Block reason</p>
                      <p className="font-medium">{merchant.blockedReason || '—'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{isBlocked ? 'Unblock merchant' : 'Block merchant'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Blocking stops transactions for this merchant only. The partner and sibling
                  merchants stay unaffected.
                </p>
                {!isBlocked && (
                  <div>
                    <Label htmlFor="reason">Reason (optional)</Label>
                    <Input
                      id="reason"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="e.g. Suspected fraud"
                    />
                  </div>
                )}
                {actionError && <p className="text-sm text-red-600">{actionError}</p>}
                <Button
                  variant={isBlocked ? 'default' : 'destructive'}
                  className="w-full"
                  disabled={blockMutation.isPending}
                  onClick={handleBlockToggle}
                >
                  {isBlocked ? (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Unblock
                    </>
                  ) : (
                    <>
                      <ShieldBan className="h-4 w-4 mr-2" />
                      Block merchant
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>KYC documents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(merchant.documents || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No documents on file.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (merchant.documents || []).map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.documentType}</TableCell>
                        <TableCell>{doc.requirement}</TableCell>
                        <TableCell>{doc.status}</TableCell>
                        <TableCell>
                          {doc.documentUrl ? (
                            <a
                              href={doc.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Open
                            </a>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : (txData?.items || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No transactions attributed to this merchant yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (txData?.items || []).map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">
                          {tx.reference || tx.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{tx.type}</TableCell>
                        <TableCell>{tx.status}</TableCell>
                        <TableCell>
                          {Number(tx.amount).toLocaleString()} {tx.currency}
                        </TableCell>
                        <TableCell>{formatDateTime(tx.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {txData && txData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-gray-500">
                    Page {txData.pagination.page} of {txData.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txPage <= 1}
                      onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={txPage >= txData.pagination.totalPages}
                      onClick={() => setTxPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardPageLayout>
  )
}
