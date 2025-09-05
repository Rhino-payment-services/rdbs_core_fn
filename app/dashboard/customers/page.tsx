"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  UserIcon, 
  Building2, 
  Search, 
  Filter, 
  Download, 
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  BarChart3,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Wallet,
  Shield,
  Key,
  Settings,
  Bell,
  Database,
  Server,
  FileText,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Wifi,
  WifiOff,
  Zap,
  Target,
  Fingerprint,
  ShieldCheck,
  AlertOctagon,
  CheckSquare,
  Clock3,
  Flag,
  Globe2,
  UserCheck as UserCheckIcon,
  UserX as UserXIcon,
  Clock as ClockIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  DollarSign as DollarSignIcon,
  Activity as ActivityIcon,
  BarChart3 as BarChart3Icon,
  Calendar as CalendarIcon,
  MapPin as MapPinIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Globe as GlobeIcon,
  CreditCard as CreditCardIcon,
  Wallet as WalletIcon,
  Shield as ShieldIcon,
  Key as KeyIcon,
  Settings as SettingsIcon,
  Bell as BellIcon,
  Database as DatabaseIcon,
  Server as ServerIcon,
  FileText as FileTextIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Laptop as LaptopIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Zap as ZapIcon,
  Target as TargetIcon,
  Fingerprint as FingerprintIcon,
  ShieldCheck as ShieldCheckIcon,
  AlertOctagon as AlertOctagonIcon,
  CheckSquare as CheckSquareIcon,
  Clock3 as Clock3Icon,
  Flag as FlagIcon,
  Globe2 as Globe2Icon
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  type: 'subscriber' | 'merchant' | 'partner'
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  registrationDate: string
  lastActivity: string
  totalTransactions: number
  totalVolume: number
  kycStatus: 'verified' | 'pending' | 'rejected' | 'not_started'
  location: string
  channels: string[]
  riskLevel: 'low' | 'medium' | 'high'
  tags: string[]
  notes: string
  createdBy: string
  updatedAt: string
  isVerified: boolean
  hasActiveSubscription: boolean
  subscriptionType?: string
  subscriptionExpiry?: string
  paymentMethod?: string
  preferredLanguage: string
  timezone: string
  notificationPreferences: {
    email: boolean
    sms: boolean
    push: boolean
  }
  complianceStatus: {
    aml: boolean
    kyc: boolean
    tax: boolean
  }
  riskScore: number
  lastLogin: string
  loginCount: number
  deviceInfo: {
    device: string
    browser: string
    os: string
    ip: string
    location: string
  }
  transactionHistory: {
    date: string
    amount: number
    type: string
    status: string
  }[]
  supportTickets: {
    id: string
    subject: string
    status: string
    priority: string
    created: string
  }[]
  documents: {
    type: string
    name: string
    status: string
    uploaded: string
  }[]
  preferences: {
    currency: string
    language: string
    notifications: boolean
    marketing: boolean
  }
  metadata: {
    source: string
    campaign: string
    referrer: string
    utm: {
      source: string
      medium: string
      campaign: string
    }
  }
}

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
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('table')
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)
  const [showCustomerActivity, setShowCustomerActivity] = useState(false)
  const [showCustomerTransactions, setShowCustomerTransactions] = useState(false)
  const [showCustomerDocuments, setShowCustomerDocuments] = useState(false)
  const [showCustomerSupport, setShowCustomerSupport] = useState(false)
  const [showCustomerSettings, setShowCustomerSettings] = useState(false)
  const [showCustomerAnalytics, setShowCustomerAnalytics] = useState(false)
  const [showCustomerReports, setShowCustomerReports] = useState(false)
  const [showCustomerAlerts, setShowCustomerAlerts] = useState(false)
  const [showCustomerNotes, setShowCustomerNotes] = useState(false)
  const [showCustomerTags, setShowCustomerTags] = useState(false)
  const [showCustomerHistory, setShowCustomerHistory] = useState(false)
  const [showCustomerCompliance, setShowCustomerCompliance] = useState(false)
  const [showCustomerRisk, setShowCustomerRisk] = useState(false)
  const [showCustomerKyc, setShowCustomerKyc] = useState(false)
  const [showCustomerAml, setShowCustomerAml] = useState(false)
  const [showCustomerTax, setShowCustomerTax] = useState(false)
  const [showCustomerSubscription, setShowCustomerSubscription] = useState(false)
  const [showCustomerPayment, setShowCustomerPayment] = useState(false)
  const [showCustomerNotification, setShowCustomerNotification] = useState(false)
  const [showCustomerPreference, setShowCustomerPreference] = useState(false)
  const [showCustomerMetadata, setShowCustomerMetadata] = useState(false)
  const [showCustomerDevice, setShowCustomerDevice] = useState(false)
  const [showCustomerLogin, setShowCustomerLogin] = useState(false)
  const [showCustomerTransaction, setShowCustomerTransaction] = useState(false)
  const [showCustomerSupportTicket, setShowCustomerSupportTicket] = useState(false)
  const [showCustomerDocument, setShowCustomerDocument] = useState(false)
  const [showCustomerPreferenceSetting, setShowCustomerPreferenceSetting] = useState(false)
  const [showCustomerMetadataSetting, setShowCustomerMetadataSetting] = useState(false)
  const [showCustomerDeviceSetting, setShowCustomerDeviceSetting] = useState(false)
  const [showCustomerLoginSetting, setShowCustomerLoginSetting] = useState(false)
  const [showCustomerTransactionSetting, setShowCustomerTransactionSetting] = useState(false)
  const [showCustomerSupportTicketSetting, setShowCustomerSupportTicketSetting] = useState(false)
  const [showCustomerDocumentSetting, setShowCustomerDocumentSetting] = useState(false)

  // Mock data
  const customers: Customer[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      type: 'subscriber',
      status: 'active',
      registrationDate: '2024-01-15',
      lastActivity: '2024-01-20',
      totalTransactions: 25,
      totalVolume: 5000,
      kycStatus: 'verified',
      location: 'New York, NY',
      channels: ['mobile', 'web'],
      riskLevel: 'low',
      tags: ['premium', 'verified'],
      notes: 'Regular customer',
      createdBy: 'admin',
      updatedAt: '2024-01-20',
      isVerified: true,
      hasActiveSubscription: true,
      subscriptionType: 'premium',
      subscriptionExpiry: '2024-12-31',
      paymentMethod: 'credit_card',
      preferredLanguage: 'en',
      timezone: 'America/New_York',
      notificationPreferences: {
        email: true,
        sms: false,
        push: true
      },
      complianceStatus: {
        aml: true,
        kyc: true,
        tax: true
      },
      riskScore: 25,
      lastLogin: '2024-01-20T10:30:00Z',
      loginCount: 45,
      deviceInfo: {
        device: 'iPhone 13',
        browser: 'Safari',
        os: 'iOS 17.0',
        ip: '192.168.1.100',
        location: 'New York, NY'
      },
      transactionHistory: [
        {
          date: '2024-01-20',
          amount: 100,
          type: 'payment',
          status: 'completed'
        }
      ],
      supportTickets: [],
      documents: [],
      preferences: {
        currency: 'USD',
        language: 'en',
        notifications: true,
        marketing: false
      },
      metadata: {
        source: 'organic',
        campaign: 'none',
        referrer: 'google.com',
        utm: {
          source: 'google',
          medium: 'organic',
          campaign: 'none'
        }
      }
    }
  ]

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
  }

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(customers.map(c => c.id))
    }
  }

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action}`, selectedCustomers)
  }

  const handleCreateCustomer = () => {
    setShowCreateModal(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowEditModal(true)
  }

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDeleteModal(true)
  }

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowCustomerDetails(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'subscriber': return 'bg-blue-100 text-blue-800'
      case 'merchant': return 'bg-purple-100 text-purple-800'
      case 'partner': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'not_started': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
    const matchesType = typeFilter === 'all' || customer.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const aValue = a[sortBy as keyof Customer]
    const bValue = b[sortBy as keyof Customer]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    return 0
  })

  const paginatedCustomers = sortedCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-2">Manage your customers and subscribers</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customers.filter(c => c.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  +8% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">
                  +15% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12,345</div>
                <p className="text-xs text-muted-foreground">
                  +20% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Customer Management</CardTitle>
                  <CardDescription>
                    View and manage all your customers
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button onClick={handleCreateCustomer}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Customer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="subscribers">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Subscribers
                  </TabsTrigger>
                  <TabsTrigger value="merchants">
                    <Building2 className="h-4 w-4 mr-2" />
                    Merchants
                  </TabsTrigger>
                  <TabsTrigger value="partners">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Partners
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="subscribers" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search customers..."
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="pl-8 w-64"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <Select value={statusFilter} onValueChange={handleStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Type</label>
                        <Select value={typeFilter} onValueChange={handleTypeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="subscriber">Subscriber</SelectItem>
                            <SelectItem value="merchant">Merchant</SelectItem>
                            <SelectItem value="partner">Partner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Sort By</label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sort By" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="registrationDate">Registration Date</SelectItem>
                            <SelectItem value="lastActivity">Last Activity</SelectItem>
                            <SelectItem value="totalTransactions">Total Transactions</SelectItem>
                            <SelectItem value="totalVolume">Total Volume</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="border rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left">
                              <input
                                type="checkbox"
                                checked={selectedCustomers.length === customers.length}
                                onChange={handleSelectAll}
                                className="rounded"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              Customer
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              KYC Status
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              Risk Level
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              Last Activity
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedCustomers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedCustomers.includes(customer.id)}
                                  onChange={() => handleSelectCustomer(customer.id)}
                                  className="rounded"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserIcon className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {customer.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {customer.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={getTypeColor(customer.type)}>
                                  {customer.type}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={getStatusColor(customer.status)}>
                                  {customer.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={getKycStatusColor(customer.kycStatus)}>
                                  {customer.kycStatus}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={getRiskLevelColor(customer.riskLevel)}>
                                  {customer.riskLevel}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {customer.lastActivity}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewCustomer(customer)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditCustomer(customer)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteCustomer(customer)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {paginatedCustomers.length} of {sortedCustomers.length} customers
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="merchants" className="space-y-4">
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Merchants</h3>
                    <p className="text-gray-500">Merchant management coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="partners" className="space-y-4">
                  <div className="text-center py-8">
                    <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Partners</h3>
                    <p className="text-gray-500">Partner management coming soon</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default CustomersPage
