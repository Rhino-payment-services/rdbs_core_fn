'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Store } from 'lucide-react'
import type { PartnerBucket } from '@/lib/tariffs-new/types'
import { MERCHANT_TRANSACTION_TYPES } from '@/lib/tariffs-new/constants'
import {
  countTariffStatuses,
  groupTariffsByTransactionType,
} from '@/lib/tariffs-new/utils'
import { PendingApprovalBanner } from './PendingApprovalBanner'
import { TransactionTypeScheduleCard } from './TransactionTypeScheduleCard'
import type { Tariff } from '@/lib/tariffs-new/types'

type MerchantPanelProps = {
  merchant: PartnerBucket
  canManage: boolean
  canApprove: boolean
  currentUserId?: string
  onCreateTariff: (merchantId?: string) => void
  onView: (tariff: Tariff) => void
  onEdit: (tariff: Tariff) => void
  onDelete: (tariff: Tariff) => void
  onApprove: (tariff: Tariff) => void
  onReject: (tariff: Tariff) => void
  onSubmitForApproval: (tariffId: string) => void
}

export function MerchantPanel({
  merchant,
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
}: MerchantPanelProps) {
  const typeKeys = Object.keys(MERCHANT_TRANSACTION_TYPES)
  const byType = groupTariffsByTransactionType(merchant.tariffs, typeKeys)
  const activeTypes = typeKeys.filter((k) => (byType[k]?.length ?? 0) > 0)
  const stats = countTariffStatuses(merchant.tariffs)

  const merchantId = merchant.key.startsWith('merchant:')
    ? merchant.key.replace('merchant:', '')
    : undefined

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-280px)]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">{merchant.label}</h2>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
              <Store className="w-3 h-3 mr-1" />
              Merchant
            </Badge>
          </div>
          {merchant.sublabel && (
            <p className="text-sm text-gray-500 mt-1 font-mono">{merchant.sublabel}</p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            {activeTypes.length} product{activeTypes.length === 1 ? '' : 's'} ·{' '}
            {merchant.tariffs.length} tier{merchant.tariffs.length === 1 ? '' : 's'}
            {stats.pending > 0 && (
              <span className="text-amber-800 font-medium">
                {' '}
                · {stats.pending} pending approval
              </span>
            )}
          </p>
        </div>
        {canManage && (
          <Button
            size="sm"
            className="shrink-0"
            onClick={() => onCreateTariff(merchantId)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add tariff
          </Button>
        )}
      </div>

      <PendingApprovalBanner
        tariffs={merchant.tariffs}
        canApprove={canApprove}
        onView={onView}
        onApprove={onApprove}
      />

      {activeTypes.length === 0 ? (
        <p className="text-gray-500 text-sm">No custom tariffs for this merchant yet.</p>
      ) : (
        <div className="space-y-4">
          {activeTypes.map((type) => {
            const config = MERCHANT_TRANSACTION_TYPES[type]
            if (!config) return null
            const tiers = byType[type] || []
            return (
              <TransactionTypeScheduleCard
                key={type}
                transactionType={type}
                config={config}
                tariffs={tiers}
                defaultOpen={tiers.length <= 8}
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
