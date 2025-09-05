"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard, 
  DollarSign, 
  Building2,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Smartphone,
  Globe,
  MapPin,
  Clock,
  Target
} from 'lucide-react'

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState("30d")
  const [activeTab, setActiveTab] = useState("overview")

  // Transaction volume data for line chart
  const transactionVolumeData = [
    { date: 'Jan 1', volume: 1250000, transactions: 1247, users: 892 },
    { date: 'Jan 2', volume: 1850000, transactions: 1856, users: 1245 },
    { date: 'Jan 3', volume: 980000, transactions: 987, users: 756 },
    { date: 'Jan 4', volume: 2200000, transactions: 2201, users: 1456 },
    { date: 'Jan 5', volume: 1750000, transactions: 1756, users: 1234 },
    { date: 'Jan 6', volume: 2450000, transactions: 2456, users: 1678 },
    { date: 'Jan 7', volume: 1650000, transactions: 1654, users: 1123 }
  ]

  // User demographics data
  const userDemographics = [
    { age: '18-25', users: 35, percentage: 35, color: '#3B82F6' },
    { age: '26-35', users: 42, percentage: 42, color: '#10B981' },
    { age: '36-45', users: 18, percentage: 18, color: '#8B5CF6' },
    { age: '45+', users: 5, percentage: 5, color: '#F59E0B' }
  ]

  // Transaction types data for pie chart
  const transactionTypesData = [
    { type: 'P2P Transfers', value: 68, color: '#3B82F6' },
    { type: 'Merchant Payments', value: 24, color: '#10B981' },
    { type: 'Bill Payments', value: 8, color: '#8B5CF6' }
  ]

  // Geographic distribution
  const geographicData = [
    { region: 'Kampala', users: 45, transactions: 12500, volume: 2500000, color: '#3B82F6' },
    { region: 'Jinja', users: 18, transactions: 5200, volume: 980000, color: '#10B981' },
    { region: 'Mbarara', users: 12, transactions: 3800, volume: 720000, color: '#8B5CF6' },
    { region: 'Gulu', users: 8, transactions: 2400, volume: 480000, color: '#F59E0B' },
    { region: 'Mbale', users: 6, transactions: 1800, volume: 360000, color: '#EF4444' },
    { region: 'Others', users: 11, transactions: 3300, volume: 660000, color: '#6B7280' }
  ]

  // Device usage data
  const deviceUsageData = [
    { device: 'Mobile App', users: 78, percentage: 78, color: '#3B82F6' },
    { device: 'Web Portal', users: 15, percentage: 15, color: '#10B981' },
    { device: 'USSD', users: 7, percentage: 7, color: '#8B5CF6' }
  ]

  // Merchant performance data
  const merchantPerformanceData = [
    { merchant: 'SuperMart', transactions: 1247, revenue: 45200000, growth: 12.5 },
    { merchant: 'TechStore', transactions: 856, revenue: 32800000, growth: 8.9 },
    { merchant: 'FoodExpress', transactions: 654, revenue: 28500000, growth: 15.2 },
    { merchant: 'FashionHub', transactions: 543, revenue: 22400000, growth: 6.7 },
    { merchant: 'HealthPlus', transactions: 432, revenue: 19800000, growth: 11.3 }
  ]

  // Time-based activity data
  const timeActivityData = [
    { hour: '00:00', transactions: 45, volume: 890000 },
    { hour: '04:00', transactions: 23, volume: 456000 },
    { hour: '08:00', transactions: 156, volume: 3100000 },
    { hour: '12:00', transactions: 234, volume: 4680000 },
    { hour: '16:00', transactions: 198, volume: 3960000 },
    { hour: '20:00', transactions: 167, volume: 3340000 },
    { hour: '23:59', transactions: 89, volume: 1780000 }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatAmount = (amount: number) => {
    return `UGX ${amount.toLocaleString('en-UG')}`
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                <p className="text-gray-600">Comprehensive insights into your fintech operations</p>
              </div>
              <div className="flex items-center gap-4">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatAmount(13400000)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  +24.7% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45,892</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  +12.3% from last week
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transaction Volume</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,847</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  +18.5% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.2%</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  +0.5% from last week
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="demographics" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Demographics
              </TabsTrigger>
              <TabsTrigger value="geographic" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Geographic
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Transaction Volume Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Volume Trend</CardTitle>
                    <CardDescription>Daily transaction volume and user activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        volume: { label: "Volume", color: "#3B82F6" },
                        transactions: { label: "Transactions", color: "#10B981" },
                        users: { label: "Users", color: "#8B5CF6" }
                      }}
                      className="h-80"
                    >
                      <AreaChart data={transactionVolumeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <ChartTooltipContent
                                  active={active}
                                  payload={payload}
                                  formatter={(value, name) => [
                                    name === 'volume' ? formatAmount(Number(value)) : value,
                                    name === 'volume' ? 'Volume' : name === 'transactions' ? 'Transactions' : 'Users'
                                  ]}
                                />
                              )
                            }
                            return null
                          }}
                        />
                        <Area type="monotone" dataKey="volume" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="transactions" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Transaction Types Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Types Distribution</CardTitle>
                    <CardDescription>Breakdown of transaction types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        value: { label: "Percentage", color: "#3B82F6" }
                      }}
                      className="h-80"
                    >
                      <PieChart>
                        <Pie
                          data={transactionTypesData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ type, value }) => `${type} ${value}%`}
                        >
                          {transactionTypesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <ChartTooltipContent
                                  active={active}
                                  payload={payload}
                                  formatter={(value, name) => [`${value}%`, 'Percentage']}
                                />
                              )
                            }
                            return null
                          }}
                        />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Time-based Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hourly Transaction Activity</CardTitle>
                    <CardDescription>Transaction patterns throughout the day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        transactions: { label: "Transactions", color: "#3B82F6" },
                        volume: { label: "Volume", color: "#10B981" }
                      }}
                      className="h-80"
                    >
                      <BarChart data={timeActivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <ChartTooltipContent
                                  active={active}
                                  payload={payload}
                                  formatter={(value, name) => [
                                    name === 'volume' ? formatAmount(Number(value)) : value,
                                    name === 'volume' ? 'Volume' : 'Transactions'
                                  ]}
                                />
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="transactions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="volume" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Device Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle>Device Usage Distribution</CardTitle>
                    <CardDescription>How users access the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {deviceUsageData.map((device, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: device.color }}
                            />
                            <span className="text-sm font-medium">{device.device}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${device.percentage}%`, backgroundColor: device.color }}
                              />
                            </div>
                            <span className="text-sm font-medium">{device.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="demographics" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Age Demographics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Age Demographics</CardTitle>
                    <CardDescription>User age distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        users: { label: "Users", color: "#3B82F6" }
                      }}
                      className="h-80"
                    >
                      <BarChart data={userDemographics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="age" />
                        <YAxis />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <ChartTooltipContent
                                  active={active}
                                  payload={payload}
                                  formatter={(value, name) => [`${value}%`, 'Percentage']}
                                />
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="percentage" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Gender Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gender Distribution</CardTitle>
                    <CardDescription>User gender breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium">Male</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="w-3/5 h-2 bg-blue-500 rounded-full" />
                          </div>
                          <span className="text-sm font-medium">60%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full bg-pink-500" />
                          <span className="text-sm font-medium">Female</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="w-2/5 h-2 bg-pink-500 rounded-full" />
                          </div>
                          <span className="text-sm font-medium">40%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="geographic" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Geographic Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                    <CardDescription>User activity by region</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        users: { label: "Users", color: "#3B82F6" },
                        transactions: { label: "Transactions", color: "#10B981" }
                      }}
                      className="h-80"
                    >
                      <BarChart data={geographicData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="region" />
                        <YAxis />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <ChartTooltipContent
                                  active={active}
                                  payload={payload}
                                  formatter={(value, name) => [
                                    name === 'volume' ? formatAmount(Number(value)) : value,
                                    name === 'volume' ? 'Volume' : name === 'transactions' ? 'Transactions' : 'Users'
                                  ]}
                                />
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="users" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="transactions" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Regional Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Regional Performance</CardTitle>
                    <CardDescription>Transaction volume by region</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {geographicData.map((region, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: region.color }}
                            />
                            <span className="text-sm font-medium">{region.region}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatAmount(region.volume)}</div>
                            <div className="text-xs text-muted-foreground">{region.transactions} transactions</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Merchant Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Merchant Performance</CardTitle>
                    <CardDescription>Revenue and growth by merchant</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        revenue: { label: "Revenue", color: "#3B82F6" },
                        transactions: { label: "Transactions", color: "#10B981" }
                      }}
                      className="h-80"
                    >
                      <BarChart data={merchantPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="merchant" />
                        <YAxis />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <ChartTooltipContent
                                  active={active}
                                  payload={payload}
                                  formatter={(value, name) => [
                                    name === 'revenue' ? formatAmount(Number(value)) : value,
                                    name === 'revenue' ? 'Revenue' : 'Transactions'
                                  ]}
                                />
                              )
                            }
                            return null
                          }}
                        />
                        <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="transactions" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Growth Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Growth</CardTitle>
                      <CardDescription>Revenue growth trend</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">+24.7%</div>
                      <div className="text-sm text-muted-foreground">vs last month</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>User Retention</CardTitle>
                      <CardDescription>Monthly active users</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">94.2%</div>
                      <div className="text-sm text-muted-foreground">retention rate</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Transaction Success</CardTitle>
                      <CardDescription>Successful transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">98.2%</div>
                      <div className="text-sm text-muted-foreground">success rate</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default AnalyticsPage 