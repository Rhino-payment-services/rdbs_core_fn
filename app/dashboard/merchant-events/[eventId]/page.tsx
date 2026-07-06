'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { KpiCard } from '@/components/dashboard/merchant-events/KpiCard'
import { CopyableRef } from '@/components/dashboard/merchant-events/CopyableRef'
import { EventStatusBadge, OrderStatusBadge, PaymentStatusBadge, TicketStatusBadge } from '@/components/dashboard/merchant-events/StatusBadges'
import { FilterBar, FilterField } from '@/components/dashboard/merchant-events/FilterBar'
import { ConfirmActionDialog } from '@/components/dashboard/merchant-events/ConfirmActionDialog'
import { EmptyState } from '@/components/dashboard/merchant-events/EmptyState'
import { TableSkeleton } from '@/components/dashboard/merchant-events/TableSkeleton'
import { useMerchantEventsPermissions } from '@/components/dashboard/merchant-events/MerchantEventsGuard'
import {
  useMerchantEventDetail,
  useEventOrders,
  useEventAttendees,
  useCheckInStatistics,
  useUpdateEventStatus,
  useUpdateTierStatus,
} from '@/lib/hooks/useMerchantEvents'
import {
  formatKampalaDateTime,
  formatUgx,
  resolveMediaUrl,
  ORDER_STATUS_OPTIONS,
} from '@/lib/utils/merchantEvents'
import type { EventStatus, TierStatus, EventOrderFilters, AttendeeListFilters } from '@/lib/api/merchantEventsAdminApi'
import {
  ArrowLeft,
  CalendarDays,
  DollarSign,
  Users,
  Ticket,
  MapPin,
  Building2,
  Pause,
  Play,
  Ban,
} from 'lucide-react'

const PAGE_SIZE = 15

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const { canManage } = useMerchantEventsPermissions()

  const [activeTab, setActiveTab] = useState('overview')
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; status?: EventStatus }>({ open: false })
  const [tierDialog, setTierDialog] = useState<{ open: boolean; tierId?: string; tierName?: string; status?: TierStatus }>({ open: false })

  const [orderDraft, setOrderDraft] = useState<EventOrderFilters>({ limit: PAGE_SIZE })
  const [orderFilters, setOrderFilters] = useState<EventOrderFilters>({ page: 1, limit: PAGE_SIZE })
  const [orderPage, setOrderPage] = useState(1)

  const [attendeeDraft, setAttendeeDraft] = useState<AttendeeListFilters>({ limit: PAGE_SIZE })
  const [attendeeFilters, setAttendeeFilters] = useState<AttendeeListFilters>({ page: 1, limit: PAGE_SIZE })
  const [attendeePage, setAttendeePage] = useState(1)

  const { data: event, isLoading, error } = useMerchantEventDetail(eventId)
  const { data: ordersData, isLoading: ordersLoading } = useEventOrders(eventId, orderFilters, activeTab === 'orders')
  const { data: attendeesData, isLoading: attendeesLoading } = useEventAttendees(eventId, attendeeFilters, activeTab === 'attendees')
  const { data: checkIn } = useCheckInStatistics(eventId, activeTab === 'checkin')

  const updateStatus = useUpdateEventStatus()
  const updateTier = useUpdateTierStatus()

  const bannerUrl = resolveMediaUrl(event?.bannerUrl)
  const tierSalesMap = new Map(
    (event?.salesStatistics?.tierSales ?? []).map((t) => [t.tierId, t])
  )

  const handleEventStatus = async () => {
    if (!statusDialog.status) return
    await updateStatus.mutateAsync({ eventId, status: statusDialog.status })
    setStatusDialog({ open: false })
  }

  const handleTierStatus = async () => {
    if (!tierDialog.tierId || !tierDialog.status) return
    await updateTier.mutateAsync({ eventId, tierId: tierDialog.tierId, status: tierDialog.status })
    setTierDialog({ open: false })
  }

  const applyOrderFilters = useCallback(() => {
    setOrderPage(1)
    setOrderFilters({ ...orderDraft, page: 1, limit: PAGE_SIZE })
  }, [orderDraft])

  const applyAttendeeFilters = useCallback(() => {
    setAttendeePage(1)
    setAttendeeFilters({ ...attendeeDraft, page: 1, limit: PAGE_SIZE })
  }, [attendeeDraft])

  if (isLoading) {
    return (
      <DashboardPageLayout>
        <div className="py-16 text-center text-gray-500">Loading event…</div>
      </DashboardPageLayout>
    )
  }

  if (error || !event) {
    return (
      <DashboardPageLayout>
        <DashboardBreadcrumbs items={getDashboardPageCrumbs('merchant-events/[eventId]')} />
        <EmptyState
          icon={CalendarDays}
          title="Event not found"
          description="This event may have been removed or you don't have access."
          actionLabel="Back to events"
          onAction={() => router.push('/dashboard/merchant-events/list')}
        />
      </DashboardPageLayout>
    )
  }

  const orders = ordersData?.data ?? []
  const ordersTotal = ordersData?.total ?? ordersData?.meta?.total ?? orders.length
  const attendees = attendeesData?.data ?? []
  const attendeesTotal = attendeesData?.total ?? attendeesData?.meta?.total ?? attendees.length

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('merchant-events/[eventId]')} />
      <DashboardPageHeader
        title={event.title}
        description={
          <span className="flex items-center gap-2">
            <span className="font-mono text-sm">{event.eventCode}</span>
            <EventStatusBadge status={event.status} />
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/merchant-events/list">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            {canManage && (
              <>
                {event.status !== 'PAUSED' && event.status !== 'CANCELLED' && (
                  <Button
                    variant="outline"
                    onClick={() => setStatusDialog({ open: true, status: 'PAUSED' })}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Event
                  </Button>
                )}
                {event.status === 'PAUSED' && (
                  <Button
                    variant="outline"
                    onClick={() => setStatusDialog({ open: true, status: 'ACTIVE' })}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume Event
                  </Button>
                )}
                {!['CANCELLED', 'COMPLETED', 'CLOSED'].includes(event.status) && (
                  <Button
                    variant="destructive"
                    onClick={() => setStatusDialog({ open: true, status: 'CANCELLED' })}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancel Event
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      {bannerUrl && (
        <div className="relative w-full h-48 md:h-56 rounded-xl overflow-hidden mb-6 shadow-sm">
          <Image src={bannerUrl} alt={event.title} fill className="object-cover" unoptimized />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="attendees">Attendees</TabsTrigger>
          <TabsTrigger value="checkin">Check-in</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <KpiCard
              title="Paid Orders"
              value={event.summary.paidOrderCount}
              icon={Ticket}
              iconBg="bg-blue-600"
            />
            <KpiCard
              title="Gross Sales"
              value={formatUgx(event.summary.grossSales, event.summary.currency)}
              icon={DollarSign}
              iconBg="bg-emerald-600"
            />
            <KpiCard
              title="Checked In"
              value={event.summary.checkedInCount}
              icon={Users}
              iconBg="bg-teal-600"
            />
            <KpiCard
              title="Remaining Capacity"
              value={event.summary.remainingCapacity}
              icon={CalendarDays}
              iconBg="bg-violet-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="shadow-sm border-gray-100 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p>{formatKampalaDateTime(event.startsAt)}</p>
                    {event.endsAt && <p className="text-gray-500">to {formatKampalaDateTime(event.endsAt)}</p>}
                  </div>
                </div>
                {event.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <p>{event.location}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="outline">{event.isFree ? 'Free' : 'Paid'}</Badge>
                  <Badge variant="outline">{event.isPublic ? 'Public' : 'Private'}</Badge>
                  <Badge variant="outline">{event.isActive ? 'Active' : 'Inactive'}</Badge>
                  <Badge variant="outline">Capacity: {event.capacity}</Badge>
                </div>
                {event.description && (
                  <p className="text-gray-600 pt-2 border-t">{event.description}</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Merchant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{event.merchant.businessTradeName}</p>
                <p className="text-sm text-gray-500">{event.merchant.merchantCode}</p>
                <Link
                  href={`/dashboard/customers/merchant/${event.merchant.id}`}
                  className="text-sm text-[#08163d] hover:underline mt-2 inline-block"
                >
                  View merchant profile →
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-base">Ticket Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Sold / Capacity</TableHead>
                      <TableHead>Gross Sales</TableHead>
                      <TableHead>Status</TableHead>
                      {canManage && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.tiers.map((tier) => {
                      const sales = tierSalesMap.get(tier.id)
                      return (
                        <TableRow key={tier.id}>
                          <TableCell className="font-medium">{tier.name}</TableCell>
                          <TableCell>{formatUgx(tier.price, tier.currency)}</TableCell>
                          <TableCell>{sales?.sold ?? tier.sold ?? 0} / {tier.capacity}</TableCell>
                          <TableCell>
                            {sales ? formatUgx(sales.grossSales, sales.currency) : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={tier.status === 'ACTIVE' ? 'bg-green-50' : 'bg-amber-50'}>
                              {tier.status}
                            </Badge>
                          </TableCell>
                          {canManage && (
                            <TableCell>
                              {tier.status === 'ACTIVE' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setTierDialog({ open: true, tierId: tier.id, tierName: tier.name, status: 'PAUSED' })
                                  }
                                >
                                  <Pause className="h-3 w-3 mr-1" />
                                  Pause
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setTierDialog({ open: true, tierId: tier.id, tierName: tier.name, status: 'ACTIVE' })
                                  }
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Resume
                                </Button>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <FilterBar onApply={applyOrderFilters} onClear={() => { setOrderDraft({ limit: PAGE_SIZE }); setOrderFilters({ page: 1, limit: PAGE_SIZE }); setOrderPage(1) }}>
            <FilterField label="Search">
              <Input
                placeholder="Buyer name, ref…"
                value={orderDraft.search ?? ''}
                onChange={(e) => setOrderDraft((d) => ({ ...d, search: e.target.value || undefined }))}
              />
            </FilterField>
            <FilterField label="Status">
              <Select value={orderDraft.status ?? 'all'} onValueChange={(v) => setOrderDraft((d) => ({ ...d, status: v === 'all' ? undefined : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {ORDER_STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </FilterField>
            <FilterField label="Buyer Phone">
              <Input
                value={orderDraft.buyerPhone ?? ''}
                onChange={(e) => setOrderDraft((d) => ({ ...d, buyerPhone: e.target.value || undefined }))}
              />
            </FilterField>
          </FilterBar>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="pt-6">
              {ordersLoading ? (
                <TableSkeleton columns={7} />
              ) : orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No orders for this event.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Paid At</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((o) => (
                        <TableRow
                          key={o.orderReference}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => router.push(`/dashboard/merchant-events/orders/${encodeURIComponent(o.orderReference)}`)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <CopyableRef value={o.orderReference} label="Order ref" />
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{o.buyerPhone ?? '—'}</div>
                            <div className="text-xs text-gray-500">{o.buyerEmail}</div>
                          </TableCell>
                          <TableCell>{formatUgx(o.totalPrice, o.currency)}</TableCell>
                          <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                          <TableCell><PaymentStatusBadge status={o.paymentStatus} /></TableCell>
                          <TableCell className="text-sm">{formatKampalaDateTime(o.paidAt)}</TableCell>
                          <TableCell className="text-sm">{formatKampalaDateTime(o.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {ordersTotal > PAGE_SIZE && (
                <div className="flex justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">{ordersTotal} orders</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={orderPage <= 1} onClick={() => { const p = orderPage - 1; setOrderPage(p); setOrderFilters((f) => ({ ...f, page: p })) }}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={orderPage * PAGE_SIZE >= ordersTotal} onClick={() => { const p = orderPage + 1; setOrderPage(p); setOrderFilters((f) => ({ ...f, page: p })) }}>Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendees">
          <FilterBar onApply={applyAttendeeFilters} onClear={() => { setAttendeeDraft({ limit: PAGE_SIZE }); setAttendeeFilters({ page: 1, limit: PAGE_SIZE }); setAttendeePage(1) }}>
            <FilterField label="Search">
              <Input
                placeholder="Name, ticket code…"
                value={attendeeDraft.search ?? ''}
                onChange={(e) => setAttendeeDraft((d) => ({ ...d, search: e.target.value || undefined }))}
              />
            </FilterField>
            <FilterField label="Status">
              <Select value={attendeeDraft.status ?? 'all'} onValueChange={(v) => setAttendeeDraft((d) => ({ ...d, status: v === 'all' ? undefined : v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="CHECKED_IN">CHECKED IN</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  <SelectItem value="VOID">VOID</SelectItem>
                </SelectContent>
              </Select>
            </FilterField>
          </FilterBar>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="pt-6">
              {attendeesLoading ? (
                <TableSkeleton columns={7} />
              ) : attendees.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No attendees for this event.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Checked In</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendees.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell><CopyableRef value={a.ticketCode} label="Ticket code" /></TableCell>
                          <TableCell>{a.attendeeName ?? '—'}</TableCell>
                          <TableCell>{a.attendeePhone ?? '—'}</TableCell>
                          <TableCell>{a.attendeeEmail ?? '—'}</TableCell>
                          <TableCell>{a.tier?.name ?? '—'}</TableCell>
                          <TableCell><TicketStatusBadge status={a.status} /></TableCell>
                          <TableCell className="text-sm">{formatKampalaDateTime(a.checkedInAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkin">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm border-gray-100 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Check-in Progress</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-6">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#08163d"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(checkIn?.checkInRate ?? 0) * 2.64} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-[#08163d]">
                      {Math.round(checkIn?.checkInRate ?? 0)}%
                    </span>
                    <span className="text-xs text-gray-500">check-in rate</span>
                  </div>
                </div>
                <dl className="grid grid-cols-3 gap-4 w-full mt-6 text-center text-sm">
                  <div>
                    <dt className="text-gray-500">Total</dt>
                    <dd className="font-bold text-lg">{checkIn?.totalAttendees ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Checked In</dt>
                    <dd className="font-bold text-lg text-green-600">{checkIn?.checkedInCount ?? 0}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Pending</dt>
                    <dd className="font-bold text-lg text-amber-600">{checkIn?.pendingCount ?? 0}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-100 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Recent Check-ins</CardTitle>
              </CardHeader>
              <CardContent>
                {!checkIn?.recentCheckIns?.length ? (
                  <p className="text-gray-500 text-sm py-8 text-center">No check-ins yet.</p>
                ) : (
                  <div className="space-y-3">
                    {checkIn.recentCheckIns.map((ci, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                        <div>
                          <p className="font-medium">{ci.attendeeName ?? 'Guest'}</p>
                          <CopyableRef value={ci.ticketCode} label="Ticket code" className="text-xs" />
                        </div>
                        <div className="text-right text-sm">
                          {ci.tierName && <p className="text-gray-500">{ci.tierName}</p>}
                          <p className="text-gray-600">{formatKampalaDateTime(ci.checkedInAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmActionDialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog((s) => ({ ...s, open }))}
        title={`Change event status to ${statusDialog.status}?`}
        description={`This will update the event "${event.title}" to ${statusDialog.status}. This action may affect ticket sales and attendee access.`}
        confirmLabel={`Set ${statusDialog.status}`}
        destructive={statusDialog.status === 'CANCELLED'}
        loading={updateStatus.isPending}
        onConfirm={handleEventStatus}
      />

      <ConfirmActionDialog
        open={tierDialog.open}
        onOpenChange={(open) => setTierDialog((s) => ({ ...s, open }))}
        title={`${tierDialog.status === 'PAUSED' ? 'Pause' : 'Resume'} tier "${tierDialog.tierName}"?`}
        description={
          tierDialog.status === 'PAUSED'
            ? 'Pausing this tier will stop new ticket sales for it.'
            : 'Resuming this tier will allow ticket sales again.'
        }
        confirmLabel={tierDialog.status === 'PAUSED' ? 'Pause Tier' : 'Resume Tier'}
        destructive={tierDialog.status === 'PAUSED'}
        loading={updateTier.isPending}
        onConfirm={handleTierStatus}
      />
    </DashboardPageLayout>
  )
}
