"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCcw, CheckCircle2, XCircle, ArrowRight, Wallet, AlertTriangle, ChevronDown, ChevronRight, Copy } from 'lucide-react'
import type { ManualStatusCheckResult } from '@/lib/hooks/useTransactions'

interface StatusCheckModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  transaction: any | null
  isLoading: boolean
  result: ManualStatusCheckResult | null
  error: Error | null
  onCheck: () => void
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

function CollapsibleSection({
  title,
  badge,
  action,
  children,
}: {
  title: string
  badge?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-md border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full bg-gray-50 border-b px-4 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
        <div className="flex items-center gap-2">
          {badge}
          {action}
          {open ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
        </div>
      </button>
      {open && children}
    </div>
  )
}

export function StatusCheckModal({
  isOpen,
  onOpenChange,
  transaction,
  isLoading,
  result,
  error,
  onCheck,
}: StatusCheckModalProps) {
  const data = result?.data
  const partnerResponse = data?.partnerResponse
  const partnerSuccess = partnerResponse?.success
  const hasResult = !!data || !!error
  const displayCurrency = transaction?.currency || 'UGX'
  const preCheckMeta = (transaction?.metadata || {}) as Record<string, unknown>
  const preCheckCredited = preCheckMeta.walletCredited === true
  const isCollectionType =
    transaction?.type === 'MNO_TO_WALLET' ||
    transaction?.type === 'WALLET_TOPUP_PULL' ||
    String(preCheckMeta.mode || '').includes('COLLECT')
  const walletCredit = data?.walletCredit

  // Request descriptor: top-level partnerRequestBody + any nested partnerRequestInfo (URL/headers from partner)
  const requestBody = data?.partnerRequestBody as Record<string, any> | undefined
  const partnerRequestInfo = requestBody?.partnerRequestInfo as Record<string, any> | undefined

  const handleCopyJson = (label: string, payload: unknown) => {
    if (!payload) return
    try {
      const text = JSON.stringify(payload, null, 2)
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {
          console.error(`[MANUAL_STATUS_CHECK] Failed to copy ${label} to clipboard`)
        })
      } else {
        console.warn('[MANUAL_STATUS_CHECK] Clipboard API not available')
      }
    } catch (err) {
      console.error(`[MANUAL_STATUS_CHECK] Failed to serialise ${label} for copy`, err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        style={{ width: '70vw', maxWidth: '70vw' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <RefreshCcw className="h-4 w-4 text-gray-500" />
            Partner status &amp; merchant credit
          </DialogTitle>
          <DialogDescription className="sr-only">
            Check partner status and whether the merchant wallet was credited
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
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Current Status</span>
              {statusBadge(transaction.status)}
            </div>
            {isCollectionType && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Wallet credited</span>
                <span
                  className={`text-xs font-semibold ${
                    preCheckCredited ? 'text-green-700' : 'text-amber-700'
                  }`}
                >
                  {preCheckCredited
                    ? `Yes${preCheckMeta.creditSource ? ` (${String(preCheckMeta.creditSource)})` : ''}`
                    : 'No — merchant may be missing funds'}
                </span>
              </div>
            )}
            {transaction.amount !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">
                  {displayCurrency} {Number(transaction.amount).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Initial state — prompt to run the check */}
        {!isLoading && !hasResult && (
          <div className="rounded-md border border-dashed border-blue-200 bg-blue-50 px-4 py-5 text-center space-y-3">
            <p className="text-sm text-blue-700">
              Query the partner for the latest status. For collections, this also checks whether the
              merchant wallet was credited and credits it if partner confirms SUCCESS but funds are missing.
            </p>
            {isCollectionType && !preCheckCredited && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                This collection looks uncredited. Running the check can recover the merchant balance
                if the partner still reports SUCCESS.
              </p>
            )}
            <Button
              onClick={onCheck}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {isCollectionType && !preCheckCredited
                ? 'Check partner & recover credit'
                : 'Check Status with Partner'}
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="text-sm">
              {isCollectionType
                ? 'Checking partner status and wallet credit…'
                : 'Querying partner for latest status…'}
            </span>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-semibold text-red-800">Status check failed</p>
              <p className="text-xs text-red-700 whitespace-pre-wrap">
                {(error as any)?.response?.data?.message || error.message}
              </p>
              {typeof (error as any)?.response?.data?.subscriberActionNote === 'string' && (
                <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-2">
                  {(error as any).response.data.subscriberActionNote}
                </p>
              )}
              <Button size="sm" variant="outline" className="mt-2" onClick={onCheck}>
                <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Result */}
        {!isLoading && !error && data && (
          <div className="space-y-4">

            {/* Status change */}
            <div className="rounded-md border p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status Result</p>
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
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{result.message}</p>
              )}
              {data?.subscriberActionNote && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  <span className="font-semibold text-amber-900">Status check notes: </span>
                  {data.subscriberActionNote}
                </div>
              )}
            </div>

            {/* Wallet credit audit (collections) */}
            {walletCredit && (
              <div
                className={`rounded-md border p-4 space-y-2 ${
                  walletCredit.outcome === 'CREDITED_NOW' ||
                  walletCredit.outcome === 'ALREADY_CREDITED'
                    ? 'bg-green-50 border-green-200'
                    : walletCredit.outcome === 'CREDIT_FAILED'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  Merchant Wallet Credit
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {walletCredit.walletCredited ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={
                      walletCredit.walletCredited ? 'text-green-800' : 'text-red-800'
                    }
                  >
                    {walletCredit.walletCredited
                      ? walletCredit.outcome === 'CREDITED_NOW'
                        ? 'Credited now'
                        : 'Already credited'
                      : 'Not credited'}
                  </span>
                </div>
                <p className="text-xs text-gray-700">{walletCredit.message}</p>
                {walletCredit.error && (
                  <p className="text-xs text-red-700 whitespace-pre-wrap">
                    {walletCredit.error}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-gray-500">Source: </span>
                    <span className="font-medium">
                      {walletCredit.creditSource || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount: </span>
                    <span className="font-medium">
                      {walletCredit.creditAmount != null
                        ? `${displayCurrency} ${Number(walletCredit.creditAmount).toLocaleString()}`
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Bal. before: </span>
                    <span className="font-medium">
                      {walletCredit.balanceBefore != null
                        ? Number(walletCredit.balanceBefore).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Bal. after: </span>
                    <span className="font-medium">
                      {walletCredit.balanceAfter != null
                        ? Number(walletCredit.balanceAfter).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}

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
                    {displayCurrency} {Number(data.walletAction.amount).toLocaleString()}
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

            {/* ── REQUEST sent to partner ─────────────────────────────────────── */}
            <CollapsibleSection
              title="Request Sent to Partner"
          badge={
            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {partnerRequestInfo?.method ?? 'GET'}
            </span>
          }
          action={
            requestBody && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-gray-500 hover:text-gray-900"
                onClick={() => handleCopyJson('partner request', requestBody)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )
          }
            >
              <div className="bg-white">
                {requestBody ? (
                  <>
                    {/* URL */}
                    {partnerRequestInfo?.url ? (
                      <div className="border-b px-4 py-2.5">
                        <p className="text-xs text-gray-400 mb-0.5">URL</p>
                        <p className="text-xs font-mono break-all text-blue-700">{partnerRequestInfo.url}</p>
                      </div>
                    ) : (
                      <div className="border-b px-4 py-2.5">
                        <p className="text-xs text-gray-400 mb-0.5">URL</p>
                        <p className="text-xs font-mono text-gray-500">
                          {/* Reconstruct from descriptor when partner didn't expose URL directly */}
                          Status check for <span className="text-blue-700">{requestBody.transactionReference}</span> via <span className="font-semibold">{requestBody.partnerCode}</span> ({requestBody.serviceType})
                        </p>
                      </div>
                    )}
                    {/* Query params */}
                    {partnerRequestInfo?.queryParams && Object.keys(partnerRequestInfo.queryParams).length > 0 && (
                      <div className="border-b px-4 py-2.5">
                        <p className="text-xs text-gray-400 mb-0.5">Query Parameters</p>
                        <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                          {JSON.stringify(partnerRequestInfo.queryParams, null, 2)}
                        </pre>
                      </div>
                    )}
                    {/* Headers (masked) */}
                    {partnerRequestInfo?.headers && (
                      <div className="border-b px-4 py-2.5">
                        <p className="text-xs text-gray-400 mb-0.5">Headers (sensitive values masked)</p>
                        <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                          {JSON.stringify(partnerRequestInfo.headers, null, 2)}
                        </pre>
                      </div>
                    )}
                    {/* Descriptor — service-level metadata */}
                    <div className="px-4 py-2.5">
                      <p className="text-xs text-gray-400 mb-0.5">Descriptor</p>
                      <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                        {JSON.stringify(
                          {
                            serviceType: requestBody.serviceType,
                            partnerCode: requestBody.partnerCode,
                            transactionReference: requestBody.transactionReference,
                            internalTransactionId: requestBody.internalTransactionId,
                            calledAt: requestBody.calledAt,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-4 text-center">
                    <p className="text-xs text-gray-400">
                      Request details not available — restart the backend with the latest update and recheck.
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* ── RESPONSE from partner ────────────────────────────────────────── */}
            <CollapsibleSection
              title="Partner Response Body"
              badge={
                partnerResponse !== undefined && partnerResponse !== null ? (
                  <span className={`text-xs font-medium ${partnerSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {partnerSuccess ? 'Success' : 'Error'}
                  </span>
                ) : undefined
              }
          action={
            partnerResponse !== undefined && partnerResponse !== null ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-gray-500 hover:text-gray-900"
                onClick={() => handleCopyJson('partner response', partnerResponse)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            ) : undefined
          }
            >
              {partnerResponse !== undefined && partnerResponse !== null ? (
                <pre className="text-xs font-mono p-4 bg-white overflow-x-auto max-h-56 leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(partnerResponse, null, 2)}
                </pre>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-400">
                    Partner response body not available — deploy the latest backend update and run again.
                  </p>
                </div>
              )}
            </CollapsibleSection>

            {data.checkedAt && (
              <p className="text-xs text-gray-400 text-right">
                Checked at {new Date(data.checkedAt).toLocaleString()}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={onCheck} disabled={isLoading}>
                <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />
                Recheck
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
