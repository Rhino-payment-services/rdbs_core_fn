'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { TransactionTypeConfig } from '@/lib/tariffs-new/types'
import type { Tariff } from '@/lib/tariffs-new/types'
import { getTransactionTypeLabel } from '@/lib/tariffs-new/utils'
import { TariffTierTable } from './TariffTierTable'

type TransactionTypeScheduleCardProps = {
  transactionType: string
  config: TransactionTypeConfig
  tariffs: Tariff[]
  defaultOpen?: boolean
  showNetwork?: boolean
  showChannel?: boolean
  canManage: boolean
  canApprove: boolean
  currentUserId?: string
  onView: (tariff: Tariff) => void
  onEdit: (tariff: Tariff) => void
  onDelete: (tariff: Tariff) => void
  onApprove: (tariff: Tariff) => void
  onReject: (tariff: Tariff) => void
  onSubmitForApproval: (tariffId: string) => void
}

export function TransactionTypeScheduleCard({
  transactionType,
  config,
  tariffs,
  defaultOpen = true,
  showNetwork,
  showChannel,
  canManage,
  canApprove,
  currentUserId,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onSubmitForApproval,
}: TransactionTypeScheduleCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const Icon = config.icon
  const label = getTransactionTypeLabel(transactionType, tariffs[0])

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config.color}`}
            >
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-gray-900 text-sm">{label}</h4>
                <Badge variant="secondary" className="text-xs font-normal">
                  {tariffs.length} tier{tariffs.length === 1 ? '' : 's'}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 truncate">{config.description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0 px-4 pb-4">
          <TariffTierTable
            tariffs={tariffs}
            showNetwork={showNetwork}
            showChannel={showChannel}
            canManage={canManage}
            canApprove={canApprove}
            currentUserId={currentUserId}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onApprove={onApprove}
            onReject={onReject}
            onSubmitForApproval={onSubmitForApproval}
          />
        </CardContent>
      )}
    </Card>
  )
}
