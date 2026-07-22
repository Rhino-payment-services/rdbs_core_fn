'use client'

import React from 'react'
import Link from 'next/link'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/dashboard/merchant-events/KpiCard'
import { ChartCard } from '@/components/dashboard/merchant-events/charts/ChartCard'
import { ColumnChart } from '@/components/dashboard/merchant-events/charts/ColumnChart'
import { DonutChart } from '@/components/dashboard/merchant-events/charts/DonutChart'
import { HorizontalBarChart } from '@/components/dashboard/merchant-events/charts/HorizontalBarChart'
import {
  CalendarDays,
  ShoppingCart,
  Users,
  Ticket,
  Building2,
  RefreshCw,
  ArrowRight,
  Headphones,
  BarChart3,
  CheckCircle,
} from 'lucide-react'
import { useMerchantEventsStatistics } from '@/lib/hooks/useMerchantEvents'

export default function MerchantEventsDashboardPage() {
  const { data: stats, isLoading, error, refetch } = useMerchantEventsStatistics()

  const salesData =
    stats?.grossSalesByCurrency?.map((s) => ({
      label: s.currency,
      value: s.grossSales,
      currency: s.currency,
    })) ?? []

  const eventsByStatusData = stats?.eventsByStatus
    ? Object.entries(stats.eventsByStatus).map(([label, value]) => ({ label, value }))
    : []

  const orderStatusData =
    stats?.orderStatusBreakdown?.map((s) => ({ label: s.status, count: s.count })) ?? []

  const paymentStatusData =
    stats?.paymentStatusBreakdown?.map((s) => ({ label: s.status, count: s.count })) ?? []

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('merchant-events')} />
      <DashboardPageHeader
        title="Merchant Events"
        description="Platform-wide monitoring of merchant events, orders, tickets, and revenue"
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {error ? (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center text-red-600">
            Failed to load statistics. Please try again.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Total Events" value={stats.totalEvents} icon={CalendarDays} />
            <KpiCard title="Active Events" value={stats.activeEvents} icon={CalendarDays} iconBg="bg-green-600" valueClassName="text-green-600" />
            <KpiCard title="Merchants with Events" value={stats.totalMerchants} icon={Building2} iconBg="bg-indigo-600" />
            <KpiCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} iconBg="bg-blue-600" />
            <KpiCard title="Paid Orders" value={stats.paidOrders} icon={CheckCircle} iconBg="bg-emerald-600" valueClassName="text-emerald-600" />
            <KpiCard title="Tickets Sold" value={stats.ticketsSoldTotal} icon={Ticket} iconBg="bg-violet-600" />
            <KpiCard title="Attendees" value={stats.totalAttendees} icon={Users} iconBg="bg-purple-600" />
            <KpiCard title="Checked In" value={stats.checkedInCount} icon={CheckCircle} iconBg="bg-teal-600" valueClassName="text-teal-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartCard
              title="Gross Sales by Currency"
              description="Total revenue across all merchant events"
              isEmpty={salesData.length === 0}
              emptyMessage="No sales data yet"
            >
              <ColumnChart data={salesData} valueIsCurrency />
            </ChartCard>

            <ChartCard
              title="Events by Status"
              description="Distribution of event lifecycle states"
              isEmpty={eventsByStatusData.length === 0}
              emptyMessage="No events yet"
            >
              <DonutChart data={eventsByStatusData} centerLabel="Events" />
            </ChartCard>

            <ChartCard title="Order Status Breakdown" isEmpty={orderStatusData.length === 0}>
              <HorizontalBarChart data={orderStatusData} />
            </ChartCard>

            <ChartCard title="Payment Status Breakdown" isEmpty={paymentStatusData.length === 0}>
              <HorizontalBarChart data={paymentStatusData} />
            </ChartCard>
          </div>

          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription>Jump to common ops workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { href: '/dashboard/merchant-events/list', label: 'All Events', icon: CalendarDays },
                  { href: '/dashboard/merchant-events/orders', label: 'Global Orders', icon: ShoppingCart },
                  { href: '/dashboard/merchant-events/support', label: 'Support Lookup', icon: Headphones },
                  { href: '/dashboard/merchant-events/reports', label: 'Revenue Report', icon: BarChart3 },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:border-[#08163d]/30 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#08163d]/5 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-[#08163d]" />
                      </div>
                      <span className="font-medium text-gray-900">{label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#08163d] transition-colors" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </DashboardPageLayout>
  )
}
