"use client"
import React, { useState } from 'react'
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
  Filter, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  User,
  Shield,
  Database,
  CreditCard,
  Settings,
  Activity,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Smartphone,
  Globe,
  Server,
  Lock,
  Unlock,
  UserPlus,
  UserMinus,
  FileText,
  BarChart3,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  AlertOctagon,
  CheckSquare,
  XCircle,
  Clock as ClockIcon,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Users,
  Building2
} from 'lucide-react'

const ActivityLogPage = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLevel, setSelectedLevel] = useState("all")
  const [selectedModule, setSelectedModule] = useState("all")
  const [timeRange, setTimeRange] = useState("24h")
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState("customer")

  // Customer activity data (external users)
  const customerActivityLogs = [
    {
      id: 1,
      timestamp: "2024-01-15 14:30:25",
      level: "info",
      module: "authentication",
      user: "john.doe@rukapay.com",
      action: "User login successful",
      description: "User logged in from IP 192.168.1.100 using Chrome browser",
      ip: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      location: "Kampala, Uganda",
      sessionId: "sess_abc123def456",
      metadata: {
        browser: "Chrome",
        os: "Windows 10",
        device: "Desktop"
      }
    },
    {
      id: 2,
      timestamp: "2024-01-15 14:20:33",
      level: "info",
      module: "security",
      user: "security_monitor",
      action: "Failed login attempt",
      description: "Multiple failed login attempts detected from IP 203.0.113.45",
      ip: "203.0.113.45",
      userAgent: "Unknown",
      location: "Unknown",
      sessionId: "failed_login_001",
      metadata: {
        attempts: 5,
        timeWindow: "10 minutes",
        action: "IP blocked for 30 minutes"
      }
    },
    {
      id: 3,
      timestamp: "2024-01-15 14:18:55",
      level: "success",
      module: "transactions",
      user: "mike.wilson@rukapay.com",
      action: "Large transaction processed",
      description: "Transaction of UGX 5,000,000 processed successfully",
      ip: "192.168.1.75",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      location: "Jinja, Uganda",
      sessionId: "sess_mike456",
      metadata: {
        amount: "UGX 5,000,000",
        recipient: "john.smith@email.com",
        fee: "UGX 25,000"
      }
    },
    {
      id: 4,
      timestamp: "2024-01-15 14:15:42",
      level: "error",
      module: "payment_processing",
      user: "customer_123@email.com",
      action: "Payment failed",
      description: "Payment of UGX 150,000 failed due to insufficient funds",
      ip: "192.168.1.200",
      userAgent: "Mozilla/5.0 (Android; Mobile; rv:68.0)",
      location: "Mbarara, Uganda",
      sessionId: "sess_customer_123",
      metadata: {
        amount: "UGX 150,000",
        reason: "Insufficient funds",
        retryCount: 2
      }
    },
    {
      id: 5,
      timestamp: "2024-01-15 14:12:18",
      level: "success",
      module: "transactions",
      user: "sarah.johnson@email.com",
      action: "Money transfer completed",
      description: "Transfer of UGX 250,000 to family member completed",
      ip: "192.168.1.150",
      userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)",
      location: "Gulu, Uganda",
      sessionId: "sess_sarah_789",
      metadata: {
        amount: "UGX 250,000",
        recipient: "family.member@email.com",
        transferType: "Family Transfer"
      }
    },
    {
      id: 6,
      timestamp: "2024-01-15 14:10:25",
      level: "info",
      module: "authentication",
      user: "merchant_shop@business.com",
      action: "Merchant login",
      description: "Merchant logged in to process payments",
      ip: "192.168.1.300",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      location: "Kampala, Uganda",
      sessionId: "sess_merchant_001",
      metadata: {
        merchantId: "MERCH_12345",
        businessType: "Retail",
        loginType: "Merchant Portal"
      }
    }
  ]

  // Internal activity data (dashboard/system operations)
  const internalActivityLogs = [
    {
      id: 101,
      timestamp: "2024-01-15 14:28:15",
      level: "warning",
      module: "transactions",
      user: "system",
      action: "High transaction volume detected",
      description: "Transaction volume exceeded normal threshold for the last 5 minutes",
      ip: "system",
      userAgent: "System Monitor",
      location: "System",
      sessionId: "system_monitor",
      metadata: {
        threshold: "1000 transactions/min",
        current: "1247 transactions/min",
        duration: "5 minutes"
      }
    },
    {
      id: 102,
      timestamp: "2024-01-15 14:25:42",
      level: "error",
      module: "payment_processing",
      user: "payment_gateway",
      action: "Payment gateway timeout",
      description: "Payment gateway response timeout after 30 seconds",
      ip: "10.0.0.50",
      userAgent: "Payment Gateway Service",
      location: "Data Center",
      sessionId: "pg_service_001",
      metadata: {
        timeout: "30 seconds",
        retryCount: 3,
        gateway: "Visa/Mastercard"
      }
    },
    {
      id: 103,
      timestamp: "2024-01-15 14:22:18",
      level: "success",
      module: "user_management",
      user: "admin@rukapay.com",
      action: "New user created",
      description: "User account created for sarah.johnson@rukapay.com",
      ip: "192.168.1.50",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      location: "Kampala, Uganda",
      sessionId: "sess_admin789",
      metadata: {
        newUser: "sarah.johnson@rukapay.com",
        role: "Analyst",
        department: "Analytics"
      }
    },
    {
      id: 104,
      timestamp: "2024-01-15 14:20:15",
      level: "success",
      module: "user_management",
      user: "manager@rukapay.com",
      action: "User permissions updated",
      description: "Updated permissions for mike.wilson@rukapay.com",
      ip: "192.168.1.60",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      location: "Kampala, Uganda",
      sessionId: "sess_manager_001",
      metadata: {
        targetUser: "mike.wilson@rukapay.com",
        oldRole: "Support",
        newRole: "Manager",
        permissions: ["dashboard", "transactions", "users", "reports"]
      }
    },
    {
      id: 105,
      timestamp: "2024-01-15 14:18:30",
      level: "success",
      module: "reports",
      user: "analyst@rukapay.com",
      action: "Report exported",
      description: "Monthly transaction report exported to PDF",
      ip: "192.168.1.70",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      location: "Kampala, Uganda",
      sessionId: "sess_analyst_001",
      metadata: {
        reportType: "Monthly Transaction Report",
        format: "PDF",
        records: "15,432",
        fileSize: "2.5 MB"
      }
    },
    {
      id: 106,
      timestamp: "2024-01-15 14:15:20",
      level: "info",
      module: "database",
      user: "db_service",
      action: "Database backup completed",
      description: "Daily database backup completed successfully",
      ip: "10.0.0.10",
      userAgent: "Database Service",
      location: "Data Center",
      sessionId: "db_backup_001",
      metadata: {
        size: "2.5 GB",
        duration: "15 minutes",
        type: "Full backup"
      }
    },
    {
      id: 107,
      timestamp: "2024-01-15 14:12:08",
      level: "warning",
      module: "system",
      user: "system_monitor",
      action: "High CPU usage detected",
      description: "CPU usage reached 85% on server db-01",
      ip: "10.0.0.20",
      userAgent: "System Monitor",
      location: "Data Center",
      sessionId: "sys_monitor_001",
      metadata: {
        cpuUsage: "85%",
        server: "db-01",
        threshold: "80%"
      }
    },
    {
      id: 108,
      timestamp: "2024-01-15 14:10:45",
      level: "error",
      module: "transactions",
      user: "transaction_service",
      action: "Transaction processing failed",
      description: "Failed to process transaction due to insufficient funds",
      ip: "10.0.0.30",
      userAgent: "Transaction Service",
      location: "Data Center",
      sessionId: "txn_service_001",
      metadata: {
        transactionId: "TXN_123456789",
        amount: "UGX 150,000",
        reason: "Insufficient funds"
      }
    },
    {
      id: 109,
      timestamp: "2024-01-15 14:08:22",
      level: "success",
      module: "security",
      user: "admin@rukapay.com",
      action: "Security policy updated",
      description: "Password policy updated to require 12 characters minimum",
      ip: "192.168.1.50",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      location: "Kampala, Uganda",
      sessionId: "sess_admin789",
      metadata: {
        policy: "Password Policy",
        oldValue: "8 characters",
        newValue: "12 characters"
      }
    },
    {
      id: 110,
      timestamp: "2024-01-15 14:05:15",
      level: "info",
      module: "analytics",
      user: "analytics_service",
      action: "Daily report generated",
      description: "Daily transaction analytics report generated successfully",
      ip: "10.0.0.40",
      userAgent: "Analytics Service",
      location: "Data Center",
      sessionId: "analytics_service_001",
      metadata: {
        reportType: "Daily Analytics",
        records: "15,432",
        duration: "2 minutes"
      }
    },
    {
      id: 111,
      timestamp: "2024-01-15 14:02:33",
      level: "warning",
      module: "user_management",
      user: "system",
      action: "User account locked",
      description: "User account locked due to multiple failed login attempts",
      ip: "192.168.1.100",
      userAgent: "Security System",
      location: "Kampala, Uganda",
      sessionId: "security_system_001",
      metadata: {
        user: "jane.smith@rukapay.com",
        failedAttempts: 10,
        lockDuration: "30 minutes"
      }
    },
    {
      id: 112,
      timestamp: "2024-01-15 14:00:15",
      level: "success",
      module: "settings",
      user: "admin@rukapay.com",
      action: "System configuration updated",
      description: "Updated system configuration for transaction limits",
      ip: "192.168.1.50",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      location: "Kampala, Uganda",
      sessionId: "sess_admin789",
      metadata: {
        configType: "Transaction Limits",
        oldLimit: "UGX 1,000,000",
        newLimit: "UGX 2,000,000"
      }
    }
  ]

  const getLevelBadge = (level: string) => {
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
        return <Badge variant="secondary">{level}</Badge>
    }
  }

  const getLevelIcon = (level: string) => {
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

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'authentication':
        return <Shield className="h-4 w-4" />
      case 'transactions':
        return <CreditCard className="h-4 w-4" />
      case 'payment_processing':
        return <DollarSign className="h-4 w-4" />
      case 'user_management':
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

  const toggleRowExpansion = (id: number) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id)
    } else {
      newExpandedRows.add(id)
    }
    setExpandedRows(newExpandedRows)
  }

  const getCurrentLogs = () => {
    const logs = activeTab === "customer" ? customerActivityLogs : internalActivityLogs
    return logs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.user.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLevel = selectedLevel === "all" || log.level === selectedLevel
      const matchesModule = selectedModule === "all" || log.module === selectedModule
      
      return matchesSearch && matchesLevel && matchesModule
    })
  }

  const getCurrentStats = () => {
    const logs = activeTab === "customer" ? customerActivityLogs : internalActivityLogs
    return {
      total: logs.length,
      errors: logs.filter(log => log.level === 'error').length,
      warnings: logs.filter(log => log.level === 'warning').length,
      success: logs.filter(log => log.level === 'success').length,
      info: logs.filter(log => log.level === 'info').length
    }
  }

  const currentStats = getCurrentStats()
  const filteredLogs = getCurrentLogs()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6 lg:p-8 xl:p-10 2xl:p-12">
        <div className="max-w-none xl:max-w-[1600px] 2xl:max-w-[2200px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Log</h1>
                <p className="text-gray-600">Monitor system activities, user actions, and security events</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Activity Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
            <TabsList className="grid w-full grid-cols-2">
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
                <div className="text-2xl font-bold">{currentStats.total}</div>
                <div className="text-xs text-muted-foreground">
                  Last 24 hours
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{currentStats.errors}</div>
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
                <div className="text-2xl font-bold text-yellow-600">{currentStats.warnings}</div>
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
                <div className="text-2xl font-bold text-green-600">{currentStats.success}</div>
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
                <div className="text-2xl font-bold text-blue-600">{currentStats.info}</div>
                <div className="text-xs text-muted-foreground">
                  Informational events
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="customer" className="space-y-6">
              {/* Customer Activity Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Activity</CardTitle>
                  <CardDescription>
                    External user activities and transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filters and Search */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search customer activities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedModule} onValueChange={setSelectedModule}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Module" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        <SelectItem value="authentication">Authentication</SelectItem>
                        <SelectItem value="transactions">Transactions</SelectItem>
                        <SelectItem value="payment_processing">Payment Processing</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
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

                  {/* Customer Activity Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-12"></TableHead>
                          <TableHead className="w-20">Level</TableHead>
                          <TableHead className="w-32">Time</TableHead>
                          <TableHead className="w-40">Module</TableHead>
                          <TableHead className="w-48">Customer</TableHead>
                          <TableHead className="w-48">Action</TableHead>
                          <TableHead className="w-64">Description</TableHead>
                          <TableHead className="w-32">IP Address</TableHead>
                          <TableHead className="w-40">Location</TableHead>
                          <TableHead className="w-32">Session ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((log) => (
                          <React.Fragment key={log.id}>
                            <TableRow className="hover:bg-gray-50">
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRowExpansion(log.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  {expandedRows.has(log.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getLevelIcon(log.level)}
                                  {getLevelBadge(log.level)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{formatTimestamp(log.timestamp)}</div>
                                  <div className="text-xs text-gray-500">{getRelativeTime(log.timestamp)}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getModuleIcon(log.module)}
                                  <span className="text-sm capitalize">{log.module.replace('_', ' ')}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium truncate max-w-32">{log.user}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">{log.action}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600 max-w-56 truncate" title={log.description}>
                                  {log.description}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600">{log.ip}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600">{log.location}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600 font-mono text-xs">{log.sessionId}</div>
                              </TableCell>
                            </TableRow>
                            {expandedRows.has(log.id) && (
                              <TableRow>
                                <TableCell colSpan={10} className="bg-gray-50 p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="font-medium text-gray-700 mb-3">Technical Details</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">User Agent:</span>
                                          <span className="font-mono text-xs">{log.userAgent}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Session ID:</span>
                                          <span className="font-mono text-xs">{log.sessionId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">IP Address:</span>
                                          <span className="font-mono text-xs">{log.ip}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Location:</span>
                                          <span className="text-xs">{log.location}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-700 mb-3">Metadata</h4>
                                      <div className="space-y-2 text-sm">
                                        {log.metadata && Object.entries(log.metadata).map(([key, value]) => (
                                          <div key={key} className="flex justify-between">
                                            <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                            <span className="text-xs">{String(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="internal" className="space-y-6">
              {/* Internal Activity Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Internal Activity</CardTitle>
                  <CardDescription>
                    Dashboard operations and system management activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filters and Search */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search internal activities..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedModule} onValueChange={setSelectedModule}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Module" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        <SelectItem value="user_management">User Management</SelectItem>
                        <SelectItem value="transactions">Transactions</SelectItem>
                        <SelectItem value="payment_processing">Payment Processing</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="reports">Reports</SelectItem>
                        <SelectItem value="settings">Settings</SelectItem>
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

                  {/* Internal Activity Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-12"></TableHead>
                          <TableHead className="w-20">Level</TableHead>
                          <TableHead className="w-32">Time</TableHead>
                          <TableHead className="w-40">Module</TableHead>
                          <TableHead className="w-48">Staff Member</TableHead>
                          <TableHead className="w-48">Action</TableHead>
                          <TableHead className="w-64">Description</TableHead>
                          <TableHead className="w-32">IP Address</TableHead>
                          <TableHead className="w-40">Location</TableHead>
                          <TableHead className="w-32">Session ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.map((log) => (
                          <React.Fragment key={log.id}>
                            <TableRow className="hover:bg-gray-50">
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRowExpansion(log.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  {expandedRows.has(log.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getLevelIcon(log.level)}
                                  {getLevelBadge(log.level)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{formatTimestamp(log.timestamp)}</div>
                                  <div className="text-xs text-gray-500">{getRelativeTime(log.timestamp)}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getModuleIcon(log.module)}
                                  <span className="text-sm capitalize">{log.module.replace('_', ' ')}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium truncate max-w-32">{log.user}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium">{log.action}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600 max-w-56 truncate" title={log.description}>
                                  {log.description}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600">{log.ip}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600">{log.location}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-gray-600 font-mono text-xs">{log.sessionId}</div>
                              </TableCell>
                            </TableRow>
                            {expandedRows.has(log.id) && (
                              <TableRow>
                                <TableCell colSpan={10} className="bg-gray-50 p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                      <h4 className="font-medium text-gray-700 mb-3">Technical Details</h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">User Agent:</span>
                                          <span className="font-mono text-xs">{log.userAgent}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Session ID:</span>
                                          <span className="font-mono text-xs">{log.sessionId}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">IP Address:</span>
                                          <span className="font-mono text-xs">{log.ip}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">Location:</span>
                                          <span className="text-xs">{log.location}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-700 mb-3">Metadata</h4>
                                      <div className="space-y-2 text-sm">
                                        {log.metadata && Object.entries(log.metadata).map(([key, value]) => (
                                          <div key={key} className="flex justify-between">
                                            <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                            <span className="text-xs">{String(value)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
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

export default ActivityLogPage 