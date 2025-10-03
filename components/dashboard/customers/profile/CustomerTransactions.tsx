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
  ArrowDownLeft,
  ExternalLink,
  Eye
} from 'lucide-react'
import type { Transaction } from '@/lib/types/api'

interface CustomerTransactionsProps {
  transactions: Transaction[]
  onExport: () => void
  onFilter: () => void
  isLoading?: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const CustomerTransactions = ({ transactions, onExport, onFilter, isLoading, currentPage, totalPages, onPageChange }: CustomerTransactionsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getTransactionTypeIcon = (type: string) => {
    if (type.includes('DEPOSIT') || type.includes('WALLET_TO_WALLET')) {
      return <ArrowDownLeft className="h-4 w-4 text-green-600" />
    } else if (type.includes('WITHDRAWAL') || type.includes('BILL_PAYMENT')) {
      return <ArrowUpRight className="h-4 w-4 text-red-600" />
    } else {
      return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPartnerBadge = (transaction: Transaction) => {
    if (!transaction.partnerMapping?.partner) {
      return <Badge variant="outline">Direct</Badge>
    }

    const partner = transaction.partnerMapping.partner
    
    return (
      <div className="flex items-center gap-1">
        <ExternalLink className="h-3 w-3 text-blue-600" />
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          {partner.partnerCode}
        </Badge>
      </div>
    )
  }

  const getTransactionTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'DEPOSIT': 'Deposit',
      'WITHDRAWAL': 'Withdrawal',
      'WALLET_TO_WALLET': 'Wallet Transfer',
      'WALLET_TO_EXTERNAL_MERCHANT': 'Merchant Payment',
      'BILL_PAYMENT': 'Bill Payment',
      'MERCHANT_WITHDRAWAL': 'Merchant Withdrawal'
    }
    return typeLabels[type] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>Loading transaction history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Transaction History
        </CardTitle>
        <CardDescription>
          Complete transaction history for this customer
        </CardDescription>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onFilter}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No transactions found</p>
            <p className="text-sm text-gray-400">This customer hasn't made any transactions yet</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTransactionTypeIcon(transaction.type)}
                        <div>
                          <div className="font-medium text-sm">
                            {getTransactionTypeLabel(transaction.type)}
                          </div>
                          {transaction.description && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPartnerBadge(transaction)}
                      {transaction.partnerMapping?.partner && (
                        <div className="text-xs text-gray-500 mt-1">
                          {transaction.partnerMapping.partner.partnerName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {transaction.fee > 0 ? formatCurrency(transaction.fee) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.netAmount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-500">
                      {transaction.reference || transaction.externalReference || '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default CustomerTransactions
