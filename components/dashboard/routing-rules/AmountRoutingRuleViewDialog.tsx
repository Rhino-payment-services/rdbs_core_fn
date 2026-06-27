'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit } from 'lucide-react'
import type { AmountRoutingRule } from '@/lib/hooks/useAmountRoutingRules'
import { formatAmountBand, formatRoutingNetwork, formatRoutingTransactionType } from '@/lib/routing-rules/utils'
import { formatDate } from '@/lib/utils/transactions'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-left sm:text-right">{value}</span>
    </div>
  )
}

interface AmountRoutingRuleViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: AmountRoutingRule | null
  canManage?: boolean
  onEdit?: (rule: AmountRoutingRule) => void
}

export function AmountRoutingRuleViewDialog({
  open,
  onOpenChange,
  rule,
  canManage = false,
  onEdit,
}: AmountRoutingRuleViewDialogProps) {
  if (!rule) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Amount routing rule</DialogTitle>
          <DialogDescription>
            Amount band rule for selected API partner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          <DetailRow label="API partner ID" value={rule.apiPartnerId || '—'} />
          <DetailRow label="Currency" value={rule.currency.toUpperCase()} />
          <DetailRow
            label="Amount range"
            value={formatAmountBand(rule.currency, rule.minAmount, rule.maxAmount)}
          />
          <DetailRow
            label="Partner"
            value={
              rule.partner ? (
                <span>
                  {rule.partner.partnerName}{' '}
                  <Badge variant="outline" className="ml-1 text-xs font-normal">
                    {rule.partner.partnerCode}
                  </Badge>
                </span>
              ) : (
                '—'
              )
            }
          />
          <DetailRow
            label="Transaction type"
            value={formatRoutingTransactionType(rule.transactionType)}
          />
          <DetailRow label="Network" value={formatRoutingNetwork(rule.network)} />
          <DetailRow
            label="Geographic region"
            value={rule.geographicRegion || 'Any'}
          />
          {rule.paymentMethod ? (
            <DetailRow label="Payment method" value={rule.paymentMethod} />
          ) : null}
          <DetailRow label="Priority" value={rule.priority} />
          <DetailRow
            label="Status"
            value={
              rule.isActive ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )
            }
          />
          <DetailRow label="Total transactions" value={rule.totalTransactions.toLocaleString('en-UG')} />
          <DetailRow
            label="Last used"
            value={rule.lastUsedAt ? formatDate(rule.lastUsedAt) : '—'}
          />
          <DetailRow
            label="Created"
            value={rule.createdAt ? formatDate(rule.createdAt) : '—'}
          />
          <DetailRow
            label="Updated"
            value={rule.updatedAt ? formatDate(rule.updatedAt) : '—'}
          />

          <DetailRow
            label="Rule ID"
            value={<span className="font-mono text-xs break-all">{rule.id}</span>}
          />
        </div>

        <DialogFooter>
          {canManage && onEdit && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                onEdit(rule)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit rule
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
