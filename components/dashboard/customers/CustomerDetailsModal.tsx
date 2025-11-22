"use client"
import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Loader2
} from 'lucide-react'
import type { User as CustomerType } from '@/lib/types/api'
import api from '@/lib/axios'

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
  const [wallets, setWallets] = useState<any[]>([])
  const [loadingWallets, setLoadingWallets] = useState(false)
  const [totalBalance, setTotalBalance] = useState(0)

  // Fetch wallets when modal opens
  useEffect(() => {
    if (isOpen && customer?.id) {
      fetchUserWallets()
    } else {
      setWallets([])
      setTotalBalance(0)
    }
  }, [isOpen, customer?.id])

  const fetchUserWallets = async () => {
    if (!customer?.id) return
    
    setLoadingWallets(true)
    try {
      const response = await api({
        url: `/admin/wallets`,
        method: 'GET',
        params: {
          userId: customer.id
        }
      })
      
      const walletsData = response.data?.data || response.data || []
      setWallets(walletsData)
      
      // Calculate total balance across all wallets
      const total = walletsData.reduce((sum: number, wallet: any) => {
        return sum + (Number(wallet.balance) || 0)
      }, 0)
      setTotalBalance(total)
    } catch (error) {
      console.error('Error fetching wallets:', error)
      setWallets([])
    } finally {
      setLoadingWallets(false)
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
    if (customer.profile?.firstName && customer.profile?.lastName) {
      return `${customer.profile.firstName} ${customer.profile.middleName ? customer.profile.middleName + ' ' : ''}${customer.profile.lastName}`.trim()
    }
    if (customer.firstName && customer.lastName) {
      return `${customer.firstName} ${customer.lastName}`.trim()
    }
    return customer.email || 'Unknown Customer'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {/* Total Balance Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Balance</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {formatCurrency(totalBalance)}
                        </p>
                      </div>
                      <Wallet className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  {/* Individual Wallets */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Wallets ({wallets.length})</p>
                    {wallets.map((wallet: any) => (
                      <div key={wallet.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Wallet Type</p>
                            <p className="font-medium text-sm">{wallet.walletType || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Balance</p>
                            <p className="font-semibold text-lg text-green-600">
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
                <div className="text-center py-4">
                  <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No wallets found for this user</p>
                </div>
              )}
            </CardContent>
          </Card>

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </Dialog>
  )
}
