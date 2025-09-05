"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShieldAlert,
  AlertTriangle,
  ShieldX
} from 'lucide-react'

interface SecurityIncident {
  id: number
  timestamp: string
  type: string
  severity: string
  status: string
  description: string
  affectedUsers: number
  ipAddresses: string[]
  location: string
  action: string
  metadata: any
}

interface SecurityOverviewProps {
  activeIncidents: number
  securityIncidents: SecurityIncident[]
}

const SecurityOverview = ({ activeIncidents, securityIncidents }: SecurityOverviewProps) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Low</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'brute_force':
        return <ShieldX className="h-4 w-4 text-red-600" />
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'data_breach_attempt':
        return <ShieldAlert className="h-4 w-4 text-red-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
    }
  }

  const getRelativeTime = (timestamp: string) => {
    const now = new Date()
    const logTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - logTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Security Status */}
      <Card>
        <CardHeader>
          <CardTitle>Security Status</CardTitle>
          <CardDescription>Current security posture and threats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">System Status</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Secure</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Threat Level</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Active Threats</span>
              </div>
              <Badge className="bg-red-100 text-red-800">{activeIncidents}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest security events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityIncidents.slice(0, 3).map((incident) => (
              <div key={incident.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                {getIncidentIcon(incident.type)}
                <div className="flex-1">
                  <div className="text-sm font-medium">{incident.description}</div>
                  <div className="text-xs text-gray-500">{getRelativeTime(incident.timestamp)}</div>
                </div>
                {getSeverityBadge(incident.severity)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SecurityOverview 