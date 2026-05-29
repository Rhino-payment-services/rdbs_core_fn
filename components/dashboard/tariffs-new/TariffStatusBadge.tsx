'use client'

import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, FileText, XCircle } from 'lucide-react'
import type { Tariff } from '@/lib/tariffs-new/types'

export function TariffStatusBadge({ tariff }: { tariff: Tariff }) {
  if (!tariff.status && !tariff.approvalStatus) {
    const active = tariff.isActive
    return (
      <Badge
        variant={active ? 'default' : 'secondary'}
        className={
          active
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-gray-100 text-gray-800 border-gray-200'
        }
      >
        {active ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </>
        )}
      </Badge>
    )
  }

  const status = String(tariff.status || tariff.approvalStatus || '')

  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      )
    case 'PENDING_APPROVAL':
    case 'PENDING':
      return (
        <Badge className="bg-amber-100 text-amber-900 border-amber-300">
          <Clock className="w-3 h-3 mr-1" />
          Pending approval
        </Badge>
      )
    case 'REJECTED':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      )
    case 'DRAFT':
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
          <FileText className="w-3 h-3 mr-1" />
          Draft
        </Badge>
      )
    default:
      return <Badge variant="secondary">{String(status)}</Badge>
  }
}
