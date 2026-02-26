"use client"

import React, { useState, useCallback, useEffect } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTransactionSystemStats, useAllTransactions, useChannelStatistics } from '@/lib/hooks/useTransactions'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import { getChannelDisplay } from '@/lib/utils/transactions'

// Import extracted components
import { TransactionStatsCards } from '@/components/dashboard/transactions/TransactionStatsCards'
import { ChannelStatistics } from '@/components/dashboard/transactions/ChannelStatistics'
import { DateRangeFilter } from '@/components/dashboard/transactions/DateRangeFilter'
import { TransactionFilters } from '@/components/dashboard/transactions/TransactionFilters'
import { TransactionTable } from '@/components/dashboard/transactions/TransactionTable'
import { TransactionDetailsModal } from '@/components/dashboard/transactions/TransactionDetailsModal'
import { ReversalModal } from '@/components/dashboard/transactions/ReversalModal'
import { ExportDialog } from '@/components/dashboard/transactions/ExportDialog'

const TransactionsPage = () => {
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Reversal modal state
  const [reversalModalOpen, setReversalModalOpen] = useState(false)
  const [reversalTransaction, setReversalTransaction] = useState<any>(null)
  const [reversalReason, setReversalReason] = useState('')
  const [reversalDetails, setReversalDetails] = useState('')
  const [reversalTicketRef, setReversalTicketRef] = useState('')
  const [reversalProcessing, setReversalProcessing] = useState(false)
  
  // Export state
  const [isExporting, setIsExporting] = useState(false)
  const [exportDateRangeOpen, setExportDateRangeOpen] = useState(false)
  const [exportStartDate, setExportStartDate] = useState("")
  const [exportEndDate, setExportEndDate] = useState("")

  // Fetch real transaction system stats with filters
  const { data: transactionStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useTransactionSystemStats({
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined
  })

  // Fetch channel statistics
  const { data: channelStatsData, isLoading: channelStatsLoading } = useChannelStatistics(
    startDate || undefined,
    endDate || undefined
  )

  // Fetch paginated transactions
  const { 
    data: transactionsData, 
    isLoading: transactionsLoading, 
    error: transactionsError 
  } = useAllTransactions({
    page: currentPage,
    limit: pageSize,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined
  })
  
  // Get stats data
  const stats = transactionStats || {
    totalTransactions: 0,
    totalVolume: 0,
    totalFees: 0,
    rukapayRevenue: 0,
    partnerFees: 0,
    governmentTaxes: 0,
    successRate: 0,
    averageTransactionAmount: 0,
    transactionsByType: {},
    transactionsByStatus: {},
    transactionsByCurrency: {}
  }

  // Get transactions data and filter out WALLET_INIT
  const allTransactions = (transactionsData as any)?.transactions || []
  const transactionsWithoutInit = allTransactions.filter((tx: any) => tx.type !== 'WALLET_INIT')
  
  // Filter transactions by search term (sender name, receiver name, transaction ID)
  const filteredTransactions = searchTerm ? transactionsWithoutInit.filter((tx: any) => {
    try {
      const searchLower = searchTerm.toLowerCase().trim()
      
      if (!searchLower) return true
      
      // Search by transaction ID
      const matchesId = (tx?.id?.toLowerCase().includes(searchLower) || false) || 
                        (tx?.reference?.toLowerCase().includes(searchLower) || false)
      
      if (matchesId) return true
      
      // Get sender name - for DEBIT (outgoing), sender is the wallet owner
      let senderName = ''
      // Check if admin funded the wallet
      if (tx.type === 'DEPOSIT' && tx.metadata?.fundedByAdmin) {
        senderName = (tx.metadata?.adminName?.toLowerCase() || 'admin')
      } else if (tx.direction === 'DEBIT') {
        if (tx.user && tx.user.profile && tx.user.profile.firstName && tx.user.profile.lastName) {
          senderName = `${tx.user.profile.firstName} ${tx.user.profile.lastName}`.toLowerCase()
        } else if (tx.user) {
          senderName = (tx.user.phone?.toLowerCase() || tx.user.email?.toLowerCase() || '')
        }
      } else {
        // For INCOMING transactions, sender is the external party
        senderName = (
          tx.metadata?.counterpartyInfo?.name?.toLowerCase() || 
          tx.metadata?.merchantName?.toLowerCase() || 
          tx.metadata?.userName?.toLowerCase() || 
          tx.metadata?.mnoProvider?.toLowerCase() || 
          (tx.counterpartyUser && tx.counterpartyUser.profile && tx.counterpartyUser.profile.firstName && tx.counterpartyUser.profile.lastName
            ? `${tx.counterpartyUser.profile.firstName} ${tx.counterpartyUser.profile.lastName}`.toLowerCase()
            : '')
        )
      }
      
      // Get receiver name - for DEPOSIT, receiver is the RukaPay user; for DEBIT (outgoing), receiver is the external party
      let receiverName = ''
      if (tx.type === 'DEPOSIT' && tx.metadata?.fundedByAdmin) {
        // For admin-funded deposits, receiver is the RukaPay user receiving funds
        if (tx.user && tx.user.profile && tx.user.profile.firstName && tx.user.profile.lastName) {
          receiverName = `${tx.user.profile.firstName} ${tx.user.profile.lastName}`.toLowerCase()
        } else if (tx.user) {
          receiverName = (tx.user.phone?.toLowerCase() || tx.user.email?.toLowerCase() || 'rukapay user')
        }
      } else if (tx.direction === 'DEBIT') {
        // For outgoing, receiver could be counterparty user, merchant, or external
        if (tx.counterpartyUser && tx.counterpartyUser.profile && tx.counterpartyUser.profile.firstName && tx.counterpartyUser.profile.lastName) {
          receiverName = `${tx.counterpartyUser.profile.firstName} ${tx.counterpartyUser.profile.lastName}`.toLowerCase()
        } else {
          receiverName = (
            tx.metadata?.counterpartyInfo?.name?.toLowerCase() || 
            tx.metadata?.merchantName?.toLowerCase() || 
            tx.metadata?.userName?.toLowerCase() || 
            tx.metadata?.recipientName?.toLowerCase() || 
            ''
          )
        }
      } else {
        // For INCOMING transactions, receiver is the wallet owner
        if (tx.user && tx.user.profile && tx.user.profile.firstName && tx.user.profile.lastName) {
          receiverName = `${tx.user.profile.firstName} ${tx.user.profile.lastName}`.toLowerCase()
        } else if (tx.user) {
          receiverName = (tx.user.phone?.toLowerCase() || tx.user.email?.toLowerCase() || '')
        }
      }
      
      // Check if search term matches any of these
      return senderName.includes(searchLower) || receiverName.includes(searchLower)
    } catch (error) {
      // If there's an error accessing properties, include the transaction if ID matches
      console.error('Error filtering transaction:', error, tx)
      const searchLower = searchTerm.toLowerCase().trim()
      return (tx?.id?.toLowerCase().includes(searchLower) || false) || 
             (tx?.reference?.toLowerCase().includes(searchLower) || false)
    }
  }) : transactionsWithoutInit
  
  const transactions = filteredTransactions
  const totalTransactions = (transactionsData as any)?.total || 0
  const totalPages = (transactionsData as any)?.totalPages || 1

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchTerm("")
    setStatusFilter("")
    setTypeFilter("")
    setStartDate("")
    setEndDate("")
    setCurrentPage(1)
  }, [])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle filter change
  const handleFilterChange = useCallback(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [])

  // Refetch stats when date filters change
  useEffect(() => {
    if (startDate || endDate) {
      refetchStats()
    }
  }, [startDate, endDate, refetchStats])

  // Handle view transaction details
  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction)
    setIsModalOpen(true)
  }

  // Handle reversal request
  const handleReverseTransaction = (transaction: any) => {
    setReversalTransaction(transaction)
    setReversalReason('')
    setReversalDetails('')
    setReversalTicketRef('')
    setReversalModalOpen(true)
  }

  // Submit reversal
  const submitReversal = async () => {
    if (!reversalReason || !reversalDetails) {
      toast.error('Please provide reversal reason and details')
      return
    }

    setReversalProcessing(true)
    try {
      const response = await fetch('/api/transactions/reversal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: reversalTransaction.id,
          reason: reversalReason,
          details: reversalDetails,
          ticketReference: reversalTicketRef || undefined
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        toast.success(result.message || 'Reversal request submitted successfully!')
        setReversalModalOpen(false)
        // Reset form
        setReversalReason('')
        setReversalDetails('')
        setReversalTicketRef('')
        // Refresh transactions list
        setTimeout(() => {
          window.location.reload()
        }, 1000) // Small delay to show the success message
      } else {
        toast.error(result.error || 'Failed to submit reversal request')
      }
    } catch (error) {
      console.error('Reversal error:', error)
      toast.error('An error occurred while submitting reversal request')
    } finally {
      setReversalProcessing(false)
    }
  }

  // Export transactions to CSV
  const exportTransactionsToCSV = async (exportAll: boolean = false, customStartDate?: string, customEndDate?: string) => {
    setIsExporting(true)
    try {
      let transactionsToExport = transactions
      
      // Use custom dates if provided, otherwise use current filters
      const exportStart = customStartDate || startDate
      const exportEnd = customEndDate || endDate
      
      if (exportAll) {
        // Fetch all transactions with current filters
        const response = await api({
          url: '/transactions/all',
          method: 'GET',
          params: {
            limit: 10000, // Large limit to get all transactions
            status: statusFilter || undefined,
            type: typeFilter || undefined,
            startDate: exportStart || undefined,
            endDate: exportEnd || undefined,
          },
        })
        
        transactionsToExport = response.data?.transactions || response.data?.data || []
        
        // Filter out WALLET_INIT
        transactionsToExport = transactionsToExport.filter((tx: any) => tx.type !== 'WALLET_INIT')
        
        // Apply search filter if exists
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          transactionsToExport = transactionsToExport.filter((tx: any) => {
            const matchesId = tx.id?.toLowerCase().includes(searchLower) || 
                              tx.reference?.toLowerCase().includes(searchLower)
            
            const senderName = tx.direction === 'DEBIT' 
              ? (tx.user?.profile?.firstName && tx.user?.profile?.lastName 
                  ? `${tx.user.profile.firstName} ${tx.user.profile.lastName}`.toLowerCase()
                  : tx.user?.phone?.toLowerCase() || tx.user?.email?.toLowerCase() || '')
              : (tx.metadata?.counterpartyInfo?.name?.toLowerCase() || 
                 tx.metadata?.merchantName?.toLowerCase() || 
                 tx.metadata?.userName?.toLowerCase() || '')
            
            const receiverName = tx.direction === 'DEBIT'
              ? (tx.metadata?.counterpartyInfo?.name?.toLowerCase() || 
                 tx.metadata?.merchantName?.toLowerCase() || 
                 tx.metadata?.userName?.toLowerCase() || 
                 tx.counterpartyUser?.profile?.firstName && tx.counterpartyUser?.profile?.lastName
                   ? `${tx.counterpartyUser.profile.firstName} ${tx.counterpartyUser.profile.lastName}`.toLowerCase()
                   : '')
              : (tx.user?.profile?.firstName && tx.user?.profile?.lastName 
                  ? `${tx.user.profile.firstName} ${tx.user.profile.lastName}`.toLowerCase()
                  : tx.user?.phone?.toLowerCase() || tx.user?.email?.toLowerCase() || '')
            
            return matchesId || senderName.includes(searchLower) || receiverName.includes(searchLower)
          })
        }
        
        if (transactionsToExport.length === 0) {
          toast.error('No transactions to export')
          setIsExporting(false)
          return
        }
      } else {
        // Export current page only
        if (transactions.length === 0) {
          toast.error('No transactions on current page to export')
          setIsExporting(false)
          return
        }
      }

      // Helper: get partner label for CSV/export
      const getPartnerLabel = (tx: any) => {
        // 1) External payment partners (ABC, PEGASUS, etc.) via PartnerMapping
        if (tx.partnerMapping?.partner?.partnerCode) {
          return tx.partnerMapping.partner.partnerCode
        }

        // 2) API partners (gateway partners) – baseTransactionService adds apiPartnerName into metadata
        if (tx.metadata?.apiPartnerName) {
          return tx.metadata.apiPartnerName
        }

        // 3) Direct ApiPartner relation on the transaction (fallback)
        if (tx.partner?.partnerName) {
          return tx.partner.partnerName
        }

        // 4) Any other metadata-based partner name
        if (tx.metadata?.partnerName) {
          return tx.metadata.partnerName
        }

        // 5) Default when no partner info is attached (purely internal)
        return 'Direct'
      }

      // Define CSV headers
      const headers = [
        'Reference',
        'External Reference',
        'Transaction ID',
        'Type',
        'Channel',
        'Status',
        'Direction',
        'Amount',
        'Currency',
        'Fee',
        'Net Amount',
        'Sender Name',
        'Sender Contact',
        'Receiver Name',
        'Receiver Contact',
        'Partner',
        'Date & Time',
        'Description',
        'Error Message'
      ]
      
      // Convert transactions to CSV rows
      const csvRows = transactionsToExport.map((tx: any) => {
        // Get sender info
        const senderName = tx.type === 'DEPOSIT' && tx.metadata?.fundedByAdmin
          ? (tx.metadata.adminName || 'Admin User')
          : tx.direction === 'DEBIT' 
            ? (tx.user?.profile?.firstName && tx.user?.profile?.lastName 
                ? `${tx.user.profile.firstName} ${tx.user.profile.lastName}`
                : 'Unknown User')
            : (tx.metadata?.counterpartyInfo?.name || 'External')
        
        const senderContact = tx.type === 'DEPOSIT' && tx.metadata?.fundedByAdmin
          ? (tx.metadata.adminPhone || tx.metadata.adminEmail || 'Admin')
          : tx.direction === 'DEBIT'
            ? (tx.user?.phone || tx.user?.email || 'N/A')
            : (tx.metadata?.counterpartyInfo?.accountNumber || tx.metadata?.counterpartyInfo?.phone || 'N/A')
        
        // Get receiver info
        const receiverName = tx.type === 'DEPOSIT' && tx.metadata?.fundedByAdmin
          ? (tx.user?.profile?.firstName && tx.user?.profile?.lastName 
              ? `${tx.user.profile.firstName} ${tx.user.profile.lastName}`
              : tx.user?.phone || tx.user?.email || 'RukaPay User')
          : tx.direction === 'DEBIT'
            ? (tx.metadata?.counterpartyInfo?.name || 'External')
            : (tx.user?.profile?.firstName && tx.user?.profile?.lastName 
                ? `${tx.user.profile.firstName} ${tx.user.profile.lastName}`
                : 'Unknown User')
        
        const receiverContact = tx.type === 'DEPOSIT' && tx.metadata?.fundedByAdmin
          ? (tx.user?.phone || tx.user?.email || 'N/A')
          : tx.direction === 'DEBIT'
            ? (tx.metadata?.counterpartyInfo?.accountNumber || tx.metadata?.counterpartyInfo?.phone || 'N/A')
            : (tx.user?.phone || tx.user?.email || 'N/A')
        
        // Format date
        const dateTime = tx.createdAt 
          ? new Date(tx.createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          : 'N/A'
        
        // Escape commas and quotes in CSV values
        const escapeCSV = (value: any) => {
          const str = value?.toString() || 'N/A'
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }
        
        return [
          escapeCSV(tx.reference || tx.id),
          escapeCSV(tx.externalReference || ''),
          escapeCSV(tx.id),
          escapeCSV(tx.type || 'N/A'),
          escapeCSV(getChannelDisplay(tx.channel, tx.metadata).label),
          escapeCSV(tx.status || 'N/A'),
          escapeCSV(tx.direction || 'N/A'),
          escapeCSV(Number(tx.amount) || 0),
          escapeCSV(tx.currency || 'UGX'),
          escapeCSV(Number(tx.fee) || 0),
          escapeCSV(Number(tx.netAmount) || Number(tx.amount) || 0),
          escapeCSV(senderName),
          escapeCSV(senderContact),
          escapeCSV(receiverName),
          escapeCSV(receiverContact),
          escapeCSV(getPartnerLabel(tx)),
          escapeCSV(dateTime),
          escapeCSV(tx.description || 'N/A'),
          escapeCSV(tx.errorMessage || 'N/A')
        ].join(',')
      })
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...csvRows
      ].join('\n')
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      const exportType = exportAll ? 'all' : 'current_page'
      const dateStr = exportStart && exportEnd 
        ? `${exportStart}_to_${exportEnd}`.replace(/\//g, '-')
        : new Date().toISOString().split('T')[0]
      link.setAttribute('download', `transactions_${exportType}_${dateStr}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success(`Exported ${transactionsToExport.length} transaction(s) as CSV`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export transactions')
    } finally {
      setIsExporting(false)
    }
  }

  // Calculate enhanced fee statistics from current page
  // Count fees from ALL transactions (fees are charged regardless of status)
  // Only count volume from SUCCESS transactions
  const pageStats = transactions.reduce((acc: any, tx: any) => {
    // Fees are charged regardless of transaction status
    acc.totalFees += Number(tx.fee) || 0
    acc.rukapayFees += Number(tx.rukapayFee) || 0
    acc.partnerFees += Number(tx.thirdPartyFee) || 0
    acc.governmentTaxes += Number(tx.governmentTax) || 0
    
    // Only count volume and success count for successful transactions
    if (tx.status === 'SUCCESS') {
      acc.totalVolume += Number(tx.amount) || 0
      acc.successfulCount += 1
    }
    acc.totalCount += 1
    return acc
  }, { 
    totalFees: 0, 
    rukapayFees: 0, 
    partnerFees: 0, 
    governmentTaxes: 0, 
    totalVolume: 0, 
    successfulCount: 0, 
    totalCount: 0 
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Ledgers</h1>
              <p className="mt-2 text-gray-600">Investigate and analyze transaction information</p>
            </div>
            
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={(date) => {
                setStartDate(date)
                handleFilterChange()
              }}
              onEndDateChange={(date) => {
                setEndDate(date)
                handleFilterChange()
              }}
              onClear={() => {
                setStartDate("")
                setEndDate("")
                handleFilterChange()
              }}
            />
          </div>

          {/* Stats Cards */}
          <TransactionStatsCards stats={stats} isLoading={statsLoading} />

          {/* Channel Statistics */}
          <ChannelStatistics
            channelStatsData={channelStatsData}
            isLoading={channelStatsLoading}
            startDate={startDate}
            endDate={endDate}
          />

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Management</CardTitle>
              <CardDescription>
                {searchTerm ? (
                  <span>
                    Showing {transactions.length} result{transactions.length !== 1 ? 's' : ''} for "{searchTerm}" 
                    {transactions.length === 0 && transactionsWithoutInit.length > 0 && (
                      <span className="text-orange-600"> (search limited to current page)</span>
                    )}
                  </span>
                ) : (
                  'View and manage different types of transactions'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={(value) => {
                  setStatusFilter(value)
                  handleFilterChange()
                }}
                typeFilter={typeFilter}
                onTypeFilterChange={(value) => {
                  setTypeFilter(value)
                  handleFilterChange()
                }}
                pageSize={pageSize}
                onPageSizeChange={(value) => {
                  setPageSize(value)
                  setCurrentPage(1)
                }}
                onResetFilters={resetFilters}
                isExporting={isExporting}
                onExportCurrentPage={() => exportTransactionsToCSV(false)}
                onExportAll={() => exportTransactionsToCSV(true)}
                onExportByDateRange={() => setExportDateRangeOpen(true)}
                transactionsCount={transactions.length}
              />

              <TransactionTable
                transactions={transactions}
                isLoading={transactionsLoading}
                error={transactionsError}
                pageStats={pageStats}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalTransactions={totalTransactions}
                onViewTransaction={handleViewTransaction}
                onReverseTransaction={handleReverseTransaction}
                onPageChange={handlePageChange}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        transaction={selectedTransaction}
        transactions={transactions}
        onSelectTransaction={setSelectedTransaction}
      />

      {/* Reversal Modal */}
      <ReversalModal
        isOpen={reversalModalOpen}
        onOpenChange={setReversalModalOpen}
        transaction={reversalTransaction}
        reversalReason={reversalReason}
        reversalDetails={reversalDetails}
        reversalTicketRef={reversalTicketRef}
        reversalProcessing={reversalProcessing}
        onReasonChange={setReversalReason}
        onDetailsChange={setReversalDetails}
        onTicketRefChange={setReversalTicketRef}
        onSubmit={submitReversal}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={exportDateRangeOpen}
        onOpenChange={setExportDateRangeOpen}
        exportStartDate={exportStartDate}
        exportEndDate={exportEndDate}
        isExporting={isExporting}
        onStartDateChange={setExportStartDate}
        onEndDateChange={setExportEndDate}
        onExport={async (startDate, endDate) => {
          await exportTransactionsToCSV(true, startDate, endDate)
          setExportStartDate("")
          setExportEndDate("")
        }}
      />
    </div>
  )
}

export default TransactionsPage
