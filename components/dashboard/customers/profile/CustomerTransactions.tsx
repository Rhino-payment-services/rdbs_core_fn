"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Download,
  Filter,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react'

interface Transaction {
  id: number
  type: string
  amount: number
  fee: number
  status: string
  date: string
  sender: {
    id: number
    name: string
    type: string
    phone: string
  }
  receiver: {
    id: number
    name: string
    type: string
    phone: string
  }
  reference: string
  description: string
}

interface CustomerTransactionsProps {
  transactions: Transaction[]
  onExport: () => void
  onFilter: () => void
}

const CustomerTransactions = ({ transactions, onExport, onFilter }: CustomerTransactionsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTransactionTypeIcon = (type: string) => {
    if (type.includes('Wallet to Wallet')) {
      return <ArrowUpRight className="h-4 w-4 text-blue-600" />
    } else if (type.includes('Mobile Money')) {
      return <ArrowDownLeft className="h-4 w-4 text-green-600" />
    } else {
      return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>
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
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Complete transaction history for this customer
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
                <TableHead className="w-40">Type</TableHead>
                <TableHead className="w-32">Amount</TableHead>
                <TableHead className="w-32">Fee</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-40">Reference</TableHead>
                <TableHead className="w-64">Description</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{formatTimestamp(transaction.date)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTransactionTypeIcon(transaction.type)}
                      <span className="text-sm">{transaction.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{formatCurrency(transaction.amount)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">{formatCurrency(transaction.fee)}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transaction.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">{transaction.reference}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 max-w-64 truncate" title={transaction.description}>
                      {transaction.description}
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

export default CustomerTransactions 