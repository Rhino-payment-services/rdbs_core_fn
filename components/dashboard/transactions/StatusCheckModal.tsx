"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCcw, CheckCircle2, XCircle, ArrowRight, Wallet, AlertTriangle } from 'lucide-react'
import type { ManualStatusCheckResult } from '@/lib/hooks/useTransactions'

interface StatusCheckModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  transaction: any | null
  isLoading: boolean
  result: ManualStatusCheckResult | null
  error: Error | null
  onRetry: () => void
}

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
}

const statusBadge = (status?: string) => (
  <Badge className={`${STATUS_COLORS[status ?? ''] || 'bg-gray-100 text-gray-700 border-gray-200'} border text-xs font-semibold uppercase`}>
    {status ?? '—'}
  </Badge>
)

export function StatusCheckModal({
  isOpen,
  onOpenChange,
  transaction,
  isLoading,
  result,
  error,
  onRetry,
}: StatusCheckModalProps) {
  const data = result?.data
  const partnerResponse = data?.partnerResponse
  const partnerSuccess = partnerResponse?.success

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <RefreshCcw className="h-4 w-4 text-gray-500" />
            Partner Status Check
          </DialogTitle>
          <DialogDescription className="sr-only">
            Real-time status check with external payment partner
          </DialogDescription>
        </DialogHeader>

        {/* Transaction summary */}
        {transaction && (
          <div className="rounded-md bg-gray-50 border px-4 py-3 text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Transaction</span>
              <span className="font-mono font-medium text-gray-900">
                {transaction.reference || transaction.id}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Type</span>
              <span className="text-gray-700">{transaction.type}</span>
            </div>
            {transaction.amount !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">
                  {transaction.currency} {Number(transaction.amount).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-sm">Querying partner for latest status…</span>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-semibold text-red-800">Status check failed</p>
              <p className="text-xs text-red-700">
                {(error as any)?.response?.data?.message || error.message}
              </p>
              <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>
                <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Result */}
        {!isLoading && !error && data && (
          <div className="space-y-4">

            {/* Status change */}
            <div className="rounded-md border p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
              <div className="flex items-center gap-3 flex-wrap">
                {statusBadge(data.previousStatus)}
                <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                {statusBadge(data.newStatus)}
                {data.statusChanged ? (
                  <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Updated
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 font-medium">No change</span>
                )}
              </div>
              {result?.message && (
                <p className="text-sm text-gray-600">{result.message}</p>
              )}
            </div>

            {/* Wallet adjustment */}
            {data.walletAction && (
              <div className={`rounded-md border p-4 space-y-1.5 ${data.walletAction.type === 'CREDITED' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  Wallet Adjustment
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {data.walletAction.type === 'CREDITED' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-orange-600" />
                  )}
                  <span className={data.walletAction.type === 'CREDITED' ? 'text-green-700' : 'text-orange-700'}>
                    {data.walletAction.type === 'CREDITED' ? '+' : '-'}
                    {transaction?.currency || ''} {Number(data.walletAction.amount).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{data.walletAction.reason}</p>
              </div>
            )}

            {/* Partner info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border p-3 space-y-0.5">
                <p className="text-xs text-gray-500">Partner</p>
                <p className="font-medium">{data.partnerName || data.partnerCode || '—'}</p>
                {data.partnerCode && (
                  <p className="text-xs text-gray-400">{data.partnerCode}</p>
                )}
              </div>
              <div className="rounded-md border p-3 space-y-0.5">
                <p className="text-xs text-gray-500">Partner Status</p>
                <p className="font-medium font-mono text-xs">{data.partnerStatus || '—'}</p>
                {data.externalReference && (
                  <p className="text-xs text-gray-400">Ref: {data.externalReference}</p>
                )}
              </div>
            </div>

            {/* Raw partner response — only shown if available */}
            {partnerResponse !== undefined && partnerResponse !== null ? (
              <div className="rounded-md border overflow-hidden">
                <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Partner Response Body
                  </p>
                  <span className={`text-xs font-medium ${partnerSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {partnerSuccess ? 'Success' : 'Error'}
                  </span>
                </div>
                <pre className="text-xs font-mono p-4 bg-white overflow-x-auto max-h-56 leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(partnerResponse, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center">
                <p className="text-xs text-gray-400">
                  Partner response body not available for this check.
                  Run the check again after the latest backend update is deployed.
                </p>
              </div>
            )}

            {data.checkedAt && (
              <p className="text-xs text-gray-400 text-right">
                Checked at {new Date(data.checkedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
