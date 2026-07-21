'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/dashboard/merchant-events/StatusBadges'
import { CopyableRef } from '@/components/dashboard/merchant-events/CopyableRef'
import { TableSkeleton } from '@/components/dashboard/merchant-events/TableSkeleton'
import { EmptyState } from '@/components/dashboard/merchant-events/EmptyState'
import { ShoppingCart, Download, RefreshCw } from 'lucide-react'
import { useGlobalOrders, useExportOrders, useMerchantEventsStatistics } from '@/lib/hooks/useMerchantEvents'
import { formatKampalaDateTime, formatUgx, ORDER_STATUS_OPTIONS } from '@/lib/utils/merchantEvents'
import { downloadCsv } from '@/lib/utils/merchantEventsExport'
import type { OrderListFilters } from '@/lib/api/merchantEventsAdminApi'
import { toast } from 'sonner'
import { PlatformSnapshot } from '@/components/dashboard/merchant-events/charts/PlatformSnapshot'

const PAGE_SIZE = 20

export default function GlobalOrdersPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState<OrderListFilters>({ limit: PAGE_SIZE })
  const [filters, setFilters] = useState<OrderListFilters>({ page: 1, limit: PAGE_SIZE })

  const { data, isLoading, error, refetch } = useGlobalOrders(filters)
  const { data: stats, isLoading: statsLoading } = useMerchantEventsStatistics()
  const exportMutation = useExportOrders()

  const orders = data?.data ?? []
  const total = data?.total ?? data?.meta?.total ?? orders.length
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
      downloadCsv(`merchant-event-orders-${new Date().toISOString().slice(0, 10)}.csv`, result.rows)
      toast.success(`Exported ${result.rows.length} orders`)
    } catch {
      // handled in mutation
    }
  }

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('merchant-events/orders')} />
      <DashboardPageHeader
        title="Global Orders"
        description="Search and monitor ticket orders across all merchant events"
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

      <PlatformSnapshot
        variant="orders"
        isLoading={statsLoading}
        orderStatusBreakdown={stats?.orderStatusBreakdown}
        paymentStatusBreakdown={stats?.paymentStatusBreakdown}
      />

      <FilterBar onApply={applyFilters} onClear={clearFilters}>
        <FilterField label="Order Reference">
          <Input
            placeholder="ORD-…"
            value={draft.orderReference ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, orderReference: e.target.value || undefined }))}
          />
        </FilterField>
        <FilterField label="Buyer Phone">
          <Input
            placeholder="+256…"
            value={draft.buyerPhone ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, buyerPhone: e.target.value || undefined }))}
          />
        </FilterField>
        <FilterField label="Buyer Email">
          <Input
            placeholder="email@example.com"
            value={draft.buyerEmail ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, buyerEmail: e.target.value || undefined }))}
          />
        </FilterField>
        <FilterField label="Order Status">
          <Select
            value={draft.status ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, status: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Created From">
          <Input
            type="date"
            value={draft.createdFrom?.slice(0, 10) ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, createdFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined }))}
          />
        </FilterField>
        <FilterField label="Created To">
          <Input
            type="date"
            value={draft.createdTo?.slice(0, 10) ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, createdTo: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined }))}
          />
        </FilterField>
      </FilterBar>

      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle>Orders ({total.toLocaleString()})</CardTitle>
          <CardDescription>Click a row to view order details</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-red-600 text-center py-8">Failed to load orders</p>
          ) : isLoading ? (
            <TableSkeleton columns={9} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No orders found"
              description="Try adjusting your search filters."
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Paid At</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id ?? order.orderReference}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          router.push(`/dashboard/merchant-events/orders/${encodeURIComponent(order.orderReference)}`)
                        }
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <CopyableRef value={order.orderReference} label="Order ref" />
                        </TableCell>
                        <TableCell>
                          {order.event ? (
                            <Link
                              href={`/dashboard/merchant-events/${order.event.id}`}
                              className="text-[#08163d] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.event.title}
                            </Link>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{order.merchant?.businessTradeName ?? '—'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{order.buyerPhone ?? '—'}</div>
                          <div className="text-xs text-gray-500">{order.buyerEmail ?? ''}</div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatUgx(order.totalPrice, order.currency)}
                        </TableCell>
                        <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                        <TableCell><PaymentStatusBadge status={order.paymentStatus} /></TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatKampalaDateTime(order.paidAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatKampalaDateTime(order.createdAt)}
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
