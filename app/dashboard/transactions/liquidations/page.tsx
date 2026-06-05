"use client"

import React, { useCallback, useMemo, useState } from "react"
import Navbar from "@/components/dashboard/Navbar"
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatAmount, formatDate, getStatusBadgeConfig, shortenTransactionId } from "@/lib/utils/transactions"
import { extractValidationRecipientName } from "@/lib/utils/validation-response"
import { PERMISSIONS, usePermissions } from "@/lib/hooks/usePermissions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import toast from "react-hot-toast"
import { CheckCircle, Eye, Loader2, RotateCcw, XCircle } from "lucide-react"
import { useOpsTransactionSearch, type OpsTransactionSearchResult } from "@/lib/hooks/useOpsTransactionSearch"

function firstNonEmptyString(...values: unknown[]): string {
  for (const v of values) {
    const s = typeof v === "string" ? v : v == null ? "" : String(v)
    if (s.trim() !== "") return s.trim()
  }
  return ""
}

function getRequestReason(tx: OpsTransactionSearchResult): string {
  const m = tx.metadata as Record<string, unknown> | undefined
  if (!m) return ""
  const r = m.reason ?? m.liquidationReason ?? m.requestReason
  return typeof r === "string" ? r : ""
}

export default function LiquidationApprovalsPage() {
  const { hasPermission } = usePermissions()
  const canView = hasPermission(PERMISSIONS.TRANSACTIONS_VIEW)
  const canApprove = hasPermission(PERMISSIONS.TRANSACTIONS_APPROVE)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>("PENDING")

  const { data, isLoading, error, refetch, isFetching } = useOpsTransactionSearch({
    type: "LIQUIDATION",
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page,
    limit,
    enabled: canView,
  })

  const loading = isLoading || isFetching
  const items = data?.results ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  const [processingId, setProcessingId] = useState<string | null>(null)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<OpsTransactionSearchResult | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const [approveOpen, setApproveOpen] = useState(false)
  const [approveTarget, setApproveTarget] = useState<OpsTransactionSearchResult | null>(null)
  const [approveNote, setApproveNote] = useState("")
  const [approveValidated, setApproveValidated] = useState(false)
  const [approveValidationBusy, setApproveValidationBusy] = useState(false)
  const [approveValidationMessage, setApproveValidationMessage] = useState("")
  const [approveValidationError, setApproveValidationError] = useState("")

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsTarget, setDetailsTarget] = useState<OpsTransactionSearchResult | null>(null)

  const showActionButtons = statusFilter === "PENDING"

  const load = useCallback(() => {
    void refetch()
  }, [refetch])

  const handleApproveClick = useCallback((tx: OpsTransactionSearchResult) => {
    setApproveTarget(tx)
    setApproveNote("")
    setApproveValidated(false)
    setApproveValidationMessage("")
    setApproveValidationError("")
    setApproveOpen(true)
  }, [])

  const handleApproveValidate = useCallback(async () => {
    const tx = approveTarget
    if (!tx) return
    const metadata =
      tx.metadata && typeof tx.metadata === "object" && !Array.isArray(tx.metadata)
        ? (tx.metadata as Record<string, unknown>)
        : {}
    const payoutMethod = String(metadata.payoutMethod || "").toUpperCase()
    const payoutDetails =
      metadata.payoutDetails &&
      typeof metadata.payoutDetails === "object" &&
      !Array.isArray(metadata.payoutDetails)
        ? (metadata.payoutDetails as Record<string, unknown>)
        : {}

    setApproveValidationBusy(true)
    setApproveValidationError("")
    setApproveValidationMessage("")
    try {
      if (payoutMethod === "BANK_TRANSFER") {
        const accountNumber = String(payoutDetails.bankAccountNumber || "").trim()
        const bankCode = String(payoutDetails.bankCode || payoutDetails.bankName || "").trim()
        if (!accountNumber || !bankCode) {
          throw new Error("Missing bank details for validation.")
        }
        const res = await fetch("/api/transactions/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionType: "WALLET_TO_BANK",
            accountNumber,
            bankCode,
          }),
        })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload?.error || "Bank validation failed")
        const name = extractValidationRecipientName(payload)
        setApproveValidationMessage(name ? `Validated: ${name}` : "Bank account validated successfully")
        setApproveValidated(true)
        return
      }

      if (payoutMethod === "MOBILE_MONEY") {
        const phoneNumber = String(payoutDetails.mobileMoneyPhone || "").trim()
        const network = String(payoutDetails.mobileMoneyNetwork || "").trim()
        if (!phoneNumber || !network) {
          throw new Error("Missing mobile money details for validation.")
        }
        const res = await fetch("/api/transactions/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionType: "WALLET_TO_MNO",
            phoneNumber,
            network,
          }),
        })
        const payload = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(payload?.error || "Mobile money validation failed")
        const name = extractValidationRecipientName(payload)
        setApproveValidationMessage(name ? `Validated: ${name}` : "Mobile number validated successfully")
        setApproveValidated(true)
        return
      }

      if (payoutMethod === "RUKAPAY_WALLET") {
        const walletId = String(payoutDetails.destinationWalletId || "").trim()
        if (!walletId) throw new Error("Missing destination wallet identifier.")
        setApproveValidationMessage("RukaPay wallet destination validated.")
        setApproveValidated(true)
        return
      }

      throw new Error("Unsupported payout method for validation.")
    } catch (e: unknown) {
      setApproveValidated(false)
      setApproveValidationError(e instanceof Error ? e.message : "Validation failed")
    } finally {
      setApproveValidationBusy(false)
    }
  }, [approveTarget])

  const handleApproveConfirm = useCallback(async () => {
    if (!canApprove) {
      toast.error("You don't have permission to approve liquidations")
      return
    }
    const id = String(approveTarget?.id || "")
    if (!id) {
      toast.error("Missing transaction id")
      return
    }
    if (!approveValidated) {
      toast.error("Please validate destination before approving")
      return
    }

    setProcessingId(id)
    try {
      const res = await fetch(`/api/transactions/liquidations/${encodeURIComponent(id)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: approveNote.trim() || undefined }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(payload?.error || "Failed to approve liquidation")
        return
      }
      toast.success(payload?.message || "Liquidation approved")
      setApproveOpen(false)
      setApproveTarget(null)
      setApproveNote("")
      void refetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to approve liquidation")
    } finally {
      setProcessingId(null)
    }
  }, [approveNote, approveTarget, approveValidated, canApprove, refetch])

  const openReject = useCallback((tx: OpsTransactionSearchResult) => {
    setRejectTarget(tx)
    setRejectReason("")
    setRejectOpen(true)
  }, [])

  const openDetails = useCallback((tx: OpsTransactionSearchResult) => {
    setDetailsTarget(tx)
    setDetailsOpen(true)
  }, [])

  const handleReject = useCallback(async () => {
    if (!canApprove) {
      toast.error("You don't have permission to reject liquidations")
      return
    }
    const id = String(rejectTarget?.id || "")
    if (!id) {
      toast.error("Missing transaction id")
      return
    }
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }

    setProcessingId(id)
    try {
      const res = await fetch(`/api/transactions/liquidations/${encodeURIComponent(id)}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(payload?.error || "Failed to reject liquidation")
        return
      }
      toast.success(payload?.message || "Liquidation rejected")
      setRejectOpen(false)
      setRejectTarget(null)
      setRejectReason("")
      void refetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to reject liquidation")
    } finally {
      setProcessingId(null)
    }
  }, [canApprove, rejectReason, rejectTarget, refetch])

  const errMessage = error
    ? String((error as { message?: string })?.message || "Failed to load liquidations")
    : null

  const rows = useMemo(() => {
    return items.map((tx) => {
      const m = tx.metadata
      const sender = tx.senderInfo
      const partnerLabel = firstNonEmptyString(
        sender?.name,
        m && typeof m.apiPartnerName === "string" ? m.apiPartnerName : undefined,
        m && typeof m.partnerName === "string" ? m.partnerName : undefined,
      )
      const saccoLine = firstNonEmptyString(
        sender?.institutionLine,
        sender?.institutionName && sender?.institutionCode
          ? `${sender.institutionCode} · ${sender.institutionName}`
          : sender?.institutionName || sender?.institutionCode,
      )
      const reason = getRequestReason(tx)
      const manualNote =
        m && typeof m.manualSettlementNote === "string" ? m.manualSettlementNote.trim() : ""

      return {
        tx,
        partnerLabel,
        saccoLine,
        reason,
        manualNote,
      }
    })
  }, [items])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="dashboard-shell py-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Liquidation requests</h1>
              <p className="mt-2 text-gray-600">
                Review partner settlement liquidations. Pending rows can be approved or rejected with a reason. Liquidations also appear on the main transactions ledger.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v) }}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUCCESS">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="ALL">All</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-24">
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={limit}
                  onChange={(e) => {
                    setPage(1)
                    setLimit(Math.max(1, Math.min(200, Number(e.target.value || 20))))
                  }}
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
                <CardDescription>You don’t have permission to view liquidation requests.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {canView && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 flex-wrap">
                  Liquidations
                  <Badge className="bg-gray-900 text-white">{total}</Badge>
                </CardTitle>
                <CardDescription>
                  {showActionButtons
                    ? "Approve debits the settlement wallet after review. Reject cancels the request and requires a reason."
                    : "Browse liquidations by status. Approve and reject are only available when filtering Pending."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {errMessage && (
                  <div className="mb-4 text-sm text-red-600">
                    {errMessage}
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requested</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>API partner</TableHead>
                      <TableHead>Institution (SACCO)</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Request reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-gray-600">
                          <Loader2 className="h-5 w-5 inline-block mr-2 animate-spin" />
                          Loading liquidations…
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading && rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-10 text-center text-gray-600">
                          No liquidation transactions found.
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading &&
                      rows.map(({ tx, partnerLabel, saccoLine, reason, manualNote }) => {
                        const statusConfig = getStatusBadgeConfig(tx.status)
                        const busy = processingId === tx.id
                        return (
                          <TableRow key={tx.id}>
                            <TableCell>{tx.createdAt ? formatDate(tx.createdAt) : "—"}</TableCell>
                            <TableCell className="font-mono text-xs max-w-[140px]" title={tx.reference}>
                              {tx.reference ? shortenTransactionId(tx.reference) : shortenTransactionId(tx.id)}
                            </TableCell>
                            <TableCell className="max-w-[200px] whitespace-normal">{partnerLabel || "—"}</TableCell>
                            <TableCell className="max-w-[240px] whitespace-normal text-sm">{saccoLine || "—"}</TableCell>
                            <TableCell className="font-semibold">
                              {formatAmount(tx.amount)} {tx.currency}
                            </TableCell>
                            <TableCell className="max-w-[280px] whitespace-normal text-sm">
                              {reason || "—"}
                              {manualNote ? (
                                <div className="text-xs text-gray-500 mt-1">Settlement note: {manualNote}</div>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${statusConfig.color} border`}>{statusConfig.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDetails(tx)}
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {showActionButtons && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                      disabled={!canApprove || busy || tx.status !== "PENDING"}
                                      onClick={() => handleApproveClick(tx)}
                                      title={!canApprove ? "Missing permission" : "Approve liquidation"}
                                    >
                                      {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-500 text-red-700 hover:bg-red-50 hover:text-red-800"
                                      disabled={!canApprove || busy || tx.status !== "PENDING"}
                                      onClick={() => openReject(tx)}
                                      title={!canApprove ? "Missing permission" : "Reject liquidation"}
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                    <span>
                      Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="w-full max-w-xl">
          <DialogHeader>
            <DialogTitle>Approve liquidation</DialogTitle>
            <DialogDescription>
              This debits the partner settlement wallet. Cash or bank payout is handled outside the platform.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-xs text-gray-600">
              Transaction ID:{" "}
              <span className="font-mono">{String(approveTarget?.id || "—")}</span>
            </div>
            <Textarea
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              rows={3}
              placeholder="Optional reviewer note"
            />
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleApproveValidate()}
                disabled={approveValidationBusy || processingId != null}
              >
                {approveValidationBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {approveValidationBusy ? "Validating..." : "Validate destination"}
              </Button>
              {approveValidationMessage ? (
                <div className="text-sm text-green-700">{approveValidationMessage}</div>
              ) : null}
              {approveValidationError ? (
                <div className="text-sm text-red-600">{approveValidationError}</div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setApproveOpen(false)}
                disabled={processingId != null}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => void handleApproveConfirm()}
                disabled={processingId != null || !approveValidated}
              >
                {processingId != null ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Confirm approve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="w-full max-w-xl">
          <DialogHeader>
            <DialogTitle>Reject liquidation request</DialogTitle>
            <DialogDescription>
              Provide a clear reason for rejection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-xs text-gray-600">
              Transaction ID:{" "}
              <span className="font-mono">
                {String(rejectTarget?.id || "—")}
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
                onClick={() => void handleReject()}
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
            <DialogTitle>Liquidation details</DialogTitle>
            <DialogDescription>Ops search payload for this transaction.</DialogDescription>
          </DialogHeader>

          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
            {JSON.stringify(detailsTarget, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}
