"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Calendar,
  Shield,
  AlertTriangle,
  Ban
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'

interface CustomerStatsCardsProps {
  stats: {
    totalTransactions: number
    currentBalance: number
    suspensionFund: number // Change from avgTransactionValue
    successRate: number
    status: string
    joinDate: string
    kycStatus: string
    riskLevel: string
    currency: string
  }
}

const CustomerStatsCards = ({ stats }: CustomerStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Transactions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Current Balance */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Balance</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.currentBalance.toLocaleString()} {stats.currency}
              </p>
            </div>
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Suspension Fund */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suspension Fund</p>
              <p className="text-xl font-bold text-gray-900">
                {stats.suspensionFund.toLocaleString()} {stats.currency}
              </p>
            </div>
            <Shield className="h-6 w-6 text-red-600" />
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerStatsCards 