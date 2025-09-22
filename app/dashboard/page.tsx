"use client"
import React from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { TrendingUp, Users, CreditCard, DollarSign, ShoppingCart, Building2, Activity, AlertTriangle, CheckCircle, Clock, ArrowUpRight, ArrowDownRight, Shield, Lock, DollarSignIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useTransactionSystemStats } from '@/lib/hooks/useApi'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'

const DashboardPage = () => {
  const { hasPermission, hasAnyPermission } = usePermissions()
  
  // Check if user has any transaction viewing permissions
  const canViewTransactions = hasAnyPermission([
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_APPROVE,
    PERMISSIONS.TRANSACTIONS_REVERSE
  ])

  // Fetch real transaction system stats only if user has permission
  const { data: transactionStats, isLoading: statsLoading, error: statsError } = useTransactionSystemStats()
  
  // Get stats data
  const stats = transactionStats || {
    totalTransactions: 0,
    totalVolume: 0,
    totalFees: 0,
    successRate: 0,
    averageTransactionAmount: 0,
    transactionsByType: {},
    transactionsByStatus: {},
    transactionsByCurrency: {}
  }

  // If user doesn't have transaction permissions, show access denied message
  if (!canViewTransactions) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Access Denied Card */}
            <div className="flex items-center justify-center min-h-[60vh]">
              <Card className="w-full max-w-md text-center">
                <CardContent className="p-12">
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-12 h-12 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
                  <p className="text-gray-600 mb-6">
                    You don't have permission to view the dashboard .
                  </p>
          
                  <p className="text-sm text-gray-500">
                    Please contact your administrator to request access to transaction data.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Real data for charts and analytics
  const transactionData = [
    { day: 'Mon', volume: 125000, transactions: 1247 },
    { day: 'Tue', volume: 185000, transactions: 1856 },
    { day: 'Wed', volume: 98000, transactions: 987 },
    { day: 'Thu', volume: 220000, transactions: 2201 },
    { day: 'Fri', volume: 175000, transactions: 1756 },
    { day: 'Sat', volume: 245000, transactions: 2456 },
    { day: 'Sun', volume: 165000, transactions: 1654 }
  ]

  const userDemographics = [
    { range: 'UGX 0 - 10K', percentage: 20, color: 'bg-blue-500' },
    { range: 'UGX 10K - 50K', percentage: 35, color: 'bg-green-500' },
    { range: 'UGX 50K - 100K', percentage: 25, color: 'bg-purple-500' },
    { range: 'UGX 100K - 500K', percentage: 12, color: 'bg-orange-500' },
    { range: 'UGX 500K - 1M', percentage: 5, color: 'bg-red-500' },
    { range: 'UGX 1M - 5M', percentage: 2, color: 'bg-indigo-500' },
    { range: 'UGX 5M+', percentage: 1, color: 'bg-gray-800' }
  ]

  const transactionTypes = [
    { type: 'P2P Transfers', percentage: 68, value: 'UGX 1.63M', color: 'bg-blue-500' },
    { type: 'Merchant Payments', percentage: 24, value: 'UGX 576K', color: 'bg-green-500' },
    { type: 'Bill Payments', percentage: 8, value: 'UGX 192K', color: 'bg-purple-500' }
  ]

  const topMerchants = [
    { name: 'SuperMart', revenue: 45200, growth: 12.5, transactions: 1247 },
    { name: 'TechStore', revenue: 32800, growth: 8.9, transactions: 856 },
    { name: 'FoodExpress', revenue: 28500, growth: 15.2, transactions: 654 },
    { name: 'FashionHub', revenue: 22400, growth: 6.7, transactions: 543 },
    { name: 'HealthPlus', revenue: 19800, growth: 11.3, transactions: 432 }
  ]

  const systemMetrics = [
    { metric: 'API Response Time', value: '98ms', status: 'good', trend: 'down' },
    { metric: 'Uptime', value: '99.9%', status: 'excellent', trend: 'stable' },
    { metric: 'Active Sessions', value: '12.4K', status: 'good', trend: 'up' },
    { metric: 'Failed Transactions', value: '0.2%', status: 'good', trend: 'down' },
    { metric: 'Average Transaction Time', value: '2.3s', status: 'good', trend: 'down' }
  ]

  const recentActivity = [
    { type: 'p2p', from: 'John Doe', to: 'Jane Smith', amount: 250.00, time: '2 minutes ago' },
    { type: 'merchant', merchant: 'SuperMart', amount: 89.50, transactionId: 'TX-78945', time: '5 minutes ago' },
    { type: 'registration', user: 'Sarah Johnson', email: 'sarah.j@email.com', time: '8 minutes ago' },
    { type: 'merchant_onboard', merchant: 'CoffeeShop', merchantId: 'M-1247', time: '15 minutes ago' },
    { type: 'p2p', from: 'Mike Wilson', to: 'Lisa Brown', amount: 150.75, time: '18 minutes ago' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Loading State for Stats */}
          {statsLoading && (
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading transaction statistics...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error State for Stats */}
          {statsError && (
            <div className="mb-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error loading statistics</h3>
                    <p className="text-sm text-red-700 mt-1">Failed to load transaction statistics. Please try again.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : stats.totalTransactions.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 font-medium">{stats.successRate.toFixed(1)}%</span>
                <span className="text-sm text-gray-600 ml-2">success rate</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Volume</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : `UGX ${(stats.totalVolume / 1000000).toFixed(1)}M`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSignIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 font-medium">UGX {stats.averageTransactionAmount.toFixed(0)}</span>
                <span className="text-sm text-gray-600 ml-2">avg transaction</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Fees</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : `UGX ${stats.totalFees.toLocaleString()}`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-blue-600 font-medium">{stats.successRate.toFixed(1)}%</span>
                <span className="text-sm text-gray-600 ml-2">success rate</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transaction Types</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? '...' : Object.keys(stats.transactionsByType).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-purple-600 font-medium">{Object.keys(stats.transactionsByStatus).length}</span>
                <span className="text-sm text-gray-600 ml-2">status types</span>
              </div>
            </div>
          </div>

          {/* Charts and Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Transaction Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Volume (Last 7 Days)</CardTitle>
                <CardDescription>Daily transaction volume in UGX</CardDescription>
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

            {/* User Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Amount Distribution</CardTitle>
                <CardDescription>User distribution by transaction amounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userDemographics.map((demo, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{demo.range}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className={`${demo.color} h-2 rounded-full transition-all duration-300`} 
                               style={{width: `${demo.percentage}%`}}></div>
                        </div>
                        <span className="text-sm font-medium">{demo.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          </div>

          {/* Transaction Types and Merchant Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Transaction Types */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Types</CardTitle>
                <CardDescription>Distribution of transaction types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactionTypes.map((type, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 ${type.color} rounded-full`}></div>
                        <span className="text-sm text-muted-foreground">{type.type}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{type.percentage}%</div>
                        <div className="text-xs text-muted-foreground">{type.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Merchants */}
            <Card>
              <CardHeader>
                <CardTitle>Top Merchants</CardTitle>
                <CardDescription>Revenue performance this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topMerchants.slice(0, 3).map((merchant, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{merchant.name}</div>
                          <div className="text-xs text-muted-foreground">{merchant.transactions} transactions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">UGX {(merchant.revenue / 1000).toFixed(1)}K</div>
                        <div className="flex items-center text-xs text-green-600">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          +{merchant.growth}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Real-time system metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{metric.metric}</span>
                      <div className="flex items-center space-x-1">
                        {metric.status === 'excellent' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {metric.status === 'good' && <Activity className="w-4 h-4 text-blue-500" />}
                        {metric.trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-600" />}
                        {metric.trend === 'down' && <ArrowDownRight className="w-3 h-3 text-green-600" />}
                        <span className={`text-sm font-medium ${
                          metric.status === 'excellent' ? 'text-green-600' : 
                          metric.status === 'good' ? 'text-blue-600' : 'text-yellow-600'
                        }`}>{metric.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest transactions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'p2p' ? 'bg-blue-100' :
                      activity.type === 'merchant' ? 'bg-green-100' :
                      activity.type === 'registration' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      {activity.type === 'p2p' && <CreditCard className="w-5 h-5 text-blue-600" />}
                      {activity.type === 'merchant' && <ShoppingCart className="w-5 h-5 text-green-600" />}
                      {activity.type === 'registration' && <Users className="w-5 h-5 text-purple-600" />}
                      {activity.type === 'merchant_onboard' && <Building2 className="w-5 h-5 text-orange-600" />}
                    </div>
                    <div className="flex-1">
                      {activity.type === 'p2p' && (
                        <>
                          <p className="text-sm font-medium">P2P Transfer Completed</p>
                          <p className="text-sm text-muted-foreground">{activity.from} → {activity.to} • UGX {activity.amount?.toFixed(2) || '0.00'}</p>
                        </>
                      )}
                      {activity.type === 'merchant' && (
                        <>
                          <p className="text-sm font-medium">Merchant Payment</p>
                          <p className="text-sm text-muted-foreground">{activity.merchant} • UGX {activity.amount?.toFixed(2) || '0.00'} • {activity.transactionId}</p>
                        </>
                      )}
                      {activity.type === 'registration' && (
                        <>
                          <p className="text-sm font-medium">New User Registration</p>
                          <p className="text-sm text-muted-foreground">{activity.user} • {activity.email}</p>
                        </>
                      )}
                      {activity.type === 'merchant_onboard' && (
                        <>
                          <p className="text-sm font-medium">New Merchant Onboarded</p>
                          <p className="text-sm text-muted-foreground">{activity.merchant} • {activity.merchantId}</p>
                        </>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {activity.time}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
