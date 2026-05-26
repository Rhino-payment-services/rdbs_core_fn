'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import type { Tariff } from '@/lib/tariffs-new/types'
import { INTERNAL_TRANSACTION_TYPES } from '@/lib/tariffs-new/constants'
import { groupTariffsByTransactionType } from '@/lib/tariffs-new/utils'
import { TransactionTypeScheduleCard } from './TransactionTypeScheduleCard'

type InternalTariffsViewProps = {
  tariffs: Tariff[]
  canManage: boolean
  canApprove: boolean
  currentUserId?: string
  onCreateTariff: () => void
  onView: (tariff: Tariff) => void
  onEdit: (tariff: Tariff) => void
  onDelete: (tariff: Tariff) => void
  onApprove: (tariff: Tariff) => void
  onReject: (tariff: Tariff) => void
  onSubmitForApproval: (tariffId: string) => void
}

export function InternalTariffsView({
  tariffs,
  canManage,
  canApprove,
  currentUserId,
  onCreateTariff,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onSubmitForApproval,
}: InternalTariffsViewProps) {
  const typeKeys = Object.keys(INTERNAL_TRANSACTION_TYPES)
  const byType = groupTariffsByTransactionType(tariffs, typeKeys)
  const activeTypes = typeKeys.filter((k) => (byType[k]?.length ?? 0) > 0)

  if (tariffs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 mb-4">No internal tariffs configured yet.</p>
          {canManage && (
            <Button onClick={onCreateTariff}>
              <Plus className="h-4 w-4 mr-2" />
              Create internal tariff
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {activeTypes.length} categories · {tariffs.length} tariffs
        </p>
        {canManage && (
          <Button size="sm" variant="outline" onClick={onCreateTariff}>
            <Plus className="h-4 w-4 mr-2" />
            Add tariff
          </Button>
        )}
      </div>
      {activeTypes.map((type) => {
        const config = INTERNAL_TRANSACTION_TYPES[type]
        if (!config) return null
        return (
          <TransactionTypeScheduleCard
            key={type}
            transactionType={type}
            config={config}
            tariffs={byType[type] || []}
            showChannel
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
        )
      })}
    </div>
  )
}
