"use client"

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, AlertTriangle } from 'lucide-react'
import { TransactionTableRow } from './TransactionTableRow'
import { PageStats } from './PageStats'
import { Pagination } from './Pagination'

interface TransactionTableProps {
  transactions: any[]
  isLoading: boolean
  error: any
  pageStats: {
    totalCount: number
    totalVolume: number
    rukapayFees: number
    partnerFees: number
    governmentTaxes: number
    totalFees: number
    successfulCount: number
  }
  currentPage: number
  totalPages: number
  pageSize: number
  totalTransactions: number
  onViewTransaction: (transaction: any) => void
  onReverseTransaction: (transaction: any) => void
  onPageChange: (page: number) => void
}

export const TransactionTable = ({
  transactions,
  isLoading,
  error,
  pageStats,
  currentPage,
  totalPages,
  pageSize,
  totalTransactions,
  onViewTransaction,
  onReverseTransaction,
  onPageChange
}: TransactionTableProps) => {
  return (
    <div className="rounded-md">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading transactions...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertTriangle className="h-8 w-8 mr-2" />
          <span>Failed to load transactions</span>
        </div>
      ) : (
        <>
          <PageStats stats={pageStats} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>RukaPay Fee</TableHead>
                <TableHead>Net Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction: any) => (
                <TransactionTableRow
                  key={transaction.id}
                  transaction={transaction}
                  onViewTransaction={onViewTransaction}
                  onReverseTransaction={onReverseTransaction}
                />
              ))}
            </TableBody>
          </Table>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalTransactions={totalTransactions}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  )
}
