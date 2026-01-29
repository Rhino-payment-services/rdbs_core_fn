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
import { useUsers, useApiPartners } from '@/lib/hooks/useApi'
import { useTransactionSystemStats } from '@/lib/hooks/useTransactions'
import { useMerchants } from '@/lib/hooks/useMerchants'
import type { User } from '@/lib/types/api'
import type { ApiPartner } from '@/lib/hooks/usePartners'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
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
  

  // API hooks - add keepPreviousData to prevent loading flashes
  const { data: usersData, isLoading: usersLoading, error: usersError, refetch } = useUsers()
  // Only fetch merchants when on merchants tab
  const { data: merchantsData, isLoading: merchantsLoading, refetch: refetchMerchants, error: merchantsError } = useMerchants({
    search: activeTab === 'merchants' ? searchTerm : '',  // Only search when on merchants tab
    page: currentPage,
    pageSize: itemsPerPage
  })
  // Fetch API partners when on partners tab
  const { data: partnersData, isLoading: partnersLoading, error: partnersError, refetch: refetchPartners } = useApiPartners({
    page: currentPage,
    limit: itemsPerPage
  })
  const { data: transactionStatsData, isLoading: statsLoading } = useTransactionSystemStats()
  
  
  // Log merchants data for debugging
  React.useEffect(() => {
    if (activeTab === 'merchants') {
      console.log('🏢 Merchants Tab Active - Data:', {
        merchantsData,
        merchantsLoading,
        merchantsError,
        merchantsCount: merchantsData?.merchants?.length || 0,
        total: merchantsData?.total || 0
      })
    }
  }, [activeTab, merchantsData, merchantsLoading, merchantsError])
  
  // Log partners data for debugging
  React.useEffect(() => {
    if (activeTab === 'partners' && partnersData) {
      console.log('🤝 Partners Tab - Data:', {
        partnersData,
        partnersCount: partnersData?.data?.length || 0,
        total: partnersData?.pagination?.total || 0,
        isLoading: partnersLoading,
        error: partnersError
      })
    }
  }, [activeTab, partnersData, partnersLoading, partnersError])

  // Log user data for debugging
  React.useEffect(() => {
    console.log('🔍 Debug: usersData structure:', {
      usersData,
      isArray: Array.isArray(usersData),
      hasData: !!(usersData as any)?.data,
      rawType: typeof usersData
    })
    
    if (usersData) {
      const users: User[] = Array.isArray(usersData) ? usersData : ((usersData as any)?.data || [])
      console.log(`📊 Customers Page: Loaded ${users.length} total users from API`)
      
      // Log first few users to see structure
      if (users.length > 0) {
        console.log('📋 Sample user structure:', {
          firstUser: users[0],
          userKeys: Object.keys(users[0]),
          hasMerchants: !!(users[0] as any).merchants,
          merchantsType: Array.isArray((users[0] as any).merchants),
          subscriberType: (users[0] as any).subscriberType,
          userType: (users[0] as any).userType
        })
      }
      
      // ✅ Updated: Check for merchants array instead of merchantCode
      const merchantUsers = users.filter(u => u.merchants && u.merchants.length > 0)
      // ✅ Check for partners (AGENT subscriberType)
      const partnerUsers = users.filter(u => {
        if (u.subscriberType === 'AGENT') return true
        if (!u.subscriberType && (u.userType === 'PARTNER' || u.userType === 'AGENT')) return true
        return false
      })
      
      // Check subscribers (including users with merchants but no subscriberType)
      const subscriberUsers = users.filter(u => 
        u.subscriberType === 'INDIVIDUAL' || 
        ((u.merchants && u.merchants.length > 0) && !u.subscriberType)
      )
      const usersWithMerchantsButNoType = users.filter(u => 
        (u.merchants && u.merchants.length > 0) && !u.subscriberType
      )
      
      console.log(`  - Total users: ${users.length}`)
      console.log(`  - Subscribers (INDIVIDUAL or with merchants): ${subscriberUsers.length}`)
      console.log(`  - Users with merchant accounts: ${merchantUsers.length}`)
      console.log(`  - ⚠️ Users with merchants but NO subscriberType: ${usersWithMerchantsButNoType.length}`)
      console.log(`  - Partners (AGENT): ${partnerUsers.length}`)
      console.log(`  - STAFF users: ${users.filter(u => u.userType === 'STAFF').length}`)
      
      merchantUsers.forEach(u => {
        const merchantCodes = u.merchants?.map(m => m.merchantCode).join(', ') || 'none'
        console.log(`  - Merchant: ${u.email || u.phone}: merchants=[${merchantCodes}], subscriberType=${u.subscriberType || 'null'}`)
      })
      
      if (usersWithMerchantsButNoType.length > 0) {
        console.warn(`  ⚠️ These users have merchants but no subscriberType (should be fixed):`, 
          usersWithMerchantsButNoType.map(u => ({ 
            email: u.email, 
            phone: u.phone, 
            merchants: u.merchants?.length || 0 
          }))
        )
      }
      partnerUsers.forEach(u => {
        console.log(`  - Partner: ${u.email || u.phone}: subscriberType=${u.subscriberType}, userType=${u.userType}`)
      })
    } else {
      console.log('⚠️ No usersData received from API')
    }
  }, [usersData])
  
  // Handle both direct array and wrapped response
  const users: User[] = Array.isArray(usersData) ? usersData : ((usersData as any)?.data || [])
  const merchants = merchantsData?.merchants || []
  const merchantsTotal = merchantsData?.total || merchantsData?.pagination?.total || 0
  
  // ✅ Debug: Log if there's an error or no data
  React.useEffect(() => {
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
    }
    if (usersLoading === false && users.length === 0) {
      console.warn('⚠️ No users returned from API. Check:', {
        usersData,
        usersError,
        isArray: Array.isArray(usersData),
        hasData: !!(usersData as any)?.data
      })
    }
  }, [usersError, usersLoading, users.length, usersData])




  // Export functionality
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsProcessing(true)
    try {
      if (format === 'csv') {
        if (activeTab === 'merchants') {
          // Fetch all merchants for export (not just current page)
          await exportMerchantsToCSV()
        } else {
          // Export subscribers/partners to CSV
          // For partners tab, use transformedPartners; otherwise use filteredUsers
          const dataToExport: (User | any)[] = activeTab === 'partners' && transformedPartners.length > 0
            ? transformedPartners
            : filteredUsers
          exportUsersToCSV(dataToExport, activeTab)
        }
        toast.success(`Customer data exported as ${format.toUpperCase()}`)
      } else {
        // For Excel and PDF, show a message that it's coming soon
        toast.error(`${format.toUpperCase()} export is coming soon. Please use CSV for now.`)
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export customer data')
    } finally {
      setIsProcessing(false)
    }
  }

  // Export merchants to CSV - fetches all merchants
  const exportMerchantsToCSV = async () => {
    try {
      // Fetch all merchants (no pagination for export)
      const response = await api({
        url: '/merchant-kyc/all',
        method: 'GET',
        params: {
          pageSize: 10000, // Large page size to get all merchants
        },
      })
      
      const merchantsData = response.data?.merchants || response.data?.data || []
      
      if (!merchantsData || merchantsData.length === 0) {
        toast.error('No merchants to export')
        return
      }
      
      // Debug: Log first merchant structure to understand data format
      if (merchantsData.length > 0) {
        console.log('📊 First merchant data structure:', merchantsData[0])
        console.log('📊 Available fields:', Object.keys(merchantsData[0]))
      }

    // Define CSV headers
    const headers = ['Name', 'Owner', 'Status', 'Joined', 'Phone', 'Email', 'Merchant Code']
    
    // Convert merchants data to CSV rows
    const csvRows = merchantsData.map((merchant: any) => {
      const name = merchant.businessTradeName || 'Unknown Business'
      const owner = `${merchant.ownerFirstName || ''} ${merchant.ownerLastName || ''}`.trim() || 'N/A'
      const status = merchant.isVerified ? 'Verified' : 'Pending'
      const joined = merchant.onboardedAt 
        ? new Date(merchant.onboardedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : 'N/A'
      
      // API returns phone and email directly on merchant object (mapped from registeredPhoneNumber and businessEmail)
      // Try phone first (API response), then fallback to registeredPhoneNumber (direct DB field)
      const phone = merchant.phone 
        || merchant.registeredPhoneNumber 
        || merchant.user?.phone 
        || merchant.user?.registeredPhoneNumber
        || 'N/A'
      
      // Try email first (API response), then fallback to businessEmail (direct DB field)
      const email = merchant.email 
        || merchant.businessEmail 
        || merchant.user?.email 
        || merchant.user?.businessEmail
        || 'N/A'
      
      const merchantCode = merchant.merchantCode || 'N/A'
      
      // Escape commas and quotes in CSV values
      const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }
      
      return [
        escapeCSV(name),
        escapeCSV(owner),
        escapeCSV(status),
        escapeCSV(joined),
        escapeCSV(phone),
        escapeCSV(email),
        escapeCSV(merchantCode)
      ].join(',')
    })
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows
    ].join('\n')
    
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `merchants_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting merchants:', error)
      throw error
    }
  }

  // Export users (subscribers/partners) to CSV
  const exportUsersToCSV = (usersData: User[] | any[], tab: string) => {
    if (!usersData || usersData.length === 0) {
      toast.error(`No ${tab} to export`)
      return
    }

    // Define CSV headers
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Type', 'Joined', 'Location']
    
    // Convert users data to CSV rows
    const csvRows = usersData.map((user: User | any) => {
      // Check if this is a partner (has partnerName)
      const name = (user as any).partnerName 
        ? (user as any).partnerName
        : user.profile 
          ? `${user.profile.firstName || ''} ${user.profile.middleName ? user.profile.middleName + ' ' : ''}${user.profile.lastName || ''}`.trim()
          : `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown'
      const email = user.email || 'N/A'
      const phone = user.phone || 'N/A'
      const status = user.status || 'N/A'
      const type = (user as any).partnerType || user.userType || user.subscriberType || 'N/A'
      const joined = user.createdAt 
        ? new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : 'N/A'
      const location = (user as any)?.country || user.profile?.country || 'N/A'
      
      // Escape commas and quotes in CSV values
      const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }
      
      return [
        escapeCSV(name),
        escapeCSV(email),
        escapeCSV(phone),
        escapeCSV(status),
        escapeCSV(type),
        escapeCSV(joined),
        escapeCSV(location)
      ].join(',')
    })
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows
    ].join('\n')
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${tab}_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
    // For partners tab, all paginatedUsers are partners (already filtered)
    const currentPageCustomers = activeTab === 'partners' 
      ? paginatedUsers // All are partners when on partners tab
      : paginatedUsers.filter(user => {
          if (activeTab === 'subscribers') {
            // ✅ Include INDIVIDUAL, ALL MERCHANT users, users with merchants but no subscriberType, or users with no subscriberType
            const isIndividual = user.subscriberType === 'INDIVIDUAL'
            const isMerchantType = user.subscriberType === 'MERCHANT' // All MERCHANT users are subscribers
            const hasMerchantsButNoSubscriberType = (user.merchants && user.merchants.length > 0) && !user.subscriberType
            const hasNoSubscriberType = !user.subscriberType && (!user.merchants || user.merchants.length === 0)
            return isIndividual || isMerchantType || hasMerchantsButNoSubscriberType || hasNoSubscriberType
          }
          if (activeTab === 'merchants') return !!(user.merchants && user.merchants.length > 0) // ✅ Updated: Check merchants array
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

  const handleViewCustomer = (customer: User | any) => {
    // Determine customer type for routing
    let customerType = 'subscriber' // default
    let customerId = customer.id
    
    // All partners (gateway and regular) open on the same customer profile page
    if (customer.partnerName) {
      // Gateway partner from Partners tab - show on customer profile page (no redirect)
      customerType = 'partner'
      customerId = customer.id
    } else if (customer.businessTradeName) {
      // ✅ This is a merchant object from the merchants tab (has businessTradeName)
      // Use the merchant's ID directly, not the userId
      customerType = 'merchant'
      customerId = customer.id // Use merchant ID, not userId
    } else if (customer.merchants && customer.merchants.length > 0) {
      // ✅ This is a user object with merchants array (from subscribers tab)
      customerType = 'merchant'
      // For users with merchants, use the first merchant's ID or userId
      const firstMerchant = customer.merchants[0]
      customerId = firstMerchant.id || (customer as any).userId || customer.id
    } else if (customer.subscriberType === 'AGENT' || (!customer.subscriberType && (customer.userType === 'PARTNER' || customer.userType === 'AGENT'))) {
      // ✅ Regular partners: subscriberType === 'AGENT' or userType === 'PARTNER'/'AGENT' as fallback
      customerType = 'partner'
    } else if (customer.subscriberType === 'INDIVIDUAL') {
      customerType = 'subscriber'
    }
    
    // Navigate to customer detail page
    router.push(`/dashboard/customers/${customerType}/${customerId}`)
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

  // Transform API partners to User-like format for display
  const transformedPartners = useMemo(() => {
    if (activeTab !== 'partners' || !partnersData?.data) {
      return []
    }
    
    return partnersData.data.map((partner: ApiPartner) => ({
      id: partner.id,
      email: partner.contactEmail,
      phone: partner.contactPhone,
      firstName: partner.partnerName.split(' ')[0] || '',
      lastName: partner.partnerName.split(' ').slice(1).join(' ') || '',
      status: partner.isActive && !partner.isSuspended ? 'ACTIVE' : partner.isSuspended ? 'SUSPENDED' : 'INACTIVE',
      userType: 'PARTNER', // Set to PARTNER for proper badge display
      subscriberType: 'AGENT',
      role: 'USER', // Required User property
      isVerified: partner.isActive, // Required User property
      kycStatus: 'APPROVED', // Required User property
      verificationLevel: 'ENHANCED', // Required User property
      canHaveWallet: true, // Required User property
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      // Add partner-specific fields (extended properties)
      partnerName: partner.partnerName,
      partnerType: partner.partnerType,
      tier: partner.tier,
      country: partner.country,
      isActive: partner.isActive,
      isSuspended: partner.isSuspended,
    } as User & { partnerName?: string; partnerType?: string; tier?: string; country?: string; isActive?: boolean; isSuspended?: boolean }))
  }, [activeTab, partnersData])

  // Filter and sort users based on subscriberType (exclude STAFF users)
  const filteredUsers = useMemo((): (User | any)[] => {
    // If partners tab, use transformed partners data instead of filtering users
    if (activeTab === 'partners') {
      console.log(`🤝 Partners tab: Using API partners data, count: ${transformedPartners.length}`)
      let filtered = [...transformedPartners]
      
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        filtered = filtered.filter((partner: any) => {
          return (
            partner.partnerName?.toLowerCase().includes(searchLower) ||
            partner.email?.toLowerCase().includes(searchLower) ||
            partner.phone?.toLowerCase().includes(searchLower) ||
            partner.partnerType?.toLowerCase().includes(searchLower)
          )
        })
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        filtered = filtered.filter((partner: any) => 
          partner.status.toLowerCase() === statusFilter.toLowerCase()
        )
      }
      
      // Sort
      filtered.sort((a: any, b: any) => {
        let aValue: any, bValue: any
        switch (sortBy) {
          case 'name':
            aValue = a.partnerName || a.email || ''
            bValue = b.partnerName || b.email || ''
            break
          case 'email':
            aValue = a.email || ''
            bValue = b.email || ''
            break
          case 'status':
            aValue = a.status || ''
            bValue = b.status || ''
            break
          case 'joined':
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
            break
          default:
            aValue = a.partnerName || ''
            bValue = b.partnerName || ''
        }
        
        if (typeof aValue === 'string') {
          return sortOrder === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      })
      
      return filtered as (User | any)[]
    }
    
    console.log(`🔍 Filtering users for tab: ${activeTab}, total users: ${users.length}`)
    
    if (users.length === 0) {
      console.warn('⚠️ No users available to filter! Check API response.')
      return []
    }
    
    // First, exclude all STAFF users from customers page
    let filtered = users.filter(user => {
      const isStaff = user.userType === 'STAFF'
      if (isStaff) {
        console.log(`  - Excluding STAFF user: ${user.email || user.phone}, userType=${user.userType}`)
      }
      return !isStaff
    })
    console.log(`  - After excluding STAFF: ${filtered.length} users (excluded ${users.length - filtered.length} STAFF users)`)
    
    // ✅ If no non-STAFF users, log all users for debugging
    if (filtered.length === 0 && users.length > 0) {
      console.warn('⚠️ All users are STAFF users! Showing all users for debugging:', users.map(u => ({
        email: u.email,
        phone: u.phone,
        userType: u.userType,
        subscriberType: u.subscriberType
      })))
      // Temporarily show all users if all are STAFF (for debugging)
      filtered = users
    }

    // Then filter by subscriberType based on active tab
    if (activeTab === 'subscribers') {
      // Subscribers: ALL INDIVIDUAL users (including those who also have merchant accounts)
      // A user can be BOTH a subscriber and a merchant (dual account system)
      // ✅ Include users with subscriberType 'INDIVIDUAL', 'MERCHANT' (all MERCHANT users are individuals),
      //    or users with merchants but null subscriberType, or users with no subscriberType (default to INDIVIDUAL)
      const beforeCount = filtered.length
      filtered = filtered.filter(user => {
        // Include if subscriberType is 'INDIVIDUAL'
        const isIndividual = user.subscriberType === 'INDIVIDUAL'
        // ✅ Include ALL users with 'MERCHANT' subscriberType (they are individuals who registered as merchants)
        //    Whether they have merchant accounts or not, they should appear as subscribers
        const isMerchantType = user.subscriberType === 'MERCHANT'
        // Include users with merchants but null subscriberType (they should be INDIVIDUAL)
        const hasMerchantsButNoSubscriberType = (user.merchants && user.merchants.length > 0) && !user.subscriberType
        // ✅ Include users with no subscriberType and no merchants (default to INDIVIDUAL subscribers)
        const hasNoSubscriberType = !user.subscriberType && (!user.merchants || user.merchants.length === 0)
        
        const shouldInclude = isIndividual || isMerchantType || hasMerchantsButNoSubscriberType || hasNoSubscriberType
        
        if (!shouldInclude) {
          console.log(`  - User ${user.email || user.phone} excluded from subscribers: subscriberType=${user.subscriberType}, hasMerchants=${!!(user.merchants && user.merchants.length > 0)}`)
        }
        
        return shouldInclude
      })
      console.log(`  - After filtering INDIVIDUAL subscribers: ${filtered.length} users (excluded ${beforeCount - filtered.length})`)
      
      // ✅ Log users with merchants but no subscriberType (these should be fixed in backend)
      const usersWithMerchantsButNoType = filtered.filter(u => !u.subscriberType && u.merchants && u.merchants.length > 0)
      if (usersWithMerchantsButNoType.length > 0) {
        console.warn(`⚠️ Found ${usersWithMerchantsButNoType.length} users with merchants but no subscriberType. These should be fixed:`, 
          usersWithMerchantsButNoType.map(u => ({ email: u.email, phone: u.phone, merchants: u.merchants?.length }))
        )
      }
      
      // ✅ If no INDIVIDUAL users found, show warning
      if (filtered.length === 0 && beforeCount > 0) {
        const allSubscriberTypes = [...new Set(users.filter(u => u.userType !== 'STAFF').map(u => u.subscriberType).filter(Boolean))]
        const usersWithMerchants = users.filter(u => u.userType !== 'STAFF' && u.merchants && u.merchants.length > 0)
        console.warn('⚠️ No INDIVIDUAL subscribers found!', {
          availableSubscriberTypes: allSubscriberTypes,
          usersWithMerchants: usersWithMerchants.length,
          sampleUser: usersWithMerchants[0] ? {
            email: usersWithMerchants[0].email,
            phone: usersWithMerchants[0].phone,
            subscriberType: usersWithMerchants[0].subscriberType,
            hasMerchants: !!(usersWithMerchants[0].merchants && usersWithMerchants[0].merchants.length > 0)
          } : null
        })
      }
    } else if (activeTab === 'merchants') {
      // ✅ Updated: Merchants: Users WITH merchants array (regardless of subscriberType)
      // These users also appear in subscribers tab (dual account)
      const beforeCount = filtered.length
      filtered = filtered.filter(user => {
        const hasMerchants = user.merchants && user.merchants.length > 0
        if (!hasMerchants) {
          console.log(`  - User ${user.email || user.phone} excluded: no merchants array or empty`, {
            hasMerchantsProp: !!user.merchants,
            merchantsLength: user.merchants?.length || 0,
            merchants: user.merchants
          })
        }
        return hasMerchants
      })
      console.log(`  - After filtering merchants: ${filtered.length} users (excluded ${beforeCount - filtered.length})`)
      
      // ✅ If no merchants found, show warning
      if (filtered.length === 0 && beforeCount > 0) {
        console.warn('⚠️ No users with merchants found! Check if merchants are included in API response.')
      }
    }
    // Partners tab is handled above with transformedPartners

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

    console.log(`✅ Final filtered users count: ${filtered.length} for tab: ${activeTab}`)
    
    // ✅ Debug: Log users that don't match any category (after STAFF exclusion)
    const nonStaffUsersForDebug = users.filter(u => u.userType !== 'STAFF')
    const usersInSubscribers = nonStaffUsersForDebug.filter(u => {
      const isIndividual = u.subscriberType === 'INDIVIDUAL'
      const isMerchantType = u.subscriberType === 'MERCHANT'
      const hasMerchantsButNoSubscriberType = (u.merchants && u.merchants.length > 0) && !u.subscriberType
      const hasNoSubscriberType = !u.subscriberType && (!u.merchants || u.merchants.length === 0)
      return isIndividual || isMerchantType || hasMerchantsButNoSubscriberType || hasNoSubscriberType
    })
    const usersInMerchants = nonStaffUsersForDebug.filter(u => u.merchants && u.merchants.length > 0)
    const usersInPartners = nonStaffUsersForDebug.filter(u => {
      return u.subscriberType === 'AGENT' || (!u.subscriberType && (u.userType === 'PARTNER' || u.userType === 'AGENT'))
    })
    const usersInAnyCategory = new Set([
      ...usersInSubscribers.map(u => u.id),
      ...usersInMerchants.map(u => u.id),
      ...usersInPartners.map(u => u.id)
    ])
    const usersNotInAnyCategory = nonStaffUsersForDebug.filter(u => !usersInAnyCategory.has(u.id))
    
    if (usersNotInAnyCategory.length > 0) {
      console.warn(`⚠️ Found ${usersNotInAnyCategory.length} users that don't match any category:`, 
        usersNotInAnyCategory.map(u => ({
          id: u.id,
          email: u.email,
          phone: u.phone,
          userType: u.userType,
          subscriberType: u.subscriberType,
          hasMerchants: !!(u.merchants && u.merchants.length > 0),
          status: u.status
        }))
      )
    }
    
    // ✅ If no users after filtering but we had users initially, log warning
    if (filtered.length === 0 && users.length > 0) {
      console.warn(`⚠️ All ${users.length} users were filtered out for tab "${activeTab}". This might indicate a filtering issue.`)
      console.warn('Available user data:', {
        userTypes: [...new Set(users.map(u => u.userType))],
        subscriberTypes: [...new Set(users.map(u => u.subscriberType).filter(Boolean))],
        usersWithMerchants: users.filter(u => u.merchants && u.merchants.length > 0).length,
        sampleUser: users[0] ? {
          email: users[0].email,
          phone: users[0].phone,
          userType: users[0].userType,
          subscriberType: users[0].subscriberType,
          hasMerchants: !!(users[0].merchants && users[0].merchants.length > 0)
        } : null
      })
    }
    
    return filtered as (User | any)[]
  }, [users, activeTab, searchTerm, statusFilter, typeFilter, sortBy, sortOrder, transformedPartners])

  // Tabs-specific user counts (exclude STAFF users)
  // Note: Users can appear in both Subscribers and Merchants (dual account system)
  // ✅ Count subscribers: INDIVIDUAL users, ALL MERCHANT users, users with merchants but no subscriberType, or users with no subscriberType
  const subscribersCount = nonStaffUsers.filter(user => {
    const isIndividual = user.subscriberType === 'INDIVIDUAL'
    const isMerchantType = user.subscriberType === 'MERCHANT' // All MERCHANT users are subscribers
    const hasMerchantsButNoSubscriberType = (user.merchants && user.merchants.length > 0) && !user.subscriberType
    const hasNoSubscriberType = !user.subscriberType && (!user.merchants || user.merchants.length === 0)
    return isIndividual || isMerchantType || hasMerchantsButNoSubscriberType || hasNoSubscriberType
  }).length
  const merchantsCount = merchantsTotal // Get count from merchants API (includes dual account users)
  // ✅ Partners: Use API partners count from partnersData
  const partnersCount = partnersData?.pagination?.total || partnersData?.data?.length || 0

  // Pagination
  // Calculate pagination - use partnersData pagination for partners tab
  const totalPages = activeTab === 'partners' && partnersData?.pagination
    ? partnersData.pagination.totalPages
    : Math.ceil(filteredUsers.length / itemsPerPage)
  
  const paginatedUsers = activeTab === 'partners' && partnersData?.data
    ? transformedPartners.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )


  // Show loading state to prevent "Access Restricted" flash
  if (usersLoading && !usersData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading customers...</p>
          </div>
        </main>
      </div>
    )
  }
  
  // ✅ Show error state if API call failed
  if (usersError && activeTab !== 'partners') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading customers</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }
  
  // Show error state for partners if API call failed
  if (partnersError && activeTab === 'partners') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading partners</p>
            <button
              onClick={() => refetchPartners()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    )
  }

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
              onRefresh={refetch}
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
              onRefresh={refetchMerchants}
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
              isLoading={partnersLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={partnersData?.pagination?.total || transformedPartners.length}
              onRefresh={refetchPartners}
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
