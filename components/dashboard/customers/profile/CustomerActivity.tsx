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
  Smartphone,
  DollarSign,
  AlertCircle
} from 'lucide-react'

interface ActivityLog {
  _id: string
  userId: string
  userEmail: string | null
  action: string
  category: string
  description: string
  status: string
  metadata: {
    transactionId?: string
    amount?: string
    currency?: string
    source?: string
    timestamp: string
    [key: string]: any
  }
  channel: string
  requestId: string
  createdAt: string
  updatedAt: string
}

interface CustomerActivityProps {
  activities: ActivityLog[]
  onExport: () => void
  onFilter: () => void
}

const CustomerActivity = ({ activities, onExport, onFilter }: CustomerActivityProps) => {
  const getActivityIcon = (category: string, action: string) => {
    if (category === 'TRANSACTION' || action.includes('TRANSACTION')) {
      return <CreditCard className="h-4 w-4 text-green-600" />
    }
    if (category === 'REVENUE' || action.includes('REVENUE')) {
      return <DollarSign className="h-4 w-4 text-yellow-600" />
    }
    if (action.includes('LOGIN') || action.includes('AUTH')) {
      return <LogIn className="h-4 w-4 text-blue-600" />
    }
    if (action.includes('SECURITY') || action.includes('SECURITY')) {
      return <Shield className="h-4 w-4 text-red-600" />
    }
    return <Activity className="h-4 w-4 text-gray-600" />
  }

  const getActivityTypeBadge = (category: string, action: string) => {
    if (category === 'TRANSACTION') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Transaction</Badge>
    }
    if (category === 'REVENUE') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Revenue</Badge>
    }
    if (action.includes('LOGIN')) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Login</Badge>
    }
    if (action.includes('SECURITY')) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Security</Badge>
    }
    return <Badge variant="secondary">{category}</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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
              Recent activity and transaction history for this customer
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-40">Time</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead className="w-48">Action</TableHead>
                <TableHead className="w-64">Description</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32">Channel</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity._id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">
                        {formatTimestamp(activity.metadata?.timestamp || activity.createdAt)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.category, activity.action)}
                      {getActivityTypeBadge(activity.category, activity.action)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-900">
                      {activity.action.replace(/_/g, ' ')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 max-w-64 truncate" title={activity.description}>
                      {activity.description}
                    </div>
                    {activity.metadata?.amount && (
                      <div className="text-xs text-gray-500 mt-1">
                        Amount: {activity.metadata.amount} {activity.metadata.currency || 'UGX'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(activity.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{activity.channel}</span>
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