"use client"

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTransactionSystemStats, useChannelStatistics, useTransactionLogs, useManualTransactionStatusCheck, type ManualStatusCheckResult } from '@/lib/hooks/useTransactions'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import { getChannelDisplay } from '@/lib/utils/transactions'
import { getDisplayNetAmount } from '@/lib/utils/transactionNetDisplay'
import {
  getNormalizedRukapayFee,
  isAirtimeFaceValueLedger,
  normalizeFeeBreakdown,
  resolveExportFeeColumns,
  resolveRukapayFeeForLedgerExport,
  sumPlatformRevenueAccrualsInRange,
} from '@/lib/utils/feeBreakdown'
import { getBasicPartnerDisplayLabel, normalizePartyInfoForDisplay, resolvePaymentPartnerLabel } from '@/components/dashboard/transactions/partyResolver'
import { getKampalaCalendarDate } from '@/lib/utils/kampalaDate'
import * as XLSX from 'xlsx'
import { useOpsTransactionSearch } from '@/lib/hooks/useOpsTransactionSearch'

// Import extracted components
import { TransactionStatsCards } from '@/components/dashboard/transactions/TransactionStatsCards'
import { ChannelStatistics } from '@/components/dashboard/transactions/ChannelStatistics'
import { DateRangeFilter } from '@/components/dashboard/transactions/DateRangeFilter'
import { TransactionFilters } from '@/components/dashboard/transactions/TransactionFilters'
import { TransactionTable } from '@/components/dashboard/transactions/TransactionTable'
import { TransactionDetailsModal } from '@/components/dashboard/transactions/TransactionDetailsModal'
import { ReversalModal } from '@/components/dashboard/transactions/ReversalModal'
import { ExportDialog } from '@/components/dashboard/transactions/ExportDialog'
import { StatusCheckModal } from '@/components/dashboard/transactions/StatusCheckModal'

const EXPORT_ALL_TRANSACTIONS_LIMIT = 100_000
const EXPORT_PAGE_SIZE = 5000

const TransactionsPage = () => {
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState("")
  // Debounce q for typeahead
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350)
    return () => clearTimeout(t)
  }, [searchTerm])
  const isSearching = debouncedSearch.trim().length >= 2

  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [channelFilter, setChannelFilter] = useState("")
  // Three independent date filters:
  //  1. Overall summary cards  -> summaryStartDate / summaryEndDate
  //  2. By-channel statistics   -> channelStartDate / channelEndDate
  //  3. Transactions table      -> startDate / endDate
  // Summary + channel default to last 30 days (Kampala calendar) and stay pre-filled
  // in the date inputs. The table stays empty (= all transactions as they come in).
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const defaultStatsStart = getKampalaCalendarDate(-30)
  const defaultStatsEnd = getKampalaCalendarDate(0)
  const [summaryStartDate, setSummaryStartDate] = useState(defaultStatsStart)
  const [summaryEndDate, setSummaryEndDate] = useState(defaultStatsEnd)
  const [channelStartDate, setChannelStartDate] = useState(defaultStatsStart)
  const [channelEndDate, setChannelEndDate] = useState(defaultStatsEnd)

  const summaryStart = summaryStartDate || defaultStatsStart
  const summaryEnd = summaryEndDate || defaultStatsEnd
  const channelStart = channelStartDate || defaultStatsStart
  const channelEnd = channelEndDate || defaultStatsEnd
  
  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [logsTransaction, setLogsTransaction] = useState<any>(null)
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false)
  
  // Status check modal state
  const [statusCheckTransaction, setStatusCheckTransaction] = useState<any>(null)
  const [isStatusCheckModalOpen, setIsStatusCheckModalOpen] = useState(false)
  const [statusCheckResult, setStatusCheckResult] = useState<ManualStatusCheckResult | null>(null)
  const [statusCheckError, setStatusCheckError] = useState<Error | null>(null)
  const [statusCheckLoading, setStatusCheckLoading] = useState(false)

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

  // Manual status check mutation
  const manualStatusCheckMutation = useManualTransactionStatusCheck()

  // Fetch real transaction system stats with filters
  const { data: transactionStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useTransactionSystemStats({
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    startDate: summaryStart,
    endDate: summaryEnd
  })

  // Fetch channel statistics
  const { data: channelStatsData, isLoading: channelStatsLoading, error: channelStatsError, refetch: refetchChannelStats } = useChannelStatistics(
    channelStart,
    channelEnd
  )

  // Use ops search for ALL listing + searching + filters
  const opsSearch = useOpsTransactionSearch({
    q: debouncedSearch || undefined,
    page: currentPage,
    limit: pageSize,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    channel: channelFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined
  })

  const opsResults = opsSearch.data?.results ?? []

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

  // Ops search already returns enriched rows (sender/receiver/partner/fees).
  // WALLET_INIT is excluded server-side unless the type filter is set to it.
  const transactions = opsResults
  const totalTransactions = opsSearch.data?.total || 0
  const totalPages = opsSearch.data?.totalPages || 1
  const transactionsError = opsSearch.error
  const transactionsLoading = opsSearch.isLoading

  // Fetch API logs when logs modal is open and a transaction is selected
  const {
    data: transactionLogs,
    isLoading: logsLoading,
    error: logsError,
  } = useTransactionLogs(isLogsModalOpen && logsTransaction ? logsTransaction.id : undefined)

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchTerm("")
    setStatusFilter("")
    setTypeFilter("")
    setChannelFilter("")
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

  // Refetch summary stats when its own date filter changes. (react-query already refetches
  // on query-key change, but this keeps behaviour explicit for the manual-refetch path.)
  useEffect(() => {
    refetchStats()
  }, [summaryStart, summaryEnd, refetchStats])

  // Handle view transaction details — prefer full record so balance before/after and
  // other ledger fields are present (ops search rows can be a thinner DTO).
  const handleViewTransaction = async (transaction: any) => {
    setSelectedTransaction(transaction)
    setIsModalOpen(true)
    if (!transaction?.id) return
    try {
      const res = await api.get(`/transactions/${transaction.id}`)
      const full = res.data?.data ?? res.data
      if (full?.id) {
        setSelectedTransaction({
          ...transaction,
          ...full,
          // Keep enriched party labels from ops search when full fetch omits them
          senderInfo: full.senderInfo ?? transaction.senderInfo,
          receiverInfo: full.receiverInfo ?? transaction.receiverInfo,
        })
      }
    } catch {
      // Keep the ops search row already shown in the modal
    }
  }

  // Open the modal for a transaction — does NOT fire the API call yet
  const handleManualStatusCheck = (transaction: any) => {
    if (!transaction?.id) return
    setStatusCheckTransaction(transaction)
    setStatusCheckResult(null)
    setStatusCheckError(null)
    setStatusCheckLoading(false)
    setIsStatusCheckModalOpen(true)
  }

  // Actually fire the status check API — called by the button inside the modal
  const handlePerformStatusCheck = () => {
    if (!statusCheckTransaction?.id) return
    setStatusCheckResult(null)
    setStatusCheckError(null)
    setStatusCheckLoading(true)

    manualStatusCheckMutation.mutateAsync(statusCheckTransaction.id)
      .then((result) => {
        console.log('[MANUAL_STATUS_CHECK][FRONTEND] Modal result', {
          transactionId: statusCheckTransaction.id,
          partnerCode: result?.data?.partnerCode,
          partnerStatus: result?.data?.partnerStatus,
          previousStatus: result?.data?.previousStatus,
          newStatus: result?.data?.newStatus,
          statusChanged: result?.data?.statusChanged,
        })
        setStatusCheckResult(result)
        if (result?.data?.statusChanged) {
          toast.success(result.message)
        }
      })
      .catch((error: any) => {
        setStatusCheckError(error)
      })
      .finally(() => {
        setStatusCheckLoading(false)
      })
  }

  // Handle view API logs for a transaction
  const handleViewApiLogs = (transaction: any) => {
    setLogsTransaction(transaction)
    setIsLogsModalOpen(true)
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

  // Helper to safely get Bank Name and Receiver Name for WALLET_TO_BANK transactions (for CSV/export)
  const getBankAndReceiverForExport = (tx: any) => {
    try {
      const metadata = tx?.metadata || {}
      const original = metadata.originalTransaction || {}
      const mode = tx?.type || metadata.mode || original.mode

      const isWalletToBank =
        mode === 'WALLET_TO_BANK' ||
        metadata.mode === 'WALLET_TO_BANK' ||
        original.mode === 'WALLET_TO_BANK'

      if (!isWalletToBank) {
        return {
          bankName: '',
          receiverName: '',
        }
      }

      const bankName =
        original.bankName ||
        metadata.bankName ||
        original.bank ||
        metadata.bank ||
        metadata.counterpartyInfo?.bankName ||
        ''

      const receiverName =
        original.recipientName ||
        metadata.recipientName ||
        metadata.counterpartyInfo?.name ||
        ''

      return {
        bankName,
        receiverName,
      }
    } catch {
      return {
        bankName: '',
        receiverName: '',
      }
    }
  }

  // Export transactions to CSV
  const exportTransactionsToCSV = async (exportAll: boolean = false, customStartDate?: string, customEndDate?: string) => {
    setIsExporting(true)
    try {
      let transactionsToExport: any[] = transactions
      
      // Use custom dates if provided, otherwise use current filters
      const exportStart = customStartDate || startDate
      const exportEnd = customEndDate || endDate
      // Compute once here — used both in the fetch params and in per-row column logic below.
      const isDatedLedgerExport = !!(exportStart || exportEnd)

      // Only statuses that can have platform_revenue_entries should use the revenue-aligned path.
      // FAILED / PENDING transactions never have revenue entries — sending them to the
      // revenue-aligned endpoint would return 0 rows.
      const NON_REVENUE_STATUSES = ['FAILED', 'PENDING', 'CANCELLED']
      const isNonRevenueStatusFilter = NON_REVENUE_STATUSES.includes(statusFilter)
      // Revenue-aligned path: use when we have a date range AND the status filter isn't
      // explicitly a non-revenue status (e.g. SUCCESS, or no filter = "all").
      const useRevenueAligned = isDatedLedgerExport && !isNonRevenueStatusFilter
      // After the revenue-aligned primary fetch, also fetch ALL transactions by createdAt for
      // the same period and append any that weren't in the primary set. This catches:
      //   • Zero-fee transactions (bill payments, wallet topups with rukapayFee = 0) — these
      //     never get a platform_revenue_entry so are invisible to the revenue-aligned path.
      //   • Failed transactions — also have no revenue entries.
      //   • Any transaction created in the period whose revenue was credited in the next period.
      // All of these contribute 0 to column L, so the column sum still equals the dashboard card.
      const shouldSupplementFromCreatedAt = useRevenueAligned

      let bookedRevenueTotalFromApi: number | null = null
      let revenueEntryCountFromApi: number | null = null
      
      if (exportAll) {
        // --- Primary fetch ---
        const allRows: any[] = []
        let page = 1
        let total = Number.POSITIVE_INFINITY

        while (allRows.length < EXPORT_ALL_TRANSACTIONS_LIMIT && allRows.length < total) {
          const response = await api({
            url: '/transactions/all',
            method: 'GET',
            params: {
              page,
              limit: EXPORT_PAGE_SIZE,
              status: statusFilter || undefined,
              type: typeFilter || undefined,
              // Revenue-aligned: paginates platform_revenue_entries by creditedAt so that
              // column L sums exactly to bookedRevenueTotal (= the dashboard card).
              // Non-revenue status filters (FAILED, PENDING) use startDate/endDate instead.
              ...(useRevenueAligned
                ? { revenueStartDate: exportStart || undefined, revenueEndDate: exportEnd || undefined }
                : { startDate: exportStart || undefined, endDate: exportEnd || undefined }),
            },
          })

          const payload = response.data?.data ?? response.data
          const batch = payload?.transactions ?? []
          total = typeof payload?.total === 'number' ? payload.total : batch.length
          if (payload?.bookedRevenueTotal != null) {
            bookedRevenueTotalFromApi = Number(payload.bookedRevenueTotal)
          }
          if (payload?.revenueEntryCount != null) {
            revenueEntryCountFromApi = Number(payload.revenueEntryCount)
          } else if (typeof payload?.total === 'number') {
            revenueEntryCountFromApi = Number(payload.total)
          }

          if (!batch.length) break
          allRows.push(...batch)
          if (batch.length < EXPORT_PAGE_SIZE) break
          page += 1
        }

        transactionsToExport = allRows.slice(0, EXPORT_ALL_TRANSACTIONS_LIMIT)

        // --- Supplementary fetch: all transactions by createdAt in the same period ---
        // The revenue-aligned primary fetch only returns transactions with a booked
        // platform_revenue_entry. Any transaction where rukapayFee = 0 (common for bill
        // payments and wallet topups where the entire fee goes to the utility/telecom) never
        // gets a revenue entry and is completely absent from the primary set. Failed
        // transactions are also invisible. This second pass fetches everything by createdAt
        // and appends only the IDs that weren't already returned by the primary fetch.
        // Because these supplementary rows often have no in-range accrual, the per-row
        // RukaPay Fee falls back to the transaction fee via resolveRukapayFeeForLedgerExport.
        // The Revenue Summary sheet still uses the API booked-revenue total.
        if (shouldSupplementFromCreatedAt) {
          const revenueIds = new Set(transactionsToExport.map((tx: any) => tx.id))
          const supplementRows: any[] = []
          let suppPage = 1
          let suppTotal = Number.POSITIVE_INFINITY
          const remainingCap = EXPORT_ALL_TRANSACTIONS_LIMIT - transactionsToExport.length

          while (supplementRows.length < remainingCap && supplementRows.length < suppTotal) {
            const suppRes = await api({
              url: '/transactions/all',
              method: 'GET',
              params: {
                page: suppPage,
                limit: EXPORT_PAGE_SIZE,
                // Respect any active type filter so the ledger stays coherent.
                // No status filter — we want everything: zero-fee SUCCESS, FAILED, PENDING, etc.
                type: typeFilter || undefined,
                startDate: exportStart || undefined,
                endDate: exportEnd || undefined,
              },
            })
            const sp = suppRes.data?.data ?? suppRes.data
            const sb = sp?.transactions ?? []
            suppTotal = typeof sp?.total === 'number' ? sp.total : sb.length
            if (!sb.length) break
            // Only add IDs not already in the revenue-aligned primary set.
            supplementRows.push(...sb.filter((tx: any) => !revenueIds.has(tx.id)))
            if (sb.length < EXPORT_PAGE_SIZE) break
            suppPage += 1
          }

          transactionsToExport = [...transactionsToExport, ...supplementRows]
        }

        // Revenue-aligned export: WALLET_INIT has no platform_revenue_entries so they never
        // appear in the results. Non-dated exports filter them client-side.
        if (!isDatedLedgerExport) {
          transactionsToExport = transactionsToExport.filter((tx: any) => tx.type !== 'WALLET_INIT')
        }
        
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

      // Convert transactions to Excel rows
      const excelRows = transactionsToExport.map((tx: any) => {
        const metadata = tx.metadata || {}

        // Use the same sender/receiver resolution as the transaction table (partyResolver).
        // Gateway partners (LIPAD, BOBPLUS) belong in Partner — external MNO rail is the sender.
        const senderParty = tx.senderInfo
          ? normalizePartyInfoForDisplay(tx.senderInfo, tx, 'sender')
          : null
        const receiverParty = tx.receiverInfo
          ? normalizePartyInfoForDisplay(tx.receiverInfo, tx, 'receiver')
          : null

        let senderName: string
        let senderContact: string

        if (senderParty?.name) {
          senderName = senderParty.name
          senderContact = senderParty.contact || 'N/A'
        } else if (tx.type === 'DEPOSIT' && metadata.fundedByAdmin) {
          senderName = metadata.adminName || 'Admin User'
          senderContact = metadata.adminPhone || metadata.adminEmail || 'Admin'
        } else if (tx.direction === 'DEBIT') {
          if (tx.user?.profile?.firstName && tx.user?.profile?.lastName) {
            senderName = `${tx.user.profile.firstName} ${tx.user.profile.lastName}`
          } else {
            senderName = tx.user?.phone || tx.user?.email || 'Unknown User'
          }
          senderContact = tx.user?.phone || tx.user?.email || 'N/A'
        } else {
          senderName = metadata.counterpartyInfo?.name || 'External'
          senderContact =
            metadata.counterpartyInfo?.accountNumber ||
            metadata.counterpartyInfo?.phone ||
            'N/A'
        }

        let receiverName: string
        let receiverContact: string

        if (receiverParty?.name) {
          receiverName = receiverParty.name
          receiverContact = receiverParty.contact || 'N/A'
        } else if (tx.type === 'DEPOSIT' && metadata.fundedByAdmin) {
          if (tx.user?.profile?.firstName && tx.user?.profile?.lastName) {
            receiverName = `${tx.user.profile.firstName} ${tx.user.profile.lastName}`
          } else {
            receiverName = tx.user?.phone || tx.user?.email || 'RukaPay User'
          }
          receiverContact = tx.user?.phone || tx.user?.email || 'N/A'
        } else if (tx.direction === 'DEBIT') {
          receiverName = metadata.counterpartyInfo?.name || 'External'
          receiverContact =
            metadata.counterpartyInfo?.accountNumber ||
            metadata.counterpartyInfo?.phone ||
            'N/A'
        } else {
          if (tx.user?.profile?.firstName && tx.user?.profile?.lastName) {
            receiverName = `${tx.user.profile.firstName} ${tx.user.profile.lastName}`
          } else {
            receiverName = tx.user?.phone || tx.user?.email || 'Unknown User'
          }
          receiverContact = tx.user?.phone || tx.user?.email || 'N/A'
        }

        // Wallet-to-bank specific fields from metadata
        const { bankName, receiverName: walletToBankReceiverName } = getBankAndReceiverForExport(tx)
        const amount = Number(tx.amount) || 0
        const fees = normalizeFeeBreakdown(tx)
        const partnerLabel = resolvePaymentPartnerLabel(tx) || getBasicPartnerDisplayLabel(tx)
        const exportFees = resolveExportFeeColumns({
          ...tx,
          metadata: { ...metadata, description: tx.description },
          partnerLabel,
        })
        const { rukapayFee, telecomFee, partnerFee: partnerFeeValue } = exportFees
        // Dated ledger export: prefer booked platform revenue when credited in-range.
        // Fall back to the transaction's actual RukaPay fee when accrual is missing,
        // out of range, or booked as 0 — otherwise rows that look correct on the
        // dashboard (details modal / fee column) silently export as 0.
        // The Revenue Summary sheet still uses the API booked-revenue total so it
        // reconciles with Dashboard / Platform Revenue.
        const rukapayFeeForExport = isDatedLedgerExport
          ? resolveRukapayFeeForLedgerExport(tx, exportStart, exportEnd, rukapayFee)
          : rukapayFee
        // Always show when the fee was booked into platform revenue, regardless of
        // whether the accrual date falls inside the export window. Supplementary-batch
        // rows (fetched by createdAt) may have accruals from a prior or later period —
        // hiding them made the column appear to "stop" mid-file.
        const revenueCreditedAt = tx.platformRevenueAccrual?.creditedAt
          ? new Date(tx.platformRevenueAccrual.creditedAt).toLocaleString('en-GB', {
              timeZone: 'Africa/Kampala',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : ''

        const governmentTax = fees.governmentTax
        const isAirtimeLedger = isAirtimeFaceValueLedger(tx)

        let finalTotalFee = isAirtimeLedger
          ? rukapayFeeForExport
          : fees.totalFee
        if (!isAirtimeLedger && finalTotalFee === 0) {
          const feeField = Number(tx.fee) || 0
          if (feeField > 0) {
            finalTotalFee = feeField
          } else {
            const netAmountValue = Number(tx.netAmount) || 0
            if (netAmountValue > 0 && amount !== netAmountValue) {
              finalTotalFee = Math.abs(amount - netAmountValue)
            }
          }
        }

        // Net Amount: must match TransactionTable NetAmountCell
        const netAmountForExport = (() => {
          if (metadata.sweepToDisbursement || metadata.sweepFromCollection) {
            return (metadata.netToDisbursement ?? Number(tx.netAmount)) || 0
          }
          const n = getDisplayNetAmount(tx)
          return n == null ? '' : n
        })()

        // Format date in EAT (UTC+3)
        const dateTime = tx.createdAt
          ? new Date(tx.createdAt).toLocaleString('en-GB', {
              timeZone: 'Africa/Kampala',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : ''

        return {
          Reference: tx.reference || tx.id,
          'External Reference': tx.externalReference || '',
          'Transaction ID': tx.id,
          Type: tx.type || '',
          Channel: getChannelDisplay(tx.channel, tx.metadata).label,
          Status: tx.status || '',
          Direction: tx.direction || '',
          Amount: amount,
          Currency: tx.currency || 'UGX',
          'Telecom Fee': telecomFee,
          'Partner Fee': partnerFeeValue,
          'RukaPay Fee': rukapayFeeForExport,
          'Revenue credited at': revenueCreditedAt,
          'Government Tax': governmentTax,
          'Total Fee': finalTotalFee,
          'Net Amount': netAmountForExport,
          'Sender Name': senderName,
          'Sender Contact': senderContact,
          'Receiver Name': walletToBankReceiverName || receiverName,
          'Receiver Contact': receiverContact,
          'Bank Name': bankName,
          Partner: partnerLabel,
          'Date & Time': dateTime,
          Description: tx.description || '',
          'Error Message': tx.errorMessage || '',
        }
      })

      // Booked revenue total for the period (API / accruals). This is intentionally
      // separate from a manual sum of the RukaPay Fee column, which may fall back to
      // the transaction fee when an accrual is missing.
      const sumRukapayFeeColumn =
        isDatedLedgerExport && bookedRevenueTotalFromApi != null
          ? bookedRevenueTotalFromApi
          : isDatedLedgerExport
            ? sumPlatformRevenueAccrualsInRange(
                transactionsToExport,
                exportStart,
                exportEnd,
              )
            : Number(
                transactionsToExport
                  .reduce((sum: number, tx: any) => sum + getNormalizedRukapayFee(tx), 0)
                  .toFixed(2),
              )

      let rukapayGrossRevenue: number | null =
        typeof bookedRevenueTotalFromApi === 'number' &&
        Number.isFinite(bookedRevenueTotalFromApi)
          ? bookedRevenueTotalFromApi
          : null
      try {
        const statsParams = new URLSearchParams()
        if (exportStart) statsParams.set('startDate', exportStart)
        if (exportEnd) statsParams.set('endDate', exportEnd)
        if (statusFilter) statsParams.set('status', statusFilter)
        if (typeFilter) statsParams.set('type', typeFilter)
        const statsRes = await api.get(`/transactions/system/stats?${statsParams}`)
        const statsPayload = statsRes.data?.data ?? statsRes.data
        if (
          rukapayGrossRevenue == null &&
          statsPayload?.rukapayRevenue != null
        ) {
          rukapayGrossRevenue = Number(statsPayload.rukapayRevenue)
        }
      } catch {
        // Stats API may be unavailable on older backends
      }

      const revenueSummaryRows = [
        ...(rukapayGrossRevenue != null
          ? [
              {
                Metric: 'RukaPay Gross Revenue',
                Value: rukapayGrossRevenue,
                Note: 'Same total as Dashboard and Transaction Ledgers for this period',
              },
            ]
          : []),
        {
          Metric: 'Booked RukaPay revenue (period)',
          Value: sumRukapayFeeColumn,
          Note: isDatedLedgerExport
            ? 'Credited platform_revenue_entries for the period — matches Dashboard / Platform Revenue. May differ from a manual sum of the RukaPay Fee column when some rows fall back to the transaction fee (missing accrual).'
            : 'Sum of RukaPay Fee column values',
        },
        {
          Metric: 'Revenue accruals in period',
          Value: isDatedLedgerExport
            ? (revenueEntryCountFromApi ?? '—')
            : transactionsToExport.length,
          Note: isDatedLedgerExport
            ? 'Credited platform_revenue_entries — same count as dashboard booked revenue'
            : 'Transaction rows in file',
        },
        {
          Metric: 'Transactions in export',
          Value: transactionsToExport.length,
          Note: isDatedLedgerExport
            ? shouldSupplementFromCreatedAt
              ? 'Revenue transactions (by creditedAt) + all transactions by created date (zero-fee, failed, etc.)'
              : isNonRevenueStatusFilter
                ? 'Transactions by created date — no revenue alignment'
                : 'Transactions with booked revenue in period'
            : 'Rows in file',
        },
      ]

      // Build Excel workbook
      const worksheet = XLSX.utils.json_to_sheet(excelRows)
      const revenueSummarySheet = XLSX.utils.json_to_sheet(revenueSummaryRows)

      // Set column widths for readability
      worksheet['!cols'] = [
        { wch: 30 }, // Reference
        { wch: 24 }, // External Reference
        { wch: 32 }, // Transaction ID
        { wch: 22 }, // Type
        { wch: 14 }, // Channel
        { wch: 10 }, // Status
        { wch: 10 }, // Direction
        { wch: 14 }, // Amount
        { wch: 8 },  // Currency
        { wch: 14 }, // Telecom Fee
        { wch: 14 }, // Partner Fee
        { wch: 14 }, // RukaPay Fee
        { wch: 22 }, // Revenue credited at
        { wch: 14 }, // Government Tax
        { wch: 12 }, // Total Fee
        { wch: 14 }, // Net Amount
        { wch: 26 }, // Sender Name
        { wch: 18 }, // Sender Contact
        { wch: 26 }, // Receiver Name
        { wch: 18 }, // Receiver Contact
        { wch: 18 }, // Bank Name
        { wch: 22 }, // Partner
        { wch: 22 }, // Date & Time
        { wch: 40 }, // Description
        { wch: 30 }, // Error Message
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
      XLSX.utils.book_append_sheet(workbook, revenueSummarySheet, 'Revenue summary')

      const exportType = exportAll ? 'all' : 'current_page'
      const dateStr = exportStart && exportEnd
        ? `${exportStart}_to_${exportEnd}`.replace(/\//g, '-')
        : new Date().toISOString().split('T')[0]
      const fileName = `transactions_${exportType}_${dateStr}.xlsx`

      XLSX.writeFile(workbook, fileName)

      toast.success(
        rukapayGrossRevenue != null
          ? `Exported ${transactionsToExport.length} transaction(s). RukaPay Gross Revenue: ${rukapayGrossRevenue.toLocaleString('en-UG')}`
          : `Exported ${transactionsToExport.length} transaction(s) as Excel`,
      )
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
    const fees = normalizeFeeBreakdown(tx)
    const effectiveRukapayFee = getNormalizedRukapayFee(tx)

    const totalFeeForRow =
      fees.totalFee > 0 ? fees.totalFee : Number(tx.fee) || 0

    acc.totalFees += totalFeeForRow
    acc.rukapayFees += effectiveRukapayFee
    acc.partnerFees += fees.partnerFee
    acc.governmentTaxes += fees.governmentTax
    
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
      
      <main className="dashboard-shell py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Ledgers</h1>
              <p className="mt-2 text-gray-600">Investigate and analyze transaction information</p>
            </div>
          </div>

          {/* Overall summary — own date filter (defaults to last 30 days) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Overall Summary</h2>
              <DateRangeFilter
                label="Summary:"
                startDate={summaryStartDate}
                endDate={summaryEndDate}
                onStartDateChange={setSummaryStartDate}
                onEndDateChange={setSummaryEndDate}
                onClear={() => {
                  setSummaryStartDate(defaultStatsStart)
                  setSummaryEndDate(defaultStatsEnd)
                }}
              />
            </div>
            <TransactionStatsCards
              stats={stats}
              isLoading={statsLoading}
              startDate={summaryStart}
              endDate={summaryEnd}
              typeFilter={typeFilter || undefined}
              statusFilter={statusFilter || undefined}
            />
          </div>

          {/* By-channel statistics — own date filter (defaults to last 30 days) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">By Channel</h2>
              <DateRangeFilter
                label="Channel:"
                startDate={channelStartDate}
                endDate={channelEndDate}
                onStartDateChange={setChannelStartDate}
                onEndDateChange={setChannelEndDate}
                onClear={() => {
                  setChannelStartDate(defaultStatsStart)
                  setChannelEndDate(defaultStatsEnd)
                }}
              />
            </div>
            <ChannelStatistics
              channelStatsData={channelStatsData}
              isLoading={channelStatsLoading}
              error={channelStatsError}
              onRetry={() => void refetchChannelStats()}
              startDate={channelStart}
              endDate={channelEnd}
            />
          </div>

          {/* Transactions Table — own date filter (empty = all, as they come in) */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Transaction Management</CardTitle>
                  <CardDescription>
                    {searchTerm ? (
                      <span>
                        Searching for "{searchTerm}" (results shown above). Table below remains paginated.
                      </span>
                    ) : (
                      'View and manage different types of transactions'
                    )}
                  </CardDescription>
                </div>
                <DateRangeFilter
                  label="Transactions:"
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
                channelFilter={channelFilter}
                onChannelFilterChange={(value) => {
                  setChannelFilter(value)
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

              {isSearching && (
                <div className="mb-3 -mt-2 text-xs text-gray-600">
                  Showing server-side search results in the table below.
                  {opsSearch.isLoading ? ' Searching…' : ''}
                </div>
              )}

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
                onViewApiLogs={handleViewApiLogs}
                onManualStatusCheck={handleManualStatusCheck}
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

      {/* API Logs Modal (reuses TransactionDetailsModal with logs attached in metadata) */}
      <TransactionDetailsModal
        isOpen={isLogsModalOpen}
        onOpenChange={(open) => {
          setIsLogsModalOpen(open)
          if (!open) {
            setLogsTransaction(null)
          }
        }}
        transaction={
          logsTransaction
            ? {
                ...logsTransaction,
                metadata: {
                  ...(logsTransaction.metadata || {}),
                  apiLogs: transactionLogs || [],
                  apiLogsError: logsError ? (logsError as any)?.message || 'Failed to load API logs' : undefined,
                  apiLogsLoading: logsLoading,
                },
              }
            : null
        }
        transactions={transactions}
        onSelectTransaction={setSelectedTransaction}
      />

      {/* Partner Status Check Modal */}
      <StatusCheckModal
        isOpen={isStatusCheckModalOpen}
        onOpenChange={(open) => {
          setIsStatusCheckModalOpen(open)
          if (!open) setStatusCheckTransaction(null)
        }}
        transaction={statusCheckTransaction}
        isLoading={statusCheckLoading}
        result={statusCheckResult}
        error={statusCheckError}
        onCheck={handlePerformStatusCheck}
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
