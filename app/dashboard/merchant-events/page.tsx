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
import { formatUgx, CHART_COLORS } from '@/lib/utils/merchantEvents'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

const chartConfig = {
  count: { label: 'Count', color: '#08163d' },
  grossSales: { label: 'Gross Sales', color: '#3b5bdb' },
}

export default function MerchantEventsDashboardPage() {
  const { data: stats, isLoading, error, refetch } = useMerchantEventsStatistics()

  const salesData = stats?.grossSalesByCurrency?.map((s) => ({
    name: s.currency,
    grossSales: s.grossSales,
  })) ?? []

  const eventsByStatusData = stats?.eventsByStatus
    ? Object.entries(stats.eventsByStatus).map(([status, count]) => ({ status, count }))
    : []

  const orderStatusData = stats?.orderStatusBreakdown ?? []
  const paymentStatusData = stats?.paymentStatusBreakdown ?? []

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
            <Card className="shadow-sm border-gray-100">
              <CardHeader>
                <CardTitle className="text-base">Gross Sales by Currency</CardTitle>
                <CardDescription>Total revenue across all merchant events</CardDescription>
              </CardHeader>
              <CardContent>
                {salesData.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">No sales data yet</p>
                ) : (
                  <ChartContainer config={chartConfig} className="h-[240px] w-full">
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatUgx(Number(v))} />} />
                      <Bar dataKey="grossSales" fill="#08163d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100">
              <CardHeader>
                <CardTitle className="text-base">Events by Status</CardTitle>
                <CardDescription>Distribution of event lifecycle states</CardDescription>
              </CardHeader>
              <CardContent>
                {eventsByStatusData.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">No events yet</p>
                ) : (
                  <ChartContainer config={chartConfig} className="h-[240px] w-full">
                    <PieChart>
                      <Pie
                        data={eventsByStatusData}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {eventsByStatusData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100">
              <CardHeader>
                <CardTitle className="text-base">Order Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <BarChart data={orderStatusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="status" width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#3b5bdb" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100">
              <CardHeader>
                <CardTitle className="text-base">Payment Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <BarChart data={paymentStatusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="status" width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#5c7cfa" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
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
