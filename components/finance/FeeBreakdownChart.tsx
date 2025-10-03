"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DollarSign, TrendingUp, Users, Activity } from 'lucide-react'

interface FeeBreakdownData {
  totalFees: number;
  rukapayRevenue: number;
  partnerRevenue: number;
  governmentTax: number;
  processingFees: number;
  networkFees: number;
  complianceFees: number;
  transactionCount: number;
}

interface FeeBreakdownChartProps {
  data: FeeBreakdownData;
  isLoading?: boolean;
}

const FeeBreakdownChart: React.FC<FeeBreakdownChartProps> = ({ data, isLoading }) => {
  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Prepare pie chart data
  const pieData = [
    { name: 'RukaPay Revenue', value: data.rukapayRevenue, color: '#3b82f6' },
    { name: 'Partner Revenue', value: data.partnerRevenue, color: '#f59e0b' },
    { name: 'Government Tax', value: data.governmentTax, color: '#ef4444' },
    { name: 'Processing Fees', value: data.processingFees, color: '#8b5cf6' },
    { name: 'Network Fees', value: data.networkFees, color: '#06b6d4' },
    { name: 'Compliance Fees', value: data.complianceFees, color: '#84cc16' },
  ].filter(item => item.value > 0)

  // Prepare bar chart data for comparison
  const barData = [
    {
      category: 'Revenue',
      RukaPay: data.rukapayRevenue,
      Partners: data.partnerRevenue,
      Government: data.governmentTax,
    }
  ]

  // Calculate percentages
  const rukapayPercentage = data.totalFees > 0 ? (data.rukapayRevenue / data.totalFees * 100).toFixed(1) : '0'
  const partnerPercentage = data.totalFees > 0 ? (data.partnerRevenue / data.totalFees * 100).toFixed(1) : '0'
  const taxPercentage = data.totalFees > 0 ? (data.governmentTax / data.totalFees * 100).toFixed(1) : '0'

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fee Distribution</CardTitle>
            <CardDescription>Loading fee breakdown...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue Analysis</CardTitle>
            <CardDescription>Loading revenue data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">RukaPay Revenue</p>
                <p className="text-lg font-bold text-blue-600">{formatAmount(data.rukapayRevenue)}</p>
                <p className="text-xs text-gray-500">{rukapayPercentage}% of total</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Partner Revenue</p>
                <p className="text-lg font-bold text-orange-600">{formatAmount(data.partnerRevenue)}</p>
                <p className="text-xs text-gray-500">{partnerPercentage}% of total</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Government Tax</p>
                <p className="text-lg font-bold text-red-600">{formatAmount(data.governmentTax)}</p>
                <p className="text-xs text-gray-500">{taxPercentage}% of total</p>
              </div>
              <TrendingUp className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-lg font-bold text-purple-600">{data.transactionCount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Processed</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Distribution</CardTitle>
            <CardDescription>Breakdown of fee components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatAmount(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Analysis</CardTitle>
            <CardDescription>Revenue distribution by stakeholder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* RukaPay Revenue */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="font-medium text-blue-900">RukaPay Revenue</p>
                    <p className="text-sm text-blue-700">Our service fees</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-900">{formatAmount(data.rukapayRevenue)}</p>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {rukapayPercentage}%
                  </Badge>
                </div>
              </div>

              {/* Partner Revenue */}
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                  <div>
                    <p className="font-medium text-orange-900">Partner Revenue</p>
                    <p className="text-sm text-orange-700">Third-party fees</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-900">{formatAmount(data.partnerRevenue)}</p>
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    {partnerPercentage}%
                  </Badge>
                </div>
              </div>

              {/* Government Tax */}
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <div>
                    <p className="font-medium text-red-900">Government Tax</p>
                    <p className="text-sm text-red-700">VAT, WHT, Agent tax</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-900">{formatAmount(data.governmentTax)}</p>
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    {taxPercentage}%
                  </Badge>
                </div>
              </div>

              {/* Additional Fees (if any) */}
              {(data.processingFees > 0 || data.networkFees > 0 || data.complianceFees > 0) && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Additional Fees</p>
                  <div className="space-y-2 text-sm">
                    {data.processingFees > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Fees</span>
                        <span className="font-medium">{formatAmount(data.processingFees)}</span>
                      </div>
                    )}
                    {data.networkFees > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Network Fees</span>
                        <span className="font-medium">{formatAmount(data.networkFees)}</span>
                      </div>
                    )}
                    {data.complianceFees > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Compliance Fees</span>
                        <span className="font-medium">{formatAmount(data.complianceFees)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total Fees</span>
                  <span className="font-bold text-lg text-gray-900">{formatAmount(data.totalFees)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FeeBreakdownChart
