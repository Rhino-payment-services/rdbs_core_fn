"use client"
import React, { useState, useMemo, useEffect, useCallback } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import {
  DASHBOARD_MAIN_CLASS,
  dashboardFormShellClass,
  dashboardPageShellClass,
} from '@/lib/constants/dashboard-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Shield,
  Radar,
  AlertTriangle,
  Monitor,
  ShieldCheck,
  RefreshCw,
  Download,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import { useSecurityStats, useFlaggedTransactions, useSecurityIncidents } from '@/lib/hooks/useSecurityData'
import { useRecentActivity } from '@/lib/hooks/useActivityLogs'
import { SuspiciousUsersTable } from '@/components/dashboard/security/SuspiciousUsersTable'
import {
  useSuspiciousActivityLogs,
  useFlaggedTransactionLogs,
  type ActivityLogEntry,
  type FlaggedTransactionLogEntry,
} from '@/lib/hooks/useSuspiciousTransactions'
import { ExportDialog } from '@/components/dashboard/transactions/ExportDialog'
import { TransactionDetailsModal } from '@/components/dashboard/transactions/TransactionDetailsModal'
import {
  exportSuspiciousTransactionsByDateRange,
  exportBackendFlaggedSuspiciousByDateRange,
  fetchProfilesForUserIds,
  type TransactorProfile,
} from '@/lib/utils/exportSuspiciousTransactions'
import { Input } from '@/components/ui/input'

const MAX_CUSTOM_RANGE_DAYS = 31

type SuspiciousFlagDetail = {
  source: 'activity_log' | 'transaction_log'
  recordId: string
  createdAt: string
  userId: string
  action: string
  amount: string
  severity: string
  channel: string
  description: string
  reason: string
  riskIndicators: string
  transactionId?: string
  error?: string
}

function normalizeTransactionPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  const payload = raw as Record<string, unknown>
  if (payload.id) return payload
  if (payload.data && typeof payload.data === 'object' && (payload.data as Record<string, unknown>).id) {
    return payload.data as Record<string, unknown>
  }
  return null
}

function toDateOnly(value: string): string {
  return value.includes('T') ? value.slice(0, 10) : value
}

function formatRangeLabel(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return ''
  const start = toDateOnly(startDate)
  const end = toDateOnly(endDate)
  const fmt = (d: string) => {
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y?.slice(2) ?? ''}`
  }
  return `${fmt(start)}–${fmt(end)}`
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${toDateOnly(startDate)}T00:00:00.000Z`)
  const end = new Date(`${toDateOnly(endDate)}T00:00:00.000Z`)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

function activityUserId(log: ActivityLogEntry): string {
  const meta = (log.metadata ?? {}) as Record<string, unknown>
  return String(meta.targetUserId ?? meta.prismaUserId ?? log.userId ?? '')
}

const SecurityPage = () => {
  const [activeTab, setActiveTab] = useState("overview")
  const [exportOpen, setExportOpen] = useState(false)
  const [exportStartDate, setExportStartDate] = useState('')
  const [exportEndDate, setExportEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  // Suspicious Transactions tab state
  const [txnTimeRange, setTxnTimeRange] = useState<'24h' | '7d' | '30d' | 'custom'>('7d')
  const [txnCustomStart, setTxnCustomStart] = useState('')
  const [txnCustomEnd, setTxnCustomEnd] = useState('')
  const [activityPage, setActivityPage] = useState(1)
  const [flaggedPage, setFlaggedPage] = useState(1)
  const [profileMap, setProfileMap] = useState<Map<string, TransactorProfile>>(new Map())
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [flagDetail, setFlagDetail] = useState<SuspiciousFlagDetail | null>(null)
  const [flagDetailOpen, setFlagDetailOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTransaction, setDetailTransaction] = useState<Record<string, unknown> | null>(null)
  const TXN_PAGE_LIMIT = 50

  // Fetch real data
  const { data: securityStats, isLoading: statsLoading, refetch: refetchStats } = useSecurityStats()
  const { data: flaggedTransactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useFlaggedTransactions(50)
  const { data: securityIncidents, isLoading: incidentsLoading, refetch: refetchIncidents } = useSecurityIncidents()
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(10)

  // Suspicious Transactions tab — derive date range and fetch
  const txnDates = useMemo(() => {
    if (txnTimeRange === 'custom') {
      return { startDate: txnCustomStart, endDate: txnCustomEnd }
    }
    const end = new Date()
    const start = new Date()
    if (txnTimeRange === '24h') start.setHours(start.getHours() - 24)
    else if (txnTimeRange === '7d') start.setDate(start.getDate() - 7)
    else start.setDate(start.getDate() - 30)
    return { startDate: start.toISOString(), endDate: end.toISOString() }
  }, [txnTimeRange, txnCustomStart, txnCustomEnd])

  const txnRangeLabel = useMemo(
    () => formatRangeLabel(txnDates.startDate, txnDates.endDate),
    [txnDates.startDate, txnDates.endDate],
  )

  const suspiciousActivityLogs = useSuspiciousActivityLogs({
    ...txnDates,
    page: activityPage,
    limit: TXN_PAGE_LIMIT,
  })
  const flaggedTxLogs = useFlaggedTransactionLogs({
    ...txnDates,
    page: flaggedPage,
    limit: TXN_PAGE_LIMIT,
  })

  // Batch-fetch profiles for users visible on the current pages
  useEffect(() => {
    const ids = new Set<string>()
    for (const log of suspiciousActivityLogs.data?.logs ?? []) {
      const id = activityUserId(log)
      if (id) ids.add(id)
    }
    for (const log of flaggedTxLogs.data?.logs ?? []) {
      if (log.userId) ids.add(log.userId)
    }
    const missing = [...ids].filter((id) => !profileMap.has(id))
    if (!missing.length) return

    let cancelled = false
    setProfilesLoading(true)
    fetchProfilesForUserIds(missing)
      .then((map) => {
        if (cancelled) return
        setProfileMap((prev) => {
          const next = new Map(prev)
          map.forEach((profile, id) => next.set(id, profile))
          return next
        })
      })
      .finally(() => {
        if (!cancelled) setProfilesLoading(false)
      })

    return () => {
      cancelled = true
    }
    // Intentionally omit profileMap to avoid re-fetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suspiciousActivityLogs.data?.logs, flaggedTxLogs.data?.logs])

  const renderUserCell = useCallback(
    (userId: string, fallback?: { name?: string; email?: string; phone?: string }) => {
      const profile = userId ? profileMap.get(userId) : undefined
      const name =
        profile?.fullName ||
        fallback?.name ||
        profile?.phone ||
        fallback?.phone ||
        profile?.email ||
        fallback?.email ||
        (userId ? `${userId.slice(0, 8)}…` : '—')
      const phone = profile?.phone || fallback?.phone || ''
      const email = profile?.email || fallback?.email || ''
      const secondary = [phone, email].filter(Boolean).join(' · ')

      return (
        <div className="min-w-[140px] max-w-[200px]">
          <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
          {secondary ? (
            <div className="text-xs text-gray-500 truncate">{secondary}</div>
          ) : userId && !profile && profilesLoading ? (
            <div className="text-xs text-gray-400">Loading profile…</div>
          ) : userId ? (
            <div className="text-xs text-gray-400 font-mono truncate" title={userId}>
              {userId}
            </div>
          ) : null}
        </div>
      )
    },
    [profileMap, profilesLoading],
  )

  const openFlagDetail = useCallback((detail: SuspiciousFlagDetail) => {
    setFlagDetail(detail)
    setFlagDetailOpen(true)
  }, [])

  const handleViewTransaction = useCallback(async (transactionId: string) => {
    setDetailModalOpen(true)
    setDetailLoading(true)
    setDetailTransaction(null)
    try {
      const response = await api.get(`/transactions/${transactionId}`)
      const tx = normalizeTransactionPayload(response.data)
      if (!tx) {
        toast.error('Transaction not found')
        setDetailModalOpen(false)
        return
      }
      setDetailTransaction(tx)
    } catch {
      toast.error('Failed to load transaction details')
      setDetailModalOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleViewActivityFlag = useCallback(
    (log: ActivityLogEntry) => {
      const meta = (log.metadata ?? {}) as Record<string, unknown>
      const userId = activityUserId(log)
      const transactionId = meta.transactionId ? String(meta.transactionId) : undefined
      openFlagDetail({
        source: 'activity_log',
        recordId: log._id,
        createdAt: log.createdAt,
        userId,
        action: log.action,
        amount: meta.amount != null ? `${meta.currency ?? ''} ${meta.amount}`.trim() : '—',
        severity: String(meta.severity ?? log.status ?? '—'),
        channel: log.channel || String(meta.channel ?? '—'),
        description: log.description || '—',
        reason: String(meta.reason ?? log.description ?? '—'),
        riskIndicators: String(meta.flagType ?? ''),
        transactionId,
      })
      if (transactionId) {
        void handleViewTransaction(transactionId)
      }
    },
    [openFlagDetail, handleViewTransaction],
  )

  const handleViewFlaggedLog = useCallback(
    (log: FlaggedTransactionLogEntry) => {
      const meta = (log.metadata ?? {}) as Record<string, unknown>
      const transactionId = log.transactionId || (meta.transactionId ? String(meta.transactionId) : undefined)
      openFlagDetail({
        source: 'transaction_log',
        recordId: log._id,
        createdAt: log.createdAt,
        userId: log.userId || '',
        action: log.transactionStatus || 'FLAGGED',
        amount: log.currency && log.amount != null ? `${log.currency} ${log.amount}` : '—',
        severity: 'HIGH',
        channel: log.channel || '—',
        description: log.errorMessage || String(meta.reason ?? '—'),
        reason: String(meta.reason ?? log.errorMessage ?? '—'),
        riskIndicators: Array.isArray(log.riskIndicators)
          ? log.riskIndicators.join(', ')
          : String(meta.flagType ?? '—'),
        transactionId,
        error: log.errorMessage || log.errorCode || undefined,
      })
      if (transactionId) {
        void handleViewTransaction(transactionId)
      }
    },
    [openFlagDetail, handleViewTransaction],
  )

  const isLoading = statsLoading || transactionsLoading || incidentsLoading

  // Calculate stats
  const stats = useMemo(() => ({
    totalFlagged: securityStats?.flaggedTransactions || 0,
    highRisk: securityStats?.highRiskTransactions || 0,
    pendingReview: securityStats?.pendingReview || 0,
    blocked: securityStats?.blockedUsers || 0,
    totalIncidents: securityIncidents?.length || 0,
    activeIncidents: securityIncidents?.filter(i => i.status === 'active').length || 0,
    criticalIncidents: securityIncidents?.filter(i => i.severity === 'critical').length || 0,
    policiesCompliance: securityStats?.policyCompliance || 100
  }), [securityStats, securityIncidents])

  const handleRefresh = () => {
    refetchStats()
    refetchTransactions()
    refetchIncidents()
    toast.success('Refreshing security data...')
  }

  const handleExport = () => {
    setExportOpen(true)
  }

  const handleTxnExport = async () => {
    if (!txnDates.startDate || !txnDates.endDate) {
      toast.error('Please set a valid date range first')
      return
    }
    if (txnTimeRange === 'custom' && (!txnCustomStart || !txnCustomEnd)) {
      toast.error('Please select both From and To dates')
      return
    }
    const span = daysBetween(txnDates.startDate, txnDates.endDate)
    if (span < 0) {
      toast.error('From date must be before To date')
      return
    }
    if (span > MAX_CUSTOM_RANGE_DAYS) {
      toast.error(`Date range cannot exceed ${MAX_CUSTOM_RANGE_DAYS} days — pick a shorter range`)
      return
    }

    setIsExporting(true)
    const toastId = toast.loading(`Exporting ${txnRangeLabel || 'selected range'}…`)
    try {
      const count = await exportBackendFlaggedSuspiciousByDateRange(
        toDateOnly(txnDates.startDate),
        toDateOnly(txnDates.endDate),
        (message) => toast.loading(message, { id: toastId }),
      )
      if (count === 0) {
        toast.error('No suspicious transactions found in the selected date range', { id: toastId })
        return
      }
      toast.success(`Exported ${count} flagged record${count === 1 ? '' : 's'} (${txnRangeLabel})`, { id: toastId })
    } catch {
      toast.error('Export failed or timed out — try a shorter date range', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportByDateRange = async (startDate: string, endDate: string) => {
    setIsExporting(true)
    const toastId = toast.loading('Starting export…')
    try {
      const count = await exportSuspiciousTransactionsByDateRange(
        startDate,
        endDate,
        (message) => toast.loading(message, { id: toastId }),
      )
      if (count === 0) {
        toast.error('No suspicious transactions found in the selected date range', { id: toastId })
        return
      }
      toast.success(`Exported ${count} suspicious transaction record${count === 1 ? '' : 's'}`, { id: toastId })
      setExportStartDate('')
      setExportEndDate('')
    } catch {
      toast.error('Export failed or timed out — try a shorter date range', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'UGX') => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRelativeTime = (timestamp: string) => {
    const now = new Date()
    const logTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - logTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <Badge className="bg-red-600 text-white">Critical</Badge>
      case 'high':
        return <Badge className="bg-red-100 text-red-800 border-red-200">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Low</Badge>
      default:
        return <Badge variant="secondary">{riskLevel}</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-600 text-white">Critical</Badge>
      case 'high':
        return <Badge className="bg-red-100 text-red-800 border-red-200">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Low</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Active</Badge>
      case 'investigating':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Investigating</Badge>
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Resolved</Badge>
      case 'dismissed':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Dismissed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <DashboardPageLayout>
        <DashboardBreadcrumbs items={getDashboardPageCrumbs('security')} />
        {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Dashboard</h1>
                <p className="text-gray-600">Monitor security threats, flagged transactions, and system protection</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleRefresh}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flagged Transactions</CardTitle>
                <Radar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFlagged}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.highRisk} high risk
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeIncidents}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.criticalIncidents} critical
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingReview}</div>
                <div className="text-xs text-muted-foreground">
                  Requires attention
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Policy Compliance</CardTitle>
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.policiesCompliance}%</div>
                <div className="text-xs text-muted-foreground">
                  Overall compliance
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="radar" className="flex items-center gap-2">
                <Radar className="h-4 w-4" />
                Radar Actions
              </TabsTrigger>
              <TabsTrigger value="incidents" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Incidents
              </TabsTrigger>
              <TabsTrigger value="suspicious" className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Suspicious Users
              </TabsTrigger>
              <TabsTrigger value="suspicious-txns" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Suspicious Txns
              </TabsTrigger>
              <TabsTrigger value="platforms" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Platforms
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Tab Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Security Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Security Status</CardTitle>
                    <CardDescription>Current security posture and threats</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stats.activeIncidents === 0 ? 'bg-green-500' : stats.criticalIncidents > 0 ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        <span className="text-sm font-medium">System Status</span>
                      </div>
                      <Badge variant={stats.activeIncidents === 0 ? 'default' : 'destructive'}>
                        {stats.activeIncidents === 0 ? 'Secure' : `${stats.activeIncidents} Active Issues`}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stats.highRisk === 0 ? 'bg-green-500' : stats.highRisk > 5 ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        <span className="text-sm font-medium">Threat Level</span>
                      </div>
                      <Badge variant={stats.highRisk === 0 ? 'default' : stats.highRisk > 5 ? 'destructive' : 'secondary'}>
                        {stats.highRisk === 0 ? 'Low' : stats.highRisk > 5 ? 'High' : 'Medium'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stats.blocked === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm font-medium">Blocked Users</span>
                      </div>
                      <span className="text-sm font-medium">{stats.blocked}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest security events</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activityLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : recentActivity && recentActivity.length > 0 ? (
                      <div className="space-y-4">
                        {recentActivity.slice(0, 5).map((activity, index) => (
                          <div key={activity._id || index} className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${
                              activity.status === 'FAILED' ? 'bg-red-100' : 
                              activity.status === 'SUCCESS' ? 'bg-green-100' : 'bg-yellow-100'
                            }`}>
                              {activity.status === 'FAILED' ? (
                                <XCircle className="h-4 w-4 text-red-600" />
                              ) : activity.status === 'SUCCESS' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {activity.action?.replace(/_/g, ' ') || 'Activity'}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {activity.description}
                              </p>
                              <p className="text-xs text-gray-400">
                                {getRelativeTime(activity.createdAt)}
                              </p>
                            </div>
                            {getSeverityBadge(activity.status === 'FAILED' ? 'high' : 'low')}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No recent security activity
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Radar Actions Tab - Flagged Transactions */}
            <TabsContent value="radar" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Flagged Transactions</CardTitle>
                  <CardDescription>Transactions flagged for review due to risk factors</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : flaggedTransactions && flaggedTransactions.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Transaction</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Risk Level</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {flaggedTransactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell>
                                <div className="font-mono text-xs truncate max-w-24">{tx.reference}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm truncate max-w-32">
                                  {tx.userEmail || tx.userPhone || tx.userId}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(tx.amount, tx.currency)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{tx.type}</Badge>
                              </TableCell>
                              <TableCell>
                                {getRiskBadge(tx.riskLevel)}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600 truncate max-w-40">
                                  {tx.reason}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs text-gray-500">
                                  {getRelativeTime(tx.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No flagged transactions found</p>
                      <p className="text-sm">All transactions are within normal parameters</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Incidents Tab */}
            <TabsContent value="incidents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Incidents</CardTitle>
                  <CardDescription>
                    Incidents are derived from security-related activity logs (blocks, suspensions, failed auth, etc.).
                    Severity: high for block/suspend events, critical for brute-force or repeated failures.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {incidentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : securityIncidents && securityIncidents.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Type</TableHead>
                            <TableHead>Classification</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Affected</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {securityIncidents.map((incident) => (
                            <TableRow key={incident.id}>
                              <TableCell>
                                <div className="text-sm font-medium capitalize">
                                  {(incident as any).type?.replace?.(/_/g, ' ') ?? incident.type}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs text-gray-600 font-mono" title="Source of this incident">
                                  {(incident as any).classification ?? `Activity log · ${incident.action}`}
                                </div>
                              </TableCell>
                              <TableCell>
                                {getSeverityBadge(incident.severity)}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(incident.status)}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600 truncate max-w-48">
                                  {incident.description}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{incident.affectedUsers}</span>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600">{incident.location}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs text-gray-500">
                                  {getRelativeTime(incident.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No security incidents</p>
                      <p className="text-sm mt-1">All systems are operating normally.</p>
                      <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">
                        Incidents appear here when security-related activity is logged (e.g. user blocks, suspensions, failed logins). View Activity Log under Security for all events.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Suspicious Users Tab */}
            <TabsContent value="suspicious" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Suspicious Users</CardTitle>
                  <CardDescription>
                    Users detected with suspicious transaction patterns. Review and block users as needed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SuspiciousUsersTable limit={50} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Suspicious Transactions Tab */}
            <TabsContent value="suspicious-txns" className="space-y-6">
              {/* Date filter bar */}
              <Card>
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex gap-1">
                      {(['24h', '7d', '30d'] as const).map((preset) => (
                        <Button
                          key={preset}
                          size="sm"
                          variant={txnTimeRange === preset ? 'default' : 'outline'}
                          onClick={() => { setTxnTimeRange(preset); setActivityPage(1); setFlaggedPage(1) }}
                        >
                          Last {preset}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant={txnTimeRange === 'custom' ? 'default' : 'outline'}
                        onClick={() => setTxnTimeRange('custom')}
                      >
                        Custom
                      </Button>
                    </div>
                    {txnTimeRange === 'custom' && (
                      <>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">From</span>
                          <Input
                            type="date"
                            className="h-8 text-sm w-36"
                            value={txnCustomStart}
                            onChange={(e) => { setTxnCustomStart(e.target.value); setActivityPage(1); setFlaggedPage(1) }}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">To</span>
                          <Input
                            type="date"
                            className="h-8 text-sm w-36"
                            value={txnCustomEnd}
                            onChange={(e) => { setTxnCustomEnd(e.target.value); setActivityPage(1); setFlaggedPage(1) }}
                          />
                        </div>
                      </>
                    )}
                    <div className="ml-auto flex items-center gap-3">
                      {txnRangeLabel ? (
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          Range: {txnRangeLabel}
                          {txnTimeRange === 'custom' ? ` (max ${MAX_CUSTOM_RANGE_DAYS}d)` : ''}
                        </span>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                        disabled={isExporting || (!txnDates.startDate || !txnDates.endDate)}
                        onClick={handleTxnExport}
                      >
                        <Download className="h-4 w-4" />
                        {isExporting ? 'Exporting…' : 'Export CSV'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity-log flags (SUSPICIOUS_TRANSACTION category) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Backend Flagged Events</CardTitle>
                  <CardDescription>
                    Activity log entries where the backend flagged a limit breach or suspicious pattern
                    (category: SUSPICIOUS_TRANSACTION).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {suspiciousActivityLogs.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Loading…</span>
                    </div>
                  ) : (suspiciousActivityLogs.data?.logs ?? []).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-green-500" />
                      <p className="text-sm">No flagged events in this period.</p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead>Date</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Action / Flag</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Severity</TableHead>
                              <TableHead>Channel</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="w-16">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(suspiciousActivityLogs.data?.logs ?? []).map((log) => {
                              const meta = (log.metadata ?? {}) as Record<string, unknown>
                              const amount = meta.amount != null ? `${meta.currency ?? ''} ${meta.amount}`.trim() : '—'
                              const severity = (meta.severity as string) || log.status
                              const userId = activityUserId(log)
                              return (
                                <TableRow key={log._id}>
                                  <TableCell className="text-xs whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString('en-UG', { dateStyle: 'short', timeStyle: 'short' })}
                                  </TableCell>
                                  <TableCell>
                                    {renderUserCell(userId, {
                                      name: log.userDetails?.fullName,
                                      email: log.userEmail || log.userDetails?.email,
                                      phone: log.userPhone || log.userDetails?.phone,
                                    })}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">{log.action}</Badge>
                                  </TableCell>
                                  <TableCell className="text-sm font-medium">{amount}</TableCell>
                                  <TableCell>
                                    <Badge className={severity === 'HIGH' || severity === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
                                      {severity}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs">{log.channel || '—'}</TableCell>
                                  <TableCell className="text-xs max-w-48 truncate text-gray-600">{log.description || '—'}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => handleViewActivityFlag(log)} title="View flag">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      {/* Pagination */}
                      {(suspiciousActivityLogs.data?.totalPages ?? 0) > 1 && (
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">
                            Page {suspiciousActivityLogs.data?.page} of {suspiciousActivityLogs.data?.totalPages}
                            {' '}({suspiciousActivityLogs.data?.total} total)
                          </span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" disabled={activityPage <= 1} onClick={() => setActivityPage(p => p - 1)}>Previous</Button>
                            <Button size="sm" variant="outline" disabled={activityPage >= (suspiciousActivityLogs.data?.totalPages ?? 1)} onClick={() => setActivityPage(p => p + 1)}>Next</Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Transaction log flags (FLAGGED status) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Flagged Transaction Logs</CardTitle>
                  <CardDescription>
                    Transaction log records with FLAGGED status — limit breaches recorded at processing time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {flaggedTxLogs.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Loading…</span>
                    </div>
                  ) : (flaggedTxLogs.data?.logs ?? []).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-green-500" />
                      <p className="text-sm">No flagged transaction logs in this period.</p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead>Date</TableHead>
                              <TableHead>Transaction ID</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Channel</TableHead>
                              <TableHead>Risk Indicators</TableHead>
                              <TableHead>Error</TableHead>
                              <TableHead className="w-16">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(flaggedTxLogs.data?.logs ?? []).map((log) => (
                              <TableRow key={log._id}>
                                <TableCell className="text-xs whitespace-nowrap">
                                  {new Date(log.createdAt).toLocaleString('en-UG', { dateStyle: 'short', timeStyle: 'short' })}
                                </TableCell>
                                <TableCell className="font-mono text-xs max-w-28 truncate">
                                  {log.transactionId || '—'}
                                </TableCell>
                                <TableCell>
                                  {renderUserCell(log.userId || '')}
                                </TableCell>
                                <TableCell className="text-sm font-medium">
                                  {log.currency && log.amount != null ? `${log.currency} ${log.amount}` : '—'}
                                </TableCell>
                                <TableCell>
                                  {log.transactionType ? <Badge variant="outline" className="text-xs">{log.transactionType}</Badge> : '—'}
                                </TableCell>
                                <TableCell className="text-xs">{log.channel || '—'}</TableCell>
                                <TableCell className="text-xs max-w-36 truncate text-gray-600">
                                  {log.riskIndicators?.join(', ') || '—'}
                                </TableCell>
                                <TableCell className="text-xs max-w-36 truncate text-red-600">
                                  {log.errorMessage || log.errorCode || '—'}
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => handleViewFlaggedLog(log)} title="View flag">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {/* Pagination */}
                      {(flaggedTxLogs.data?.totalPages ?? 0) > 1 && (
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">
                            Page {flaggedTxLogs.data?.page} of {flaggedTxLogs.data?.totalPages}
                            {' '}({flaggedTxLogs.data?.total} total)
                          </span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" disabled={flaggedPage <= 1} onClick={() => setFlaggedPage(p => p - 1)}>Previous</Button>
                            <Button size="sm" variant="outline" disabled={flaggedPage >= (flaggedTxLogs.data?.totalPages ?? 1)} onClick={() => setFlaggedPage(p => p + 1)}>Next</Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Platforms Tab */}
            <TabsContent value="platforms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Status</CardTitle>
                  <CardDescription>Status of connected platforms and services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Merchant App */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="font-medium">Merchant App</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Uptime</span>
                            <span className="font-medium">99.9%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Platform</span>
                            <span>Mobile</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Subscriber App */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="font-medium">Subscriber App</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Uptime</span>
                            <span className="font-medium">99.9%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Platform</span>
                            <span>Mobile</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* USSD Service */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="font-medium">USSD Service</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Uptime</span>
                            <span className="font-medium">99.8%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Platform</span>
                            <span>Telecom</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* API Gateway */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="font-medium">API Gateway</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Uptime</span>
                            <span className="font-medium">99.99%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Platform</span>
                            <span>Web</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Admin Dashboard */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="font-medium">Admin Dashboard</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Uptime</span>
                            <span className="font-medium">99.9%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Platform</span>
                            <span>Web</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Gateway */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="font-medium">Payment Gateway</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Uptime</span>
                            <span className="font-medium">99.95%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Platform</span>
                            <span>Integration</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

      <ExportDialog
        isOpen={exportOpen}
        onOpenChange={setExportOpen}
        exportStartDate={exportStartDate}
        exportEndDate={exportEndDate}
        isExporting={isExporting}
        onStartDateChange={setExportStartDate}
        onEndDateChange={setExportEndDate}
        onExport={handleExportByDateRange}
        title="Export Suspicious Transactions"
        description="Exports all suspicious transactions for the selected date range: dashboard pattern detections (rapid failures, velocity checks, etc.), backend limit flags, and transactor profile details."
        exportButtonLabel="Export CSV"
      />

      <Dialog
        open={flagDetailOpen}
        onOpenChange={(open) => {
          setFlagDetailOpen(open)
          if (!open) setFlagDetail(null)
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Suspicious Flag Details</DialogTitle>
            <DialogDescription>
              {flagDetail?.source === 'activity_log' ? 'Backend activity flag' : 'Flagged transaction log'}
              {flagDetail?.transactionId ? ` · Tx ${flagDetail.transactionId}` : ''}
            </DialogDescription>
          </DialogHeader>
          {flagDetail ? (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">User</p>
                {renderUserCell(flagDetail.userId)}
                {flagDetail.userId && profileMap.get(flagDetail.userId) ? (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Type: {profileMap.get(flagDetail.userId)?.userType || '—'}</div>
                    <div>KYC: {profileMap.get(flagDetail.userId)?.kycStatus || '—'}</div>
                    <div>Status: {profileMap.get(flagDetail.userId)?.status || '—'}</div>
                    <div>National ID: {profileMap.get(flagDetail.userId)?.nationalId || '—'}</div>
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p>{new Date(flagDetail.createdAt).toLocaleString('en-UG')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Action / Status</p>
                  <Badge variant="outline">{flagDetail.action}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="font-medium">{flagDetail.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Severity</p>
                  <Badge className="bg-red-100 text-red-700">{flagDetail.severity}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Channel</p>
                  <p>{flagDetail.channel}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Risk / Flag type</p>
                  <p>{flagDetail.riskIndicators || '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reason</p>
                <p className="text-gray-800 whitespace-pre-wrap">{flagDetail.reason}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-gray-800 whitespace-pre-wrap">{flagDetail.description}</p>
              </div>
              {flagDetail.error ? (
                <div>
                  <p className="text-xs text-gray-500">Error</p>
                  <p className="text-red-600">{flagDetail.error}</p>
                </div>
              ) : null}
              {flagDetail.transactionId ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={detailLoading}
                  onClick={() => handleViewTransaction(flagDetail.transactionId!)}
                >
                  {detailLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading transaction…</>
                  ) : (
                    <><Eye className="h-4 w-4 mr-2" />Open full transaction</>
                  )}
                </Button>
              ) : (
                <p className="text-xs text-gray-500 italic">No linked transaction ID on this flag.</p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <TransactionDetailsModal
        isOpen={detailModalOpen}
        onOpenChange={(open) => {
          setDetailModalOpen(open)
          if (!open) setDetailTransaction(null)
        }}
        transaction={detailLoading ? null : detailTransaction}
      />
    </DashboardPageLayout>
  )
}

export default SecurityPage
