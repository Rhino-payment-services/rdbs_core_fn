"use client"
import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/dashboard/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CustomerStats } from '@/components/dashboard/customers/CustomerStats'
import { CustomerFilters } from '@/components/dashboard/customers/CustomerFilters'
import { CustomerTable } from '@/components/dashboard/customers/CustomerTable'
import { CustomerBulkActions } from '@/components/dashboard/customers/CustomerBulkActions'
import { useKycApprovedUsers } from '@/lib/hooks/useApi'
import type { User, KycApprovedUsersResponse } from '@/lib/types/api'
import toast from 'react-hot-toast'
import { Users, Building2, Handshake, Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CustomersPage = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('subscribers')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Get current type based on active tab
  const getCurrentType = () => {
    switch (activeTab) {
      case 'subscribers': return 'INDIVIDUAL'
      case 'merchants': return 'MERCHANT'
      case 'partners': return 'PARTNER'
      default: return 'all'
    }
  }

  // API hooks - using KYC approved users with pagination and type filtering
  const { data: usersData, isLoading: usersLoading, refetch } = useKycApprovedUsers(currentPage, itemsPerPage, getCurrentType())
  const usersResponse: KycApprovedUsersResponse = usersData || { users: [], total: 0, page: 1, limit: 20, totalPages: 0 }
  const users: User[] = usersResponse.users || []

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  // Export functionality
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsProcessing(true)
    try {
      // Mock export - replace with actual export API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Customer data exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Failed to export customer data')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handler functions
  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setTypeFilter('all')
    setSortBy('createdAt')
    setSortOrder('desc')
    setCurrentPage(1)
  }

  const handleCreateNew = () => {
    router.push('/dashboard/customers/create')
  }

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const handleSelectAll = () => {
    const currentPageCustomers = users

    const allSelected = currentPageCustomers.every(customer =>
      selectedCustomers.includes(customer.id)
    )

    if (allSelected) {
      setSelectedCustomers(prev =>
        prev.filter(id => !currentPageCustomers.some(customer => customer.id === id))
      )
    } else {
      setSelectedCustomers(prev => [
        ...prev,
        ...currentPageCustomers.filter(customer => !prev.includes(customer.id)).map(c => c.id)
      ])
    }
  }

  const handleViewCustomer = (customer: User) => {
    router.push(`/dashboard/customers/${customer.id}`)
  }

  const handleEditCustomer = (customer: User) => {
    router.push(`/dashboard/customers/${customer.id}/edit`)
  }

  const handleDeleteCustomer = (customer: User) => {
    toast.error(`Delete customer ${customer.profile?.firstName} ${customer.profile?.lastName} not implemented yet`)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Bulk action handlers
  const handleBulkStatusChange = async (status: string) => {
    setIsProcessing(true)
    try {
      // Mock bulk status change - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success(`Updated ${selectedCustomers.length} customers to ${status}`)
      setSelectedCustomers([])
      refetch()
    } catch (error) {
      toast.error('Failed to update customer status')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkEmail = async () => {
    setIsProcessing(true)
    try {
      // Mock bulk email - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Email sent to ${selectedCustomers.length} customers`)
      setSelectedCustomers([])
    } catch (error) {
      toast.error('Failed to send bulk email')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkExport = async () => {
    setIsProcessing(true)
    try {
      // Mock bulk export - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Exported ${selectedCustomers.length} customers`)
      setSelectedCustomers([])
    } catch (error) {
      toast.error('Failed to export customers')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    setIsProcessing(true)
    try {
      // Mock bulk delete - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Deleted ${selectedCustomers.length} customers`)
      setSelectedCustomers([])
      refetch()
    } catch (error) {
      toast.error('Failed to delete customers')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkVerify = async () => {
    setIsProcessing(true)
    try {
      // Mock bulk verification - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Verified ${selectedCustomers.length} customers`)
      setSelectedCustomers([])
      refetch()
    } catch (error) {
      toast.error('Failed to verify customers')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handler for items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value, 10))
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  // Stats data based on current page
  const stats = {
    total: usersResponse.total,
    active: users.filter(u => u.status === 'ACTIVE').length,
    inactive: users.filter(u => u.status === 'INACTIVE').length,
    pending: users.filter(u => u.status === 'PENDING').length,
    totalRevenue: 12500000,
    monthlyRevenue: 2500000,
    revenueGrowth: 15.2,
    avgTransactionValue: 45000,
    conversionRate: 78.5,
    churnRate: 5.2
  }

  // Filter users (client-side filtering for current page)
  const filteredUsers = useMemo(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status.toLowerCase() === statusFilter.toLowerCase())
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = `${a.profile?.firstName || ''} ${a.profile?.lastName || ''}`.toLowerCase()
          bValue = `${b.profile?.firstName || ''} ${b.profile?.lastName || ''}`.toLowerCase()
          break
        case 'email':
          aValue = a.email?.toLowerCase() || ''
          bValue = b.email?.toLowerCase() || ''
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        default:
          aValue = a[sortBy as keyof User] || ''
          bValue = b[sortBy as keyof User] || ''
      }

      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1)
    })

    return filtered
  }, [users, searchTerm, statusFilter, sortBy, sortOrder])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-none xl:max-w-[1600px] 2xl:max-w-[2200px] mx-auto px-4 lg:px-6 xl:px-8 2xl:px-10 py-8">
          <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600 mt-2">Manage your KYC approved customer base</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Show:</label>
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-500">per page</span>
              </div>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Customer
              </button>
            </div>
          </div>
          </div>

        <CustomerStats stats={stats} />

        <CustomerFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          onClearFilters={handleClearFilters}
          onExport={handleExport}
          onCreateNew={handleCreateNew}
          selectedCount={selectedCustomers.length}
          totalCount={filteredUsers.length}
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          isProcessing={isProcessing}
        />

        <CustomerBulkActions
          selectedCount={selectedCustomers.length}
          onClearSelection={() => setSelectedCustomers([])}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkEmail={handleBulkEmail}
          onBulkExport={handleBulkExport}
          onBulkDelete={handleBulkDelete}
          onBulkVerify={handleBulkVerify}
          isProcessing={isProcessing}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="subscribers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
                    Subscribers
                  </TabsTrigger>
            <TabsTrigger value="merchants" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
                    Merchants
                  </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-2">
              <Handshake className="h-4 w-4" />
                    Partners
                  </TabsTrigger>
                </TabsList>

          <TabsContent value="subscribers">
            <CustomerTable
              customers={filteredUsers}
              selectedCustomers={selectedCustomers}
              onSelectCustomer={handleSelectCustomer}
              onSelectAll={handleSelectAll}
              onViewCustomer={handleViewCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              isLoading={usersLoading}
              currentPage={currentPage}
              totalPages={usersResponse.totalPages}
              onPageChange={handlePageChange}
            />
                </TabsContent>

          <TabsContent value="merchants">
            <CustomerTable
              customers={filteredUsers}
              selectedCustomers={selectedCustomers}
              onSelectCustomer={handleSelectCustomer}
              onSelectAll={handleSelectAll}
              onViewCustomer={handleViewCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              isLoading={usersLoading}
              currentPage={currentPage}
              totalPages={usersResponse.totalPages}
              onPageChange={handlePageChange}
            />
                </TabsContent>

          <TabsContent value="partners">
            <CustomerTable
              customers={filteredUsers}
              selectedCustomers={selectedCustomers}
              onSelectCustomer={handleSelectCustomer}
              onSelectAll={handleSelectAll}
              onViewCustomer={handleViewCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              isLoading={usersLoading}
              currentPage={currentPage}
              totalPages={usersResponse.totalPages}
              onPageChange={handlePageChange}
            />
                </TabsContent>
              </Tabs>
        </div>
    </div>
  )
}

export default CustomersPage
