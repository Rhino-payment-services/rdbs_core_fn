'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Building2,
  Edit,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { PERMISSIONS, usePermissions } from '@/lib/hooks/usePermissions'
import {
  useUgandaBanks,
  useBankRoutingPartners,
  useBankPartnerMappingMutations,
} from '@/lib/hooks/useUgandaBanks'
import type { UgandanBank } from '@/lib/types/api'

export default function BankPartnerMappingPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const canManage =
    hasPermission(PERMISSIONS.PARTNERS_UPDATE) || hasPermission(PERMISSIONS.PARTNERS_CREATE)

  const { data: banks = [], isLoading, isError, refetch, isFetching } = useUgandaBanks()
  const { data: routingPartners = [], isLoading: partnersLoading } = useBankRoutingPartners()
  const { assignMapping, removeMapping } = useBankPartnerMappingMutations()

  const [search, setSearch] = useState('')
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [selectedBank, setSelectedBank] = useState<UgandanBank | null>(null)
  const [selectedPartnerId, setSelectedPartnerId] = useState('')

  const filteredBanks = useMemo(() => {
    const q = search.trim().toLowerCase()
    const sorted = [...banks].sort((a, b) => a.bankName.localeCompare(b.bankName))
    if (!q) return sorted
    return sorted.filter(
      (b) =>
        b.bankName.toLowerCase().includes(q) ||
        b.bankSortCode.includes(q) ||
        (b.partner?.partnerName || '').toLowerCase().includes(q),
    )
  }, [banks, search])

  const routableCount = banks.filter((b) => b.isRoutable).length
  const mappedCount = banks.filter((b) => b.mappingId).length

  const openAssignDialog = (bank: UgandanBank) => {
    setSelectedBank(bank)
    setSelectedPartnerId(bank.partner?.id || '')
    setMappingDialogOpen(true)
  }

  const openRemoveDialog = (bank: UgandanBank) => {
    setSelectedBank(bank)
    setRemoveDialogOpen(true)
  }

  const handleSaveMapping = async () => {
    if (!selectedBank || !selectedPartnerId) return
    await assignMapping.mutateAsync({
      bankId: selectedBank.id,
      partnerId: selectedPartnerId,
      isUpdate: !!selectedBank.mappingId,
    })
    setMappingDialogOpen(false)
    setSelectedBank(null)
    setSelectedPartnerId('')
  }

  const handleRemoveMapping = async () => {
    if (!selectedBank) return
    await removeMapping.mutateAsync(selectedBank.id)
    setRemoveDialogOpen(false)
    setSelectedBank(null)
  }

  if (isError) {
    return (
      <DashboardPageLayout>
        <DashboardBreadcrumbs items={getDashboardPageCrumbs('finance/partners/bank-mapping')} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Failed to Load Banks</h1>
            <p className="mb-4 text-gray-600">Unable to retrieve the bank catalog from the server.</p>
            <Button onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          </div>
        </div>
      </DashboardPageLayout>
    )
  }

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('finance/partners/bank-mapping')} />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/finance/partners')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Partners
          </Button>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Bank routing</h1>
          <p className="text-gray-600">
            Assign an external partner (ABC, Pegasus, Etranzact) per bank sort code for wallet-to-bank
            transfers.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total banks</h3>
                <p className="text-2xl font-bold text-blue-600">{banks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mapped</h3>
              <p className="text-2xl font-bold text-green-600">{mappedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Routable</h3>
              <p className="text-2xl font-bold text-purple-600">{routableCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bank partner mappings</CardTitle>
          <CardDescription>
            Removing a mapping blocks all transfers to that bank until a new partner is assigned.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by bank name, sort code, or partner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bank name</TableHead>
                    <TableHead>Sort code</TableHead>
                    <TableHead>Mapped partner</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanks.map((bank) => (
                    <TableRow key={bank.id}>
                      <TableCell className="font-medium">{bank.bankName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{bank.bankSortCode}</Badge>
                      </TableCell>
                      <TableCell>
                        {bank.partner ? (
                          <span>
                            {bank.partner.partnerName}{' '}
                            <Badge variant="secondary" className="ml-1">
                              {bank.partner.partnerCode}
                            </Badge>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not mapped</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {bank.isRoutable ? (
                          <Badge variant="default">Routable</Badge>
                        ) : (
                          <Badge variant="destructive">Unavailable</Badge>
                        )}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAssignDialog(bank)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {bank.mappingId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openRemoveDialog(bank)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBank?.mappingId ? 'Change partner' : 'Assign partner'}
            </DialogTitle>
            <DialogDescription>
              {selectedBank?.bankName} ({selectedBank?.bankSortCode})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>External partner</Label>
              <Select
                value={selectedPartnerId || undefined}
                onValueChange={setSelectedPartnerId}
                disabled={partnersLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select partner (ABC, Pegasus, Etranzact)" />
                </SelectTrigger>
                <SelectContent>
                  {routingPartners.map((partner: { id: string; partnerName: string; partnerCode: string }) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.partnerName} ({partner.partnerCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMappingDialogOpen(false)}>
              Cancel
            </Button>
            <PermissionGuard permission={PERMISSIONS.PARTNERS_UPDATE}>
              <Button
                onClick={handleSaveMapping}
                disabled={!selectedPartnerId || assignMapping.isPending}
              >
                {assignMapping.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save mapping
              </Button>
            </PermissionGuard>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove bank partner mapping?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing this mapping will block all transfers to{' '}
              <strong>
                {selectedBank?.bankName} ({selectedBank?.bankSortCode})
              </strong>{' '}
              until a new partner is assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMapping}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMapping.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Remove mapping
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardPageLayout>
  )
}
