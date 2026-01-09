"use client"
import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Activity, 
  DollarSign,
  Edit,
  Trash2,
  Wallet,
  CreditCard,
  Building2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import type { User as CustomerType } from '@/lib/types/api'
import api from '@/lib/axios'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface CustomerDetailsModalProps {
  customer: CustomerType | null
  isOpen: boolean
  onClose: () => void
  onEdit: (customer: CustomerType) => void
  onDelete: (customer: CustomerType) => void
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const { data: session } = useSession()
  const [wallets, setWallets] = useState<any[]>([])
  const [loadingWallets, setLoadingWallets] = useState(false)
  const [totalBalance, setTotalBalance] = useState(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [fundModalOpen, setFundModalOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [fundDescription, setFundDescription] = useState('')
  const [funding, setFunding] = useState(false)
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)

  // Check if user is admin
  const isAdmin = session?.user && (
    (session.user as any).role === 'ADMIN' || 
    (session.user as any).role === 'SUPER_ADMIN'
  )

  // Fetch wallets and transactions when modal opens
  useEffect(() => {
    if (isOpen && customer?.id) {
      fetchUserWallets()
      fetchUserTransactions()
    } else {
      setWallets([])
      setTotalBalance(0)
      setTransactions([])
    }
  }, [isOpen, customer?.id])

  const fetchUserWallets = async () => {
    if (!customer?.id) return
    
    setLoadingWallets(true)
    try {
      console.log('🔍 Fetching ALL wallets for user:', customer.id)
      
      // Get ALL wallets for this user (PERSONAL and BUSINESS)
      const response = await api({
        url: `/wallet/${customer.id}/all`,
        method: 'GET'
      })
      
      console.log('📦 Raw wallet response:', response)
      
      // The response is an array of wallet objects
      const walletsData = response.data?.data || response.data || []
      
      console.log('💼 Parsed wallets:', walletsData)
      
      setWallets(Array.isArray(walletsData) ? walletsData : [])
      
      // Calculate total balance across all wallets
      const total = (Array.isArray(walletsData) ? walletsData : []).reduce((sum: number, wallet: any) => {
        return sum + (Number(wallet.balance) || 0)
      }, 0)
      setTotalBalance(total)
      
      console.log('✅ Wallets set:', walletsData.length, 'wallet(s), Total balance:', total)
    } catch (error: any) {
      console.error('❌ Error fetching wallets:', error)
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      })
      
      // If it's a 404, the user doesn't have wallets
      if (error?.response?.status === 404) {
        console.log('⚠️ No wallets found for user (404)')
        setWallets([])
        setTotalBalance(0)
      } else {
        console.log('⚠️ Other error, clearing wallets')
        setWallets([])
        setTotalBalance(0)
      }
    } finally {
      setLoadingWallets(false)
    }
  }

  const fetchUserTransactions = async () => {
    if (!customer?.id) return
    
    setLoadingTransactions(true)
    try {
      const response = await api({
        url: `/wallet/${customer.id}/transactions`,
        method: 'GET',
        params: {
          page: 1,
          limit: 5
        }
      })
      
      const transactionsData = response.data?.transactions || response.data?.data || []
      setTransactions(transactionsData)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleFundWallet = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!customer?.id) {
      toast.error('Customer ID is required')
      return
    }

    setFunding(true)
    try {
      // Use the wallet balance update endpoint
      const response = await api({
        url: `/wallet/${customer.id}/balance`,
        method: 'PATCH',
        data: {
          amount: parseFloat(fundAmount),
          description: fundDescription || `Admin wallet funding - ${new Date().toLocaleString()}`
        }
      })

      toast.success(`Successfully funded wallet with ${formatCurrency(parseFloat(fundAmount))}`)
      setFundModalOpen(false)
      setFundAmount('')
      setFundDescription('')
      
      // Refresh wallets and transactions
      await fetchUserWallets()
      await fetchUserTransactions()
    } catch (error: any) {
      console.error('Error funding wallet:', error)
      toast.error(error.response?.data?.message || 'Failed to fund wallet')
    } finally {
      setFunding(false)
    }
  }

  const getTransactionTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'DEPOSIT': 'Deposit',
      'WITHDRAWAL': 'Withdrawal',
      'WALLET_TO_WALLET': 'P2P Transfer',
      'WALLET_TO_MNO': 'Mobile Money',
      'WALLET_TO_MERCHANT': 'Merchant Payment',
      'MERCHANT_TO_WALLET': 'Merchant Payment',
      'MNO_TO_WALLET': 'Mobile Money Deposit',
      'REVERSAL': 'Reversal',
    }
    return typeMap[type] || type
  }

  const getTransactionStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!customer) return null

  // Debug: Log customer data to see what we're receiving
  console.log('🔍 Customer Details Modal - Customer Data:', {
    id: customer.id,
    email: customer.email,
    userType: customer.userType,
    subscriberType: customer.subscriberType,
    merchantCode: customer.merchantCode,
    hasMerchant: !!customer.merchant,
    merchant: customer.merchant
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string | undefined) => {
    // Handle undefined or null status
    if (!status) {
      return <Badge variant="outline">Unknown</Badge>
    }
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><Shield className="h-3 w-3 mr-1" />Active</Badge>
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactive</Badge>
      case 'pending_verification':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Verification</Badge>
      case 'suspended':
        return <Badge className="bg-gray-100 text-gray-800">Suspended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getUserTypeBadge = (userType: string | undefined) => {
    // Handle undefined or null userType
    if (!userType) {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          Unknown
        </Badge>
      )
    }
    
    const colors = {
      'SUBSCRIBER': 'bg-purple-100 text-purple-800',
      'MERCHANT': 'bg-blue-100 text-blue-800',
      'PARTNER': 'bg-green-100 text-green-800',
      'AGENT': 'bg-orange-100 text-orange-800',
      'STAFF_USER': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={colors[userType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {userType.replace('_', ' ')}
      </Badge>
    )
  }

  const getCustomerName = () => {
    // Try profile firstName/lastName first (with or without both)
    const profileName = `${customer.profile?.firstName || ''} ${customer.profile?.middleName ? customer.profile.middleName + ' ' : ''}${customer.profile?.lastName || ''}`.trim()
    if (profileName) {
      return profileName
    }
    // Then try direct user firstName/lastName
    const userName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
    if (userName) {
      return userName
    }
    // Fall back to email
    return customer.email || 'Unknown Customer'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!w-[90vw] !max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Customer Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{getCustomerName()}</h2>
                <p className="text-gray-600">ID: {customer.id}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getUserTypeBadge(customer.userType)}
                  {getStatusBadge(customer.status)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(customer)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(customer)}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{customer.email || 'No email'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{customer.phone || 'No phone'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business/Merchant Information - Show if merchant data OR merchantCode exists */}
          {(customer.merchant || customer.merchantCode) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer.merchant ? (
                  // Full merchant data available
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Business Name</p>
                      <p className="font-medium">{customer.merchant.businessTradeName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Business Type</p>
                      <p className="font-medium">{customer.merchant.businessType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Owner Name</p>
                      <p className="font-medium">
                        {customer.merchant.ownerFirstName} {customer.merchant.ownerLastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Merchant Code</p>
                      <p className="font-medium font-mono">{customer.merchantCode || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Business Email</p>
                      <p className="font-medium">{customer.merchant.businessEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Business Phone</p>
                      <p className="font-medium">{customer.merchant.registeredPhoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Business Status</p>
                      <div className="flex items-center gap-2">
                        {customer.merchant.isActive && customer.merchant.isVerified ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active & Verified
                          </Badge>
                        ) : customer.merchant.isActive ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Active - Pending Verification
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Only merchant code available - backend needs restart
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900">Partial merchant data</p>
                        <p className="text-xs text-yellow-700">Backend needs restart to load full business details</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Merchant Code</p>
                      <p className="font-medium font-mono">{customer.merchantCode}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Profile Information */}
          {customer.profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium">
                      {customer.profile.firstName} {customer.profile.middleName} {customer.profile.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium">
                      {customer.profile.dateOfBirth ? formatDate(customer.profile.dateOfBirth) : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium">{customer.profile.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">National ID</p>
                    <p className="font-medium">{customer.profile.nationalId || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Country</p>
                    <p className="font-medium">{customer.profile.country || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-medium">{customer.profile.city || 'Not specified'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{customer.profile.address || 'Not provided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">User Type</p>
                  <p className="font-medium">{customer.userType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subscriber Type</p>
                  <p className="font-medium">{customer.subscriberType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Verification Status</p>
                  <p className="font-medium">{customer.isVerified ? 'Verified' : 'Not Verified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">KYC Status</p>
                  <p className="font-medium">{customer.kycStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Verification Level</p>
                  <p className="font-medium">{customer.verificationLevel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Can Have Wallet</p>
                  <p className="font-medium">{customer.canHaveWallet ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Account Created</p>
                    <p className="font-medium">{formatDate(customer.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Last Login</p>
                    <p className="font-medium">
                      {customer.lastLoginAt ? formatDate(customer.lastLoginAt) : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-medium">{formatDate(customer.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Total Transactions</p>
                    <p className="font-medium">{(customer as any)?.totalTransactions || '0'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Information
                {loadingWallets && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWallets ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading wallets...</span>
                </div>
              ) : wallets.length > 0 ? (
                <div className="space-y-4">
                  {/* Total Balance Summary - More Prominent */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-100 font-medium mb-1">Total Wallet Balance</p>
                        <p className="text-4xl font-bold">
                          {formatCurrency(totalBalance)}
                        </p>
                        <p className="text-sm text-blue-100 mt-2">
                          Across {wallets.length} wallet{wallets.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <Wallet className="h-16 w-16 text-blue-200" />
                    </div>
                  </div>
                  
                  {/* Individual Wallets */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Wallet Details</p>
                    {wallets.map((wallet: any) => (
                      <div key={wallet.id} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1">
                            <div>
                              <p className="text-xs text-gray-500">Wallet Type</p>
                              <p className="font-medium text-sm">{wallet.walletType || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Balance</p>
                              <p className="font-semibold text-xl text-green-600">
                                {formatCurrency(Number(wallet.balance) || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Currency</p>
                              <p className="font-medium text-sm">{wallet.currency || 'UGX'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Status</p>
                              <Badge className={wallet.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {wallet.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </div>
                          {isAdmin && wallet.isActive && (
                            <div className="shrink-0 fund-wallet-button-wrapper">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedWalletId(wallet.id)
                                  setFundModalOpen(true)
                                }}
                                className="fund-wallet-button bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg border-2 border-green-500 px-4 py-2"
                              >
                                <Plus className="h-4 w-4 mr-1.5 font-bold" />
                                <span className="text-sm">Fund Wallet</span>
                              </Button>
                            </div>
                          )}
                        </div>
                        {wallet.id && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-400 font-mono">ID: {wallet.id.slice(0, 8)}...</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
                    <Wallet className="h-16 w-16 text-yellow-400 mx-auto mb-3" />
                    <p className="text-lg font-semibold text-gray-900 mb-2">No Wallet Found</p>
                    <p className="text-sm text-gray-600 mb-4">
                      This user doesn't have any wallet yet. {customer.canHaveWallet ? 'A wallet needs to be created before funding.' : 'This user is not allowed to have a wallet.'}
                    </p>
                    {customer.canHaveWallet && isAdmin && (
                      <div className="flex flex-col items-center gap-3">
                        <Badge className="bg-blue-100 text-blue-800">
                          Balance: {formatCurrency(0)}
                        </Badge>
                        <p className="text-xs text-gray-500">
                          Contact system administrator to create a wallet for this user
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Last 5 Transactions */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Transactions (Last 5)
                  {loadingTransactions && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">Loading transactions...</span>
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((tx: any) => (
                      <div key={tx.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {tx.direction === 'CREDIT' || tx.type === 'DEPOSIT' || tx.type === 'MNO_TO_WALLET' ? (
                                <ArrowDownRight className="h-4 w-4 text-green-600" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-red-600" />
                              )}
                              <p className="font-medium text-sm">{getTransactionTypeDisplay(tx.type)}</p>
                              {getTransactionStatusBadge(tx.status)}
                            </div>
                            <p className="text-xs text-gray-500">
                              {tx.reference || tx.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(tx.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              tx.direction === 'CREDIT' || tx.type === 'DEPOSIT' || tx.type === 'MNO_TO_WALLET'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {tx.direction === 'CREDIT' || tx.type === 'DEPOSIT' || tx.type === 'MNO_TO_WALLET' ? '+' : '-'}
                              {formatCurrency(Number(tx.amount) || 0)}
                            </p>
                            {tx.description && (
                              <p className="text-xs text-gray-500 mt-1">{tx.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent transactions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Merchant Information (if applicable) */}
          {customer.subscriberType === 'MERCHANT' && (customer as any)?.merchantCode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Merchant Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Merchant Code</p>
                    <p className="font-medium">{(customer as any).merchantCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Business Type</p>
                    <p className="font-medium">Merchant Account</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>

      {/* Fund Wallet Modal */}
      <Dialog open={fundModalOpen} onOpenChange={setFundModalOpen}>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              Fund Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Customer Info Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
              <p className="text-sm text-blue-100 mb-1">Funding wallet for</p>
              <p className="text-lg font-bold">{getCustomerName()}</p>
              {selectedWalletId && wallets.find(w => w.id === selectedWalletId) && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-blue-400 text-white border-blue-300">
                    {wallets.find(w => w.id === selectedWalletId)?.walletType || 'Wallet'}
                  </Badge>
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-400">
                <div>
                  <p className="text-xs text-blue-100">Current Balance</p>
                  <p className="text-2xl font-bold">
                    {selectedWalletId && wallets.find(w => w.id === selectedWalletId) 
                      ? formatCurrency(Number(wallets.find(w => w.id === selectedWalletId)?.balance) || 0)
                      : formatCurrency(totalBalance)}
                  </p>
                </div>
                {fundAmount && parseFloat(fundAmount) > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-blue-100">New Balance</p>
                    <p className="text-2xl font-bold text-green-300">
                      {selectedWalletId && wallets.find(w => w.id === selectedWalletId)
                        ? formatCurrency((Number(wallets.find(w => w.id === selectedWalletId)?.balance) || 0) + parseFloat(fundAmount))
                        : formatCurrency(totalBalance + parseFloat(fundAmount))}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <Label htmlFor="amount" className="text-base font-semibold">
                Amount (UGX) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount to add"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                min="0"
                step="1000"
                className="text-lg h-12 mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: {formatCurrency(1000)} | Suggested: {formatCurrency(10000)}
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-base font-semibold">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Add a note about this funding (e.g., 'Customer service credit', 'Promotional bonus')"
                value={fundDescription}
                onChange={(e) => setFundDescription(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <Label className="text-sm text-gray-600">Quick amounts:</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[5000, 10000, 20000, 50000].map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFundAmount(amount.toString())}
                    className="text-xs"
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setFundModalOpen(false)
                  setFundAmount('')
                  setFundDescription('')
                  setSelectedWalletId(null)
                }}
                disabled={funding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFundWallet}
                disabled={!fundAmount || parseFloat(fundAmount) <= 0 || funding || !selectedWalletId}
                className="bg-green-600 hover:bg-green-700 text-white px-6"
              >
                {funding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Fund {fundAmount && parseFloat(fundAmount) > 0 ? formatCurrency(parseFloat(fundAmount)) : 'Wallet'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
