"use client"
import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/dashboard/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CustomerStats } from '@/components/dashboard/customers/CustomerStats'
import { CustomerFilters } from '@/components/dashboard/customers/CustomerFilters'
import { CustomerTable } from '@/components/dashboard/customers/CustomerTable'
import { CustomerBulkActions } from '@/components/dashboard/customers/CustomerBulkActions'
import { CustomerDetailsModal } from '@/components/dashboard/customers/CustomerDetailsModal'
import { useUsers } from '@/lib/hooks/useApi'
import { useTransactionSystemStats } from '@/lib/hooks/useTransactions'
import { useMerchants } from '@/lib/hooks/useMerchants'
import type { User } from '@/lib/types/api'
import toast from 'react-hot-toast'
import { Users, Building2, Handshake, Plus } from 'lucide-react'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { PERMISSIONS } from '@/lib/hooks/usePermissions'

const CustomersPage = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('subscribers')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc'| 'desc'>('asc')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)

  // API hooks
  const { data: usersData, isLoading: usersLoading, refetch } = useUsers()
  // Only fetch merchants when on merchants tab
  const { data: merchantsData, isLoading: merchantsLoading, refetch: refetchMerchants } = useMerchants({
    search: activeTab === 'merchants' ? searchTerm : '',  // Only search when on merchants tab
    page: currentPage,
    pageSize: itemsPerPage
  })
  const { data: transactionStatsData, isLoading: statsLoading } = useTransactionSystemStats()
  
  // Handle both direct array and wrapped response
  const users: User[] = Array.isArray(usersData) ? usersData : (usersData?.data || [])
  const merchants = merchantsData?.merchants || []
  const merchantsTotal = merchantsData?.total || merchantsData?.pagination?.total || 0



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
    setSortBy('name')
    setSortOrder('asc')
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
    const currentPageCustomers = paginatedUsers.filter(user => {
      if (activeTab === 'subscribers') return user.subscriberType === 'INDIVIDUAL' // All INDIVIDUAL users
      if (activeTab === 'merchants') return !!user.merchantCode // Merchants have merchantCode
      if (activeTab === 'partners') return user.subscriberType === 'AGENT' // Backend uses 'AGENT' for partners
      return true
    })

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
    setSelectedCustomer(customer)
    setShowCustomerModal(true)
  }

  const handleEditCustomer = (customer: User) => {
    router.push(`/dashboard/customers/${customer.id}/edit`)
  }

  const handleDeleteCustomer = (customer: User) => {
    toast.error(`Delete customer ${customer.firstName} ${customer.lastName} not implemented yet`)
  }

  const handleCloseModal = () => {
    setShowCustomerModal(false)
    setSelectedCustomer(null)
  }

  const handleEditFromModal = (customer: User) => {
    setShowCustomerModal(false)
    setSelectedCustomer(null)
    handleEditCustomer(customer)
  }

  const handleDeleteFromModal = (customer: User) => {
    setShowCustomerModal(false)
    setSelectedCustomer(null)
    handleDeleteCustomer(customer)
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

  // Calculate stats from real data (exclude STAFF users)
  const nonStaffUsers = users.filter(user => user.userType !== 'STAFF')
  const totalUsers = nonStaffUsers.length
  const activeUsers = nonStaffUsers.filter(u => u.status === 'ACTIVE').length
  const inactiveUsers = nonStaffUsers.filter(u => u.status === 'INACTIVE').length
  const pendingUsers = nonStaffUsers.filter(u => u.status === 'PENDING').length
  
  // Get transaction stats - handle both wrapped and direct responses
  const transactionStats = transactionStatsData?.data || transactionStatsData || {}
  // Use RukaPay revenue (fees collected), not total volume
  const totalRevenue = transactionStats.rukapayRevenue || transactionStats.totalFees || 0
  const avgTransactionValue = transactionStats.averageTransactionAmount || 0
  
  // Calculate monthly revenue (approximation - could be improved with date filtering)
  const monthlyRevenue = Math.round(totalRevenue * 0.2) // Rough estimate
  
  // Calculate growth rate (mock calculation - could be improved with historical data)
  const revenueGrowth = 15.2 // This would need historical data to calculate properly
  
  // Calculate conversion rate - percentage of users who became active
  const conversionRate = totalUsers > 0 ? ((activeUsers / totalUsers) * 100) : 0
  
  // Calculate churn rate - percentage of inactive users
  const churnRate = totalUsers > 0 ? ((inactiveUsers / totalUsers) * 100) : 0
  
  const stats = {
    total: totalUsers,
    active: activeUsers,
    inactive: inactiveUsers,
    pending: pendingUsers,
    totalRevenue,
    monthlyRevenue,
    revenueGrowth,
    avgTransactionValue,
    conversionRate,
    churnRate
  }

  // Filter and sort users based on subscriberType (exclude STAFF users)
  const filteredUsers = useMemo(() => {
    // First, exclude all STAFF users from customers page
    let filtered = users.filter(user => user.userType !== 'STAFF')

    // Then filter by subscriberType based on active tab
    if (activeTab === 'subscribers') {
      // Subscribers: ALL INDIVIDUAL users (including those who also have merchant accounts)
      // A user can be BOTH a subscriber and a merchant (dual account system)
      filtered = filtered.filter(user => 
        user.subscriberType === 'INDIVIDUAL'
      )
    } else if (activeTab === 'merchants') {
      // Merchants: Users WITH merchantCode (regardless of subscriberType)
      // These users also appear in subscribers tab (dual account)
      filtered = filtered.filter(user => user.merchantCode)
    } else if (activeTab === 'partners') {
      // Backend uses 'AGENT' for partners, not 'PARTNER'
      filtered = filtered.filter(user => user.subscriberType === 'AGENT')
    }

    if (searchTerm) {
      filtered = filtered.filter(user => {
        const searchLower = searchTerm.toLowerCase()
        
        // Search in profile data first (if available)
        if (user.profile) {
          const profileName = `${user.profile.firstName || ''} ${user.profile.middleName || ''} ${user.profile.lastName || ''}`.toLowerCase().trim()
          if (profileName.includes(searchLower)) return true
        }
        
        // Fallback to direct user fields
        return (
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.phone?.toLowerCase().includes(searchLower)
        )
      })
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status.toLowerCase() === statusFilter.toLowerCase())
    }

    if (typeFilter !== 'all') {
      // Filter by userType instead of subscriberType for typeFilter
      filtered = filtered.filter(user => user.userType.toLowerCase() === typeFilter.toLowerCase())
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          // Use profile data if available, otherwise fallback to direct fields
          aValue = a.profile 
            ? `${a.profile.firstName || ''} ${a.profile.middleName || ''} ${a.profile.lastName || ''}`.toLowerCase().trim()
            : `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase().trim()
          bValue = b.profile 
            ? `${b.profile.firstName || ''} ${b.profile.middleName || ''} ${b.profile.lastName || ''}`.toLowerCase().trim()
            : `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase().trim()
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
  }, [users, activeTab, searchTerm, statusFilter, typeFilter, sortBy, sortOrder])

  // Tabs-specific user counts (exclude STAFF users)
  // Note: Users can appear in both Subscribers and Merchants (dual account system)
  const subscribersCount = nonStaffUsers.filter(user => user.subscriberType === 'INDIVIDUAL').length // All INDIVIDUAL users
  const merchantsCount = merchantsTotal // Get count from merchants API (includes dual account users)
  const partnersCount = nonStaffUsers.filter(user => user.subscriberType === 'AGENT').length // Backend uses 'AGENT' for partners

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600 mt-2">Manage your customer base</p>
            </div>
            <PermissionGuard permission={PERMISSIONS.MERCHANT_KYC_CREATE}>
              <button
                onClick={() => router.push('/dashboard/customers/merchant-onboard')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Merchant
              </button>
            </PermissionGuard>
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
              Subscribers ({subscribersCount})
            </TabsTrigger>
            <TabsTrigger value="merchants" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Merchants ({merchantsCount})
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-2">
              <Handshake className="h-4 w-4" />
              Partners ({partnersCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="subscribers">
            <CustomerTable
              customers={paginatedUsers}
              selectedCustomers={selectedCustomers}
              onSelectCustomer={handleSelectCustomer}
              onSelectAll={handleSelectAll}
              onViewCustomer={handleViewCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              isLoading={usersLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={filteredUsers.length}
            />
          </TabsContent>

          <TabsContent value="merchants">
            <CustomerTable
              customers={merchants as any}  // Merchants have different structure
              selectedCustomers={selectedCustomers}
              onSelectCustomer={handleSelectCustomer}
              onSelectAll={handleSelectAll}
              onViewCustomer={handleViewCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              isLoading={merchantsLoading}
              currentPage={merchantsData?.page || merchantsData?.pagination?.currentPage || currentPage}
              totalPages={merchantsData?.totalPages || merchantsData?.pagination?.totalPages || 1}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={merchantsTotal}
              isMerchantTab={true}  // Flag to render merchant-specific columns
            />
          </TabsContent>

          <TabsContent value="partners">
            <CustomerTable
              customers={paginatedUsers}
              selectedCustomers={selectedCustomers}
              onSelectCustomer={handleSelectCustomer}
              onSelectAll={handleSelectAll}
              onViewCustomer={handleViewCustomer}
              onEditCustomer={handleEditCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              isLoading={usersLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={filteredUsers.length}
            />
          </TabsContent>
        </Tabs>
          </div>
        </div>

        {/* Customer Details Modal */}
        <CustomerDetailsModal
          customer={selectedCustomer}
          isOpen={showCustomerModal}
          onClose={handleCloseModal}
          onEdit={handleEditFromModal}
          onDelete={handleDeleteFromModal}
        />
      </main>
    </div>
  )
}

export default CustomersPage
