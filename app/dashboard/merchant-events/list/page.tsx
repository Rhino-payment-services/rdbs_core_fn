'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FilterBar, FilterField } from '@/components/dashboard/merchant-events/FilterBar'
import { EventStatusBadge } from '@/components/dashboard/merchant-events/StatusBadges'
import { TableSkeleton } from '@/components/dashboard/merchant-events/TableSkeleton'
import { EmptyState } from '@/components/dashboard/merchant-events/EmptyState'
import { CalendarDays, Download, RefreshCw } from 'lucide-react'
import { useMerchantEventsList, useExportEvents } from '@/lib/hooks/useMerchantEvents'
import { formatKampalaDateTime, formatUgx, EVENT_STATUS_OPTIONS } from '@/lib/utils/merchantEvents'
import { downloadCsv } from '@/lib/utils/merchantEventsExport'
import type { EventListFilters } from '@/lib/api/merchantEventsAdminApi'
import { toast } from 'sonner'

const PAGE_SIZE = 20

export default function MerchantEventsListPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState<EventListFilters>({ limit: PAGE_SIZE })
  const [filters, setFilters] = useState<EventListFilters>({ page: 1, limit: PAGE_SIZE })

  const { data, isLoading, error, refetch } = useMerchantEventsList(filters)
  const exportMutation = useExportEvents()

  const events = data?.data ?? []
  const total = data?.total ?? data?.meta?.total ?? events.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const applyFilters = useCallback(() => {
    setPage(1)
    setFilters({ ...draft, page: 1, limit: PAGE_SIZE })
  }, [draft])

  const clearFilters = useCallback(() => {
    setDraft({ limit: PAGE_SIZE })
    setPage(1)
    setFilters({ page: 1, limit: PAGE_SIZE })
  }, [])

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync(filters)
      if (!result.rows?.length) {
        toast.info('No data to export')
        return
      }
      downloadCsv(`merchant-events-${new Date().toISOString().slice(0, 10)}.csv`, result.rows)
      toast.success(`Exported ${result.rows.length} events`)
    } catch {
      // toast handled in mutation
    }
  }

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('merchant-events/list')} />
      <DashboardPageHeader
        title="All Events"
        description="Browse and filter merchant events across the platform"
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </>
        }
      />

      <FilterBar onApply={applyFilters} onClear={clearFilters}>
        <FilterField label="Search">
          <Input
            placeholder="Title or event code…"
            value={draft.search ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value || undefined }))}
          />
        </FilterField>
        <FilterField label="Status">
          <Select
            value={draft.status ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, status: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {EVENT_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Merchant Code">
          <Input
            placeholder="RUKA-BIZ-001"
            value={draft.merchantCode ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, merchantCode: e.target.value || undefined }))}
          />
        </FilterField>
        <FilterField label="Starts From">
          <Input
            type="date"
            value={draft.startsFrom?.slice(0, 10) ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, startsFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined }))}
          />
        </FilterField>
        <FilterField label="Starts To">
          <Input
            type="date"
            value={draft.startsTo?.slice(0, 10) ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, startsTo: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined }))}
          />
        </FilterField>
        <FilterField label="Type">
          <Select
            value={draft.isFree === undefined ? 'all' : draft.isFree ? 'free' : 'paid'}
            onValueChange={(v) =>
              setDraft((d) => ({
                ...d,
                isFree: v === 'all' ? undefined : v === 'free',
              }))
            }
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="free">Free events</SelectItem>
              <SelectItem value="paid">Paid events</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
      </FilterBar>

      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle>Events ({total.toLocaleString()})</CardTitle>
          <CardDescription>Click a row to view event details</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-600 text-center py-8">Failed to load events</p>
          ) : isLoading ? (
            <TableSkeleton columns={8} />
          ) : events.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No events found"
              description="Try adjusting your filters or check back when merchants create events."
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Gross</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow
                        key={event.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/dashboard/merchant-events/${event.id}`)}
                      >
                        <TableCell>
                          <div className="font-medium text-gray-900">{event.title}</div>
                          <div className="text-xs font-mono text-gray-500">{event.eventCode}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{event.merchant?.businessTradeName ?? '—'}</div>
                          <div className="text-xs text-gray-500">{event.merchant?.merchantCode}</div>
                        </TableCell>
                        <TableCell><EventStatusBadge status={event.status} /></TableCell>
                        <TableCell className="whitespace-nowrap">{formatKampalaDateTime(event.startsAt)}</TableCell>
                        <TableCell className="max-w-[160px] truncate">{event.location ?? '—'}</TableCell>
                        <TableCell>
                          {event.ticketsSold ?? 0} / {event.capacity ?? '—'}
                        </TableCell>
                        <TableCell>{event.orderCount ?? '—'}</TableCell>
                        <TableCell>
                          {event.grossSales != null
                            ? formatUgx(event.grossSales, event.currency ?? 'UGX')
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => {
                        const p = page - 1
                        setPage(p)
                        setFilters((f) => ({ ...f, page: p }))
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => {
                        const p = page + 1
                        setPage(p)
                        setFilters((f) => ({ ...f, page: p }))
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </DashboardPageLayout>
  )
}
