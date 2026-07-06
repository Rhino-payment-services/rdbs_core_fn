'use client'

import React, { useState, useCallback } from 'react'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FilterBar, FilterField } from '@/components/dashboard/merchant-events/FilterBar'
import { TableSkeleton } from '@/components/dashboard/merchant-events/TableSkeleton'
import { Download, RefreshCw, BarChart3 } from 'lucide-react'
import { useRevenueReport } from '@/lib/hooks/useMerchantEvents'
import { formatKampalaDateTime, formatUgx } from '@/lib/utils/merchantEvents'
import { downloadCsv } from '@/lib/utils/merchantEventsExport'
import type { RevenueReportFilters } from '@/lib/api/merchantEventsAdminApi'
import { getKampalaCalendarDate } from '@/lib/utils/kampalaDate'

export default function RevenueReportPage() {
  const defaultFrom = getKampalaCalendarDate(-30)
  const defaultTo = getKampalaCalendarDate(0)

  const [draft, setDraft] = useState<RevenueReportFilters>({
    dateFrom: `${defaultFrom}T00:00:00.000Z`,
    dateTo: `${defaultTo}T23:59:59.999Z`,
  })
  const [filters, setFilters] = useState<RevenueReportFilters>(draft)

  const { data, isLoading, error, refetch } = useRevenueReport(filters)

  const applyFilters = useCallback(() => setFilters({ ...draft }), [draft])
  const clearFilters = useCallback(() => {
    const reset = {
      dateFrom: `${defaultFrom}T00:00:00.000Z`,
      dateTo: `${defaultTo}T23:59:59.999Z`,
    }
    setDraft(reset)
    setFilters(reset)
  }, [defaultFrom, defaultTo])

  const exportTable = (name: string, rows: Record<string, unknown>[]) => {
    if (!rows.length) return
    downloadCsv(`revenue-${name}-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('merchant-events/reports')} />
      <DashboardPageHeader
        title="Revenue Report"
        description="Platform revenue breakdown by merchant, event, and currency"
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <FilterBar onApply={applyFilters} onClear={clearFilters} defaultOpen>
        <FilterField label="Date From">
          <Input
            type="date"
            value={draft.dateFrom?.slice(0, 10) ?? ''}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                dateFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined,
              }))
            }
          />
        </FilterField>
        <FilterField label="Date To">
          <Input
            type="date"
            value={draft.dateTo?.slice(0, 10) ?? ''}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                dateTo: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined,
              }))
            }
          />
        </FilterField>
        <FilterField label="Merchant ID">
          <Input
            placeholder="Optional merchant UUID"
            value={draft.merchantId ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, merchantId: e.target.value || undefined }))}
          />
        </FilterField>
      </FilterBar>

      {error ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center text-red-600">Failed to load revenue report</CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#08163d]" />
              Revenue Breakdown
            </CardTitle>
            {data?.generatedAt && (
              <CardDescription>
                Generated at {formatKampalaDateTime(data.generatedAt)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton columns={6} />
            ) : (
              <Tabs defaultValue="merchant">
                <TabsList className="mb-4">
                  <TabsTrigger value="merchant">By Merchant</TabsTrigger>
                  <TabsTrigger value="event">By Event</TabsTrigger>
                  <TabsTrigger value="currency">By Currency</TabsTrigger>
                </TabsList>

                <TabsContent value="merchant">
                  <div className="flex justify-end mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTable('by-merchant', data?.byMerchant as unknown as Record<string, unknown>[] ?? [])}
                      disabled={!data?.byMerchant?.length}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Merchant</TableHead>
                          <TableHead>Events</TableHead>
                          <TableHead>Paid Orders</TableHead>
                          <TableHead>Tickets Sold</TableHead>
                          <TableHead>Gross Sales</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(data?.byMerchant ?? []).map((row) => (
                          <TableRow key={row.merchantId}>
                            <TableCell>
                              <div className="font-medium">{row.merchantName}</div>
                              <div className="text-xs text-gray-500">{row.merchantCode}</div>
                            </TableCell>
                            <TableCell>{row.eventCount}</TableCell>
                            <TableCell>{row.paidOrders}</TableCell>
                            <TableCell>{row.ticketsSold}</TableCell>
                            <TableCell>{formatUgx(row.grossSales, row.currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="event">
                  <div className="flex justify-end mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTable('by-event', data?.byEvent as unknown as Record<string, unknown>[] ?? [])}
                      disabled={!data?.byEvent?.length}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>Merchant</TableHead>
                          <TableHead>Paid Orders</TableHead>
                          <TableHead>Tickets</TableHead>
                          <TableHead>Gross Sales</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(data?.byEvent ?? []).map((row) => (
                          <TableRow key={row.eventId}>
                            <TableCell>
                              <div className="font-medium">{row.eventTitle}</div>
                              <div className="text-xs font-mono text-gray-500">{row.eventCode}</div>
                            </TableCell>
                            <TableCell>{row.merchantName}</TableCell>
                            <TableCell>{row.paidOrders}</TableCell>
                            <TableCell>{row.ticketsSold}</TableCell>
                            <TableCell>{formatUgx(row.grossSales, row.currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="currency">
                  <div className="flex justify-end mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTable('by-currency', data?.byCurrency as unknown as Record<string, unknown>[] ?? [])}
                      disabled={!data?.byCurrency?.length}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Currency</TableHead>
                          <TableHead>Paid Orders</TableHead>
                          <TableHead>Tickets Sold</TableHead>
                          <TableHead>Gross Sales</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(data?.byCurrency ?? []).map((row) => (
                          <TableRow key={row.currency}>
                            <TableCell className="font-medium">{row.currency}</TableCell>
                            <TableCell>{row.paidOrders}</TableCell>
                            <TableCell>{row.ticketsSold}</TableCell>
                            <TableCell>{formatUgx(row.grossSales, row.currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardPageLayout>
  )
}
