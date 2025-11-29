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
import { Label } from '@/components/ui/label'
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
  Loader2,
  RotateCcw,
  FileText,
  FileSpreadsheet,
  Smartphone,
  Store,
  Phone,
  Globe,
  Code
} from 'lucide-react'
import { useTransactionSystemStats, useAllTransactions, useChannelStatistics } from '@/lib/hooks/useTransactions'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
      // P2P and Internal Transfers
      WALLET_TO_WALLET: 'P2P Transfer',
      
      // Mobile Money Transactions
      WALLET_TO_MNO: 'Send to Mobile Money',
      MNO_TO_WALLET: 'Receive from Mobile Money',
      WALLET_TOPUP_PULL: 'Mobile Money Top-up',
      
      // Merchant Transactions
      WALLET_TO_MERCHANT: 'Pay Merchant',
      WALLET_TO_INTERNAL_MERCHANT: 'Pay Merchant', // Legacy naming
      WALLET_TO_EXTERNAL_MERCHANT: 'Pay External Merchant',
      MERCHANT_TO_WALLET: 'Receive from Merchant',
      MERCHANT_TO_INTERNAL_WALLET: 'Receive from Merchant', // Legacy naming
      MERCHANT_WITHDRAWAL: 'Merchant Withdrawal',
      
      // Bank Transactions
      WALLET_TO_BANK: 'Bank Transfer',
      BANK_TO_WALLET: 'Receive from Bank',
      
      // Card Transactions
      CARD_TO_WALLET: 'Card Top-up',
      
      // Utility and Bill Payments
      WALLET_TO_UTILITY: 'Utility Payment',
      BILL_PAYMENT: 'Bill Payment',
      
      // Wallet Operations
      DEPOSIT: 'Wallet Deposit',
      WITHDRAWAL: 'Wallet Withdrawal',
      WALLET_CREATION: 'Wallet Created',
      WALLET_INIT: 'Wallet Initialized',
      
      // System Transactions
      REVERSAL: 'Transaction Reversal',
      REFUND: 'Refund',
      FEE_CHARGE: 'Fee Charge',
      CUSTOM: 'Custom Transaction'
    }
    return typeMap[type as keyof typeof typeMap] || type
  }

  // Get channel display information
  const getChannelDisplay = (channel: string | null | undefined, metadata?: any) => {
    const channelValue = channel || metadata?.channel || 'APP'
    const channelUpper = channelValue.toUpperCase()
    
    // Map WEB to MERCHANT_PORTAL since they are the same thing
    const normalizedChannel = channelUpper === 'WEB' ? 'MERCHANT_PORTAL' : channelUpper
    
    const channelMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
      APP: {
        label: 'Mobile App',
        icon: Smartphone,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200'
      },
      USSD: {
        label: 'USSD',
        icon: Phone,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200'
      },
      API: {
        label: 'API',
        icon: Code,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 border-gray-200'
      },
      BACKOFFICE: {
        label: 'Back Office',
        icon: Building2,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 border-indigo-200'
      },
      MERCHANT_PORTAL: {
        label: 'Merchant Portal',
        icon: Store,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200'
      },
      AGENT_PORTAL: {
        label: 'Agent Portal',
        icon: Users,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50 border-teal-200'
      },
      PARTNER_PORTAL: {
        label: 'Partner Portal',
        icon: Users,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50 border-pink-200'
      }
    }
    
    // Find exact match or pattern match
    let matchedChannel = channelMap[normalizedChannel]
    
    if (!matchedChannel) {
      // Pattern matching for variations
      if (normalizedChannel.includes('APP') || normalizedChannel.includes('MOBILE')) {
        matchedChannel = channelMap.APP
      } else if (normalizedChannel.includes('USSD')) {
        matchedChannel = channelMap.USSD
      } else if (normalizedChannel.includes('WEB') || normalizedChannel.includes('BROWSER')) {
        matchedChannel = channelMap.MERCHANT_PORTAL // Map WEB to MERCHANT_PORTAL
      } else if (normalizedChannel.includes('API')) {
        matchedChannel = channelMap.API
      } else if (normalizedChannel.includes('BACKOFFICE') || normalizedChannel.includes('ADMIN')) {
        matchedChannel = channelMap.BACKOFFICE
      } else if (normalizedChannel.includes('MERCHANT')) {
        matchedChannel = channelMap.MERCHANT_PORTAL
      } else if (normalizedChannel.includes('AGENT')) {
        matchedChannel = channelMap.AGENT_PORTAL
      } else if (normalizedChannel.includes('PARTNER')) {
        matchedChannel = channelMap.PARTNER_PORTAL
      } else {
        // Default to APP
        matchedChannel = channelMap.APP
      }
    }
    
    return matchedChannel
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

      // Define CSV headers
      const headers = [
        'Reference',
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
          escapeCSV(tx.partnerMapping?.partner?.partnerCode || 'Direct'),
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

          {/* Channel Statistics Cards */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Transactions by Channel</h3>
            {channelStatsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="border-gray-200 bg-white">
                    <CardContent className="px-4 py-3">
                      <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {(() => {
                  // Define all possible channels with default values
                  // Note: WEB is mapped to MERCHANT_PORTAL on backend, so WEB is not included here
                  const allChannels = [
                    { channel: 'APP', label: 'Mobile App', icon: Smartphone, color: 'border-blue-200 bg-blue-50' },
                    { channel: 'USSD', label: 'USSD', icon: Phone, color: 'border-green-200 bg-green-50' },
                    { channel: 'API', label: 'API', icon: Code, color: 'border-gray-200 bg-gray-50' },
                    { channel: 'BACKOFFICE', label: 'Back Office', icon: Building2, color: 'border-indigo-200 bg-indigo-50' },
                    { channel: 'MERCHANT_PORTAL', label: 'Merchant Portal', icon: Store, color: 'border-orange-200 bg-orange-50' },
                    { channel: 'AGENT_PORTAL', label: 'Agent Portal', icon: Users, color: 'border-teal-200 bg-teal-50' },
                    { channel: 'PARTNER_PORTAL', label: 'Partner Portal', icon: Users, color: 'border-pink-200 bg-pink-50' }
                  ]
                  
                  const existingChannels = channelStatsData?.data?.channels || []
                  // Merge WEB into MERCHANT_PORTAL if WEB exists in the data (for backward compatibility)
                  const channelMap = new Map<string, any>();
                  existingChannels.forEach((ch: any) => {
                    const channelKey = ch.channel === 'WEB' ? 'MERCHANT_PORTAL' : ch.channel;
                    if (channelMap.has(channelKey)) {
                      const existing = channelMap.get(channelKey);
                      channelMap.set(channelKey, {
                        ...existing,
                        transactionCount: existing.transactionCount + (ch.transactionCount || 0),
                        totalValue: existing.totalValue + (ch.totalValue || 0),
                        averageValue: 0 // Will be recalculated
                      });
                    } else {
                      const channelLabel = channelKey === 'MERCHANT_PORTAL' 
                        ? 'Merchant Portal' 
                        : (ch.label || allChannels.find(c => c.channel === channelKey)?.label || channelKey);
                      channelMap.set(channelKey, {
                        channel: channelKey,
                        label: channelLabel,
                        transactionCount: ch.transactionCount || 0,
                        totalValue: ch.totalValue || 0,
                        averageValue: ch.averageValue || 0
                      });
                    }
                  });
                  
                  // Recalculate average for merged channels
                  channelMap.forEach((ch) => {
                    if (ch.transactionCount > 0) {
                      ch.averageValue = ch.totalValue / ch.transactionCount;
                    }
                  });
                  
                  const existingChannelMap = channelMap
                  
                  return allChannels.map((defaultChannel) => {
                    const existingData = existingChannelMap.get(defaultChannel.channel)
                    const channelData: any = existingData || {
                      channel: defaultChannel.channel,
                      label: defaultChannel.label,
                      transactionCount: 0,
                      totalValue: 0,
                      averageValue: 0
                    }
                    // Recalculate average if we have data
                    if (channelData.transactionCount > 0 && channelData.averageValue === 0) {
                      channelData.averageValue = channelData.totalValue / channelData.transactionCount;
                    }
                    const ChannelIcon = defaultChannel.icon

                    return (
                      <Card key={defaultChannel.channel} className={`${defaultChannel.color} border`}>
                        <CardContent className="px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-white rounded">
                                <ChannelIcon className="h-4 w-4 text-gray-600" />
                              </div>
                              <p className="text-sm font-semibold text-gray-900">
                                {channelData.label || defaultChannel.label}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div>
                              <p className="text-xs text-gray-500">Transactions</p>
                              <p className="text-lg font-bold text-gray-900">
                                {channelStatsLoading ? '...' : (channelData.transactionCount || 0).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Total Value</p>
                              <p className="text-sm font-semibold text-gray-700">
                                {channelStatsLoading ? '...' : formatAmount(channelData.totalValue || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Average</p>
                              <p className="text-xs font-medium text-gray-600">
                                Avg: {channelStatsLoading ? '...' : formatAmount(channelData.averageValue || 0)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                })()}
              </div>
            )}
          </div>


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
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search by ID, sender name, or receiver name..."
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isExporting}>
                      <Download className="h-4 w-4 mr-2" />
                      {isExporting ? 'Exporting...' : 'Export'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => exportTransactionsToCSV(false)}
                      disabled={isExporting || transactions.length === 0}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export Current Page ({transactions.length} transactions)
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => exportTransactionsToCSV(true)}
                      disabled={isExporting}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export All Transactions
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setExportDateRangeOpen(true)}
                      disabled={isExporting}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Export by Date Range
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                          {/* Channel Column */}
                          <TableCell>
                            {(() => {
                              const channelInfo = getChannelDisplay(transaction.channel, transaction.metadata)
                              const ChannelIcon = channelInfo.icon
                              return (
                                <Badge className={`${channelInfo.bgColor} ${channelInfo.color} border flex items-center gap-1.5 px-2 py-1`}>
                                  <ChannelIcon className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium">{channelInfo.label}</span>
                                </Badge>
                              )
                            })()}
                          </TableCell>
                          {/* Sender Column */}
                          <TableCell>
                            <div className="flex flex-col">
                              {transaction.type === 'REVERSAL' ? (
                                <>
                                  {/* Reversal transaction - sender is the system crediting back */}
                                  <span className="font-medium text-orange-600">
                                    System Reversal
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Reversing transaction {transaction.metadata?.originalTransactionReference || transaction.metadata?.originalTransactionId?.substring(0, 8) || 'N/A'}
                                  </span>
                                  <span className="text-xs text-orange-600 font-medium">
                                    🔄 Reversal
                                  </span>
                                </>
                              ) : transaction.type === 'DEPOSIT' && transaction.metadata?.fundedByAdmin ? (
                                <>
                                  {/* Admin funded wallet */}
                                  <span className="font-medium text-purple-900">
                                    {transaction.metadata.adminName || 'Admin User'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    📱 {transaction.metadata.adminPhone || transaction.metadata.adminEmail || 'Admin'}
                                  </span>
                                  <span className="text-xs text-purple-600 font-medium">
                                    👨‍💼 Admin Funding
                                  </span>
                                </>
                              ) : transaction.direction === 'DEBIT' ? (
                                <>
                                  {/* Outgoing transaction - sender is the wallet owner */}
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
                                <>
                                  {/* Incoming transaction - extract sender info */}
                                  {transaction.type === 'MERCHANT_TO_WALLET' || transaction.type === 'MERCHANT_TO_INTERNAL_WALLET' || transaction.type?.includes('MERCHANT_TO_WALLET') || transaction.type?.includes('MERCHANT_TO_INTERNAL_WALLET') ? (
                                    <>
                                      {/* Merchant sending to wallet */}
                                      <span className="font-medium">
                                        {transaction.metadata?.merchantName || 
                                         transaction.metadata?.counterpartyInfo?.name ||
                                         transaction.user?.merchant?.businessTradeName ||
                                         transaction.user?.profile?.merchantBusinessTradeName ||
                                         transaction.user?.profile?.businessTradeName ||
                                         transaction.user?.profile?.merchant_names ||
                                         (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant')}
                                      </span>
                                      {transaction.metadata?.merchantCode && (
                                        <span className="text-xs text-gray-500">
                                          🏪 Code: {transaction.metadata.merchantCode}
                                        </span>
                                      )}
                                      {transaction.metadata?.accountNumber && (
                                        <span className="text-xs text-gray-500">
                                          Account: {transaction.metadata.accountNumber}
                                        </span>
                                      )}
                                      <span className="text-xs text-blue-600 font-medium">
                                        🏦 Internal Account
                                      </span>
                                    </>
                                  ) : transaction.type === 'MNO_TO_WALLET' || transaction.type?.includes('MNO_TO_WALLET') ? (
                                    <>
                                      {/* Mobile Money sending to wallet */}
                                      {transaction.metadata?.mnoProvider ? (
                                        <>
                                          <span className="font-medium">
                                            {transaction.metadata.mnoProvider} Mobile Money
                                          </span>
                                          {transaction.metadata.phoneNumber && (
                                            <span className="text-xs text-gray-500">
                                              📱 {transaction.metadata.phoneNumber}
                                            </span>
                                          )}
                                          {transaction.metadata.userName && (
                                            <span className="text-xs text-gray-500">
                                              👤 {transaction.metadata.userName}
                                            </span>
                                          )}
                                          <span className="text-xs text-blue-600 font-medium">
                                            {transaction.metadata.mnoProvider} Network
                                          </span>
                                        </>
                                      ) : transaction.metadata?.phoneNumber ? (
                                        <>
                                          <span className="font-medium">
                                            {transaction.metadata.userName || 'Mobile Money User'}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            📱 {transaction.metadata.phoneNumber}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            📱 Mobile Money
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-gray-500">External</span>
                                      )}
                                    </>
                                  ) : transaction.type === 'WALLET_TO_WALLET' || transaction.counterpartyId || transaction.counterpartyUser ? (
                                    <>
                                      {/* P2P - Wallet to Wallet - sender is another RukaPay user */}
                                      <span className="font-medium">
                                        {transaction.counterpartyUser?.profile?.firstName && transaction.counterpartyUser?.profile?.lastName
                                          ? `${transaction.counterpartyUser.profile.firstName} ${transaction.counterpartyUser.profile.lastName}`
                                          : transaction.metadata?.counterpartyInfo?.name || transaction.metadata?.userName || 'RukaPay User'
                                        }
                                      </span>
                                      {transaction.counterpartyUser?.phone && (
                                        <span className="text-xs text-gray-500">
                                          📱 {transaction.counterpartyUser.phone}
                                        </span>
                                      )}
                                      {transaction.counterpartyId && (
                                        <span className="text-xs text-gray-500">
                                          📱 RukaPay ID: {transaction.counterpartyId.slice(0, 8)}...
                                        </span>
                                      )}
                                      <span className="text-xs text-blue-600 font-medium">
                                        🏦 RukaPay Subscriber
                                      </span>
                                    </>
                                  ) : transaction.metadata?.counterpartyInfo ? (
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
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>

                          {/* Receiver Column */}
                          <TableCell>
                            <div className="flex flex-col">
                              {transaction.type === 'REVERSAL' ? (
                                <>
                                  {/* Reversal transaction - receiver is the wallet owner getting credited back */}
                                  <span className="font-medium text-green-600">
                                    {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName 
                                      ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                                      : transaction.user?.phone || transaction.user?.email || 'Wallet Owner'
                                    }
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    📱 {transaction.user?.phone || transaction.user?.email || 'N/A'}
                                  </span>
                                  <span className="text-xs text-green-600 font-medium">
                                    💰 Credited Back
                                  </span>
                                  {transaction.metadata?.reversalReason && (
                                    <span className="text-xs text-gray-500 italic">
                                      Reason: {transaction.metadata.reversalReason}
                                    </span>
                                  )}
                                </>
                              ) : transaction.type === 'DEPOSIT' && transaction.metadata?.fundedByAdmin ? (
                                <>
                                  {/* Wallet Deposit - receiver is the RukaPay user receiving funds */}
                                  <span className="font-medium text-green-600">
                                    {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName 
                                      ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                                      : transaction.user?.phone || transaction.user?.email || 'RukaPay User'
                                    }
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    📱 {transaction.user?.phone || transaction.user?.email || 'N/A'}
                                  </span>
                                  {transaction.user?.userType === 'SUBSCRIBER' && (
                                    <span className="text-xs text-blue-600 font-medium">
                                      🏦 RukaPay Subscriber
                                    </span>
                                  )}
                                  <span className="text-xs text-green-600 font-medium">
                                    💰 Wallet Credit
                                  </span>
                                </>
                              ) : transaction.direction === 'DEBIT' ? (
                                <>
                                  {/* Outgoing transaction - extract receiver info */}
                                  {transaction.type === 'WALLET_TO_WALLET' || transaction.counterpartyId || transaction.counterpartyUser ? (
                                    <>
                                      {/* P2P - Wallet to Wallet - receiver is another RukaPay user */}
                                      <span className="font-medium">
                                        {transaction.counterpartyUser?.profile?.firstName && transaction.counterpartyUser?.profile?.lastName
                                          ? `${transaction.counterpartyUser.profile.firstName} ${transaction.counterpartyUser.profile.lastName}`
                                          : transaction.metadata?.counterpartyInfo?.name || transaction.metadata?.userName || 'RukaPay User'
                                        }
                                      </span>
                                      {transaction.counterpartyUser?.phone && (
                                        <span className="text-xs text-gray-500">
                                          📱 {transaction.counterpartyUser.phone}
                                        </span>
                                      )}
                                      {transaction.counterpartyId && (
                                        <span className="text-xs text-gray-500">
                                          📱 RukaPay ID: {transaction.counterpartyId.slice(0, 8)}...
                                        </span>
                                      )}
                                      <span className="text-xs text-blue-600 font-medium">
                                        🏦 RukaPay Subscriber
                                      </span>
                                    </>
                                  ) : transaction.type === 'WALLET_TO_MERCHANT' || transaction.type === 'WALLET_TO_INTERNAL_MERCHANT' || transaction.type?.includes('MERCHANT') || transaction.metadata?.merchantName ? (
                                    <>
                                      {/* Wallet to Merchant - receiver is merchant */}
                                      <span className="font-medium">
                                        {transaction.metadata?.merchantName || 
                                         transaction.metadata?.counterpartyInfo?.name || 
                                         transaction.metadata?.userName ||
                                         transaction.user?.merchant?.businessTradeName ||
                                         transaction.user?.profile?.merchantBusinessTradeName ||
                                         transaction.user?.profile?.businessTradeName ||
                                         transaction.user?.profile?.merchant_names ||
                                         (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : 'Merchant')}
                                      </span>
                                      {transaction.metadata?.accountNumber && (
                                        <span className="text-xs text-gray-500">
                                          🏪 Account: {transaction.metadata.accountNumber}
                                        </span>
                                      )}
                                      {transaction.metadata?.merchantCode && (
                                        <span className="text-xs text-gray-500">
                                          Code: {transaction.metadata.merchantCode}
                                        </span>
                                      )}
                                      <span className="text-xs text-blue-600 font-medium">
                                        🏦 Internal Account
                                      </span>
                                    </>
                                  ) : transaction.metadata?.counterpartyInfo ? (
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
                                    <>
                                      {/* Extract receiver info from metadata when counterpartyInfo is not available */}
                                      {transaction.metadata?.mnoProvider ? (
                                        <>
                                          {/* External Mobile Money - show recipient name if available */}
                                          <span className="font-medium">
                                            {transaction.metadata.userName || transaction.metadata.recipientName || `${transaction.metadata.mnoProvider} Mobile Money`}
                                          </span>
                                          {transaction.metadata.phoneNumber && (
                                            <span className="text-xs text-gray-500">
                                              📱 {transaction.metadata.phoneNumber}
                                            </span>
                                          )}
                                          <span className="text-xs text-blue-600 font-medium">
                                            {transaction.metadata.mnoProvider} Network
                                          </span>
                                        </>
                                      ) : transaction.metadata?.phoneNumber ? (
                                        <>
                                          {/* External Mobile Money (no provider specified) */}
                                          <span className="font-medium">
                                            {transaction.metadata.userName || transaction.metadata.recipientName || 'Mobile Money User'}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            📱 {transaction.metadata.phoneNumber}
                                          </span>
                                          {transaction.type?.includes('MNO') || transaction.type?.includes('WALLET_TO_MNO') ? (
                                            <span className="text-xs text-gray-500">
                                              📱 Mobile Money
                                            </span>
                                          ) : null}
                                        </>
                                      ) : transaction.metadata?.accountNumber ? (
                                        <>
                                          {/* Bank/Utility/Other External Account */}
                                          <span className="font-medium">
                                            {transaction.metadata.userName || transaction.metadata.recipientName || 'External Account'}
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {transaction.type?.includes('BANK') 
                                              ? `🏦 Bank: ${transaction.metadata.accountNumber}`
                                              : transaction.type?.includes('UTILITY')
                                              ? `⚡ Utility: ${transaction.metadata.accountNumber}`
                                              : `Account: ${transaction.metadata.accountNumber}`
                                            }
                                          </span>
                                        </>
                                      ) : transaction.type?.includes('MNO') || transaction.type?.includes('WALLET_TO_MNO') ? (
                                        <>
                                          {/* External Mobile Money (no metadata) */}
                                          <span className="font-medium">Mobile Money</span>
                                          <span className="text-xs text-gray-500">📱 External Network</span>
                                  </>
                                ) : (
                                  <span className="text-gray-500">External</span>
                                      )}
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  {/* Incoming transaction - check if it's a merchant transaction */}
                                  {(() => {
                                    // Check if this is a merchant transaction
                                    const isMerchantTransaction = 
                                      transaction.metadata?.merchantName || 
                                      transaction.metadata?.paymentType === 'MERCHANT_COLLECTION' || 
                                      transaction.metadata?.walletType === 'BUSINESS' ||
                                      transaction.user?.merchantCode ||
                                      transaction.user?.merchant?.businessTradeName;
                                    
                                    // Get merchant name from various sources
                                    const merchantName = 
                                      transaction.metadata?.merchantName ||
                                      transaction.user?.merchant?.businessTradeName ||
                                      transaction.user?.profile?.merchantBusinessTradeName ||
                                      transaction.user?.profile?.businessTradeName ||
                                      transaction.user?.profile?.merchant_names ||
                                      (transaction.user?.merchantCode ? `Merchant (${transaction.user.merchantCode})` : null);
                                    
                                    const merchantCode = 
                                      transaction.metadata?.merchantCode ||
                                      transaction.user?.merchantCode;
                                    
                                    return isMerchantTransaction ? (
                                      <>
                                        {/* Merchant transaction - receiver is the merchant */}
                                        <span className="font-medium">
                                          {merchantName || 'Merchant'}
                                        </span>
                                        {merchantCode && (
                                          <span className="text-xs text-gray-500">
                                            🏪 Code: {merchantCode}
                                          </span>
                                        )}
                                        <span className="text-xs text-blue-600 font-medium">
                                          🏦 Merchant Account
                                        </span>
                                      </>
                                    ) : (
                                    <>
                                      {/* Regular user transaction - receiver is the wallet owner */}
                                      <span className="font-medium">
                                        {transaction.user?.profile?.firstName && transaction.user?.profile?.lastName 
                                          ? `${transaction.user.profile.firstName} ${transaction.user.profile.lastName}`
                                          : transaction.user?.phone || transaction.user?.email || 'Unknown User'
                                        }
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        📱 {transaction.user?.phone || transaction.user?.email || 'N/A'}
                                      </span>
                                      {transaction.user?.userType === 'SUBSCRIBER' && (
                                        <span className="text-xs text-blue-600 font-medium">
                                          🏦 RukaPay Subscriber
                                        </span>
                                      )}
                                    </>
                                  );
                                  })()}
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
                          <TableCell className="font-medium text-green-600">
                            {formatAmount(Number(transaction.netAmount))}
                              </TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell className="text-sm">{formatDate(transaction.createdAt)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleViewTransaction(transaction)}
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {transaction.type === 'WALLET_TO_MNO' && 
                                   (transaction.status === 'FAILED' || transaction.status === 'SUCCESS') && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleReverseTransaction(transaction)}
                                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-600 font-medium"
                                      title={Number(transaction.amount) >= 50000 ? "Reverse (Requires Approval)" : "Reverse Transaction"}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
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
        <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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
                      <div className="flex-1">
                        <p className="font-semibold text-red-900 text-sm">Failure Reason:</p>
                        <p className="text-red-800 text-sm mt-1 font-medium">
                          {(() => {
                            // Priority order: Check errorMessage first (contains ABC error like "Insufficient funds")
                            // Then check metadata for ABC-specific error messages
                            const errorMsg = 
                              selectedTransaction.errorMessage || // Direct errorMessage field (ABC error: "Insufficient funds")
                              selectedTransaction.metadata?.abcErrorMessage || // ABC's specific error message from metadata
                              selectedTransaction.metadata?.abcResponse?.message || // ABC response message
                              selectedTransaction.metadata?.externalMessage || // External partner message
                              selectedTransaction.failureReason || // Legacy field
                              selectedTransaction.metadata?.failureReason || // Legacy metadata field
                              selectedTransaction.metadata?.errorMessage || // Legacy metadata errorMessage
                              'Transaction failed due to processing error. Please contact support for more details.';
                            
                            return errorMsg;
                          })()}
                        </p>
                        {/* Show ABC partner info if available */}
                        {selectedTransaction.partnerMapping?.partner?.partnerCode === 'ABC' && (
                          <p className="text-red-700 text-xs mt-1 italic">
                            Error from ABC partner
                          </p>
                        )}
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
                      <span className="text-gray-600">Channel:</span>
                      <span className="font-medium text-gray-900">
                        {(() => {
                          const channelInfo = getChannelDisplay(selectedTransaction.channel, selectedTransaction.metadata)
                          const ChannelIcon = channelInfo.icon
                          return (
                            <Badge className={`${channelInfo.bgColor} ${channelInfo.color} border flex items-center gap-1.5 px-2 py-1`}>
                              <ChannelIcon className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">{channelInfo.label}</span>
                            </Badge>
                          )
                        })()}
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
                    {selectedTransaction.type === 'REVERSAL' ? 'Reversal Source' : 'Sender'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedTransaction.type === 'REVERSAL' ? (
                      <>
                        {/* Reversal transaction - sender is the system */}
                        <div>
                          <span className="text-orange-600">Source:</span>
                          <p className="font-medium text-orange-900">System Reversal</p>
                        </div>
                        <div>
                          <span className="text-orange-600">Original Transaction:</span>
                          <p className="font-medium text-orange-900 font-mono text-xs">
                            {selectedTransaction.metadata?.originalTransactionReference || 
                             selectedTransaction.metadata?.originalTransactionId?.substring(0, 16) || 
                             'N/A'}
                          </p>
                        </div>
                        {selectedTransaction.metadata?.reversalReason && (
                          <div>
                            <span className="text-orange-600">Reason:</span>
                            <p className="font-medium text-orange-900">{selectedTransaction.metadata.reversalReason}</p>
                          </div>
                        )}
                        {selectedTransaction.metadata?.reversalDetails && (
                          <div>
                            <span className="text-orange-600">Details:</span>
                            <p className="font-medium text-orange-900 text-xs">{selectedTransaction.metadata.reversalDetails}</p>
                          </div>
                        )}
                        <Badge className="bg-orange-600 text-white">Reversal Transaction</Badge>
                      </>
                    ) : selectedTransaction.type === 'DEPOSIT' && selectedTransaction.metadata?.fundedByAdmin ? (
                      <>
                        {/* Admin funded wallet */}
                        <div>
                          <span className="text-blue-600">Admin:</span>
                          <p className="font-medium text-blue-900">
                            {selectedTransaction.metadata.adminName || 'Admin User'}
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-600">Contact:</span>
                          <p className="font-medium text-blue-900">
                            {selectedTransaction.metadata.adminPhone || selectedTransaction.metadata.adminEmail || 'N/A'}
                          </p>
                        </div>
                        {selectedTransaction.metadata.adminId && (
                          <div>
                            <span className="text-blue-600">Admin ID:</span>
                            <p className="font-medium text-blue-900 font-mono text-xs">
                              {selectedTransaction.metadata.adminId.substring(0, 16)}...
                            </p>
                          </div>
                        )}
                        <Badge className="bg-purple-600 text-white">Admin Funding</Badge>
                      </>
                    ) : selectedTransaction.direction === 'DEBIT' ? (
                      <>
                        {/* Outgoing - sender is wallet owner */}
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
                        {/* Incoming - extract sender info */}
                        {selectedTransaction.type === 'MERCHANT_TO_WALLET' || selectedTransaction.type === 'MERCHANT_TO_INTERNAL_WALLET' || selectedTransaction.type?.includes('MERCHANT_TO_WALLET') || selectedTransaction.type?.includes('MERCHANT_TO_INTERNAL_WALLET') ? (
                          <>
                            {/* Merchant sending to wallet */}
                            <div>
                              <span className="text-blue-600">Merchant:</span>
                              <p className="font-medium text-blue-900">
                                {selectedTransaction.metadata?.merchantName || selectedTransaction.metadata?.counterpartyInfo?.name || 'Merchant'}
                              </p>
                            </div>
                            {selectedTransaction.metadata?.merchantCode && (
                              <div>
                                <span className="text-blue-600">Merchant Code:</span>
                                <p className="font-medium text-blue-900">
                                  {selectedTransaction.metadata.merchantCode}
                                </p>
                              </div>
                            )}
                            {selectedTransaction.metadata?.accountNumber && (
                              <div>
                                <span className="text-blue-600">Account:</span>
                                <p className="font-medium text-blue-900">
                                  {selectedTransaction.metadata.accountNumber}
                                </p>
                              </div>
                            )}
                            <Badge className="bg-blue-600 text-white">Internal Account</Badge>
                          </>
                        ) : selectedTransaction.type === 'MNO_TO_WALLET' || selectedTransaction.type?.includes('MNO_TO_WALLET') ? (
                          <>
                            {/* Mobile Money sending to wallet */}
                            {selectedTransaction.metadata?.mnoProvider ? (
                              <>
                        <div>
                          <span className="text-blue-600">Source:</span>
                          <p className="font-medium text-blue-900">
                                    {selectedTransaction.metadata.mnoProvider} Mobile Money
                          </p>
                        </div>
                                {selectedTransaction.metadata.phoneNumber && (
                          <div>
                            <span className="text-blue-600">Phone Number:</span>
                            <p className="font-medium text-blue-900">
                              {selectedTransaction.metadata.phoneNumber}
                            </p>
                          </div>
                        )}
                                {selectedTransaction.metadata.userName && (
                          <div>
                            <span className="text-blue-600">Name:</span>
                            <p className="font-medium text-blue-900">
                              {selectedTransaction.metadata.userName}
                            </p>
                          </div>
                        )}
                                <Badge className="bg-blue-600 text-white">
                                  {selectedTransaction.metadata.mnoProvider} Network
                                </Badge>
                              </>
                            ) : selectedTransaction.metadata?.phoneNumber ? (
                              <>
                                <div>
                                  <span className="text-blue-600">Name:</span>
                                  <p className="font-medium text-blue-900">
                                    {selectedTransaction.metadata.userName || 'Mobile Money User'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-blue-600">Phone Number:</span>
                                  <p className="font-medium text-blue-900">
                                    {selectedTransaction.metadata.phoneNumber}
                                  </p>
                                </div>
                                <Badge className="bg-blue-600 text-white">Mobile Money</Badge>
                              </>
                            ) : (
                              <div>
                                <span className="text-blue-600">Source:</span>
                                <p className="font-medium text-blue-900">External Source</p>
                              </div>
                            )}
                          </>
                        ) : selectedTransaction.type === 'WALLET_TO_WALLET' || selectedTransaction.counterpartyId || selectedTransaction.counterpartyUser ? (
                          <>
                            {/* P2P - Wallet to Wallet - sender is another RukaPay user */}
                            <div>
                              <span className="text-blue-600">Name:</span>
                              <p className="font-medium text-blue-900">
                                {selectedTransaction.counterpartyUser?.profile?.firstName && selectedTransaction.counterpartyUser?.profile?.lastName
                                  ? `${selectedTransaction.counterpartyUser.profile.firstName} ${selectedTransaction.counterpartyUser.profile.lastName}`
                                  : selectedTransaction.metadata?.counterpartyInfo?.name || selectedTransaction.metadata?.userName || 'RukaPay User'
                                }
                              </p>
                            </div>
                            {selectedTransaction.counterpartyUser?.phone && (
                              <div>
                                <span className="text-blue-600">Contact:</span>
                                <p className="font-medium text-blue-900">
                                  {selectedTransaction.counterpartyUser.phone}
                                </p>
                              </div>
                            )}
                            {selectedTransaction.counterpartyId && (
                              <div>
                                <span className="text-blue-600">RukaPay ID:</span>
                                <p className="font-medium text-blue-900">
                                  {selectedTransaction.counterpartyId}
                                </p>
                              </div>
                            )}
                            <Badge className="bg-blue-600 text-white">RukaPay Subscriber</Badge>
                          </>
                        ) : selectedTransaction.metadata?.counterpartyInfo ? (
                          <>
                            <div>
                              <span className="text-blue-600">Name:</span>
                              <p className="font-medium text-blue-900">
                                {selectedTransaction.metadata.counterpartyInfo.name}
                              </p>
                            </div>
                          <div>
                            <span className="text-blue-600">Type:</span>
                            <p className="font-medium text-blue-900">
                              {selectedTransaction.metadata.counterpartyInfo.type}
                              </p>
                            </div>
                            {selectedTransaction.metadata.counterpartyInfo.type === 'USER' && (
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
                                  : 'External Source'
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
                        {selectedTransaction.metadata?.mnoProvider && (
                          <Badge className="bg-blue-600 text-white">
                            {selectedTransaction.metadata.mnoProvider} Network
                          </Badge>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Receiver */}
                <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {selectedTransaction.type === 'REVERSAL' ? 'Credited To' : 'Receiver'}
                  </h4>
                  <div className="space-y-2 text-sm">
                    {selectedTransaction.type === 'REVERSAL' ? (
                      <>
                        {/* Reversal transaction - receiver is the wallet owner getting credited back */}
                        <div>
                          <span className="text-green-600">Name:</span>
                          <p className="font-medium text-green-900">
                            {selectedTransaction.user?.profile?.firstName && selectedTransaction.user?.profile?.lastName 
                              ? `${selectedTransaction.user.profile.firstName} ${selectedTransaction.user.profile.lastName}`
                              : selectedTransaction.user?.phone || selectedTransaction.user?.email || 'Wallet Owner'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-green-600">Contact:</span>
                          <p className="font-medium text-green-900">
                            {selectedTransaction.user?.phone || selectedTransaction.user?.email || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-green-600">Amount Credited:</span>
                          <p className="font-medium text-green-900">
                            {formatAmount(Number(selectedTransaction.amount) + Number(selectedTransaction.fee || 0))}
                          </p>
                        </div>
                        {selectedTransaction.user?.userType === 'SUBSCRIBER' && (
                          <Badge className="bg-green-600 text-white">RukaPay Subscriber</Badge>
                        )}
                        <Badge className="bg-green-600 text-white">💰 Credited Back</Badge>
                      </>
                    ) : selectedTransaction.direction === 'DEBIT' ? (
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
                          {/* Extract receiver info from metadata when counterpartyInfo is not available */}
                          {/* Check if it's a merchant transaction first */}
                          {(() => {
                            const isMerchantTxn = 
                              selectedTransaction.metadata?.merchantName || 
                              selectedTransaction.metadata?.paymentType === 'MERCHANT_COLLECTION' || 
                              selectedTransaction.metadata?.walletType === 'BUSINESS' ||
                              selectedTransaction.user?.merchantCode ||
                              selectedTransaction.user?.merchant?.businessTradeName;
                            
                            const merchantName = 
                              selectedTransaction.metadata?.merchantName ||
                              selectedTransaction.user?.merchant?.businessTradeName ||
                              selectedTransaction.user?.profile?.merchantBusinessTradeName ||
                              selectedTransaction.user?.profile?.businessTradeName ||
                              selectedTransaction.user?.profile?.merchant_names ||
                              (selectedTransaction.user?.merchantCode ? `Merchant (${selectedTransaction.user.merchantCode})` : 'Merchant');
                            
                            return isMerchantTxn ? (
                            <>
                              {/* Merchant transaction - receiver is the merchant */}
                              <div>
                                <span className="text-green-600">Merchant:</span>
                                <p className="font-medium text-green-900">
                                  {merchantName}
                                </p>
                              </div>
                              {selectedTransaction.metadata?.merchantCode && (
                                <div>
                                  <span className="text-green-600">Merchant Code:</span>
                                  <p className="font-medium text-green-900">
                                    {selectedTransaction.metadata.merchantCode}
                                  </p>
                                </div>
                              )}
                              <Badge className="bg-green-600 text-white">Merchant Account</Badge>
                            </>
                          ) : selectedTransaction.type === 'WALLET_TO_WALLET' || selectedTransaction.counterpartyId || selectedTransaction.counterpartyUser ? (
                            <>
                              {/* P2P Internal Transaction */}
                          <div>
                                <span className="text-green-600">Name:</span>
                            <p className="font-medium text-green-900">
                                  {selectedTransaction.counterpartyUser?.profile?.firstName && selectedTransaction.counterpartyUser?.profile?.lastName
                                    ? `${selectedTransaction.counterpartyUser.profile.firstName} ${selectedTransaction.counterpartyUser.profile.lastName}`
                                    : selectedTransaction.metadata?.userName || selectedTransaction.metadata?.recipientName || 'RukaPay User'
                              }
                            </p>
                          </div>
                              {selectedTransaction.counterpartyUser?.phone && (
                                <div>
                                  <span className="text-green-600">Contact:</span>
                                  <p className="font-medium text-green-900">
                                    {selectedTransaction.counterpartyUser.phone}
                                  </p>
                                </div>
                              )}
                              {selectedTransaction.counterpartyId && (
                                <div>
                                  <span className="text-green-600">RukaPay ID:</span>
                                  <p className="font-medium text-green-900">
                                    {selectedTransaction.counterpartyId}
                                  </p>
                                </div>
                              )}
                              <Badge className="bg-blue-600 text-white">RukaPay Subscriber</Badge>
                            </>
                          ) : selectedTransaction.type === 'WALLET_TO_MERCHANT' || selectedTransaction.type === 'WALLET_TO_INTERNAL_MERCHANT' || selectedTransaction.type?.includes('MERCHANT') || selectedTransaction.metadata?.merchantName ? (
                            <>
                              {/* Internal Merchant Transaction */}
                              <div>
                                <span className="text-green-600">Type:</span>
                                <p className="font-medium text-green-900">Merchant Payment</p>
                              </div>
                              <div>
                                <span className="text-green-600">Merchant:</span>
                                <p className="font-medium text-green-900">
                                  {selectedTransaction.metadata?.merchantName || 
                                   selectedTransaction.metadata?.userName || 
                                   selectedTransaction.metadata?.recipientName ||
                                   selectedTransaction.user?.merchant?.businessTradeName ||
                                   selectedTransaction.user?.profile?.merchantBusinessTradeName ||
                                   selectedTransaction.user?.profile?.businessTradeName ||
                                   selectedTransaction.user?.profile?.merchant_names ||
                                   (selectedTransaction.user?.merchantCode ? `Merchant (${selectedTransaction.user.merchantCode})` : 'Merchant')}
                                </p>
                              </div>
                              {selectedTransaction.metadata?.accountNumber && (
                                <div>
                                  <span className="text-green-600">Account Number:</span>
                                  <p className="font-medium text-green-900">
                                    {selectedTransaction.metadata.accountNumber}
                                  </p>
                                </div>
                              )}
                              {selectedTransaction.metadata?.merchantCode && (
                                <div>
                                  <span className="text-green-600">Merchant Code:</span>
                                  <p className="font-medium text-green-900">
                                    {selectedTransaction.metadata.merchantCode}
                                  </p>
                                </div>
                              )}
                              <Badge className="bg-blue-600 text-white">Internal Account</Badge>
                            </>
                          ) : selectedTransaction.type === 'DEPOSIT' ? (
                            <>
                              {/* Wallet Deposit */}
                              <div>
                                <span className="text-green-600">Type:</span>
                                <p className="font-medium text-green-900">Wallet Deposit</p>
                              </div>
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
                          ) : selectedTransaction.type === 'WITHDRAWAL' ? (
                            <>
                              {/* Wallet Withdrawal */}
                              <div>
                                <span className="text-green-600">Type:</span>
                                <p className="font-medium text-green-900">Wallet Withdrawal</p>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* External Recipient - Extract from metadata */}
                              {/* Show recipient name first if available, otherwise show type */}
                              {(selectedTransaction.metadata?.userName || selectedTransaction.metadata?.recipientName) ? (
                                <div>
                                  <span className="text-green-600">Name:</span>
                                  <p className="font-medium text-green-900">
                                    {selectedTransaction.metadata.userName || selectedTransaction.metadata.recipientName}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <span className="text-green-600">Type:</span>
                                  <p className="font-medium text-green-900">
                                    {selectedTransaction.metadata?.mnoProvider 
                                      ? `${selectedTransaction.metadata.mnoProvider} Mobile Money`
                                      : selectedTransaction.type?.includes('BANK')
                                      ? 'Bank Transfer'
                                      : selectedTransaction.type?.includes('UTILITY')
                                      ? 'Utility Payment'
                                      : 'External Account'
                                    }
                                  </p>
                                </div>
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
                              {/* Show network badge only once */}
                              {selectedTransaction.metadata?.mnoProvider && (
                                <Badge className="bg-blue-600 text-white">
                                  {selectedTransaction.metadata.mnoProvider} Network
                                </Badge>
                              )}
                            </>
                          );
                          })()}
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
                          
                          {/* Network badge removed - already shown in receiver section above */}
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

      {/* Reversal Modal */}
      <Dialog open={reversalModalOpen} onOpenChange={setReversalModalOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-orange-600" />
              Reverse Transaction
            </DialogTitle>
            <DialogDescription>
              Submit a reversal request for this WALLET_TO_MNO transaction
            </DialogDescription>
          </DialogHeader>

          {reversalTransaction && (
            <div className="space-y-4">
              {/* Transaction Info */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono font-medium text-xs">{reversalTransaction.reference || reversalTransaction.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold">{formatAmount(Number(reversalTransaction.amount))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total to Refund (incl. fees):</span>
                  <span className="font-bold text-green-600">
                    {formatAmount(Number(reversalTransaction.amount) + Number(reversalTransaction.fee || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  {getStatusBadge(reversalTransaction.status)}
                </div>
              </div>

              {/* High Value Warning */}
              {Number(reversalTransaction.amount) + Number(reversalTransaction.fee || 0) >= 50000 && (
                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-900">High-Value Transaction</p>
                    <p className="text-yellow-800 mt-1">
                      This reversal requires approval from an admin with TRANSACTION_REVERSAL_APPROVE permission.
                      Your request will be reviewed before processing.
                    </p>
                  </div>
                </div>
              )}

              {/* Reversal Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reversal Reason <span className="text-red-500">*</span>
                  </label>
                  <Select value={reversalReason} onValueChange={setReversalReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MNO_FAILURE">MNO Transfer Failed</SelectItem>
                      <SelectItem value="DUPLICATE_TRANSACTION">Duplicate Transaction</SelectItem>
                      <SelectItem value="CUSTOMER_DISPUTE">Customer Dispute</SelectItem>
                      <SelectItem value="TECHNICAL_ERROR">Technical Error</SelectItem>
                      <SelectItem value="FRAUD_PREVENTION">Fraud Prevention</SelectItem>
                      <SelectItem value="INCORRECT_RECIPIENT">Incorrect Recipient</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Explanation <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reversalDetails}
                    onChange={(e) => setReversalDetails(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Provide detailed explanation of why this transaction needs to be reversed. Include verification steps taken with MNO if applicable."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Support Ticket Reference (Optional)
                  </label>
                  <Input
                    value={reversalTicketRef}
                    onChange={(e) => setReversalTicketRef(e.target.value)}
                    placeholder="e.g., TICKET-12345"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setReversalModalOpen(false)}
                  disabled={reversalProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitReversal}
                  disabled={!reversalReason || !reversalDetails || reversalProcessing}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {reversalProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Submit Reversal Request
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Date Range Dialog */}
      <Dialog open={exportDateRangeOpen} onOpenChange={setExportDateRangeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Export Transactions by Date Range
            </DialogTitle>
            <DialogDescription>
              Select a date range to export transactions. The export will include all transactions within the selected dates.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="export-start-date">Start Date</Label>
              <Input
                id="export-start-date"
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                max={exportEndDate || undefined}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="export-end-date">End Date</Label>
              <Input
                id="export-end-date"
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                min={exportStartDate || undefined}
              />
            </div>
            
            {exportStartDate && exportEndDate && new Date(exportStartDate) > new Date(exportEndDate) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Start date must be before end date
                </p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setExportDateRangeOpen(false)
                setExportStartDate("")
                setExportEndDate("")
              }}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!exportStartDate || !exportEndDate) {
                  toast.error('Please select both start and end dates')
                  return
                }
                if (new Date(exportStartDate) > new Date(exportEndDate)) {
                  toast.error('Start date must be before end date')
                  return
                }
                setExportDateRangeOpen(false)
                await exportTransactionsToCSV(true, exportStartDate, exportEndDate)
                setExportStartDate("")
                setExportEndDate("")
              }}
              disabled={isExporting || !exportStartDate || !exportEndDate}
              className="bg-[#08163d] hover:bg-[#0a1f4f]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Transactions
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TransactionsPage 