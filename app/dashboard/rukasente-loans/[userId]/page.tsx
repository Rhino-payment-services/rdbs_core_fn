'use client'

import React, { FormEvent, use, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Banknote, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import {
  useCollectRukaSenteRepayment,
  useRukaSenteBorrowerLoans,
  type RukaSenteLoanApplication,
} from '@/lib/hooks/useRukaSenteLoans'

function money(amount?: number | null, currency = 'UGX') {
  if (amount == null || Number.isNaN(Number(amount))) return '—'
  return `${currency} ${Number(amount).toLocaleString()}`
}

function dateLabel(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadge(status?: string) {
  const s = String(status || '').toLowerCase()
  const cls =
    s === 'active' || s === 'disbursed' || s === 'fully_paid' || s === 'repaid'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : s === 'partially_paid' || s === 'repaying'
        ? 'bg-sky-50 text-sky-800 border-sky-200'
        : s === 'overdue' || s === 'defaulted'
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : 'bg-slate-50 text-slate-700 border-slate-200'
  return (
    <Badge variant="outline" className={`text-[10px] font-medium capitalize ${cls}`}>
      {s.replace(/_/g, ' ') || 'unknown'}
    </Badge>
  )
}

export default function RukaSenteBorrowerLoanPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = use(params)
  const { hasPermission } = usePermissions()
  const canView = hasPermission(PERMISSIONS.USERS_VIEW)
  const canCollect = canView

  const detailQ = useRukaSenteBorrowerLoans(userId)
  const collect = useCollectRukaSenteRepayment()

  const [selected, setSelected] = useState<RukaSenteLoanApplication | null>(null)
  const [amount, setAmount] = useState('')
  const [walletId, setWalletId] = useState('')

  const user = detailQ.data?.data?.user
  const loans = detailQ.data?.data?.loans ?? []
  const personalWallets = useMemo(
    () =>
      (user?.wallets || []).filter(
        (w) => String(w.walletType).toUpperCase() === 'PERSONAL',
      ),
    [user],
  )

  const totalOutstanding = useMemo(
    () =>
      loans.reduce(
        (sum, loan) => sum + Number(loan.account?.outstanding_balance || 0),
        0,
      ),
    [loans],
  )
  const totalPaid = useMemo(
    () => loans.reduce((sum, loan) => sum + Number(loan.account?.amount_repaid || 0), 0),
    [loans],
  )

  function openCollect(loan: RukaSenteLoanApplication) {
    setSelected(loan)
    const outstanding = Number(loan.account?.outstanding_balance || 0)
    setAmount(outstanding > 0 ? String(outstanding) : '')
    const preferred =
      loan.disbursement_wallet_id ||
      personalWallets.find((w) => w.isDefault)?.id ||
      personalWallets[0]?.id ||
      ''
    setWalletId(preferred)
  }

  async function submitCollect(e: FormEvent) {
    e.preventDefault()
    if (!selected || !canCollect) return
    const value = Number(amount)
    const outstanding = Number(selected.account?.outstanding_balance || 0)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (outstanding > 0 && value > outstanding) {
      toast.error('Amount cannot exceed outstanding balance')
      return
    }
    try {
      await collect.mutateAsync({
        applicationId: selected.id,
        amount: value,
        wallet_id: walletId || undefined,
        userId,
      })
      toast.success('Repayment collected from wallet')
      setSelected(null)
      setAmount('')
      void detailQ.refetch()
    } catch (err) {
      const axiosErr = err as {
        response?: { data?: { message?: string; error?: { message?: string } } }
        message?: string
      }
      toast.error(
        axiosErr.response?.data?.message ||
          axiosErr.response?.data?.error?.message ||
          axiosErr.message ||
          'Collection failed',
      )
    }
  }

  if (!canView) {
    return (
      <DashboardPageLayout>
        <p className="text-sm text-muted-foreground">Access denied.</p>
      </DashboardPageLayout>
    )
  }

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs
        items={[
          ...getDashboardPageCrumbs('rukasente-loans'),
          { label: user?.name || 'Borrower' },
        ]}
      />

      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/dashboard/rukasente-loans"
            className="mb-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Link>
          <DashboardPageHeader
            className="mb-0 md:mb-0"
            title={
              <span className="text-xl md:text-2xl">{user?.name || 'Borrower loans'}</span>
            }
            description={
              <span className="text-xs md:text-sm">
                {user?.phone || '—'}
                {user?.email ? ` · ${user.email}` : ''}
                {user?.hasActiveRukaSenteLoan ? ' · Active loan flag on RukaPay' : ''}
              </span>
            }
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => detailQ.refetch()}
          disabled={detailQ.isFetching}
        >
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${detailQ.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <MiniStat label="Outstanding" value={money(totalOutstanding)} emphasize />
        <MiniStat label="Paid so far" value={money(totalPaid)} />
        <MiniStat label="Open loans" value={String(loans.length)} />
        <MiniStat
          label="Wallet cash"
          value={money(
            personalWallets.reduce((s, w) => s + Number(w.balance || 0), 0),
            personalWallets[0]?.currency || 'UGX',
          )}
        />
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-3">
        <Card className="border-slate-200/80 shadow-sm lg:col-span-1">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">Borrower</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4 pt-0 text-xs">
            <InfoRow label="User ID" value={user?.userId || userId} mono />
            <InfoRow label="Phone" value={user?.phone || '—'} />
            <InfoRow label="Email" value={user?.email || '—'} />
            <InfoRow label="Status" value={user?.status || '—'} />
            <InfoRow
              label="Active loan flag"
              value={user?.hasActiveRukaSenteLoan ? 'Yes' : 'No'}
            />
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm lg:col-span-2">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm font-semibold">Personal wallets</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {personalWallets.length === 0 ? (
              <p className="text-xs text-slate-500">No active personal wallets.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-slate-100">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-2.5 py-2 font-medium">Wallet</th>
                      <th className="px-2.5 py-2 font-medium">Type</th>
                      <th className="px-2.5 py-2 font-medium">Balance</th>
                      <th className="px-2.5 py-2 font-medium">Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personalWallets.map((w) => (
                      <tr key={w.id} className="border-t border-slate-100">
                        <td className="px-2.5 py-2 font-mono text-[11px] text-slate-600">
                          {w.id.slice(0, 8)}…
                        </td>
                        <td className="px-2.5 py-2">{w.walletType}</td>
                        <td className="px-2.5 py-2 font-medium">
                          {money(w.balance, w.currency)}
                        </td>
                        <td className="px-2.5 py-2">{w.isDefault ? 'Yes' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 py-3">
          <div>
            <CardTitle className="text-sm font-semibold">Loan accounts</CardTitle>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Collect pulls money from the borrower wallet into RukaSente escrow and reduces
              outstanding. Not gated by due date — you can collect any time while outstanding &gt; 0.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {detailQ.isLoading ? (
            <p className="text-xs text-slate-500">Loading loans…</p>
          ) : detailQ.error ? (
            <p className="text-xs text-rose-600">
              {(detailQ.error as Error).message || 'Failed to load loans'}
            </p>
          ) : loans.length === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-xs text-amber-900">
              No loan accounts returned from RukaSente. The RukaPay active-loan flag can still be set
              if partner ownership or sync is incomplete — refresh after restarting RukaSente.
            </div>
          ) : (
            <div className="space-y-3">
              {loans.map((loan) => {
                const account = loan.account
                const currency = account?.currency || loan.currency || 'UGX'
                const outstanding = Number(account?.outstanding_balance || 0)
                const total = Number(account?.total_repayable || 0)
                const paidPct =
                  total > 0
                    ? Math.min(100, Math.round((Number(account?.amount_repaid || 0) / total) * 100))
                    : 0
                const canRepay = canCollect && outstanding > 0

                return (
                  <div
                    key={loan.id}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {loan.application_number}
                          </p>
                          {statusBadge(account?.status || loan.status)}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {loan.product_name || loan.product_code || 'Product'}
                          {account?.account_number ? ` · ${account.account_number}` : ''}
                          {account?.loan_number ? ` · ${account.loan_number}` : ''}
                          {account?.display_reference
                            ? ` · Ref ${account.display_reference}`
                            : ''}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 bg-[#08163d] text-xs text-white hover:bg-[#06102a]"
                        disabled={!canRepay}
                        onClick={() => openCollect(loan)}
                        title={
                          canRepay
                            ? 'Collect repayment from wallet'
                            : 'Nothing outstanding to collect'
                        }
                      >
                        <Banknote className="mr-1.5 h-3.5 w-3.5" />
                        Collect repayment
                      </Button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <MiniStat
                        label="Outstanding"
                        value={money(outstanding, currency)}
                        emphasize
                        compact
                      />
                      <MiniStat
                        label="Paid"
                        value={money(account?.amount_repaid, currency)}
                        compact
                      />
                      <MiniStat
                        label="Total repayable"
                        value={money(account?.total_repayable || loan.requested_amount, currency)}
                        compact
                      />
                      <MiniStat
                        label="Repayments"
                        value={String(account?.repayment_count ?? 0)}
                        compact
                      />
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">{paidPct}% repaid</p>

                    <div className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                      <InfoRow
                        label="Principal remaining"
                        value={money(account?.principal_balance, currency)}
                      />
                      <InfoRow
                        label="Interest remaining"
                        value={money(account?.interest_balance, currency)}
                      />
                      <InfoRow
                        label="Principal paid"
                        value={money(account?.principal_repaid, currency)}
                      />
                      <InfoRow
                        label="Interest paid"
                        value={money(account?.interest_repaid, currency)}
                      />
                      <InfoRow
                        label="Disbursed amount"
                        value={money(
                          account?.disbursed_amount ?? loan.disbursed_amount,
                          currency,
                        )}
                      />
                      <InfoRow
                        label="Requested"
                        value={money(loan.requested_amount, currency)}
                      />
                      <InfoRow label="Disbursed at" value={dateLabel(account?.disbursed_at)} />
                      <InfoRow
                        label="Due date"
                        value={dateLabel(account?.due_date || loan.due_date)}
                      />
                      <InfoRow label="Fully repaid at" value={dateLabel(account?.repaid_at)} />
                      <InfoRow label="Application ID" value={loan.id} mono />
                      <InfoRow
                        label="Disbursement wallet"
                        value={loan.disbursement_wallet_id || '—'}
                        mono
                      />
                      <InfoRow
                        label="App status"
                        value={String(loan.status || '—').replace(/_/g, ' ')}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Collect repayment</DialogTitle>
            <DialogDescription className="text-xs">
              {selected?.application_number}
              {selected?.account?.account_number
                ? ` · ${selected.account.account_number}`
                : ''}
              . Debits the wallet and credits RukaSente escrow.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={submitCollect}>
            <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
              Outstanding:{' '}
              <span className="font-semibold text-emerald-700">
                {money(
                  selected?.account?.outstanding_balance,
                  selected?.account?.currency || selected?.currency || 'UGX',
                )}
              </span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                min={1}
                step={1}
                className="h-9 text-sm"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Wallet</Label>
              <Select value={walletId} onValueChange={setWalletId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {personalWallets.map((w) => (
                    <SelectItem key={w.id} value={w.id} className="text-sm">
                      {w.walletType} · {money(w.balance, w.currency)}
                      {w.isDefault ? ' (default)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setSelected(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 bg-[#08163d] text-xs text-white hover:bg-[#06102a]"
                disabled={collect.isPending}
              >
                {collect.isPending ? 'Collecting…' : 'Collect money'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardPageLayout>
  )
}

function MiniStat({
  label,
  value,
  emphasize,
  compact,
}: {
  label: string
  value: string
  emphasize?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={`rounded-md border border-slate-100 bg-slate-50/80 ${
        compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
      }`}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-0.5 font-semibold tracking-tight ${
          compact ? 'text-sm' : 'text-base'
        } ${emphasize ? 'text-emerald-700' : 'text-slate-900'}`}
      >
        {value}
      </p>
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span
        className={`text-right font-medium text-slate-800 ${
          mono ? 'break-all font-mono text-[11px]' : ''
        }`}
      >
        {value}
      </span>
    </div>
  )
}
