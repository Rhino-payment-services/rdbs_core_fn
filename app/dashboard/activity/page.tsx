"use client"

import React, { useMemo, useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  RefreshCw,
  Download,
  Loader2,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Users,
  Building2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useActivityLogs,
  useActivityStats,
  useSearchActivityLogs,
  type ActivityLog,
  type ActivityLogFilters,
} from '@/lib/hooks/useActivityLogs'

const TIME_RANGES = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
] as const

function getTimeRangeDates(value: string): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()
  if (value === '24h') start.setHours(start.getHours() - 24)
  else if (value === '7d') start.setDate(start.getDate() - 7)
  else if (value === '30d') start.setDate(start.getDate() - 30)
  else start.setHours(start.getHours() - 24)
  return { startDate: start.toISOString(), endDate: end.toISOString() }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-UG', { dateStyle: 'short', timeStyle: 'short' })
}

function ChannelBadge({ channel }: { channel: string }) {
  const ch = (channel || '').toUpperCase()
  const classes: Record<string, string> = {
    BACKOFFICE: 'bg-purple-100 text-purple-800',
    APP: 'bg-blue-100 text-blue-800',
    WEB: 'bg-cyan-100 text-cyan-800',
    USSD: 'bg-orange-100 text-orange-800',
    MERCHANT_PORTAL: 'bg-teal-100 text-teal-800',
    PARTNER_PORTAL: 'bg-indigo-100 text-indigo-800',
    API: 'bg-gray-100 text-gray-800',
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classes[ch] ?? 'bg-gray-100 text-gray-700'}`}>
      {channel || '—'}
    </span>
  )
}

function StatusBadge({ status }: { status: ActivityLog['status'] }) {
  switch (status) {
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
          <CheckCircle className="h-3 w-3" /> Success
        </span>
      )
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
          <AlertCircle className="h-3 w-3" /> Error
        </span>
      )
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          <AlertTriangle className="h-3 w-3" /> Pending
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
          <Info className="h-3 w-3" /> {status}
        </span>
      )
  }
}

// ─── shared log table ─────────────────────────────────────────────────────────

interface LogTableProps {
  tab: 'all' | 'customer' | 'internal'
  timeRange: string
  onTimeRangeChange: (v: string) => void
}

function LogTable({ tab, timeRange, onTimeRangeChange }: LogTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const { startDate, endDate } = useMemo(() => getTimeRangeDates(timeRange), [timeRange])

  const filters: ActivityLogFilters = useMemo(
    () => ({
      tab,
      page,
      limit,
      startDate,
      endDate,
      status: statusFilter === 'all' ? undefined : (statusFilter as ActivityLogFilters['status']),
      category: categoryFilter === 'all' ? undefined : categoryFilter,
    }),
    [tab, page, limit, startDate, endDate, statusFilter, categoryFilter],
  )

  const searchFilters: ActivityLogFilters = useMemo(
    () => ({ ...filters, query: searchQuery || undefined }),
    [filters, searchQuery],
  )

  const { data: listData, isLoading: listLoading, isError: listError, error: listErrObj } =
    useActivityLogs(filters)
  const { data: searchData, isLoading: searchLoading, isError: searchError } =
    useSearchActivityLogs({ ...searchFilters, query: searchQuery || undefined })

  const useSearch = searchQuery.trim().length > 0
  const data = useSearch ? searchData : listData
  const isLoading = useSearch ? searchLoading : listLoading
  const isError = useSearch ? searchError : listError
  const activeError: any = useSearch ? undefined : listErrObj

  const logs = data?.logs ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 0

  const categories = useMemo(() => {
    const set = new Set<string>()
    logs.forEach((l) => l.category && set.add(l.category))
    return Array.from(set).sort()
  }, [logs])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchInput.trim())
    setPage(1)
  }

  const handleExport = () => {
    if (!logs.length) { toast.error('No logs to export'); return }
    const headers = ['Date', 'User', 'Action', 'Category', 'Status', 'Description', 'Channel', 'IP Address']
    const rows = logs.map((log: ActivityLog) => [
      new Date(log.createdAt).toLocaleString(),
      log.userEmail || log.userPhone || log.userId || '',
      log.action || '',
      log.category || '',
      log.status || '',
      log.description || '',
      log.channel || '',
      log.ipAddress || '',
    ])
    const csvContent = [headers, ...rows]
      .map(row => row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `activity-logs-${tab}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Exported ${logs.length} activity logs to CSV`)
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              placeholder="Search..."
              className="w-48"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={(v) => { onTimeRangeChange(v); setPage(1) }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>

        {/* table */}
        <div className="rounded-md border">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="font-medium">Failed to load activity logs</p>
              <p className="text-sm text-gray-500 mt-1">
                {activeError?.status
                  ? `API Error ${activeError.status}: ${activeError.message || 'Request failed'}`
                  : 'Check your connection or permissions, then try refreshing'}
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No activity logs found for the selected filters
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell><StatusBadge status={log.status} /></TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {formatTime(log.createdAt)}
                    </TableCell>
                    <TableCell><ChannelBadge channel={log.channel} /></TableCell>
                    <TableCell className="text-sm">{log.category || '—'}</TableCell>
                    <TableCell className="text-sm">
                      {log.userDetails?.fullName || log.userDetails?.email || log.userEmail || log.userPhone || '—'}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {log.action?.replace(/_/g, ' ') || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                      {log.description || '—'}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-gray-500">
                      {log.ipAddress || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {total > 0 ? `Page ${page} of ${totalPages} (${total} total)` : ''}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ActivityLogPage() {
  const [activityTab, setActivityTab] = useState<'all' | 'customer' | 'internal'>('all')
  const [timeRange, setTimeRange] = useState<string>('24h')

  const { startDate, endDate } = useMemo(() => getTimeRangeDates(timeRange), [timeRange])
  const { data: stats, refetch: refetchStats } = useActivityStats(startDate, endDate)

  const statsSummary = useMemo(() => {
    const totalEvents = stats?.totalActions ?? 0
    const errors = stats?.failedCount ?? 0
    const success = stats?.successCount ?? 0
    const pending = stats?.pendingCount ?? 0
    return { totalEvents, errors, warnings: pending, success, info: Math.max(0, totalEvents - success - errors - pending) }
  }, [stats])

  const handleTabChange = (v: string) => {
    setActivityTab(v as typeof activityTab)
    // Broaden default window when switching to filtered tabs so data is visible
    if (v !== 'all' && timeRange === '24h') setTimeRange('7d')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Activity Log</h1>
              <p className="text-gray-600">Monitor system activities, user actions, and security events</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => refetchStats()}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>

          {/* stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100"><TrendingUp className="h-5 w-5 text-gray-600" /></div>
                <div><p className="text-2xl font-bold">{statsSummary.totalEvents}</p><p className="text-xs text-gray-500">Last 24 h</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100"><AlertCircle className="h-5 w-5 text-red-600" /></div>
                <div><p className="text-2xl font-bold">{statsSummary.errors}</p><p className="text-xs text-gray-500">Errors</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
                <div><p className="text-2xl font-bold">{statsSummary.warnings}</p><p className="text-xs text-gray-500">Pending</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-2xl font-bold">{statsSummary.success}</p><p className="text-xs text-gray-500">Successful</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100"><Info className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold">{statsSummary.info}</p><p className="text-xs text-gray-500">Informational</p></div>
              </CardContent>
            </Card>
          </div>

          {/* full-width tabs */}
          <Tabs value={activityTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                All Activity
              </TabsTrigger>
              <TabsTrigger value="customer" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Customer Activity
              </TabsTrigger>
              <TabsTrigger value="internal" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Internal Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <LogTable tab="all" timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            </TabsContent>

            <TabsContent value="customer" className="mt-0">
              <LogTable tab="customer" timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            </TabsContent>

            <TabsContent value="internal" className="mt-0">
              <LogTable tab="internal" timeRange={timeRange} onTimeRangeChange={setTimeRange} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
