"use client"

import React, { useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminWallets, useUpdateWalletBalance, useSuspendWallet } from '@/lib/hooks/useApi'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import { extractErrorMessage } from '@/lib/utils'
import toast from 'react-hot-toast'
import Navbar from '@/components/dashboard/Navbar'
import type { Wallet as WalletType } from '@/lib/types/api'

const WalletPage = () => {
  const [showCreateWallet, setShowCreateWallet] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [walletForm, setWalletForm] = useState({
    currency: 'UGX',
    description: ''
  })

  const { data: wallets, isLoading: isWalletsLoading, error: walletsError } = useAdminWallets()
  const updateWalletBalance = useUpdateWalletBalance()
  const suspendWallet = useSuspendWallet()
  const { handleError } = useErrorHandler()

  // Handle different API response structures
  const walletsArray: WalletType[] = Array.isArray(wallets) ? wallets : []

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
        currency: walletForm.currency,
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

  const totalBalance = walletsArray.reduce((sum, wallet) => sum + wallet.balance, 0)
  const activeWallets = walletsArray.filter(wallet => wallet.isActive && !wallet.isSuspended).length
  const suspendedWallets = walletsArray.filter(wallet => wallet.isSuspended).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wallets</h1>
              <p className="text-gray-600 mt-2">Manage your digital wallets and view balances</p>
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalBalance, 'UGX')}</div>
                <p className="text-xs text-muted-foreground">
                  Across all wallets
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Wallets</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeWallets}</div>
                <p className="text-xs text-muted-foreground">
                  {walletsArray.length > 0 ? `${Math.round((activeWallets / walletsArray.length) * 100)}%` : '0%'} of total
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{walletsArray.length}</div>
                <p className="text-xs text-muted-foreground">
                  All wallet types
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspended Wallets</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {suspendedWallets}
                </div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Wallets List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Wallets</CardTitle>
              <CardDescription>
                Manage your digital wallets and view transaction history
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
                </div>
              ) : walletsArray.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No wallets found</p>
                  <p className="text-sm text-gray-500 mt-2">Create your first wallet to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {walletsArray.map((wallet) => (
                    <Card key={wallet.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Wallet className="h-5 w-5 text-[#08163d]" />
                            <CardTitle className="text-lg">{wallet.description || 'Main Wallet'}</CardTitle>
                          </div>
                          {getStatusBadge(wallet)}
                        </div>
                        <CardDescription>
                          {getCurrencyBadge(wallet.currency)} • Created {formatDate(wallet.createdAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Balance</p>
                            <p className="text-2xl font-bold text-[#08163d]">
                              {formatCurrency(wallet.balance, wallet.currency)}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Wallet ID</span>
                            <span className="text-xs font-mono text-gray-400">
                              {wallet.id.slice(0, 8)}...
                            </span>
                          </div>
                          <div className="pt-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full border-[#08163d] text-[#08163d] hover:bg-[#08163d] hover:text-white"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default WalletPage 