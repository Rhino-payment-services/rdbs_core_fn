"use client"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  UserCheck,
  UserX,
  Clock,
  Building2
} from 'lucide-react'
import type { User } from '@/lib/types/api'

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
  isMerchantTab = false
}) => {
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
      case 'pending':
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
                      // Merchant display: Show business name
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <div 
                            className="font-medium text-sm cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => onViewCustomer(customer)}
                          >
                            {customer.businessTradeName || 'Unknown Business'}
                          </div>
                          <div className="text-xs text-gray-500">
                            Owner: {customer.ownerFirstName} {customer.ownerLastName}
                          </div>
                          <div className="text-xs text-gray-400">
                            Code: {customer.merchantCode}
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
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditCustomer(customer)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteCustomer(customer)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
    </Card>
  )
}
