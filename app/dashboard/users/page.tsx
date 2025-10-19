"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  UserPlus,
  Building,
  User as UserIcon,
  Eye,
  Key
} from 'lucide-react'
import Link from 'next/link'
import { useUsers, useRoles } from '@/lib/hooks/useApi'
import type { User, Role, Permission } from '@/lib/types/api'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'
import { usePermissions as useUserPermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard, RoleGuard } from '@/components/ui/PermissionGuard'
import { EditUserModal } from '@/components/dashboard/users/EditUserModal'
import EditUserPermissionsModal from '@/components/dashboard/users/EditUserPermissionsModal'

const UsersPage = () => {
  const { data: users, isLoading, error } = useUsers()
  const { data: roles, isLoading: isRolesLoading } = useRoles()
  
  // Get current user permissions
  const { 
    canCreateUser, canUpdateUser, canDeleteUser, canAssignRoles, 
    canViewUsers, userRole
  } = useUserPermissions()

  // State for permission editing modal
  const [permissionModalOpen, setPermissionModalOpen] = useState(false)
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null)

  // Handler for opening permission editing modal
  const handleEditPermissions = (user: User) => {
    setSelectedUserForPermissions(user)
    setPermissionModalOpen(true)
  }

  // Handler for closing permission editing modal
  const handleClosePermissionsModal = () => {
    setPermissionModalOpen(false)
    setSelectedUserForPermissions(null)
  }
  
  // Handle different API response structures
  const usersArray: User[] = Array.isArray(users) ? users : []
  const rolesArray: Role[] = Array.isArray(roles?.roles) ? roles.roles : Array.isArray(roles) ? roles : []
  
  // Filter for staff users only (handle both STAFF and STAFF_USER for compatibility)
  // Also include users with admin roles as they are typically staff
  const staffUsersArray = usersArray.filter(user => 
    user.userType === 'STAFF' || 
    user.userType === 'STAFF_USER' ||
    ['ADMIN', 'SUPER_ADMIN'].includes(user.role)
  )
  const staffUsersCount = staffUsersArray.length


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case 'SUSPENDED':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>
      case 'PENDING_VERIFICATION':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Verification</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge className="bg-red-100 text-red-800">Super Admin</Badge>
      case 'ADMIN':
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
      case 'USER':
        return <Badge className="bg-blue-100 text-blue-800">User</Badge>
      case 'MANAGER':
        return <Badge className="bg-orange-100 text-orange-800">Manager</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{role}</Badge>
    }
  }

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'END_USER':
        return <Badge className="bg-blue-100 text-blue-800">End User</Badge>
      case 'STAFF_USER':
        return <Badge className="bg-green-100 text-green-800">Staff User</Badge>
      case 'PARTNER':
        return <Badge className="bg-purple-100 text-purple-800">Partner</Badge>
      case 'AGENT':
        return <Badge className="bg-orange-100 text-orange-800">Agent</Badge>
      default:
        return <Badge variant="secondary">{userType}</Badge>
    }
  }

  const getKycStatusBadge = (kycStatus: string) => {
    switch (kycStatus) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'NOT_STARTED':
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>
      case 'EXPIRED':
        return <Badge className="bg-orange-100 text-orange-800">Expired</Badge>
      default:
        return <Badge variant="secondary">{kycStatus}</Badge>
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

  return (
    <PermissionGuard 
      permission={PERMISSIONS.USERS_VIEW} 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to view users.</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Users</h1>
                <p className="text-gray-600 mt-2">Manage your users and their permissions</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Available Roles</p>
                  <p className="text-lg font-semibold text-gray-900">{rolesArray.length}</p>
                </div>
                <PermissionGuard permission={PERMISSIONS.ROLES_ASSIGN}>
                  <Link href="/dashboard/users/permissions">
                    <Button variant="outline" className="border-[#08163d] text-[#08163d] hover:bg-[#08163d] hover:text-white">
                      <Key className="w-4 h-4 mr-2" />
                      Manage Permissions
                    </Button>
                  </Link>
                </PermissionGuard>
                <PermissionGuard permission={PERMISSIONS.USERS_CREATE}>
                  <Link href="/dashboard/users/create">
                    <Button className="!bg-[#08163d] hover:!bg-[#0a1f4f] !text-white border-0">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </Link>
                </PermissionGuard>
              </div>
            </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mb-4">
            <Card className="bg-white border-gray-200">
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-0">
                      Total Staff Users
                    </p>
                    <p className="text-xl font-bold text-gray-900 leading-tight">
                      {staffUsersCount}
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center ml-2">
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="mt-0">
                  <span className="text-sm text-blue-600 font-medium">
                    Staff users
                  </span>
                  <span className="text-sm ml-1 text-gray-500">
                    in system
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-200">
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-0">
                      Active Staff Users
                    </p>
                    <p className="text-xl font-bold text-gray-900 leading-tight">
                      {staffUsersArray.filter(user => user.status === 'ACTIVE').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center ml-2">
                    <UserIcon className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="mt-0">
                  <span className="text-sm text-green-600 font-medium">
                    {staffUsersCount > 0 ? `${Math.round((staffUsersArray.filter(user => user.status === 'ACTIVE').length / staffUsersCount) * 100)}%` : '0%'}
                  </span>
                  <span className="text-sm ml-1 text-gray-500">
                    of staff users
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-200">
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-0">
                      Verified Staff Users
                    </p>
                    <p className="text-xl font-bold text-gray-900 leading-tight">
                      {staffUsersArray.filter(user => user.isVerified).length}
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center ml-2">
                    <Shield className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="mt-0">
                  <span className="text-sm text-purple-600 font-medium">
                    {staffUsersCount > 0 ? `${Math.round((staffUsersArray.filter(user => user.isVerified).length / staffUsersCount) * 100)}%` : '0%'}
                  </span>
                  <span className="text-sm ml-1 text-gray-500">
                    of staff users
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-gray-200">
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-0">
                      Available Roles
                    </p>
                    <p className="text-xl font-bold text-gray-900 leading-tight">
                      {rolesArray.length}
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center ml-2">
                    <Key className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="mt-0">
                  <span className="text-sm text-orange-600 font-medium">
                    Roles
                  </span>
                  <span className="text-sm ml-1 text-gray-500">
                    in system
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Staff Users</CardTitle>
                  <CardDescription>Manage system staff users and their permissions</CardDescription>
                </div>
                <PermissionGuard permission={PERMISSIONS.USERS_CREATE}>
                  <Link href="/dashboard/users/create">
                    <Button className="flex items-center gap-2 !bg-[#08163d] hover:!bg-[#0a1f4f] !text-white border-0">
                      <UserPlus className="h-4 w-4" />
                      Create New Staff User
                    </Button>
                  </Link>
                </PermissionGuard>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search staff users..."
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>

                {/* Users Table */}
                <div className="rounded-lg">
                  {isLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading users...</p>
                    </div>
                  ) : (!staffUsersArray || staffUsersArray.length === 0) ? (
                    <div className="p-8 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No staff users found</h3>
                      <p className="text-gray-600 mb-4">Get started by creating your first staff user.</p>
                      <Link href="/dashboard/users/create">
                        <Button className="flex items-center gap-2 !bg-[#08163d] hover:!bg-[#0a1f4f] !text-white border-0">
                          <UserPlus className="h-4 w-4" />
                          Create New Staff User
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>User Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>KYC Status</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {staffUsersArray.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                            <TableCell>{user.phone || 'N/A'}</TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>{getUserTypeBadge(user.userType)}</TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell>{getKycStatusBadge(user.kycStatus)}</TableCell>
                            <TableCell>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <PermissionGuard permission={PERMISSIONS.USERS_UPDATE}>
                                        <EditUserModal user={user} />
                                    </PermissionGuard>
                                    <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    
                                    <PermissionGuard permission={PERMISSIONS.ROLES_ASSIGN}>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => handleEditPermissions(user)}
                                            title="Edit Permissions"
                                        >
                                            <Key className="h-4 w-4" />
                                        </Button>
                                    </PermissionGuard>
                                    
                                    <PermissionGuard permission={PERMISSIONS.USERS_DELETE}>
                                        <Button variant="ghost" size="sm">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </PermissionGuard>
                                </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* Permission Editing Modal */}
      {selectedUserForPermissions && (
        <EditUserPermissionsModal
          isOpen={permissionModalOpen}
          onClose={handleClosePermissionsModal}
          userId={selectedUserForPermissions.id}
          userName={selectedUserForPermissions.email || selectedUserForPermissions.phone || 'Unknown User'}
        />
      )}
    </div>
    </PermissionGuard>
  )
}

export default UsersPage 