"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface FlaggedTransaction {
  id: number
  timestamp: string
  transactionId: string
  user: string
  amount: number
  currency: string
  riskLevel: string
  status: string
  reason: string
  ip: string
  location: string
  device: string
  riskScore: number
  flags: string[]
  description: string
  action: string
  metadata: any
}

interface SecurityRadarProps {
  flaggedTransactions: FlaggedTransaction[]
  searchTerm: string
  selectedStatus: string
  selectedRisk: string
  timeRange: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onRiskChange: (value: string) => void
  onTimeRangeChange: (value: string) => void
}

const SecurityRadar = ({
  flaggedTransactions,
  searchTerm,
  selectedStatus,
  selectedRisk,
  timeRange,
  onSearchChange,
  onStatusChange,
  onRiskChange,
  onTimeRangeChange
}: SecurityRadarProps) => {
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set())

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800 border-red-200">High Risk</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Medium Risk</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Low Risk</Badge>
      default:
        return <Badge variant="secondary">{level}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'flagged':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Flagged</Badge>
      case 'reviewed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Reviewed</Badge>
      case 'cleared':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Cleared</Badge>
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Blocked</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
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

  const toggleRowExpansion = (id: number) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id)
    } else {
      newExpandedRows.add(id)
    }
    setExpandedRows(newExpandedRows)
  }

  const filteredTransactions = flaggedTransactions.filter(transaction => {
    const matchesSearch = transaction.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === "all" || transaction.status === selectedStatus
    const matchesRisk = selectedRisk === "all" || transaction.riskLevel === selectedRisk
    
    return matchesSearch && matchesStatus && matchesRisk
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flagged Transactions</CardTitle>
        <CardDescription>
          Transactions flagged by security radar for review
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search flagged transactions..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="cleared">Cleared</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedRisk} onValueChange={onRiskChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Flagged Transactions Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-32">Time</TableHead>
                <TableHead className="w-40">Transaction ID</TableHead>
                <TableHead className="w-48">User</TableHead>
                <TableHead className="w-32">Amount</TableHead>
                <TableHead className="w-32">Risk Level</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-32">Risk Score</TableHead>
                <TableHead className="w-48">Reason</TableHead>
                <TableHead className="w-32">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <React.Fragment key={transaction.id}>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(transaction.id)}
                        className="h-6 w-6 p-0"
                      >
                        {expandedRows.has(transaction.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{formatTimestamp(transaction.timestamp)}</div>
                        <div className="text-xs text-gray-500">{getRelativeTime(transaction.timestamp)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{transaction.transactionId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium truncate max-w-32">{transaction.user}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{formatCurrency(transaction.amount)}</div>
                    </TableCell>
                    <TableCell>
                      {getRiskLevelBadge(transaction.riskLevel)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              transaction.riskScore > 70 ? 'bg-red-500' : 
                              transaction.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${transaction.riskScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{transaction.riskScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-40 truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                          Review
                        </Button>
                        <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                          Block
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(transaction.id) && (
                    <TableRow>
                      <TableCell colSpan={10} className="bg-gray-50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-3">Transaction Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">IP Address:</span>
                                <span className="font-mono text-xs">{transaction.ip}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Location:</span>
                                <span className="text-xs">{transaction.location}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Device:</span>
                                <span className="text-xs">{transaction.device}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Action:</span>
                                <span className="text-xs capitalize">{transaction.action}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 mb-3">Risk Flags</h4>
                            <div className="space-y-2">
                              {transaction.flags.map((flag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {flag.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                            <h4 className="font-medium text-gray-700 mb-3 mt-4">Metadata</h4>
                            <div className="space-y-2 text-sm">
                              {transaction.metadata && Object.entries(transaction.metadata).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                  <span className="text-xs">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default SecurityRadar 