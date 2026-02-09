"use client"

import React, { useMemo, useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  BarChart3,
  DollarSign,
  Users,
  TrendingUp,
  Loader2,
  AlertCircle,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer
} from 'lucide-react'
import {
  useCustomerCount,
  useTransactionVolume,
  useTransactionsByGender,
  useTransactionsByAmountBands,
  useBouMonthlyReport,
  type BouMonthlyReport
} from '@/lib/hooks/useFinanceReports'

interface CustomerCountData {
  totalCustomers: number
  newCustomers: number
  startDate: string
  endDate: string
}

interface TransactionVolumeData {
  totalVolume: number
  totalCount: number
  averageAmount: number
  currency: string
  startDate: string
  endDate: string
  status?: string
}

interface GenderStats {
  gender: string
  totalVolume: number
  totalCount: number
  averageAmount: number
}

interface GenderData {
  genderStats: GenderStats[]
  totalVolume: number
  totalCount: number
  startDate: string
  endDate: string
  status?: string
}

interface AmountBandStats {
  minAmount: number
  maxAmount: number
  totalVolume: number
  totalCount: number
  averageAmount: number
}

interface AmountBandData {
  bandStats: AmountBandStats[]
  totalVolume: number
  totalCount: number
  startDate: string
  endDate: string
  status?: string
}

const ReportsPage = () => {
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [currencyFilter, setCurrencyFilter] = useState<string>("ALL")
  const [activeTab, setActiveTab] = useState("overview")

  // BOU monthly report month selector (YYYY-MM)
  const [bouMonth, setBouMonth] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  })
  
  // Convert dates to ISO strings for API
  const startDateTime = new Date(startDate).toISOString()
  const endDateTime = new Date(endDate + 'T23:59:59').toISOString()
  
  // Amount bands configuration
  const amountBands = [
    { minAmount: 0, maxAmount: 10000 },
    { minAmount: 10001, maxAmount: 50000 },
    { minAmount: 50001, maxAmount: 100000 },
    { minAmount: 100001, maxAmount: 500000 },
    { minAmount: 500001, maxAmount: 1000000 },
    { minAmount: 1000001, maxAmount: 999999999 }
  ]
  
  // Fetch data using React Query hooks
  const { data: customerData, isLoading: customerLoading, refetch: refetchCustomers } = useCustomerCount(
    startDateTime,
    endDateTime,
    true
  )
  
  // Convert "ALL" to undefined for API calls
  const statusForApi = statusFilter === "ALL" ? undefined : statusFilter
  const currencyForApi = currencyFilter === "ALL" ? undefined : currencyFilter
  
  const { data: volumeData, isLoading: volumeLoading, refetch: refetchVolume } = useTransactionVolume(
    startDateTime,
    endDateTime,
    statusForApi,
    currencyForApi,
    true
  )
  
  const { data: genderData, isLoading: genderLoading, refetch: refetchGender } = useTransactionsByGender(
    startDateTime,
    endDateTime,
    statusForApi,
    currencyForApi,
    true
  )
  
  const { data: amountBandData, isLoading: amountBandLoading, refetch: refetchAmountBands } = useTransactionsByAmountBands(
    startDateTime,
    endDateTime,
    statusForApi,
    currencyForApi,
    amountBands,
    true
  )

  // BOU monthly report data
  const { data: bouReport, isLoading: bouLoading, refetch: refetchBou } = useBouMonthlyReport(
    bouMonth,
    true
  )

  const formatCurrency = (amount: number, currency: string = "UGX") => {
    if (currency === "UGX") {
      return `${amount.toLocaleString('en-US')} ${currency}`
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleRefresh = () => {
    refetchCustomers()
    refetchVolume()
    refetchGender()
    refetchAmountBands()
    refetchBou()
  }

  const handleGenerateBouReport = () => {
    refetchBou()
  }

  const downloadBlob = (content: string, mimeType: string, filename: string) => {
    if (typeof window === 'undefined') return
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const buildBouCsv = (report: BouMonthlyReport): string => {
    const lines: string[] = []
    lines.push('BOU Monthly Report')
    lines.push(`Month,${report.period.month}`)
    lines.push(`Period Start,${report.period.start}`)
    lines.push(`Period End,${report.period.end}`)
    lines.push('')
    lines.push('Section,Metric,Value')
    lines.push(`Transactions,Total Count,${report.transactions.totalCount}`)
    lines.push(`Transactions,Total Volume,${report.transactions.totalVolume}`)
    lines.push(`Cash In,Count,${report.transactions.cashIn.count}`)
    lines.push(`Cash In,Volume,${report.transactions.cashIn.volume}`)
    lines.push(`Cash Out,Count,${report.transactions.cashOut.count}`)
    lines.push(`Cash Out,Volume,${report.transactions.cashOut.volume}`)
    lines.push(`P2P,Count,${report.transactions.p2p.count}`)
    lines.push(`P2P,Volume,${report.transactions.p2p.volume}`)
    lines.push(`Wallet To Bank,Count,${report.transactions.walletToBank.count}`)
    lines.push(`Wallet To Bank,Volume,${report.transactions.walletToBank.volume}`)
    lines.push(`Merchant To Wallet,Count,${report.transactions.merchantToWallet.count}`)
    lines.push(`Merchant To Wallet,Volume,${report.transactions.merchantToWallet.volume}`)
    lines.push('')
    lines.push('Band Label,Min,Max,Transaction Count,Total Volume')
    report.transactions.bands.forEach((b) => {
      lines.push([
        `"${b.label}"`,
        b.min ?? '',
        b.max ?? '',
        b.transactionCount,
        b.totalVolume
      ].join(','))
    })
    lines.push('')
    lines.push('Entity,Metric,Value')
    lines.push(`Customers,Total,${report.customers.total}`)
    lines.push(`Customers,Female,${report.customers.female}`)
    lines.push(`Customers,Male,${report.customers.male}`)
    lines.push(`Merchants,Total,${report.merchants.total}`)
    lines.push(`Merchants,Female,${report.merchants.female}`)
    lines.push(`Merchants,Male,${report.merchants.male}`)
    lines.push(`Wallets,Total Active Balance,${report.wallets.totalActiveBalance}`)
    return lines.join('\n')
  }

  const buildBouHtml = (report: BouMonthlyReport): string => {
    const generatedAt = new Date(report.generatedAt).toLocaleString()
    const bandsRows = report.transactions.bands.map((b) => {
      const max = b.max == null ? '' : b.max
      return `
        <tr>
          <td>${b.label}</td>
          <td>${b.min}</td>
          <td>${max}</td>
          <td>${b.transactionCount}</td>
          <td>${b.totalVolume}</td>
        </tr>
      `
    }).join('')

    return `
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>BOU Monthly Report - ${report.period.month}</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            h2 { font-size: 18px; margin-top: 24px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 14px; }
            th { background: #f3f4f6; text-align: left; }
            .meta { color: #6b7280; margin-bottom: 16px; font-size: 14px; }
            .section { margin-top: 16px; }
          </style>
        </head>
        <body>
          <h1>Bank of Uganda Monthly Report</h1>
          <div class="meta">
            <div><strong>Month:</strong> ${report.period.month}</div>
            <div><strong>Period:</strong> ${report.period.start} &mdash; ${report.period.end}</div>
            <div><strong>Generated At:</strong> ${generatedAt}</div>
          </div>

          <div class="section">
            <h2>1. Transaction Summary</h2>
            <table>
              <tbody>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Total Transactions</td><td>${report.transactions.totalCount}</td></tr>
                <tr><td>Total Volume</td><td>${report.transactions.totalVolume}</td></tr>
                <tr><td>Cash In - Count</td><td>${report.transactions.cashIn.count}</td></tr>
                <tr><td>Cash In - Volume</td><td>${report.transactions.cashIn.volume}</td></tr>
                <tr><td>Cash Out - Count</td><td>${report.transactions.cashOut.count}</td></tr>
                <tr><td>Cash Out - Volume</td><td>${report.transactions.cashOut.volume}</td></tr>
                <tr><td>P2P - Count</td><td>${report.transactions.p2p.count}</td></tr>
                <tr><td>P2P - Volume</td><td>${report.transactions.p2p.volume}</td></tr>
                <tr><td>Wallet to Bank - Count</td><td>${report.transactions.walletToBank.count}</td></tr>
                <tr><td>Wallet to Bank - Volume</td><td>${report.transactions.walletToBank.volume}</td></tr>
                <tr><td>Merchant to Wallet - Count</td><td>${report.transactions.merchantToWallet.count}</td></tr>
                <tr><td>Merchant to Wallet - Volume</td><td>${report.transactions.merchantToWallet.volume}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>2. Transaction Bands</h2>
            <table>
              <thead>
                <tr>
                  <th>Band</th>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Transaction Count</th>
                  <th>Total Volume</th>
                </tr>
              </thead>
              <tbody>
                ${bandsRows}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>3. Customers</h2>
            <table>
              <tbody>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Total Customers</td><td>${report.customers.total}</td></tr>
                <tr><td>Female Customers</td><td>${report.customers.female}</td></tr>
                <tr><td>Male Customers</td><td>${report.customers.male}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>4. Merchants</h2>
            <table>
              <tbody>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Total Merchants</td><td>${report.merchants.total}</td></tr>
                <tr><td>Female Merchants</td><td>${report.merchants.female}</td></tr>
                <tr><td>Male Merchants</td><td>${report.merchants.male}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>5. Wallets</h2>
            <table>
              <tbody>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Total Active Wallet Balance</td><td>${report.wallets.totalActiveBalance}</td></tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `
  }

  const handleDownloadBouExcel = () => {
    if (!bouReport) {
      alert('Generate the BOU monthly report first.')
      return
    }
    const csv = buildBouCsv(bouReport)
    const filename = `bou_report_${bouReport.period.month}.csv`
    downloadBlob(csv, 'text/csv;charset=utf-8;', filename)
  }

  const handleDownloadBouWord = () => {
    if (!bouReport) {
      alert('Generate the BOU monthly report first.')
      return
    }
    const html = buildBouHtml(bouReport)
    const filename = `bou_report_${bouReport.period.month}.doc`
    downloadBlob(html, 'application/msword;charset=utf-8;', filename)
  }

  const handleOpenBouPdf = () => {
    if (!bouReport) {
      alert('Generate the BOU monthly report first.')
      return
    }
    const html = buildBouHtml(bouReport)
    const win = window.open('', '_blank')
    if (!win) {
      alert('Popup blocked. Please allow popups for this site.')
      return
    }
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.focus()
    // User can use browser "Print" -> "Save as PDF"
  }

  const isLoading = customerLoading || volumeLoading || genderLoading || amountBandLoading

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance Reports</h1>
                <p className="text-gray-600">Comprehensive financial analytics and insights</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-600" />
                <CardTitle>Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Currencies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Currencies</SelectItem>
                      <SelectItem value="UGX">UGX</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {customerLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    customerData?.totalCustomers?.toLocaleString() || '0'
                  )}
                </p>
                {customerData && (
                  <p className="text-sm text-gray-500 mt-1">
                    {customerData.newCustomers.toLocaleString()} new in period
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Volume</p>
                  <DollarSign className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {volumeLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    volumeData ? formatCurrency(volumeData.totalVolume, volumeData.currency) : '0'
                  )}
                </p>
                {volumeData && (
                  <p className="text-sm text-gray-500 mt-1">
                    {volumeData.totalCount.toLocaleString()} transactions
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Average Amount</p>
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {volumeLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    volumeData ? formatCurrency(volumeData.averageAmount, volumeData.currency) : '0'
                  )}
                </p>
                {volumeData && (
                  <p className="text-sm text-gray-500 mt-1">
                    Per transaction
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <BarChart3 className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {volumeLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    volumeData?.totalCount?.toLocaleString() || '0'
                  )}
                </p>
                {volumeData && (
                  <p className="text-sm text-gray-500 mt-1">
                    {statusForApi ? `Status: ${statusForApi}` : 'All statuses'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* BOU Monthly Report (Bank of Uganda) */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>Bank of Uganda Monthly Report</CardTitle>
                  <CardDescription>
                    Generate the official monthly summary and export to Excel, Word or PDF.
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Month</span>
                    <Input
                      type="month"
                      value={bouMonth}
                      onChange={(e) => setBouMonth(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleGenerateBouReport}
                    disabled={bouLoading}
                  >
                    {bouLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {!bouLoading && <RefreshCw className="h-4 w-4" />}
                    <span>{bouLoading ? 'Generating...' : 'Generate Report'}</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {bouReport ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      <div>
                        Period:{' '}
                        <span className="font-medium">
                          {bouReport.period.start} &mdash; {bouReport.period.end}
                        </span>
                      </div>
                      <div>
                        Generated at:{' '}
                        <span className="font-medium">
                          {new Date(bouReport.generatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={handleDownloadBouExcel}
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={handleDownloadBouWord}
                      >
                        <FileText className="h-4 w-4" />
                        Word
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={handleOpenBouPdf}
                      >
                        <Printer className="h-4 w-4" />
                        PDF / Print
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                        Transactions
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        Total:{' '}
                        <span className="font-semibold">
                          {bouReport.transactions.totalCount.toLocaleString()}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        Volume:{' '}
                        <span className="font-semibold">
                          {bouReport.transactions.totalVolume.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                        Customers
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        Total:{' '}
                        <span className="font-semibold">
                          {bouReport.customers.total.toLocaleString()}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        Female:{' '}
                        <span className="font-semibold">
                          {bouReport.customers.female.toLocaleString()}
                        </span>
                        {' • '}
                        Male:{' '}
                        <span className="font-semibold">
                          {bouReport.customers.male.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                        Merchants & Wallets
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        Merchants:{' '}
                        <span className="font-semibold">
                          {bouReport.merchants.total.toLocaleString()}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        Active Wallet Balance:{' '}
                        <span className="font-semibold">
                          {bouReport.wallets.totalActiveBalance.toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : bouLoading ? (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating BOU monthly report...
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  No BOU report generated yet. Select a month and click{' '}
                  <span className="font-medium">Generate Report</span>.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reports Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="gender" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                By Gender
              </TabsTrigger>
              <TabsTrigger value="amount-bands" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount Bands
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Customer Count Card */}
              {customerData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Registration</CardTitle>
                    <CardDescription>
                      Period: {formatDate(customerData.startDate)} - {formatDate(customerData.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Customers</p>
                        <p className="text-2xl font-bold text-gray-900">{customerData.totalCustomers.toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">New Customers (Period)</p>
                        <p className="text-2xl font-bold text-green-700">{customerData.newCustomers.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transaction Volume Card */}
              {volumeData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Volume</CardTitle>
                    <CardDescription>
                      {volumeData.status && `Status: ${volumeData.status} • `}
                      Period: {formatDate(volumeData.startDate)} - {formatDate(volumeData.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Volume</p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(volumeData.totalVolume, volumeData.currency)}
                        </p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Total Transactions</p>
                        <p className="text-xl font-bold text-purple-700">
                          {volumeData.totalCount.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Average Amount</p>
                        <p className="text-xl font-bold text-green-700">
                          {formatCurrency(volumeData.averageAmount, volumeData.currency)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isLoading && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-4">Loading report data...</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="gender" className="space-y-6 mt-6">
              {genderLoading ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-4">Loading gender statistics...</p>
                  </CardContent>
                </Card>
              ) : genderData ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Transactions by Gender</CardTitle>
                    <CardDescription>
                      {genderData.status && `Status: ${genderData.status} • `}
                      Period: {formatDate(genderData.startDate)} - {formatDate(genderData.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Gender</TableHead>
                            <TableHead className="text-right">Total Volume</TableHead>
                            <TableHead className="text-right">Transaction Count</TableHead>
                            <TableHead className="text-right">Average Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {genderData.genderStats.map((stat: GenderStats, idx: number) => (
                            <TableRow key={idx} className="hover:bg-gray-50">
                              <TableCell className="font-medium">{stat.gender}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(stat.totalVolume, currencyForApi || "UGX")}
                              </TableCell>
                              <TableCell className="text-right">{stat.totalCount.toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(stat.averageAmount, currencyForApi || "UGX")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <tfoot>
                          <TableRow className="bg-gray-50 font-semibold">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(genderData.totalVolume, currencyForApi || "UGX")}
                            </TableCell>
                            <TableCell className="text-right">{genderData.totalCount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">-</TableCell>
                          </TableRow>
                        </tfoot>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-4">No gender data available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="amount-bands" className="space-y-6 mt-6">
              {amountBandLoading ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-4">Loading amount band statistics...</p>
                  </CardContent>
                </Card>
              ) : amountBandData ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Transactions by Amount Bands</CardTitle>
                    <CardDescription>
                      {amountBandData.status && `Status: ${amountBandData.status} • `}
                      Period: {formatDate(amountBandData.startDate)} - {formatDate(amountBandData.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Amount Range</TableHead>
                            <TableHead className="text-right">Total Volume</TableHead>
                            <TableHead className="text-right">Transaction Count</TableHead>
                            <TableHead className="text-right">Average Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {amountBandData.bandStats.map((stat: AmountBandStats, idx: number) => (
                            <TableRow key={idx} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                {formatCurrency(stat.minAmount, currencyForApi || "UGX")} - {
                                  stat.maxAmount === 999999999 
                                    ? "∞" 
                                    : formatCurrency(stat.maxAmount, currencyForApi || "UGX")
                                }
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(stat.totalVolume, currencyForApi || "UGX")}
                              </TableCell>
                              <TableCell className="text-right">{stat.totalCount.toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(stat.averageAmount, currencyForApi || "UGX")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <tfoot>
                          <TableRow className="bg-gray-50 font-semibold">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(amountBandData.totalVolume, currencyForApi || "UGX")}
                            </TableCell>
                            <TableCell className="text-right">{amountBandData.totalCount.toLocaleString()}</TableCell>
                            <TableCell className="text-right">-</TableCell>
                          </TableRow>
                        </tfoot>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-4">No amount band data available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default ReportsPage
