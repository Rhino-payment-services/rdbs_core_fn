'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopyableRef } from '@/components/dashboard/merchant-events/CopyableRef'
import { TicketStatusBadge } from '@/components/dashboard/merchant-events/StatusBadges'
import { EmptyState } from '@/components/dashboard/merchant-events/EmptyState'
import { Search, Ticket, ShoppingCart, Phone, ArrowRight } from 'lucide-react'
import { useTicketLookup, useGlobalOrders } from '@/lib/hooks/useMerchantEvents'
import { formatKampalaDateTime } from '@/lib/utils/merchantEvents'

type SearchMode = 'ticket' | 'order' | 'phone'

export default function SupportLookupPage() {
  const router = useRouter()
  const [mode, setMode] = useState<SearchMode>('ticket')
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [submittedMode, setSubmittedMode] = useState<SearchMode>('ticket')

  const ticketEnabled = submittedMode === 'ticket' && !!submitted
  const { data: ticket, isLoading: ticketLoading, error: ticketError } = useTicketLookup(submitted, ticketEnabled)

  const phoneEnabled = submittedMode === 'phone' && !!submitted
  const { data: phoneOrders, isLoading: phoneLoading } = useGlobalOrders(
    { buyerPhone: submitted, limit: 10 },
    phoneEnabled
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    if (mode === 'order') {
      router.push(`/dashboard/merchant-events/orders/${encodeURIComponent(trimmed)}`)
      return
    }

    setSubmitted(trimmed)
    setSubmittedMode(mode)
  }

  const showTicketResult = submittedMode === 'ticket' && !!submitted
  const showPhoneResult = submittedMode === 'phone' && !!submitted

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('merchant-events/support')} />
      <DashboardPageHeader
        title="Support Lookup"
        description="Fast ticket and order lookup for customer support"
      />

      <Card className="shadow-sm border-gray-100 mb-6">
        <CardContent className="p-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as SearchMode)} className="mb-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="ticket" className="gap-1.5">
                <Ticket className="h-3.5 w-3.5" />
                Ticket
              </TabsTrigger>
              <TabsTrigger value="order" className="gap-1.5">
                <ShoppingCart className="h-3.5 w-3.5" />
                Order
              </TabsTrigger>
              <TabsTrigger value="phone" className="gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Phone
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSearch} className="flex gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10 h-12 text-base"
                placeholder={
                  mode === 'ticket'
                    ? 'Enter ticket code…'
                    : mode === 'order'
                      ? 'Enter order reference…'
                      : 'Enter buyer phone number…'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="submit" className="h-12 px-6 bg-[#08163d] hover:bg-[#0a1f52]">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {showTicketResult && (
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Ticket Lookup Result</CardTitle>
          </CardHeader>
          <CardContent>
            {ticketLoading ? (
              <div className="py-8 text-center text-gray-500">Searching…</div>
            ) : ticketError || !ticket ? (
              <EmptyState
                icon={Ticket}
                title="Ticket not found"
                description={`No ticket found for code "${submitted}". Verify the code and try again.`}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Ticket Code</p>
                    <CopyableRef value={ticket.ticketCode} label="Ticket code" className="text-lg" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Status</p>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Attendee</p>
                    <p className="font-medium">{ticket.attendeeName ?? '—'}</p>
                    <p className="text-sm text-gray-500">{ticket.attendeePhone}</p>
                    <p className="text-sm text-gray-500">{ticket.attendeeEmail}</p>
                  </div>
                  {ticket.checkedInAt && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Checked In</p>
                      <p className="text-sm">{formatKampalaDateTime(ticket.checkedInAt)}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {ticket.event && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Event</p>
                      <Link
                        href={`/dashboard/merchant-events/${ticket.event.id}`}
                        className="font-medium text-[#08163d] hover:underline flex items-center gap-1"
                      >
                        {ticket.event.title}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <p className="text-xs font-mono text-gray-500">{ticket.event.eventCode}</p>
                    </div>
                  )}
                  {ticket.merchant && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Merchant</p>
                      <p className="font-medium">{ticket.merchant.businessTradeName}</p>
                      <p className="text-xs text-gray-500">{ticket.merchant.merchantCode}</p>
                    </div>
                  )}
                  {ticket.tier && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Tier</p>
                      <p>{ticket.tier.name}</p>
                    </div>
                  )}
                  {ticket.orderReference && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Order</p>
                      <Link
                        href={`/dashboard/merchant-events/orders/${encodeURIComponent(ticket.orderReference)}`}
                        className="text-[#08163d] hover:underline"
                      >
                        <CopyableRef value={ticket.orderReference} label="Order ref" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showPhoneResult && (
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Orders for {submitted}</CardTitle>
          </CardHeader>
          <CardContent>
            {phoneLoading ? (
              <div className="py-8 text-center text-gray-500">Searching…</div>
            ) : !phoneOrders?.data?.length ? (
              <EmptyState
                icon={Phone}
                title="No orders found"
                description={`No orders found for phone number "${submitted}".`}
              />
            ) : (
              <div className="space-y-3">
                {phoneOrders.data.map((order) => (
                  <Link
                    key={order.orderReference}
                    href={`/dashboard/merchant-events/orders/${encodeURIComponent(order.orderReference)}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-[#08163d]/30 hover:bg-gray-50 transition-all"
                  >
                    <div>
                      <CopyableRef value={order.orderReference} label="Order ref" />
                      <p className="text-sm text-gray-500 mt-1">{order.event?.title ?? 'Unknown event'}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardPageLayout>
  )
}
