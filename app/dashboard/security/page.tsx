"use client"
import React, { useState, useMemo } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
import { useSecurityStats, useFlaggedTransactions, useSecurityIncidents } from '@/lib/hooks/useSecurityData'
import { useRecentActivity } from '@/lib/hooks/useActivityLogs'

const SecurityPage = () => {
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch real data
  const { data: securityStats, isLoading: statsLoading, refetch: refetchStats } = useSecurityStats()
  const { data: flaggedTransactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useFlaggedTransactions(50)
  const { data: securityIncidents, isLoading: incidentsLoading, refetch: refetchIncidents } = useSecurityIncidents()
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(10)

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
    toast.success('Export functionality coming soon')
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
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
            <TabsList className="grid w-full grid-cols-4">
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
                  <CardDescription>Active and recent security incidents</CardDescription>
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
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Affected Users</TableHead>
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
                                  {incident.type.replace(/_/g, ' ')}
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
                      <p className="text-sm">All systems are operating normally</p>
                    </div>
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
        </div>
      </main>
    </div>
  )
}

export default SecurityPage
