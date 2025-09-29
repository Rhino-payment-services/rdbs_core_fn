"use client"
import React, { useState, useEffect } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Calculator,
  CreditCard,
  Smartphone,
  Building2,
  Zap,
  DollarSign,
  Eye,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

interface Tariff {
  id: string
  name: string
  description: string
  transactionType: string
  currency: string
  feeType: 'FIXED' | 'PERCENTAGE' | 'HYBRID'
  feeAmount: number
  feePercentage: number
  minFee: number
  maxFee: number
  minAmount: number
  maxAmount: number
  userType: 'STAFF' | 'SUBSCRIBER' | 'MERCHANT'
  subscriberType: 'INDIVIDUAL' | 'BUSINESS' | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

interface Partner {
  id: string
  name: string
  status: string
  type: string
}

const TariffsPage = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("wallet-to-wallet")
  const [selectedPartner, setSelectedPartner] = useState("ABC") // Default to ABC
  const [isLoading, setIsLoading] = useState(false)
  
  const { hasPermission } = usePermissions()
  const canManageTariffs = hasPermission(PERMISSIONS.TARIFFS_CREATE) || hasPermission(PERMISSIONS.TARIFFS_UPDATE) || hasPermission(PERMISSIONS.TARIFFS_DELETE)
  
  // Fetch tariffs from API
  const { data: tariffsData, isLoading: tariffsLoading, error: tariffsError, refetch } = useQuery({
    queryKey: ['tariffs'],
    queryFn: () => api.get('/finance/tariffs').then(res => res.data),
    staleTime: 5 * 60 * 1000,
  })

  // Transaction type configurations - only show what exists in backend data
  const transactionTypes = {
    'TRANSFER_OUT': {
      name: 'Wallet to Wallet',
      description: 'RukaPay to RukaPay transfers',
      icon: CreditCard,
      color: 'bg-blue-500',
      tabId: 'wallet-to-wallet'
    },
    'WITHDRAWAL': {
      name: 'Wallet to Mobile',
      description: 'RukaPay to MTN/AIRTEL',
      icon: Smartphone,
      color: 'bg-green-500',
      tabId: 'wallet-to-mobile'
    },
    'WALLET_TO_MERCHANT': {
      name: 'Wallet to Merchant',
      description: 'Wallet to merchant payments',
      icon: Building2,
      color: 'bg-purple-500',
      tabId: 'wallet-to-merchant'
    },
    'DEPOSIT': {
      name: 'Wallet to Bank',
      description: 'RukaPay to Bank transfers',
      icon: Building2,
      color: 'bg-orange-500',
      tabId: 'wallet-to-bank'
    },
    'BILL_PAYMENT': {
      name: 'Bill Payment',
      description: 'School fees, Utility bills',
      icon: Zap,
      color: 'bg-purple-600',
      tabId: 'bill-payment'
    }
  }

  // Get tariffs from API response and filter by partner
  const allTariffs = tariffsData?.tariffs || []
  
  // Filter tariffs based on selected partner
  const tariffs = selectedPartner === "PEGASUS" ? [] : allTariffs // Show nothing for PEGASUS, show all for ABC
  
  // Group tariffs by transaction type - only show types that exist in data
  const groupedTariffs = {
    'TRANSFER_OUT': tariffs.filter((t: Tariff) => t.transactionType === 'TRANSFER_OUT'),
    'WITHDRAWAL': tariffs.filter((t: Tariff) => t.transactionType === 'WITHDRAWAL'),
    'WALLET_TO_MERCHANT': tariffs.filter((t: Tariff) => t.transactionType === 'WALLET_TO_MERCHANT'),
    'DEPOSIT': tariffs.filter((t: Tariff) => t.transactionType === 'DEPOSIT'),
    'BILL_PAYMENT': tariffs.filter((t: Tariff) => t.transactionType === 'BILL_PAYMENT'),
  }

  // Get unique transaction types from actual data
  const availableTransactionTypes = Object.keys(groupedTariffs).filter(type => 
    groupedTariffs[type as keyof typeof groupedTariffs].length > 0
  )

  const handleDeleteTariff = async (tariffId: string) => {
    if (!window.confirm('Are you sure you want to delete this tariff?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/finance/tariffs/${tariffId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('Tariff deleted successfully')
        refetch() // Refresh the data
      } else {
        throw new Error('Failed to delete tariff')
      }
    } catch (error) {
      toast.error('Failed to delete tariff')
    } finally {
      setIsLoading(false)
    }
  }

  const formatFeeAmount = (tariff: Tariff) => {
    if (tariff.feeType === 'FIXED') {
      return `${tariff.feeAmount} ${tariff.currency}`
    } else if (tariff.feeType === 'PERCENTAGE') {
      return `${(tariff.feePercentage * 100).toFixed(2)}%`
    } else if (tariff.feeType === 'HYBRID') {
      return `${tariff.feeAmount} ${tariff.currency} + ${(tariff.feePercentage * 100).toFixed(2)}%`
    }
    return 'N/A'
  }

  const getAmountRange = (tariff: Tariff) => {
    if (tariff.minAmount && tariff.maxAmount) {
      return `${tariff.minAmount.toLocaleString()} - ${tariff.maxAmount.toLocaleString()} ${tariff.currency}`
    } else if (tariff.minAmount) {
      return `Above ${tariff.minAmount.toLocaleString()} ${tariff.currency}`
    } else if (tariff.maxAmount) {
      return `Below ${tariff.maxAmount.toLocaleString()} ${tariff.currency}`
    }
    return 'No limit'
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await refetch()
      toast.success('Tariffs refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh tariffs')
    } finally {
      setIsLoading(false)
    }
  }

  const TariffTable = ({ type, tariffs }: { type: string, tariffs: Tariff[] }) => {
    const config = transactionTypes[type as keyof typeof transactionTypes]
    if (!config) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 mb-6">
          <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center`}>
            <config.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{config.name}</h3>
            <p className="text-gray-600">{config.description}</p>
          </div>
        </div>
        
        {tariffs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No tariffs configured for this transaction type</p>
              {canManageTariffs && (
                <Button className="mt-4" onClick={() => router.push('/dashboard/tariffs/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tariff
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Fee Amount</TableHead>
                  <TableHead>Amount Range</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tariffs.map((tariff) => (
                  <TableRow key={tariff.id}>
                    <TableCell className="font-medium">{tariff.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{tariff.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tariff.feeType}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatFeeAmount(tariff)}</TableCell>
                    <TableCell className="text-sm">{getAmountRange(tariff)}</TableCell>
                    <TableCell className="text-sm">
                      {tariff.userType} • {tariff.subscriberType || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tariff.isActive !== false ? "default" : "secondary"}>
                        {tariff.isActive !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {canManageTariffs && (
                          <>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteTariff(tariff.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }

  if (tariffsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6 lg:p-8 xl:p-10 2xl:p-12">
          <div className="max-w-none xl:max-w-[1600px] 2xl:max-w-[2200px] mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Tariffs</h1>
                <p className="text-gray-600 mb-4">Unable to retrieve tariff data from the server.</p>
                <Button onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6 lg:p-8 xl:p-10 2xl:p-12">
        <div className="max-w-none xl:max-w-[1600px] 2xl:max-w-[2200px] mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {canManageTariffs && (
                  <Button onClick={() => router.push('/dashboard/tariffs/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tariff
                  </Button>
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tariff Management</h1>
            <p className="text-gray-600">Manage transaction fees and charges for different payment types</p>
          </div>

          {/* Partner Selection */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Label htmlFor="partner-select" className="text-sm font-medium">
                  Select Partner:
                </Label>
                <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Choose partner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABC">ABC</SelectItem>
                    <SelectItem value="PEGASUS">PEGASUS</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-500">
                  {selectedPartner === "PEGASUS" ? "No tariffs configured for PEGASUS" : `${tariffs.length} tariffs available for ABC`}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {tariffsLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading tariffs...</p>
              </CardContent>
            </Card>
          ) : selectedPartner === "PEGASUS" ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Tariffs for PEGASUS</h3>
                <p className="text-gray-500">PEGASUS partner has no configured tariffs yet.</p>
                {canManageTariffs && (
                  <Button className="mt-4" onClick={() => router.push('/dashboard/tariffs/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Tariff
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Tariff Tabs - Only show tabs for transaction types that have data */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableTransactionTypes.length}, 1fr)` }}>
                  {availableTransactionTypes.map((type) => {
                    const config = transactionTypes[type as keyof typeof transactionTypes]
                    if (!config) return null
                    return (
                      <TabsTrigger key={type} value={config.tabId} className="flex items-center space-x-2">
                        <config.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{config.name}</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {availableTransactionTypes.map((type) => {
                  const config = transactionTypes[type as keyof typeof transactionTypes]
                  if (!config) return null
                  return (
                    <TabsContent key={type} value={config.tabId}>
                      <TariffTable type={type} tariffs={groupedTariffs[type as keyof typeof groupedTariffs]} />
                    </TabsContent>
                  )
                })}
              </Tabs>

              {/* Summary Stats */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Tariff Summary - {selectedPartner}</CardTitle>
                  <CardDescription>Overview of all configured tariffs for {selectedPartner}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {availableTransactionTypes.map((type) => {
                      const config = transactionTypes[type as keyof typeof transactionTypes]
                      if (!config) return null
                      return (
                        <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                            <config.icon className="w-4 h-4 text-white" />
                          </div>
                          <p className="text-sm font-medium">{config.name}</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {groupedTariffs[type as keyof typeof groupedTariffs].length}
                          </p>
                          <p className="text-xs text-gray-500">tariffs</p>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default TariffsPage 