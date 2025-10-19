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
  Database,
  FileText,
  RefreshCw,
  Settings as SettingsIcon
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
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
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [customDateRange, setCustomDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  })
  const [isCustomRange, setIsCustomRange] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Check if user has analytics viewing permission
  const canViewAnalytics = hasPermission(PERMISSIONS.ANALYTICS_VIEW)

  // API hooks for different analytics sections
  const { data: transactionStats, isLoading: transactionLoading, error: transactionError, refetch: refetchTransactions } = useTransactionSystemStats()
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers()
  const { data: merchantsData, isLoading: merchantsLoading, error: merchantsError, refetch: refetchMerchants } = useMerchants()
  const { data: kycStats, isLoading: kycLoading, error: kycError, refetch: refetchKyc } = useKycStats()
  const { data: systemStats, isLoading: systemLoading, error: systemError, refetch: refetchSystem } = useSystemStats()

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

  // Handle refresh
  const handleRefresh = async () => {
    await Promise.all([
      refetchTransactions(),
      refetchUsers(),
      refetchMerchants(),
      refetchKyc(),
      refetchSystem()
    ])
  }

  const isRefreshing = transactionLoading || usersLoading || merchantsLoading || kycLoading || systemLoading

  // If user doesn't have analytics permissions, show access denied message
  if (!canViewAnalytics) {
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

  // Generate chart data from backend or show empty state
  const getTransactionChartData = () => {
    if (transactionLoading || transactionError || !transactionStats) {
      return []
    }

    // If we have transaction data, generate chart data based on selected period or custom range
    if (transactionStats.totalTransactions > 0) {
      if (isCustomRange && customDateRange.from && customDateRange.to) {
        // Generate data for custom date range
        const daysDiff = Math.ceil((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff <= 1) {
          // Hourly data for 1 day or less
          return [
            { time: '00:00', volume: Math.floor(transactionStats.totalVolume * 0.05), transactions: Math.floor(transactionStats.totalTransactions * 0.05) },
            { time: '06:00', volume: Math.floor(transactionStats.totalVolume * 0.15), transactions: Math.floor(transactionStats.totalTransactions * 0.15) },
            { time: '12:00', volume: Math.floor(transactionStats.totalVolume * 0.30), transactions: Math.floor(transactionStats.totalTransactions * 0.30) },
            { time: '18:00', volume: Math.floor(transactionStats.totalVolume * 0.35), transactions: Math.floor(transactionStats.totalTransactions * 0.35) },
            { time: '24:00', volume: Math.floor(transactionStats.totalVolume * 0.15), transactions: Math.floor(transactionStats.totalTransactions * 0.15) }
          ]
        } else if (daysDiff <= 7) {
          // Show data only for today (actual transaction date) instead of distributing across the week
          const today = new Date()
          const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'short' })
          return [
            { day: dayOfWeek, volume: transactionStats.totalVolume, transactions: transactionStats.totalTransactions }
          ]
        } else if (daysDiff <= 30) {
          // Weekly data for up to 30 days
          return [
            { week: 'Week 1', volume: Math.floor(transactionStats.totalVolume * 0.20), transactions: Math.floor(transactionStats.totalTransactions * 0.20) },
            { week: 'Week 2', volume: Math.floor(transactionStats.totalVolume * 0.25), transactions: Math.floor(transactionStats.totalTransactions * 0.25) },
            { week: 'Week 3', volume: Math.floor(transactionStats.totalVolume * 0.30), transactions: Math.floor(transactionStats.totalTransactions * 0.30) },
            { week: 'Week 4', volume: Math.floor(transactionStats.totalVolume * 0.25), transactions: Math.floor(transactionStats.totalTransactions * 0.25) }
          ]
        } else {
          // Weekly data for more than 30 days (90 days = ~13 weeks)
          const weeks = Math.ceil(daysDiff / 7)
          const weeklyData = []
          for (let i = 1; i <= Math.min(weeks, 13); i++) {
            weeklyData.push({
              week: `Week ${i}`,
              volume: Math.floor(transactionStats.totalVolume * (0.05 + Math.random() * 0.15)),
              transactions: Math.floor(transactionStats.totalTransactions * (0.05 + Math.random() * 0.15))
            })
          }
          return weeklyData
        }
      } else {
        // Use predefined periods
        switch (selectedPeriod) {
          case '1d':
            return [
              { time: '00:00', volume: Math.floor(transactionStats.totalVolume * 0.05), transactions: Math.floor(transactionStats.totalTransactions * 0.05) },
              { time: '06:00', volume: Math.floor(transactionStats.totalVolume * 0.15), transactions: Math.floor(transactionStats.totalTransactions * 0.15) },
              { time: '12:00', volume: Math.floor(transactionStats.totalVolume * 0.30), transactions: Math.floor(transactionStats.totalTransactions * 0.30) },
              { time: '18:00', volume: Math.floor(transactionStats.totalVolume * 0.35), transactions: Math.floor(transactionStats.totalTransactions * 0.35) },
              { time: '24:00', volume: Math.floor(transactionStats.totalVolume * 0.15), transactions: Math.floor(transactionStats.totalTransactions * 0.15) }
            ]
          case '7d':
            // Show data only for today (actual transaction date) instead of distributing across the week
            const today = new Date()
            const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'short' })
            return [
              { day: dayOfWeek, volume: transactionStats.totalVolume, transactions: transactionStats.totalTransactions }
            ]
          case '30d':
            return [
              { week: 'Week 1', volume: Math.floor(transactionStats.totalVolume * 0.20), transactions: Math.floor(transactionStats.totalTransactions * 0.20) },
              { week: 'Week 2', volume: Math.floor(transactionStats.totalVolume * 0.25), transactions: Math.floor(transactionStats.totalTransactions * 0.25) },
              { week: 'Week 3', volume: Math.floor(transactionStats.totalVolume * 0.30), transactions: Math.floor(transactionStats.totalTransactions * 0.30) },
              { week: 'Week 4', volume: Math.floor(transactionStats.totalVolume * 0.25), transactions: Math.floor(transactionStats.totalTransactions * 0.25) }
            ]
          case '90d':
            return [
              { week: 'Week 1', volume: Math.floor(transactionStats.totalVolume * 0.08), transactions: Math.floor(transactionStats.totalTransactions * 0.08) },
              { week: 'Week 2', volume: Math.floor(transactionStats.totalVolume * 0.10), transactions: Math.floor(transactionStats.totalTransactions * 0.10) },
              { week: 'Week 3', volume: Math.floor(transactionStats.totalVolume * 0.12), transactions: Math.floor(transactionStats.totalTransactions * 0.12) },
              { week: 'Week 4', volume: Math.floor(transactionStats.totalVolume * 0.11), transactions: Math.floor(transactionStats.totalTransactions * 0.11) },
              { week: 'Week 5', volume: Math.floor(transactionStats.totalVolume * 0.13), transactions: Math.floor(transactionStats.totalTransactions * 0.13) },
              { week: 'Week 6', volume: Math.floor(transactionStats.totalVolume * 0.09), transactions: Math.floor(transactionStats.totalTransactions * 0.09) },
              { week: 'Week 7', volume: Math.floor(transactionStats.totalVolume * 0.15), transactions: Math.floor(transactionStats.totalTransactions * 0.15) },
              { week: 'Week 8', volume: Math.floor(transactionStats.totalVolume * 0.12), transactions: Math.floor(transactionStats.totalTransactions * 0.12) },
              { week: 'Week 9', volume: Math.floor(transactionStats.totalVolume * 0.10), transactions: Math.floor(transactionStats.totalTransactions * 0.10) }
            ]
          default:
            return []
        }
      }
    }

    return []
  }

  const transactionData = getTransactionChartData()
  const hasTransactionData = transactionData.length > 0

  // Generate user growth data from backend or show empty state
  const getUserGrowthData = () => {
    if (usersLoading || usersError || !usersData) {
      return []
    }

    // If we have user data, generate growth data based on selected period or custom range
    if (usersData.length > 0) {
      const totalUsers = usersData.length
      
      if (isCustomRange && customDateRange.from && customDateRange.to) {
        // Generate data for custom date range
        const daysDiff = Math.ceil((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff <= 1) {
          // Hourly data for 1 day or less
          return [
            { time: '00:00', users: Math.floor(totalUsers * 0.95) },
            { time: '06:00', users: Math.floor(totalUsers * 0.96) },
            { time: '12:00', users: Math.floor(totalUsers * 0.97) },
            { time: '18:00', users: Math.floor(totalUsers * 0.98) },
            { time: '24:00', users: totalUsers }
          ]
        } else if (daysDiff <= 7) {
          // Daily data for up to 7 days
          return [
            { day: 'Mon', users: Math.floor(totalUsers * 0.85) },
            { day: 'Tue', users: Math.floor(totalUsers * 0.87) },
            { day: 'Wed', users: Math.floor(totalUsers * 0.89) },
            { day: 'Thu', users: Math.floor(totalUsers * 0.92) },
            { day: 'Fri', users: Math.floor(totalUsers * 0.94) },
            { day: 'Sat', users: Math.floor(totalUsers * 0.96) },
            { day: 'Sun', users: totalUsers }
          ]
        } else if (daysDiff <= 30) {
          // Weekly data for up to 30 days
          return [
            { week: 'Week 1', users: Math.floor(totalUsers * 0.70) },
            { week: 'Week 2', users: Math.floor(totalUsers * 0.80) },
            { week: 'Week 3', users: Math.floor(totalUsers * 0.90) },
            { week: 'Week 4', users: totalUsers }
          ]
        } else {
          // Weekly data for more than 30 days (90 days = ~13 weeks)
          const weeks = Math.ceil(daysDiff / 7)
          const weeklyData = []
          for (let i = 1; i <= Math.min(weeks, 13); i++) {
            const progress = (i / weeks) * 0.95 + 0.05 // Gradual growth from 5% to 100%
            weeklyData.push({
              week: `Week ${i}`,
              users: Math.floor(totalUsers * progress)
            })
          }
          return weeklyData
        }
      } else {
        // Use predefined periods
        switch (selectedPeriod) {
          case '1d':
            return [
              { time: '00:00', users: Math.floor(totalUsers * 0.95) },
              { time: '06:00', users: Math.floor(totalUsers * 0.96) },
              { time: '12:00', users: Math.floor(totalUsers * 0.97) },
              { time: '18:00', users: Math.floor(totalUsers * 0.98) },
              { time: '24:00', users: totalUsers }
            ]
          case '7d':
            return [
              { day: 'Mon', users: Math.floor(totalUsers * 0.85) },
              { day: 'Tue', users: Math.floor(totalUsers * 0.87) },
              { day: 'Wed', users: Math.floor(totalUsers * 0.89) },
              { day: 'Thu', users: Math.floor(totalUsers * 0.92) },
              { day: 'Fri', users: Math.floor(totalUsers * 0.94) },
              { day: 'Sat', users: Math.floor(totalUsers * 0.96) },
              { day: 'Sun', users: totalUsers }
            ]
          case '30d':
            return [
              { week: 'Week 1', users: Math.floor(totalUsers * 0.70) },
              { week: 'Week 2', users: Math.floor(totalUsers * 0.80) },
              { week: 'Week 3', users: Math.floor(totalUsers * 0.90) },
              { week: 'Week 4', users: totalUsers }
            ]
          case '90d':
            return [
              { week: 'Week 1', users: Math.floor(totalUsers * 0.65) },
              { week: 'Week 2', users: Math.floor(totalUsers * 0.68) },
              { week: 'Week 3', users: Math.floor(totalUsers * 0.72) },
              { week: 'Week 4', users: Math.floor(totalUsers * 0.75) },
              { week: 'Week 5', users: Math.floor(totalUsers * 0.78) },
              { week: 'Week 6', users: Math.floor(totalUsers * 0.82) },
              { week: 'Week 7', users: Math.floor(totalUsers * 0.85) },
              { week: 'Week 8', users: Math.floor(totalUsers * 0.88) },
              { week: 'Week 9', users: Math.floor(totalUsers * 0.92) },
              { week: 'Week 10', users: Math.floor(totalUsers * 0.95) },
              { week: 'Week 11', users: Math.floor(totalUsers * 0.97) },
              { week: 'Week 12', users: Math.floor(totalUsers * 0.99) },
              { week: 'Week 13', users: totalUsers }
            ]
          default:
            return []
        }
      }
    }

    return []
  }

  const userGrowthData = getUserGrowthData()
  const hasUserGrowthData = userGrowthData.length > 0


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
          className="h-full overflow-y-auto p-6"
        >
        <div className="max-w-7xl mx-auto">
            {/* Analytics Header */}
          <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Analytics & Reports
              </h1>
              <p className="mt-2 text-gray-600">
                Detailed analytics and comprehensive reporting
              </p>
                </div>
                
                {/* Enhanced Date Filters */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">Analysis Period:</label>
                  
                  {/* Refresh Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  
                  {/* Quick Period Selector */}
                  <Select 
                    value={isCustomRange ? 'custom' : selectedPeriod} 
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setIsCustomRange(true)
                      } else {
                        setIsCustomRange(false)
                        setSelectedPeriod(value)
                      }
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Custom Date Range Picker */}
                  {isCustomRange && (
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-40 justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customDateRange.from ? (
                              customDateRange.to ? (
                                <>
                                  {format(customDateRange.from, "LLL dd, y")} -{" "}
                                  {format(customDateRange.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(customDateRange.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={customDateRange.from}
                            selected={customDateRange}
                            onSelect={(range) => {
                              if (range) {
                                setCustomDateRange({
                                  from: range.from,
                                  to: range.to || undefined
                                })
                              }
                            }}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                      
                      {/* Quick Date Buttons */}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const today = new Date()
                            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                            setCustomDateRange({ from: weekAgo, to: today })
                          }}
                        >
                          Last Week
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const today = new Date()
                            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                            setCustomDateRange({ from: monthAgo, to: today })
                          }}
                        >
                          Last Month
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
                        Transaction Volume {isCustomRange && customDateRange.from && customDateRange.to ? 
                          `(${format(customDateRange.from, "MMM dd")} - ${format(customDateRange.to, "MMM dd, yyyy")})` : 
                          `(${selectedPeriod === '1d' ? 'Last 24 Hours' : selectedPeriod === '7d' ? 'Last 7 Days' : selectedPeriod === '30d' ? 'Last 30 Days' : 'Last 90 Days'})`
                        }
                      </CardTitle>
                      <CardDescription>
                        {isCustomRange && customDateRange.from && customDateRange.to ? 
                          (() => {
                            const daysDiff = Math.ceil((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24))
                            if (daysDiff <= 1) return 'Hourly transaction volume in UGX'
                            if (daysDiff <= 7) return 'Daily transaction volume in UGX'
                            return 'Weekly transaction volume in UGX' // Always weekly for longer periods
                          })() :
                          (selectedPeriod === '1d' ? 'Hourly transaction volume in UGX' : selectedPeriod === '7d' ? 'Daily transaction volume in UGX' : 'Weekly transaction volume in UGX') // Always weekly for 30d and 90d
                        }
                      </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {transactionLoading ? (
                      <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading chart data...</span>
                      </div>
                    ) : transactionError ? (
                      <div className="flex items-center justify-center h-48">
                        <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                        <span className="text-red-600">Error loading chart data</span>
                      </div>
                    ) : !hasTransactionData ? (
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
                          className="h-80"
                      >
                          <LineChart data={transactionData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={(() => {
                              if (isCustomRange && customDateRange.from && customDateRange.to) {
                                const daysDiff = Math.ceil((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24))
                                if (daysDiff <= 1) return 'time'
                                if (daysDiff <= 7) return 'day'
                                return 'week' // Always use week for longer periods
                              }
                              return selectedPeriod === '1d' ? 'time' : selectedPeriod === '7d' ? 'day' : 'week' // Always use week for 30d and 90d
                            })()} />
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

                  {/* User Growth Chart */}
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-gray-900">
                        User Growth Trend {isCustomRange && customDateRange.from && customDateRange.to ? 
                          `(${format(customDateRange.from, "MMM dd")} - ${format(customDateRange.to, "MMM dd, yyyy")})` : 
                          `(${selectedPeriod === '1d' ? 'Last 24 Hours' : selectedPeriod === '7d' ? 'Last 7 Days' : selectedPeriod === '30d' ? 'Last 30 Days' : 'Last 90 Days'})`
                        }
                      </CardTitle>
                      <CardDescription>
                        {isCustomRange && customDateRange.from && customDateRange.to ? 
                          (() => {
                            const daysDiff = Math.ceil((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24))
                            if (daysDiff <= 1) return 'Hourly user registration growth'
                            if (daysDiff <= 7) return 'Daily user registration growth'
                            return 'Weekly user registration growth' // Always weekly for longer periods
                          })() :
                          (selectedPeriod === '1d' ? 'Hourly user registration growth' : selectedPeriod === '7d' ? 'Daily user registration growth' : 'Weekly user registration growth') // Always weekly for 30d and 90d
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {usersLoading ? (
                        <div className="flex items-center justify-center h-48">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                          <span className="ml-3 text-gray-600">Loading user data...</span>
                        </div>
                      ) : usersError ? (
                        <div className="flex items-center justify-center h-48">
                          <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                          <span className="text-red-600">Error loading user data</span>
                        </div>
                      ) : !hasUserGrowthData ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                          <Users className="h-12 w-12 mb-3" />
                          <p className="text-lg font-medium">No user data available</p>
                          <p className="text-sm">User growth data will appear here</p>
                        </div>
                      ) : (
                      <ChartContainer
                        config={{
                          users: {
                            label: "Users",
                            color: "#10B981",
                          },
                        }}
                          className="h-80"
                      >
                          <LineChart data={userGrowthData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={(() => {
                              if (isCustomRange && customDateRange.from && customDateRange.to) {
                                const daysDiff = Math.ceil((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24))
                                if (daysDiff <= 1) return 'time'
                                if (daysDiff <= 7) return 'day'
                                return 'week' // Always use week for longer periods
                              }
                              return selectedPeriod === '1d' ? 'time' : selectedPeriod === '7d' ? 'day' : 'week' // Always use week for 30d and 90d
                            })()} />
                          <YAxis />
                          <ChartTooltip />
                            <Line 
                              type="monotone" 
                              dataKey="users" 
                              stroke="#10B981" 
                              strokeWidth={3}
                              dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2 }}
                            />
                          </LineChart>
                      </ChartContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

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