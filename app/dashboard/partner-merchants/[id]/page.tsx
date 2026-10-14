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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Download,
  RefreshCw,
  ShieldBan,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { downloadCsv } from '@/lib/utils/merchantEventsExport'
import {
  useBlockPartnerMerchant,
  useExportPartnerMerchantTransactions,
  usePartnerMerchant,
  usePartnerMerchantTransactions,
  type PartnerMerchantTxStatusFilter,
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
  if (normalized === 'SUCCESS') return <Badge className="bg-green-500">Success</Badge>
  if (normalized === 'FAILED') return <Badge variant="destructive">Failed</Badge>
  return <Badge variant="outline">{status}</Badge>
}

function formatMoney(value: number | string | undefined, currency = 'UGX') {
  const amount = Number(value || 0)
  const safe = Number.isFinite(amount) ? amount : 0
  return `${currency} ${safe.toLocaleString()}`
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'merchant'
  )
}

export default function PartnerMerchantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const merchantId = String(params.id ?? '')
  const [txPage, setTxPage] = useState(1)
  const [txStatus, setTxStatus] = useState<PartnerMerchantTxStatusFilter>('ALL')
  const [blockReason, setBlockReason] = useState('')
  const [actionError, setActionError] = useState('')

  const { hasPermission } = usePermissions()
  const canView = hasPermission(PERMISSIONS.PARTNERS_VIEW)

  const { data: merchant, isLoading, error, refetch } = usePartnerMerchant(merchantId)
  const {
    data: txData,
    isLoading: txLoading,
    refetch: refetchTx,
  } = usePartnerMerchantTransactions(merchantId, txPage, 20, txStatus)
  const blockMutation = useBlockPartnerMerchant()
  const exportMutation = useExportPartnerMerchantTransactions()
  const summary = txData?.summary
  const currency = summary?.currency || 'UGX'

  const handleExport = async () => {
    if (!merchant) return
    try {
      const result = await exportMutation.mutateAsync({
        merchantId: merchant.merchantId,
        status: txStatus,
      })
      if (!result.rows?.length) {
        toast.info('No transactions to export')
        return
      }
      const stamp = new Date().toISOString().slice(0, 10)
      downloadCsv(
        `${slugify(merchant.merchantName)}-transactions-${stamp}.csv`,
        result.rows.map((tx) => ({
          date: tx.createdAt,
          reference: tx.reference || tx.id,
          type: tx.type,
          direction: tx.direction || '',
          status: tx.status,
          amount: Number(tx.amount),
          fee: Number(tx.fee || 0),
          net: Number(tx.netAmount || 0),
          currency: tx.currency,
          mode: tx.mode || '',
          channel: tx.channel || '',
        })),
      )
      if (result.truncated) {
        toast.success(
          `Exported the latest ${result.rows.length.toLocaleString()} of ${result.total.toLocaleString()} transactions`,
        )
      } else {
        toast.success(`Exported ${result.rows.length.toLocaleString()} transactions`)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Export failed')
    }
  }

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

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total credit</p>
                <p className="mt-2 text-lg font-semibold text-emerald-700">
                  {formatMoney(summary?.totalCredit, currency)}
                </p>
                <p className="mt-1 text-xs text-gray-500">Successful inbound</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total debit</p>
                <p className="mt-2 text-lg font-semibold text-red-700">
                  {formatMoney(summary?.totalDebit, currency)}
                </p>
                <p className="mt-1 text-xs text-gray-500">Successful outbound</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Net</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatMoney(summary?.net, currency)}
                </p>
                <p className="mt-1 text-xs text-gray-500">Credit minus debit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Failed</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {(summary?.failedCount || 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {(summary?.successCount || 0).toLocaleString()} successful
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Transactions</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={txStatus}
                  onValueChange={(value) => {
                    setTxPage(1)
                    setTxStatus(value as PartnerMerchantTxStatusFilter)
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => void handleExport()}
                  disabled={exportMutation.isPending || !merchant}
                >
                  <Download className={`h-4 w-4 mr-2 ${exportMutation.isPending ? 'animate-pulse' : ''}`} />
                  {exportMutation.isPending ? 'Exporting…' : 'Export CSV'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Loading transactions...
                      </TableCell>
                    </TableRow>
                  ) : (txData?.items || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
                        <TableCell>
                          {String(tx.direction || '').toUpperCase() === 'CREDIT' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <ArrowDownRight className="h-3.5 w-3.5" />
                              Credit
                            </span>
                          ) : String(tx.direction || '').toUpperCase() === 'DEBIT' ? (
                            <span className="inline-flex items-center gap-1 text-red-700">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              Debit
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                        <TableCell>
                          {formatMoney(tx.amount, tx.currency)}
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
