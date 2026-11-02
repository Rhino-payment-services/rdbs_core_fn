'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import {
  DASHBOARD_MAIN_CLASS,
  dashboardPageShellClass,
} from '@/lib/constants/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Shuffle,
  AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { usePermissions } from '@/lib/hooks/usePermissions'
import {
  useExecutePartnerTariffSync,
  usePreviewPartnerTariffSync,
  type PartnerTariffSyncKind,
  type PartnerTariffSyncPreview,
  type PartnerTariffSyncResult,
} from '@/lib/hooks/useTariffs'

type PartnerOption = {
  id: string
  name: string
  code?: string | null
}

function formatAmountBand(min: number | null, max: number | null) {
  if (min == null && max == null) return 'Any'
  if (min != null && max != null) return `${min.toLocaleString()} – ${max.toLocaleString()}`
  if (min != null) return `≥ ${min.toLocaleString()}`
  return `≤ ${max!.toLocaleString()}`
}

export default function PartnerTariffSyncPage() {
  const router = useRouter()
  const { canCreateTariffs, canUpdateTariffs, hasRole } = usePermissions()
  const canManage =
    hasRole('SUPER_ADMIN') || canCreateTariffs || canUpdateTariffs

  const [partnerKind, setPartnerKind] =
    useState<PartnerTariffSyncKind>('API_PARTNER')
  const [sourcePartnerId, setSourcePartnerId] = useState('')
  const [destinationPartnerId, setDestinationPartnerId] = useState('')
  const [preview, setPreview] = useState<PartnerTariffSyncPreview | null>(null)
  const [result, setResult] = useState<PartnerTariffSyncResult | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const previewMutation = usePreviewPartnerTariffSync()
  const executeMutation = useExecutePartnerTariffSync()

  const apiPartnersQuery = useQuery({
    queryKey: ['gateway-partners-sync', 1, 500],
    queryFn: async () => {
      const response = await api.get(
        '/api/v1/admin/gateway-partners?page=1&limit=500',
      )
      return response.data
    },
    enabled: partnerKind === 'API_PARTNER',
    staleTime: 60_000,
  })

  const externalPartnersQuery = useQuery({
    queryKey: ['external-payment-partners-sync'],
    queryFn: async () => {
      const response = await api.get('/admin/external-payment-partners')
      return response.data
    },
    enabled: partnerKind === 'EXTERNAL_PARTNER',
    staleTime: 60_000,
  })

  const partnerOptions: PartnerOption[] = useMemo(() => {
    if (partnerKind === 'API_PARTNER') {
      const rows =
        apiPartnersQuery.data?.data ||
        apiPartnersQuery.data?.items ||
        apiPartnersQuery.data ||
        []
      return (Array.isArray(rows) ? rows : []).map((p: any) => ({
        id: String(p.id),
        name: String(p.partnerName || p.name || p.id),
        code: p.partnerCode || null,
      }))
    }
    const rows =
      externalPartnersQuery.data?.data ||
      externalPartnersQuery.data?.partners ||
      externalPartnersQuery.data ||
      []
    return (Array.isArray(rows) ? rows : []).map((p: any) => ({
      id: String(p.id),
      name: String(p.partnerName || p.name || p.id),
      code: p.partnerCode || null,
    }))
  }, [partnerKind, apiPartnersQuery.data, externalPartnersQuery.data])

  const sourcePartner = partnerOptions.find((p) => p.id === sourcePartnerId)
  const destinationPartner = partnerOptions.find(
    (p) => p.id === destinationPartnerId,
  )

  const resetComparison = () => {
    setPreview(null)
    setResult(null)
  }

  const onPartnerKindChange = (value: PartnerTariffSyncKind) => {
    setPartnerKind(value)
    setSourcePartnerId('')
    setDestinationPartnerId('')
    resetComparison()
  }

  const requestPayload = {
    partnerKind,
    sourcePartnerId,
    destinationPartnerId,
    activeOnly: true,
  }

  const handlePreview = async () => {
    if (!sourcePartnerId || !destinationPartnerId) {
      toast.error('Select both source and destination partners')
      return
    }
    if (sourcePartnerId === destinationPartnerId) {
      toast.error('Source and destination must be different')
      return
    }
    setResult(null)
    try {
      const data = await previewMutation.mutateAsync(requestPayload)
      setPreview(data)
      if (data.alreadySynchronized) {
        toast.success('Destination partner is already synchronized')
      } else {
        toast.success(
          `Found ${data.missingCount} missing tariff${data.missingCount === 1 ? '' : 's'}`,
        )
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to preview synchronization',
      )
    }
  }

  const handleExecute = async () => {
    setConfirmOpen(false)
    try {
      const data = await executeMutation.mutateAsync(requestPayload)
      setResult(data)
      setPreview(data)
      if (data.failedCount > 0) {
        toast.error(
          `Created ${data.createdCount}, failed ${data.failedCount}. Review the results below.`,
        )
      } else if (data.createdCount === 0) {
        toast.success('No new tariffs created — already synchronized')
      } else {
        toast.success(
          `Created ${data.createdCount} tariff${data.createdCount === 1 ? '' : 's'} as drafts`,
        )
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to synchronize tariffs',
      )
    }
  }

  if (!canManage) {
    return (
      <DashboardPageLayout>
        <main className={DASHBOARD_MAIN_CLASS}>
          <div className={dashboardPageShellClass}>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              You do not have permission to synchronize partner tariffs.
            </div>
          </div>
        </main>
      </DashboardPageLayout>
    )
  }

  const loadingPartners =
    partnerKind === 'API_PARTNER'
      ? apiPartnersQuery.isLoading
      : externalPartnersQuery.isLoading

  return (
    <>
      <DashboardPageLayout>
        <main className={DASHBOARD_MAIN_CLASS}>
          <div className={dashboardPageShellClass}>
            <DashboardBreadcrumbs
              items={getDashboardPageCrumbs('finance/tariffs/sync')}
            />

            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <Button
                  variant="ghost"
                  className="mb-2 -ml-2 h-8 px-2 text-slate-600"
                  onClick={() => router.push('/dashboard/finance/tariffs-new')}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back to tariff schedules
                </Button>
                <h1 className="text-2xl font-bold tracking-tight text-[#08163d]">
                  Synchronize Partner Tariffs
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Copy missing tariff configurations from one partner to another.
                  Existing destination tariffs are never overwritten. New tariffs
                  are created as drafts for approval.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/dashboard/finance/tariffs-new">
                  Open tariff schedules
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-[#08163d]">
                    Partners
                  </CardTitle>
                  <CardDescription>
                    Choose the source template partner and the destination partner
                    to onboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Partner type</Label>
                    <Select
                      value={partnerKind}
                      onValueChange={(v) =>
                        onPartnerKindChange(v as PartnerTariffSyncKind)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="API_PARTNER">
                          API / Gateway partner
                        </SelectItem>
                        <SelectItem value="EXTERNAL_PARTNER">
                          External payment partner
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Source partner</Label>
                    <Select
                      value={sourcePartnerId}
                      onValueChange={(v) => {
                        setSourcePartnerId(v)
                        resetComparison()
                      }}
                      disabled={loadingPartners}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingPartners
                              ? 'Loading partners…'
                              : 'Select source partner'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {partnerOptions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                            {p.code ? ` (${p.code})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Destination partner</Label>
                    <Select
                      value={destinationPartnerId}
                      onValueChange={(v) => {
                        setDestinationPartnerId(v)
                        resetComparison()
                      }}
                      disabled={loadingPartners}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {partnerOptions
                          .filter((p) => p.id !== sourcePartnerId)
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                              {p.code ? ` (${p.code})` : ''}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handlePreview()}
                      disabled={
                        previewMutation.isPending ||
                        !sourcePartnerId ||
                        !destinationPartnerId
                      }
                    >
                      {previewMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Preview synchronization
                    </Button>
                    <Button
                      type="button"
                      className="bg-[#08163d] hover:bg-[#0c2258]"
                      onClick={() => setConfirmOpen(true)}
                      disabled={
                        !preview ||
                        preview.alreadySynchronized ||
                        preview.toCreateCount === 0 ||
                        executeMutation.isPending
                      }
                    >
                      {executeMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Shuffle className="mr-2 h-4 w-4" />
                      )}
                      Synchronize missing tariffs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-[#08163d]">
                    Comparison summary
                  </CardTitle>
                  <CardDescription>
                    {sourcePartner && destinationPartner
                      ? `${sourcePartner.name} → ${destinationPartner.name}`
                      : 'Select partners and run a preview'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!preview ? (
                    <p className="text-sm text-slate-500">
                      No preview yet. Run a comparison to see matching and missing
                      tariffs.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <SummaryStat
                          label="Source tariffs"
                          value={preview.sourceTotal}
                        />
                        <SummaryStat
                          label="Destination tariffs"
                          value={preview.destinationTotal}
                        />
                        <SummaryStat
                          label="Matching"
                          value={preview.matchingCount}
                        />
                        <SummaryStat
                          label="Missing / to create"
                          value={preview.toCreateCount}
                          emphasize
                        />
                      </div>

                      {preview.alreadySynchronized ? (
                        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                          Destination partner already has all matching source
                          tariffs. Nothing to create.
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          {preview.toCreateCount} tariff
                          {preview.toCreateCount === 1 ? '' : 's'} will be created
                          as drafts. Existing destination tariffs stay untouched.
                        </div>
                      )}

                      {result && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          <div className="font-medium text-[#08163d]">
                            Last sync result
                          </div>
                          <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                            <span>Created: {result.createdCount}</span>
                            <span>Skipped: {result.skippedCount}</span>
                            <span>Failed: {result.failedCount}</span>
                            <span>
                              Destination total after: {result.synchronizedTotal}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {preview && preview.missing.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base text-[#08163d]">
                    Missing tariffs to create
                  </CardTitle>
                  <CardDescription>
                    These source tariffs were not found on the destination partner.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TariffCompareTable items={preview.missing} mode="missing" />
                </CardContent>
              </Card>
            )}

            {result && result.failed.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base text-red-800">
                    Failed creations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TariffCompareTable items={result.failed} mode="failed" />
                </CardContent>
              </Card>
            )}

            {preview && preview.matching.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base text-[#08163d]">
                    Already present on destination
                  </CardTitle>
                  <CardDescription>
                    These will be skipped during synchronization.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TariffCompareTable items={preview.matching} mode="matching" />
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </DashboardPageLayout>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm tariff synchronization</AlertDialogTitle>
            <AlertDialogDescription>
              Create {preview?.toCreateCount || 0} missing tariff
              {(preview?.toCreateCount || 0) === 1 ? '' : 's'} from{' '}
              <strong>{preview?.sourcePartner.name}</strong> onto{' '}
              <strong>{preview?.destinationPartner.name}</strong>? Existing
              destination tariffs will not be changed. New tariffs are created as
              drafts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={executeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleExecute()
              }}
              disabled={executeMutation.isPending}
              className="bg-[#08163d] hover:bg-[#0c2258]"
            >
              {executeMutation.isPending ? 'Synchronizing…' : 'Confirm sync'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function SummaryStat({
  label,
  value,
  emphasize,
}: {
  label: string
  value: number
  emphasize?: boolean
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        emphasize
          ? 'border-[#08163d]/20 bg-[#08163d]/5'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 text-xl font-semibold text-[#08163d]">{value}</div>
    </div>
  )
}

function TariffCompareTable({
  items,
  mode,
}: {
  items: PartnerTariffSyncPreview['missing']
  mode: 'missing' | 'matching' | 'failed'
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source tariff</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Channel / Network</TableHead>
            <TableHead>Amount band</TableHead>
            <TableHead>
              {mode === 'failed'
                ? 'Error'
                : mode === 'matching'
                  ? 'Destination'
                  : 'Status'}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={`${row.sourceTariffId}-${row.matchKey}`}>
              <TableCell className="font-medium text-slate-800">
                {row.sourceName}
              </TableCell>
              <TableCell className="text-xs text-slate-600">
                {row.transactionType}
                {row.group ? ` · ${row.group}` : ''}
              </TableCell>
              <TableCell className="text-xs text-slate-600">
                {row.channel || 'All channels'}
                {row.network ? ` · ${row.network}` : ''}
              </TableCell>
              <TableCell className="text-xs text-slate-600">
                {formatAmountBand(row.minAmount, row.maxAmount)}
              </TableCell>
              <TableCell>
                {mode === 'failed' ? (
                  <span className="text-xs text-red-700">{row.reason}</span>
                ) : mode === 'matching' ? (
                  <span className="text-xs text-slate-600">
                    {row.destinationName || row.destinationTariffId}
                  </span>
                ) : (
                  <Badge variant="secondary">Will create</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
