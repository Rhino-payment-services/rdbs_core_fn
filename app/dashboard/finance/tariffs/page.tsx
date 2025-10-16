"use client"
import React, { useState, useEffect } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Calculator,
  CreditCard,
  Smartphone,
  Building2,
  Zap,
  DollarSign,
  Eye,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  Store,
  ArrowDownLeft,
  Undo2,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApproveTariff, useRejectTariff, useSubmitTariffForApproval } from '@/lib/hooks/useTariffs'
import { useAuth } from '@/lib/hooks/useAuth'
import api from '@/lib/axios'

interface Tariff {
  id: string
  name: string
  description: string
  tariffType: 'INTERNAL' | 'EXTERNAL'
  transactionType: string
  currency: string
  feeType: 'FIXED' | 'PERCENTAGE' | 'HYBRID'
  feeAmount: number
  feePercentage: number
  minFee: number
  maxFee: number
  minAmount: number
  maxAmount: number
  userType: 'STAFF' | 'SUBSCRIBER' | 'MERCHANT'
  subscriberType: 'INDIVIDUAL' | 'BUSINESS' | null
  partnerId?: string
  group?: string // Tariff group (G1, G2, G3) for partner-specific amount ranges
  partner?: {
    partnerName: string
    partnerCode: string
  }
  isActive?: boolean
  // Approval workflow fields
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'DRAFT'
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvalNotes?: string
  approvedBy?: string
  approvedById?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedById?: string
  rejectedAt?: string
  submittedForApprovalAt?: string
  submittedBy?: string
  submittedById?: string
  createdBy?: string
  createdById?: string
  updatedBy?: string
  updatedById?: string
  createdAt?: string
  updatedAt?: string
  partnerFee?: number // Partner fee amount for external tariffs
  rukapayFee?: number // RukaPay fee amount for external tariffs
  telecomBankCharge?: number // Telecom/Bank charge (optional)
  governmentTax?: number
}

interface Partner {
  id: string
  name: string
  status: string
  type: string
}

const TariffsPage = () => {
  const router = useRouter()
  const [activeMainTab, setActiveMainTab] = useState('internal')
  const [activeInternalTab, setActiveInternalTab] = useState('')
  const [activeExternalTab, setActiveExternalTab] = useState('')
  const [selectedPartner, setSelectedPartner] = useState("ABC") // Default to ABC
  const [isLoading, setIsLoading] = useState(false)
  
  // Approval workflow state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [selectedTariff, setSelectedTariff] = useState<Tariff | null>(null)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')
  
  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewTariff, setViewTariff] = useState<Tariff | null>(null)
  
  const { hasPermission, userRole } = usePermissions()
  const { user } = useAuth()
  const canManageTariffs = hasPermission(PERMISSIONS.TARIFFS_CREATE) || hasPermission(PERMISSIONS.TARIFFS_UPDATE) || hasPermission(PERMISSIONS.TARIFFS_DELETE) || userRole === 'SUPER_ADMIN'
  const canApproveTariffs = hasPermission(PERMISSIONS.TARIFFS_APPROVE) || hasPermission(PERMISSIONS.TARIFFS_REJECT) || userRole === 'SUPER_ADMIN'
  
  // Fetch tariffs from API
  const { data: tariffsData, isLoading: tariffsLoading, error: tariffsError, refetch } = useQuery({
    queryKey: ['tariffs'],
    queryFn: () => api.get('/finance/tariffs').then(res => res.data),
    staleTime: 5 * 60 * 1000,
  })

  // Approval workflow mutations
  const approveTariffMutation = useApproveTariff()
  const rejectTariffMutation = useRejectTariff()
  const submitForApprovalMutation = useSubmitTariffForApproval()

  // Internal transaction types (RukaPay internal operations)
  const internalTransactionTypes = {
    'WALLET_TO_INTERNAL_MERCHANT': {
      name: 'Wallet to Internal Merchant',
      description: 'Payments to RukaPay registered merchants',
      icon: Store,
      color: 'bg-indigo-500',
      tabId: 'wallet-to-internal-merchant'
    },
    'WALLET_TO_WALLET': {
      name: 'Wallet to Wallet',
      description: 'RukaPay to RukaPay transfers',
      icon: CreditCard,
      color: 'bg-blue-500',
      tabId: 'wallet-to-wallet'
    },
    'TRANSFER_IN': {
      name: 'Transfer In',
      description: 'Incoming transfers',
      icon: ArrowDownLeft,
      color: 'bg-green-600',
      tabId: 'transfer-in'
    },
    'REFUND': {
      name: 'Refund',
      description: 'Transaction refunds',
      icon: Undo2,
      color: 'bg-orange-500',
      tabId: 'refund'
    },
    'ADJUSTMENT': {
      name: 'Adjustment',
      description: 'Balance adjustments',
      icon: Settings,
      color: 'bg-gray-500',
      tabId: 'adjustment'
    },
    'FEE_CHARGE': {
      name: 'Fee Charge',
      description: 'Transaction fee charges',
      icon: DollarSign,
      color: 'bg-purple-500',
      tabId: 'fee-charge'
    }
  }

  // External transaction types (Partner integrations)
  const externalTransactionTypes = {
    'WITHDRAWAL': {
      name: 'Wallet to Mobile',
      description: 'RukaPay to MTN/AIRTEL via partners',
      icon: Smartphone,
      color: 'bg-green-500',
      tabId: 'wallet-to-mobile'
    },
    'WALLET_TO_EXTERNAL_MERCHANT': {
      name: 'Wallet to External Merchant',
      description: 'Payments to external merchants via partners',
      icon: Building2,
      color: 'bg-purple-500',
      tabId: 'wallet-to-external-merchant'
    },
    'DEPOSIT': {
      name: 'Wallet to Bank',
      description: 'RukaPay to Bank transfers via partners',
      icon: Building2,
      color: 'bg-orange-500',
      tabId: 'wallet-to-bank'
    },
    'BILL_PAYMENT': {
      name: 'Bill Payment',
      description: 'School fees, Utility bills via partners',
      icon: Zap,
      color: 'bg-purple-600',
      tabId: 'bill-payment'
    },
    'MERCHANT_WITHDRAWAL': {
      name: 'Merchant Withdrawal',
      description: 'Merchants withdrawing to bank/MNO via partners',
      icon: DollarSign,
      color: 'bg-amber-600',
      tabId: 'merchant-withdrawal'
    }
  }

  // Get tariffs from API response
  const allTariffs = tariffsData?.tariffs || []
  
  // Separate internal and external tariffs
  const internalTariffs = allTariffs.filter((t: Tariff) => t.tariffType === 'INTERNAL')
  const externalTariffs = allTariffs.filter((t: Tariff) => t.tariffType === 'EXTERNAL')
  
  // Group internal tariffs by transaction type
  const internalGroupedTariffs = {
    'WALLET_TO_INTERNAL_MERCHANT': internalTariffs.filter((t: Tariff) => t.transactionType === 'WALLET_TO_INTERNAL_MERCHANT'),
    'WALLET_TO_WALLET': internalTariffs.filter((t: Tariff) => t.transactionType === 'WALLET_TO_WALLET' || t.transactionType === 'TRANSFER_OUT'),
    'TRANSFER_IN': internalTariffs.filter((t: Tariff) => t.transactionType === 'TRANSFER_IN'),
    'REFUND': internalTariffs.filter((t: Tariff) => t.transactionType === 'REFUND'),
    'ADJUSTMENT': internalTariffs.filter((t: Tariff) => t.transactionType === 'ADJUSTMENT'),
    'FEE_CHARGE': internalTariffs.filter((t: Tariff) => t.transactionType === 'FEE_CHARGE'),
  }
  
  // Group external tariffs by transaction type
  const externalGroupedTariffs = {
    'WITHDRAWAL': externalTariffs.filter((t: Tariff) => t.transactionType === 'WITHDRAWAL'),
    'WALLET_TO_EXTERNAL_MERCHANT': externalTariffs.filter((t: Tariff) => t.transactionType === 'WALLET_TO_EXTERNAL_MERCHANT'),
    'DEPOSIT': externalTariffs.filter((t: Tariff) => t.transactionType === 'DEPOSIT'),
    'BILL_PAYMENT': externalTariffs.filter((t: Tariff) => t.transactionType === 'BILL_PAYMENT'),
    'MERCHANT_WITHDRAWAL': externalTariffs.filter((t: Tariff) => t.transactionType === 'MERCHANT_WITHDRAWAL'),
  }

  // Get available transaction types from actual data
  const availableInternalTypes = Object.keys(internalTransactionTypes).filter(type => 
    internalGroupedTariffs[type as keyof typeof internalGroupedTariffs].length > 0
  )
  
  const availableExternalTypes = Object.keys(externalTransactionTypes).filter(type => 
    externalGroupedTariffs[type as keyof typeof externalGroupedTariffs].length > 0
  )

  // Set initial active tabs when data loads
  useEffect(() => {
    if (availableInternalTypes.length > 0 && !activeInternalTab) {
      const firstInternalType = internalTransactionTypes[availableInternalTypes[0] as keyof typeof internalTransactionTypes]
      if (firstInternalType) {
        setActiveInternalTab(firstInternalType.tabId)
      }
    }
    if (availableExternalTypes.length > 0 && !activeExternalTab) {
      const firstExternalType = externalTransactionTypes[availableExternalTypes[0] as keyof typeof externalTransactionTypes]
      if (firstExternalType) {
        setActiveExternalTab(firstExternalType.tabId)
      }
    }
  }, [availableInternalTypes, availableExternalTypes, activeInternalTab, activeExternalTab])

  const handleDeleteTariff = async (tariffId: string) => {
    if (!window.confirm('Are you sure you want to delete this tariff?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/finance/tariffs/${tariffId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('Tariff deleted successfully')
        refetch() // Refresh the data
      } else {
        throw new Error('Failed to delete tariff')
      }
    } catch (error) {
      toast.error('Failed to delete tariff')
    } finally {
      setIsLoading(false)
    }
  }

  const formatFeeAmount = (tariff: Tariff) => {
    if (tariff.feeType === 'FIXED') {
      return `${tariff.feeAmount} ${tariff.currency}`
    } else if (tariff.feeType === 'PERCENTAGE') {
      return `${(tariff.feePercentage * 100).toFixed(2)}%`
    } else if (tariff.feeType === 'HYBRID') {
      return `${tariff.feeAmount} ${tariff.currency} + ${(tariff.feePercentage * 100).toFixed(2)}%`
    }
    return 'N/A'
  }

  const getAmountRange = (tariff: Tariff) => {
    if (tariff.minAmount && tariff.maxAmount) {
      return `${tariff.minAmount.toLocaleString()} - ${tariff.maxAmount.toLocaleString()} ${tariff.currency}`
    } else if (tariff.minAmount) {
      return `Above ${tariff.minAmount.toLocaleString()} ${tariff.currency}`
    } else if (tariff.maxAmount) {
      return `Below ${tariff.maxAmount.toLocaleString()} ${tariff.currency}`
    }
    return 'No limit'
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await refetch()
      toast.success('Tariffs refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh tariffs')
    } finally {
      setIsLoading(false)
    }
  }

  // Approval workflow functions
  const handleApprovalAction = (tariff: Tariff, action: 'approve' | 'reject') => {
    setSelectedTariff(tariff)
    setApprovalAction(action)
    setApprovalNotes('')
    setApprovalDialogOpen(true)
  }

  const handleSubmitApproval = async () => {
    if (!selectedTariff || !approvalAction) return

    try {
      if (approvalAction === 'approve') {
        await approveTariffMutation.mutateAsync({
          id: selectedTariff.id,
          notes: approvalNotes || undefined
        })
        toast.success('Tariff approved successfully')
      } else {
        if (!approvalNotes.trim()) {
          toast.error('Rejection reason is required')
          return
        }
        await rejectTariffMutation.mutateAsync({
          id: selectedTariff.id,
          notes: approvalNotes
        })
        toast.success('Tariff rejected successfully')
      }
      
      setApprovalDialogOpen(false)
      setSelectedTariff(null)
      setApprovalAction(null)
      setApprovalNotes('')
      refetch() // Refresh the data
    } catch (error) {
      toast.error(`Failed to ${approvalAction} tariff`)
    }
  }

  const handleSubmitForApproval = async (tariffId: string) => {
    try {
      await submitForApprovalMutation.mutateAsync(tariffId)
      toast.success('Tariff submitted for approval')
      refetch() // Refresh the data
    } catch (error) {
      toast.error('Failed to submit tariff for approval')
    }
  }

  const renderStatusBadge = (tariff: Tariff) => {
    // For existing tariffs without approval workflow fields, check isActive
    if (!tariff.status && !tariff.approvalStatus) {
      const status = tariff.isActive ? 'ACTIVE' : 'INACTIVE'
      return (
        <Badge variant={tariff.isActive ? "default" : "secondary"} className={tariff.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
          {tariff.isActive ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Inactive
            </>
          )}
        </Badge>
      )
    }
    
    const status = tariff.status || tariff.approvalStatus
    
    switch (status as any) {
      case 'ACTIVE':
      case 'APPROVED':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case 'PENDING_APPROVAL':
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      case 'DRAFT':
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            <FileText className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        )
    }
  }

  const TariffTable = ({ type, tariffs }: { type: string, tariffs: Tariff[] }) => {
    // Check both internal and external transaction types
    const config = internalTransactionTypes[type as keyof typeof internalTransactionTypes] || 
                  externalTransactionTypes[type as keyof typeof externalTransactionTypes]
    if (!config) return null

    // Check if this is an internal tariff type
    const isInternalTariff = tariffs.length > 0 && tariffs[0].tariffType === 'INTERNAL'

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 mb-6">
          <div className={`w-12 h-12 ${config.color} rounded-xl flex items-center justify-center`}>
            <config.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">{config.name}</h3>
            <p className="text-gray-600">{config.description}</p>
          </div>
        </div>
        
        {tariffs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">No tariffs configured for this transaction type</p>
              {canManageTariffs && (
                <Button className="mt-4" onClick={() => router.push('/dashboard/finance/tariffs/create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tariff
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Fee Amount</TableHead>
                  <TableHead>Amount Range</TableHead>
                  <TableHead>Transaction Type</TableHead>
                  {!isInternalTariff && <TableHead>Partner</TableHead>}
                  {!isInternalTariff && <TableHead>Group</TableHead>}
                  {!isInternalTariff && <TableHead>Partner Fee</TableHead>}
                  {!isInternalTariff && <TableHead>RukaPay Fee</TableHead>}
                  {!isInternalTariff && <TableHead>Telecom/Bank Charge</TableHead>}
                  {!isInternalTariff && <TableHead>Government Tax</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tariffs.map((tariff) => (
                  <TableRow key={tariff.id}>
                    <TableCell className="font-medium">{tariff.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {tariff.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tariff.feeType}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {tariff.feeAmount} {tariff.currency}
                    </TableCell>
                    <TableCell className="text-sm">
                      {tariff.minAmount && tariff.maxAmount 
                        ? `${tariff.minAmount} - ${tariff.maxAmount} ${tariff.currency}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-sm">
                      {tariff.userType && tariff.subscriberType 
                        ? `${tariff.userType} • ${tariff.subscriberType}`
                        : tariff.userType || '-'
                      }
                    </TableCell>
                    {!isInternalTariff && (
                      <TableCell>
                        {tariff.partner ? (
                          <Badge variant="outline">{tariff.partner.partnerCode}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    )}
                    {!isInternalTariff && (
                      <TableCell>
                        {tariff.group ? (
                          <Badge variant="outline">{tariff.group}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    )}
                    {!isInternalTariff && (
                      <TableCell className="text-sm">
                        {tariff.partnerFee ? (
                          <span className="font-medium">{tariff.partnerFee} {tariff.currency}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    )}
                    {!isInternalTariff && (
                      <TableCell className="text-sm">
                        {tariff.rukapayFee ? (
                          <span className="font-medium">{tariff.rukapayFee} {tariff.currency}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    )}
                    {!isInternalTariff && (
                      <TableCell className="text-sm">
                        {tariff.telecomBankCharge ? (
                          <span className="font-medium">{tariff.telecomBankCharge} {tariff.currency}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    )}
                    {!isInternalTariff && (
                      <TableCell className="text-sm">
                        {tariff.governmentTax ? (
                          <span className="font-medium">{tariff.governmentTax}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {renderStatusBadge(tariff)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setViewTariff(tariff)
                            setViewModalOpen(true)
                          }}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* Approval Actions - Only show for users with approval permissions who are NOT the maker */}
                        {canApproveTariffs && 
                         (tariff.status === 'PENDING_APPROVAL' || tariff.approvalStatus === 'PENDING') && 
                         user?.id !== tariff.createdById && 
                         user?.id !== tariff.submittedById && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprovalAction(tariff, 'approve')}
                              className="text-green-600 hover:text-green-700"
                              title="Approve Tariff"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprovalAction(tariff, 'reject')}
                              className="text-red-600 hover:text-red-700"
                              title="Reject Tariff"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        
                        {/* Management Actions - Only show for users with management permissions */}
                        {canManageTariffs && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/finance/tariffs/edit/${tariff.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            {/* Submit for Approval - Only show for draft tariffs */}
                            {(tariff.status === 'DRAFT' || !tariff.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSubmitForApproval(tariff.id)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Submit for Approval"
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTariff(tariff.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }

  if (tariffsError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Tariffs</h1>
                <p className="text-gray-600 mb-4">Unable to retrieve tariff data from the server.</p>
                <Button onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/dashboard/finance" className="hover:text-[#08163d]">
                Finance
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium">Tariffs</span>
            </nav>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard/finance">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Finance
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Tariff Management</h1>
                  <p className="text-gray-600">Manage transaction fees and charges across partners & payment types</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/finance/partners')}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Partners
                </Button>
                {canManageTariffs && (
                  <Button onClick={() => router.push('/dashboard/finance/tariffs/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tariff
                  </Button>
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tariff Management</h1>
            <p className="text-gray-600">Manage transaction fees and charges for different payment types</p>
          </div>

          {/* Main Tabs for Internal vs External */}
          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="internal" className="flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>Internal Tariffs ({internalTariffs.length})</span>
              </TabsTrigger>
              <TabsTrigger value="external" className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>External Tariffs ({externalTariffs.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* Internal Tariffs Tab */}
            <TabsContent value="internal">
              {tariffsLoading ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading internal tariffs...</p>
                  </CardContent>
                </Card>
              ) : availableInternalTypes.length > 0 ? (
                <Tabs value={activeInternalTab} onValueChange={setActiveInternalTab} className="space-y-6">
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableInternalTypes.length}, 1fr)` }}>
                    {availableInternalTypes.map((type) => {
                      const config = internalTransactionTypes[type as keyof typeof internalTransactionTypes]
                      if (!config) return null
                      return (
                        <TabsTrigger key={type} value={config.tabId} className="flex items-center space-x-2">
                          <config.icon className="w-4 h-4" />
                          <span className="hidden sm:inline">{config.name}</span>
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>

                  {availableInternalTypes.map((type) => {
                    const config = internalTransactionTypes[type as keyof typeof internalTransactionTypes]
                    if (!config) return null
                    return (
                      <TabsContent key={type} value={config.tabId}>
                        <TariffTable type={type} tariffs={internalGroupedTariffs[type as keyof typeof internalGroupedTariffs]} />
                      </TabsContent>
                    )
                  })}
                </Tabs>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Internal Tariffs</h3>
                    <p className="text-gray-500">No internal tariffs configured yet.</p>
                    {canManageTariffs && (
                      <Button className="mt-4" onClick={() => router.push('/dashboard/finance/tariffs/create')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Internal Tariff
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* External Tariffs Tab */}
            <TabsContent value="external">
              {tariffsLoading ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading external tariffs...</p>
                  </CardContent>
                </Card>
              ) : availableExternalTypes.length > 0 ? (
                <Tabs value={activeExternalTab} onValueChange={setActiveExternalTab} className="space-y-6">
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableExternalTypes.length}, 1fr)` }}>
                    {availableExternalTypes.map((type) => {
                      const config = externalTransactionTypes[type as keyof typeof externalTransactionTypes]
                      if (!config) return null
                      return (
                        <TabsTrigger key={type} value={config.tabId} className="flex items-center space-x-2">
                          <config.icon className="w-4 h-4" />
                          <span className="hidden sm:inline">{config.name}</span>
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>

                  {availableExternalTypes.map((type) => {
                    const config = externalTransactionTypes[type as keyof typeof externalTransactionTypes]
                    if (!config) return null
                    return (
                      <TabsContent key={type} value={config.tabId}>
                        <TariffTable type={type} tariffs={externalGroupedTariffs[type as keyof typeof externalGroupedTariffs]} />
                      </TabsContent>
                    )
                  })}
                </Tabs>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No External Tariffs</h3>
                    <p className="text-gray-500">No external tariffs configured yet.</p>
                    {canManageTariffs && (
                      <Button className="mt-4" onClick={() => router.push('/dashboard/finance/tariffs/create')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create External Tariff
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Tariff' : 'Reject Tariff'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve' 
                ? `Are you sure you want to approve "${selectedTariff?.name}"? This will make it active.`
                : `Are you sure you want to reject "${selectedTariff?.name}"? Please provide a reason for rejection.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {approvalAction === 'reject' && (
              <div className="grid gap-2">
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a reason for rejecting this tariff..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}
            
            {approvalAction === 'approve' && (
              <div className="grid gap-2">
                <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Any additional notes for this approval..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalDialogOpen(false)
                setSelectedTariff(null)
                setApprovalAction(null)
                setApprovalNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApproval}
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
              disabled={
                (approveTariffMutation.isPending || rejectTariffMutation.isPending) ||
                (approvalAction === 'reject' && !approvalNotes.trim())
              }
            >
              {(approveTariffMutation.isPending || rejectTariffMutation.isPending) ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {approvalAction === 'approve' ? 'Approving...' : 'Rejecting...'}
                </>
              ) : (
                approvalAction === 'approve' ? 'Approve Tariff' : 'Reject Tariff'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Tariff Details Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tariff Details</DialogTitle>
            <DialogDescription>
              View complete information about this tariff
            </DialogDescription>
          </DialogHeader>
          
          {viewTariff && (
            <div className="grid gap-4 py-4">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Name</Label>
                    <p className="text-sm font-medium">{viewTariff.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <div className="mt-1">{renderStatusBadge(viewTariff)}</div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Description</Label>
                    <p className="text-sm">{viewTariff.description || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Tariff Type</Label>
                    <p className="text-sm">{viewTariff.tariffType}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Transaction Type</Label>
                    <p className="text-sm">{viewTariff.transactionType}</p>
                  </div>
                </div>
              </div>

              {/* Fee Configuration */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Fee Configuration</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Fee Type</Label>
                    <Badge variant="outline" className="mt-1">{viewTariff.feeType}</Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Currency</Label>
                    <p className="text-sm">{viewTariff.currency}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Fee Amount</Label>
                    <p className="text-sm font-medium">{viewTariff.feeAmount} {viewTariff.currency}</p>
                  </div>
                  {viewTariff.feePercentage && (
                    <div>
                      <Label className="text-xs text-gray-500">Fee Percentage</Label>
                      <p className="text-sm">{viewTariff.feePercentage}%</p>
                    </div>
                  )}
                  {viewTariff.minFee && (
                    <div>
                      <Label className="text-xs text-gray-500">Min Fee</Label>
                      <p className="text-sm">{viewTariff.minFee} {viewTariff.currency}</p>
                    </div>
                  )}
                  {viewTariff.maxFee && (
                    <div>
                      <Label className="text-xs text-gray-500">Max Fee</Label>
                      <p className="text-sm">{viewTariff.maxFee} {viewTariff.currency}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Range */}
              {(viewTariff.minAmount || viewTariff.maxAmount) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Amount Range</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {viewTariff.minAmount && (
                      <div>
                        <Label className="text-xs text-gray-500">Min Amount</Label>
                        <p className="text-sm">{viewTariff.minAmount} {viewTariff.currency}</p>
                      </div>
                    )}
                    {viewTariff.maxAmount && (
                      <div>
                        <Label className="text-xs text-gray-500">Max Amount</Label>
                        <p className="text-sm">{viewTariff.maxAmount} {viewTariff.currency}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* User Type */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">User Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">User Type</Label>
                    <p className="text-sm">{viewTariff.userType}</p>
                  </div>
                  {viewTariff.subscriberType && (
                    <div>
                      <Label className="text-xs text-gray-500">Subscriber Type</Label>
                      <p className="text-sm">{viewTariff.subscriberType}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* External Tariff Details */}
              {viewTariff.tariffType === 'EXTERNAL' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">External Tariff Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {viewTariff.partner && (
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">Partner</Label>
                        <p className="text-sm">{viewTariff.partner.partnerName} ({viewTariff.partner.partnerCode})</p>
                      </div>
                    )}
                    {viewTariff.group && (
                      <div>
                        <Label className="text-xs text-gray-500">Group</Label>
                        <p className="text-sm">{viewTariff.group}</p>
                      </div>
                    )}
                    {viewTariff.partnerFee !== undefined && (
                      <div>
                        <Label className="text-xs text-gray-500">Partner Fee</Label>
                        <p className="text-sm">{viewTariff.partnerFee} {viewTariff.currency}</p>
                      </div>
                    )}
                    {viewTariff.rukapayFee !== undefined && (
                      <div>
                        <Label className="text-xs text-gray-500">RukaPay Fee</Label>
                        <p className="text-sm">{viewTariff.rukapayFee} {viewTariff.currency}</p>
                      </div>
                    )}
                    {viewTariff.telecomBankCharge !== undefined && (
                      <div>
                        <Label className="text-xs text-gray-500">Telecom/Bank Charge</Label>
                        <p className="text-sm">{viewTariff.telecomBankCharge} {viewTariff.currency}</p>
                      </div>
                    )}
                    {viewTariff.governmentTax !== undefined && (
                      <div>
                        <Label className="text-xs text-gray-500">Government Tax</Label>
                        <p className="text-sm">{viewTariff.governmentTax}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval Information */}
              {(viewTariff.approvalNotes || viewTariff.approvedBy || viewTariff.rejectedBy) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Approval Information</h3>
                  <div className="grid gap-3">
                    {viewTariff.approvalNotes && (
                      <div>
                        <Label className="text-xs text-gray-500">Notes</Label>
                        <p className="text-sm">{viewTariff.approvalNotes}</p>
                      </div>
                    )}
                    {viewTariff.approvedBy && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">Approved By</Label>
                          <p className="text-sm">{viewTariff.approvedBy}</p>
                        </div>
                        {viewTariff.approvedAt && (
                          <div>
                            <Label className="text-xs text-gray-500">Approved At</Label>
                            <p className="text-sm">{new Date(viewTariff.approvedAt).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {viewTariff.rejectedBy && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500">Rejected By</Label>
                          <p className="text-sm">{viewTariff.rejectedBy}</p>
                        </div>
                        {viewTariff.rejectedAt && (
                          <div>
                            <Label className="text-xs text-gray-500">Rejected At</Label>
                            <p className="text-sm">{new Date(viewTariff.rejectedAt).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">Timestamps</h3>
                <div className="grid grid-cols-2 gap-3">
                  {viewTariff.createdAt && (
                    <div>
                      <Label className="text-xs text-gray-500">Created At</Label>
                      <p className="text-sm">{new Date(viewTariff.createdAt).toLocaleString()}</p>
                    </div>
                  )}
                  {viewTariff.updatedAt && (
                    <div>
                      <Label className="text-xs text-gray-500">Updated At</Label>
                      <p className="text-sm">{new Date(viewTariff.updatedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setViewModalOpen(false)
                setViewTariff(null)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TariffsPage 