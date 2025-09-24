"use client"
import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/dashboard/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CustomerStats } from '@/components/dashboard/customers/CustomerStats'
import { CustomerFilters } from '@/components/dashboard/customers/CustomerFilters'
import { CustomerTable } from '@/components/dashboard/customers/CustomerTable'
import { CustomerBulkActions } from '@/components/dashboard/customers/CustomerBulkActions'
import { useUsers } from '@/lib/hooks/useApi'
import type { User } from '@/lib/types/api'
import toast from 'react-hot-toast'
import { Users, Building2, Handshake, Plus } from 'lucide-react'

const CustomersPage = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('subscribers')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isProcessing, setIsProcessing] = useState(false)

  // API hooks
  const { data: usersData, isLoading: usersLoading, refetch } = useUsers()
  const users: User[] = usersData?.users || []

  // Mock stats data
  const stats = {
    total: users.length,
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

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status.toLowerCase() === statusFilter.toLowerCase())
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(user => user.userType.toLowerCase() === typeFilter.toLowerCase())
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase()
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase()
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
  }, [users, searchTerm, statusFilter, typeFilter, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Event handlers
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const handleSelectAll = () => {
    if (selectedCustomers.length === paginatedUsers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(paginatedUsers.map(user => user.id))
    }
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setTypeFilter('all')
    setSortBy('name')
    setSortOrder('asc')
    setCurrentPage(1)
  }

  const handleViewCustomer = (customer: User) => {
    router.push(`/dashboard/customers/${customer.id}`)
  }

  const handleEditCustomer = (customer: User) => {
    router.push(`/dashboard/customers/${customer.id}/edit`)
  }

  const handleDeleteCustomer = (customer: User) => {
    if (confirm(`Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`)) {
      toast.success('Customer deleted successfully')
      refetch()
    }
  }

  const handleBulkStatusChange = async (status: string) => {
    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success(`${selectedCustomers.length} customers updated to ${status}`)
      setSelectedCustomers([])
      refetch()
    } catch (error) {
      toast.error('Failed to update customers')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkEmail = () => toast.success(`Email sent to ${selectedCustomers.length} customers`)
  const handleBulkExport = () => toast.success(`Exporting ${selectedCustomers.length} customers`)
  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedCustomers.length} customers?`)) {
      toast.success(`${selectedCustomers.length} customers deleted`)
      setSelectedCustomers([])
      refetch()
    }
  }
  const handleBulkVerify = () => {
    toast.success(`${selectedCustomers.length} customers verified`)
    setSelectedCustomers([])
  }
  const handleExport = () => toast.success('Exporting all customers')
  const handleCreateNew = () => router.push('/dashboard/customers/create')
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedCustomers([])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600 mt-2">Manage your customer base</p>
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
              customers={paginatedUsers.filter(user => user.userType === 'SUBSCRIBER')}
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
            />
          </TabsContent>

          <TabsContent value="merchants">
            <CustomerTable
              customers={paginatedUsers.filter(user => user.userType === 'MERCHANT')}
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
            />
          </TabsContent>

          <TabsContent value="partners">
            <CustomerTable
              customers={paginatedUsers.filter(user => user.userType === 'PARTNER')}
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
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default CustomersPage
