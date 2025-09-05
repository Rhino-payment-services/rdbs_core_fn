"use client"

import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  AlertTriangle,
  Info,
  AlertCircle,
  Bug,
  Calendar,
  Clock,
  BarChart3,
  Activity
} from 'lucide-react'
import { useSystemLogs, useSystemLogsStats, useActivityLogs } from '@/lib/hooks/useApi'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { SystemLog } from '@/lib/types/api'
import toast from 'react-hot-toast'

const SystemLogsPage = () => {
  const [activeTab, setActiveTab] = useState('system')
  const [filters, setFilters] = useState({
    status: undefined as 'SUCCESS' | 'FAILED' | 'PENDING' | undefined,
    category: '',
    startDate: '',
    endDate: '',
    limit: 15,
    page: 1
  })

  const [statsFilters, setStatsFilters] = useState({
    startDate: '',
    endDate: ''
  })

  const { data: logsData, isLoading, error, refetch } = useSystemLogs(filters)
  const { data: statsData, isLoading: statsLoading } = useSystemLogsStats(statsFilters)
  const { data: activityLogsData, isLoading: activityLoading, error: activityError } = useActivityLogs()
  const { canViewSystemLogs } = usePermissions()

  console.log(logsData)
  console.log('Stats:', statsData)
  console.log('Activity Logs:', activityLogsData)

  const logs: SystemLog[] = logsData?.logs || []
  const totalLogs = logsData?.total || 0
  const currentPage = logsData?.page || 1
  const totalPages = logsData?.totalPages || 1

  const getLevelBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />FAILED</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />PENDING</Badge>
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800"><Info className="w-3 h-3 mr-1" />SUCCESS</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const formatUserDisplay = (log: SystemLog) => {
    if (log.userDetails?.fullName) {
      return {
        name: log.userDetails.fullName,
        details: `${log.userDetails.department} • ${log.userDetails.position}`
      }
    }
    if (log.userDetails?.firstName) {
      return {
        name: log.userDetails.firstName,
        details: `${log.userDetails.department} • ${log.userDetails.position}`
      }
    }
    return {
      name: log.userEmail || log.userId || 'System',
      details: null
    }
  }

  const formatDateForAPI = (date: string) => {
    if (!date) return ''
    return new Date(date + 'T23:59:59.999Z').toISOString()
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: key === 'status' ? (value || undefined) : value, 
      page: 1 
    }))
  }

  const handleStatsFilterChange = (key: string, value: string) => {
    setStatsFilters(prev => ({ 
      ...prev, 
      [key]: value
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleRefresh = () => {
    refetch()
    toast.success('System logs refreshed')
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success('Export functionality coming soon')
  }

  return (
    <PermissionGuard 
      permission={PERMISSIONS.VIEW_SYSTEM_LOGS} 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to view system logs.</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">System Logs</h1>
                <p className="text-gray-600">Monitor system activity and debug issues</p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="system" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  System Logs
                </TabsTrigger>
                <TabsTrigger value="stats" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Statistics
                </TabsTrigger>
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </TabsTrigger>
              </TabsList>

              {/* System Logs Tab */}
              <TabsContent value="system" className="space-y-6">
                <SystemLogsTab 
                  logs={logs}
                  totalLogs={totalLogs}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  filters={filters}
                  isLoading={isLoading}
                  error={error}
                  onFilterChange={handleFilterChange}
                  onPageChange={handlePageChange}
                  getLevelBadge={getLevelBadge}
                  formatDate={formatDate}
                  formatUserDisplay={formatUserDisplay}
                />
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="stats" className="space-y-6">
                <StatsTab 
                  statsData={statsData}
                  isLoading={statsLoading}
                  filters={statsFilters}
                  onFilterChange={handleStatsFilterChange}
                />
              </TabsContent>

              {/* Search Tab */}
              <TabsContent value="search" className="space-y-6">
                <SearchTab 
                  activityLogsData={activityLogsData}
                  isLoading={activityLoading}
                  error={activityError}
                  getLevelBadge={getLevelBadge}
                  formatDate={formatDate}
                  formatUserDisplay={formatUserDisplay}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </PermissionGuard>
  )
}

export default SystemLogsPage

// System Logs Tab Component
const SystemLogsTab = ({ 
  logs, 
  totalLogs, 
  currentPage, 
  totalPages, 
  filters, 
  isLoading, 
  error, 
  onFilterChange, 
  onPageChange, 
  getLevelBadge, 
  formatDate,
  formatUserDisplay
}: {
  logs: SystemLog[]
  totalLogs: number
  currentPage: number
  totalPages: number
  filters: any
  isLoading: boolean
  error: any
  onFilterChange: (key: string, value: string) => void
  onPageChange: (page: number) => void
  getLevelBadge: (status: string) => React.JSX.Element
  formatDate: (dateString: string) => string
  formatUserDisplay: (log: SystemLog) => { name: string; details: string | null }
}) => {
  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              System activity records
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(log => log.status?.toUpperCase() === 'FAILED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Failed operations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Logs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {logs.filter(log => log.status?.toUpperCase() === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Pending operations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Logs</CardTitle>
            <Info className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {logs.filter(log => log.status?.toUpperCase() === 'SUCCESS').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status || 'all'} onValueChange={(value) => onFilterChange('status', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Input
                placeholder="Filter by category..."
                value={filters.category}
                onChange={(e) => onFilterChange('category', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange('startDate', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Activity Logs</CardTitle>
              <CardDescription>
                Showing {logs.length} logs (Page {currentPage} of {totalPages})
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading system logs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Failed to load system logs</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No system logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: SystemLog) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{formatDate(log.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getLevelBadge(log.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.category || 'System'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate" title={log.description}>
                          {log.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {formatUserDisplay(log).name}
                          </span>
                          {formatUserDisplay(log).details && (
                            <span className="text-xs text-gray-500">
                              {formatUserDisplay(log).details}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 font-mono">
                          {log.ipAddress || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * (filters.limit || 15)) + 1} to {Math.min(currentPage * (filters.limit || 15), totalLogs)} of {totalLogs} logs
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                if (totalPages <= 5) {
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                }
                // Show first page, current page, and last page with ellipsis
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                }
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="px-2">...</span>;
                }
                return null;
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

// Statistics Tab Component
const StatsTab = ({ 
  statsData, 
  isLoading, 
  filters, 
  onFilterChange 
}: {
  statsData: any
  isLoading: boolean
  filters: any
  onFilterChange: (key: string, value: string) => void
}) => {
  const stats = statsData?.data || statsData

  return (
    <>
      {/* Stats Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Date Range Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange('startDate', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActions?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">
                All system activities
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.successRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Successful operations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Actions</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.failedCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Failed operations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending operations
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Activity by Category
              </CardTitle>
              <CardDescription>
                Distribution of activities across different categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.categoryStats && stats.categoryStats.length > 0 ? (
                <div className="space-y-4">
                  {stats.categoryStats.map((category: any, index: number) => {
                    const percentage = ((category.count / stats.totalActions) * 100).toFixed(1)
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500']
                    const color = colors[index % colors.length]
                    
                    return (
                      <div key={category.category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{category.category}</span>
                          <span className="text-muted-foreground">{category.count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No category data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Actions Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Top Actions
              </CardTitle>
              <CardDescription>
                Most frequently performed actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topActions && stats.topActions.length > 0 ? (
                <div className="space-y-4">
                  {stats.topActions.map((action: any, index: number) => {
                    const percentage = ((action.count / stats.totalActions) * 100).toFixed(1)
                    const colors = ['bg-indigo-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-purple-500', 'bg-red-500', 'bg-green-500']
                    const color = colors[index % colors.length]
                    
                    return (
                      <div key={action.action} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate mr-2">{action.action}</span>
                          <span className="text-muted-foreground flex-shrink-0">{action.count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No action data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Stats Table */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Detailed Statistics
            </CardTitle>
            <CardDescription>
              Complete breakdown of activity statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading statistics...</p>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category Stats Table */}
                <div>
                  <h4 className="font-semibold mb-4">Category Breakdown</h4>
                  <div className="space-y-3">
                    {stats.categoryStats?.map((category: any) => (
                      <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{category.category}</span>
                        <Badge variant="secondary">{category.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Actions Table */}
                <div>
                  <h4 className="font-semibold mb-4">Top Actions</h4>
                  <div className="space-y-3">
                    {stats.topActions?.map((action: any) => (
                      <div key={action.action} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-sm truncate">{action.action}</span>
                        <Badge variant="outline">{action.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No statistics data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  )
}

// Search Tab Component
const SearchTab = ({ 
  activityLogsData, 
  isLoading, 
  error, 
  getLevelBadge, 
  formatDate,
  formatUserDisplay
}: {
  activityLogsData: any
  isLoading: boolean
  error: any
  getLevelBadge: (status: string) => React.JSX.Element
  formatDate: (dateString: string) => string
  formatUserDisplay: (log: SystemLog) => { name: string; details: string | null }
}) => {
  const logs: SystemLog[] = (activityLogsData?.data?.logs || activityLogsData?.logs) || []
  const totalLogs = (activityLogsData?.data?.total || activityLogsData?.total) || 0

  return (
    <>
      {/* Advanced Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Search Filters
          </CardTitle>
          <CardDescription>
            Filter functionality temporarily disabled - showing all activity logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Info className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Filters are temporarily disabled while backend validation is being resolved</p>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Showing {logs.length} of {totalLogs} logs
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading activity logs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Failed to load activity logs</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No activity logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: SystemLog) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{formatDate(log.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getLevelBadge(log.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.category || 'System'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {log.action || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate" title={log.description}>
                          {log.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {formatUserDisplay(log).name}
                          </span>
                          {formatUserDisplay(log).details && (
                            <span className="text-xs text-gray-500">
                              {formatUserDisplay(log).details}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 font-mono">
                          {log.ipAddress || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simple message */}
      <div className="text-center py-4">
        <p className="text-sm text-gray-600">Showing all activity logs (pagination disabled)</p>
      </div>
    </>
  )
} 