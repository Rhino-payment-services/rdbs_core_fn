'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Zap } from 'lucide-react'
import type { PartnerBucket } from '@/lib/tariffs-new/types'
import {
  EXTERNAL_TRANSACTION_TYPES,
} from '@/lib/tariffs-new/constants'
import { groupTariffsByTransactionType } from '@/lib/tariffs-new/utils'
import { TransactionTypeScheduleCard } from './TransactionTypeScheduleCard'
import type { Tariff } from '@/lib/tariffs-new/types'

type ExternalPartnerPanelProps = {
  partner: PartnerBucket
  canManage: boolean
  canApprove: boolean
  currentUserId?: string
  onCreateTariff: (apiPartnerId?: string) => void
  onView: (tariff: Tariff) => void
  onEdit: (tariff: Tariff) => void
  onDelete: (tariff: Tariff) => void
  onApprove: (tariff: Tariff) => void
  onReject: (tariff: Tariff) => void
  onSubmitForApproval: (tariffId: string) => void
}

export function ExternalPartnerPanel({
  partner,
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
}: ExternalPartnerPanelProps) {
  const typeKeys = Object.keys(EXTERNAL_TRANSACTION_TYPES)
  const byType = groupTariffsByTransactionType(partner.tariffs, typeKeys)
  const activeTypes = typeKeys.filter((k) => (byType[k]?.length ?? 0) > 0)

  const apiPartnerId = partner.key.startsWith('api:')
    ? partner.key.replace('api:', '')
    : undefined

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-280px)]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">{partner.label}</h2>
            {partner.kind === 'api' && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Zap className="w-3 h-3 mr-1" />
                API Partner
              </Badge>
            )}
            {partner.kind === 'external' && (
              <Badge variant="outline">External Partner</Badge>
            )}
            {partner.kind === 'general' && (
              <Badge variant="secondary">Platform tariffs</Badge>
            )}
          </div>
          {partner.sublabel && (
            <p className="text-sm text-gray-500 mt-1">{partner.sublabel}</p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            {activeTypes.length} product{activeTypes.length === 1 ? '' : 's'} ·{' '}
            {partner.tariffs.length} tier{partner.tariffs.length === 1 ? '' : 's'}
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => onCreateTariff(apiPartnerId)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add tariff
          </Button>
        )}
      </div>

      {activeTypes.length === 0 ? (
        <p className="text-gray-500 text-sm">No tariffs for this partner.</p>
      ) : (
        <div className="space-y-4">
          {activeTypes.map((type) => {
            const config = EXTERNAL_TRANSACTION_TYPES[type]
            if (!config) return null
            const tiers = byType[type] || []
            const needsNetwork = tiers.some((t) => t.network)
            return (
              <TransactionTypeScheduleCard
                key={type}
                transactionType={type}
                config={config}
                tariffs={tiers}
                defaultOpen={tiers.length <= 8}
                showNetwork={needsNetwork}
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
      )}
    </div>
  )
}
