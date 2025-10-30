"use client"
import React, { useState, useCallback, useEffect } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  X,
  CheckCircle,
  XCircle,
  Info,
  CreditCard, 
  Users, 
  Building2, 
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { useTransactionSystemStats, useAllTransactions } from '@/lib/hooks/useTransactions'

// Helper function to shorten long transaction IDs for display
const shortenTransactionId = (id: string): string => {
  if (!id) return 'N/A';
  
  // If ID contains WALLET_INIT with UUID, shorten it
  if (id.includes('WALLET_INIT_')) {
    const parts = id.split('_');
    // Return: WALLET_INIT_[last 6 digits]
    const timestamp = parts[parts.length - 1];
    return `WALLET_INIT_${timestamp.slice(-6)}`;
  }
  
  // If ID is very long (>30 chars), shorten it
  if (id.length > 30) {
    // Show first 15 and last 8 characters
    return `${id.substring(0, 15)}...${id.slice(-8)}`;
  }
  
  return id;
};

const TransactionsPage = () => {
  const [activeTab, setActiveTab] = useState("all")
  
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

  // Fetch real transaction system stats with filters
  const { data: transactionStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useTransactionSystemStats({
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined
  })

  
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


  // Get transactions data  
  const transactions = (transactionsData as any)?.transactions || []
  const totalTransactions = (transactionsData as any)?.total || 0
  const totalPages = (transactionsData as any)?.totalPages || 1

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SUCCESS: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Completed' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      FAILED: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Failed' },
      CANCELLED: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Cancelled' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge className={`${config.color} border`}>{config.label}</Badge>
  }

  // Get transaction type display
  const getTypeDisplay = (type: string) => {
    const typeMap = {
      WALLET_TO_WALLET: 'P2P Transfer',
      WALLET_TO_MNO: 'Mobile Money',
      WALLET_TO_BANK: 'Bank Transfer',
      WALLET_TO_UTILITY: 'Utility Payment',
      WALLET_TO_MERCHANT: 'Merchant Payment',
      BILL_PAYMENT: 'Bill Payment',
      DEPOSIT: 'Deposit',
      WITHDRAWAL: 'Withdrawal',
      REFUND: 'Refund'
    }
    return typeMap[type as keyof typeof typeMap] || type
  }

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

  // Calculate enhanced fee statistics from current page
  const pageStats = transactions.reduce((acc: any, tx: any) => {
    if (tx.status === 'SUCCESS') {
      acc.totalFees += Number(tx.fee) || 0
      acc.rukapayFees += Number(tx.rukapayFee) || 0
      acc.partnerFees += Number(tx.thirdPartyFee) || 0
      acc.governmentTaxes += Number(tx.governmentTax) || 0
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
            
            {/* Date Range Filter */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Date Range:</span>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    handleFilterChange()
                  }}
                  className="w-[140px]"
                  placeholder="Start Date"
                />
                <span className="text-gray-400">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    handleFilterChange()
                  }}
                  className="w-[140px]"
                  placeholder="End Date"
                />
              </div>
              {(startDate || endDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDate("")
                    setEndDate("")
                    handleFilterChange()
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards - Match Analytics & Reports Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mb-4">
            <Card className="bg-white border-gray-200">
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-0">
                      Total Transactions
                    </p>
                    <p className="text-xl font-bold text-gray-900 leading-tight">
                      {statsLoading ? '...' : stats.totalTransactions.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center ml-2">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="mt-0">
                  <span className="text-sm text-green-600 font-medium">
                    {stats.successRate.toFixed(1)}%
                  </span>
                  <span className="text-sm ml-1 text-gray-500">
                    success rate
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-0">
                      Total Volume
                    </p>
                    <p className="text-xl font-bold text-gray-900 leading-tight">
                      {statsLoading ? '...' : `UGX ${(stats.totalVolume / 1000000).toFixed(1)}M`}
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center ml-2">
                    <DollarSign className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="mt-0">
                  <span className="text-sm text-green-600 font-medium">
                    UGX {stats.averageTransactionAmount.toFixed(0)}
                  </span>
                  <span className="text-sm ml-1 text-gray-500">
                    avg transaction
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-0">
                      RukaPay Gross Revenue
                    </p>
                    <p className="text-xl font-bold text-gray-900 leading-tight">
                      {statsLoading ? '...' : formatAmount(stats.rukapayRevenue || 0)}
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center ml-2">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="mt-0">
                  <span className="text-sm text-blue-600 font-medium">
                    RukaPay fees
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-0">
                      Partner Fees
                    </p>
                    <p className="text-xl font-bold text-gray-900 leading-tight">
                      {statsLoading ? '...' : formatAmount(stats.partnerFees || 0)}
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center ml-2">
                    <Activity className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="mt-0">
                  <span className="text-sm text-orange-600 font-medium">
                    Third-party fees
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Management</CardTitle>
              <CardDescription>View and manage different types of transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                </div>
                
                <Select value={statusFilter || "all"} onValueChange={(value) => {
                  setStatusFilter(value === "all" ? "" : value)
                  handleFilterChange()
                }}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="SUCCESS">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter || "all"} onValueChange={(value) => {
                  setTypeFilter(value === "all" ? "" : value)
                  handleFilterChange()
                }}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="WALLET_TO_WALLET">P2P Transfer</SelectItem>
                    <SelectItem value="WALLET_TO_MNO">Mobile Money</SelectItem>
                    <SelectItem value="WALLET_TO_BANK">Bank Transfer</SelectItem>
                    <SelectItem value="WALLET_TO_UTILITY">Utility Payment</SelectItem>
                    <SelectItem value="BILL_PAYMENT">Bill Payment</SelectItem>
                    <SelectItem value="DEPOSIT">Deposit</SelectItem>
                    <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>


                <Select value={pageSize.toString()} onValueChange={(value) => {
                  setPageSize(Number(value))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-full sm:w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={resetFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Reset
                      </Button>

                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>

              {/* Enhanced Current Page Stats */}
              {transactions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="text-blue-800 font-semibold mb-3">Current Page Fee Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                    <div>
                      <p className="text-blue-600 font-medium">Transactions</p>
                      <p className="text-blue-900 font-bold">{pageStats.totalCount}</p>
                    </div>
                    <div>
                      <p className="text-blue-600 font-medium">Volume</p>
                      <p className="text-blue-900 font-bold">{formatAmount(pageStats.totalVolume)}</p>
                    </div>
                    <div>
                      <p className="text-blue-600 font-medium">RukaPay Fees</p>
                      <p className="text-blue-900 font-bold">{formatAmount(pageStats.rukapayFees)}</p>
                  </div>
                    <div>
                      <p className="text-orange-600 font-medium">Partner Fees</p>
                      <p className="text-orange-900 font-bold">{formatAmount(pageStats.partnerFees)}</p>
                      </div>
                    <div>
                      <p className="text-red-600 font-medium">Gov Taxes</p>
                      <p className="text-red-900 font-bold">{formatAmount(pageStats.governmentTaxes)}</p>
                    </div>
                    <div>
                      <p className="text-green-600 font-medium">Success Rate</p>
                      <p className="text-green-900 font-bold">
                        {pageStats.totalCount > 0 ? ((pageStats.successfulCount / pageStats.totalCount) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600 font-medium">Total Fees:</span>
                      <span className="text-blue-900 font-bold">{formatAmount(pageStats.totalFees)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Table */}
              <div className="rounded-md ">
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading transactions...</span>
                  </div>
                ) : transactionsError ? (
                  <div className="flex items-center justify-center py-12 text-red-600">
                    <AlertTriangle className="h-8 w-8 mr-2" />
                    <span>Failed to load transactions</span>
                  </div>
                ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Partner</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Sender</TableHead>
                            <TableHead>Receiver</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>RukaPay Fee</TableHead>
                            <TableHead>Partner Fee</TableHead>
                            <TableHead>Gov Tax</TableHead>
                            <TableHead>Total Fee</TableHead>
                            <TableHead>Net Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                      {transactions.map((transaction: any) => (
                            <TableRow key={transaction.id}>
                          <TableCell className="font-medium font-mono text-sm" title={transaction.reference || transaction.id}>
                            {shortenTransactionId(transaction.reference || transaction.id)}
                          </TableCell>
                          <TableCell>
                            {transaction.partnerMapping?.partner ? (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {transaction.partnerMapping.partner.partnerCode}
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">Direct</span>
                            )}
                          </TableCell>
                          <TableCell>{getTypeDisplay(transaction.type)}</TableCell>
                          {/* Sender Column */}
                          <TableCell>
                            <div className="flex flex-col">
                              {transaction.direction === 'DEBIT' ? (
                                <>
                                  <span className="font-medium">
                                    {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName 
                                      ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                                      : 'Unknown User'
                                    }
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    📱 {transaction.user?.phone || transaction.user?.email}
                                  </span>
                                  {transaction.user?.userType === 'SUBSCRIBER' && (
                                    <span className="text-xs text-blue-600 font-medium">
                                      🏦 RukaPay Subscriber
                                    </span>
                                  )}
                                </>
                              ) : (
                                transaction.metadata?.counterpartyInfo ? (
                                  <>
                                    <span className="font-medium">
                                      {transaction.metadata.counterpartyInfo.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {transaction.metadata.counterpartyInfo.type === 'USER' 
                                        ? '👤 Mobile User'
                                        : transaction.metadata.counterpartyInfo.type === 'UTILITY'
                                        ? '⚡ Utility'
                                        : transaction.metadata.counterpartyInfo.type === 'MERCHANT'
                                        ? '🏪 Merchant'
                                        : transaction.metadata.counterpartyInfo.type === 'MNO'
                                        ? '📱 Mobile Money'
                                        : transaction.metadata.counterpartyInfo.type
                                      }
                                    </span>
                                    {transaction.metadata.counterpartyInfo.type === 'USER' && (
                                      <span className="text-xs text-blue-600 font-medium">
                                        🏦 RukaPay Subscriber
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-gray-500">External</span>
                                )
                              )}
                            </div>
                          </TableCell>

                          {/* Receiver Column */}
                          <TableCell>
                            <div className="flex flex-col">
                              {transaction.direction === 'DEBIT' ? (
                                transaction.metadata?.counterpartyInfo ? (
                                  <>
                                    <span className="font-medium">
                                      {transaction.metadata.counterpartyInfo.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {transaction.metadata.counterpartyInfo.type === 'USER' 
                                        ? (transaction.type === 'WALLET_TO_WALLET' 
                                           ? `📱 ${transaction.counterpartyId ? 'RukaPay ID: ' + transaction.counterpartyId.slice(0, 8) + '...' : 'RukaPay User'}`
                                           : '👤 Mobile User')
                                        : transaction.metadata.counterpartyInfo.type === 'UTILITY'
                                        ? `⚡ ${transaction.metadata.counterpartyInfo.accountNumber || 'Utility'}`
                                        : transaction.metadata.counterpartyInfo.type === 'MERCHANT'
                                        ? `🏪 ${transaction.metadata.counterpartyInfo.accountNumber || 'Merchant'}`
                                        : transaction.metadata.counterpartyInfo.type === 'MNO'
                                        ? `📱 ${transaction.metadata.counterpartyInfo.accountNumber || 'Mobile Money'}`
                                        : transaction.metadata.counterpartyInfo.type
                                      }
                                    </span>
                                    {transaction.metadata.counterpartyInfo.type === 'USER' && transaction.type === 'WALLET_TO_WALLET' && (
                                      <span className="text-xs text-blue-600 font-medium">
                                        🏦 RukaPay Subscriber
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-gray-500">External</span>
                                )
                              ) : (
                                <>
                                  <span className="font-medium">
                                    {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName 
                                      ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                                      : 'Unknown User'
                                    }
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    📱 {transaction.user?.phone || transaction.user?.email}
                                  </span>
                                  {transaction.user?.userType === 'SUBSCRIBER' && (
                                    <span className="text-xs text-blue-600 font-medium">
                                      🏦 RukaPay Subscriber
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                              <TableCell className="font-medium">
                            {formatAmount(Number(transaction.amount))}
                          </TableCell>
                          <TableCell className="font-medium text-blue-600">
                            {formatAmount(Number(transaction.rukapayFee) || 0)}
                          </TableCell>
                          <TableCell className="font-medium text-orange-600">
                            {formatAmount(Number(transaction.thirdPartyFee) || 0)}
                          </TableCell>
                          <TableCell className="font-medium text-red-600">
                            {formatAmount(Number(transaction.governmentTax) || 0)}
                          </TableCell>
                          <TableCell className="font-medium text-yellow-600">
                            {formatAmount(Number(transaction.fee) || 0)}
                              </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatAmount(Number(transaction.netAmount))}
                              </TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell className="text-sm">{formatDate(transaction.createdAt)}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewTransaction(transaction)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalTransactions)} of {totalTransactions.toLocaleString()} transactions
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        const page = i + Math.max(1, currentPage - 2)
                        if (page > totalPages) return null
                        
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Transaction Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Transaction Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this transaction
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border-2 ${
                selectedTransaction.status === 'SUCCESS' 
                  ? 'bg-green-50 border-green-200' 
                  : selectedTransaction.status === 'FAILED'
                  ? 'bg-red-50 border-red-200'
                  : selectedTransaction.status === 'PENDING'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  {selectedTransaction.status === 'SUCCESS' ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : selectedTransaction.status === 'FAILED' ? (
                    <XCircle className="h-8 w-8 text-red-600" />
                  ) : (
                    <Info className="h-8 w-8 text-yellow-600" />
                  )}
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold ${
                      selectedTransaction.status === 'SUCCESS' 
                        ? 'text-green-900' 
                        : selectedTransaction.status === 'FAILED'
                        ? 'text-red-900'
                        : 'text-yellow-900'
                    }`}>
                      Transaction {selectedTransaction.status === 'SUCCESS' ? 'Completed' : selectedTransaction.status === 'FAILED' ? 'Failed' : selectedTransaction.status}
                    </h3>
                    <p className={`text-sm ${
                      selectedTransaction.status === 'SUCCESS' 
                        ? 'text-green-700' 
                        : selectedTransaction.status === 'FAILED'
                        ? 'text-red-700'
                        : 'text-yellow-700'
                    }`}>
                      {selectedTransaction.status === 'SUCCESS' 
                        ? 'This transaction was processed successfully'
                        : selectedTransaction.status === 'FAILED'
                        ? 'This transaction could not be completed'
                        : 'This transaction is being processed'
                      }
                    </p>
                  </div>
                  {getStatusBadge(selectedTransaction.status)}
                </div>

                {/* Failure Reason */}
                {selectedTransaction.status === 'FAILED' && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900 text-sm">Failure Reason:</p>
                        <p className="text-red-800 text-sm mt-1">
                          {selectedTransaction.metadata?.externalMessage ||
                           selectedTransaction.failureReason || 
                           selectedTransaction.metadata?.failureReason || 
                           selectedTransaction.metadata?.errorMessage ||
                           selectedTransaction.errorMessage ||
                           'Transaction failed due to processing error. Please contact support for more details.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                    <Info className="h-4 w-4" />
                    Basic Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono font-medium text-gray-900 text-xs">
                        {selectedTransaction.reference || selectedTransaction.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-gray-900">{getTypeDisplay(selectedTransaction.type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Partner:</span>
                      <span className="font-medium text-gray-900">
                        {selectedTransaction.partnerMapping?.partner?.partnerCode || 'Direct'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date & Time:</span>
                      <span className="font-medium text-gray-900">{formatDate(selectedTransaction.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Direction:</span>
                      <span className="font-medium text-gray-900">
                        {selectedTransaction.direction === 'DEBIT' ? '📤 Outgoing' : '📥 Incoming'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                    <DollarSign className="h-4 w-4" />
                    Amount Breakdown
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction Amount:</span>
                      <span className="font-bold text-gray-900">{formatAmount(Number(selectedTransaction.amount))}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-blue-600">RukaPay Fee:</span>
                      <span className="font-medium text-blue-600">
                        {formatAmount(Number(selectedTransaction.rukapayFee) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-600">Partner Fee:</span>
                      <span className="font-medium text-orange-600">
                        {formatAmount(Number(selectedTransaction.thirdPartyFee) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Government Tax:</span>
                      <span className="font-medium text-red-600">
                        {formatAmount(Number(selectedTransaction.governmentTax) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-yellow-600 font-semibold">Total Fees:</span>
                      <span className="font-bold text-yellow-600">
                        {formatAmount(Number(selectedTransaction.fee) || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t-2 pt-2 mt-2">
                      <span className="text-green-600 font-bold">Net Amount:</span>
                      <span className="font-bold text-green-600 text-lg">
                        {formatAmount(Number(selectedTransaction.netAmount))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sender & Receiver Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sender */}
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Sender
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedTransaction.direction === 'DEBIT' ? (
                      <>
                        <div>
                          <span className="text-blue-600">Name:</span>
                          <p className="font-medium text-blue-900">
                            {selectedTransaction.user?.profile?.firstName && selectedTransaction.user?.profile?.lastName 
                              ? `${selectedTransaction.user.profile.firstName} ${selectedTransaction.user.profile.lastName}`
                              : 'Unknown User'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600">Contact:</span>
                          <p className="font-medium text-blue-900">
                            {selectedTransaction.user?.phone || selectedTransaction.user?.email}
                          </p>
                        </div>
                        {selectedTransaction.user?.userType === 'SUBSCRIBER' && (
                          <Badge className="bg-blue-600 text-white">RukaPay Subscriber</Badge>
                        )}
                      </>
                    ) : (
                      <>
                        {/* External Source - Extract from metadata */}
                        <div>
                          <span className="text-blue-600">Source:</span>
                          <p className="font-medium text-blue-900">
                            {selectedTransaction.metadata?.mnoProvider 
                              ? `${selectedTransaction.metadata.mnoProvider} Mobile Money`
                              : selectedTransaction.metadata?.counterpartyInfo?.name || 'External Source'
                            }
                          </p>
                        </div>
                        {selectedTransaction.metadata?.phoneNumber && (
                          <div>
                            <span className="text-blue-600">Phone Number:</span>
                            <p className="font-medium text-blue-900">
                              {selectedTransaction.metadata.phoneNumber}
                            </p>
                          </div>
                        )}
                        {selectedTransaction.metadata?.userName && (
                          <div>
                            <span className="text-blue-600">Name:</span>
                            <p className="font-medium text-blue-900">
                              {selectedTransaction.metadata.userName}
                            </p>
                          </div>
                        )}
                        {selectedTransaction.metadata?.counterpartyInfo?.type && (
                          <div>
                            <span className="text-blue-600">Type:</span>
                            <p className="font-medium text-blue-900">
                              {selectedTransaction.metadata.counterpartyInfo.type}
                            </p>
                          </div>
                        )}
                        {selectedTransaction.metadata?.mnoProvider && (
                          <Badge className="bg-blue-600 text-white">
                            {selectedTransaction.metadata.mnoProvider} Network
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Receiver */}
                <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Receiver
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedTransaction.direction === 'DEBIT' ? (
                      selectedTransaction.metadata?.counterpartyInfo ? (
                        <>
                          <div>
                            <span className="text-green-600">Name:</span>
                            <p className="font-medium text-green-900">
                              {selectedTransaction.metadata.counterpartyInfo.name}
                            </p>
                          </div>
                          <div>
                            <span className="text-green-600">Type:</span>
                            <p className="font-medium text-green-900">
                              {selectedTransaction.metadata.counterpartyInfo.type}
                            </p>
                          </div>
                          {selectedTransaction.metadata.counterpartyInfo.accountNumber && (
                            <div>
                              <span className="text-green-600">Account:</span>
                              <p className="font-medium text-green-900">
                                {selectedTransaction.metadata.counterpartyInfo.accountNumber}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* External Recipient - Extract from metadata */}
                          <div>
                            <span className="text-green-600">Type:</span>
                            <p className="font-medium text-green-900">
                              {selectedTransaction.metadata?.mnoProvider 
                                ? `${selectedTransaction.metadata.mnoProvider} Mobile Money`
                                : selectedTransaction.type?.includes('BANK')
                                ? 'Bank Transfer'
                                : selectedTransaction.type?.includes('UTILITY')
                                ? 'Utility Payment'
                                : selectedTransaction.type?.includes('MERCHANT')
                                ? 'Merchant Payment'
                                : selectedTransaction.type === 'DEPOSIT'
                                ? 'Wallet Deposit'
                                : selectedTransaction.type === 'WITHDRAWAL'
                                ? 'Wallet Withdrawal'
                                : 'External Account'
                              }
                            </p>
                          </div>
                          
                          {/* Show wallet information for deposits */}
                          {selectedTransaction.type === 'DEPOSIT' && (
                            <>
                              <div>
                                <span className="text-green-600">Account:</span>
                                <p className="font-medium text-green-900">
                                  {selectedTransaction.user?.profile?.firstName && selectedTransaction.user?.profile?.lastName 
                                    ? `${selectedTransaction.user.profile.firstName} ${selectedTransaction.user.profile.lastName}'s Wallet`
                                    : 'User Wallet'
                                  }
                                </p>
                              </div>
                              <div>
                                <span className="text-green-600">Wallet Type:</span>
                                <p className="font-medium text-green-900">
                                  {selectedTransaction.metadata?.walletType || 'RukaPay Wallet'}
                                </p>
                              </div>
                            </>
                          )}

                          {selectedTransaction.metadata?.phoneNumber && (
                            <div>
                              <span className="text-green-600">Phone Number:</span>
                              <p className="font-medium text-green-900">
                                {selectedTransaction.metadata.phoneNumber}
                              </p>
                            </div>
                          )}
                          {selectedTransaction.metadata?.accountNumber && (
                            <div>
                              <span className="text-green-600">Account Number:</span>
                              <p className="font-medium text-green-900">
                                {selectedTransaction.metadata.accountNumber}
                              </p>
                            </div>
                          )}
                          {selectedTransaction.metadata?.userName && (
                            <div>
                              <span className="text-green-600">Recipient Name:</span>
                              <p className="font-medium text-green-900">
                                {selectedTransaction.metadata.userName}
                              </p>
                            </div>
                          )}
                          {selectedTransaction.metadata?.recipientName && (
                            <div>
                              <span className="text-green-600">Recipient Name:</span>
                              <p className="font-medium text-green-900">
                                {selectedTransaction.metadata.recipientName}
                              </p>
                            </div>
                          )}
                          {selectedTransaction.metadata?.bankName && (
                            <div>
                              <span className="text-green-600">Bank:</span>
                              <p className="font-medium text-green-900">
                                {selectedTransaction.metadata.bankName}
                              </p>
                            </div>
                          )}
                          {selectedTransaction.metadata?.utilityName && (
                            <div>
                              <span className="text-green-600">Utility:</span>
                              <p className="font-medium text-green-900">
                                {selectedTransaction.metadata.utilityName}
                              </p>
                            </div>
                          )}
                          {selectedTransaction.metadata?.merchantName && (
                            <div>
                              <span className="text-green-600">Merchant:</span>
                              <p className="font-medium text-green-900">
                                {selectedTransaction.metadata.merchantName}
                              </p>
                            </div>
                          )}
                          {selectedTransaction.metadata?.narration && (
                            <div>
                              <span className="text-green-600">Notes:</span>
                              <p className="font-medium text-green-900">
                                {selectedTransaction.metadata.narration}
                              </p>
                            </div>
                          )}
                          
                          {/* If no specific details available, show reference */}
                          {!selectedTransaction.metadata?.phoneNumber && 
                           !selectedTransaction.metadata?.accountNumber && 
                           !selectedTransaction.metadata?.userName && 
                           !selectedTransaction.metadata?.recipientName &&
                           !selectedTransaction.metadata?.bankName &&
                           !selectedTransaction.metadata?.utilityName &&
                           !selectedTransaction.metadata?.merchantName &&
                           selectedTransaction.type !== 'DEPOSIT' && (
                            <div>
                              <span className="text-green-600">Reference:</span>
                              <p className="font-medium text-green-900 text-xs">
                                {selectedTransaction.reference || selectedTransaction.id}
                              </p>
                              <p className="text-green-700 italic text-xs mt-2">
                                Detailed recipient information not available
                              </p>
                            </div>
                          )}

                          {selectedTransaction.metadata?.mnoProvider && (
                            <Badge className="bg-green-600 text-white">
                              {selectedTransaction.metadata.mnoProvider} Network
                            </Badge>
                          )}
                          {selectedTransaction.type?.includes('BANK') && (
                            <Badge className="bg-green-600 text-white">Bank Transfer</Badge>
                          )}
                          {selectedTransaction.type?.includes('UTILITY') && (
                            <Badge className="bg-green-600 text-white">Utility Payment</Badge>
                          )}
                          {selectedTransaction.type === 'DEPOSIT' && (
                            <Badge className="bg-green-600 text-white">Wallet Credit</Badge>
                          )}
                        </>
                      )
                    ) : (
                      <>
                        <div>
                          <span className="text-green-600">Name:</span>
                          <p className="font-medium text-green-900">
                            {selectedTransaction.user?.profile?.firstName && selectedTransaction.user?.profile?.lastName 
                              ? `${selectedTransaction.user.profile.firstName} ${selectedTransaction.user.profile.lastName}`
                              : 'Unknown User'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-green-600">Contact:</span>
                          <p className="font-medium text-green-900">
                            {selectedTransaction.user?.phone || selectedTransaction.user?.email}
                          </p>
                        </div>
                        {selectedTransaction.user?.userType === 'SUBSCRIBER' && (
                          <Badge className="bg-green-600 text-white">RukaPay Subscriber</Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information - User Friendly */}
              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 border-b pb-2">
                    <Info className="h-4 w-4" />
                    Additional Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Transaction Mode */}
                    {selectedTransaction.metadata.mode && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500 block mb-1">Transaction Mode</span>
                        <p className="font-medium text-gray-900">
                          {selectedTransaction.metadata.mode.replace(/_/g, ' ')}
                        </p>
                      </div>
                    )}

                    {/* Narration/Description */}
                    {selectedTransaction.metadata.narration && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500 block mb-1">Narration</span>
                        <p className="font-medium text-gray-900">{selectedTransaction.metadata.narration}</p>
                      </div>
                    )}

                    {/* Tariff Name */}
                    {selectedTransaction.metadata.tariffName && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500 block mb-1">Tariff</span>
                        <p className="font-medium text-gray-900">{selectedTransaction.metadata.tariffName}</p>
                      </div>
                    )}

                    {/* Wallet Type */}
                    {selectedTransaction.metadata.walletType && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500 block mb-1">Wallet Type</span>
                        <p className="font-medium text-gray-900">{selectedTransaction.metadata.walletType}</p>
                      </div>
                    )}

                    {/* MNO Provider */}
                    {selectedTransaction.metadata.mnoProvider && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500 block mb-1">Network Provider</span>
                        <p className="font-medium text-gray-900">{selectedTransaction.metadata.mnoProvider}</p>
                      </div>
                    )}

                    {/* External Transaction ID */}
                    {selectedTransaction.metadata.externalTransactionId && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500 block mb-1">External Transaction ID</span>
                        <p className="font-mono text-xs font-medium text-gray-900">
                          {selectedTransaction.metadata.externalTransactionId}
                        </p>
                      </div>
                    )}

                    {/* Processing Times */}
                    {selectedTransaction.metadata.processingStartedAt && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500 block mb-1">Processing Started</span>
                        <p className="font-medium text-gray-900 text-xs">
                          {new Date(selectedTransaction.metadata.processingStartedAt).toLocaleString('en-UG')}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.metadata.statusUpdatedAt && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500 block mb-1">Status Updated</span>
                        <p className="font-medium text-gray-900 text-xs">
                          {new Date(selectedTransaction.metadata.statusUpdatedAt).toLocaleString('en-UG')}
                        </p>
                      </div>
                    )}

                    {/* External Status */}
                    {selectedTransaction.metadata.externalStatus !== undefined && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500 block mb-1">External Status Code</span>
                        <p className="font-medium text-gray-900">{selectedTransaction.metadata.externalStatus}</p>
                      </div>
                    )}
                  </div>

                  {/* Partner Response Details */}
                  {selectedTransaction.metadata.partnerResponse && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Partner Response Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedTransaction.metadata.partnerResponse.amount && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <span className="text-xs text-blue-600 block mb-1">Amount</span>
                            <p className="font-medium text-blue-900">
                              {formatAmount(Number(selectedTransaction.metadata.partnerResponse.amount))}
                            </p>
                          </div>
                        )}
                        {selectedTransaction.metadata.partnerResponse.phoneNumber && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <span className="text-xs text-blue-600 block mb-1">Phone Number</span>
                            <p className="font-medium text-blue-900">
                              {selectedTransaction.metadata.partnerResponse.phoneNumber}
                            </p>
                          </div>
                        )}
                        {selectedTransaction.metadata.partnerResponse.transactionId && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <span className="text-xs text-blue-600 block mb-1">Transaction ID</span>
                            <p className="font-mono text-xs font-medium text-blue-900">
                              {selectedTransaction.metadata.partnerResponse.transactionId}
                            </p>
                          </div>
                        )}
                        {selectedTransaction.metadata.partnerResponse.transactionDate && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <span className="text-xs text-blue-600 block mb-1">Transaction Date</span>
                            <p className="font-medium text-blue-900 text-xs">
                              {new Date(selectedTransaction.metadata.partnerResponse.transactionDate).toLocaleString('en-UG')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fee Breakdown Details */}
                  {selectedTransaction.metadata.feeBreakdown && Object.keys(selectedTransaction.metadata.feeBreakdown).length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Fee Breakdown Details</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(selectedTransaction.metadata.feeBreakdown).map(([key, value]: [string, any]) => (
                          <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="text-xs text-gray-500 block mb-1">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <p className="font-medium text-gray-900">
                              {typeof value === 'number' ? formatAmount(value) : value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
                <Button variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  Export Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TransactionsPage 