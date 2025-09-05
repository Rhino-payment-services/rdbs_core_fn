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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Users,
  User,
  Building2,
  CreditCard,
  Banknote,
  Shield,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Building,
  Store,
  Handshake,
  Users as UsersIcon,
  User as UserIcon,
  Building2 as Building2Icon,
  CreditCard as CreditCardIcon,
  Banknote as BanknoteIcon,
  Shield as ShieldIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Download as DownloadIcon,
  Plus as PlusIcon,
  Edit as EditIcon,
  Eye as EyeIcon,
  MoreHorizontal as MoreHorizontalIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Calendar as CalendarIcon,
  Activity as ActivityIcon,
  DollarSign as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  Clock as ClockIcon,
  UserCheck as UserCheckIcon,
  UserX as UserXIcon,
  UserPlus as UserPlusIcon,
  UserMinus as UserMinusIcon,
  Building as BuildingIcon,
  Store as StoreIcon,
  Handshake as HandshakeIcon
} from 'lucide-react'

const CustomersPage = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("subscribers")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const itemsPerPage = 10

  // Sample customer data
  const customerData = {
    subscribers: {
      total: 15420,
      active: 14250,
      inactive: 1170,
      data: [
        {
          id: 1,
          name: "John Doe",
          email: "john.doe@email.com",
          phone: "+256 701 234 567",
          status: "active",
          joinDate: "2024-01-15",
          lastActivity: "2024-01-20",
          totalTransactions: 45,
          totalVolume: 1250000,
          location: "Kampala"
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane.smith@email.com",
          phone: "+256 702 345 678",
          status: "active",
          joinDate: "2024-01-10",
          lastActivity: "2024-01-19",
          totalTransactions: 32,
          totalVolume: 890000,
          location: "Nairobi"
        },
        {
          id: 3,
          name: "Mike Wilson",
          email: "mike.wilson@email.com",
          phone: "+256 703 456 789",
          status: "inactive",
          joinDate: "2023-12-20",
          lastActivity: "2024-01-05",
          totalTransactions: 18,
          totalVolume: 450000,
          location: "Dar es Salaam"
        }
      ]
    },
    merchants: {
      total: 2847,
      active: 2650,
      inactive: 197,
      data: [
        {
          id: 1,
          name: "ABC Supermarket",
          email: "contact@abcsupermarket.com",
          phone: "+256 704 567 890",
          status: "active",
          joinDate: "2023-11-15",
          lastActivity: "2024-01-20",
          totalTransactions: 1250,
          totalVolume: 45000000,
          location: "Kampala",
          category: "Retail"
        },
        {
          id: 2,
          name: "XYZ Restaurant",
          email: "info@xyzrestaurant.com",
          phone: "+256 705 678 901",
          status: "active",
          joinDate: "2023-12-01",
          lastActivity: "2024-01-19",
          totalTransactions: 890,
          totalVolume: 32000000,
          location: "Nairobi",
          category: "Food & Beverage"
        },
        {
          id: 3,
          name: "Tech Solutions Ltd",
          email: "hello@techsolutions.com",
          phone: "+256 706 789 012",
          status: "inactive",
          joinDate: "2023-10-20",
          lastActivity: "2024-01-10",
          totalTransactions: 450,
          totalVolume: 15000000,
          location: "Dar es Salaam",
          category: "Technology"
        }
      ]
    },
    partners: {
      total: 156,
      active: 142,
      inactive: 14,
      data: [
        {
          id: 1,
          name: "East Africa Bank",
          email: "partnership@eastafricabank.com",
          phone: "+256 707 890 123",
          status: "active",
          joinDate: "2023-08-15",
          lastActivity: "2024-01-20",
          totalTransactions: 5600,
          totalVolume: 250000000,
          location: "Kampala",
          type: "Banking Partner"
        },
        {
          id: 2,
          name: "Mobile Money Corp",
          email: "partners@mobilemoney.com",
          phone: "+256 708 901 234",
          status: "active",
          joinDate: "2023-09-01",
          lastActivity: "2024-01-19",
          totalTransactions: 4200,
          totalVolume: 180000000,
          location: "Nairobi",
          type: "Mobile Money"
        },
        {
          id: 3,
          name: "Payment Gateway Ltd",
          email: "hello@paymentgateway.com",
          phone: "+256 709 012 345",
          status: "inactive",
          joinDate: "2023-07-20",
          lastActivity: "2024-01-05",
          totalTransactions: 2800,
          totalVolume: 95000000,
          location: "Dar es Salaam",
          type: "Payment Gateway"
        }
      ]
    },
    agents: {
      total: 2847,
      active: 2650,
      inactive: 197,
      data: [
        {
          id: 1,
          name: "Sarah Johnson",
          email: "sarah.johnson@agent.com",
          phone: "+256 710 123 456",
          status: "active",
          joinDate: "2023-12-15",
          lastActivity: "2024-01-20",
          totalTransactions: 890,
          totalVolume: 45000000,
          location: "Kampala",
          commission: 2.5
        },
        {
          id: 2,
          name: "David Brown",
          email: "david.brown@agent.com",
          phone: "+256 711 234 567",
          status: "active",
          joinDate: "2023-11-20",
          lastActivity: "2024-01-19",
          totalTransactions: 650,
          totalVolume: 32000000,
          location: "Nairobi",
          commission: 2.0
        },
        {
          id: 3,
          name: "Lisa Wilson",
          email: "lisa.wilson@agent.com",
          phone: "+256 712 345 678",
          status: "inactive",
          joinDate: "2023-10-10",
          lastActivity: "2024-01-10",
          totalTransactions: 420,
          totalVolume: 18000000,
          location: "Dar es Salaam",
          commission: 2.5
        }
      ]
    },
    superAgents: {
      total: 847,
      active: 780,
      inactive: 67,
      data: [
        {
          id: 1,
          name: "Super Agent Network",
          email: "contact@superagent.com",
          phone: "+256 713 456 789",
          status: "active",
          joinDate: "2023-09-15",
          lastActivity: "2024-01-20",
          totalTransactions: 2500,
          totalVolume: 125000000,
          location: "Kampala",
          subAgents: 45
        },
        {
          id: 2,
          name: "Elite Financial Services",
          email: "info@elitefinancial.com",
          phone: "+256 714 567 890",
          status: "active",
          joinDate: "2023-08-20",
          lastActivity: "2024-01-19",
          totalTransactions: 1800,
          totalVolume: 95000000,
          location: "Nairobi",
          subAgents: 32
        },
        {
          id: 3,
          name: "Premium Partners Ltd",
          email: "hello@premiumpartners.com",
          phone: "+256 715 678 901",
          status: "inactive",
          joinDate: "2023-07-10",
          lastActivity: "2024-01-05",
          totalTransactions: 1200,
          totalVolume: 65000000,
          location: "Dar es Salaam",
          subAgents: 28
        }
      ]
    },
    banks: {
      total: 45,
      active: 42,
      inactive: 3,
      data: [
        {
          id: 1,
          name: "Central Bank of Uganda",
          email: "partnership@centralbank.ug",
          phone: "+256 716 789 012",
          status: "active",
          joinDate: "2023-06-15",
          lastActivity: "2024-01-20",
          totalTransactions: 8500,
          totalVolume: 450000000,
          location: "Kampala",
          type: "Central Bank"
        },
        {
          id: 2,
          name: "Kenya Commercial Bank",
          email: "partners@kcb.co.ke",
          phone: "+256 717 890 123",
          status: "active",
          joinDate: "2023-05-20",
          lastActivity: "2024-01-19",
          totalTransactions: 7200,
          totalVolume: 380000000,
          location: "Nairobi",
          type: "Commercial Bank"
        },
        {
          id: 3,
          name: "Tanzania National Bank",
          email: "hello@tnb.co.tz",
          phone: "+256 718 901 234",
          status: "inactive",
          joinDate: "2023-04-10",
          lastActivity: "2024-01-10",
          totalTransactions: 4800,
          totalVolume: 250000000,
          location: "Dar es Salaam",
          type: "National Bank"
        }
      ]
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: 'code'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-UG').format(num)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getCurrentData = () => {
    const data = customerData[activeTab as keyof typeof customerData]
    let filteredData = data.data

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.includes(searchTerm)
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filteredData = filteredData.filter(item => item.status === statusFilter)
    }

    return filteredData
  }

  const getPaginatedData = () => {
    const data = getCurrentData()
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const totalPages = Math.ceil(getCurrentData().length / itemsPerPage)

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'subscribers':
        return <UserIcon className="h-4 w-4" />
      case 'merchants':
        return <StoreIcon className="h-4 w-4" />
      case 'partners':
        return <HandshakeIcon className="h-4 w-4" />
      case 'agents':
        return <UsersIcon className="h-4 w-4" />
      case 'superAgents':
        return <ShieldIcon className="h-4 w-4" />
      case 'banks':
        return <Building2Icon className="h-4 w-4" />
      default:
        return <UserIcon className="h-4 w-4" />
    }
  }

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'subscribers':
        return 'Subscribers'
      case 'merchants':
        return 'Merchants'
      case 'partners':
        return 'Partners'
      case 'agents':
        return 'Agents'
      case 'superAgents':
        return 'Super Agents'
      case 'banks':
        return 'Banks'
      default:
        return tab
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Customers Management</h1>
                <p className="text-gray-600">Manage all customer types and relationships</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/dashboard/customers/merchant-onboard')}
                  className="flex items-center gap-2"
                >
                  <StoreIcon className="h-4 w-4" />
                  Onboard Merchant
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <DownloadIcon className="h-4 w-4" />
                  Export
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => {
                    if (activeTab === 'merchants') {
                      router.push('/dashboard/customers/merchant-onboard')
                    } else {
                      // TODO: Add other customer types onboarding
                      router.push('/dashboard/customers/merchant-onboard')
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  {activeTab === 'merchants' ? 'Add Merchant' : 'Add Customer'}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(customerData.subscribers.total)}</div>
                <div className="text-xs text-muted-foreground">
                  {customerData.subscribers.active} active, {customerData.subscribers.inactive} inactive
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
                <StoreIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(customerData.merchants.total)}</div>
                <div className="text-xs text-muted-foreground">
                  {customerData.merchants.active} active, {customerData.merchants.inactive} inactive
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
                <HandshakeIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(customerData.partners.total)}</div>
                <div className="text-xs text-muted-foreground">
                  {customerData.partners.active} active, {customerData.partners.inactive} inactive
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customers Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="subscribers" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Subscribers
              </TabsTrigger>
              <TabsTrigger value="merchants" className="flex items-center gap-2">
                <StoreIcon className="h-4 w-4" />
                Merchants
              </TabsTrigger>
              <TabsTrigger value="partners" className="flex items-center gap-2">
                <HandshakeIcon className="h-4 w-4" />
                Partners
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Agents
              </TabsTrigger>
              <TabsTrigger value="superAgents" className="flex items-center gap-2">
                <ShieldIcon className="h-4 w-4" />
                Super Agents
              </TabsTrigger>
              <TabsTrigger value="banks" className="flex items-center gap-2">
                <Building2Icon className="h-4 w-4" />
                Banks
              </TabsTrigger>
            </TabsList>

            {Object.keys(customerData).map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{getTabTitle(tab)}</CardTitle>
                        <CardDescription>
                          Manage {getTabTitle(tab).toLowerCase()} and their information
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <DownloadIcon className="h-4 w-4" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <PlusIcon className="h-4 w-4" />
                          Add {getTabTitle(tab).slice(0, -1)}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Search and Filters */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder={`Search ${getTabTitle(tab).toLowerCase()}...`}
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" className="flex items-center gap-2">
                          <FilterIcon className="h-4 w-4" />
                          Filter
                        </Button>
                      </div>

                      {/* Customers Table */}
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead>Name</TableHead>
                              <TableHead>Contact</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Join Date</TableHead>
                              <TableHead>Last Activity</TableHead>
                              <TableHead>Transactions</TableHead>
                              <TableHead>Volume</TableHead>
                              <TableHead>Location</TableHead>
                              {tab === 'merchants' && <TableHead>Category</TableHead>}
                              {tab === 'partners' && <TableHead>Type</TableHead>}
                              {tab === 'agents' && <TableHead>Commission</TableHead>}
                              {tab === 'superAgents' && <TableHead>Sub Agents</TableHead>}
                              {tab === 'banks' && <TableHead>Bank Type</TableHead>}
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getPaginatedData().map((customer) => (
                              <TableRow key={customer.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{customer.name}</TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-sm">{customer.email}</div>
                                    <div className="text-xs text-gray-500">{customer.phone}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(customer.status)}</TableCell>
                                <TableCell>{formatDate(customer.joinDate)}</TableCell>
                                <TableCell>{formatDate(customer.lastActivity)}</TableCell>
                                <TableCell>{formatNumber(customer.totalTransactions)}</TableCell>
                                <TableCell>{formatCurrency(customer.totalVolume)}</TableCell>
                                <TableCell>{customer.location}</TableCell>
                                {tab === 'merchants' && (
                                  <TableCell>
                                    <Badge variant="outline">{(customer as any).category}</Badge>
                                  </TableCell>
                                )}
                                {tab === 'partners' && (
                                  <TableCell>
                                    <Badge variant="outline">{(customer as any).type}</Badge>
                                  </TableCell>
                                )}
                                {tab === 'agents' && (
                                  <TableCell>
                                    <span className="text-sm font-medium">{(customer as any).commission}%</span>
                                  </TableCell>
                                )}
                                {tab === 'superAgents' && (
                                  <TableCell>
                                    <span className="text-sm font-medium">{(customer as any).subAgents}</span>
                                  </TableCell>
                                )}
                                {tab === 'banks' && (
                                  <TableCell>
                                    <Badge variant="outline">{(customer as any).type}</Badge>
                                  </TableCell>
                                )}
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                                                    <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/customers/${tab}/${customer.id}`)}
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Button>
                                    <Button variant="ghost" size="sm">
                                      <EditIcon className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontalIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, getCurrentData().length)} of {getCurrentData().length} results
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page}
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRightIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default CustomersPage 