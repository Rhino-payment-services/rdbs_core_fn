"use client"

import { useEffect, useMemo, useState } from 'react'
import { Calendar, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getKampalaCalendarDate } from '@/lib/utils/kampalaDate'
import {
  ALL_STATEMENT_STATUSES,
  STATEMENT_STATUSES,
  fetchStatementTransactions,
  statementFileName,
  sumWalletBalances,
  toStatementRows,
  walletNumbersFromList,
  walletTypeLabel,
  type StatementStatus,
  type StatementWallet,
} from '@/lib/utils/statementData'
import { buildStatementPdf, downloadStatementPdf } from '@/lib/utils/statementPdf'

type FooterKind = 'balance' | 'totals'

interface GenerateStatementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  allWalletsLabel?: string
  defaultStartDate?: string
  defaultEndDate?: string
  wallets?: StatementWallet[]
  defaultWalletId?: string
  userId?: string
  footer: FooterKind
}

function firstOfMonth(todayYmd: string): string {
  const [year, month] = todayYmd.split('-')
  return `${year}-${month}-01`
}

export function GenerateStatementDialog({
  open,
  onOpenChange,
  name,
  allWalletsLabel = 'All wallets',
  defaultStartDate,
  defaultEndDate,
  wallets,
  defaultWalletId,
  userId,
  footer,
}: GenerateStatementDialogProps) {
  const today = getKampalaCalendarDate(0)
  const [startDate, setStartDate] = useState(defaultStartDate || getKampalaCalendarDate(-30))
  const [endDate, setEndDate] = useState(defaultEndDate || today)
  const [statuses, setStatuses] = useState<StatementStatus[]>([...ALL_STATEMENT_STATUSES])
  const [walletScope, setWalletScope] = useState<string>(defaultWalletId || 'all')
  const [showTotals, setShowTotals] = useState(true)
  const [allTime, setAllTime] = useState(false)
  const [activePreset, setActivePreset] = useState<'month' | '3m' | '6m' | '12m' | 'all' | null>(
    null,
  )
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')

  useEffect(() => {
    if (!open) return
    setStartDate(defaultStartDate || getKampalaCalendarDate(-30))
    setEndDate(defaultEndDate || getKampalaCalendarDate(0))
    setStatuses([...ALL_STATEMENT_STATUSES])
    setWalletScope(defaultWalletId || 'all')
    setShowTotals(true)
    setAllTime(false)
    setActivePreset(null)
    setProgress('')
  }, [open, defaultStartDate, defaultEndDate, defaultWalletId])

  const showWalletSelect = Boolean(wallets && wallets.length > 0)

  const scopedWallets = useMemo(() => {
    if (!wallets?.length) return []
    if (walletScope === 'all') return wallets
    return wallets.filter((w) => w.id === walletScope)
  }, [wallets, walletScope])

  const walletLabel = useMemo(() => {
    if (!showWalletSelect || walletScope === 'all') return allWalletsLabel
    const wallet = wallets?.find((w) => w.id === walletScope)
    if (!wallet) return allWalletsLabel
    const type = walletTypeLabel(wallet.walletType)
    const number = String(wallet.publicWalletId || '').trim()
    return number ? `${type} · ${number}` : type
  }, [allWalletsLabel, showWalletSelect, walletScope, wallets])

  const toggleStatus = (value: StatementStatus, checked: boolean) => {
    setStatuses((current) => {
      if (checked) return current.includes(value) ? current : [...current, value]
      return current.filter((s) => s !== value)
    })
  }

  const applyPreset = (kind: 'month' | '3m' | '6m' | '12m' | 'all') => {
    setActivePreset(kind)
    if (kind === 'all') {
      setAllTime(true)
      return
    }
    setAllTime(false)
    const end = getKampalaCalendarDate(0)
    if (kind === 'month') {
      setStartDate(firstOfMonth(end))
      setEndDate(end)
      return
    }
    const offset = kind === '3m' ? -90 : kind === '6m' ? -180 : -365
    setStartDate(getKampalaCalendarDate(offset))
    setEndDate(end)
  }

  const handleGenerate = async () => {
    if (!allTime) {
      if (!startDate || !endDate) {
        toast.error('Please select both start and end dates')
        return
      }
      if (startDate > endDate) {
        toast.error('Start date must be before end date')
        return
      }
    }
    if (statuses.length === 0) {
      toast.error('Select at least one status')
      return
    }

    setBusy(true)
    setProgress('Fetching transactions…')
    const toastId = toast.loading('Generating statement…')
    try {
      const walletIds =
        showWalletSelect && scopedWallets.length > 0
          ? scopedWallets.map((w) => w.id)
          : undefined
      const transactions = await fetchStatementTransactions({
        startDate: allTime ? undefined : startDate,
        endDate: allTime ? undefined : endDate,
        statuses,
        userId,
        walletIds,
        onProgress: (fetched, total) => {
          const known = Number.isFinite(total) && total < Number.POSITIVE_INFINITY
          setProgress(
            known
              ? `Fetching ${fetched.toLocaleString()} / ${total.toLocaleString()}…`
              : `Fetching ${fetched.toLocaleString()}…`,
          )
        },
      })
      setProgress('Building PDF…')
      const rows = toStatementRows(transactions, walletNumbersFromList(scopedWallets))
      const totals = rows.reduce(
        (acc, row) => {
          acc.debit += row.debitAmount
          acc.credit += row.creditAmount
          return acc
        },
        { debit: 0, credit: 0 },
      )
      const doc = await buildStatementPdf({
        name,
        walletLabel,
        startDate: allTime ? undefined : startDate,
        endDate: allTime ? undefined : endDate,
        allTime,
        statuses,
        rows,
        footer:
          footer === 'balance'
            ? { kind: 'balance', amount: sumWalletBalances(scopedWallets) }
            : showTotals
              ? { kind: 'totals', debit: totals.debit, credit: totals.credit }
              : null,
      })
      downloadStatementPdf(
        doc,
        statementFileName(
          allTime ? { name } : { name, startDate, endDate },
        ),
      )
      toast.success(
        `Statement ready (${rows.length.toLocaleString()} transaction${rows.length === 1 ? '' : 's'})`,
        { id: toastId },
      )
      onOpenChange(false)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message || 'Failed to generate statement')
          : 'Failed to generate statement'
      toast.error(message, { id: toastId })
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate statement
          </DialogTitle>
          <DialogDescription>
            Download a RukaPay-branded PDF. Choose a date range or all time, and which statuses to
            include.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="statement-start">From</Label>
              <Input
                id="statement-start"
                type="date"
                value={allTime ? '' : startDate}
                max={endDate || today}
                onChange={(e) => {
                  setAllTime(false)
                  setActivePreset(null)
                  setStartDate(e.target.value)
                }}
                disabled={busy || allTime}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="statement-end">To</Label>
              <Input
                id="statement-end"
                type="date"
                value={allTime ? '' : endDate}
                min={startDate || undefined}
                max={today}
                onChange={(e) => {
                  setAllTime(false)
                  setActivePreset(null)
                  setEndDate(e.target.value)
                }}
                disabled={busy || allTime}
              />
            </div>
          </div>
          {allTime ? (
            <p className="text-xs text-gray-500">Includes every transaction up to today.</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={activePreset === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPreset('month')}
              disabled={busy}
            >
              This month
            </Button>
            <Button
              type="button"
              variant={activePreset === '3m' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPreset('3m')}
              disabled={busy}
            >
              Last 3 months
            </Button>
            <Button
              type="button"
              variant={activePreset === '6m' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPreset('6m')}
              disabled={busy}
            >
              Last 6 months
            </Button>
            <Button
              type="button"
              variant={activePreset === '12m' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPreset('12m')}
              disabled={busy}
            >
              Last 12 months
            </Button>
            <Button
              type="button"
              variant={activePreset === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPreset('all')}
              disabled={busy}
            >
              All time
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Very large statements (up to 50,000 transactions) can take a minute to build.
          </p>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="grid grid-cols-2 gap-2">
              {STATEMENT_STATUSES.map((item) => (
                <label key={item.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={statuses.includes(item.value)}
                    onCheckedChange={(checked) => toggleStatus(item.value, checked === true)}
                    disabled={busy}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          {showWalletSelect && (
            <div className="space-y-2">
              <Label>Wallet</Label>
              <Select value={walletScope} onValueChange={setWalletScope} disabled={busy}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All wallets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{allWalletsLabel}</SelectItem>
                  {wallets!.map((wallet) => {
                    const number = String(wallet.publicWalletId || '').trim()
                    const type = walletTypeLabel(wallet.walletType)
                    const balance = Number(wallet.balance ?? 0).toLocaleString()
                    return (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {type}
                        {number ? ` · ${number}` : ''} — {balance} {wallet.currency || 'UGX'}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {footer === 'totals' && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={showTotals}
                onCheckedChange={(checked) => setShowTotals(checked === true)}
                disabled={busy}
              />
              Show total debit and total credit
            </label>
          )}

          {progress ? <p className="text-xs text-gray-500">{progress}</p> : null}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={busy || (!allTime && (!startDate || !endDate)) || statuses.length === 0}
            className="bg-[#08163d] hover:bg-[#0a1f4f]"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Generate PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
