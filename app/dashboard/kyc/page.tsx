"use client"

import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Shield,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Building2,
  CreditCard,
  Users,
  Activity,
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Upload,
  Key,
  Lock,
  Bell,
  Settings,
  Database,
  Server,
  Globe,
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
  UserCheck,
  UserX,
  XCircle as XCircleIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
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
  Globe2 as Globe2Icon,
  UserCheck as UserCheckIcon,
  UserX as UserXIcon
} from 'lucide-react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import toast from 'react-hot-toast'

interface KycRequest {
  id: string
  userId: string
  userEmail: string
  userName: string
  userPhone: string
  status: 'pending' | 'approved' | 'rejected' | 'under_review'
  type: 'individual' | 'business'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  documents: {
    id: string
    type: string
    name: string
    status: 'pending' | 'approved' | 'rejected'
    uploadedAt: string
  }[]
  verificationLevel: 'basic' | 'enhanced' | 'premium'
  riskScore: number
  notes?: string
  rejectionReason?: string
  complianceStatus: {
    aml: boolean
    sanctions: boolean
    pep: boolean
    adverse: boolean
  }
  personalInfo: {
    firstName: string
    lastName: string
    dateOfBirth: string
    nationality: string
    address: string
    city: string
    country: string
    postalCode: string
  }
  businessInfo?: {
    companyName: string
    registrationNumber: string
    businessType: string
    industry: string
    address: string
    city: string
    country: string
    postalCode: string
    authorizedSignatory: string
  }
}

const KycPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('submittedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedKyc, setSelectedKyc] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const [showKycDetails, setShowKycDetails] = useState(false)
  const [selectedKycRequest, setSelectedKycRequest] = useState<KycRequest | null>(null)

  // Get permissions
  const { 
    canViewKyc, 
    canApproveKyc, 
    canRejectKyc, 
    canVerifyKyc,
    userRole 
  } = usePermissions()

  // Mock data
  const kycRequests: KycRequest[] = [
    {
      id: '1',
      userId: 'user-1',
      userEmail: 'john.doe@example.com',
      userName: 'John Doe',
      userPhone: '+1234567890',
      status: 'pending',
      type: 'individual',
      submittedAt: '2024-01-20T10:30:00Z',
      documents: [
        {
          id: 'doc-1',
          type: 'passport',
          name: 'passport.pdf',
          status: 'pending',
          uploadedAt: '2024-01-20T10:30:00Z'
        },
        {
          id: 'doc-2',
          type: 'utility_bill',
          name: 'utility_bill.pdf',
          status: 'pending',
          uploadedAt: '2024-01-20T10:30:00Z'
        }
      ],
      verificationLevel: 'enhanced',
      riskScore: 25,
      notes: 'Documents look good, need additional verification',
      complianceStatus: {
        aml: true,
        sanctions: false,
        pep: false,
        adverse: false
      },
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-15',
        nationality: 'US',
        address: '123 Main St',
        city: 'New York',
        country: 'United States',
        postalCode: '10001'
      }
    },
    {
      id: '2',
      userId: 'user-2',
      userEmail: 'jane.smith@company.com',
      userName: 'Jane Smith',
      userPhone: '+1987654321',
      status: 'under_review',
      type: 'business',
      submittedAt: '2024-01-19T14:20:00Z',
      reviewedAt: '2024-01-20T09:15:00Z',
      reviewedBy: 'admin@rukapay.co.ug',
      documents: [
        {
          id: 'doc-3',
          type: 'certificate_of_incorporation',
          name: 'certificate.pdf',
          status: 'approved',
          uploadedAt: '2024-01-19T14:20:00Z'
        },
        {
          id: 'doc-4',
          type: 'bank_statement',
          name: 'bank_statement.pdf',
          status: 'pending',
          uploadedAt: '2024-01-19T14:20:00Z'
        }
      ],
      verificationLevel: 'premium',
      riskScore: 45,
      notes: 'Business verification in progress',
      complianceStatus: {
        aml: true,
        sanctions: true,
        pep: false,
        adverse: false
      },
      personalInfo: {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1985-05-20',
        nationality: 'US',
        address: '456 Business Ave',
        city: 'San Francisco',
        country: 'United States',
        postalCode: '94105'
      },
      businessInfo: {
        companyName: 'Smith Enterprises LLC',
        registrationNumber: 'LLC-123456',
        businessType: 'Technology Services',
        industry: 'Software Development',
        address: '456 Business Ave',
        city: 'San Francisco',
        country: 'United States',
        postalCode: '94105',
        authorizedSignatory: 'Jane Smith'
      }
    },
    {
      id: '3',
      userId: 'user-3',
      userEmail: 'mike.wilson@example.com',
      userName: 'Mike Wilson',
      userPhone: '+1555123456',
      status: 'approved',
      type: 'individual',
      submittedAt: '2024-01-18T16:45:00Z',
      reviewedAt: '2024-01-19T11:30:00Z',
      reviewedBy: 'admin@rukapay.co.ug',
      documents: [
        {
          id: 'doc-5',
          type: 'drivers_license',
          name: 'drivers_license.pdf',
          status: 'approved',
          uploadedAt: '2024-01-18T16:45:00Z'
        },
        {
          id: 'doc-6',
          type: 'bank_statement',
          name: 'bank_statement.pdf',
          status: 'approved',
          uploadedAt: '2024-01-18T16:45:00Z'
        }
      ],
      verificationLevel: 'basic',
      riskScore: 15,
      notes: 'All documents verified successfully',
      complianceStatus: {
        aml: true,
        sanctions: false,
        pep: false,
        adverse: false
      },
      personalInfo: {
        firstName: 'Mike',
        lastName: 'Wilson',
        dateOfBirth: '1988-12-10',
        nationality: 'CA',
        address: '789 Oak St',
        city: 'Toronto',
        country: 'Canada',
        postalCode: 'M5V 3A8'
      }
    },
    {
      id: '4',
      userId: 'user-4',
      userEmail: 'sarah.johnson@example.com',
      userName: 'Sarah Johnson',
      userPhone: '+1444123456',
      status: 'rejected',
      type: 'individual',
      submittedAt: '2024-01-17T12:15:00Z',
      reviewedAt: '2024-01-18T14:20:00Z',
      reviewedBy: 'admin@rukapay.co.ug',
      documents: [
        {
          id: 'doc-7',
          type: 'passport',
          name: 'passport.pdf',
          status: 'rejected',
          uploadedAt: '2024-01-17T12:15:00Z'
        }
      ],
      verificationLevel: 'enhanced',
      riskScore: 75,
      notes: 'Document quality issues',
      rejectionReason: 'Passport image is blurry and unreadable. Please upload a clear, high-resolution image.',
      complianceStatus: {
        aml: false,
        sanctions: false,
        pep: true,
        adverse: false
      },
      personalInfo: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        dateOfBirth: '1992-08-25',
        nationality: 'GB',
        address: '321 Pine St',
        city: 'London',
        country: 'United Kingdom',
        postalCode: 'SW1A 1AA'
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

  const handleSelectKyc = (kycId: string) => {
    setSelectedKyc(prev => 
      prev.includes(kycId) 
        ? prev.filter(id => id !== kycId)
        : [...prev, kycId]
    )
  }

  const handleSelectAll = () => {
    if (selectedKyc.length === filteredKycRequests.length) {
      setSelectedKyc([])
    } else {
      setSelectedKyc(filteredKycRequests.map(k => k.id))
    }
  }

  const handleApproveKyc = async (kycId: string) => {
    setIsLoading(true)
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('KYC request approved successfully')
      // Refresh data or update local state
    } catch (error) {
      toast.error('Failed to approve KYC request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectKyc = async (kycId: string) => {
    setIsLoading(true)
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('KYC request rejected')
      // Refresh data or update local state
    } catch (error) {
      toast.error('Failed to reject KYC request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewKyc = (kyc: KycRequest) => {
    setSelectedKycRequest(kyc)
    setShowKycDetails(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'under_review': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'individual': return 'bg-blue-100 text-blue-800'
      case 'business': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelColor = (score: number) => {
    if (score <= 25) return 'bg-green-100 text-green-800'
    if (score <= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getRiskLevel = (score: number) => {
    if (score <= 25) return 'Low'
    if (score <= 50) return 'Medium'
    return 'High'
  }

  const filteredKycRequests = kycRequests.filter(kyc => {
    const matchesSearch = kyc.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kyc.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         kyc.userPhone.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || kyc.status === statusFilter
    const matchesType = typeFilter === 'all' || kyc.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const sortedKycRequests = [...filteredKycRequests].sort((a, b) => {
    const aValue = a[sortBy as keyof KycRequest]
    const bValue = b[sortBy as keyof KycRequest]
    
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

  const paginatedKycRequests = sortedKycRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(sortedKycRequests.length / itemsPerPage)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <PermissionGuard 
      permission={PERMISSIONS.VIEW_KYC} 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to view KYC requests.</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
              <p className="text-gray-600 mt-2">Review and manage Know Your Customer verification requests</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kycRequests.length}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {kycRequests.filter(k => k.status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requires attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {kycRequests.filter(k => k.status === 'approved').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {kycRequests.filter(k => k.status === 'rejected').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    -5% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>KYC Requests</CardTitle>
                    <CardDescription>
                      Review and manage customer verification requests
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, email, or phone..."
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="under_review">Under Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
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
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
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
                            <SelectItem value="submittedAt">Submitted Date</SelectItem>
                            <SelectItem value="userName">Name</SelectItem>
                            <SelectItem value="userEmail">Email</SelectItem>
                            <SelectItem value="riskScore">Risk Score</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
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
                                checked={selectedKyc.length === filteredKycRequests.length}
                                onChange={handleSelectAll}
                                className="rounded"
                              />
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              User
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              Risk Level
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              Submitted
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              Documents
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedKycRequests.map((kyc) => (
                            <tr key={kyc.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedKyc.includes(kyc.id)}
                                  onChange={() => handleSelectKyc(kyc.id)}
                                  className="rounded"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-600" />
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {kyc.userName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {kyc.userEmail}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {kyc.userPhone}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={getTypeColor(kyc.type)}>
                                  {kyc.type}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={getStatusColor(kyc.status)}>
                                  {kyc.status.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  <Badge className={getRiskLevelColor(kyc.riskScore)}>
                                    {getRiskLevel(kyc.riskScore)}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    ({kyc.riskScore})
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {formatDate(kyc.submittedAt)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-1">
                                  <FileText className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {kyc.documents.length}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewKyc(kyc)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  
                                  {canApproveKyc && kyc.status === 'pending' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleApproveKyc(kyc.id)}
                                      disabled={isLoading}
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  
                                  {canRejectKyc && (kyc.status === 'pending' || kyc.status === 'under_review') && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRejectKyc(kyc.id)}
                                      disabled={isLoading}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
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
                      Showing {paginatedKycRequests.length} of {sortedKycRequests.length} KYC requests
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
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </PermissionGuard>
  )
}

export default KycPage
