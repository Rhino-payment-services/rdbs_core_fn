"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  BarChart3
} from 'lucide-react'

interface CustomerStatsProps {
  stats: {
    total: number
    active: number
    inactive: number
    pending: number
    totalRevenue: number
    monthlyRevenue: number
    revenueGrowth: number
    avgTransactionValue: number
    conversionRate: number
    churnRate: number
  }
}

export const CustomerStats: React.FC<CustomerStatsProps> = ({ stats }) => {
  const formatCurrency = (amount: number) => {
    // Format for display in millions if amount is large
    if (amount >= 1000000) {
      return `UGX ${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `UGX ${(amount / 1000).toFixed(1)}K`
    }
    return `UGX ${amount.toLocaleString()}`
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mb-4">
      <Card>
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between mb-0">
            <p className="text-sm font-medium text-gray-600 mb-0">Total Customers</p>
            <div className="w-8 h-8 flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 leading-tight">{stats.total.toLocaleString()}</p>
          <div className="mt-0">
            <span className="text-sm text-gray-500">All registered customers</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between mb-0">
            <p className="text-sm font-medium text-gray-600 mb-0">Active Customers</p>
            <div className="w-8 h-8 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 leading-tight">{stats.active.toLocaleString()}</p>
          <div className="mt-0">
            <span className="text-sm text-gray-500">
              {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : '0.0'}% of total
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between mb-0">
            <p className="text-sm font-medium text-gray-600 mb-0">Pending Verification</p>
            <div className="w-8 h-8 flex items-center justify-center">
              <UserX className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 leading-tight">{stats.pending.toLocaleString()}</p>
          <div className="mt-0">
            <span className="text-sm text-gray-500">Awaiting KYC completion</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between mb-0">
            <p className="text-sm font-medium text-gray-600 mb-0">Total Revenue</p>
            <div className="w-8 h-8 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 leading-tight">{formatCurrency(stats.totalRevenue)}</p>
          <div className="mt-0">
            <span className="text-sm text-gray-500">{formatPercentage(stats.revenueGrowth)} from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between mb-0">
            <p className="text-sm font-medium text-gray-600 mb-0">Monthly Revenue</p>
            <div className="w-8 h-8 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 leading-tight">{formatCurrency(stats.monthlyRevenue)}</p>
          <div className="mt-0">
            <span className="text-sm text-gray-500">Current month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between mb-0">
            <p className="text-sm font-medium text-gray-600 mb-0">Avg Transaction</p>
            <div className="w-8 h-8 flex items-center justify-center">
              <Activity className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 leading-tight">{formatCurrency(stats.avgTransactionValue)}</p>
          <div className="mt-0">
            <span className="text-sm text-gray-500">Average per transaction</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between mb-0">
            <p className="text-sm font-medium text-gray-600 mb-0">Conversion Rate</p>
            <div className="w-8 h-8 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 leading-tight">{stats.conversionRate.toFixed(1)}%</p>
          <div className="mt-0">
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between mb-0">
            <p className="text-sm font-medium text-gray-600 mb-0">Churn Rate</p>
            <div className="w-8 h-8 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 leading-tight">{stats.churnRate.toFixed(1)}%</p>
          <div className="mt-0">
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
