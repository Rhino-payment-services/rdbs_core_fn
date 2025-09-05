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
  AlertTriangle
} from 'lucide-react'

interface CustomerStatsCardsProps {
  stats: {
    totalTransactions: number
    totalVolume: number
    avgTransactionValue: number
    successRate: number
    status: string
    joinDate: string
    kycStatus: string
    riskLevel: string
  }
}

const CustomerStatsCards = ({ stats }: CustomerStatsCardsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Suspended</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getKycStatusBadge = (kycStatus: string) => {
    switch (kycStatus) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Verified</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>
      case 'unverified':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Unverified</Badge>
      default:
        return <Badge variant="secondary">{kycStatus}</Badge>
    }
  }

  const getRiskLevelBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Low Risk</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Risk</Badge>
      case 'high':
        return <Badge className="bg-red-100 text-red-800 border-red-200">High Risk</Badge>
      default:
        return <Badge variant="secondary">{riskLevel}</Badge>
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          <div className="text-xs text-muted-foreground">
            All time transactions
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalVolume)}</div>
          <div className="text-xs text-muted-foreground">
            Total transaction value
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.avgTransactionValue)}</div>
          <div className="text-xs text-muted-foreground">
            Average per transaction
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.successRate}%</div>
          <div className="text-xs text-muted-foreground">
            Transaction success rate
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats Row */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Status</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            {getStatusBadge(stats.status)}
          </div>
          <div className="text-xs text-muted-foreground">
            Joined: {new Date(stats.joinDate).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">KYC Status</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            {getKycStatusBadge(stats.kycStatus)}
          </div>
          <div className="text-xs text-muted-foreground">
            Identity verification
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            {getRiskLevelBadge(stats.riskLevel)}
          </div>
          <div className="text-xs text-muted-foreground">
            Risk assessment
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Member Since</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.floor((new Date().getTime() - new Date(stats.joinDate).getTime()) / (1000 * 60 * 60 * 24))} days
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(stats.joinDate).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerStatsCards 