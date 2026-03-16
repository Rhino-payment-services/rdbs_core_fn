"use client"

import React, { useCallback, useEffect, useState } from 'react'
import api from '@/lib/axios'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Eye, Loader2, RotateCcw, XCircle } from 'lucide-react'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'

type ReversalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

interface PartnerReversalRequest {
  id: string
  partnerId: string
  transactionId: string
  reason: string
  details?: string | null
  status: ReversalStatus
  createdAt: string
  reviewedAt?: string | null
  cancelledAt?: string | null
  reviewNote?: string | null
  partner?: {
    id: string
    partnerName: string
  } | null
  transaction?: {
    id: string
    amount: number
    currency: string
    status: string
    type: string
    reference?: string | null
    mode?: string | null
    createdAt: string
    description?: string | null
  } | null
}

interface ReversalListResponse {
  success: boolean
  data: PartnerReversalRequest[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export default function FinancePartnerReversalsPage() {
  const { hasPermission } = usePermissions()

  const [statusFilter, setStatusFilter] = useState<'' | ReversalStatus>('PENDING')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const [data, setData] = useState<ReversalListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [reviewNote, setReviewNote] = useState('')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null)

  const [selectedRequest, setSelectedRequest] = useState<PartnerReversalRequest | null>(null)

  const canReview = hasPermission(PERMISSIONS.TRANSACTIONS_REVERSE)

  const fetchReversals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const query = new URLSearchParams()
      query.set('page', String(page))
      query.set('limit', String(limit))
      if (statusFilter) query.set('status', statusFilter)

      const res = await api.get<ReversalListResponse>(
        `/api/v1/admin/gateway-partners/reversal-requests?${query.toString()}`,
      )
      setData(res.data)
    } catch (err: any) {
      console.error('Failed to load partner reversal requests', err)
      setError(err.response?.data?.message || err.message || 'Failed to load reversal requests')
    } finally {
      setLoading(false)
    }
  }, [page, limit, statusFilter])

  useEffect(() => {
    fetchReversals()
  }, [fetchReversals])

  const totalPages = data?.meta?.totalPages || 1

  const openReview = (id: string, action: 'approve' | 'reject') => {
    setReviewingId(id)
    setReviewAction(action)
    setReviewNote('')
  }

  const submitReview = async () => {
    if (!reviewingId || !reviewAction) return
    try {
      setError(null)
      const url =
        reviewAction === 'approve'
          ? `/api/v1/admin/gateway-partners/reversal-requests/${reviewingId}/approve`
          : `/api/v1/admin/gateway-partners/reversal-requests/${reviewingId}/reject`

      await api.patch(url, { reviewNote: reviewNote || undefined })
      setReviewingId(null)
      setReviewAction(null)
      setReviewNote('')
      await fetchReversals()
    } catch (err: any) {
      console.error('Failed to review reversal request', err)
      setError(err.response?.data?.message || err.message || 'Failed to review reversal request')
    }
  }

  if (!canReview) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-8 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-600" />
            <h1 className="text-xl font-semibold text-red-800 mb-1">
              You do not have access to reversal approvals
            </h1>
            <p className="text-sm text-red-700">
              Ask a system administrator to grant you the TRANSACTION_REVERSAL_REVIEW permission.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Partner Reversal Requests</h1>
            <p className="mt-1 text-gray-600">
              Review reversal requests submitted by API gateway partners.
            </p>
          </div>
          {data && (
            <div className="text-sm text-gray-500">
              <div>Total: {data.meta.total}</div>
              <div>
                Page {data.meta.page} of {totalPages}
              </div>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Reversal Queue</span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">Status</label>
                  <select
                    className="border rounded-md px-2 py-1 text-sm"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as ReversalStatus | '')
                      setPage(1)
                    }}
                  >
                    <option value="">All</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="py-8 text-center text-gray-500 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading reversal requests...</span>
              </div>
            ) : !data?.data?.length ? (
              <div className="py-8 text-center text-gray-500">
                No reversal requests found for this filter.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="px-3 py-2 text-left">Request</th>
                        <th className="px-3 py-2 text-left">Partner</th>
                        <th className="px-3 py-2 text-left">Transaction</th>
                        <th className="px-3 py-2 text-left">Amount</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Reason</th>
                        <th className="px-3 py-2 text-left">Created</th>
                        <th className="px-3 py-2 text-left">Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.map((req) => {
                        const created = new Date(req.createdAt).toLocaleString()
                        const amount = req.transaction?.amount ?? 0
                        const currency = req.transaction?.currency ?? ''
                        const reference = req.transaction?.reference || '—'

                        const statusBadge =
                          req.status === 'PENDING'
                            ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                            : req.status === 'APPROVED'
                            ? 'bg-green-50 text-green-800 border-green-200'
                            : req.status === 'REJECTED'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'

                        const canAct = req.status === 'PENDING'

                        return (
                          <tr key={req.id} className="border-b last:border-b-0">
                            <td className="px-3 py-2 align-top">
                              <button
                                type="button"
                                onClick={() => setSelectedRequest(req)}
                                className="flex items-center gap-1 font-mono text-xs text-blue-600 hover:underline underline-offset-2"
                              >
                                <Eye className="w-3 h-3" />
                                <span>{reference}</span>
                              </button>
                            </td>
                            <td className="px-3 py-2 align-top text-sm">
                              <div className="font-medium">
                                {req.partner?.partnerName || req.partnerId}
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top text-xs">
                              <div className="font-mono">{reference}</div>
                              <div className="text-[11px] text-gray-500">
                                {req.transaction?.type} · {req.transaction?.status}
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top text-sm">
                              {amount.toLocaleString()} {currency}
                            </td>
                            <td className="px-3 py-2 align-top">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${statusBadge}`}
                              >
                                {req.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-top text-xs max-w-xs">
                              <div className="font-semibold text-gray-800 truncate" title={req.reason}>
                                {req.reason}
                              </div>
                              {req.details && (
                                <div
                                  className="text-[11px] text-gray-500 truncate"
                                  title={req.details}
                                >
                                  {req.details}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 align-top text-xs text-gray-500">
                              {created}
                            </td>
                            <td className="px-3 py-2 align-top text-xs">
                              {canAct ? (
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => openReview(req.id, 'approve')}
                                    className="inline-flex items-center justify-center px-2 py-1 rounded-md border border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => openReview(req.id, 'reject')}
                                    className="inline-flex items-center justify-center px-2 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[11px] text-gray-400">
                                  Reviewed
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                  <div>
                    Page {data.meta.page} of {totalPages} · Total {data.meta.total} request
                    {data.meta.total === 1 ? '' : 's'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-2 py-1 border rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2 py-1 border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {selectedRequest && (
          <div className="absolute h-full w-full inset-0 z-1000 flex items-center  top-0 left-0  justify-center bg-black/60">
            <div className="max-w-3xl max-h-[90vh] w-full mx-4 rounded-xl bg-white shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-900">Reversal Request Details</h2>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
              <div className="px-4 py-3 space-y-4 text-xs text-gray-800">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500">Request ID</div>
                    <div className="font-mono break-all">{selectedRequest.id}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500">Status</div>
                    <div>{selectedRequest.status}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500">Partner</div>
                    <div className="font-medium">
                      {selectedRequest.partner?.partnerName || selectedRequest.partnerId}
                    </div>
                    <div className="font-mono text-[11px] text-gray-500">
                      ID: {selectedRequest.partnerId}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500">Transaction</div>
                    <div className="font-mono break-all mb-0.5">
                      ID: {selectedRequest.transactionId}
                    </div>
                    <div className="font-mono text-[11px] text-gray-600 mb-0.5">
                      Ref: {selectedRequest.transaction?.reference || '—'}
                    </div>
                    {selectedRequest.transaction && (
                      <div className="text-[11px] text-gray-500">
                        {selectedRequest.transaction.type} · {selectedRequest.transaction.status}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500">Amount</div>
                    <div>
                      {(selectedRequest.transaction?.amount ?? 0).toLocaleString()}{' '}
                      {selectedRequest.transaction?.currency || ''}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500">Created At</div>
                    <div>{new Date(selectedRequest.createdAt).toLocaleString()}</div>
                  </div>
                  {selectedRequest.reviewedAt && (
                    <div>
                      <div className="text-[11px] font-semibold text-gray-500">Reviewed At</div>
                      <div>{new Date(selectedRequest.reviewedAt).toLocaleString()}</div>
                    </div>
                  )}
                  {selectedRequest.cancelledAt && (
                    <div>
                      <div className="text-[11px] font-semibold text-gray-500">Cancelled At</div>
                      <div>{new Date(selectedRequest.cancelledAt).toLocaleString()}</div>
                    </div>
                  )}
                  <div className="col-span-2 border-t pt-3">
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">
                      Transaction Mode / Status
                    </div>
                    <div>
                      {selectedRequest.transaction?.type || '—'} ·{' '}
                      {selectedRequest.transaction?.status || '—'} ·{' '}
                      {selectedRequest.transaction?.mode || '—'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-gray-500 mb-1">Reason</div>
                  <div className="rounded-md border bg-gray-50 px-2 py-1">
                    {selectedRequest.reason}
                  </div>
                </div>

                {selectedRequest.transaction?.description && (
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">
                      Transaction Description
                    </div>
                    <div className="rounded-md border bg-gray-50 px-2 py-1 whitespace-pre-wrap break-words">
                      {selectedRequest.transaction.description}
                    </div>
                  </div>
                )}

                {selectedRequest.details && (
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">Details</div>
                    <div className="rounded-md border bg-gray-50 px-2 py-1 whitespace-pre-wrap break-words">
                      {selectedRequest.details}
                    </div>
                  </div>
                )}

                {selectedRequest.reviewNote && (
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">Review Note</div>
                    <div className="rounded-md border bg-gray-50 px-2 py-1 whitespace-pre-wrap break-words">
                      {selectedRequest.reviewNote}
                    </div>
                  </div>
                )}
              </div>
              <div className="border-t px-4 py-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-3 py-1.5 rounded-md border text-xs text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

