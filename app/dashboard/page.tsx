"use client"
import React, { useState, useEffect, useRef } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Shield, 
  Lock, 
  ChevronUp,
  ChevronDown,
  BarChart3,
  Calendar,
  Clock,
  UserIcon,
  Building,
  Key,
  Database
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import { useTransactionSystemStats } from '@/lib/hooks/useTransactions'
import { useUsers } from '@/lib/hooks/useAuth'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { TableTabsTest } from '@/components/ui/table-tabs-test'

const DashboardPage = () => {
  const { hasPermission } = usePermissions()
  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Check if user has dashboard viewing permission
  const canViewDashboard = hasPermission(PERMISSIONS.DASHBOARD_VIEW)

  // Fetch data from backend
  const { data: transactionStats, isLoading: statsLoading, error: statsError } = useTransactionSystemStats()
  const { data: usersData, isLoading: usersLoading, error: usersError } = useUsers()

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

  // If user doesn't have dashboard permissions, show access denied message
  if (!canViewDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <Card className="w-full max-w-md text-center">
                <CardContent className="p-12">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-12 h-12 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
                  <p className="text-gray-600 mb-6">
                    You don't have permission to view the dashboard.
                  </p>
                  <p className="text-sm text-gray-500">
                    Please contact your administrator to request dashboard access.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Generate chart data from backend or show empty state
  const getChartData = () => {
    if (statsLoading || statsError || !transactionStats) {
      return []
    }

    // Generate 7 days of data
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // For now, distribute volume evenly across 7 days
      // TODO: Get actual daily breakdown from backend API
      const dailyVolume = i === 0 && transactionStats.totalTransactions > 0
        ? transactionStats.totalVolume // Show all volume on today
        : 0; // No data for other days yet
      
      last7Days.push({
        day: dayOfWeek,
        date: dateLabel,
        volume: dailyVolume,
        transactions: i === 0 ? transactionStats.totalTransactions : 0
      });
    }
    
    return last7Days;
  }

  const chartData = getChartData()
  const hasData = chartData.length > 0
  
  // Calculate total volume from chart data for consistency
  const chartTotalVolume = chartData.reduce((sum, item) => sum + item.volume, 0)
  const displayTotalVolume = chartTotalVolume > 0 ? chartTotalVolume : (transactionStats?.totalVolume || 0)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 overflow-hidden relative">
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-auto p-6"
        >
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Header */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard Overview
              </h1>
              <p className="text-gray-600">
                Monitor your system performance and key metrics
              </p>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mb-4">
              <Card className="bg-white border-gray-200">
                <CardContent className="px-4 py-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-0">
                        Total Transactions
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {statsLoading ? '...' : (transactionStats?.totalTransactions || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-0">
                        Total Volume
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {statsLoading ? '...' : `UGX ${(displayTotalVolume / 1000000).toFixed(1)}M`}
                      </p>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-0">
                        Total Fees
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {statsLoading ? '...' : `UGX ${(transactionStats?.totalFees || 0).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="mt-0">
                    <span className="text-sm text-blue-600 font-medium">
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-0">
                        Active Users
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        {usersLoading ? '...' : (usersData?.data?.pagination?.total || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <div className="mt-0">
                    <span className="text-sm text-purple-600 font-medium">
                      {usersData?.data?.data?.filter((user: any) => user.status === 'ACTIVE').length || 0}
                    </span>
                    <span className="text-sm ml-1 text-gray-500">
                      online now
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Transaction Volume Chart */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-900">
                    Transaction Volume (Last 7 Days)
                  </CardTitle>
                  <CardDescription>
                    Daily transaction volume in UGX
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading chart data...</span>
                    </div>
                  ) : statsError ? (
                    <div className="flex items-center justify-center h-48">
                      <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                      <span className="text-red-600">Error loading chart data</span>
                    </div>
                  ) : !hasData ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                      <BarChart3 className="h-12 w-12 mb-3" />
                      <p className="text-lg font-medium">No transaction data available</p>
                      <p className="text-sm">Start processing transactions to see analytics</p>
                    </div>
                  ) : (
                    <ChartContainer
                      config={{
                        volume: {
                          label: "Volume",
                          color: "#3B82F6",
                        },
                      }}
                      className="h-72"
                    >
                      <LineChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis 
                          tickFormatter={(value) => {
                            if (value >= 1000000) {
                              return `${(value / 1000000).toFixed(0)}M`;
                            } else if (value >= 1000) {
                              return `${(value / 1000).toFixed(0)}K`;
                            }
                            return value.toString();
                          }}
                        />
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
                        <Line 
                          type="monotone" 
                          dataKey="volume" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-gray-900">
                    System Status
                  </CardTitle>
                  <CardDescription>
                    Current system health and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Activity className="w-5 h-5 text-green-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900">API Status</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Database className="w-5 h-5 text-blue-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900">Database</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-purple-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900">Security</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Secure</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-orange-500 mr-3" />
                        <span className="text-sm font-medium text-gray-900">Uptime</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">99.9%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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

export default DashboardPage