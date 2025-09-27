"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Search, 
  Filter,
  Clock,
  CheckCircle,
  X,
  Eye,
  Building2,
  DollarSign,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

interface PendingApproval {
  id: string
  type: 'TARIFF' | 'PARTNER'
  entityId: string
  entityName: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  status: 'PENDING_APPROVAL'
  requestedBy: string
  requestedAt: string
  changes?: any
  reason?: string
}

interface ApprovalStats {
  totalPending: number
  tariffPending: number
  partnerPending: number
  todayRequests: number
}

const ApprovalsPage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  
  const { hasPermission, userRole } = usePermissions()
  const canApproveTariffs = hasPermission(PERMISSIONS.TARIFFS_APPROVE) || userRole === 'SUPER_ADMIN'
  const canApprovePartners = hasPermission(PERMISSIONS.PARTNERS_APPROVE) || userRole === 'SUPER_ADMIN'
  const canViewApprovals = canApproveTariffs || canApprovePartners

  // Fetch pending approvals - Mock data for now since backend endpoints don't exist yet
  const { data: approvalsData, isLoading: approvalsLoading, error: approvalsError, refetch } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      // Mock data until backend endpoints are implemented
      return {
        tariffs: [],
        partners: []
      }
    },
    enabled: canViewApprovals,
  })

  // Fetch approval stats - Mock data for now since backend endpoints don't exist yet
  const { data: stats } = useQuery({
    queryKey: ['approval-stats'],
    queryFn: async () => {
      // Mock data until backend endpoints are implemented
      return {
        pendingTariffs: 0,
        pendingPartners: 0,
        totalPending: 0,
        approvedToday: 0,
        tariffPending: 0,
        partnerPending: 0,
        todayRequests: 0
      }
    },
    enabled: canViewApprovals,
  })

  const approveMutation = useMutation({
    mutationFn: async ({ id, approved, reason }: { id: string; approved: boolean; reason?: string }) => {
      // Mock approval for now since backend endpoint doesn't exist yet
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      return { data: { success: true } }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] })
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] })
      toast.success('Approval processed successfully!')
    },
    onError: (error: any) => {
      console.error('Failed to process approval:', error)
      toast.error(error.response?.data?.message || 'Failed to process approval.')
    },
    onSettled: () => {
      setIsLoading(false)
    }
  })

  const handleApproval = async (id: string, approved: boolean, reason?: string) => {
    if (!approved && !reason) {
      toast.error('Please provide a reason for rejection.')
      return
    }

    setIsLoading(true)
    try {
      await approveMutation.mutateAsync({ id, approved, reason })
    } catch (error) {
      // Error handled by mutation's onError
    }
  }

  const allApprovals = [...(approvalsData?.tariffs || []), ...(approvalsData?.partners || [])]
  const filteredApprovals = allApprovals.filter((approval: PendingApproval) => {
    const matchesSearch = approval.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         approval.requestedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || approval.type === typeFilter
    const matchesAction = actionFilter === 'all' || approval.action === actionFilter
    
    return matchesSearch && matchesType && matchesAction
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TARIFF':
        return <DollarSign className="w-4 h-4" />
      case 'PARTNER':
        return <Building2 className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800'
      case 'DELETE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!canViewApprovals) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-4">You do not have permission to view approvals.</p>
                <Button onClick={() => router.push('/dashboard/finance')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Finance
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
              <Link href="/dashboard" className="hover:text-gray-800">Dashboard</Link>
              <span className="text-gray-400">/</span>
              <Link href="/dashboard/finance" className="hover:text-gray-800">Finance</Link>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-gray-900">Approvals</span>
            </nav>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pending Approvals</h1>
              <p className="text-gray-600">Review and approve pending tariff and partner changes</p>
            </div>
            <Button onClick={() => refetch()} disabled={approvalsLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Total Pending</h3>
                      <p className="text-2xl font-bold text-orange-600">{stats.totalPending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Tariff Pending</h3>
                      <p className="text-2xl font-bold text-blue-600">{stats.tariffPending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Partner Pending</h3>
                      <p className="text-2xl font-bold text-green-600">{stats.partnerPending}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Today's Requests</h3>
                      <p className="text-2xl font-bold text-purple-600">{stats.todayRequests}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      placeholder="Search by name or requester..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="typeFilter">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="TARIFF">Tariff</SelectItem>
                      <SelectItem value="PARTNER">Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="actionFilter">Action</Label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="CREATE">Create</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('')
                      setTypeFilter('all')
                      setActionFilter('all')
                    }}
                    className="w-full"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approvals Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals ({filteredApprovals.length})</CardTitle>
              <CardDescription>
                Review and approve pending changes to tariffs and partners
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredApprovals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
                  <p className="text-gray-500">All approvals have been processed.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Entity</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Requested By</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApprovals.map((approval: PendingApproval) => (
                        <tr key={approval.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(approval.type)}
                              <span className="font-medium">{approval.type}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{approval.entityName}</div>
                              <div className="text-sm text-gray-500">ID: {approval.entityId}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getActionColor(approval.action)}>
                              {approval.action}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-900">{approval.requestedBy}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-900">
                              {new Date(approval.requestedAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(approval.requestedAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(approval.status)}>
                              {approval.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const editPath = approval.type === 'TARIFF' 
                                    ? `/dashboard/finance/tariffs/edit/${approval.entityId}`
                                    : `/dashboard/finance/partners/edit/${approval.entityId}`
                                  router.push(editPath)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default ApprovalsPage
