"use client"

import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import toast from 'react-hot-toast'
import KycGatingRulesSection from '../../../components/dashboard/kyc/KycGatingRulesSection'

interface PendingKycUser {
  userId: string
  phone?: string
  email?: string
  profile?: {
    firstName?: string
    lastName?: string
    middleName?: string
    subscriberType?: string
    nationalId?: string
    dateOfBirth?: string
    gender?: string
  }
  documents: Array<{
    id: string
    documentType: string
    documentNumber?: string
    documentUrl?: string
    status: string
    createdAt: string
  }>
  submittedAt: string
  // Merchant-specific fields
  isMerchant?: boolean
  displayName?: string
  businessName?: string
  ownerName?: string
  // ✅ Key flag: If true, user's identity is already verified, only need business approval
  userKycApproved?: boolean
  // ✅ Count of pending businesses for this user (when > 1, others will appear in Business Approvals after KYC approved)
  pendingBusinessCount?: number
  otherPendingBusinesses?: Array<{
    merchantId: string
    businessName: string
  }>
  merchantInfo?: {
    merchantId: string
    merchantCode: string
    businessTradeName: string
    registeredBusinessName: string
    businessType: string
    businessCity: string
    businessAddress: string
    certificateOfIncorporation: string
    taxIdentificationNumber: string
    ownerNationalId: string
    ownerFirstName: string
    ownerLastName: string
    ownerMiddleName?: string
    ownerDateOfBirth: string
    ownerGender: string
    bankName: string
    bankAccountName: string
    bankAccountNumber: string
    mobileMoneyNumber?: string
    businessEmail: string
    registeredPhoneNumber: string
    website?: string
    certificateOfIncorporationUrl?: string
    taxRegistrationCertificateUrl?: string
    businessPermitUrl?: string
    bankStatementUrl?: string
    onboardedAt: string
    onboardedBy: string
    onboardingUserRole: string
    onboardingUserEmail: string
    isVerified: boolean
    isActive: boolean
  }
}

interface VerifyKycRequest {
  userId: string
  merchantId?: string // For specific business approval when user has multiple merchants
  status: 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  verificationLevel: 'BASIC' | 'STANDARD' | 'ENHANCED' | 'PREMIUM'
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
  const [showKycDetails, setShowKycDetails] = useState(false)
  const [selectedKycRequest, setSelectedKycRequest] = useState<PendingKycUser | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [pendingApproval, setPendingApproval] = useState<{
    userId: string
    merchantId?: string // For specific business approval
    action: 'approve' | 'reject'
    isBusinessApprovalOnly?: boolean // For users whose KYC is already approved
    otherPendingBusinesses?: Array<{ merchantId: string; businessName: string }> // Other businesses waiting
  } | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [verificationLevel, setVerificationLevel] = useState<'BASIC' | 'STANDARD' | 'ENHANCED' | 'PREMIUM'>('STANDARD')
  // Tab state for KYC, Business Approvals, and Gating Rules
  const [activeTab, setActiveTab] = useState<'kyc' | 'business' | 'gating'>(
    'kyc'
  )

  const queryClient = useQueryClient()

  // Get permissions
  const { 
    canViewKyc, 
    canApproveKyc, 
    canRejectKyc, 
    canVerifyKyc,
    userRole 
  } = usePermissions()

  // Fetch pending KYC requests
  const { 
    data: pendingKycData, 
    isLoading, 
    error,
    refetch 
  } = useQuery<PendingKycUser[]>({
    queryKey: ['admin', 'kyc', 'pending'],
    queryFn: async () => {
      try {
        const response = await api.get('/admin/kyc/pending')
        return response.data || []
      } catch (err: any) {
        // Handle permission errors (403) gracefully
        if (err?.status === 403 || err?.response?.status === 403) {
          console.warn('KYC endpoint requires admin permissions')
          return []
        }
        // Handle not found errors (404) gracefully
        if (err?.status === 404 || err?.response?.status === 404) {
          console.warn('KYC endpoint not found - may not be implemented yet')
          return []
        }
        // Re-throw other errors
        throw err
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on permission errors (403) or not found (404)
      if (error?.status === 403 || error?.status === 404 || 
          error?.response?.status === 403 || error?.response?.status === 404) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: 1000,
  })

  // Approve/Reject KYC mutation
  const verifyKycMutation = useMutation<any, Error, VerifyKycRequest>({
    mutationFn: async (verifyData) => {
      const response = await api.post('/admin/kyc/verify', verifyData)
      return response.data
    },
    onSuccess: (data, variables) => {
      const action = variables.status === 'APPROVED' ? 'approved' : 'rejected'
      toast.success(`KYC request ${action} successfully`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'kyc', 'pending'] })
      setShowApprovalDialog(false)
      setPendingApproval(null)
      setRejectionReason('')
      setVerificationLevel('STANDARD')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process KYC request')
    },
  })

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
      setSelectedKyc(filteredKycRequests.map(k => k.userId))
    }
  }

  const handleApproveKyc = (userId: string, isBusinessApprovalOnly: boolean = false, merchantId?: string, otherPendingBusinesses?: Array<{ merchantId: string; businessName: string }>) => {
    setPendingApproval({ userId, merchantId, action: 'approve', isBusinessApprovalOnly, otherPendingBusinesses })
    setShowApprovalDialog(true)
  }

  const handleRejectKyc = (userId: string, isBusinessApprovalOnly: boolean = false, merchantId?: string, otherPendingBusinesses?: Array<{ merchantId: string; businessName: string }>) => {
    setPendingApproval({ userId, merchantId, action: 'reject', isBusinessApprovalOnly, otherPendingBusinesses })
    setShowApprovalDialog(true)
  }

  const handleConfirmApproval = () => {
    if (!pendingApproval) return

    const verifyData: VerifyKycRequest = {
      userId: pendingApproval.userId,
      merchantId: pendingApproval.merchantId, // Include merchantId for specific business approval
      status: pendingApproval.action === 'approve' ? 'APPROVED' : 'REJECTED',
      // For business-only approvals, use STANDARD by default (user already has a level)
      verificationLevel: pendingApproval.isBusinessApprovalOnly ? 'STANDARD' : verificationLevel,
    }

    if (pendingApproval.action === 'reject' && rejectionReason.trim()) {
      verifyData.rejectionReason = rejectionReason.trim()
    }

    verifyKycMutation.mutate(verifyData)
  }

  const handleViewKyc = (kyc: PendingKycUser) => {
    setSelectedKycRequest(kyc)
    setShowKycDetails(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INDIVIDUAL': return 'bg-blue-100 text-blue-800'
      case 'MERCHANT': return 'bg-purple-100 text-purple-800'
      case 'AGENT': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const pendingKycRequests = pendingKycData || []

  // Separate requests into KYC (new users) and Business Approvals (verified users adding new business)
  const pendingKycOnly = pendingKycRequests.filter(kyc => !kyc.userKycApproved)
  const pendingBusinessApprovals = pendingKycRequests.filter(kyc => kyc.userKycApproved)

  // Get the active list based on tab
  const activeList = activeTab === 'kyc' ? pendingKycOnly : pendingBusinessApprovals

  const filteredKycRequests = activeList.filter(kyc => {
    const userName = `${kyc.profile?.firstName || ''} ${kyc.profile?.lastName || ''}`.trim()
    const businessName = kyc.businessName || kyc.displayName || ''
    const ownerName = kyc.ownerName || ''
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (kyc.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (kyc.phone || '').includes(searchTerm)
    
    const matchesType = typeFilter === 'all' || kyc.profile?.subscriberType === typeFilter
    
    return matchesSearch && matchesType
  })

  const sortedKycRequests = [...filteredKycRequests].sort((a, b) => {
    if (sortBy === 'submittedAt') {
      const aDate = new Date(a.submittedAt).getTime()
      const bDate = new Date(b.submittedAt).getTime()
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate
    }
    
    if (sortBy === 'userName') {
      const aName = `${a.profile?.firstName || ''} ${a.profile?.lastName || ''}`.trim()
      const bName = `${b.profile?.firstName || ''} ${b.profile?.lastName || ''}`.trim()
      return sortOrder === 'asc' 
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName)
    }
    
    return 0
  })

  const paginatedKycRequests = sortedKycRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(sortedKycRequests.length / itemsPerPage)

  if (!canViewKyc) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to view KYC requests.</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle errors - but allow empty data to show empty state instead of error
  const errorStatus = (error as any)?.status || (error as any)?.response?.status
  const isPermissionError = errorStatus === 403
  const isNotFoundError = errorStatus === 404
  
  // Only show error screen for non-permission/not-found errors
  if (error && !isPermissionError && !isNotFoundError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading KYC Data</h1>
            <p className="text-gray-600 mb-4">
              {(error as any)?.message || (error as any)?.data?.message || 'Failed to load KYC requests. Please try again.'}
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="px-4 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
              <p className="text-gray-600 mt-2">Review and manage Know Your Customer verification requests</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-1 mb-4">
              <Card>
                <CardContent className="px-4 py-1">
                  <div className="flex items-center justify-between mb-0">
                    <p className="text-sm font-medium text-gray-600 mb-0">Pending Requests</p>
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900 leading-tight">{pendingKycRequests.length}</p>
                  <div className="mt-0">
                    <span className="text-sm text-gray-500">Requires attention</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-4 py-1">
                  <div className="flex items-center justify-between mb-0">
                    <p className="text-sm font-medium text-gray-600 mb-0">Individuals</p>
                    <div className="w-8 h-8 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900 leading-tight">
                    {pendingKycOnly.filter(k => !k.isMerchant).length}
                  </p>
                  <div className="mt-0">
                    <span className="text-sm text-gray-500">Individual users</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-4 py-1">
                  <div className="flex items-center justify-between mb-0">
                    <p className="text-sm font-medium text-gray-600 mb-0">Merchants</p>
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900 leading-tight">
                    {pendingKycOnly.filter(k => k.isMerchant).length}
                  </p>
                  <div className="mt-0">
                    <span className="text-sm text-gray-500">New business accounts</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="px-4 py-1">
                  <div className="flex items-center justify-between mb-0">
                    <p className="text-sm font-medium text-gray-600 mb-0">Agents</p>
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900 leading-tight">
                    {pendingBusinessApprovals.length}
                  </p>
                  <div className="mt-0">
                    <span className="text-sm text-gray-500">Business approvals</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {activeTab === 'kyc'
                        ? 'Pending KYC Requests'
                        : activeTab === 'business'
                        ? 'Pending Business Approvals'
                        : 'KYC Gating Rules'}
                    </CardTitle>
                    <CardDescription>
                      {activeTab === 'kyc'
                        ? 'Review and approve new user identity verification submissions'
                        : activeTab === 'business'
                        ? 'Approve new businesses from users whose identity is already verified'
                        : 'Define minimum KYC requirements for products and actions.'}
                    </CardDescription>
                  </div>
                  {activeTab !== 'gating' && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                      >
                        <RefreshCw
                          className={`h-4 w-4 mr-2 ${
                            isLoading ? 'animate-spin' : ''
                          }`}
                        />
                        Refresh
                      </Button>
                    </div>
                  )}
                </div>
                {/* Tab navigation */}
                <div className="flex space-x-1 mt-4 border-b">
                  <button
                    onClick={() => { setActiveTab('kyc'); setCurrentPage(1); }}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === 'kyc'
                        ? 'bg-white border border-b-0 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Fingerprint className="h-4 w-4" />
                      New KYC ({pendingKycOnly.length})
                    </div>
                  </button>
                  <button
                    onClick={() => { setActiveTab('business'); setCurrentPage(1); }}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === 'business'
                        ? 'bg-white border border-b-0 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Business Approvals ({pendingBusinessApprovals.length})
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('gating')
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === 'gating'
                        ? 'bg-white border border-b-0 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Gating Rules
                    </div>
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === 'gating' ? (
                  <KycGatingRulesSection />
                ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex flex-row gap-[1]">
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
                        <label className="text-sm font-medium">Type</label>
                        <Select value={typeFilter} onValueChange={handleTypeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                            <SelectItem value="MERCHANT">Merchant</SelectItem>
                            <SelectItem value="AGENT">Agent</SelectItem>
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
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      <span>Loading KYC requests...</span>
                    </div>
                  ) : paginatedKycRequests.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-2">
                        {isPermissionError 
                          ? 'You don\'t have permission to view KYC requests. Please contact an administrator.'
                          : isNotFoundError
                          ? 'KYC endpoint is not available. This feature may not be implemented yet.'
                          : 'No pending KYC requests found.'
                        }
                      </p>
                      {!isPermissionError && !isNotFoundError && (
                        <Button variant="outline" onClick={() => refetch()} className="mt-4">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[40px]">
                                <input
                                  type="checkbox"
                                  checked={selectedKyc.length === filteredKycRequests.length}
                                  onChange={handleSelectAll}
                                  className="rounded"
                                />
                              </TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>National ID</TableHead>
                              <TableHead>Submitted</TableHead>
                              <TableHead>Documents</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedKycRequests.map((kyc) => (
                              <TableRow key={kyc.merchantInfo?.merchantId || kyc.userId}>
                                <TableCell className="w-[40px]">
                                  <input
                                    type="checkbox"
                                    checked={selectedKyc.includes(kyc.userId)}
                                    onChange={() => handleSelectKyc(kyc.userId)}
                                    className="rounded"
                                  />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center">
                                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                        kyc.userKycApproved ? 'bg-green-100' : 'bg-gray-200'
                                      }`}>
                                        {kyc.isMerchant ? (
                                          <Building2 className={`h-4 w-4 ${kyc.userKycApproved ? 'text-green-600' : 'text-blue-600'}`} />
                                        ) : (
                                          <User className="h-4 w-4 text-gray-600" />
                                        )}
                                      </div>
                                      <div className="ml-3">
                                        <div className="text-sm font-medium text-gray-900">
                                          {kyc.isMerchant ? (
                                            // For merchants: Show business name
                                            <div>
                                              <div className="font-semibold flex items-center gap-2">
                                                {kyc.displayName || kyc.businessName || 'N/A'}
                                                {kyc.userKycApproved && (
                                                  <Badge className="bg-green-100 text-green-700 text-xs">
                                                    <ShieldCheck className="h-3 w-3 mr-1" />
                                                    KYC Verified
                                                  </Badge>
                                                )}
                                                {/* Show badge if user has multiple pending businesses */}
                                                {(kyc.pendingBusinessCount ?? 0) > 1 && !kyc.userKycApproved && (
                                                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                                                    +{(kyc.pendingBusinessCount ?? 1) - 1} more
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="text-xs text-gray-500 font-normal">
                                                Owner: {kyc.ownerName || 'N/A'}
                                              </div>
                                              {/* Show other pending businesses if any */}
                                              {kyc.otherPendingBusinesses && kyc.otherPendingBusinesses.length > 0 && (
                                                <div className="text-xs text-blue-600 mt-1">
                                                  Also: {kyc.otherPendingBusinesses.map(b => b.businessName).join(', ')}
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            // For individuals: Show user name
                                            `${kyc.profile?.firstName || ''} ${kyc.profile?.lastName || ''}`.trim() || 'N/A'
                                          )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {kyc.email || kyc.merchantInfo?.businessEmail || 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                          {kyc.phone || kyc.merchantInfo?.registeredPhoneNumber || 'N/A'}
                                        </div>
                                      </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getTypeColor(kyc.isMerchant ? 'MERCHANT' : (kyc.profile?.subscriberType || ''))}>
                                    {kyc.isMerchant ? 'Merchant' : (kyc.profile?.subscriberType || 'Unknown')}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {kyc.isMerchant ? (
                                    kyc.merchantInfo?.ownerNationalId || 'N/A'
                                  ) : (
                                    kyc.profile?.nationalId || 'N/A'
                                  )}
                                </TableCell>
                                <TableCell>
                                  {formatDate(kyc.submittedAt)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-1">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {kyc.documents.length}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewKyc(kyc)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      
                                      {canApproveKyc && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleApproveKyc(kyc.userId, kyc.userKycApproved || false, kyc.merchantInfo?.merchantId, kyc.otherPendingBusinesses)}
                                          disabled={verifyKycMutation.isPending}
                                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                        </Button>
                                      )}
                                      
                                      {canRejectKyc && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleRejectKyc(kyc.userId, kyc.userKycApproved || false, kyc.merchantInfo?.merchantId, kyc.otherPendingBusinesses)}
                                          disabled={verifyKycMutation.isPending}
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
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
                    </>
                  )}
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Approval/Rejection Dialog */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {pendingApproval?.isBusinessApprovalOnly 
                  ? (pendingApproval?.action === 'approve' ? 'Approve Business' : 'Reject Business')
                  : (pendingApproval?.action === 'approve' ? 'Approve KYC Request' : 'Reject KYC Request')
                }
              </DialogTitle>
              <DialogDescription>
                {pendingApproval?.isBusinessApprovalOnly ? (
                  pendingApproval?.action === 'approve'
                    ? 'This user\'s identity is already verified. Approve this new business to activate it.'
                    : 'Please provide a reason for rejecting this business application.'
                ) : (
                  pendingApproval?.action === 'approve' 
                    ? 'Please select the verification level for this user.'
                    : 'Please provide a reason for rejecting this KYC request.'
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {pendingApproval?.isBusinessApprovalOnly && pendingApproval?.action === 'approve' ? (
                // Business-only approval: No verification level needed
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-medium">User identity already verified</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    The user&apos;s KYC has been previously approved. This approval will only activate the new business.
                  </p>
                </div>
              ) : pendingApproval?.action === 'approve' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Verification Level</label>
                    <Select value={verificationLevel} onValueChange={(value: any) => setVerificationLevel(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="STANDARD">Standard</SelectItem>
                        <SelectItem value="ENHANCED">Enhanced</SelectItem>
                        <SelectItem value="PREMIUM">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Show info about other pending businesses */}
                  {pendingApproval?.otherPendingBusinesses && pendingApproval.otherPendingBusinesses.length > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800 mb-2">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          This user has {pendingApproval.otherPendingBusinesses.length} more pending business(es)
                        </span>
                      </div>
                      <ul className="text-xs text-blue-700 ml-6 list-disc">
                        {pendingApproval.otherPendingBusinesses.map(b => (
                          <li key={b.merchantId}>{b.businessName}</li>
                        ))}
                      </ul>
                      <p className="text-xs text-blue-600 mt-2">
                        After approving this KYC, the other businesses will appear in the &quot;Business Approvals&quot; tab for individual approval.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium">Rejection Reason</label>
                  <Textarea
                    placeholder={pendingApproval?.isBusinessApprovalOnly 
                      ? "Please explain why this business application is being rejected..."
                      : "Please explain why this KYC request is being rejected..."
                    }
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApprovalDialog(false)
                    setPendingApproval(null)
                    setRejectionReason('')
                    setVerificationLevel('STANDARD')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmApproval}
                  disabled={
                    verifyKycMutation.isPending ||
                    (pendingApproval?.action === 'reject' && !rejectionReason.trim())
                  }
                  className={
                    pendingApproval?.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }
                >
                  {verifyKycMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    pendingApproval?.action === 'approve' 
                      ? (pendingApproval?.isBusinessApprovalOnly ? 'Approve Business' : 'Approve')
                      : (pendingApproval?.isBusinessApprovalOnly ? 'Reject Business' : 'Reject')
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* KYC Details Dialog */}
        <Dialog open={showKycDetails} onOpenChange={setShowKycDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedKycRequest?.isMerchant ? (
                  <>
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Merchant KYC Request Details
                  </>
                ) : (
                  <>
                    <User className="h-5 w-5 text-gray-600" />
                    KYC Request Details
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedKycRequest?.isMerchant 
                  ? 'Review the complete merchant KYC submission for this business'
                  : 'Review the complete KYC submission for this user'}
              </DialogDescription>
            </DialogHeader>
            
            {selectedKycRequest && (
              <div className="space-y-6">
                {/* Merchant or Individual Information */}
                {selectedKycRequest.isMerchant && selectedKycRequest.merchantInfo ? (
                  <>
                    {/* Business Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Business Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Business Trade Name</label>
                          <p className="text-sm font-semibold">{selectedKycRequest.merchantInfo.businessTradeName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Registered Business Name</label>
                          <p className="text-sm">{selectedKycRequest.merchantInfo.registeredBusinessName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Business Type</label>
                          <p className="text-sm">{selectedKycRequest.merchantInfo.businessType.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Merchant Code</label>
                          <p className="text-sm font-mono">{selectedKycRequest.merchantInfo.merchantCode}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Certificate of Incorporation</label>
                          <p className="text-sm">{selectedKycRequest.merchantInfo.certificateOfIncorporation}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Tax Identification Number</label>
                          <p className="text-sm">{selectedKycRequest.merchantInfo.taxIdentificationNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Business Email</label>
                          <p className="text-sm">{selectedKycRequest.merchantInfo.businessEmail}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Registered Phone</label>
                          <p className="text-sm">{selectedKycRequest.merchantInfo.registeredPhoneNumber}</p>
                        </div>
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-500">Business Address</label>
                          <p className="text-sm">{selectedKycRequest.merchantInfo.businessAddress}, {selectedKycRequest.merchantInfo.businessCity}</p>
                        </div>
                        {selectedKycRequest.merchantInfo.website && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Website</label>
                            <p className="text-sm">{selectedKycRequest.merchantInfo.website}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-500">Submitted At</label>
                          <p className="text-sm">{formatDate(selectedKycRequest.submittedAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Owner Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Business Owner Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Owner Name</label>
                          <p className="text-sm">
                            {`${selectedKycRequest.merchantInfo.ownerFirstName} ${selectedKycRequest.merchantInfo.ownerMiddleName || ''} ${selectedKycRequest.merchantInfo.ownerLastName}`.trim()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Owner National ID</label>
                          <p className="text-sm">{selectedKycRequest.merchantInfo.ownerNationalId}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                          <p className="text-sm">{selectedKycRequest.merchantInfo.ownerDateOfBirth}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Gender</label>
                          <p className="text-sm">{selectedKycRequest.merchantInfo.ownerGender}</p>
                        </div>
                      </div>
                    </div>

                    {/* Financial Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Financial Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Bank Name</label>
                          <p className="text-sm">{selectedKycRequest.merchantInfo.bankName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Account Name</label>
                          <p className="text-sm">{selectedKycRequest.merchantInfo.bankAccountName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Account Number</label>
                          <p className="text-sm font-mono">{selectedKycRequest.merchantInfo.bankAccountNumber}</p>
                        </div>
                        {selectedKycRequest.merchantInfo.mobileMoneyNumber && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Mobile Money Number</label>
                            <p className="text-sm">{selectedKycRequest.merchantInfo.mobileMoneyNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Individual Information */
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-sm">
                          {`${selectedKycRequest.profile?.firstName || ''} ${selectedKycRequest.profile?.middleName || ''} ${selectedKycRequest.profile?.lastName || ''}`.trim() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm">{selectedKycRequest.email || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-sm">{selectedKycRequest.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">National ID</label>
                        <p className="text-sm">{selectedKycRequest.profile?.nationalId || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                        <p className="text-sm">{selectedKycRequest.profile?.dateOfBirth || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Gender</label>
                        <p className="text-sm">{selectedKycRequest.profile?.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">User Type</label>
                        <Badge className={getTypeColor(selectedKycRequest.profile?.subscriberType || '')}>
                          {selectedKycRequest.profile?.subscriberType || 'Unknown'}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Submitted At</label>
                        <p className="text-sm">{formatDate(selectedKycRequest.submittedAt)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Submitted Documents</h3>
                  <div className="space-y-2">
                    {selectedKycRequest.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{doc.documentType.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500">
                              {doc.documentNumber && `Number: ${doc.documentNumber}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {formatDate(doc.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                          {doc.documentUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.documentUrl, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  )
}

export default KycPage
