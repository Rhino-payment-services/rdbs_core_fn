"use client"

import React, { useState, useEffect } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Shield,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building2,
  CreditCard,
  Users,
  Activity,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Upload,
  Key,
  Lock,
  Bell,
  Settings,
  Database,
  Server,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Wifi,
  WifiOff,
  Zap,
  Target,
  Fingerprint,
  ShieldCheck,
  AlertOctagon,
  CheckSquare,
  Clock3,
  Flag,
  Globe2,
  UserCheck,
  UserX,
  Heart,
  AlertTriangle
} from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { PERMISSIONS } from '@/lib/hooks/usePermissions'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

interface ApiLog {
  id: string
  timestamp: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint: string
  statusCode: number
  responseTime: number
  userId?: string
  userEmail?: string
  ipAddress: string
  userAgent: string
  requestBody?: any
  responseBody?: any
  errorMessage?: string
  apiKey?: string
  version: string
  environment: 'development' | 'staging' | 'production'
  service: string
  tags: string[]
}

interface HealthStatus {
  status: string
  timestamp: string
  services: {
    database: boolean
    redis: boolean
    external_apis: boolean
  }
  uptime: number
  version: string
}

interface Partner {
  id: string
  name: string
  status: string
  type: string
  createdAt: string
  lastActive: string
}

interface Analytics {
  totalUsers: number
  totalTransactions: number
  totalRevenue: number
  activePartners: number
  systemHealth: number
}

const ApiLogsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [environmentFilter, setEnvironmentFilter] = useState('all')
  const [sortBy, setSortBy] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedLogs, setSelectedLogs] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [showLogDetails, setShowLogDetails] = useState(false)
  const [selectedLog, setSelectedLog] = useState<ApiLog | null>(null)
  const [activeTab, setActiveTab] = useState('logs')

  // Get permissions
  const { 
    canViewSystemLogs,
    userRole 
  } = usePermissions()

  // Debug logging
  console.log('API Logs Page - canViewSystemLogs:', canViewSystemLogs, 'userRole:', userRole)

  // API hooks - with error handling to prevent auth redirects
  const { data: healthData, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/api/v1/health').then(res => res.data),
    staleTime: 30 * 1000,
    retry: false,
    throwOnError: false,
  })

  const { data: partnersData, isLoading: partnersLoading, error: partnersError } = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.get('/api/v1/admin/partners').then(res => res.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  })

  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/api/v1/admin/analytics').then(res => res.data),
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  })

  // Mock data for API logs (replace with real API call)
  const apiLogs: ApiLog[] = [
    {
      id: '1',
      timestamp: '2024-01-20T10:30:00Z',
      method: 'POST',
      endpoint: '/api/auth/login',
      statusCode: 200,
      responseTime: 245,
      userId: 'user-1',
      userEmail: 'john.doe@example.com',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      requestBody: { email: 'john.doe@example.com', password: '***' },
      responseBody: { success: true, token: '***' },
      version: 'v1.2.3',
      environment: 'production',
      service: 'auth-service',
      tags: ['authentication', 'login']
    },
    // ... other mock logs
  ]

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
  }

  const handleMethodFilter = (value: string) => {
    setMethodFilter(value)
  }

  const handleServiceFilter = (value: string) => {
    setServiceFilter(value)
  }

  const handleEnvironmentFilter = (value: string) => {
    setEnvironmentFilter(value)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleSelectLog = (logId: string) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    )
  }

  const handleSelectAll = () => {
    if (selectedLogs.length === filteredApiLogs.length) {
      setSelectedLogs([])
    } else {
      setSelectedLogs(filteredApiLogs.map(l => l.id))
    }
  }

  const handleViewLog = (log: ApiLog) => {
    setSelectedLog(log)
    setShowLogDetails(true)
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('API logs refreshed')
    } catch (error) {
      toast.error('Failed to refresh logs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement actual export functionality
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('API logs exported successfully')
    } catch (error) {
      toast.error('Failed to export logs')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-100 text-green-800'
    if (statusCode >= 300 && statusCode < 400) return 'bg-blue-100 text-blue-800'
    if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-100 text-yellow-800'
    if (statusCode >= 500) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800'
      case 'POST': return 'bg-green-100 text-green-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      case 'PATCH': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'production': return 'bg-red-100 text-red-800'
      case 'staging': return 'bg-yellow-100 text-yellow-800'
      case 'development': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 200) return 'text-green-600'
    if (responseTime < 500) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredApiLogs = apiLogs.filter(log => {
    const matchesSearch = log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ipAddress.includes(searchTerm) ||
                         log.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'success' && log.statusCode >= 200 && log.statusCode < 300) ||
      (statusFilter === 'error' && log.statusCode >= 400) ||
      (statusFilter === 'redirect' && log.statusCode >= 300 && log.statusCode < 400)
    
    const matchesMethod = methodFilter === 'all' || log.method === methodFilter
    const matchesService = serviceFilter === 'all' || log.service === serviceFilter
    const matchesEnvironment = environmentFilter === 'all' || log.environment === environmentFilter
    
    return matchesSearch && matchesStatus && matchesMethod && matchesService && matchesEnvironment
  })

  const sortedApiLogs = [...filteredApiLogs].sort((a, b) => {
    const aValue = a[sortBy as keyof ApiLog]
    const bValue = b[sortBy as keyof ApiLog]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    return 0
  })

  const paginatedApiLogs = sortedApiLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(sortedApiLogs.length / itemsPerPage)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatResponseTime = (time: number) => {
    return `${time}ms`
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  // Check if user is authenticated first
  if (!canViewSystemLogs) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to view API logs.</p>
            <p className="text-sm text-gray-500 mt-2">Contact your administrator to request access.</p>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-xs text-gray-600">Debug Info:</p>
              <p className="text-xs text-gray-600">User Role: {userRole}</p>
              <p className="text-xs text-gray-600">Can View System Logs: {canViewSystemLogs ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6 lg:p-8 xl:p-10 2xl:p-12">
          <div className="max-w-none xl:max-w-[1600px] 2xl:max-w-[2200px] mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
              <p className="text-gray-600 mt-2">Monitor system health, API logs, and analytics</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="health" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Health
                </TabsTrigger>
                <TabsTrigger value="logs" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  API Logs
                </TabsTrigger>
                <TabsTrigger value="partners" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Partners
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* Health Tab */}
              <TabsContent value="health" className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">System Status</CardTitle>
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {healthLoading ? (
                          <div className="animate-pulse">Loading...</div>
                        ) : healthError ? (
                          <span className="text-red-600">Error</span>
                        ) : (
                          <span className={healthData?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}>
                            {healthData?.status || 'Unknown'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {healthData?.timestamp ? formatDate(healthData.timestamp) : 'Last check: Unknown'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {healthLoading ? (
                          <div className="animate-pulse">Loading...</div>
                        ) : healthError ? (
                          <span className="text-red-600">Error</span>
                        ) : (
                          formatUptime(healthData?.uptime || 0)
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        System uptime
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Database</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {healthLoading ? (
                          <div className="animate-pulse">Loading...</div>
                        ) : healthError ? (
                          <span className="text-red-600">Error</span>
                        ) : (
                          <span className={healthData?.services?.database ? 'text-green-600' : 'text-red-600'}>
                            {healthData?.services?.database ? 'Online' : 'Offline'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Database status
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Redis</CardTitle>
                      <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {healthLoading ? (
                          <div className="animate-pulse">Loading...</div>
                        ) : healthError ? (
                          <span className="text-red-600">Error</span>
                        ) : (
                          <span className={healthData?.services?.redis ? 'text-green-600' : 'text-red-600'}>
                            {healthData?.services?.redis ? 'Online' : 'Offline'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cache status
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {healthError && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Health Check Failed</h3>
                        <p className="text-gray-500">Unable to retrieve system health status.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* API Logs Tab */}
              <TabsContent value="logs" className="space-y-6 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{apiLogs.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Last 24 hours
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round((apiLogs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length / apiLogs.length) * 100)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {apiLogs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length} successful
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round((apiLogs.filter(l => l.statusCode >= 400).length / apiLogs.length) * 100)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {apiLogs.filter(l => l.statusCode >= 400).length} errors
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round(apiLogs.reduce((sum, log) => sum + log.responseTime, 0) / apiLogs.length)}ms
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Response time
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>API Request Logs</CardTitle>
                        <CardDescription>
                          Monitor API requests, responses, and performance metrics
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleExport}
                          disabled={isLoading}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleRefresh}
                          disabled={isLoading}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by endpoint, user, IP, or tags..."
                              value={searchTerm}
                              onChange={(e) => handleSearch(e.target.value)}
                              className="pl-8 w-64"
                            />
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                          >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                          </Button>
                        </div>
                      </div>

                      {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50">
                          <div>
                            <label className="text-sm font-medium">Status</label>
                            <Select value={statusFilter} onValueChange={handleStatusFilter}>
                              <SelectTrigger>
                                <SelectValue placeholder="All Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="success">Success (2xx)</SelectItem>
                                <SelectItem value="redirect">Redirect (3xx)</SelectItem>
                                <SelectItem value="error">Error (4xx/5xx)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Method</label>
                            <Select value={methodFilter} onValueChange={handleMethodFilter}>
                              <SelectTrigger>
                                <SelectValue placeholder="All Methods" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Methods</SelectItem>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                                <SelectItem value="PATCH">PATCH</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Service</label>
                            <Select value={serviceFilter} onValueChange={handleServiceFilter}>
                              <SelectTrigger>
                                <SelectValue placeholder="All Services" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Services</SelectItem>
                                <SelectItem value="auth-service">Auth Service</SelectItem>
                                <SelectItem value="user-service">User Service</SelectItem>
                                <SelectItem value="transaction-service">Transaction Service</SelectItem>
                                <SelectItem value="wallet-service">Wallet Service</SelectItem>
                                <SelectItem value="kyc-service">KYC Service</SelectItem>
                                <SelectItem value="notification-service">Notification Service</SelectItem>
                                <SelectItem value="report-service">Report Service</SelectItem>
                                <SelectItem value="health-service">Health Service</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Environment</label>
                            <Select value={environmentFilter} onValueChange={handleEnvironmentFilter}>
                              <SelectTrigger>
                                <SelectValue placeholder="All Environments" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Environments</SelectItem>
                                <SelectItem value="production">Production</SelectItem>
                                <SelectItem value="staging">Staging</SelectItem>
                                <SelectItem value="development">Development</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      <div className="border rounded-lg">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left">
                                  <input
                                    type="checkbox"
                                    checked={selectedLogs.length === filteredApiLogs.length}
                                    onChange={handleSelectAll}
                                    className="rounded"
                                  />
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  Timestamp
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  Method
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  Endpoint
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  Status
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  Response Time
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  User
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  IP Address
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  Service
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  Environment
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {paginatedApiLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedLogs.includes(log.id)}
                                      onChange={() => handleSelectLog(log.id)}
                                      className="rounded"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {formatDate(log.timestamp)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={getMethodColor(log.method)}>
                                      {log.method}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-mono text-sm text-gray-900">
                                      {log.endpoint}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {log.version}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={getStatusColor(log.statusCode)}>
                                      {log.statusCode}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`text-sm font-medium ${getResponseTimeColor(log.responseTime)}`}>
                                      {formatResponseTime(log.responseTime)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {log.userEmail ? (
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {log.userEmail}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {log.userId}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-500">Anonymous</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                                    {log.ipAddress}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline">
                                      {log.service}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={getEnvironmentColor(log.environment)}>
                                      {log.environment}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewLog(log)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Showing {paginatedApiLogs.length} of {sortedApiLogs.length} API logs
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Partners Tab */}
              <TabsContent value="partners" className="space-y-6 mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Partners</CardTitle>
                    <CardDescription>
                      Manage and monitor partner integrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {partnersLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading partners...</p>
                      </div>
                    ) : partnersError ? (
                      <div className="text-center py-8">
                        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Partners</h3>
                        <p className="text-gray-500">Unable to retrieve partner data.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {partnersData?.map((partner: Partner) => (
                          <div key={partner.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">{partner.name}</div>
                                <div className="text-sm text-gray-500">{partner.type}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={partner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {partner.status}
                              </Badge>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyticsLoading ? (
                          <div className="animate-pulse">Loading...</div>
                        ) : analyticsError ? (
                          <span className="text-red-600">Error</span>
                        ) : (
                          analyticsData?.totalUsers?.toLocaleString() || '0'
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Registered users
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyticsLoading ? (
                          <div className="animate-pulse">Loading...</div>
                        ) : analyticsError ? (
                          <span className="text-red-600">Error</span>
                        ) : (
                          analyticsData?.totalTransactions?.toLocaleString() || '0'
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        All time
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyticsLoading ? (
                          <div className="animate-pulse">Loading...</div>
                        ) : analyticsError ? (
                          <span className="text-red-600">Error</span>
                        ) : (
                          `UGX ${analyticsData?.totalRevenue?.toLocaleString() || '0'}`
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        All time
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyticsLoading ? (
                          <div className="animate-pulse">Loading...</div>
                        ) : analyticsError ? (
                          <span className="text-red-600">Error</span>
                        ) : (
                          analyticsData?.activePartners || '0'
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Currently active
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {analyticsError && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center">
                        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Failed</h3>
                        <p className="text-gray-500">Unable to retrieve analytics data.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
  )
}

export default ApiLogsPage
