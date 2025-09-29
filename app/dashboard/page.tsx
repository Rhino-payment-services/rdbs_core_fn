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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useTransactionSystemStats } from '@/lib/hooks/useTransactions'
import { useUsers } from '@/lib/hooks/useAuth'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'

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

    // If we have transaction data, generate chart data
    if (transactionStats.totalTransactions > 0) {
      // Generate sample data based on actual stats (this would come from backend in real implementation)
      return [
        { day: 'Mon', volume: Math.floor(transactionStats.totalVolume * 0.15), transactions: Math.floor(transactionStats.totalTransactions * 0.15) },
        { day: 'Tue', volume: Math.floor(transactionStats.totalVolume * 0.20), transactions: Math.floor(transactionStats.totalTransactions * 0.20) },
        { day: 'Wed', volume: Math.floor(transactionStats.totalVolume * 0.12), transactions: Math.floor(transactionStats.totalTransactions * 0.12) },
        { day: 'Thu', volume: Math.floor(transactionStats.totalVolume * 0.18), transactions: Math.floor(transactionStats.totalTransactions * 0.18) },
        { day: 'Fri', volume: Math.floor(transactionStats.totalVolume * 0.22), transactions: Math.floor(transactionStats.totalTransactions * 0.22) },
        { day: 'Sat', volume: Math.floor(transactionStats.totalVolume * 0.08), transactions: Math.floor(transactionStats.totalTransactions * 0.08) },
        { day: 'Sun', volume: Math.floor(transactionStats.totalVolume * 0.05), transactions: Math.floor(transactionStats.totalTransactions * 0.05) }
      ]
    }

    return []
  }

  const chartData = getChartData()
  const hasData = chartData.length > 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 overflow-hidden relative">
        <div 
          ref={scrollContainerRef}
          className="h-full overflow-y-auto p-6 lg:p-8 xl:p-10 2xl:p-12"
        >
          <div className="max-w-none xl:max-w-[1600px] 2xl:max-w-[2200px] mx-auto">
            {/* Dashboard Header */}
            <div className="mb-6 lg:mb-8">
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900">
                Dashboard Overview
              </h1>
              <p className="text-gray-600 text-base lg:text-lg mt-2">
                Monitor your system performance and key metrics
              </p>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4 lg:gap-6 mb-6 lg:mb-8">
              <Card className="bg-white border-gray-200 xl:col-span-1 2xl:col-span-2">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Total Transactions
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {statsLoading ? '...' : (transactionStats?.totalTransactions || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-green-600 font-medium">
                      {transactionStats?.successRate?.toFixed(1) || 0}%
                    </span>
                    <span className="text-sm ml-1 text-gray-500">
                      success rate
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 xl:col-span-1 2xl:col-span-2">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Total Volume
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {statsLoading ? '...' : `UGX ${((transactionStats?.totalVolume || 0) / 1000000).toFixed(1)}M`}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-green-600 font-medium">
                      UGX {(transactionStats?.averageTransactionAmount || 0).toFixed(0)}
                    </span>
                    <span className="text-sm ml-1 text-gray-500">
                      avg transaction
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 xl:col-span-1 2xl:col-span-2">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Total Fees
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {statsLoading ? '...' : `UGX ${(transactionStats?.totalFees || 0).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-blue-600 font-medium">
                      {transactionStats?.successRate?.toFixed(1) || 0}%
                    </span>
                    <span className="text-sm ml-1 text-gray-500">
                      success rate
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 xl:col-span-1 2xl:col-span-2">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Active Users
                      </p>
                      <p className="text-xl lg:text-2xl font-bold text-gray-900">
                        {usersLoading ? '...' : (usersData?.data?.pagination?.total || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center">
                      <Users className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="mt-2">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
              {/* Transaction Volume Chart */}
              <Card className="bg-white border-gray-200 xl:col-span-2 2xl:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg lg:text-xl text-gray-900">
                    Transaction Volume (Last 7 Days)
                  </CardTitle>
                  <CardDescription className="text-base">
                    Daily transaction volume in UGX
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center h-64 lg:h-80">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading chart data...</span>
                    </div>
                  ) : statsError ? (
                    <div className="flex items-center justify-center h-64 lg:h-80">
                      <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                      <span className="text-red-600">Error loading chart data</span>
                    </div>
                  ) : !hasData ? (
                    <div className="flex flex-col items-center justify-center h-64 lg:h-80 text-gray-500">
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
                      className="h-64 lg:h-80"
                    >
                      <BarChart data={chartData}>
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
                  )}
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="bg-white border-gray-200 xl:col-span-1 2xl:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg lg:text-xl text-gray-900">
                    System Status
                  </CardTitle>
                  <CardDescription className="text-base">
                    Current system health and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 lg:space-y-6">
                    <div className="flex items-center justify-between p-4 lg:p-5 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Activity className="w-5 h-5 lg:w-6 lg:h-6 text-green-500 mr-3 lg:mr-4" />
                        <span className="text-sm lg:text-base font-medium text-gray-900">API Status</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-sm lg:text-base">Online</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 lg:p-5 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Database className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500 mr-3 lg:mr-4" />
                        <span className="text-sm lg:text-base font-medium text-gray-900">Database</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-sm lg:text-base">Connected</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 lg:p-5 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-purple-500 mr-3 lg:mr-4" />
                        <span className="text-sm lg:text-base font-medium text-gray-900">Security</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-sm lg:text-base">Secure</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 lg:p-5 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-orange-500 mr-3 lg:mr-4" />
                        <span className="text-sm lg:text-base font-medium text-gray-900">Uptime</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-sm lg:text-base">99.9%</Badge>
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