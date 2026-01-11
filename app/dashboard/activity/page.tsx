"use client"
import React, { useState, useMemo } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  User,
  Shield,
  Database,
  CreditCard,
  Settings,
  Activity,
  BarChart3,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Users,
  Building2,
  FileText,
  Server,
  Loader2
} from 'lucide-react'
import { useActivityLogs, useActivityStats, type ActivityLog } from '@/lib/hooks/useActivityLogs'
import toast from 'react-hot-toast'

const ActivityLogPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedModule, setSelectedModule] = useState("all")
  const [timeRange, setTimeRange] = useState("24h")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState("all")
  const [page, setPage] = useState(1)
  const limit = 50

  // Calculate date range based on timeRange
  const getDateRange = () => {
    const now = new Date()
    const endDate = now.toISOString()
    let startDate: string
    
    switch (timeRange) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
        break
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        break
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    }
    
    return { startDate, endDate }
  }

  const dateRange = getDateRange()

  // Map frontend status to backend status
  const getBackendStatus = (level: string) => {
    switch (level) {
      case 'error': return 'FAILED'
      case 'success': return 'SUCCESS'
      case 'warning': return 'PENDING'
      case 'info': return undefined
      default: return undefined
    }
  }

  // Fetch activity logs
  const { data: logsData, isLoading, refetch } = useActivityLogs({
    page,
    limit,
    category: selectedModule !== 'all' ? selectedModule.toUpperCase() : undefined,
    status: selectedLevel !== 'all' ? getBackendStatus(selectedLevel) : undefined,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  })

  // Fetch activity stats
  const { data: statsData } = useActivityStats(dateRange.startDate, dateRange.endDate)

  // Filter logs client-side for search
  const filteredLogs = useMemo(() => {
    if (!logsData?.logs) return []
    
    let logs = logsData.logs
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      logs = logs.filter(log => 
        log.action.toLowerCase().includes(lowerSearch) ||
        log.description.toLowerCase().includes(lowerSearch) ||
        (log.userEmail && log.userEmail.toLowerCase().includes(lowerSearch)) ||
        (log.userPhone && log.userPhone.includes(lowerSearch))
      )
    }
    
    // Filter by tab (internal vs external)
    if (activeTab === 'customer') {
      logs = logs.filter(log => 
        !log.userEmail?.endsWith('@rukapay.com') && 
        !log.userEmail?.endsWith('@system') &&
        log.channel !== 'SYSTEM'
      )
    } else if (activeTab === 'internal') {
      logs = logs.filter(log => 
        log.userEmail?.endsWith('@rukapay.com') || 
        log.userEmail?.endsWith('@system') ||
        log.channel === 'SYSTEM' ||
        log.category === 'ADMIN' ||
        log.category === 'SYSTEM'
      )
    }
    
    return logs
  }, [logsData?.logs, searchTerm, activeTab])

  // Calculate stats from filtered logs
  const currentStats = useMemo(() => {
    if (statsData) {
      return {
        total: statsData.totalActions,
        errors: statsData.failedCount,
        warnings: statsData.pendingCount,
        success: statsData.successCount,
        info: Math.max(0, statsData.totalActions - statsData.failedCount - statsData.pendingCount - statsData.successCount)
      }
    }
    
    // Fallback to calculating from logs
    const logs = filteredLogs
    return {
      total: logs.length,
      errors: logs.filter(log => log.status === 'FAILED').length,
      warnings: logs.filter(log => log.status === 'PENDING').length,
      success: logs.filter(log => log.status === 'SUCCESS').length,
      info: logs.filter(log => !['FAILED', 'PENDING', 'SUCCESS'].includes(log.status)).length
    }
  }, [statsData, filteredLogs])

  const mapStatusToLevel = (status: string): string => {
    switch (status) {
      case 'FAILED': return 'error'
      case 'SUCCESS': return 'success'
      case 'PENDING': return 'warning'
      default: return 'info'
    }
  }

  const getLevelBadge = (status: string) => {
    const level = mapStatusToLevel(status)
    switch (level) {
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Info</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getLevelIcon = (status: string) => {
    const level = mapStatusToLevel(status)
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getModuleIcon = (category: string) => {
    const cat = category?.toLowerCase() || ''
    switch (cat) {
      case 'authentication':
      case 'auth':
        return <Shield className="h-4 w-4" />
      case 'transactions':
      case 'transaction':
        return <CreditCard className="h-4 w-4" />
      case 'payment_processing':
      case 'payment':
        return <DollarSign className="h-4 w-4" />
      case 'user_management':
      case 'user':
        return <User className="h-4 w-4" />
      case 'security':
        return <ShieldCheck className="h-4 w-4" />
      case 'database':
        return <Database className="h-4 w-4" />
      case 'system':
        return <Server className="h-4 w-4" />
      case 'analytics':
        return <BarChart3 className="h-4 w-4" />
      case 'reports':
        return <FileText className="h-4 w-4" />
      case 'settings':
      case 'admin':
        return <Settings className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
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

  const toggleRowExpansion = (id: string) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id)
    } else {
      newExpandedRows.add(id)
    }
    setExpandedRows(newExpandedRows)
  }

  const handleRefresh = () => {
    refetch()
    toast.success('Refreshing activity logs...')
  }

  const handleExport = () => {
    toast.success('Export functionality coming soon')
  }

  const renderActivityTable = (logs: ActivityLog[], isInternal: boolean = false) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-20">Status</TableHead>
            <TableHead className="w-40">Time</TableHead>
            <TableHead className="w-40">Category</TableHead>
            <TableHead className="w-48">{isInternal ? 'Staff Member' : 'User'}</TableHead>
            <TableHead className="w-48">Action</TableHead>
            <TableHead className="w-64">Description</TableHead>
            <TableHead className="w-32">IP Address</TableHead>
            <TableHead className="w-32">Channel</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading activity logs...
                  </div>
                ) : (
                  'No activity logs found for the selected filters'
                )}
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <React.Fragment key={log._id}>
                <TableRow className="hover:bg-gray-50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRowExpansion(log._id)}
                      className="h-6 w-6 p-0"
                    >
                      {expandedRows.has(log._id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getLevelIcon(log.status)}
                      {getLevelBadge(log.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{formatTimestamp(log.createdAt)}</div>
                      <div className="text-xs text-gray-500">{getRelativeTime(log.createdAt)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getModuleIcon(log.category)}
                      <span className="text-sm capitalize">{log.category?.toLowerCase().replace(/_/g, ' ') || 'General'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium truncate max-w-40">
                        {log.userDetails?.fullName || log.userEmail || log.userPhone || log.userId || 'System'}
                      </div>
                      {log.userDetails?.email && log.userDetails?.email !== log.userEmail && (
                        <div className="text-xs text-gray-500 truncate">{log.userDetails.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{log.action?.replace(/_/g, ' ') || 'Action'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 max-w-56 truncate" title={log.description}>
                      {log.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 font-mono">{log.ipAddress || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {log.channel || 'WEB'}
                    </Badge>
                  </TableCell>
                </TableRow>
                {expandedRows.has(log._id) && (
                  <TableRow>
                    <TableCell colSpan={9} className="bg-gray-50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Technical Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">User Agent:</span>
                              <span className="font-mono text-xs max-w-64 truncate">{log.userAgent || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Request ID:</span>
                              <span className="font-mono text-xs">{log.requestId || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">IP Address:</span>
                              <span className="font-mono text-xs">{log.ipAddress || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Channel:</span>
                              <span className="text-xs">{log.channel || 'WEB'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">User ID:</span>
                              <span className="font-mono text-xs">{log.userId || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Metadata</h4>
                          <div className="space-y-2 text-sm">
                            {log.metadata && Object.keys(log.metadata).length > 0 ? (
                              Object.entries(log.metadata).slice(0, 8).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                  <span className="text-xs max-w-48 truncate">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-400 italic">No additional metadata</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Log</h1>
                <p className="text-gray-600">Monitor system activities, user actions, and security events</p>
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

          {/* Activity Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
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
          </Tabs>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentStats.total.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {timeRange === '1h' ? 'Last 1 hour' : timeRange === '24h' ? 'Last 24 hours' : timeRange === '7d' ? 'Last 7 days' : 'Last 30 days'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{currentStats.errors.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  {currentStats.errors > 0 ? 'Requires attention' : 'All clear'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{currentStats.warnings.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Monitor closely
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{currentStats.success.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Operations completed
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Info</CardTitle>
                <Info className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{currentStats.info.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  Informational events
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Content */}
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'all' ? 'All Activity' : activeTab === 'customer' ? 'Customer Activity' : 'Internal Activity'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'all' 
                  ? 'All system activities and user actions'
                  : activeTab === 'customer' 
                    ? 'External user activities and transactions'
                    : 'Dashboard operations and system management activities'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="error">Failed</SelectItem>
                    <SelectItem value="warning">Pending</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="USER_MANAGEMENT">User Management</SelectItem>
                    <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                    <SelectItem value="TRANSACTION">Transactions</SelectItem>
                    <SelectItem value="SECURITY">Security</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SYSTEM">System</SelectItem>
                    <SelectItem value="WALLET">Wallet</SelectItem>
                    <SelectItem value="KYC">KYC</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last 1 hour</SelectItem>
                    <SelectItem value="24h">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Activity Table */}
              {renderActivityTable(filteredLogs, activeTab === 'internal')}

              {/* Pagination */}
              {logsData && logsData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, logsData.total)} of {logsData.total} entries
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {logsData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(logsData.totalPages, p + 1))}
                      disabled={page >= logsData.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default ActivityLogPage
