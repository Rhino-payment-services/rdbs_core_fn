"use client"

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useOvaAccount, useOvaMovements, type OvaMovement } from '@/lib/hooks/useOvaAccounts'

const formatAmount = (val: number) =>
  new Intl.NumberFormat('en-UG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val)

const formatDate = (d: string) =>
  new Date(d).toLocaleString('en-UG', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

export default function OvaMovementsPage() {
  const params = useParams()
  const id = params?.id as string
  const [page, setPage] = useState(1)
  const [directionFilter, setDirectionFilter] = useState<'all' | 'CREDIT' | 'DEBIT'>('all')

  const { data: ova, isLoading: ovaLoading } = useOvaAccount(id)
  const { data: movementsData, isLoading: movementsLoading } = useOvaMovements(id, {
    page,
    limit: 20,
    direction: directionFilter === 'all' ? undefined : directionFilter,
  })

  const isLoading = ovaLoading || movementsLoading
  const movements = movementsData?.items ?? []
  const totalPages = movementsData?.totalPages ?? 0
  const total = movementsData?.total ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/finance/ova">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OVA movements</h1>
            <p className="text-gray-600 mt-1">
              How money was added (credits) or deducted (debits) on this OVA
            </p>
          </div>
        </div>

        {ova && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{ova.name}</CardTitle>
              <CardDescription>
                Code: <span className="font-mono">{ova.code}</span>
                {ova.partnerCode && (
                  <>
                    {' · '}
                    Partner: <Badge variant="outline">{ova.partnerCode}</Badge>
                  </>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Movement history</CardTitle>
            <CardDescription>
              Credits add to the OVA; debits deduct. Each row links to the source transaction when
              available.
            </CardDescription>
            <div className="flex gap-4 pt-2">
              <Select
                value={directionFilter}
                onValueChange={(v: 'all' | 'CREDIT' | 'DEBIT') => {
                  setDirectionFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="CREDIT">Credits only</SelectItem>
                  <SelectItem value="DEBIT">Debits only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : movements.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No movements yet. Movements are recorded when mapped transactions complete.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance before</TableHead>
                      <TableHead className="text-right">Balance after</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m: OvaMovement) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {formatDate(m.createdAt)}
                        </TableCell>
                        <TableCell>
                          {m.direction === 'CREDIT' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              <ArrowDownCircle className="h-3 w-3 mr-1 inline" />
                              Credit
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                              <ArrowUpCircle className="h-3 w-3 mr-1 inline" />
                              Debit
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{m.transactionType}</TableCell>
                        <TableCell className="text-right font-mono">
                          {m.direction === 'CREDIT' ? '+' : '-'}
                          {formatAmount(m.amount)} UGX
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatAmount(m.balanceBefore)} UGX
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatAmount(m.balanceAfter)} UGX
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate text-sm" title={m.reference ?? m.description ?? ''}>
                          {m.reference || m.description || '-'}
                        </TableCell>
                        <TableCell>
                          {m.transactionId ? (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/transactions/${m.transactionId}`}>
                                View
                              </Link>
                            </Button>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Page {page} of {totalPages} · {total} total
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
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
      </main>
    </div>
  )
}
