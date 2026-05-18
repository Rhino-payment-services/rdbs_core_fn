"use client"

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Wallet, 
  Plus, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Building2,
  Filter,
  Search,
  ExternalLink,
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  useAdminWallets,
  useCreateSystemFeeWallet,
  useWithdrawSystemFeeWallet,
  usePlatformRevenueBalance,
  usePlatformRevenueEntries,
  isPlatformRevenueWallet,
} from '@/lib/hooks/useWallets'
import { PlatformRevenuePanel } from '@/components/dashboard/PlatformRevenuePanel'
import { useGatewayPartners } from '@/lib/hooks/useGatewayPartners'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import { extractErrorMessage } from '@/lib/utils'
import toast from 'react-hot-toast'
import Navbar from '@/components/dashboard/Navbar'
import type { Wallet as WalletType } from '@/lib/types/api'
const SystemWalletsPage = () => {
  const [showCreateSystemWallet, setShowCreateSystemWallet] = useState(false)
  const [showWithdrawSystemWallet, setShowWithdrawSystemWallet] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [partnerFilter, setPartnerFilter] = useState<string>('all')
  const [currencyFilter, setCurrencyFilter] = useState<string>('all')
  const [revenueEntriesPage, setRevenueEntriesPage] = useState(1)
  const [revenueReferenceSearch, setRevenueReferenceSearch] = useState('')
  
  const [systemWalletForm, setSystemWalletForm] = useState({
    currency: 'UGX',
    partnerId: 'general',
    description: ''
  })
  
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    destinationAccount: '',
    destinationBank: '',
    narration: ''
  })

  // Fetch wallets filtered to SYSTEM type
  const { data: walletsData, isLoading: isWalletsLoading, error: walletsError, refetch } = useAdminWallets({
    category: 'SYSTEM',
    search: searchTerm || undefined,
    currency: currencyFilter !== 'all' ? currencyFilter : undefined,
    page: 1,
    limit: 1000
  })

  const { data: gatewayPartnersResponse } = useGatewayPartners(1, 100)
  
  // Fetch external payment partners
  const { data: externalPartnersData } = useQuery({
    queryKey: ['external-payment-partners'],
    queryFn: async () => {
      const response = await api.get('/admin/external-payment-partners')
      return response.data
    },
  })

  // Extract gateway partners from response - handle different response structures
  // Based on gateway-partners page: partnersResponse?.data
  const gatewayPartners = gatewayPartnersResponse?.data || []
  const createSystemFeeWallet = useCreateSystemFeeWallet()
  const withdrawSystemFeeWallet = useWithdrawSystemFeeWallet()
  const { handleError } = useErrorHandler()

  const { data: platformRevenueBalanceRes, refetch: refetchPlatformRevenue } = usePlatformRevenueBalance()
  const platformRevenueCurrency = platformRevenueBalanceRes?.data?.currency ?? 'UGX'

  const {
    data: revenueEntriesRes,
    isLoading: revenueEntriesLoading,
    refetch: refetchRevenueEntries,
  } = usePlatformRevenueEntries({
    currency: platformRevenueCurrency,
    page: revenueEntriesPage,
    limit: 25,
    reference: revenueReferenceSearch.trim() || undefined,
  })

  const revenueEntries = revenueEntriesRes?.data?.items ?? []
  const revenueEntriesPagination = revenueEntriesRes?.data?.pagination

  // Process wallets data
  let walletsArray: WalletType[] = []
  if (walletsData) {
    if (Array.isArray(walletsData)) {
      walletsArray = walletsData.filter((w: WalletType) => w.walletType === 'SYSTEM')
    } else if (typeof walletsData === 'object') {
      if (walletsData.wallets && Array.isArray(walletsData.wallets)) {
        walletsArray = walletsData.wallets.filter((w: WalletType) => w.walletType === 'SYSTEM')
      } else if (walletsData.data && Array.isArray(walletsData.data)) {
        walletsArray = walletsData.data.filter((w: WalletType) => w.walletType === 'SYSTEM')
      }
    }
  }

  const platformRevenueWallets = useMemo(
    () => walletsArray.filter((w) => isPlatformRevenueWallet(w)),
    [walletsArray],
  )

  const legacyFeeWallets = useMemo(
    () => walletsArray.filter((w) => !isPlatformRevenueWallet(w)),
    [walletsArray],
  )

  // Filter by partner (legacy fee wallets only — platform revenue is consolidated)
  const filteredWallets = useMemo(() => {
    let filtered = legacyFeeWallets

    if (partnerFilter !== 'all') {
      if (partnerFilter === 'general') {
        filtered = filtered.filter((w: any) => !w.partnerId)
      } else {
        filtered = filtered.filter((w: any) => w.partnerId === partnerFilter)
      }
    }

    return filtered
  }, [legacyFeeWallets, partnerFilter])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCreateSystemFeeWallet = async () => {
    if (!systemWalletForm.currency) {
      toast.error('Please select a currency')
      return
    }

    try {
      await createSystemFeeWallet.mutateAsync({
        currency: systemWalletForm.currency,
        partnerId: systemWalletForm.partnerId === 'general' ? undefined : systemWalletForm.partnerId,
        description: systemWalletForm.description || undefined,
      })
      
      toast.success('System fee wallet created successfully!')
      setSystemWalletForm({ currency: 'UGX', partnerId: 'general', description: '' })
      setShowCreateSystemWallet(false)
      refetch()
    } catch (error) {
      handleError(error, 'Failed to create system fee wallet')
    }
  }

  const handleWithdrawSystemFeeWallet = async () => {
    const amount = parseFloat(withdrawForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (!withdrawForm.destinationAccount) {
      toast.error('Please provide a destination account')
      return
    }

    try {
      await withdrawSystemFeeWallet.mutateAsync({
        amount,
        destinationAccount: withdrawForm.destinationAccount,
        destinationBank: withdrawForm.destinationBank || undefined,
        narration: withdrawForm.narration || undefined,
      })
      
      toast.success(`Withdrew ${formatCurrency(amount, selectedWallet?.currency || 'UGX')} from system fee wallet`)
      setWithdrawForm({ amount: '', destinationAccount: '', destinationBank: '', narration: '' })
      setShowWithdrawSystemWallet(false)
      setSelectedWallet(null)
      refetch()
    } catch (error) {
      handleError(error, 'Failed to withdraw from system fee wallet')
    }
  }

  const getCurrencyBadge = (currency: string) => {
    switch (currency) {
      case 'UGX':
        return <Badge className="bg-blue-100 text-blue-800">UGX</Badge>
      case 'KES':
        return <Badge className="bg-green-100 text-green-800">KES</Badge>
      case 'USD':
        return <Badge className="bg-green-100 text-green-800">USD</Badge>
      case 'EUR':
        return <Badge className="bg-purple-100 text-purple-800">EUR</Badge>
      default:
        return <Badge variant="outline">{currency}</Badge>
    }
  }

  /** Legacy RUKAPAY_FEES / COMMISSION wallets only — excludes PLATFORM_REVENUE_* */
  const legacyFeesBalance = filteredWallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const generalWallets = filteredWallets.filter((w: any) => !w.partnerId)
  const partnerWallets = filteredWallets.filter((w: any) => w.partnerId)
  
  // Combine both partner types for lookup
  const allPartners = [
    ...gatewayPartners,
    ...(externalPartnersData || [])
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Platform revenue & system wallets</h1>
                <p className="text-gray-600 mt-2">
                  Liquidate consolidated RukaPay fee revenue. Legacy per-partner fee wallets are shown separately and are not included in revenue totals.
                </p>
              </div>
              <Dialog open={showCreateSystemWallet} onOpenChange={setShowCreateSystemWallet}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create System Fee Wallet
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create System Fee Wallet</DialogTitle>
                    <DialogDescription>
                      Create a system wallet to track RukaPay fees. Can be general or partner-specific.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="systemCurrency">Currency</Label>
                      <Select 
                        value={systemWalletForm.currency} 
                        onValueChange={(value) => setSystemWalletForm(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                          <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="partnerId">Partner (Optional)</Label>
                      <Select 
                        value={systemWalletForm.partnerId} 
                        onValueChange={(value) => setSystemWalletForm(prev => ({ ...prev, partnerId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select partner (leave empty for general wallet)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General RukaPay Fee Wallet</SelectItem>
                          {/* Gateway Partners (API Partners) */}
                          {gatewayPartners.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                                Gateway Partners
                              </div>
                              {gatewayPartners.map((partner: any) => (
                                <SelectItem key={partner.id} value={partner.id}>
                                  {partner.partnerName}
                                </SelectItem>
                              ))}
                            </>
                          )}
                          {/* External Payment Partners */}
                          {(externalPartnersData || []).length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                                External Payment Partners
                              </div>
                              {(externalPartnersData || []).map((partner: any) => (
                                <SelectItem key={partner.id} value={partner.id}>
                                  {partner.partnerName}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to create a general RukaPay fee wallet, or select a partner for partner-specific fees
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="systemDescription">Description (Optional)</Label>
                      <Input
                        id="systemDescription"
                        name="description"
                        value={systemWalletForm.description}
                        onChange={(e) => setSystemWalletForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="e.g., RukaPay fees from ABC partner"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateSystemWallet(false)
                          setSystemWalletForm({ currency: 'UGX', partnerId: 'general', description: '' })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateSystemFeeWallet}
                        disabled={createSystemFeeWallet.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {createSystemFeeWallet.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Create System Wallet
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by description or wallet ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Filter by partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wallets</SelectItem>
                  <SelectItem value="general">General Wallets</SelectItem>
                  {gatewayPartners.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                        Gateway Partners
                      </div>
                      {gatewayPartners.map((partner: any) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.partnerName}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {(externalPartnersData || []).length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                        External Payment Partners
                      </div>
                      {(externalPartnersData || []).map((partner: any) => (
                        <SelectItem key={partner.id} value={partner.id}>
                          {partner.partnerName}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="UGX">UGX</SelectItem>
                  <SelectItem value="KES">KES</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <PlatformRevenuePanel
            walletDescription={
              platformRevenueWallets[0]?.description || 'PLATFORM_REVENUE'
            }
          />

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Revenue accrual history</CardTitle>
              <CardDescription>
                Each row is a RukaPay fee credited from a successful transaction into the platform revenue wallet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by transaction reference…"
                    value={revenueReferenceSearch}
                    onChange={(e) => {
                      setRevenueReferenceSearch(e.target.value)
                      setRevenueEntriesPage(1)
                    }}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetchRevenueEntries()
                    refetchPlatformRevenue()
                  }}
                >
                  Refresh
                </Button>
              </div>

              {revenueEntriesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : revenueEntries.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  No revenue entries yet. Fees appear here after successful transactions are credited (live or backfill).
                </p>
              ) : (
                <>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Credited</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Partner</TableHead>
                          <TableHead className="text-right">Txn amount</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revenueEntries.map((entry) => {
                          const tx = entry.transaction
                          return (
                            <TableRow key={entry.id}>
                              <TableCell className="text-sm whitespace-nowrap">
                                {new Date(entry.creditedAt).toLocaleString()}
                              </TableCell>
                              <TableCell className="font-mono text-sm max-w-[140px] truncate" title={tx?.reference ?? ''}>
                                {tx?.reference || '—'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {entry.transactionType || tx?.type || '—'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {entry.channel || tx?.channel || '—'}
                              </TableCell>
                              <TableCell className="text-sm max-w-[160px] truncate" title={entry.partnerLabel ?? ''}>
                                {entry.partnerLabel || '—'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {tx?.amount != null
                                  ? formatCurrency(tx.amount, tx.currency || entry.currency)
                                  : '—'}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm font-semibold text-indigo-700">
                                +{formatCurrency(entry.amount, entry.currency)}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/dashboard/transactions/${entry.transactionId}`}>
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    View
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {revenueEntriesPagination && revenueEntriesPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Page {revenueEntriesPagination.page} of {revenueEntriesPagination.totalPages} ·{' '}
                        {revenueEntriesPagination.total} entries
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={revenueEntriesPage <= 1}
                          onClick={() => setRevenueEntriesPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={revenueEntriesPage >= revenueEntriesPagination.totalPages}
                          onClick={() => setRevenueEntriesPage((p) => p + 1)}
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

          {/* Stats Cards — legacy fee wallets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Legacy fee wallets balance</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(legacyFeesBalance, 'UGX')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Excludes platform revenue</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">General Wallets</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {generalWallets.length}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Partner Wallets</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {partnerWallets.length}
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wallets List */}
          <Card>
            <CardHeader>
              <CardTitle>Legacy system fee wallets</CardTitle>
              <CardDescription>
                Deprecated RUKAPAY_FEES / COMMISSION wallets (migrate balances with decommission script).{' '}
                {filteredWallets.length} {filteredWallets.length === 1 ? 'wallet' : 'wallets'} shown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isWalletsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading system wallets...</p>
                </div>
              ) : walletsError ? (
                <div className="text-center py-12">
                  <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-600">Failed to load system wallets</p>
                  <p className="text-sm text-red-500 mt-2">{extractErrorMessage(walletsError)}</p>
                  <Button 
                    onClick={() => refetch()} 
                    variant="outline" 
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              ) : filteredWallets.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No system wallets found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {searchTerm || partnerFilter !== 'all' || currencyFilter !== 'all'
                      ? 'No wallets match your filters'
                      : 'Create your first system fee wallet to get started'}
                  </p>
                  {!searchTerm && partnerFilter === 'all' && currencyFilter === 'all' && (
                    <Button 
                      onClick={() => setShowCreateSystemWallet(true)} 
                      className="mt-4 bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create System Fee Wallet
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWallets.map((wallet) => {
                    const partner = allPartners.find((p: any) => p.id === (wallet as any).partnerId)
                    
                    return (
                      <Card key={wallet.id} className="hover:shadow-md transition-shadow border-purple-100">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <Wallet className="h-5 w-5 text-purple-600 shrink-0" />
                              <CardTitle className="text-lg truncate">
                                {wallet.description || (partner ? `${partner.partnerName} Fees` : 'General RukaPay Fees')}
                              </CardTitle>
                            </div>
                            <Badge className="bg-purple-100 text-purple-800">SYSTEM</Badge>
                          </div>
                          <CardDescription className="flex items-center gap-2 flex-wrap">
                            {getCurrencyBadge(wallet.currency)}
                            {partner && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <Building2 className="h-3 w-3 mr-1" />
                                {partner.partnerName}
                              </Badge>
                            )}
                            {!partner && (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                                General
                              </Badge>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm text-gray-600">Balance</p>
                              <p className="text-2xl font-bold text-purple-600">
                                {formatCurrency(wallet.balance, wallet.currency)}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                              <span className="text-sm text-gray-500">Wallet ID</span>
                              <span className="text-xs font-mono text-gray-400">
                                {wallet.id.slice(0, 8)}...
                              </span>
                            </div>
                            
                            <div className="pt-3 space-y-2">
                              <Button
                                size="sm"
                                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 py-2.5"
                                onClick={() => {
                                  setSelectedWallet(wallet)
                                  setWithdrawForm({ amount: '', destinationAccount: '', destinationBank: '', narration: '' })
                                  setShowWithdrawSystemWallet(true)
                                }}
                              >
                                <CreditCard className="w-4 h-4" strokeWidth={2.5} />
                                <span>Withdraw</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdraw System Fee Wallet Dialog */}
          <Dialog open={showWithdrawSystemWallet} onOpenChange={(open) => {
            setShowWithdrawSystemWallet(open)
            if (!open) {
              setSelectedWallet(null)
              setWithdrawForm({ amount: '', destinationAccount: '', destinationBank: '', narration: '' })
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw from System Fee Wallet</DialogTitle>
                <DialogDescription>
                  {selectedWallet && (
                    <>
                      Withdraw funds from{' '}
                      {selectedWallet.description || 'System Fee Wallet'}
                      {selectedWallet.partnerId && (
                        <span className="block text-xs text-gray-500 mt-1">
                          Partner: {allPartners.find((p: any) => p.id === selectedWallet.partnerId)?.partnerName || 'Unknown'}
                        </span>
                      )}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Current Balance</label>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedWallet?.balance || 0, selectedWallet?.currency || 'UGX')}
                  </p>
                </div>
                <div>
                  <Label htmlFor="withdrawAmount">Amount <span className="text-red-500">*</span></Label>
                  <Input
                    id="withdrawAmount"
                    name="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="destinationAccount">Destination Account <span className="text-red-500">*</span></Label>
                  <Input
                    id="destinationAccount"
                    name="destinationAccount"
                    placeholder="e.g., Account number, Mobile money number"
                    value={withdrawForm.destinationAccount}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, destinationAccount: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="destinationBank">Destination Bank (Optional)</Label>
                  <Input
                    id="destinationBank"
                    name="destinationBank"
                    placeholder="e.g., Bank name"
                    value={withdrawForm.destinationBank}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, destinationBank: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="narration">Narration (Optional)</Label>
                  <Input
                    id="narration"
                    name="narration"
                    placeholder="e.g., Withdrawal for operations"
                    value={withdrawForm.narration}
                    onChange={(e) => setWithdrawForm(prev => ({ ...prev, narration: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWithdrawSystemWallet(false)
                      setSelectedWallet(null)
                      setWithdrawForm({ amount: '', destinationAccount: '', destinationBank: '', narration: '' })
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleWithdrawSystemFeeWallet}
                    disabled={withdrawSystemFeeWallet.isPending}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {withdrawSystemFeeWallet.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Withdrawing...
                      </>
                    ) : (
                      'Withdraw'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </main>
    </div>
  )
}

export default SystemWalletsPage
