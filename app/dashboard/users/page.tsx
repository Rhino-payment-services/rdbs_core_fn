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

const UsersPage = () => {
  const { data: users, isLoading, error } = useUsers()
  const { data: roles, isLoading: isRolesLoading } = useRoles()
  
  // Get current user permissions
  const { 
    canCreateUser, canUpdateUser, canDeleteUser, canAssignRoles, 
    canViewUsers, userRole
  } = useUserPermissions()
  
  console.log("users====>",users)
  console.log("roles====>",roles)

  // Handle different API response structures
  const usersArray: User[] = Array.isArray(users) ? users : []
  const rolesArray: Role[] = Array.isArray(roles?.roles) ? roles.roles : Array.isArray(roles) ? roles : []
  
  // Filter for staff users only
  const staffUsersArray = usersArray.filter(user => user.userType === 'STAFF')
  const staffUsersCount = staffUsersArray.length

  console.log('Users API Response:', users)
  console.log('Users data:', users)
  console.log('Users array:', usersArray)
  console.log('Staff users array:', staffUsersArray)
  console.log('Staff users count:', staffUsersCount)
  console.log('Is loading:', isLoading)
  console.log('Error:', error)

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
      case 'SUPERADMIN':
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
                    <Button className="bg-[#08163d] hover:bg-[#0a1f4f]">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </Link>
                </PermissionGuard>
              </div>
            </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff Users</CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{staffUsersCount}</div>
                <p className="text-xs text-muted-foreground">
                  Staff users in system
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Staff Users</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {staffUsersArray.filter(user => user.status === 'ACTIVE').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {staffUsersCount > 0 ? `${Math.round((staffUsersArray.filter(user => user.status === 'ACTIVE').length / staffUsersCount) * 100)}%` : '0%'} of staff users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified Staff Users</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {staffUsersArray.filter(user => user.isVerified).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {staffUsersCount > 0 ? `${Math.round((staffUsersArray.filter(user => user.isVerified).length / staffUsersCount) * 100)}%` : '0%'} of staff users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Roles</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rolesArray.length}</div>
                <p className="text-xs text-muted-foreground">
                  Roles in system
                </p>
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
                <Link href="/dashboard/users/create">
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Create New Staff User
                  </Button>
                </Link>
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
                <div className="border rounded-lg">
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
                        <Button className="flex items-center gap-2">
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
    </div>
    </PermissionGuard>
  )
}

export default UsersPage 