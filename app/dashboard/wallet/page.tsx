"use client"

import React, { useState, useEffect } from 'react'
import { 
  Wallet, 
  Plus, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useAdminWallets, useUpdateWalletBalance, useSuspendWallet, useFundWallet, useUpdateDailyLimit, useUpdateMonthlyLimit } from '@/lib/hooks/useWallets'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import { extractErrorMessage } from '@/lib/utils'
import toast from 'react-hot-toast'
import Navbar from '@/components/dashboard/Navbar'
import type { Wallet as WalletType } from '@/lib/types/api'
import { useRouter } from 'next/navigation'

const WalletPage = () => {
  const [showCreateWallet, setShowCreateWallet] = useState(false)
  const [showFundWallet, setShowFundWallet] = useState(false)
  const [showIncreaseLimit, setShowIncreaseLimit] = useState(false)
  const [showMonthlyLimit, setShowMonthlyLimit] = useState(false)
  const [showWalletDetails, setShowWalletDetails] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [walletForm, setWalletForm] = useState({
    currency: 'UGX',
    description: ''
  })
  const [fundForm, setFundForm] = useState({
    amount: '',
    reason: '',
    reference: ''
  })
  const [limitForm, setLimitForm] = useState({
    dailyLimit: '',
    reason: ''
  })
  const [monthlyLimitForm, setMonthlyLimitForm] = useState({
    monthlyLimit: '',
    reason: ''
  })
  type WalletFilters = {
    category?:
      | 'PERSONAL'
      | 'BUSINESS'
      | 'BUSINESS_COLLECTION'
      | 'BUSINESS_DISBURSEMENT'
      | 'SYSTEM'
      | 'OTHER'
    search?: string
    currency?: string
    isActive?: boolean
    isSuspended?: boolean
    page?: number
    limit?: number
  }

  const [filters, setFilters] = useState<WalletFilters>({
    category: undefined,
    search: undefined,
    currency: undefined,
    isActive: undefined,
    isSuspended: undefined,
    page: 1,
    limit: 50
  })

  const { data: walletsData, isLoading: isWalletsLoading, error: walletsError, refetch } = useAdminWallets(filters)
  const updateWalletBalance = useUpdateWalletBalance()
  const suspendWallet = useSuspendWallet()
  const fundWallet = useFundWallet()
  const updateDailyLimit = useUpdateDailyLimit()
  const updateMonthlyLimit = useUpdateMonthlyLimit()
  const { handleError } = useErrorHandler()
  const router = useRouter()

  // Debug logging
  React.useEffect(() => {
    if (walletsData) {
      console.log('Wallets Data Received:', walletsData)
    }
    if (walletsError) {
      console.error('Wallets Error:', walletsError)
    }
  }, [walletsData, walletsError])

  // Handle different API response structures
  // Support both direct array and wrapped response formats
  let walletsArray: WalletType[] = []
  let categoryStats: any = {}
  let totalWallets = 0
  let apiPage: number | undefined
  let apiLimit: number | undefined
  let apiTotalPages: number | undefined
  
  if (walletsData) {
    console.log('Processing walletsData:', walletsData)
    if (Array.isArray(walletsData)) {
      walletsArray = walletsData
      totalWallets = walletsData.length
      console.log('Wallets is array, count:', walletsArray.length)
    } else if (typeof walletsData === 'object') {
      if (walletsData.wallets && Array.isArray(walletsData.wallets)) {
        walletsArray = walletsData.wallets
        categoryStats = walletsData.categoryStats || {}
        totalWallets = walletsData.total || walletsArray.length
        apiPage = walletsData.page
        apiLimit = walletsData.limit
        apiTotalPages = walletsData.totalPages
        console.log('Wallets found in response, count:', walletsArray.length, 'Stats:', categoryStats)
      } else if (walletsData.data && Array.isArray(walletsData.data)) {
        walletsArray = walletsData.data
        totalWallets = walletsArray.length
        console.log('Wallets found in data property, count:', walletsArray.length)
      } else {
        console.warn('Unexpected walletsData structure:', walletsData)
      }
    }
  } else {
    // Only log in development, not during build
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      console.log('No walletsData yet, isLoading:', isWalletsLoading, 'error:', walletsError)
    }
  }

  const getStatusBadge = (wallet: WalletType) => {
    if (wallet.isSuspended) {
      return <Badge className="bg-red-100 text-red-800">Suspended</Badge>
    } else if (wallet.isActive) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    }
  }

  const getCurrencyBadge = (currency: string) => {
    switch (currency) {
      case 'UGX':
        return <Badge className="bg-blue-100 text-blue-800">UGX</Badge>
      case 'USD':
        return <Badge className="bg-green-100 text-green-800">USD</Badge>
      case 'EUR':
        return <Badge className="bg-purple-100 text-purple-800">EUR</Badge>
      default:
        return <Badge variant="outline">{currency}</Badge>
    }
  }

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

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }

  const handleCreateWallet = async () => {
    if (!walletForm.currency) {
      toast.error('Please select a currency')
      return
    }

    setIsCreating(true)
    try {
      await updateWalletBalance.mutateAsync({
        walletId: 'temp-wallet-id',
        amount: 0,
        reason: 'Initial balance'
      })
      
      toast.success('Wallet balance updated successfully!')
      setWalletForm({ currency: 'UGX', description: '' })
      setShowCreateWallet(false)
    } catch (error) {
      handleError(error, 'Failed to update wallet balance')
    } finally {
      setIsCreating(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setWalletForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFundWallet = async () => {
    if (!selectedWallet) return
    
    const amount = parseFloat(fundForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }
    
    if (!fundForm.reason) {
      toast.error('Please provide a reason for funding')
      return
    }

    try {
      await fundWallet.mutateAsync({
        walletId: selectedWallet.id,
        amount,
        reason: fundForm.reason,
        reference: fundForm.reference || undefined
      })
      
      toast.success(`Wallet funded successfully with ${formatCurrency(amount, selectedWallet.currency)}`)
      setFundForm({ amount: '', reason: '', reference: '' })
      setShowFundWallet(false)
      setSelectedWallet(null)
      refetch()
    } catch (error) {
      handleError(error, 'Failed to fund wallet')
    }
  }

  const handleIncreaseLimit = async () => {
    if (!selectedWallet) return
    
    const newLimit = parseFloat(limitForm.dailyLimit)
    if (isNaN(newLimit) || newLimit <= 0) {
      toast.error('Please enter a valid daily limit')
      return
    }

    try {
      await updateDailyLimit.mutateAsync({
        walletId: selectedWallet.id,
        dailyLimit: newLimit,
        reason: limitForm.reason || undefined
      })
      
      toast.success(`Daily limit updated to ${formatCurrency(newLimit, selectedWallet.currency)}`)
      setLimitForm({ dailyLimit: '', reason: '' })
      setShowIncreaseLimit(false)
      setSelectedWallet(null)
      refetch()
    } catch (error) {
      handleError(error, 'Failed to update daily limit')
    }
  }

  const handleUpdateMonthlyLimit = async () => {
    if (!selectedWallet) return

    const newLimit = parseFloat(monthlyLimitForm.monthlyLimit)
    if (isNaN(newLimit) || newLimit <= 0) {
      toast.error('Please enter a valid monthly limit')
      return
    }

    try {
      await updateMonthlyLimit.mutateAsync({
        walletId: selectedWallet.id,
        monthlyLimit: newLimit,
        reason: monthlyLimitForm.reason || undefined,
      })

      toast.success(`Monthly limit updated to ${formatCurrency(newLimit, selectedWallet.currency)}`)
      setMonthlyLimitForm({ monthlyLimit: '', reason: '' })
      setShowMonthlyLimit(false)
      setSelectedWallet(null)
      refetch()
    } catch (error) {
      handleError(error, 'Failed to update monthly limit')
    }
  }

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value || undefined, page: 1 }))
  }

  const handleCategoryChange = (value: string) => {
    const categoryValue = value === '' || value === 'all' 
      ? undefined 
      : (value as
          | 'PERSONAL'
          | 'BUSINESS'
          | 'BUSINESS_COLLECTION'
          | 'BUSINESS_DISBURSEMENT'
          | 'SYSTEM'
          | 'OTHER')
    setFilters(prev => ({ ...prev, category: categoryValue, page: 1 }))
  }

  // Use backend-provided aggregates when available so summary cards
  // reflect the full result set (respecting filters), not just the
  // current page slice.
  const totalBalance =
    categoryStats && typeof categoryStats.totalBalance === 'number'
      ? categoryStats.totalBalance
      : walletsArray.reduce((sum, wallet) => sum + wallet.balance, 0)

  // Total wallets should use the backend "total" (which already applies
  // the current filters) instead of just the current page length.
  const totalWalletsCount = totalWallets || walletsArray.length

  // Active wallets:
  // - Prefer backend aggregate of wallets that have transacted in the
  //   last 6 months when available (categoryStats.activeLast6Months).
  // - Fallback to simple flag-based active status on the current page.
  const activeWallets =
    categoryStats && typeof categoryStats.activeLast6Months === 'number'
      ? categoryStats.activeLast6Months
      : walletsArray.filter(wallet => wallet.isActive && !wallet.isSuspended).length

  const suspendedWallets = walletsArray.filter(wallet => wallet.isSuspended).length
  
  // Calculate multiple wallets of same type
  const walletsByType = walletsArray.reduce((acc, wallet) => {
    acc[wallet.walletType] = (acc[wallet.walletType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sortedWalletsArray = React.useMemo(() => {
    const toNum = (v: any) => {
      const n = Number(v)
      return Number.isNaN(n) ? 0 : n
    }
    return [...walletsArray].sort((a, b) => toNum(b.balance) - toNum(a.balance))
  }, [walletsArray])
  const hasMultipleSameType = Object.values(walletsByType).some(count => count > 1)
  const multipleWalletTypes = Object.entries(walletsByType)
    .filter(([, count]) => count > 1)
    .map(([type, count]) => `${count} ${type}`)

  const currentPage = apiPage || filters.page || 1
  const pageSize = apiLimit || filters.limit || walletsArray.length || 50
  const totalPages = apiTotalPages || (pageSize > 0 ? Math.max(1, Math.ceil(totalWallets / pageSize)) : 1)

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page: Math.max(1, Math.min(totalPages, page)),
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Wallets</h1>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-gray-600">Manage all system wallets and view balances</p>
                  {hasMultipleSameType && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Multiple wallets: {multipleWalletTypes.join(', ')}
                    </Badge>
                  )}
                </div>
              </div>
            <Dialog open={showCreateWallet} onOpenChange={setShowCreateWallet}>
              <DialogTrigger asChild>
                <Button className="bg-[#08163d] hover:bg-[#0a1f4f]">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Wallet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Wallet</DialogTitle>
                  <DialogDescription>
                    Create a new wallet to store your funds
                  </DialogDescription>
                  
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={walletForm.currency} 
                      onValueChange={(value) => setWalletForm(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      name="description"
                      value={walletForm.description}
                      onChange={handleInputChange}
                      placeholder="e.g., Main wallet, Savings wallet"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateWallet(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateWallet}
                      disabled={isCreating}
                      className="bg-[#08163d] hover:bg-[#0a1f4f]"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Wallet
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>

            {/* Filters and Search */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by owner name, email, phone, or wallet ID..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select 
                value={filters.category || 'all'} 
                onValueChange={(value) => handleCategoryChange(value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="BUSINESS_COLLECTION">Business Collection</SelectItem>
                  <SelectItem value="BUSINESS_DISBURSEMENT">Business Disbursement</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.currency || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, currency: value === 'all' ? undefined : value, page: 1 }))}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="UGX">UGX</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={String(filters.limit || pageSize || 50)}
                onValueChange={(value) =>
                  setFilters(prev => ({
                    ...prev,
                    limit: Number(value),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                  <SelectItem value="100">100 / page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Stats */}
          {categoryStats && Object.keys(categoryStats).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="px-4 py-3">
                  <p className="text-xs text-gray-600">Total Wallets</p>
                  <p className="text-2xl font-bold text-gray-900">{categoryStats.total || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-4 py-3">
                  <p className="text-xs text-gray-600">Personal</p>
                  <p className="text-2xl font-bold text-blue-600">{categoryStats.personal || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-4 py-3">
                  <p className="text-xs text-gray-600">Business</p>
                  <p className="text-2xl font-bold text-green-600">{categoryStats.business || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-4 py-3">
                  <p className="text-xs text-gray-600">System</p>
                  <p className="text-2xl font-bold text-purple-600">{categoryStats.system || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="px-4 py-3">
                  <p className="text-xs text-gray-600">Other</p>
                  <p className="text-2xl font-bold text-gray-600">{categoryStats.other || 0}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mb-4">
            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Total Balance</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{formatCurrency(totalBalance, 'UGX')}</p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">Across all wallets</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Active Wallets</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{activeWallets}</p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">
                    {totalWalletsCount > 0
                      ? `${Math.round((activeWallets / totalWalletsCount) * 100)}%`
                      : '0%'}{' '}
                    of total
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Total Wallets</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{totalWalletsCount}</p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">All wallet types</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Suspended Wallets</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{suspendedWallets}</p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">Require attention</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Banner for Multiple Wallets */}
          {hasMultipleSameType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Multiple Wallets of Same Type</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    You have {multipleWalletTypes.join(' and ')} wallets. Each wallet operates independently with its own balance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Wallets List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Wallets</CardTitle>
              <CardDescription>
                {hasMultipleSameType 
                  ? 'Manage your digital wallets - you have multiple wallets of the same type for different purposes'
                  : 'Manage your digital wallets and view transaction history'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isWalletsLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading wallets...</p>
                </div>
              ) : walletsError ? (
                <div className="text-center py-12">
                  <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-600">Failed to load wallets</p>
                  <p className="text-sm text-red-500 mt-2">{extractErrorMessage(walletsError)}</p>
                  <Button 
                    onClick={() => refetch()} 
                    variant="outline" 
                    className="mt-4"
                  >
                    Retry
                  </Button>
                  <div className="mt-4 text-xs text-gray-400">
                    <p>Debug Info:</p>
                    <p>Error status: {(walletsError as any)?.status || 'N/A'}</p>
                    <p>Error message: {walletsError?.message || 'N/A'}</p>
                  </div>
                </div>
              ) : walletsArray.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No wallets found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {isWalletsLoading ? 'Loading...' : 'No wallets match your filters or no wallets exist in the system'}
                  </p>
                  {!isWalletsLoading && (
                    <Button 
                      onClick={() => {
                        setFilters({ category: undefined, search: undefined, currency: undefined, isActive: undefined, isSuspended: undefined, page: 1, limit: 50 })
                        refetch()
                      }} 
                      variant="outline" 
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Daily Limit</TableHead>
                      <TableHead className="text-right">Monthly Limit</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="font-mono text-xs">ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedWalletsArray.map((wallet) => {
                      const sameTypeWallets = sortedWalletsArray.filter(w => w.walletType === wallet.walletType)
                      const walletNumber = sameTypeWallets.findIndex(w => w.id === wallet.id) + 1
                      const showWalletNumber = sameTypeWallets.length > 1
                      const ownerName = (wallet as any).ownerName ||
                        ((wallet as any).user?.profile
                          ? `${(wallet as any).user.profile.firstName} ${(wallet as any).user.profile.lastName}`.trim()
                          : null)
                      const ownerContact = (wallet as any).ownerPhone || (wallet as any).user?.phone ||
                        (wallet as any).ownerEmail || (wallet as any).user?.email

                      return (
                        <TableRow key={wallet.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-[#08163d] shrink-0" />
                              <span className="font-medium">
                                {wallet.description || `${wallet.walletType} Wallet`}
                                {showWalletNumber && ` #${walletNumber}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(wallet)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {wallet.walletType}
                            </Badge>
                          </TableCell>
                          <TableCell>{getCurrencyBadge(wallet.currency)}</TableCell>
                          <TableCell className="text-right font-semibold text-[#08163d]">
                            {formatCurrency(wallet.balance, wallet.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            {wallet.dailyLimit != null ? (
                              <div>
                                <p className="text-sm font-medium">{formatCurrency(wallet.dailyLimit, wallet.currency)}</p>
                                {wallet.dailyUsed != null && (
                                  <div className="mt-1">
                                    <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-auto">
                                      <div
                                        className="bg-blue-500 h-1.5 rounded-full"
                                        style={{ width: `${Math.min(100, wallet.dailyLimit > 0 ? (wallet.dailyUsed / wallet.dailyLimit) * 100 : 0)}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {formatCurrency(wallet.dailyUsed, wallet.currency)} used
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : <span className="text-gray-400">—</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            {(wallet as any).monthlyLimit != null ? (
                              <div>
                                <p className="text-sm font-medium">{formatCurrency((wallet as any).monthlyLimit, wallet.currency)}</p>
                                {(wallet as any).monthlyUsed != null && (
                                  <div className="mt-1">
                                    <div className="w-24 bg-gray-200 rounded-full h-1.5 ml-auto">
                                      <div
                                        className="bg-purple-500 h-1.5 rounded-full"
                                        style={{ width: `${Math.min(100, (wallet as any).monthlyLimit > 0 ? ((wallet as any).monthlyUsed / (wallet as any).monthlyLimit) * 100 : 0)}%` }}
                                      />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {formatCurrency((wallet as any).monthlyUsed, wallet.currency)} used
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : <span className="text-gray-400">—</span>}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {formatDateShort(wallet.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0 max-w-[180px]">
                              {ownerName && (
                                <p className="text-sm font-medium truncate" title={ownerName}>{ownerName}</p>
                              )}
                              {ownerContact && (
                                <p className="text-xs text-gray-500 truncate" title={String(ownerContact)}>
                                  {String(ownerContact)}
                                </p>
                              )}
                              {!ownerName && !ownerContact && (
                                <span className="text-gray-400 text-sm">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-500">
                            {wallet.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                onClick={() => {
                                  router.push(`/dashboard/wallet/${wallet.id}/statement`)
                                }}
                              >
                                Statement
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#08163d] text-[#08163d] hover:bg-[#08163d] hover:text-white"
                                onClick={() => {
                                  setSelectedWallet(wallet)
                                  setShowWalletDetails(true)
                                }}
                              >
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {
                                  setSelectedWallet(wallet)
                                  setShowFundWallet(true)
                                }}
                              >
                                <Plus className="w-4 h-4 mr-1" strokeWidth={2.5} />
                                Fund
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedWallet(wallet)
                                  setLimitForm({ dailyLimit: wallet.dailyLimit?.toString() || '', reason: '' })
                                  setShowIncreaseLimit(true)
                                }}
                              >
                                <TrendingUp className="w-4 h-4 mr-1" />
                                Daily
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-purple-500 text-purple-600 hover:bg-purple-50"
                                onClick={() => {
                                  setSelectedWallet(wallet)
                                  setMonthlyLimitForm({ monthlyLimit: (wallet as any).monthlyLimit?.toString() || '', reason: '' })
                                  setShowMonthlyLimit(true)
                                }}
                              >
                                <TrendingUp className="w-4 h-4 mr-1" />
                                Monthly
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
              {walletsArray.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Showing{' '}
                    <span className="font-medium text-gray-700">
                      {(currentPage - 1) * pageSize + 1}-
                      {Math.min(currentPage * pageSize, totalWallets || walletsArray.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-gray-700">
                      {totalWallets || walletsArray.length}
                    </span>{' '}
                    wallets
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1 || isWalletsLoading}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-xs sm:text-sm text-gray-600">
                      Page <span className="font-semibold">{currentPage}</span> of{' '}
                      <span className="font-semibold">{totalPages}</span>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages || isWalletsLoading}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fund Wallet Dialog */}
          <Dialog open={showFundWallet} onOpenChange={(open) => {
            setShowFundWallet(open)
            if (!open) {
              setSelectedWallet(null)
              setFundForm({ amount: '', reason: '', reference: '' })
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fund Wallet</DialogTitle>
                <DialogDescription>
                  {selectedWallet && (
                    <>
                      Add funds to{' '}
                      {(selectedWallet as any).ownerName || 
                       ((selectedWallet as any).user?.profile ? 
                         `${(selectedWallet as any).user.profile.firstName} ${(selectedWallet as any).user.profile.lastName}` : 
                         'this wallet')}
                      's wallet
                      {(selectedWallet as any).ownerEmail && (
                        <span className="block text-xs text-gray-500 mt-1">
                          📧 {(selectedWallet as any).ownerEmail}
                        </span>
                      )}
                      {(selectedWallet as any).ownerPhone && (
                        <span className="block text-xs text-gray-500">
                          📱 {(selectedWallet as any).ownerPhone}
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
                  <label htmlFor="amount" className="text-sm font-medium">
                    Amount
                  </label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={fundForm.amount}
                    onChange={(e) => setFundForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="reason" className="text-sm font-medium">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="reason"
                    name="reason"
                    placeholder="e.g., Top-up, Refund, Adjustment"
                    value={fundForm.reason}
                    onChange={(e) => setFundForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="reference" className="text-sm font-medium">
                    Reference (Optional)
                  </label>
                  <Input
                    id="reference"
                    name="reference"
                    placeholder="Optional reference number"
                    value={fundForm.reference}
                    onChange={(e) => setFundForm(prev => ({ ...prev, reference: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowFundWallet(false)
                      setSelectedWallet(null)
                      setFundForm({ amount: '', reason: '', reference: '' })
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFundWallet}
                    disabled={fundWallet.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {fundWallet.isPending ? 'Funding...' : 'Fund Wallet'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Update Daily Limit Dialog */}
          <Dialog open={showIncreaseLimit} onOpenChange={(open) => {
            setShowIncreaseLimit(open)
            if (!open) {
              setSelectedWallet(null)
              setLimitForm({ dailyLimit: '', reason: '' })
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Daily Limit</DialogTitle>
                <DialogDescription>
                  {selectedWallet && (
                    <>Update daily transaction limit for <strong>{(selectedWallet as any).ownerName || 'this wallet'}</strong></>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium mb-1">Current Daily Limit</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {formatCurrency(selectedWallet?.dailyLimit || 0, selectedWallet?.currency || 'UGX')}
                  </p>
                  {selectedWallet?.dailyUsed != null && selectedWallet?.dailyLimit != null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-blue-600 mb-1">
                        <span>Used today: {formatCurrency(selectedWallet.dailyUsed, selectedWallet.currency)}</span>
                        <span>{selectedWallet.dailyLimit > 0 ? Math.round((selectedWallet.dailyUsed / selectedWallet.dailyLimit) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, selectedWallet.dailyLimit > 0 ? (selectedWallet.dailyUsed / selectedWallet.dailyLimit) * 100 : 0)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="dailyLimit">New Daily Limit <span className="text-red-500">*</span></Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    placeholder="Enter new daily limit"
                    value={limitForm.dailyLimit}
                    onChange={(e) => setLimitForm(prev => ({ ...prev, dailyLimit: e.target.value }))}
                    className="mt-1"
                    min={1}
                  />
                </div>
                <div>
                  <Label htmlFor="limitReason">Reason (Optional)</Label>
                  <Input
                    id="limitReason"
                    placeholder="e.g., Business needs, KYC upgrade"
                    value={limitForm.reason}
                    onChange={(e) => setLimitForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => { setShowIncreaseLimit(false); setSelectedWallet(null); setLimitForm({ dailyLimit: '', reason: '' }) }} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleIncreaseLimit} disabled={updateDailyLimit.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {updateDailyLimit.isPending ? 'Updating...' : 'Update Daily Limit'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Update Monthly Limit Dialog */}
          <Dialog open={showMonthlyLimit} onOpenChange={(open) => {
            setShowMonthlyLimit(open)
            if (!open) {
              setSelectedWallet(null)
              setMonthlyLimitForm({ monthlyLimit: '', reason: '' })
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Monthly Limit</DialogTitle>
                <DialogDescription>
                  {selectedWallet && (
                    <>Update monthly transaction limit for <strong>{(selectedWallet as any).ownerName || 'this wallet'}</strong></>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-medium mb-1">Current Monthly Limit</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {formatCurrency((selectedWallet as any)?.monthlyLimit || 0, selectedWallet?.currency || 'UGX')}
                  </p>
                  {(selectedWallet as any)?.monthlyUsed != null && (selectedWallet as any)?.monthlyLimit != null && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-purple-600 mb-1">
                        <span>Used this month: {formatCurrency((selectedWallet as any).monthlyUsed, selectedWallet.currency)}</span>
                        <span>{(selectedWallet as any).monthlyLimit > 0 ? Math.round(((selectedWallet as any).monthlyUsed / (selectedWallet as any).monthlyLimit) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (selectedWallet as any).monthlyLimit > 0 ? ((selectedWallet as any).monthlyUsed / (selectedWallet as any).monthlyLimit) * 100 : 0)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="monthlyLimit">New Monthly Limit <span className="text-red-500">*</span></Label>
                  <Input
                    id="monthlyLimit"
                    type="number"
                    placeholder="Enter new monthly limit"
                    value={monthlyLimitForm.monthlyLimit}
                    onChange={(e) => setMonthlyLimitForm(prev => ({ ...prev, monthlyLimit: e.target.value }))}
                    className="mt-1"
                    min={1}
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyLimitReason">Reason (Optional)</Label>
                  <Input
                    id="monthlyLimitReason"
                    placeholder="e.g., Business needs, KYC upgrade"
                    value={monthlyLimitForm.reason}
                    onChange={(e) => setMonthlyLimitForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => { setShowMonthlyLimit(false); setSelectedWallet(null); setMonthlyLimitForm({ monthlyLimit: '', reason: '' }) }} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateMonthlyLimit} disabled={updateMonthlyLimit.isPending} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    {updateMonthlyLimit.isPending ? 'Updating...' : 'Update Monthly Limit'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Wallet Details Dialog */}
          <Dialog open={showWalletDetails} onOpenChange={(open) => {
            setShowWalletDetails(open)
            if (!open) {
              setSelectedWallet(null)
            }
          }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Wallet Details</DialogTitle>
                <DialogDescription>
                  Complete information about this wallet
                </DialogDescription>
              </DialogHeader>
              {selectedWallet && (
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Wallet ID</label>
                      <p className="text-sm font-mono text-gray-900 mt-1">{selectedWallet.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Wallet Type</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedWallet.walletType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Currency</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedWallet.currency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Balance</label>
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        {formatCurrency(selectedWallet.balance, selectedWallet.currency)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedWallet)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="text-sm text-gray-900 mt-1">{formatDate(selectedWallet.createdAt)}</p>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedWallet.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedWallet.description}</p>
                    </div>
                  )}

                  {/* Transaction Limits */}
                  {(selectedWallet.dailyLimit != null || (selectedWallet as any).monthlyLimit != null) && (
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Transaction Limits</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {selectedWallet.dailyLimit != null && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-blue-700">Daily Limit</span>
                              <span className="text-sm font-bold text-blue-900">{formatCurrency(selectedWallet.dailyLimit, selectedWallet.currency)}</span>
                            </div>
                            {selectedWallet.dailyUsed != null && (
                              <>
                                <div className="w-full bg-blue-200 rounded-full h-2 mb-1">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(100, selectedWallet.dailyLimit > 0 ? (selectedWallet.dailyUsed / selectedWallet.dailyLimit) * 100 : 0)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-blue-600">
                                  <span>Used: {formatCurrency(selectedWallet.dailyUsed, selectedWallet.currency)}</span>
                                  <span>Remaining: {formatCurrency(Math.max(0, selectedWallet.dailyLimit - selectedWallet.dailyUsed), selectedWallet.currency)}</span>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        {(selectedWallet as any).monthlyLimit != null && (
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-purple-700">Monthly Limit</span>
                              <span className="text-sm font-bold text-purple-900">{formatCurrency((selectedWallet as any).monthlyLimit, selectedWallet.currency)}</span>
                            </div>
                            {(selectedWallet as any).monthlyUsed != null && (
                              <>
                                <div className="w-full bg-purple-200 rounded-full h-2 mb-1">
                                  <div
                                    className="bg-purple-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(100, (selectedWallet as any).monthlyLimit > 0 ? ((selectedWallet as any).monthlyUsed / (selectedWallet as any).monthlyLimit) * 100 : 0)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-purple-600">
                                  <span>Used: {formatCurrency((selectedWallet as any).monthlyUsed, selectedWallet.currency)}</span>
                                  <span>Remaining: {formatCurrency(Math.max(0, (selectedWallet as any).monthlyLimit - (selectedWallet as any).monthlyUsed), selectedWallet.currency)}</span>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Owner Information */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Owner Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {(selectedWallet as any).ownerName || ((selectedWallet as any).user?.profile) ? (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Name</label>
                          <p className="text-sm text-gray-900 mt-1">
                            {(selectedWallet as any).ownerName || 
                             ((selectedWallet as any).user?.profile ? 
                               `${(selectedWallet as any).user.profile.firstName} ${(selectedWallet as any).user.profile.lastName}` : 
                               'N/A')}
                          </p>
                        </div>
                      ) : null}
                      {(selectedWallet as any).ownerEmail || (selectedWallet as any).user?.email ? (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p className="text-sm text-gray-900 mt-1">
                            {(selectedWallet as any).ownerEmail || (selectedWallet as any).user?.email || 'N/A'}
                          </p>
                        </div>
                      ) : null}
                      {(selectedWallet as any).ownerPhone || (selectedWallet as any).user?.phone ? (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-sm text-gray-900 mt-1">
                            {(selectedWallet as any).ownerPhone || (selectedWallet as any).user?.phone || 'N/A'}
                          </p>
                        </div>
                      ) : null}
                      {selectedWallet.userId && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">User ID</label>
                          <p className="text-sm font-mono text-gray-900 mt-1">{selectedWallet.userId}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suspension Information */}
                  {selectedWallet.isSuspended && (
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-red-900 mb-3">Suspension Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedWallet.suspendedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Suspended At</label>
                            <p className="text-sm text-gray-900 mt-1">{formatDate(selectedWallet.suspendedAt)}</p>
                          </div>
                        )}
                        {selectedWallet.suspendedBy && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Suspended By</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedWallet.suspendedBy}</p>
                          </div>
                        )}
                        {selectedWallet.suspensionReason && (
                          <div className="col-span-2">
                            <label className="text-sm font-medium text-gray-500">Reason</label>
                            <p className="text-sm text-gray-900 mt-1">{selectedWallet.suspensionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowWalletDetails(false)
                        setSelectedWallet(null)
                      }}
                      className="w-full"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  )
}

export default WalletPage 