"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Edit, 
  Trash2, 
  Users, 
  Shield, 
  Eye, 
  EyeOff,
  Search,
  RefreshCw,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useRoles, useUpdateRole, useDeleteRole } from '@/lib/hooks/useApi'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'
import type { Role } from '@/lib/types/api'

interface RolesListProps {}

export const RolesList: React.FC<RolesListProps> = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set())
  const [expandedPermissionCategories, setExpandedPermissionCategories] = useState<Set<string>>(new Set())

  // Group permissions by category for display
  const groupPermissionsByCategory = (permissions: any[]) => {
    const categories = {
      'Dashboard': permissions.filter(p => p.name.startsWith('DASHBOARD_')),
      'Analytics': permissions.filter(p => p.name.startsWith('ANALYTICS_')),
      'User Management': permissions.filter(p => p.name.startsWith('USERS_')),
      'Role Management': permissions.filter(p => p.name.startsWith('ROLES_')),
      'Wallet Management': permissions.filter(p => p.name.startsWith('WALLETS_')),
      'KYC Management': permissions.filter(p => p.name.startsWith('KYC_') && !p.name.startsWith('MERCHANT_KYC_')),
      'Merchant KYC': permissions.filter(p => p.name.startsWith('MERCHANT_KYC_')),
      'Merchant Management': permissions.filter(p => p.name.startsWith('MERCHANT_') && !p.name.startsWith('MERCHANT_KYC_')),
      'Document Management': permissions.filter(p => p.name.startsWith('DOCUMENTS_')),
      'Transaction Management': permissions.filter(p => p.name.startsWith('TRANSACTIONS_')),
      'Tariff Management': permissions.filter(p => p.name.startsWith('TARIFF')),
      'System Management': permissions.filter(p => p.name.startsWith('SYSTEM_'))
    }
    
    // Remove empty categories
    return Object.entries(categories).filter(([_, perms]) => perms.length > 0)
  }

  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    isActive: true
  })

  // API hooks
  const { data: rolesData, isLoading, refetch } = useRoles()
  const updateRoleMutation = useUpdateRole()
  const deleteRoleMutation = useDeleteRole()

  const roles: Role[] = rolesData?.roles || []

  // Filter roles based on search term
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setEditForm({
      name: role.name,
      description: role.description || '',
      isActive: role.isActive
    })
    setIsEditDialogOpen(true)
  }

  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role)
    setIsDeleteDialogOpen(true)
  }

  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(roleId)) {
        newSet.delete(roleId)
      } else {
        newSet.add(roleId)
      }
      return newSet
    })
  }

  const handleUpdateRole = async () => {
    if (!selectedRole) return

    try {
      await updateRoleMutation.mutateAsync({
        id: selectedRole.id,
        roleData: editForm
      })
      toast.success('Role updated successfully!')
      setIsEditDialogOpen(false)
      setSelectedRole(null)
      refetch()
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    }
  }

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return

    try {
      await deleteRoleMutation.mutateAsync(roleToDelete.id)
      toast.success('Role deleted successfully!')
      setIsDeleteDialogOpen(false)
      setRoleToDelete(null)
      refetch()
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    }
  }

  const getRoleBadge = (role: Role) => {
    if (role.isActive) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>
    } else {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading roles...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Badge variant="outline">
            {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Roles Grid */}
      {filteredRoles.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'No roles have been created yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRoles.map((role) => {
            const isExpanded = expandedRoles.has(role.id)
            return (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRoleExpansion(role.id)}
                          className="h-6 w-6 p-0 hover:bg-gray-100"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-600" />
                          {role.name}
                        </CardTitle>
                      </div>
                      {role.description && (
                        <CardDescription className="mt-1 ml-8">
                          {role.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(role)}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(role)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Permissions Count */}
                    <div className="flex items-center gap-2 ml-8">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {role.permissions?.length || 0} permission{(role.permissions?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Users Count */}
                    <div className="flex items-center gap-2 ml-8">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {role.userRoles?.length || 0} user{(role.userRoles?.length || 0) !== 1 ? 's' : ''} assigned
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-center gap-2 ml-8">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Created {formatDate(role.createdAt)}
                      </span>
                    </div>

                    {/* Permissions Preview */}
                    {role.permissions && role.permissions.length > 0 && (
                      <div className="pt-2 border-t ml-8">
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map((rolePermission: any) => {
                            const permission = rolePermission.permission || rolePermission
                            return (
                              <Badge key={permission.id} variant="outline" className="text-xs">
                                {permission.action}
                              </Badge>
                            )
                          })}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expanded Permissions List */}
                    {isExpanded && role.permissions && role.permissions.length > 0 && (
                      <div className="pt-4 border-t ml-8">
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            All Permissions ({role.permissions.length})
                          </h4>
                          <div className="space-y-3">
                            {groupPermissionsByCategory(role.permissions.map((rp: any) => rp.permission || rp)).map(([categoryName, categoryPermissions]) => {
                              const isExpanded = expandedPermissionCategories.has(`${role.id}-${categoryName}`)
                              
                              return (
                                <div key={categoryName} className="border rounded-lg">
                                  <div 
                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpandedPermissionCategories(prev => {
                                      const newSet = new Set(prev)
                                      const key = `${role.id}-${categoryName}`
                                      if (newSet.has(key)) {
                                        newSet.delete(key)
                                      } else {
                                        newSet.add(key)
                                      }
                                      return newSet
                                    })}
                                  >
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-gray-900">{categoryName}</h4>
                                      <Badge variant="secondary" className="text-xs">
                                        {categoryPermissions.length} permissions
                                      </Badge>
                                    </div>
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-500" />
                                    )}
                                  </div>
                                  
                                  {isExpanded && (
                                    <div className="border-t p-3">
                                      <div className="space-y-2">
                                        {categoryPermissions.map((permission: any) => (
                                          <div key={permission.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs">
                                                  {permission.action}
                                                </Badge>
                                                <span className="text-sm font-medium text-gray-900">
                                                  {permission.name}
                                                </span>
                                              </div>
                                              <p className="text-xs text-gray-600">
                                                {permission.description || `${permission.action} ${permission.resource.toLowerCase()}`}
                                              </p>
                                              <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-xs">
                                                  {permission.resource}
                                                </Badge>
                                                {permission.isActive ? (
                                                  <Badge className="bg-green-100 text-green-800 text-xs">
                                                    Active
                                                  </Badge>
                                                ) : (
                                                  <Badge className="bg-gray-100 text-gray-800 text-xs">
                                                    Inactive
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Role
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editRoleName">Role Name</Label>
              <Input
                id="editRoleName"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter role name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRoleDescription">Description</Label>
              <Textarea
                id="editRoleDescription"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter role description"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="editRoleActive">Active</Label>
              <input
                type="checkbox"
                id="editRoleActive"
                checked={editForm.isActive}
                onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending}
              className="flex items-center gap-2"
            >
              {updateRoleMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Role
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete the role <strong>"{roleToDelete?.name}"</strong>?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800 font-medium">Warning</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                This action cannot be undone. Users with this role will lose their permissions.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteRoleMutation.isPending}
              className="flex items-center gap-2"
            >
              {deleteRoleMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete Role'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
