"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Download,
  Filter,
  Activity,
  LogIn,
  CreditCard,
  Shield,
  MapPin,
  Smartphone
} from 'lucide-react'

interface Activity {
  id: number
  type: string
  description: string
  timestamp: string
  ipAddress: string
  device: string
  location: string
}

interface CustomerActivityProps {
  activities: Activity[]
  onExport: () => void
  onFilter: () => void
}

const CustomerActivity = ({ activities, onExport, onFilter }: CustomerActivityProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <LogIn className="h-4 w-4 text-blue-600" />
      case 'transaction':
        return <CreditCard className="h-4 w-4 text-green-600" />
      case 'security':
        return <Shield className="h-4 w-4 text-red-600" />
      case 'profile':
        return <Activity className="h-4 w-4 text-purple-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case 'login':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Login</Badge>
      case 'transaction':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Transaction</Badge>
      case 'security':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Security</Badge>
      case 'profile':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Profile</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Recent activity and login history for this customer
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onFilter} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" onClick={onExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-32">Time</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead className="w-64">Description</TableHead>
                <TableHead className="w-32">IP Address</TableHead>
                <TableHead className="w-40">Device</TableHead>
                <TableHead className="w-40">Location</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{formatTimestamp(activity.timestamp)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.type)}
                      {getActivityTypeBadge(activity.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 max-w-64 truncate" title={activity.description}>
                      {activity.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono text-gray-600">{activity.ipAddress}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{activity.device}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{activity.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        Details
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

export default CustomerActivity 