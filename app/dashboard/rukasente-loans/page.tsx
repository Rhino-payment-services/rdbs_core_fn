'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Banknote, RefreshCw, Search, Users } from 'lucide-react'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { useActiveRukaSenteLoans } from '@/lib/hooks/useRukaSenteLoans'

function formatMoney(amount?: number | null, currency = 'UGX') {
  if (amount == null || Number.isNaN(Number(amount))) return '—'
  return `${currency} ${Number(amount).toLocaleString()}`
}

export default function RukaSenteLoansPage() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const canView = hasPermission(PERMISSIONS.USERS_VIEW)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')

  const listQ = useActiveRukaSenteLoans({
    page,
    limit: 20,
    search: query,
  })

  const items = listQ.data?.data?.items ?? []
  const total = listQ.data?.data?.total ?? 0
  const totalPages = listQ.data?.data?.totalPages ?? 1
  const configured = listQ.data?.configured !== false

  const subtitle = useMemo(() => {
    if (!configured) return 'Ruka Sente is not configured on this server'
    return `${total} borrower${total === 1 ? '' : 's'} with an active loan flag`
  }, [configured, total])

  if (!canView) {
    return (
      <DashboardPageLayout>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Access denied</CardTitle>
            <CardDescription className="text-xs">
              You need USERS_VIEW permission to manage RukaSente loans.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardPageLayout>
    )
  }

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('rukasente-loans')} />
      <DashboardPageHeader
        title={<span className="text-xl md:text-2xl">RukaSente loans</span>}
        description={
          <span className="text-xs md:text-sm">
            Active borrowers on RukaPay. Open a borrower to view the loan account and collect
            repayment from their wallet (any time — not gated by due date).
          </span>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => listQ.refetch()}
            disabled={listQ.isFetching}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${listQ.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <Card className="mb-4 border-slate-200/80 shadow-sm">
        <CardHeader className="px-4 py-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4" />
            Active loan borrowers
          </CardTitle>
          <CardDescription className="text-xs">{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setPage(1)
              setQuery(search.trim())
            }}
          >
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 pl-8 text-xs"
                placeholder="Search phone, name, or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" className="h-8 text-xs">
              Search
            </Button>
          </form>

          {listQ.isLoading ? (
            <p className="text-xs text-muted-foreground">Loading borrowers…</p>
          ) : listQ.error ? (
            <p className="text-xs text-destructive">
              {(listQ.error as Error).message || 'Failed to load borrowers'}
            </p>
          ) : items.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No borrowers currently flagged with an active RukaSente loan.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-100">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-8 text-[10px] uppercase tracking-wide">
                      Borrower
                    </TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wide">Phone</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wide">
                      Wallet balance
                    </TableHead>
                    <TableHead className="h-8 text-[10px] uppercase tracking-wide">Status</TableHead>
                    <TableHead className="h-8 text-right text-[10px] uppercase tracking-wide">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.userId}>
                      <TableCell className="py-2">
                        <div className="text-sm font-medium">{row.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {row.email || row.userId}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-xs">{row.phone || '—'}</TableCell>
                      <TableCell className="py-2 text-xs font-medium">
                        {formatMoney(row.walletBalance, row.walletCurrency || 'UGX')}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-800"
                        >
                          Active loan
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Button
                          size="sm"
                          className="h-7 bg-[#08163d] px-2.5 text-[11px] text-white hover:bg-[#06102a]"
                          onClick={() =>
                            router.push(`/dashboard/rukasente-loans/${row.userId}`)
                          }
                        >
                          <Banknote className="mr-1 h-3 w-3" />
                          Open / Collect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </DashboardPageLayout>
  )
}
