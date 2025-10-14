"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

interface SecurityIncidentsProps {
  securityIncidents: SecurityIncident[]
}

const SecurityIncidents = ({ securityIncidents }: SecurityIncidentsProps) => {
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
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
    <Card>
      <CardHeader>
        <CardTitle>Security Incidents</CardTitle>
        <CardDescription>
          Active and resolved security incidents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-32">Time</TableHead>
                <TableHead className="w-40">Type</TableHead>
                <TableHead className="w-32">Severity</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-64">Description</TableHead>
                <TableHead className="w-32">Affected Users</TableHead>
                <TableHead className="w-40">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securityIncidents.map((incident) => (
                <TableRow key={incident.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{formatTimestamp(incident.timestamp)}</div>
                      <div className="text-xs text-gray-500">{getRelativeTime(incident.timestamp)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getIncidentIcon(incident.type)}
                      <span className="text-sm capitalize">{incident.type.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(incident.severity)}
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      incident.status === 'active' ? 'bg-red-100 text-red-800' :
                      incident.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">{incident.description}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{incident.affectedUsers}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        Resolve
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default SecurityIncidents 