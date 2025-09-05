"use client"

import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Shield, 
  Users, 
  UserPlus,
  Building,
  Key,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { useUsers, useRoles, useAssignRole } from '@/lib/hooks/useApi'
import type { User, Role } from '@/lib/types/api'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'

const PermissionsPage = () => {
  const { data: users, isLoading: isUsersLoading } = useUsers()
  const { data: roles, isLoading: isRolesLoading } = useRoles()
  const assignRole = useAssignRole()
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [isAssigning, setIsAssigning] = useState(false)

  // Handle different API response structures
  const usersArray: User[] = Array.isArray(users) ? users : []
  const rolesArray: Role[] = Array.isArray(roles?.roles) ? roles.roles : Array.isArray(roles) ? roles : []

  // Filter users based on search and role
  const filteredUsers = usersArray.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) {
      toast.error('Please select a user and a role')
      return
    }

    setIsAssigning(true)
    try {
      await assignRole.mutateAsync({ 
        userId: selectedUser.id, 
        roleId: selectedRoleId 
      })
      toast.success('Role assigned successfully!')
      setSelectedUser(null)
      setSelectedRoleId('')
    } catch (error: unknown) {
      console.error('Role assignment error:', error)
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setSelectedRoleId('') // Reset selected role
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
      case 'SUSPENDED':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>
      case 'PENDING_VERIFICATION':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
              <p className="text-gray-600 mt-2">Assign and manage user roles</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Available Roles</p>
                <p className="text-lg font-semibold text-gray-900">{rolesArray.length}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usersArray.length}</div>
                <p className="text-xs text-muted-foreground">
                  Users in system
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Roles</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rolesArray.length}</div>
                <p className="text-xs text-muted-foreground">
                  Roles in system
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rolesArray.length}</div>
                <p className="text-xs text-muted-foreground">
                  Available roles
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usersArray.filter(user => user.status === 'ACTIVE').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {usersArray.length > 0 ? `${Math.round((usersArray.filter(user => user.status === 'ACTIVE').length / usersArray.length) * 100)}%` : '0%'} of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users by email or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {rolesArray.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Select a user to assign permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isUsersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No users found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Assign Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.email || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{user.phone || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleUserSelect(user)}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Assign Role to {user.email}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Current Role</label>
                                  <p className="text-sm text-gray-600">{user.role}</p>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium mb-3 block">Select New Role</label>
                                  {isRolesLoading ? (
                                    <div className="text-center py-4">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                                      <p className="text-sm text-gray-600 mt-2">Loading roles...</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {rolesArray.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                          <input
                                            type="radio"
                                            id={role.id}
                                            name="role"
                                            value={role.id}
                                            checked={selectedRoleId === role.id}
                                            onChange={(e) => setSelectedRoleId(e.target.value)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                          />
                                          <label
                                            htmlFor={role.id}
                                            className="flex-1 cursor-pointer"
                                          >
                                            <div className="font-medium">{role.name}</div>
                                            {role.description && (
                                              <div className="text-sm text-gray-500 mt-1">
                                                {role.description}
                                              </div>
                                            )}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex justify-end space-x-3 pt-4">
                                  <Button
                                    onClick={handleAssignRole}
                                    disabled={isAssigning || !selectedRoleId}
                                    className="bg-[#08163d] hover:bg-[#0a1f4f]"
                                  >
                                    {isAssigning ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Assigning...
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Assign Role
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default PermissionsPage 