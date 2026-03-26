"use client"

import React, { useMemo, useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import {
  useAutoMatchSettlementFile,
  useIngestSettlementFile,
  useSettlementFiles,
  useSettlementFile,
  useSettlementRows,
} from '@/lib/hooks/useReconciliation'
import toast from 'react-hot-toast'

const formatDate = (v?: string | null) => (v ? new Date(v).toLocaleString() : '-')
const formatPct = (n: number) => `${Math.round(n * 100)}%`

const matchBadgeClass = (matched: number, unmatched: number) => {
  if (matched > 0 && unmatched === 0) return 'bg-green-100 text-green-800 hover:bg-green-100'
  if (matched === 0 && unmatched > 0) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
  if (matched > 0 && unmatched > 0) return 'bg-amber-100 text-amber-800 hover:bg-amber-100'
  return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
}

export default function ReconciliationPage() {
  type IngestRow = {
    providerRef: string
    amount: string
    providerDate?: string
    fee?: string
    status?: string
    currency?: string
  }

  const [fileIdInput, setFileIdInput] = useState('')
  const [matchStatus, setMatchStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [providerCode, setProviderCode] = useState('')
  const [filesPage, setFilesPage] = useState(1)
  const [filesProviderFilter, setFilesProviderFilter] = useState('')
  const [rowsForm, setRowsForm] = useState<IngestRow[]>([{ providerRef: '', amount: '' }])
  const [isFileModalOpen, setIsFileModalOpen] = useState(false)
  const [fileModalId, setFileModalId] = useState<string | null>(null)

  const filesQuery = useSettlementFiles({
    providerCode: filesProviderFilter.trim() || undefined,
    page: filesPage,
    limit: 20,
  })

  const rowsQuery = useSettlementRows({
    fileId: undefined,
    matchStatus: matchStatus === 'all' ? undefined : matchStatus,
    page,
    limit: 20,
  })

  const ingestMutation = useIngestSettlementFile()
  const autoMatchMutation = useAutoMatchSettlementFile()

  const canSearch = fileIdInput.trim().length > 0
  const rows = rowsQuery.data?.rows || []
  const rowStats = useMemo(() => {
    const total = rows.length
    const matched = rows.filter((r) => r.matchStatus === 'MATCHED').length
    const unmatched = rows.filter((r) => r.matchStatus === 'UNMATCHED').length
    return { total, matched, unmatched }
  }, [rows])

  const handleLookup = () => {
    if (!canSearch) return
    setFileModalId(fileIdInput.trim())
    setIsFileModalOpen(true)
  }

  const handleIngest = async () => {
    const cleanedRows = rowsForm
      .map((row) => ({
        providerRef: row.providerRef.trim(),
        amount: row.amount.trim(),
        providerDate: row.providerDate?.trim() || undefined,
        fee: row.fee?.trim() || undefined,
        status: row.status?.trim() || undefined,
        currency: row.currency?.trim() || undefined,
      }))
      .filter((row) => row.providerRef || row.amount)

    if (cleanedRows.length === 0) {
      toast.error('Add at least one row')
      return
    }

    const invalidRow = cleanedRows.find((row) => !row.providerRef || !row.amount)
    if (invalidRow) {
      toast.error('Each row requires provider reference and amount')
      return
    }

    const mappedRows = cleanedRows.map((row) => ({
      providerRef: row.providerRef,
      amount: Number(row.amount),
      ...(row.providerDate ? { providerDate: row.providerDate } : {}),
      ...(row.fee ? { fee: Number(row.fee) } : {}),
      ...(row.status ? { status: row.status } : {}),
      ...(row.currency ? { currency: row.currency } : {}),
    }))

    if (mappedRows.some((row) => Number.isNaN(row.amount) || row.amount < 0)) {
      toast.error('Amount must be a valid number')
      return
    }

    const created = await ingestMutation.mutateAsync({
      providerCode: providerCode.trim() || 'ABC',
      rows: mappedRows,
    })

    if (created?.id) {
      setFileIdInput(created.id)
      setPage(1)
      setFileModalId(created.id)
      setIsFileModalOpen(true)

      // Reset ingest form to avoid accidental duplicate ingests
      setProviderCode('')
      setRowsForm([{ providerRef: '', amount: '' }])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Reconciliation</h1>
          <p className="text-gray-600 mt-1">
            Ingest settlement files, auto-match rows, and review matched/unmatched records.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ingest Settlement File</CardTitle>
            <CardDescription>
              Enter settlement rows directly. Required per row: provider reference and amount.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Label>Provider code</Label>
                <Input
                  value={providerCode}
                  onChange={(e) => setProviderCode(e.target.value)}
                  placeholder="ABC"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Settlement rows</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRowsForm((prev) => [
                      ...prev,
                      { providerRef: '', amount: '' },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add row
                </Button>
              </div>

              <div className="space-y-3">
                {rowsForm.map((row, index) => (
                  <div key={`row-${index}`} className="border rounded-md p-3 space-y-3 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Provider reference *</Label>
                        <Input
                          placeholder="TXN_1770372039754"
                          value={row.providerRef}
                          onChange={(e) =>
                            setRowsForm((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, providerRef: e.target.value } : r)),
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Amount *</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="5000"
                          value={row.amount}
                          onChange={(e) =>
                            setRowsForm((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, amount: e.target.value } : r)),
                            )
                          }
                        />
                      </div>
                      <div className="flex items-end justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={rowsForm.length === 1}
                          onClick={() =>
                            setRowsForm((prev) => prev.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Provider date (optional)</Label>
                        <Input
                          type="date"
                          value={row.providerDate || ''}
                          onChange={(e) =>
                            setRowsForm((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, providerDate: e.target.value } : r)),
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Fee (optional)</Label>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={row.fee || ''}
                          onChange={(e) =>
                            setRowsForm((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, fee: e.target.value } : r)),
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Status (optional)</Label>
                        <Input
                          placeholder="SUCCESS"
                          value={row.status || ''}
                          onChange={(e) =>
                            setRowsForm((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, status: e.target.value } : r)),
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Currency (optional)</Label>
                        <Input
                          placeholder="UGX"
                          value={row.currency || ''}
                          onChange={(e) =>
                            setRowsForm((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, currency: e.target.value } : r)),
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleIngest} disabled={ingestMutation.isPending}>
              {ingestMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Ingest file
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Settlement Files</CardTitle>
            <CardDescription>
              Pick a saved file to review or auto-match. You can also paste a file ID if you already have it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="md:col-span-1">
                <Label>Filter by provider code (optional)</Label>
                <Input
                  placeholder="ABC"
                  value={filesProviderFilter}
                  onChange={(e) => {
                    setFilesProviderFilter(e.target.value)
                    setFilesPage(1)
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Or lookup by file ID</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter settlement file ID"
                    value={fileIdInput}
                    onChange={(e) => setFileIdInput(e.target.value)}
                  />
                  <Button onClick={handleLookup} disabled={!canSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Load
                  </Button>
                </div>
              </div>
            </div>

            {filesQuery.isLoading ? (
              <div className="py-6 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : (filesQuery.data?.files?.length || 0) === 0 ? (
              <p className="text-sm text-gray-500">No saved settlement files yet.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Received</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead className="text-right">Rows</TableHead>
                      <TableHead className="text-right">Matched</TableHead>
                      <TableHead className="text-right">Unmatched</TableHead>
                      <TableHead>File ID</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filesQuery.data?.files?.map((f) => {
                      const total = Number(f.totalRows || 0)
                      const matched = Number(f.matchedRows || 0)
                      const unmatched = Number(f.unmatchedRows || 0)
                      const matchRate = total > 0 ? matched / total : 0

                      return (
                      <TableRow
                        key={f.id}
                        className={fileModalId === f.id && isFileModalOpen ? 'bg-gray-50' : ''}
                      >
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(f.receivedAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{f.providerCode}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{f.status}</TableCell>
                        <TableCell>
                          <Badge className={matchBadgeClass(matched, unmatched)}>
                            {formatPct(matchRate)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{f.totalRows}</TableCell>
                        <TableCell className="text-right font-mono">{f.matchedRows}</TableCell>
                        <TableCell className="text-right font-mono">{f.unmatchedRows}</TableCell>
                        <TableCell className="font-mono text-xs max-w-[260px] truncate" title={f.id}>
                          {f.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setFileModalId(f.id)
                                setIsFileModalOpen(true)
                              }}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => autoMatchMutation.mutate(f.id)}
                              disabled={autoMatchMutation.isPending}
                            >
                              {autoMatchMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {(filesQuery.data?.totalPages || 0) > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      Page {filesQuery.data?.page} of {filesQuery.data?.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={filesPage <= 1}
                        onClick={() => setFilesPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={filesPage >= (filesQuery.data?.totalPages || 1)}
                        onClick={() =>
                          setFilesPage((p) => Math.min(filesQuery.data?.totalPages || 1, p + 1))
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent settlement rows</CardTitle>
            <CardDescription>
              Browse individual provider references and amounts across all files (newest first).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rowsQuery.isLoading ? (
              <div className="py-6 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-gray-500">No rows found.</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Provider Ref</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(r.providerDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.providerCode}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.providerRef}</TableCell>
                        <TableCell className="text-right font-mono">{r.providerAmount}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.matchStatus}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[180px] truncate" title={r.fileId}>
                          {r.fileId}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setFileModalId(r.fileId)
                                setIsFileModalOpen(true)
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>

        {/* File detail is shown in the View modal (popup) */}

        <Dialog
          open={isFileModalOpen}
          onOpenChange={(open) => {
            setIsFileModalOpen(open)
            if (!open) setFileModalId(null)
          }}
        >
          <DialogContent className="!w-[80vw] !max-w-[80vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Settlement file</DialogTitle>
              <DialogDescription>
                Review this file summary and rows. Use Auto-match to link rows to internal transactions.
              </DialogDescription>
            </DialogHeader>

            {fileModalId ? (
              <ReconciliationFileModalBody
                fileId={fileModalId}
                onAutoMatch={() => autoMatchMutation.mutate(fileModalId)}
                autoMatchPending={autoMatchMutation.isPending}
              />
            ) : (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

function ReconciliationFileModalBody(props: {
  fileId: string
  onAutoMatch: () => void
  autoMatchPending: boolean
}) {
  const { fileId, onAutoMatch, autoMatchPending } = props
  const file = useSettlementFile(fileId, true)
  const data = file.data as any

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600 font-mono break-all">{fileId}</div>
        <Button variant="outline" onClick={onAutoMatch} disabled={autoMatchPending}>
          {autoMatchPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Auto-match
        </Button>
      </div>

      {file.isLoading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      ) : !data || data.message ? (
        <p className="text-sm text-gray-500">File not found.</p>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Summary</CardTitle>
              <CardDescription>Provider, counts, and timestamps.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500">Provider</span><div className="font-medium">{data.providerCode}</div></div>
              <div><span className="text-gray-500">Status</span><div className="font-medium">{data.status}</div></div>
              <div><span className="text-gray-500">Total</span><div className="font-medium">{data.totalRows}</div></div>
              <div><span className="text-gray-500">Matched</span><div className="font-medium">{data.matchedRows}</div></div>
              <div><span className="text-gray-500">Unmatched</span><div className="font-medium">{data.unmatchedRows}</div></div>
              <div><span className="text-gray-500">Received</span><div className="font-medium">{formatDate(data.receivedAt)}</div></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rows</CardTitle>
              <CardDescription>Includes matchStatus and internal transaction details when linked.</CardDescription>
            </CardHeader>
            <CardContent>
              {(data.rows || []).length === 0 ? (
                <p className="text-sm text-gray-500">No rows.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider Ref</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Internal Ref</TableHead>
                      <TableHead>Internal Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.providerRef}</TableCell>
                        <TableCell>{r.providerAmount}</TableCell>
                        <TableCell><Badge variant="outline">{r.matchStatus}</Badge></TableCell>
                        <TableCell className="font-mono text-xs">{r.internalReference || '-'}</TableCell>
                        <TableCell>{r.internalTransaction?.status || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
