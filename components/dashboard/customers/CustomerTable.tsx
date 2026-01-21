"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
  Clock,
  Building2,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import type { User } from '@/lib/types/api'
import { MerchantQRCodeDialog } from './MerchantQRCodeDialog'
import { useBlockUser, useUnblockUser } from '@/lib/hooks/useUserBlocking'

interface CustomerTableProps {
  customers: User[] | any[]  // Can be User[] or Merchant[]
  selectedCustomers: string[]
  onSelectCustomer: (customerId: string) => void
  onSelectAll: () => void
  onViewCustomer: (customer: any) => void
  onEditCustomer: (customer: any) => void
  onDeleteCustomer: (customer: any) => void
  isLoading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage: number
  onItemsPerPageChange: (items: number) => void
  totalItems: number
  isMerchantTab?: boolean  // Flag to indicate merchants tab
  onRefresh?: () => void  // Callback to refresh data after blocking/unblocking
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  selectedCustomers,
  onSelectCustomer,
  onSelectAll,
  onViewCustomer,
  onEditCustomer,
  onDeleteCustomer,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  isMerchantTab = false,
  onRefresh
}) => {
  const blockUserMutation = useBlockUser()
  const unblockUserMutation = useUnblockUser()
  const [selectedCustomer, setSelectedCustomer] = useState<User | any>(null)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
  

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><UserCheck className="h-3 w-3 mr-1" />Active</Badge>
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800"><UserX className="h-3 w-3 mr-1" />Inactive</Badge>
      case 'suspended':
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800 border-red-300"><ShieldOff className="h-3 w-3 mr-1" />Blocked</Badge>
      case 'pending':
      case 'pending_verification':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'verified':
        return <Badge className="bg-blue-100 text-blue-800"><Shield className="h-3 w-3 mr-1" />Verified</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getUserTypeBadge = (user: User) => {
    // On subscribers tab, always show the actual userType (SUBSCRIBER)
    // Only show MERCHANT type when explicitly on merchants tab
    const type = user.userType
    
    const colors = {
      'SUBSCRIBER': 'bg-purple-100 text-purple-800',
      'MERCHANT': 'bg-blue-100 text-blue-800',
      'PARTNER': 'bg-green-100 text-green-800',
      'AGENT': 'bg-orange-100 text-orange-800',
      'STAFF_USER': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading customers...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customers ({customers.length})</CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} customers
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Rows per page:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedCustomers.length === customers.length && customers.length > 0}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onCheckedChange={() => onSelectCustomer(customer.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {isMerchantTab ? (
                      // Merchant display: Show business name prominently
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div 
                            className="font-semibold text-base text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => onViewCustomer(customer)}
                            title={customer.businessTradeName || 'Unknown Business'}
                          >
                            {customer.businessTradeName || 'Unknown Business'}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Owner: {customer.ownerFirstName || ''} {customer.ownerLastName || ''}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Code: {customer.merchantCode || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Regular user display
                      <div className="flex items-center gap-3">
                        <div>
                          <div 
                            className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => onViewCustomer(customer)}
                          >
                            {(() => {
                              // Try profile first, then fallback to direct user fields
                              if (customer.profile?.firstName && customer.profile?.lastName) {
                                return `${customer.profile.firstName} ${customer.profile.middleName ? customer.profile.middleName + ' ' : ''}${customer.profile.lastName}`.trim();
                              }
                              
                              // Fallback to direct user fields
                              if (customer.firstName && customer.lastName) {
                                return `${customer.firstName} ${customer.lastName}`.trim();
                              }
                              
                              // Last resort
                              return customer.email || 'Unknown Customer';
                            })()}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {customer.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isMerchantTab ? (
                      // Merchant contact info
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {customer.businessEmail || 'No email'}
                        </div>
                        {customer.registeredPhoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {customer.registeredPhoneNumber}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Regular user contact info
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {customer.email || 'No email'}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isMerchantTab ? (
                      <Badge className="bg-blue-100 text-blue-800">MERCHANT</Badge>
                    ) : (
                      getUserTypeBadge(customer)
                    )}
                  </TableCell>
                  <TableCell>
                    {isMerchantTab ? (
                      customer.isVerified ? (
                        <Badge className="bg-green-100 text-green-800"><UserCheck className="h-3 w-3 mr-1" />Verified</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
                      )
                    ) : (
                      getStatusBadge(customer.status)
                    )}
                  </TableCell>
                  <TableCell>
                    {isMerchantTab ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {customer.businessCity || 'Unknown'}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {(customer as any)?.country || (customer as any)?.profile?.country || 'Unknown'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      {formatDate(isMerchantTab ? customer.onboardedAt : customer.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="h-3 w-3 text-gray-400" />
                        {customer.lastLoginAt ? formatDate(customer.lastLoginAt) : 'Never'}
                      </div>
                      {(customer as any)?.totalTransactions && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <DollarSign className="h-3 w-3 text-gray-400" />
                          {(customer as any).totalTransactions} transactions
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewCustomer(customer)}
                        className="h-8 w-8 p-0"
                        title="View customer"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isMerchantTab && customer.merchantCode && (
                        <MerchantQRCodeDialog
                          merchantCode={customer.merchantCode}
                          merchantName={customer.businessTradeName || 'Unknown Business'}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCustomer(customer)}
                        className="h-8 w-8 p-0"
                        title="Edit customer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {/* Block/Unblock buttons - only show for non-merchant tabs or if user has userId */}
                      {(!isMerchantTab || customer.userId) && (
                        <>
                          {customer.status === 'SUSPENDED' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setUnblockDialogOpen(true)
                              }}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              disabled={unblockUserMutation.isPending}
                              title="Unblock user"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomer(customer)
                                setBlockDialogOpen(true)
                              }}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              disabled={blockUserMutation.isPending}
                              title="Block user"
                            >
                              <ShieldOff className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteCustomer(customer)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Delete customer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {customers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">No customers found</div>
            <div className="text-sm text-gray-400">
              Try adjusting your search criteria or filters
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center mt-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Block User Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              Block user {selectedCustomer?.email || selectedCustomer?.phone || 'this user'} from transacting and withdrawing money
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="block-reason">Reason for blocking</Label>
              <Textarea
                id="block-reason"
                placeholder="Enter reason for blocking this user (e.g., suspicious transactions, fraud, policy violation)..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={4}
              />
            </div>
            {selectedCustomer && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900">Warning:</p>
                    <p className="text-yellow-800 mt-1">
                      Blocking this user will prevent them from:
                    </p>
                    <ul className="list-disc list-inside mt-1 text-yellow-800">
                      <li>Initiating new transactions</li>
                      <li>Withdrawing money from their wallet</li>
                      <li>Making payments</li>
                    </ul>
                    <p className="text-yellow-800 mt-2">
                      User: {selectedCustomer.email || selectedCustomer.phone || selectedCustomer.id}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBlockDialogOpen(false)
                setBlockReason('')
                setSelectedCustomer(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!selectedCustomer || !blockReason.trim()) return
                const userId = selectedCustomer.userId || selectedCustomer.id
                blockUserMutation.mutate(
                  {
                    userId,
                    reason: blockReason,
                    notifyUser: true
                  },
                  {
                    onSuccess: () => {
                      setBlockDialogOpen(false)
                      setBlockReason('')
                      setSelectedCustomer(null)
                      // Refresh the data
                      if (onRefresh) {
                        onRefresh()
                      } else {
                        // Fallback to page reload if no refresh callback
                        setTimeout(() => window.location.reload(), 500)
                      }
                    }
                  }
                )
              }}
              disabled={!blockReason.trim() || blockUserMutation.isPending}
            >
              {blockUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Blocking...
                </>
              ) : (
                <>
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Block User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock User Dialog */}
      <Dialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unblock User</DialogTitle>
            <DialogDescription>
              Restore access for user {selectedCustomer?.email || selectedCustomer?.phone || 'this user'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedCustomer && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Restore Access:</p>
                    <p className="text-green-800 mt-1">
                      Unblocking this user will restore their ability to:
                    </p>
                    <ul className="list-disc list-inside mt-1 text-green-800">
                      <li>Initiate new transactions</li>
                      <li>Withdraw money from their wallet</li>
                      <li>Make payments</li>
                    </ul>
                    <p className="text-green-800 mt-2">
                      User: {selectedCustomer.email || selectedCustomer.phone || selectedCustomer.id}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnblockDialogOpen(false)
                setSelectedCustomer(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedCustomer) return
                const userId = selectedCustomer.userId || selectedCustomer.id
                unblockUserMutation.mutate(
                  {
                    userId,
                    reason: 'Account restored by administrator'
                  },
                  {
                    onSuccess: () => {
                      setUnblockDialogOpen(false)
                      setSelectedCustomer(null)
                      // Refresh the data
                      if (onRefresh) {
                        onRefresh()
                      } else {
                        // Fallback to page reload if no refresh callback
                        setTimeout(() => window.location.reload(), 500)
                      }
                    }
                  }
                )
              }}
              disabled={unblockUserMutation.isPending}
            >
              {unblockUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Unblocking...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Unblock User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
