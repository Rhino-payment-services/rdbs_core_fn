'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Tariff } from '@/lib/tariffs-new/types'
import {
  filterPendingApprovalTariffs,
  formatAmountRange,
  formatFeeAmount,
  getTransactionTypeLabel,
} from '@/lib/tariffs-new/utils'
import { Clock, ChevronRight } from 'lucide-react'

type PendingApprovalBannerProps = {
  tariffs: Tariff[]
  canApprove: boolean
  onView: (tariff: Tariff) => void
  onApprove: (tariff: Tariff) => void
}

export function PendingApprovalBanner({
  tariffs,
  canApprove,
  onView,
  onApprove,
}: PendingApprovalBannerProps) {
  const pending = filterPendingApprovalTariffs(tariffs)
  if (pending.length === 0) return null

  return (
    <Card className="border-amber-300 bg-amber-50/60 shadow-sm mb-4">
      <CardContent className="px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-700 shrink-0" />
            <div>
              <p className="font-semibold text-amber-950 text-sm">
                {pending.length} tariff{pending.length === 1 ? '' : 's'} pending approval
              </p>
              <p className="text-xs text-amber-800">
                {canApprove
                  ? 'Review and approve or reject before they go live.'
                  : 'Waiting for checker approval.'}
              </p>
            </div>
          </div>
          <Badge className="w-fit bg-amber-200 text-amber-950 border-amber-400">
            Pending approval
          </Badge>
        </div>
        <ul className="space-y-2">
          {pending.map((tariff) => (
            <li
              key={tariff.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-amber-200 bg-white/80 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{tariff.name}</p>
                <p className="text-xs text-gray-600">
                  {getTransactionTypeLabel(tariff.transactionType, tariff)}
                  {' · '}
                  {formatAmountRange(tariff)}
                  {' · '}
                  {formatFeeAmount(tariff)}
                  {tariff.tariffType === 'EXTERNAL' && tariff.apiPartner?.partnerName && (
                    <> · {tariff.apiPartner.partnerName}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => onView(tariff)}>
                  View
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
                {canApprove && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => onApprove(tariff)}
                  >
                    Review
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
