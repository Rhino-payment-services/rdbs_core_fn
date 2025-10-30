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
import { useTransactionSystemStats, useAllTransactions } from '@/lib/hooks/useTransactions'
import { useUsers } from '@/lib/hooks/useAuth'
import { useMerchants } from '@/lib/hooks/useMerchants'
import { useKycStats } from '@/lib/hooks/useKyc'
import { useSystemStats } from '@/lib/hooks/useSystem'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { useSession } from 'next-auth/react'

const AnalyticsPage = () => {
  const { hasPermission } = usePermissions()
  const { status: sessionStatus } = useSession()
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
  const isLoadingSession = sessionStatus === 'loading'

  // API hooks for different analytics sections
  const { data: transactionStats, isLoading: transactionLoading, error: transactionError, refetch: refetchTransactions } = useTransactionSystemStats()
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers()
  const { data: merchantsData, isLoading: merchantsLoading, error: merchantsError, refetch: refetchMerchants } = useMerchants()
  const { data: kycStats, isLoading: kycLoading, error: kycError, refetch: refetchKyc } = useKycStats()
  const { data: systemStats, isLoading: systemLoading, error: systemError, refetch: refetchSystem } = useSystemStats()
  
  // Fetch all transactions for the selected period to build accurate graphs
  const { data: allTransactionsData } = useAllTransactions({
    limit: 1000, // Fetch enough to cover the period
    startDate: (() => {
      if (isCustomRange && customDateRange.from) {
        return customDateRange.from.toISOString()
      }
      const days = selectedPeriod === '1d' ? 1 : selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90
      const date = new Date()
      date.setDate(date.getDate() - days)
      return date.toISOString()
    })(),
    endDate: (() => {
      if (isCustomRange && customDateRange.to) {
        return customDateRange.to.toISOString()
      }
      return new Date().toISOString()
    })()
  })

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

  // Show loading state while session is loading to prevent "Access Restricted" flash
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading permissions...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

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

  // Generate chart data from actual transactions grouped by date
  const getTransactionChartData = () => {
    // Get transactions from the API response
    const transactions = (allTransactionsData as any)?.transactions || []
    
    if (transactions.length === 0) {
      return []
    }

    // Determine the period to use
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    if (isCustomRange && customDateRange.from && customDateRange.to) {
      startDate = customDateRange.from
      endDate = customDateRange.to
    } else {
      const days = selectedPeriod === '1d' ? 1 : selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90
      startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff <= 1) {
      // Hourly aggregation for 1 day
      const hourlyData: Record<string, { volume: number; transactions: number }> = {}
      
      transactions.forEach((tx: any) => {
        const txDate = new Date(tx.createdAt)
        const hour = txDate.getHours()
        const timeKey = `${hour.toString().padStart(2, '0')}:00`
        
        if (!hourlyData[timeKey]) {
          hourlyData[timeKey] = { volume: 0, transactions: 0 }
        }
        hourlyData[timeKey].volume += Number(tx.amount) || 0
        hourlyData[timeKey].transactions += 1
      })

      // Generate array for all hours
      const result = []
      for (let h = 0; h < 24; h += 6) {
        const timeKey = `${h.toString().padStart(2, '0')}:00`
        result.push({
          time: timeKey,
          volume: hourlyData[timeKey]?.volume || 0,
          transactions: hourlyData[timeKey]?.transactions || 0
        })
      }
      return result
      
    } else if (daysDiff <= 7) {
      // Daily aggregation for 7 days - Show actual data by date
      const dailyData: Record<string, { volume: number; transactions: number; date: Date }> = {}
      
      // Initialize all 7 days with zero values
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' })
        const dateKey = date.toISOString().split('T')[0]
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { volume: 0, transactions: 0, date }
        }
      }

      // Aggregate actual transactions
      transactions.forEach((tx: any) => {
        const txDate = new Date(tx.createdAt)
        const dateKey = txDate.toISOString().split('T')[0]
        
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { volume: 0, transactions: 0, date: txDate }
        }
        dailyData[dateKey].volume += Number(tx.amount) || 0
        dailyData[dateKey].transactions += 1
      })

      // Convert to array with day names
      return Object.entries(dailyData)
        .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
        .map(([dateKey, data]) => ({
          day: data.date.toLocaleDateString('en-US', { weekday: 'short' }),
          volume: data.volume,
          transactions: data.transactions
        }))
        
    } else if (daysDiff <= 30) {
      // Weekly aggregation for 30 days
      const weeklyData: Record<number, { volume: number; transactions: number }> = {}
      
      transactions.forEach((tx: any) => {
        const txDate = new Date(tx.createdAt)
        const weekNum = Math.floor((now.getTime() - txDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        const weekKey = 4 - weekNum // Week 1 is most recent
        
        if (weekKey >= 1 && weekKey <= 4) {
          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { volume: 0, transactions: 0 }
          }
          weeklyData[weekKey].volume += Number(tx.amount) || 0
          weeklyData[weekKey].transactions += 1
        }
      })

      return [1, 2, 3, 4].map(weekNum => ({
        week: `Week ${weekNum}`,
        volume: weeklyData[weekNum]?.volume || 0,
        transactions: weeklyData[weekNum]?.transactions || 0
      }))
      
    } else {
      // Weekly aggregation for 90 days
      const weeklyData: Record<number, { volume: number; transactions: number }> = {}
      
      transactions.forEach((tx: any) => {
        const txDate = new Date(tx.createdAt)
        const weekNum = Math.floor((now.getTime() - txDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
        const weekKey = 13 - weekNum // Week 1 is oldest, Week 13 is most recent
        
        if (weekKey >= 1 && weekKey <= 13) {
          if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = { volume: 0, transactions: 0 }
          }
          weeklyData[weekKey].volume += Number(tx.amount) || 0
          weeklyData[weekKey].transactions += 1
        }
      })

      return Array.from({ length: 9 }, (_, i) => {
        const weekNum = i + 1
        return {
          week: `Week ${weekNum}`,
          volume: weeklyData[weekNum]?.volume || 0,
          transactions: weeklyData[weekNum]?.transactions || 0
        }
      })
    }
  }

  const transactionData = getTransactionChartData()
  const hasTransactionData = transactionData.length > 0

  // Generate user growth data from actual user creation dates
  const getUserGrowthData = () => {
    const users = Array.isArray(usersData) ? usersData : ((usersData as any)?.data || [])
    
    if (users.length === 0) {
      return []
    }

    // Determine the period to use
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    if (isCustomRange && customDateRange.from && customDateRange.to) {
      startDate = customDateRange.from
      endDate = customDateRange.to
    } else {
      const days = selectedPeriod === '1d' ? 1 : selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90
      startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff <= 1) {
      // Hourly aggregation - count users created in each hour
      const hourlyData: Record<string, number> = {}
      
      users.forEach((user: any) => {
        const userDate = new Date(user.createdAt)
        const hour = userDate.getHours()
        const timeKey = `${hour.toString().padStart(2, '0')}:00`
        hourlyData[timeKey] = (hourlyData[timeKey] || 0) + 1
      })

      // Generate cumulative counts
      let cumulative = 0
      const result = []
      for (let h = 0; h < 24; h += 6) {
        const timeKey = `${h.toString().padStart(2, '0')}:00`
        cumulative += hourlyData[timeKey] || 0
        result.push({ time: timeKey, users: cumulative })
      }
      return result
      
    } else if (daysDiff <= 7) {
      // Daily aggregation for 7 days - cumulative user count
      const dailyData: Record<string, { count: number; date: Date; totalUpToDate: number }> = {}
      
      // Initialize all 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        const dateKey = date.toISOString().split('T')[0]
        dailyData[dateKey] = { count: 0, date, totalUpToDate: 0 }
      }

      // Count users created on each day
      users.forEach((user: any) => {
        const userDate = new Date(user.createdAt)
        const dateKey = userDate.toISOString().split('T')[0]
        if (dailyData[dateKey]) {
          dailyData[dateKey].count += 1
        }
      })

      // Calculate cumulative totals (users created up to and including each day)
      let cumulative = users.filter((user: any) => {
        const userDate = new Date(user.createdAt)
        return userDate < dailyData[Object.keys(dailyData)[0]].date
      }).length

      const sortedEntries = Object.entries(dailyData).sort((a, b) => 
        a[1].date.getTime() - b[1].date.getTime()
      )

      sortedEntries.forEach(([key, data]) => {
        cumulative += data.count
        data.totalUpToDate = cumulative
      })

      return sortedEntries.map(([dateKey, data]) => ({
        day: data.date.toLocaleDateString('en-US', { weekday: 'short' }),
        users: data.totalUpToDate
      }))
      
    } else if (daysDiff <= 30) {
      // Weekly aggregation - cumulative counts
      const weeklyData: Record<number, number> = {}
      let totalBeforePeriod = users.filter((user: any) => {
        const userDate = new Date(user.createdAt)
        return userDate < startDate
      }).length

      users.forEach((user: any) => {
        const userDate = new Date(user.createdAt)
        if (userDate >= startDate && userDate <= endDate) {
          const weekNum = Math.floor((userDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
          if (weekNum >= 1 && weekNum <= 4) {
            weeklyData[weekNum] = (weeklyData[weekNum] || 0) + 1
          }
        }
      })

      let cumulative = totalBeforePeriod
      return [1, 2, 3, 4].map(weekNum => {
        cumulative += weeklyData[weekNum] || 0
        return {
          week: `Week ${weekNum}`,
          users: cumulative
        }
      })
      
    } else {
      // Weekly aggregation for 90 days
      const weeklyData: Record<number, number> = {}
      let totalBeforePeriod = users.filter((user: any) => {
        const userDate = new Date(user.createdAt)
        return userDate < startDate
      }).length

      users.forEach((user: any) => {
        const userDate = new Date(user.createdAt)
        if (userDate >= startDate && userDate <= endDate) {
          const weekNum = Math.floor((userDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
          if (weekNum >= 1 && weekNum <= 13) {
            weeklyData[weekNum] = (weeklyData[weekNum] || 0) + 1
          }
        }
      })

      let cumulative = totalBeforePeriod
      return Array.from({ length: 9 }, (_, i) => {
        const weekNum = i + 1
        cumulative += weeklyData[weekNum] || 0
        return {
          week: `Week ${weekNum}`,
          users: cumulative
        }
      })
    }
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
                            {usersLoading ? '...' : (() => {
                              const users = Array.isArray(usersData) ? usersData : ((usersData as any)?.data || [])
                              return users.length.toLocaleString()
                            })()}
                          </p>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center ml-2">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="mt-0">
                        <span className="text-sm text-blue-600 font-medium">
                          {(() => {
                            const users = Array.isArray(usersData) ? usersData : ((usersData as any)?.data || [])
                            return users.filter((user: any) => user.status === 'ACTIVE').length || 0
                          })()}
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
                            {merchantsLoading ? '...' : (() => {
                              const merchants = Array.isArray(merchantsData) ? merchantsData : ((merchantsData as any)?.data || [])
                              return merchants.length.toLocaleString()
                            })()}
                          </p>
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center ml-2">
                          <Building2 className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="mt-0">
                        <span className="text-sm text-purple-600 font-medium">
                          {(() => {
                            const merchants = Array.isArray(merchantsData) ? merchantsData : ((merchantsData as any)?.data || [])
                            return merchants.filter((merchant: any) => merchant.status === 'ACTIVE').length || 0
                          })()}
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
                              {(() => {
                                const users = Array.isArray(usersData) ? usersData : ((usersData as any)?.data || [])
                                return users.length
                              })()}
                            </p>
                            <p className="text-sm text-gray-600">Total Users</p>
                        </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">
                              {(() => {
                                const users = Array.isArray(usersData) ? usersData : ((usersData as any)?.data || [])
                                return users.filter((user: any) => user.status === 'ACTIVE').length || 0
                              })()}
                            </p>
                            <p className="text-sm text-gray-600">Active Users</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">
                              {(() => {
                                const users = Array.isArray(usersData) ? usersData : ((usersData as any)?.data || [])
                                return users.filter((user: any) => {
                                  const createdAt = new Date(user.createdAt)
                                  const now = new Date()
                                  return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
                                }).length || 0
                              })()}
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
                              {(() => {
                                const merchants = Array.isArray(merchantsData) ? merchantsData : ((merchantsData as any)?.data || [])
                                return merchants.length
                              })()}
                            </p>
                            <p className="text-sm text-gray-600">Total Merchants</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">
                              {(() => {
                                const merchants = Array.isArray(merchantsData) ? merchantsData : ((merchantsData as any)?.data || [])
                                return merchants.filter((merchant: any) => merchant.status === 'ACTIVE').length || 0
                              })()}
                            </p>
                            <p className="text-sm text-gray-600">Active Merchants</p>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">
                              {(() => {
                                const merchants = Array.isArray(merchantsData) ? merchantsData : ((merchantsData as any)?.data || [])
                                return merchants.filter((merchant: any) => merchant.status === 'PENDING').length || 0
                              })()}
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