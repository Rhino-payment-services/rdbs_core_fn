'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CopyableRef } from '@/components/dashboard/merchant-events/CopyableRef'
import { OrderStatusBadge, PaymentStatusBadge, TicketStatusBadge } from '@/components/dashboard/merchant-events/StatusBadges'
import { ConfirmActionDialog } from '@/components/dashboard/merchant-events/ConfirmActionDialog'
import { EmptyState } from '@/components/dashboard/merchant-events/EmptyState'
import { useMerchantEventsPermissions } from '@/components/dashboard/merchant-events/MerchantEventsGuard'
import { useOrderDetail, useResendTicketEmail } from '@/lib/hooks/useMerchantEvents'
import { formatKampalaDateTime, formatUgx } from '@/lib/utils/merchantEvents'
import { Mail, ShoppingCart, ArrowLeft } from 'lucide-react'

export default function OrderDetailPage() {
  const params = useParams()
  const orderRef = decodeURIComponent(params.ref as string)
  const { canManage } = useMerchantEventsPermissions()
  const [resendOpen, setResendOpen] = useState(false)

  const { data: order, isLoading, error } = useOrderDetail(orderRef)
  const resendMutation = useResendTicketEmail()

  const canResend =
    canManage &&
    order?.status === 'PAID' &&
    !!order?.buyerEmail

  const handleResend = async () => {
    await resendMutation.mutateAsync(orderRef)
    setResendOpen(false)
  }

  if (isLoading) {
    return (
      <DashboardPageLayout>
        <div className="py-16 text-center text-gray-500">Loading order…</div>
      </DashboardPageLayout>
    )
  }

  if (error || !order) {
    return (
      <DashboardPageLayout>
        <DashboardBreadcrumbs items={getDashboardPageCrumbs('merchant-events/orders/[ref]')} />
        <EmptyState
          icon={ShoppingCart}
          title="Order not found"
          description={`No order found for reference "${orderRef}".`}
          actionLabel="Back to orders"
          onAction={() => window.location.href = '/dashboard/merchant-events/orders'}
        />
      </DashboardPageLayout>
    )
  }

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('merchant-events/orders/[ref]')} />
      <DashboardPageHeader
        title="Order Detail"
        description={
          <CopyableRef value={order.orderReference} label="Order ref" className="text-base" />
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/merchant-events/orders">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            {canResend && (
              <Button
                className="bg-[#08163d] hover:bg-[#0a1f52]"
                onClick={() => setResendOpen(true)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Resend Ticket Email
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-sm border-gray-100 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Quantity</dt>
                <dd className="font-medium">{order.quantity}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Unit Price</dt>
                <dd className="font-medium">{formatUgx(order.unitPrice, order.currency)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Total</dt>
                <dd className="font-bold text-lg">{formatUgx(order.totalPrice, order.currency)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Order Status</dt>
                <dd><OrderStatusBadge status={order.status} /></dd>
              </div>
              <div>
                <dt className="text-gray-500">Payment Status</dt>
                <dd><PaymentStatusBadge status={order.paymentStatus} /></dd>
              </div>
              <div>
                <dt className="text-gray-500">Paid At</dt>
                <dd>{formatKampalaDateTime(order.paidAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd>{formatKampalaDateTime(order.createdAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Buyer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{order.buyerName ?? '—'}</p>
            <p className="text-gray-600">{order.buyerPhone ?? '—'}</p>
            <p className="text-gray-600">{order.buyerEmail ?? '—'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Event</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/dashboard/merchant-events/${order.event.id}`}
              className="font-medium text-[#08163d] hover:underline"
            >
              {order.event.title}
            </Link>
            <p className="text-xs font-mono text-gray-500 mt-1">{order.event.eventCode}</p>
            {order.event.startsAt && (
              <p className="text-sm text-gray-500 mt-2">{formatKampalaDateTime(order.event.startsAt)}</p>
            )}
            {order.event.location && (
              <p className="text-sm text-gray-500">{order.event.location}</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-base">Merchant & Tier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">{order.merchant.businessTradeName}</p>
              <p className="text-gray-500">{order.merchant.merchantCode}</p>
            </div>
            {order.tier && (
              <div>
                <p className="text-gray-500">Tier</p>
                <p className="font-medium">{order.tier.name}</p>
                <p className="text-gray-500">{formatUgx(order.tier.price, order.tier.currency)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {order.transaction && (
        <Card className="shadow-sm border-gray-100 mb-6">
          <CardHeader>
            <CardTitle className="text-base">Linked Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Reference</dt>
                <dd>
                  {order.transaction.reference ? (
                    <CopyableRef value={order.transaction.reference} label="Transaction ref" />
                  ) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd>{order.transaction.status ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">External Ref</dt>
                <dd>
                  {order.transaction.externalReference ? (
                    <CopyableRef value={order.transaction.externalReference} label="External ref" />
                  ) : '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="text-base">Tickets / Attendees ({order.attendees?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!order.attendees?.length ? (
            <p className="text-gray-500 text-sm py-4">No attendees on this order.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Checked In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.attendees.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <CopyableRef value={a.ticketCode} label="Ticket code" />
                      </TableCell>
                      <TableCell>{a.attendeeName ?? '—'}</TableCell>
                      <TableCell>{a.attendeePhone ?? '—'}</TableCell>
                      <TableCell><TicketStatusBadge status={a.status} /></TableCell>
                      <TableCell>{formatKampalaDateTime(a.checkedInAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={resendOpen}
        onOpenChange={setResendOpen}
        title="Resend ticket email?"
        description={`This will resend ticket emails to ${order.buyerEmail} for order ${order.orderReference}.`}
        confirmLabel="Resend Email"
        loading={resendMutation.isPending}
        onConfirm={handleResend}
      />
    </DashboardPageLayout>
  )
}
