'use client'

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/dashboard/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ChevronRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import {
  useApproveTariff,
  useRejectTariff,
  useSubmitTariffForApproval,
} from '@/lib/hooks/useTariffs'
import type { Tariff } from '@/lib/tariffs-new/types'
import {
  buildExternalPartnerBuckets,
  countTariffStatuses,
  parseTariffsFromResponse,
} from '@/lib/tariffs-new/utils'
import { ExternalPartnerSidebar } from '@/components/dashboard/tariffs-new/ExternalPartnerSidebar'
import { ExternalPartnerPanel } from '@/components/dashboard/tariffs-new/ExternalPartnerPanel'
import { InternalTariffsView } from '@/components/dashboard/tariffs-new/InternalTariffsView'
import { TariffViewDialog } from '@/components/dashboard/tariffs-new/TariffViewDialog'
import {
  DASHBOARD_GUTTER_CLASS,
  dashboardPageShellClass,
} from '@/lib/constants/dashboard-layout'

function TariffsNewPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tabFromUrl = searchParams?.get('tab') as 'internal' | 'external' | null
  const partnerFromUrl = searchParams?.get('partner')

  const [activeMainTab, setActiveMainTab] = useState<'internal' | 'external'>(
    tabFromUrl === 'internal' ? 'internal' : 'external',
  )
  const [selectedPartnerKey, setSelectedPartnerKey] = useState<string>('')
  const [partnerSearch, setPartnerSearch] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [viewTariff, setViewTariff] = useState<Tariff | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteTariff, setDeleteTariff] = useState<Tariff | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [approvalOpen, setApprovalOpen] = useState(false)
  const [approvalTariff, setApprovalTariff] = useState<Tariff | null>(null)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')

  const { hasPermission, userRole } = usePermissions()
  const { user } = useAuth()
  const canManage =
    hasPermission(PERMISSIONS.TARIFF_CREATE) ||
    hasPermission(PERMISSIONS.TARIFF_UPDATE) ||
    hasPermission(PERMISSIONS.TARIFF_DELETE) ||
    userRole === 'SUPER_ADMIN'
  const canApprove =
    hasPermission(PERMISSIONS.TARIFF_APPROVE) ||
    hasPermission(PERMISSIONS.TARIFF_REJECT) ||
    userRole === 'SUPER_ADMIN'

  const approveMutation = useApproveTariff()
  const rejectMutation = useRejectTariff()
  const submitMutation = useSubmitTariffForApproval()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tariffs'],
    queryFn: () => api.get('/finance/tariffs', { params: { limit: 1000 } }).then((res) => res.data),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const allTariffs = useMemo(() => parseTariffsFromResponse(data), [data])
  const internalTariffs = useMemo(
    () => allTariffs.filter((t) => t.tariffType === 'INTERNAL'),
    [allTariffs],
  )
  const externalTariffs = useMemo(
    () => allTariffs.filter((t) => t.tariffType === 'EXTERNAL'),
    [allTariffs],
  )
  const partnerBuckets = useMemo(
    () => buildExternalPartnerBuckets(externalTariffs),
    [externalTariffs],
  )

  const internalStats = useMemo(() => countTariffStatuses(internalTariffs), [internalTariffs])
  const externalStats = useMemo(() => countTariffStatuses(externalTariffs), [externalTariffs])

  const selectedPartner = useMemo(
    () => partnerBuckets.find((p) => p.key === selectedPartnerKey) ?? partnerBuckets[0],
    [partnerBuckets, selectedPartnerKey],
  )

  useEffect(() => {
    if (partnerBuckets.length === 0) return
    if (partnerFromUrl && partnerBuckets.some((p) => p.key === partnerFromUrl)) {
      setSelectedPartnerKey(partnerFromUrl)
      return
    }
    if (!selectedPartnerKey || !partnerBuckets.some((p) => p.key === selectedPartnerKey)) {
      setSelectedPartnerKey(partnerBuckets[0].key)
    }
  }, [partnerBuckets, partnerFromUrl, selectedPartnerKey])

  const syncUrl = useCallback(
    (tab: string, partner?: string) => {
      const params = new URLSearchParams()
      params.set('tab', tab)
      if (partner) params.set('partner', partner)
      router.replace(`/dashboard/finance/tariffs-new?${params.toString()}`, { scroll: false })
    },
    [router],
  )

  const handleMainTabChange = (value: string) => {
    const tab = value as 'internal' | 'external'
    setActiveMainTab(tab)
    if (tab === 'external' && selectedPartner) {
      syncUrl(tab, selectedPartner.key)
    } else {
      syncUrl(tab)
    }
  }

  const handlePartnerSelect = (key: string) => {
    setSelectedPartnerKey(key)
    syncUrl('external', key)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
      toast.success('Tariffs refreshed')
    } catch {
      toast.error('Failed to refresh')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCreate = (apiPartnerId?: string) => {
    const q = apiPartnerId ? `?apiPartnerId=${apiPartnerId}` : ''
    router.push(`/dashboard/finance/tariffs/create${q}`)
  }

  const handleEdit = (tariff: Tariff) => {
    router.push(`/dashboard/finance/tariffs/edit/${tariff.id}`)
  }

  const handleView = (tariff: Tariff) => {
    setViewTariff(tariff)
    setViewOpen(true)
  }

  const handleDeleteRequest = (tariff: Tariff) => {
    setDeleteTariff(tariff)
    setDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTariff) return
    setIsDeleting(true)
    try {
      await api.delete(`/finance/tariffs/${deleteTariff.id}`)
      toast.success('Tariff deleted')
      setDeleteOpen(false)
      setDeleteTariff(null)
      refetch()
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message || 'Failed to delete tariff'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleApprovalOpen = (tariff: Tariff, action: 'approve' | 'reject') => {
    setApprovalTariff(tariff)
    setApprovalAction(action)
    setApprovalNotes('')
    setApprovalOpen(true)
  }

  const handleApprovalSubmit = async () => {
    if (!approvalTariff || !approvalAction) return
    try {
      if (approvalAction === 'approve') {
        await approveMutation.mutateAsync({
          id: approvalTariff.id,
          notes: approvalNotes || undefined,
        })
        toast.success('Tariff approved')
      } else {
        if (!approvalNotes.trim()) {
          toast.error('Rejection reason is required')
          return
        }
        await rejectMutation.mutateAsync({
          id: approvalTariff.id,
          notes: approvalNotes,
        })
        toast.success('Tariff rejected')
      }
      setApprovalOpen(false)
      refetch()
    } catch {
      toast.error(`Failed to ${approvalAction} tariff`)
    }
  }

  const handleSubmitForApproval = async (id: string) => {
    try {
      await submitMutation.mutateAsync(id)
      toast.success('Submitted for approval')
      refetch()
    } catch {
      toast.error('Failed to submit')
    }
  }

  const actionProps = {
    canManage,
    canApprove,
    currentUserId: user?.id,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDeleteRequest,
    onApprove: (t: Tariff) => handleApprovalOpen(t, 'approve'),
    onReject: (t: Tariff) => handleApprovalOpen(t, 'reject'),
    onSubmitForApproval: handleSubmitForApproval,
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">Could not load tariffs</p>
            <Button onClick={handleRefresh}>Try again</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className={`${DASHBOARD_GUTTER_CLASS} py-4 md:py-6`}>
        <div className={dashboardPageShellClass}>
          <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/dashboard/finance" className="hover:text-[#08163d]">
              Finance
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">Tariffs (new)</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="flex items-start gap-3">
              <Link href="/dashboard/finance">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Finance
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Tariff schedules
                  </h1>
                  <BadgeNew />
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  Partner-first view with tier tables — internal & external tariffs
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/dashboard/finance/tariffs">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Classic view
                </Button>
              </Link>
              {canManage && (
                <Button size="sm" onClick={() => handleCreate()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create tariff
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatChip
              label="Internal"
              value={internalStats.total}
              sub={`${internalStats.active} active`}
            />
            <StatChip
              label="External"
              value={externalStats.total}
              sub={`${partnerBuckets.length} partners`}
            />
            <StatChip
              label="Pending approval"
              value={internalStats.pending + externalStats.pending}
              sub="Across all tariffs"
              accent="amber"
            />
            <StatChip
              label="Draft"
              value={internalStats.draft + externalStats.draft}
              sub="Needs review"
              accent="gray"
            />
          </div>

          <Tabs value={activeMainTab} onValueChange={handleMainTabChange} className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="internal" className="gap-2">
                <Building2 className="h-4 w-4" />
                Internal ({internalTariffs.length})
              </TabsTrigger>
              <TabsTrigger value="external" className="gap-2">
                <Zap className="h-4 w-4" />
                External ({externalTariffs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="internal">
              {isLoading ? (
                <LoadingCard message="Loading internal tariffs…" />
              ) : (
                <InternalTariffsView
                  tariffs={internalTariffs}
                  onCreateTariff={() => handleCreate()}
                  {...actionProps}
                />
              )}
            </TabsContent>

            <TabsContent value="external">
              {isLoading ? (
                <LoadingCard message="Loading external tariffs…" />
              ) : partnerBuckets.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    No external tariffs configured.
                    {canManage && (
                      <Button className="mt-4 block mx-auto" onClick={() => handleCreate()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create external tariff
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden border-gray-200 shadow-sm">
                  <div className="flex flex-col lg:flex-row min-h-[480px]">
                    <div className="w-full lg:w-[280px] shrink-0">
                      <ExternalPartnerSidebar
                        partners={partnerBuckets}
                        selectedKey={selectedPartnerKey}
                        search={partnerSearch}
                        onSearchChange={setPartnerSearch}
                        onSelect={handlePartnerSelect}
                      />
                    </div>
                    {selectedPartner && (
                      <ExternalPartnerPanel
                        partner={selectedPartner}
                        onCreateTariff={handleCreate}
                        {...actionProps}
                      />
                    )}
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <TariffViewDialog tariff={viewTariff} open={viewOpen} onOpenChange={setViewOpen} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete tariff</DialogTitle>
            <DialogDescription>
              Delete &quot;{deleteTariff?.name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve tariff' : 'Reject tariff'}
            </DialogTitle>
            <DialogDescription>{approvalTariff?.name}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="approval-notes">Notes{approvalAction === 'reject' ? ' *' : ''}</Label>
            <Textarea
              id="approval-notes"
              className="mt-2"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder={
                approvalAction === 'reject'
                  ? 'Reason for rejection…'
                  : 'Optional notes…'
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprovalSubmit}
              className={
                approvalAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''
              }
              variant={approvalAction === 'reject' ? 'destructive' : 'default'}
            >
              {approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BadgeNew() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 text-violet-800 text-xs font-medium px-2 py-0.5">
      <Sparkles className="h-3 w-3" />
      Beta
    </span>
  )
}

function StatChip({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: number
  sub: string
  accent?: 'amber' | 'gray'
}) {
  const border =
    accent === 'amber'
      ? 'border-amber-200'
      : accent === 'gray'
        ? 'border-gray-300'
        : 'border-gray-200'
  return (
    <Card className={`${border}`}>
      <CardContent className="px-4 py-3">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  )
}

function LoadingCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 flex flex-col items-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <p className="text-gray-600 text-sm">{message}</p>
      </CardContent>
    </Card>
  )
}

export default function TariffsNewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <TariffsNewPageContent />
    </Suspense>
  )
}
