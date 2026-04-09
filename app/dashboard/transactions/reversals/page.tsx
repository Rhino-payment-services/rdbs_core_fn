"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import Navbar from "@/components/dashboard/Navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatAmount, formatDate, getStatusBadgeConfig, shortenTransactionId } from "@/lib/utils/transactions"
import { PERMISSIONS, usePermissions } from "@/lib/hooks/usePermissions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from "react-hot-toast"
import { CheckCircle, Eye, Loader2, RotateCcw, XCircle } from "lucide-react"

type AnyRecord = Record<string, any>

function normalizePendingReversalsPayload(payload: any): AnyRecord[] {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.data)) return payload.data
  if (Array.isArray(payload.reversals)) return payload.reversals
  if (Array.isArray(payload.items)) return payload.items
  if (payload.data && Array.isArray(payload.data.reversals)) return payload.data.reversals
  return []
}

function firstNonEmptyString(...values: any[]): string {
  for (const v of values) {
    const s = typeof v === "string" ? v : v == null ? "" : String(v)
    if (s.trim() !== "") return s.trim()
  }
  return ""
}

export default function TransactionReversalsPage() {
  const { hasPermission } = usePermissions()
  const canView = hasPermission(PERMISSIONS.TRANSACTION_REVERSAL_VIEW) || hasPermission(PERMISSIONS.TRANSACTION_REVERSAL_APPROVE)
  const canApprove = hasPermission(PERMISSIONS.TRANSACTION_REVERSAL_APPROVE)

  const [limit, setLimit] = useState(50)
  const [statusFilter, setStatusFilter] = useState<string>("PENDING")
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AnyRecord[]>([])
  const [error, setError] = useState<string | null>(null)

  const [processingId, setProcessingId] = useState<string | null>(null)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<AnyRecord | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsTarget, setDetailsTarget] = useState<AnyRecord | null>(null)

  const filteredCount = items.length
  const showActionButtons = statusFilter === "PENDING"

  const load = useCallback(async () => {
    if (!canView) return
    setLoading(true)
    setError(null)
    try {
      const limitParam = `limit=${encodeURIComponent(String(limit))}`
      const base =
        statusFilter === "PENDING"
          ? `/api/transactions/reversals/pending?${limitParam}`
          : statusFilter === "ALL"
            ? `/api/transactions/reversals?${limitParam}`
            : `/api/transactions/reversals?${limitParam}&status=${encodeURIComponent(statusFilter)}`

      const res = await fetch(base, { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setItems([])
        setError(data?.error || "Failed to load reversals")
        return
      }
      const all = normalizePendingReversalsPayload(data)
      setItems(all)
    } catch (e: any) {
      setItems([])
      setError(e?.message || "Failed to load reversals")
    } finally {
      setLoading(false)
    }
  }, [canView, limit, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleApprove = useCallback(
    async (reversal: AnyRecord) => {
      if (!canApprove) {
        toast.error("You don't have permission to approve/reject reversals")
        return
      }
      const reversalId = String(reversal?.id || reversal?.reversalId || reversal?._id || "")
      if (!reversalId) {
        toast.error("Missing reversal id")
        return
      }

      setProcessingId(reversalId)
      try {
        const res = await fetch(`/api/transactions/reversals/${encodeURIComponent(reversalId)}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error(data?.error || "Failed to approve reversal")
          return
        }
        toast.success(data?.message || "Reversal approved")
        setItems((prev) => prev.filter((x) => String(x?.id || x?.reversalId || x?._id) !== reversalId))
      } catch (e: any) {
        toast.error(e?.message || "Failed to approve reversal")
      } finally {
        setProcessingId(null)
      }
    },
    [canApprove],
  )

  const openReject = useCallback((reversal: AnyRecord) => {
    setRejectTarget(reversal)
    setRejectReason("")
    setRejectOpen(true)
  }, [])

  const openDetails = useCallback((reversal: AnyRecord) => {
    setDetailsTarget(reversal)
    setDetailsOpen(true)
  }, [])

  const handleReject = useCallback(async () => {
    if (!canApprove) {
      toast.error("You don't have permission to approve/reject reversals")
      return
    }
    const reversalId = String(rejectTarget?.id || rejectTarget?.reversalId || rejectTarget?._id || "")
    if (!reversalId) {
      toast.error("Missing reversal id")
      return
    }
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }

    setProcessingId(reversalId)
    try {
      const res = await fetch(`/api/transactions/reversals/${encodeURIComponent(reversalId)}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || "Failed to reject reversal")
        return
      }
      toast.success(data?.message || "Reversal rejected")
      setRejectOpen(false)
      setRejectTarget(null)
      setRejectReason("")
      setItems((prev) => prev.filter((x) => String(x?.id || x?.reversalId || x?._id) !== reversalId))
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject reversal")
    } finally {
      setProcessingId(null)
    }
  }, [canApprove, rejectReason, rejectTarget])

  const rows = useMemo(() => {
    return items.map((r) => {
      const id = String(r?.id || r?.reversalId || r?._id || "")
      const createdAt = r?.createdAt || r?.requestedAt || r?.created_at || null
      const currency = String(r?.transaction?.currency || r?.currency || "UGX")
      const originalRef = r?.transactionReference || r?.originalTransactionReference || r?.transactionId || r?.originalTransactionId || r?.reference || ""
      const reason = r?.reason || r?.reversalReason || r?.requestReason || ""
      const status = String(r?.status || "PENDING")

      const originalAmount = Number(r?.originalAmount ?? r?.transaction?.amount ?? 0)
      const originalFee = Number(r?.originalFee ?? r?.transaction?.fee ?? 0)
      const totalRefund = originalAmount + originalFee

      const requestedByUser = r?.requestedByUser || null
      const requesterName =
        requestedByUser?.profile?.firstName || requestedByUser?.profile?.lastName
          ? `${requestedByUser?.profile?.firstName || ""} ${requestedByUser?.profile?.lastName || ""}`.trim()
          : (requestedByUser?.email || requestedByUser?.phone || "")

      const transactionPartnerLabel =
        r?.transaction?.partnerMapping?.partner?.partnerName ||
        r?.transaction?.partnerMapping?.partner?.partnerCode ||
        r?.transaction?.partner?.partnerName ||
        r?.transaction?.partner?.businessName ||
        r?.transaction?.partner?.partnerCode ||
        r?.transaction?.metadata?.apiPartnerBusinessName ||
        r?.transaction?.metadata?.partnerBusinessName ||
        r?.transaction?.metadata?.apiPartnerName ||
        r?.transaction?.metadata?.partnerName ||
        "Direct"

      const requesterPartnerLabel = firstNonEmptyString(
        r?.requestedByPartner?.partnerName,
        r?.requestedByPartner?.businessName,
        r?.requestedByPartner?.partnerCode,
        r?.requestedByPartnerMapping?.partner?.partnerName,
        r?.requestedByPartnerMapping?.partner?.partnerCode,
        requestedByUser?.partner?.partnerName,
        requestedByUser?.partner?.businessName,
        requestedByUser?.partner?.partnerCode,
      )

      return {
        id,
        createdAt,
        originalAmount,
        originalFee,
        totalRefund,
        currency,
        originalRef,
        reason,
        status,
        requesterName,
        requesterContact: requestedByUser?.email || requestedByUser?.phone || "",
        requesterPartnerLabel,
        transactionPartnerLabel,
        raw: r,
      }
    })
  }, [items])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Reversals</h1>
              <p className="mt-2 text-gray-600">Review reversal requests (pending, completed, cancelled, rejected).</p>
            </div>

            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="ALL">All</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-40">
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={limit}
                  onChange={(e) => setLimit(Math.max(1, Math.min(500, Number(e.target.value || 50))))}
                  placeholder="Limit"
                />
              </div>
              <Button variant="outline" onClick={load} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
                Refresh
              </Button>
            </div>
          </div>

          {!canView && (
            <Card>
              <CardHeader>
                <CardTitle>Access denied</CardTitle>
                <CardDescription>You don’t have permission to view reversal requests.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {canView && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {statusFilter === "ALL" ? "Reversal Requests" : `${statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()} Requests`}
                  <Badge className="bg-gray-900 text-white">{filteredCount}</Badge>
                </CardTitle>
                <CardDescription>
                  {showActionButtons
                    ? "Approve or reject reversal requests. Reject requires a reason."
                    : "Viewing reversals in the selected status. Approve/Reject is only available for Pending."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requested</TableHead>
                      <TableHead>Reversal ID</TableHead>
                      <TableHead>Original Tx</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Requester Partner</TableHead>
                      <TableHead>Tx Partner</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={10} className="py-10 text-center text-gray-600">
                          <Loader2 className="h-5 w-5 inline-block mr-2 animate-spin" />
                          Loading reversals…
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading && rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="py-10 text-center text-gray-600">
                          No reversal requests found.
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading &&
                      rows.map((row) => {
                        const statusConfig = getStatusBadgeConfig(row.status)
                        const busy = processingId === row.id
                        return (
                          <TableRow key={row.id || row.originalRef || Math.random()}>
                            <TableCell>{row.createdAt ? formatDate(row.createdAt) : "—"}</TableCell>
                            <TableCell className="font-mono text-xs" title={row.id}>
                              {row.id ? shortenTransactionId(row.id) : "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs" title={String(row.originalRef || "")}>
                              {row.originalRef ? shortenTransactionId(String(row.originalRef)) : "—"}
                            </TableCell>
                            <TableCell className="max-w-[220px] whitespace-normal">
                              {row.requesterName || "—"}
                              {row.requesterContact ? (
                                <div className="text-xs text-gray-500">{row.requesterContact}</div>
                              ) : null}
                            </TableCell>
                            <TableCell className="max-w-[200px] whitespace-normal">
                              {row.requesterPartnerLabel || "—"}
                            </TableCell>
                            <TableCell className="max-w-[200px] whitespace-normal">
                              {row.transactionPartnerLabel || "—"}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatAmount(row.totalRefund)} {row.currency}
                              <div className="text-xs text-gray-500">
                                Amount {formatAmount(row.originalAmount)} + Fee {formatAmount(row.originalFee)}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[340px] whitespace-normal">
                              {row.reason ? String(row.reason) : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${statusConfig.color} border`}>{statusConfig.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDetails(row.raw)}
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {showActionButtons && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      disabled={!canApprove || busy || !row.id}
                                      onClick={() => handleApprove(row.raw)}
                                      title={!canApprove ? "Missing permission" : "Approve reversal"}
                                    >
                                      {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-500 text-red-700 hover:bg-red-50 hover:text-red-800"
                                      disabled={!canApprove || busy || !row.id}
                                      onClick={() => openReject(row.raw)}
                                      title={!canApprove ? "Missing permission" : "Reject reversal"}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="w-full max-w-xl">
          <DialogHeader>
            <DialogTitle>Reject reversal request</DialogTitle>
            <DialogDescription>
              Provide a clear reason. This will be sent to the backend as the rejection reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-xs text-gray-600">
              Reversal ID:{" "}
              <span className="font-mono">
                {String(rejectTarget?.id || rejectTarget?.reversalId || rejectTarget?._id || "—")}
              </span>
            </div>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Reason for rejection (required)"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setRejectOpen(false)}
                disabled={processingId != null}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReject}
                disabled={processingId != null || !rejectReason.trim()}
              >
                {processingId != null ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reversal details</DialogTitle>
            <DialogDescription>Reversal request + linked transaction information.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded border bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">Reversal</div>
                <div><span className="text-gray-600">ID:</span> <span className="font-mono text-xs">{String(detailsTarget?.id || "—")}</span></div>
                <div><span className="text-gray-600">Status:</span> <span className="font-medium">{String(detailsTarget?.status || "—")}</span></div>
                <div><span className="text-gray-600">Reason:</span> <span className="font-medium">{String(detailsTarget?.reason || "—")}</span></div>
                <div><span className="text-gray-600">Details:</span> <span className="font-medium">{String(detailsTarget?.details || "—")}</span></div>
                <div><span className="text-gray-600">Ticket Ref:</span> <span className="font-medium">{String(detailsTarget?.ticketReference || "—")}</span></div>
                <div><span className="text-gray-600">Created:</span> <span className="font-medium">{detailsTarget?.createdAt ? formatDate(detailsTarget.createdAt) : "—"}</span></div>
              </div>

              <div className="p-3 rounded border bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">Requested By</div>
                <div className="font-medium">
                  {(() => {
                    const u = detailsTarget?.requestedByUser
                    if (!u) return "—"
                    const name = u?.profile?.firstName || u?.profile?.lastName ? `${u?.profile?.firstName || ""} ${u?.profile?.lastName || ""}`.trim() : ""
                    return name || u?.email || u?.phone || "—"
                  })()}
                </div>
                <div className="text-xs text-gray-600">{detailsTarget?.requestedByUser?.email || detailsTarget?.requestedByUser?.phone || ""}</div>
                <div className="mt-2 text-xs text-gray-500 mb-1">Requester partner</div>
                <div className="font-medium">
                  {firstNonEmptyString(
                    detailsTarget?.requestedByPartner?.partnerName,
                    detailsTarget?.requestedByPartner?.businessName,
                    detailsTarget?.requestedByPartner?.partnerCode,
                    detailsTarget?.requestedByPartnerMapping?.partner?.partnerName,
                    detailsTarget?.requestedByPartnerMapping?.partner?.partnerCode,
                    detailsTarget?.requestedByUser?.partner?.partnerName,
                    detailsTarget?.requestedByUser?.partner?.businessName,
                    detailsTarget?.requestedByUser?.partner?.partnerCode,
                    "—",
                  )}
                </div>
                {detailsTarget?.rejectionReason ? (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Rejection reason</div>
                    <div className="font-medium">{String(detailsTarget.rejectionReason)}</div>
                  </div>
                ) : null}
              </div>

              <div className="p-3 rounded border bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">Transaction</div>
                <div>
                  <span className="text-gray-600">Reference:</span>{" "}
                  <span className="font-mono text-xs">
                    {firstNonEmptyString(
                      detailsTarget?.transaction?.reference,
                      detailsTarget?.transaction?.transactionReference,
                      detailsTarget?.transactionReference,
                      detailsTarget?.originalTransactionReference,
                      detailsTarget?.transactionId,
                      detailsTarget?.originalTransactionId,
                      "—",
                    )}
                  </span>
                </div>
                <div><span className="text-gray-600">Status:</span> <span className="font-medium">{String(detailsTarget?.transaction?.status || "—")}</span></div>
                <div>
                  <span className="text-gray-600">Amount:</span>{" "}
                  <span className="font-medium">
                    {formatAmount(Number(detailsTarget?.transaction?.amount ?? detailsTarget?.originalAmount ?? 0))}{" "}
                    {String(detailsTarget?.transaction?.currency || detailsTarget?.currency || "UGX")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Fee:</span>{" "}
                  <span className="font-medium">{formatAmount(Number(detailsTarget?.transaction?.fee ?? detailsTarget?.originalFee ?? 0))}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tx Partner:</span>{" "}
                  <span className="font-medium">
                    {firstNonEmptyString(
                      detailsTarget?.transaction?.partnerMapping?.partner?.partnerName,
                      detailsTarget?.transaction?.partnerMapping?.partner?.partnerCode,
                      detailsTarget?.transaction?.partner?.partnerName,
                      detailsTarget?.transaction?.partner?.businessName,
                      detailsTarget?.transaction?.partner?.partnerCode,
                      detailsTarget?.transaction?.metadata?.apiPartnerBusinessName,
                      detailsTarget?.transaction?.metadata?.partnerBusinessName,
                      detailsTarget?.transaction?.metadata?.apiPartnerName,
                      detailsTarget?.transaction?.metadata?.partnerName,
                      "—",
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>{" "}
                  <span className="font-medium">
                    {detailsTarget?.transaction?.createdAt ? formatDate(detailsTarget.transaction.createdAt) : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded border">
              <div className="text-xs text-gray-500 mb-2">Linked transaction (raw)</div>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                {JSON.stringify(detailsTarget?.transaction || null, null, 2)}
              </pre>
            </div>

            <div className="p-3 rounded border">
              <div className="text-xs text-gray-500 mb-2">Reversal (raw)</div>
              <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                {JSON.stringify(detailsTarget || null, null, 2)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

