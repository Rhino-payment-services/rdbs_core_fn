'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import {
  getEventStatusColor,
  getOrderStatusColor,
  getTicketStatusColor,
} from '@/lib/utils/merchantEvents'

export function EventStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={getEventStatusColor(status)}>
      {status}
    </Badge>
  )
}

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={getOrderStatusColor(status)}>
      {status}
    </Badge>
  )
}

export function TicketStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={getTicketStatusColor(status)}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const color =
    status === 'SUCCESS'
      ? 'bg-green-100 text-green-800 border-green-200'
      : status === 'PENDING'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : status === 'FAILED'
          ? 'bg-red-100 text-red-800 border-red-200'
          : 'bg-gray-100 text-gray-700 border-gray-200'
  return (
    <Badge variant="outline" className={color}>
      {status}
    </Badge>
  )
}
