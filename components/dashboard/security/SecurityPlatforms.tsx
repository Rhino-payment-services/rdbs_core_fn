"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Smartphone,
  Monitor,
  Server,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface PlatformStatus {
  id: number
  name: string
  type: string
  status: string
  uptime: number
  lastCheck: string
  responseTime: number
  users: number
  version: string
  environment: string
  health: string
  issues: string[]
}

interface SecurityPlatformsProps {
  platformStatus: PlatformStatus[]
}

const SecurityPlatforms = ({ platformStatus }: SecurityPlatformsProps) => {
  const getPlatformStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case 'down':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Down</Badge>
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Maintenance</Badge>
      case 'degraded':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Degraded</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>
      case 'fair':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Fair</Badge>
      case 'poor':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Poor</Badge>
      default:
        return <Badge variant="secondary">{health}</Badge>
    }
  }

  const getPlatformIcon = (type: string) => {
    switch (type) {
      case 'Mobile Application':
        return <Smartphone className="h-4 w-4" />
      case 'Web Application':
        return <Monitor className="h-4 w-4" />
      case 'API Service':
        return <Server className="h-4 w-4" />
      case 'Backend Service':
        return <Database className="h-4 w-4" />
      case 'Database':
        return <Database className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
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
    <div className="space-y-6">
      {/* Platform Status */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Status</CardTitle>
          <CardDescription>
            Real-time status of all RukaPay platforms and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-48">Platform</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-32">Health</TableHead>
                  <TableHead className="w-32">Uptime</TableHead>
                  <TableHead className="w-32">Response Time</TableHead>
                  <TableHead className="w-32">Active Users</TableHead>
                  <TableHead className="w-32">Version</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platformStatus.map((platform) => (
                  <TableRow key={platform.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getPlatformIcon(platform.type)}
                        <div>
                          <div className="text-sm font-medium">{platform.name}</div>
                          <div className="text-xs text-gray-500">{platform.environment}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">{platform.type}</div>
                    </TableCell>
                    <TableCell>
                      {getPlatformStatusBadge(platform.status)}
                    </TableCell>
                    <TableCell>
                      {getHealthBadge(platform.health)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{platform.uptime}%</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{platform.responseTime}ms</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{platform.users.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">{platform.version}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                          Details
                        </Button>
                        <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                          Monitor
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

      {/* Platform Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Issues</CardTitle>
          <CardDescription>
            Current issues and maintenance notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platformStatus.filter(platform => platform.issues.length > 0).map((platform) => (
              <div key={platform.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium">{platform.name}</h3>
                    {getHealthBadge(platform.health)}
                  </div>
                  <div className="space-y-1">
                    {platform.issues.map((issue, index) => (
                      <p key={index} className="text-sm text-gray-600">{issue}</p>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Last checked: {getRelativeTime(platform.lastCheck)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                    Investigate
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
            {platformStatus.filter(platform => platform.issues.length === 0).length === platformStatus.length && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">All platforms are running smoothly</p>
                <p className="text-sm">No issues detected</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SecurityPlatforms 