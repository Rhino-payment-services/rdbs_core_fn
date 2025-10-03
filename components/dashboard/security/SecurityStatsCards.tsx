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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mb-4">
        <Card>
          <CardContent className="px-4 py-1">
            <div className="flex items-center justify-between mb-0">
              <p className="text-sm font-medium text-gray-600 mb-0">Flagged Transactions</p>
              <div className="w-8 h-8 flex items-center justify-center">
                <Radar className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 leading-tight">{stats.totalFlagged}</p>
            <div className="mt-0">
              <span className="text-sm text-gray-500">{stats.highRisk} high risk</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-1">
            <div className="flex items-center justify-between mb-0">
              <p className="text-sm font-medium text-gray-600 mb-0">Active Incidents</p>
              <div className="w-8 h-8 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 leading-tight">{stats.activeIncidents}</p>
            <div className="mt-0">
              <span className="text-sm text-gray-500">{stats.criticalIncidents} critical</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-1">
            <div className="flex items-center justify-between mb-0">
              <p className="text-sm font-medium text-gray-600 mb-0">Pending Review</p>
              <div className="w-8 h-8 flex items-center justify-center">
                <Clock className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 leading-tight">{stats.pendingReview}</p>
            <div className="mt-0">
              <span className="text-sm text-gray-500">Requires attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-4 py-1">
            <div className="flex items-center justify-between mb-0">
              <p className="text-sm font-medium text-gray-600 mb-0">Policy Compliance</p>
              <div className="w-8 h-8 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900 leading-tight">{stats.policiesCompliance}%</p>
            <div className="mt-0">
              <span className="text-sm text-gray-500">Overall compliance</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default SecurityStatsCards 