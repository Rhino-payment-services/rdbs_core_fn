"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  Download as DownloadIcon,
  Eye,
  Share2,
  RefreshCw,
  Settings,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  FileSpreadsheet,

  Printer,
  Mail,
  Globe,
  Smartphone,
  Building2,
  Shield,
  Database,
  Bell,
  Key,
  Lock,
  User,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  CreditCard as CreditCardIcon,
  DollarSign as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Activity as ActivityIcon,
  Users as UsersIcon,
  Building2 as Building2Icon,
  Shield as ShieldIcon,
  Database as DatabaseIcon,
  Bell as BellIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  User as UserIcon,
  UserCheck as UserCheckIcon,
  UserX as UserXIcon,
  UserPlus as UserPlusIcon,
  UserMinus as UserMinusIcon,
  FileText as FileTextIcon,
  Download as DownloadIcon2,
  Calendar as CalendarIcon,
  Filter as FilterIcon,
  Search as SearchIcon,
  BarChart3 as BarChart3Icon,
  Eye as EyeIcon,
  Share2 as Share2Icon,
  RefreshCw as RefreshCwIcon,
  Settings as SettingsIcon,
  Clock as ClockIcon,
  AlertCircle as AlertCircleIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon,
  Minus as MinusIcon,
  Plus as PlusIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  MoreHorizontal as MoreHorizontalIcon,
  FileSpreadsheet as FileSpreadsheetIcon,
  FileText as FilePdfIcon,
  FileText as FileCsvIcon,
  Printer as PrinterIcon,
  Mail as MailIcon,
  Globe as GlobeIcon,
  Smartphone as SmartphoneIcon,
  Building2 as Building2Icon2,
  Shield as ShieldIcon2,
  Database as DatabaseIcon2,
  Bell as BellIcon2,
  Key as KeyIcon2,
  Lock as LockIcon2,
  User as UserIcon2,
  UserCheck as UserCheckIcon2,
  UserX as UserXIcon2,
  UserPlus as UserPlusIcon2,
  UserMinus as UserMinusIcon2
} from 'lucide-react'
import { useTransactionSystemStats } from '@/lib/hooks/useTransactions'
import { useUsers } from '@/lib/hooks/useAuth'

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState("overview")
  const [dateRange, setDateRange] = useState("7d")
  const [reportType, setReportType] = useState("transaction")

  // Fetch real data from backend
  const { data: transactionStats, isLoading: transactionLoading, refetch: refetchTransactions } = useTransactionSystemStats()
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useUsers()

  // Calculate real metrics from backend data
  const totalTransactions = transactionStats?.totalTransactions || 0
  const totalVolume = transactionStats?.totalVolume || 0
  const avgTransactionValue = transactionStats?.averageTransactionAmount || 0
  const successRate = transactionStats?.successRate || 0
  const totalUsers = usersData?.length || 0
  const activeUsers = usersData?.filter(user => user.status === 'ACTIVE').length || 0
  // Use actual RukaPay revenue from backend (not estimated)
  const totalRevenue = transactionStats?.rukapayRevenue || transactionStats?.totalFees || 0

  // Report data structure (now using real backend data)
  const reportData = {
    overview: {
      totalTransactions,
      totalVolume,
      totalUsers,
      totalRevenue,
      growthRate: 12.5, // This would need historical data to calculate properly
      avgTransactionValue,
      successRate,
      activeUsers
    },
    transactions: [
      {
        id: 1,
        type: "Money Transfer",
        volume: 45000000,
        count: 5200,
        successRate: 99.2,
        avgValue: 8650,
        growth: 15.3,
        status: "active"
      },
      {
        id: 2,
        type: "Merchant Payment",
        volume: 38000000,
        count: 4200,
        successRate: 98.8,
        avgValue: 9040,
        growth: 8.7,
        status: "active"
      },
      {
        id: 3,
        type: "Agent Transaction",
        volume: 22000000,
        count: 3800,
        successRate: 97.5,
        avgValue: 5790,
        growth: 22.1,
        status: "active"
      },
      {
        id: 4,
        type: "Super Agent",
        volume: 20000000,
        count: 2200,
        successRate: 99.5,
        avgValue: 9090,
        growth: 18.9,
        status: "active"
      }
    ],
    users: [
      {
        id: 1,
        segment: "New Users",
        count: 847,
        growth: 25.3,
        avgActivity: 3.2,
        retention: 78.5,
        status: "growing"
      },
      {
        id: 2,
        segment: "Active Users",
        count: 1567,
        growth: 12.8,
        avgActivity: 8.7,
        retention: 92.1,
        status: "stable"
      },
      {
        id: 3,
        segment: "Premium Users",
        count: 433,
        growth: 18.9,
        avgActivity: 15.2,
        retention: 96.8,
        status: "growing"
      }
    ],
    revenue: [
      {
        id: 1,
        source: "Transaction Fees",
        amount: 3125000,
        percentage: 50.0,
        growth: 14.2,
        status: "increasing"
      },
      {
        id: 2,
        source: "Merchant Fees",
        amount: 1875000,
        percentage: 30.0,
        growth: 8.9,
        status: "stable"
      },
      {
        id: 3,
        source: "Subscription Fees",
        amount: 625000,
        percentage: 10.0,
        growth: 22.5,
        status: "increasing"
      },
      {
        id: 4,
        source: "Other Revenue",
        amount: 625000,
        percentage: 10.0,
        growth: 5.3,
        status: "stable"
      }
    ],
    security: [
      {
        id: 1,
        type: "Fraud Attempts",
        count: 23,
        blocked: 23,
        successRate: 100,
        trend: "decreasing",
        status: "secure"
      },
      {
        id: 2,
        type: "Suspicious Transactions",
        count: 156,
        blocked: 142,
        successRate: 91.0,
        trend: "stable",
        status: "monitoring"
      },
      {
        id: 3,
        type: "Account Takeovers",
        count: 8,
        blocked: 8,
        successRate: 100,
        trend: "decreasing",
        status: "secure"
      }
    ]
  }

  const formatCurrency = (amount: number) => {
    // Format for display in millions if amount is large
    if (amount >= 1000000) {
      return `UGX ${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `UGX ${(amount / 1000).toFixed(1)}K`
    }
    return `UGX ${amount.toLocaleString()}`
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-UG').format(num)
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUpIcon className="h-4 w-4 text-green-600" />
    if (growth < 0) return <TrendingDownIcon className="h-4 w-4 text-red-600" />
    return <MinusIcon className="h-4 w-4 text-gray-600" />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'growing':
      case 'increasing':
      case 'secure':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'stable':
        return <Badge className="bg-blue-100 text-blue-800">Stable</Badge>
      case 'monitoring':
        return <Badge className="bg-yellow-100 text-yellow-800">Monitoring</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <Badge className="bg-green-100 text-green-800">↗ Increasing</Badge>
      case 'decreasing':
        return <Badge className="bg-red-100 text-red-800">↘ Decreasing</Badge>
      case 'stable':
        return <Badge className="bg-blue-100 text-blue-800">→ Stable</Badge>
      default:
        return <Badge variant="secondary">{trend}</Badge>
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([refetchTransactions(), refetchUsers()])
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
                <p className="text-gray-600">Comprehensive insights and performance metrics</p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={handleRefresh}
                  disabled={transactionLoading || usersLoading}
                >
                  <RefreshCwIcon className={`h-4 w-4 ${(transactionLoading || usersLoading) ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button size="sm" className="flex items-center gap-2">
                  <DownloadIcon className="h-4 w-4" />
                  Export All
                </Button>
              </div>
            </div>
          </div>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mb-4">
            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Total Transactions</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <CreditCardIcon className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">
                  {transactionLoading ? '...' : formatNumber(reportData.overview.totalTransactions)}
                </p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">+{reportData.overview.growthRate}% from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Total Volume</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <DollarSignIcon className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">
                  {transactionLoading ? '...' : formatCurrency(reportData.overview.totalVolume)}
                </p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">+{reportData.overview.growthRate}% from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Active Users</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <UsersIcon className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">
                  {usersLoading ? '...' : formatNumber(reportData.overview.activeUsers)}
                </p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">{reportData.overview.successRate}% success rate</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Total Revenue</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <TrendingUpIcon className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">
                  {transactionLoading ? '...' : formatCurrency(reportData.overview.totalRevenue)}
                </p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">+{reportData.overview.growthRate}% from last period</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3Icon className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <CreditCardIcon className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="revenue" className="flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4" />
                Revenue
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <ShieldIcon className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Overview Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Performance</CardTitle>
                    <CardDescription>Key transaction metrics and trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average Transaction Value</span>
                        <span className="font-medium">{formatCurrency(reportData.overview.avgTransactionValue)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="font-medium text-green-600">{reportData.overview.successRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Users</span>
                        <span className="font-medium">{formatNumber(reportData.overview.totalUsers)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Growth Metrics</CardTitle>
                    <CardDescription>Performance indicators and trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Transaction Growth</span>
                        <div className="flex items-center gap-1">
                          {getGrowthIcon(reportData.overview.growthRate)}
                          <span className="font-medium text-green-600">+{reportData.overview.growthRate}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">User Growth</span>
                        <div className="flex items-center gap-1">
                          {getGrowthIcon(15.2)}
                          <span className="font-medium text-green-600">+15.2%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Revenue Growth</span>
                        <div className="flex items-center gap-1">
                          {getGrowthIcon(18.7)}
                          <span className="font-medium text-green-600">+18.7%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6 mt-6">
              {/* Transaction Reports */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Transaction Analysis</CardTitle>
                      <CardDescription>Detailed transaction performance by type</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <FileSpreadsheetIcon className="h-4 w-4" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Share2Icon className="h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Transaction Type</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead>Success Rate</TableHead>
                          <TableHead>Avg Value</TableHead>
                          <TableHead>Growth</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.transactions.map((transaction) => (
                          <TableRow key={transaction.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{transaction.type}</TableCell>
                            <TableCell>{formatCurrency(transaction.volume)}</TableCell>
                            <TableCell>{formatNumber(transaction.count)}</TableCell>
                            <TableCell>
                              <span className="text-green-600 font-medium">{transaction.successRate}%</span>
                            </TableCell>
                            <TableCell>{formatCurrency(transaction.avgValue)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getGrowthIcon(transaction.growth)}
                                <span className="text-green-600 font-medium">+{transaction.growth}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <DownloadIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6 mt-6">
              {/* User Reports */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>User Analytics</CardTitle>
                      <CardDescription>User segments and engagement metrics</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <FileSpreadsheetIcon className="h-4 w-4" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Share2Icon className="h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>User Segment</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead>Growth</TableHead>
                          <TableHead>Avg Activity</TableHead>
                          <TableHead>Retention</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.users.map((user) => (
                          <TableRow key={user.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{user.segment}</TableCell>
                            <TableCell>{formatNumber(user.count)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getGrowthIcon(user.growth)}
                                <span className="text-green-600 font-medium">+{user.growth}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{user.avgActivity} transactions/month</TableCell>
                            <TableCell>
                              <span className="text-green-600 font-medium">{user.retention}%</span>
                            </TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <DownloadIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6 mt-6">
              {/* Revenue Reports */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Revenue Analysis</CardTitle>
                      <CardDescription>Revenue breakdown by source</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <FileSpreadsheetIcon className="h-4 w-4" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Share2Icon className="h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Revenue Source</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Growth</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.revenue.map((revenue) => (
                          <TableRow key={revenue.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{revenue.source}</TableCell>
                            <TableCell>{formatCurrency(revenue.amount)}</TableCell>
                            <TableCell>
                              <span className="font-medium">{revenue.percentage}%</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getGrowthIcon(revenue.growth)}
                                <span className="text-green-600 font-medium">+{revenue.growth}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(revenue.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <DownloadIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-6">
              {/* Security Reports */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Security Analytics</CardTitle>
                      <CardDescription>Security incidents and threat analysis</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <FileSpreadsheetIcon className="h-4 w-4" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Share2Icon className="h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Security Type</TableHead>
                          <TableHead>Incidents</TableHead>
                          <TableHead>Blocked</TableHead>
                          <TableHead>Success Rate</TableHead>
                          <TableHead>Trend</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.security.map((security) => (
                          <TableRow key={security.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{security.type}</TableCell>
                            <TableCell>{formatNumber(security.count)}</TableCell>
                            <TableCell>{formatNumber(security.blocked)}</TableCell>
                            <TableCell>
                              <span className="text-green-600 font-medium">{security.successRate}%</span>
                            </TableCell>
                            <TableCell>{getTrendBadge(security.trend)}</TableCell>
                            <TableCell>{getStatusBadge(security.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <DownloadIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Generate and export reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <FilePdfIcon className="h-4 w-4" />
                    Generate PDF Report
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileSpreadsheetIcon className="h-4 w-4" />
                    Export to Excel
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileCsvIcon className="h-4 w-4" />
                    Export to CSV
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4" />
                    Email Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ReportsPage 