"use client"

import React, { useCallback, useEffect, useState } from 'react'
import api from '@/lib/axios'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, XCircle } from 'lucide-react'
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
    createdAt: string
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

export default function GatewayPartnerReversalsPage() {
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
                              <div className="font-mono text-xs">{req.id}</div>
                            </td>
                            <td className="px-3 py-2 align-top text-sm">
                              <div className="font-medium">
                                {req.partner?.partnerName || req.partnerId}
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top text-xs">
                              <div className="font-mono">{req.transactionId}</div>
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

        {/* Simple inline review dialog */}
        {reviewingId && reviewAction && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {reviewAction === 'approve' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Approve Reversal Request
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    Reject Reversal Request
                  </>
                )}
              </h2>
              <p className="text-sm text-gray-600">
                Request ID: <span className="font-mono text-xs">{reviewingId}</span>
              </p>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">
                  Review note (optional, but recommended)
                </label>
                <textarea
                  className="border rounded-md px-2 py-2 text-sm min-h-[80px]"
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Explain your verification steps and why you are approving this reversal.'
                      : 'Explain why this reversal is being rejected.'
                  }
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setReviewingId(null)
                    setReviewAction(null)
                    setReviewNote('')
                  }}
                  className="px-3 py-1.5 rounded-md border text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReview}
                  className={`px-3 py-1.5 rounded-md text-sm text-white inline-flex items-center gap-1 ${
                    reviewAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

