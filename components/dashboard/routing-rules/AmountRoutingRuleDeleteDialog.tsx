'use client'

import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import type { AmountRoutingRule } from '@/lib/hooks/useAmountRoutingRules'
import { useDeleteAmountRoutingRule } from '@/lib/hooks/useAmountRoutingRules'
import { formatAmountBand } from '@/lib/routing-rules/utils'

interface AmountRoutingRuleDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: AmountRoutingRule | null
  onSuccess?: () => void
}

export function AmountRoutingRuleDeleteDialog({
  open,
  onOpenChange,
  rule,
  onSuccess,
}: AmountRoutingRuleDeleteDialogProps) {
  const deleteRule = useDeleteAmountRoutingRule()

  if (!rule) return null

  const hasBeenUsed = rule.totalTransactions > 0

  const handleDelete = async () => {
    await deleteRule.mutateAsync(rule.id)
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasBeenUsed ? 'Deactivate routing rule?' : 'Delete routing rule?'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                {formatAmountBand(rule.currency, rule.minAmount, rule.maxAmount)}
                {rule.partner ? ` → ${rule.partner.partnerCode}` : ''}
              </p>
              {hasBeenUsed ? (
                <p>
                  This rule has been used in {rule.totalTransactions.toLocaleString('en-UG')}{' '}
                  transaction(s). It will be deactivated, not permanently deleted.
                </p>
              ) : (
                <p>Permanently delete this rule? This action cannot be undone.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRule.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              void handleDelete()
            }}
            disabled={deleteRule.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteRule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {hasBeenUsed ? 'Deactivate' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
