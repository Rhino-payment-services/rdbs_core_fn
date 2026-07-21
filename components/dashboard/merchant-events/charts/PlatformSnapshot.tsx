'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ColumnChart } from './ColumnChart'
import { DonutChart } from './DonutChart'
import { HorizontalBarChart } from './HorizontalBarChart'
import type { ColumnChartItem } from './ColumnChart'
import type { DonutChartItem } from './DonutChart'
import type { HorizontalBarChartItem } from './HorizontalBarChart'

interface PlatformSnapshotProps {
  eventsByStatus?: Record<string, number>
  grossSalesByCurrency?: { currency: string; grossSales: number }[]
  orderStatusBreakdown?: { status: string; count: number }[]
  paymentStatusBreakdown?: { status: string; count: number }[]
  variant?: 'list' | 'orders'
  isLoading?: boolean
}

export function PlatformSnapshot({
  eventsByStatus,
  grossSalesByCurrency,
  orderStatusBreakdown,
  paymentStatusBreakdown,
  variant = 'list',
  isLoading = false,
}: PlatformSnapshotProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-56 bg-white rounded-xl border animate-pulse" />
        ))}
      </div>
    )
  }

  const eventsData: DonutChartItem[] = eventsByStatus
    ? Object.entries(eventsByStatus).map(([label, value]) => ({ label, value }))
    : []

  const salesData: ColumnChartItem[] =
    grossSalesByCurrency?.map((s) => ({
      label: s.currency,
      value: s.grossSales,
      currency: s.currency,
    })) ?? []

  const orderData: HorizontalBarChartItem[] =
    orderStatusBreakdown?.map((s) => ({ label: s.status, count: s.count })) ?? []

  const paymentData: HorizontalBarChartItem[] =
    paymentStatusBreakdown?.map((s) => ({ label: s.status, count: s.count })) ?? []

  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Platform snapshot</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {variant === 'list' ? (
          <>
            <ChartCard
              title="Events by Status"
              description="All events on the platform"
              isEmpty={eventsData.length === 0}
            >
              <DonutChart data={eventsData} centerLabel="Events" compact />
            </ChartCard>
            <ChartCard
              title="Gross Sales by Currency"
              description="Total revenue across all events"
              isEmpty={salesData.length === 0}
              emptyMessage="No sales data yet"
            >
              <ColumnChart data={salesData} valueIsCurrency compact />
            </ChartCard>
          </>
        ) : (
          <>
            <ChartCard title="Order Status" description="All merchant event orders" isEmpty={orderData.length === 0}>
              <HorizontalBarChart data={orderData} compact />
            </ChartCard>
            <ChartCard title="Payment Status" description="All merchant event orders" isEmpty={paymentData.length === 0}>
              <HorizontalBarChart data={paymentData} compact />
            </ChartCard>
          </>
        )}
      </div>
    </div>
  )
}

function ChartCard({
  title,
  description,
  isEmpty,
  emptyMessage = 'No data yet',
  children,
}: {
  title: string
  description?: string
  isEmpty?: boolean
  emptyMessage?: string
  children: React.ReactNode
}) {
  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="text-gray-500 text-sm py-6 text-center">{emptyMessage}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
