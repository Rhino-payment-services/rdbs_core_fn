"use client"
import React, { useState, useEffect, useRef } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  DollarSign, 
  ShoppingCart, 
  Building2,
  Activity,
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Shield, 
  Lock, 
  DollarSignIcon,
  ChevronUp,
  UserIcon,
  Building,
  Key,
  ChevronDown,
  BarChart3,
  PieChart,
  LineChart,
  Database,
  FileText,
  Settings as SettingsIcon
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Cell } from 'recharts'
import { useTransactionSystemStats } from '@/lib/hooks/useTransactions'
import { useUsers } from '@/lib/hooks/useAuth'
import { useMerchants } from '@/lib/hooks/useMerchants'
import { useKycStats } from '@/lib/hooks/useKyc'
import { useSystemStats } from '@/lib/hooks/useSystem'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'

const AnalyticsPage = () => {
  const { hasPermission } = usePermissions()
  const [activeTab, setActiveTab] = useState('overview')
  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Check if user has analytics viewing permission
  const canViewAnalytics = hasPermission(PERMISSIONS.ANALYTICS_VIEW)

  // API hooks for different analytics sections
  const { data: transactionStats, isLoading: transactionLoading, error: transactionError } = useTransactionSystemStats()
  const { data: usersData, isLoading: usersLoading, error: usersError } = useUsers()
  const { data: merchantsData, isLoading: merchantsLoading, error: merchantsError } = useMerchants()
  const { data: kycStats, isLoading: kycLoading, error: kycError } = useKycStats()
  const { data: systemStats, isLoading: systemLoading, error: systemError } = useSystemStats()

  // Scroll detection for showing scroll buttons
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
        setShowScrollButtons(scrollHeight > clientHeight)
      }
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll() // Initial check
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Scroll functions
  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ 
        top: scrollContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      })
    }
  }

  // If user doesn't have analytics permissions, show access denied message
  if (!canViewAnalytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 xl:p-10 2xl:p-12">
          <div className="max-w-none xl:max-w-[1600px] 2xl:max-w-[2200px] mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <Card className="w-full max-w-md text-center">
                <CardContent className="p-12">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-12 h-12 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
                  <p className="text-gray-600 mb-6">
                    You don't have permission to view analytics.
                  </p>
                  <p className="text-sm text-gray-500">
                    Please contact your administrator to request analytics access.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Chart data
  const transactionData = [
    { day: 'Mon', volume: 125000, transactions: 1247 },
    { day: 'Tue', volume: 185000, transactions: 1856 },
    { day: 'Wed', volume: 98000, transactions: 987 },
    { day: 'Thu', volume: 220000, transactions: 2201 },
    { day: 'Fri', volume: 175000, transactions: 1756 },
    { day: 'Sat', volume: 245000, transactions: 2454 },
    { day: 'Sun', volume: 165000, transactions: 1654 }
  ]

  const userGrowthData = [
    { month: 'Jan', users: 1200 },
    { month: 'Feb', users: 1450 },
    { month: 'Mar', users: 1680 },
    { month: 'Apr', users: 1920 },
    { month: 'May', users: 2150 },
    { month: 'Jun', users: 2380 }
  ]

  const transactionTypesData = [
    { name: 'P2P Transfers', value: 68, color: '#3B82F6' },
    { name: 'Merchant Payments', value: 24, color: '#10B981' },
    { name: 'Bill Payments', value: 8, color: '#8B5CF6' }
  ]

  const systemHealthData = [
    { metric: 'API Response Time', value: 98, status: 'good', trend: 'down' },
    { metric: 'Uptime', value: 99.9, status: 'excellent', trend: 'stable' },
    { metric: 'Active Sessions', value: 12.4, status: 'good', trend: 'up' },
    { metric: 'Failed Transactions', value: 0.2, status: 'good', trend: 'down' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 overflow-hidden relative">
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-auto p-6 lg:p-8 xl:p-10 2xl:p-12"
        >
        <div className="max-w-none xl:max-w-[1600px] 2xl:max-w-[2200px] mx-auto">
            {/* Analytics Header */}
          <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Analytics & Reports
              </h1>
              <p className="mt-2 text-gray-600">
                Detailed analytics and comprehensive reporting
              </p>
              </div>

            {/* Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-white">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="merchants" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Merchants
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  System
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mb-4">
                  <Card className="bg-white border-gray-200">
                    <CardContent className="px-4 py-1">
                      <div className="flex items-center justify-between mb-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600 mb-0">
                            Total Transactions
                          </p>
                          <p className="text-xl font-bold text-gray-900 leading-tight">
                            {transactionLoading ? '...' : (transactionStats?.totalTransactions || 0).toLocaleString()}
                          </p>
              </div>
                        <div className="w-8 h-8 flex items-center justify-center ml-2">
                          <CreditCard className="w-4 h-4 text-gray-600" />
                        </div>
          </div>
                      <div className="mt-0">
                        <span className="text-sm text-green-600 font-medium">
                          {transactionStats?.successRate?.toFixed(1) || 0}%
                        </span>
                        <span className="text-sm ml-1 text-gray-500">
                          success rate
                        </span>
                </div>
              </CardContent>
            </Card>

                  <Card className="bg-white border-gray-200">
                    <CardContent className="px-4 py-1">
                      <div className="flex items-center justify-between mb-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600 mb-0">
                            Total Volume
                          </p>
                          <p className="text-xl font-bold text-gray-900 leading-tight">
                            {transactionLoading ? '...' : `UGX ${((transactionStats?.totalVolume || 0) / 1000000).toFixed(1)}M`}
                          </p>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center ml-2">
                          <DollarSign className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="mt-0">
                        <span className="text-sm text-green-600 font-medium">
                          UGX {(transactionStats?.averageTransactionAmount || 0).toFixed(0)}
                        </span>
                        <span className="text-sm ml-1 text-gray-500">
                          avg transaction
                        </span>
                </div>
              </CardContent>
            </Card>

                  <Card className="bg-white border-gray-200">
                    <CardContent className="px-4 py-1">
                      <div className="flex items-center justify-between mb-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600 mb-0">
                            Active Users
                          </p>
                          <p className="text-xl font-bold text-gray-900 leading-tight">
                            {usersLoading ? '...' : (usersData?.data?.pagination?.total || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center ml-2">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="mt-0">
                        <span className="text-sm text-blue-600 font-medium">
                          {usersData?.data?.data?.filter((user: any) => user.status === 'ACTIVE').length || 0}
                        </span>
                        <span className="text-sm ml-1 text-gray-500">
                          online now
                        </span>
                </div>
              </CardContent>
            </Card>

                  <Card className="bg-white border-gray-200">
                    <CardContent className="px-4 py-1">
                      <div className="flex items-center justify-between mb-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600 mb-0">
                            Merchants
                          </p>
                          <p className="text-xl font-bold text-gray-900 leading-tight">
                            {merchantsLoading ? '...' : (merchantsData?.data?.pagination?.total || 0).toLocaleString()}
                          </p>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center ml-2">
                          <Building2 className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="mt-0">
                        <span className="text-sm text-purple-600 font-medium">
                          {merchantsData?.data?.data?.filter((merchant: any) => merchant.status === 'ACTIVE').length || 0}
                        </span>
                        <span className="text-sm ml-1 text-gray-500">
                          active
                        </span>
                </div>
              </CardContent>
            </Card>
          </div>

                {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Transaction Volume Chart */}
                  <Card className="bg-white border-gray-200">
                  <CardHeader>
                      <CardTitle className="text-gray-900">
                        Transaction Volume (Last 7 Days)
                      </CardTitle>
                      <CardDescription>
                        Daily transaction volume in UGX
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                          volume: {
                            label: "Volume",
                            color: "#3B82F6",
                          },
                        }}
                        className="h-64"
                      >
                        <BarChart data={transactionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                        <YAxis />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <ChartTooltipContent
                                  active={active}
                                  payload={payload}
                                    formatter={(value) => [`UGX ${(Number(value) / 1000).toFixed(0)}K`, 'Volume']}
                                />
                              )
                            }
                            return null
                          }}
                        />
                          <Bar dataKey="volume" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                  {/* User Growth Chart */}
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900">
                        User Growth Trend
                      </CardTitle>
                      <CardDescription>
                        Monthly user registration growth
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          users: {
                            label: "Users",
                            color: "#10B981",
                          },
                        }}
                        className="h-64"
                      >
                        <RechartsLineChart data={userGrowthData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip />
                          <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} />
                        </RechartsLineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Transaction Types Pie Chart */}
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      Transaction Types Distribution
                    </CardTitle>
                    <CardDescription>
                      Breakdown of transaction types by volume
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-64">
                    <ChartContainer
                      config={{
                          users: {
                            label: "Users",
                            color: "#10B981",
                          },
                      }}
                        className="h-64 w-64"
                    >
                        <RechartsPieChart>
                          <ChartTooltip />
                          <RechartsPieChart
                          data={transactionTypesData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {transactionTypesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                          </RechartsPieChart>
                        </RechartsPieChart>
                    </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-6">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      Transaction Analytics
                    </CardTitle>
                    <CardDescription>
                      Detailed transaction metrics and trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {transactionLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading transaction data...</span>
                      </div>
                    ) : transactionError ? (
                      <div className="flex items-center justify-center h-64">
                        <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                        <span className="text-red-600">Error loading transaction data</span>
                      </div>
                    ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">
                              {transactionStats?.totalTransactions || 0}
                            </p>
                            <p className="text-sm text-gray-600">Total Transactions</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">
                              UGX {((transactionStats?.totalVolume || 0) / 1000000).toFixed(1)}M
                            </p>
                            <p className="text-sm text-gray-600">Total Volume</p>
                            </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">
                              {transactionStats?.successRate?.toFixed(1) || 0}%
                            </p>
                            <p className="text-sm text-gray-600">Success Rate</p>
                          </div>
                        </div>
                    </div>
                    )}
                  </CardContent>
                </Card>
            </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      User Analytics
                    </CardTitle>
                    <CardDescription>
                      User registration and activity metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {usersLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading user data...</span>
                      </div>
                    ) : usersError ? (
                      <div className="flex items-center justify-center h-64">
                        <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                        <span className="text-red-600">Error loading user data</span>
                      </div>
                    ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">
                              {usersData?.data?.pagination?.total || 0}
                            </p>
                            <p className="text-sm text-gray-600">Total Users</p>
                        </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">
                              {usersData?.data?.data?.filter((user: any) => user.status === 'ACTIVE').length || 0}
                            </p>
                            <p className="text-sm text-gray-600">Active Users</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">
                              {usersData?.data?.data?.filter((user: any) => {
                                const createdAt = new Date(user.createdAt)
                                const now = new Date()
                                return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
                              }).length || 0}
                            </p>
                            <p className="text-sm text-gray-600">New This Month</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
            </TabsContent>

              {/* Merchants Tab */}
              <TabsContent value="merchants" className="space-y-6">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      Merchant Analytics
                    </CardTitle>
                    <CardDescription>
                      Merchant onboarding and performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {merchantsLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading merchant data...</span>
                      </div>
                    ) : merchantsError ? (
                      <div className="flex items-center justify-center h-64">
                        <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
                        <div className="text-center">
                          <span className="text-yellow-600">Merchant analytics not available</span>
                          <p className="text-sm text-gray-500 mt-1">This feature will be available soon</p>
                        </div>
                      </div>
                    ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">
                              {merchantsData?.data?.pagination?.total || 0}
                            </p>
                            <p className="text-sm text-gray-600">Total Merchants</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">
                              {merchantsData?.data?.data?.filter((merchant: any) => merchant.status === 'ACTIVE').length || 0}
                            </p>
                            <p className="text-sm text-gray-600">Active Merchants</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">
                              {merchantsData?.data?.data?.filter((merchant: any) => merchant.status === 'PENDING').length || 0}
                            </p>
                            <p className="text-sm text-gray-600">Pending Approval</p>
                          </div>
                        </div>
                    </div>
                    )}
                  </CardContent>
                </Card>
            </TabsContent>

              {/* System Tab */}
              <TabsContent value="system" className="space-y-6">
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      System Health
                    </CardTitle>
                    <CardDescription>
                      Real-time system performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {systemLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading system data...</span>
                      </div>
                    ) : systemError ? (
                      <div className="flex items-center justify-center h-64">
                        <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
                        <div className="text-center">
                          <span className="text-yellow-600">System analytics not available</span>
                          <p className="text-sm text-gray-500 mt-1">This feature will be available soon</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {systemHealthData.map((metric, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">{metric.metric}</span>
                            <div className="flex items-center space-x-2">
                              {metric.status === 'excellent' && <CheckCircle className="w-4 h-4 text-green-500" />}
                              {metric.status === 'good' && <Activity className="w-4 h-4 text-blue-500" />}
                              {metric.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-600" />}
                              {metric.trend === 'down' && <ArrowDownRight className="w-3 h-3 text-green-600" />}
                              <span className={`text-sm font-medium ${
                                metric.status === 'excellent' ? 'text-green-600' : 
                                metric.status === 'good' ? 'text-blue-600' : 'text-yellow-600'
                              }`}>
                                {metric.value}{metric.metric === 'Uptime' ? '%' : metric.metric === 'Active Sessions' ? 'K' : 'ms'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
          </div>
        </div>

        {/* Scroll Direction Buttons */}
        {showScrollButtons && (
          <div className="fixed bottom-6 right-6 z-50 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToTop}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToBottom}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

export default AnalyticsPage 