'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, Download, RefreshCw, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { FilterBar, FilterField } from '@/components/dashboard/merchant-events/FilterBar'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import {
  fetchAllRukaSenteLoans,
  useActiveRukaSenteLoans,
  type RukaSenteLoanListFilters,
} from '@/lib/hooks/useRukaSenteLoans'
import {
  exportRukaSenteLoansCsv,
  exportRukaSenteLoansExcel,
  exportRukaSenteLoansPdf,
} from '@/lib/utils/rukaSenteLoansExport'

const emptyDraft = {
  search: '',
  dateFrom: '',
  dateTo: '',
  minAmount: '',
  maxAmount: '',
  minOutstanding: '',
  maxOutstanding: '',
}

function formatMoney(amount?: number | null, currency = 'UGX') {
  if (amount == null || Number.isNaN(Number(amount))) return '—'
  return `${currency} ${Number(amount).toLocaleString()}`
}

function dateLabel(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function statusBadge(status?: string) {
  const s = String(status || '').toLowerCase()
  const cls =
    s === 'active' || s === 'disbursed' || s === 'fully_paid' || s === 'repaid'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : s === 'partially_paid' || s === 'repaying'
        ? 'bg-sky-50 text-sky-800 border-sky-200'
        : s === 'overdue' || s === 'defaulted'
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : 'bg-slate-50 text-slate-700 border-slate-200'
  return (
    <Badge variant="outline" className={`text-[10px] font-medium capitalize ${cls}`}>
      {s.replace(/_/g, ' ') || 'unknown'}
    </Badge>
  )
}

export default function RukaSenteLoansPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const canView = hasPermission(PERMISSIONS.USERS_VIEW)
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState(emptyDraft)
  const [filters, setFilters] = useState(emptyDraft)
  const [exporting, setExporting] = useState(false)

  const applied: RukaSenteLoanListFilters = {
    page,
    limit: 20,
    search: filters.search,
    filter: 'active',
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    minAmount: filters.minAmount,
    maxAmount: filters.maxAmount,
    minOutstanding: filters.minOutstanding,
    maxOutstanding: filters.maxOutstanding,
  }

  const listQ = useActiveRukaSenteLoans(applied)

  const items = listQ.data?.data?.items ?? []
  const total = listQ.data?.data?.total ?? 0
  const totalPages = listQ.data?.data?.totalPages ?? 1
  const flaggedActiveCount = listQ.data?.data?.flaggedActiveCount ?? 0
  const configured = listQ.data?.configured !== false

  const subtitle = useMemo(() => {
    if (!configured) return 'Ruka Sente is not configured on this server'
    return `${total} loan${total === 1 ? '' : 's'} matching filters`
  }, [configured, total])

  function applyFilters() {
    setPage(1)
    setFilters({ ...draft, search: draft.search.trim() })
  }

  function clearFilters() {
    setDraft(emptyDraft)
    setFilters(emptyDraft)
    setPage(1)
  }

  async function handleExport(kind: 'csv' | 'excel' | 'pdf') {
    setExporting(true)
    try {
      const rows = await fetchAllRukaSenteLoans({
        search: filters.search,
        filter: 'active',
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        minAmount: filters.minAmount,
        maxAmount: filters.maxAmount,
        minOutstanding: filters.minOutstanding,
        maxOutstanding: filters.maxOutstanding,
      })
      if (!rows.length) {
        toast.error('No loans to export for the current filters')
        return
      }
      if (kind === 'csv') exportRukaSenteLoansCsv(rows)
      if (kind === 'excel') exportRukaSenteLoansExcel(rows)
      if (kind === 'pdf') exportRukaSenteLoansPdf(rows)
      toast.success(`Exported ${rows.length} loan${rows.length === 1 ? '' : 's'}`)
    } catch (err) {
      toast.error((err as Error).message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (!canView) {
    return (
      <DashboardPageLayout>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Access denied</CardTitle>
            <CardDescription className="text-xs">
              You need USERS_VIEW permission to manage RukaSente loans.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardPageLayout>
    )
  }

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('rukasente-loans')} />
      <DashboardPageHeader
        title={<span className="text-xl md:text-2xl">RukaSente loans</span>}
        description={
          <span className="text-xs md:text-sm">
            Active loans from RukaSente. Filter by date, amount, or remaining balance, then open a
            borrower to collect repayment from their wallet.
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={exporting || listQ.isLoading}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {exporting ? 'Exporting…' : 'Export'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void handleExport('csv')}>
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport('excel')}>
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport('pdf')}>
                  PDF / Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => listQ.refetch()}
              disabled={listQ.isFetching}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${listQ.isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      <FilterBar onApply={applyFilters} onClear={clearFilters} defaultOpen>
        <FilterField label="Search">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 pl-8 text-xs"
              placeholder="Phone, name, or application"
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
            />
          </div>
        </FilterField>
        <FilterField label="Date from">
          <Input
            type="date"
            className="h-8 text-xs"
            value={draft.dateFrom}
            onChange={(e) => setDraft((d) => ({ ...d, dateFrom: e.target.value }))}
          />
        </FilterField>
        <FilterField label="Date to">
          <Input
            type="date"
            className="h-8 text-xs"
            value={draft.dateTo}
            onChange={(e) => setDraft((d) => ({ ...d, dateTo: e.target.value }))}
          />
        </FilterField>
        <FilterField label="Min amount">
          <Input
            type="number"
            min={0}
            className="h-8 text-xs"
            placeholder="0"
            value={draft.minAmount}
            onChange={(e) => setDraft((d) => ({ ...d, minAmount: e.target.value }))}
          />
        </FilterField>
        <FilterField label="Max amount">
          <Input
            type="number"
            min={0}
            className="h-8 text-xs"
            placeholder="Any"
            value={draft.maxAmount}
            onChange={(e) => setDraft((d) => ({ ...d, maxAmount: e.target.value }))}
          />
        </FilterField>
        <FilterField label="Min remaining">
          <Input
            type="number"
            min={0}
            className="h-8 text-xs"
            placeholder="0"
            value={draft.minOutstanding}
            onChange={(e) => setDraft((d) => ({ ...d, minOutstanding: e.target.value }))}
          />
        </FilterField>
        <FilterField label="Max remaining">
          <Input
            type="number"
            min={0}
            className="h-8 text-xs"
            placeholder="Any"
            value={draft.maxOutstanding}
            onChange={(e) => setDraft((d) => ({ ...d, maxOutstanding: e.target.value }))}
          />
        </FilterField>
      </FilterBar>

      <Card className="mb-4 border-slate-200/80 shadow-sm">
        <CardHeader className="px-4 py-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4" />
            Active loans
          </CardTitle>
          <CardDescription className="text-xs">{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          {flaggedActiveCount > 0 && flaggedActiveCount !== total ? (
            <p className="text-[11px] text-amber-800">
              RukaPay still flags {flaggedActiveCount} subscriber
              {flaggedActiveCount === 1 ? '' : 's'} with an active loan. This table shows live
              RukaSente accounts for the configured partner.
            </p>
          ) : null}

          {listQ.isLoading ? (
            <p className="text-xs text-muted-foreground">Loading loans…</p>
          ) : listQ.error ? (
            <p className="text-xs text-destructive">
              {(listQ.error as Error).message || 'Failed to load loans'}
            </p>
          ) : items.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No loans match the current filters.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-100">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-8 text-[10px] uppercase tracking-wide">
                      Borrower
                    </TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wide">Phone</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wide">
                      Product
                    </TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wide">
                      Disbursed
                    </TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wide">Amount</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wide">
                      Remaining
                    </TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wide">Status</TableHead>
                    <TableHead className="h-8 text-right text-[10px] uppercase tracking-wide">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="py-2">
                        <div className="text-sm font-medium">{row.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {row.applicationNumber}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-xs">{row.phone || '—'}</TableCell>
                      <TableCell className="py-2 text-xs">
                        {row.productName || row.productCode || '—'}
                      </TableCell>
                      <TableCell className="py-2 text-xs">{dateLabel(row.disbursedAt)}</TableCell>
                      <TableCell className="py-2 text-xs font-medium">
                        {formatMoney(row.amount ?? row.disbursedAmount ?? row.requestedAmount, row.currency)}
                      </TableCell>
                      <TableCell className="py-2 text-xs font-medium">
                        {formatMoney(row.outstandingBalance, row.currency)}
                      </TableCell>
                      <TableCell className="py-2">{statusBadge(row.status)}</TableCell>
                      <TableCell className="py-2 text-right">
                        <Button
                          size="sm"
                          className="h-7 bg-[#08163d] px-2.5 text-[11px] text-white hover:bg-[#06102a]"
                          disabled={!row.userId}
                          onClick={() =>
                            row.userId &&
                            router.push(`/dashboard/rukasente-loans/${row.userId}`)
                          }
                        >
                          <Banknote className="mr-1 h-3 w-3" />
                          Open / Collect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </DashboardPageLayout>
  )
}
