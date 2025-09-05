"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  RefreshCw,
  Download,
  Radar,
  AlertTriangle,
  Clock,
  ShieldCheck
} from 'lucide-react'

interface SecurityStatsCardsProps {
  stats: {
    totalFlagged: number
    highRisk: number
    pendingReview: number
    blocked: number
    totalIncidents: number
    activeIncidents: number
    criticalIncidents: number
    policiesCompliance: number
  }
  onRefresh: () => void
  onExport: () => void
}

const SecurityStatsCards = ({ stats, onRefresh, onExport }: SecurityStatsCardsProps) => {
  return (
    <>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Dashboard</h1>
          <p className="text-gray-600">Monitor security threats, flagged transactions, and system protection</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={onExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Transactions</CardTitle>
            <Radar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFlagged}</div>
            <div className="text-xs text-muted-foreground">
              {stats.highRisk} high risk
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.activeIncidents}</div>
            <div className="text-xs text-muted-foreground">
              {stats.criticalIncidents} critical
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</div>
            <div className="text-xs text-muted-foreground">
              Requires attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policy Compliance</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.policiesCompliance}%</div>
            <div className="text-xs text-muted-foreground">
              Overall compliance
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default SecurityStatsCards 