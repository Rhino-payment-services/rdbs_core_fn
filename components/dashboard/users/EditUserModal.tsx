"use client"
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogOverlay } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Edit, 
  Shield, 
  User as UserIcon, 
  Key,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useRoles, usePermissions, useUpdateUserRole, useRemoveRole, useAssignPermissions } from '@/lib/hooks/useApi'
import { useUpdateUser } from '@/lib/hooks/useAuth'
import type { User, Role, Permission } from '@/lib/types/api'
import { PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard, RoleGuard } from '@/components/ui/PermissionGuard'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'

interface EditUserModalProps {
  user: User
  trigger?: React.ReactNode
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, trigger }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  
  // Form states - prefer profile fields when available so names/phone prefill correctly
  const [formData, setFormData] = useState({
    firstName: (user as any).profile?.firstName || user.firstName || '',
    lastName: (user as any).profile?.lastName || user.lastName || '',
    email: user.email || '',
    phone: (user as any).profile?.phone || user.phone || '',
    userType: user.userType || '',
    status: user.status || 'ACTIVE'
  })

  // API hooks
  const { data: roles } = useRoles()
  const { data: permissions, isLoading: isPermissionsLoading } = usePermissions()
  const updateUserRole = useUpdateUserRole()
  const removeRole = useRemoveRole()
  const assignPermissions = useAssignPermissions()
  const updateUser = useUpdateUser()

  // Get data arrays
  const rolesArray: Role[] = Array.isArray(roles?.roles) ? roles.roles : Array.isArray(roles) ? roles : []
  const permissionsArray: Permission[] = Array.isArray((permissions as any)?.permissions)
    ? (permissions as any).permissions
    : Array.isArray(permissions)
      ? permissions as unknown as Permission[]
      : []

  // Initialize selected role — match by roleId first, then by name (case-insensitive)
  useEffect(() => {
    if (rolesArray.length > 0) {
      const userRoleId = (user as any).roleId
      let matched: Role | undefined
      if (userRoleId) {
        matched = rolesArray.find((r: Role) => r.id === userRoleId)
      }
      if (!matched && user.role) {
        matched = rolesArray.find((r: Role) => r.name.toLowerCase() === user.role.toLowerCase())
      }
      setSelectedRole(matched?.id || "")
    }
  }, [user.role, (user as any).roleId, rolesArray])

  // Initialize selected permissions
  useEffect(() => {
    if (user.permissions) {
      setSelectedPermissions(user.permissions.map((p: Permission) => p.id || p.name || ''))
    }
  }, [user.permissions])

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

  const handleRoleUpdate = async () => {
    if (!selectedRole) {
      toast.error('Please select a role')
      return
    }

    try {
      await updateUserRole.mutateAsync({ userId: user.id, roleId: selectedRole })
      toast.success('User role updated successfully!')
    } catch (error: unknown) {
      console.error('Role update error:', error)
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    }
  }

  const handleRoleRemove = async (roleId: string) => {
    try {
      await removeRole.mutateAsync({ userId: user.id, roleId })
      toast.success('Role removed successfully!')
      setSelectedRole("")
    } catch (error: unknown) {
      console.error('Role removal error:', error)
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    }
  }

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleAssignPermissions = async () => {
    if (selectedPermissions.length === 0) {
      toast.error('Please select at least one permission')
      return
    }

    try {
      await assignPermissions.mutateAsync({ 
        userId: user.id, 
        permissions: selectedPermissions as string[]
      })
      toast.success('Permissions assigned successfully!')
    } catch (error: unknown) {
      console.error('Permission assignment error:', error)
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    }
  }

  // Helper to map a permission name (like DASHBOARD_VIEW) to its ID from the permissions list
  const getPermissionIdByName = (permissionName: string) => {
    const match = permissionsArray.find(
      (p: Permission | any) => p?.name === permissionName || p?.code === permissionName
    )
    return (match as any)?.id || ''
  }

  // High-level navigation areas controlled via view permissions
  const NAV_PERMISSION_NAMES: string[] = [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.WALLETS_VIEW,
    PERMISSIONS.KYC_VIEW,
    PERMISSIONS.MERCHANT_KYC_VIEW,
    PERMISSIONS.MERCHANT_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PARTNERS_VIEW,
  ]

  const handlePromoteToSuperAdmin = async () => {
    try {
      await updateUser.mutateAsync({ id: user.id, userData: { role: 'SUPER_ADMIN' } })
      toast.success('User promoted to Super Admin!')
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateUser.mutateAsync({ id: user.id, userData: formData })
      toast.success('User profile updated successfully!')
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-none max-h-[95vh] overflow-y-auto z-[99999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Edit User: {user.firstName} {user.lastName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  User Information
                </CardTitle>
                <CardDescription>Update user profile details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: string) =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#08163d] hover:bg-[#0a1f4f]">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Current User Info */}
            <Card>
              <CardHeader>
                <CardTitle>Current Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Current Role</Label>
                    <div className="mt-1">{getRoleBadge(user.role)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">User Type</Label>
                    <div className="mt-1">{getUserTypeBadge(user.userType)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <div className="mt-1">{getStatusBadge(user.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">KYC Status</Label>
                    <div className="mt-1">{getKycStatusBadge(user.kycStatus)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email Verified</Label>
                    <div className="mt-1">
                      {user.isVerified ? (
                        <Badge className="bg-green-100 text-green-800">Verified</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Not Verified</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Last Login</Label>
                    <div className="mt-1 text-sm text-gray-600">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt || '') : 'Never'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles & Permissions Tab */}
          <TabsContent value="roles" className="space-y-6">
            <PermissionGuard permission={PERMISSIONS.ROLES_ASSIGN}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Role Management
                  </CardTitle>
                  <CardDescription>Assign or remove roles for this user</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Current Role</Label>
                    <div className="mt-1 flex items-center gap-2">
                      {getRoleBadge(user.role)}
                      {user.role && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentRole = rolesArray.find((role: Role) => role.name === user.role)
                            if (currentRole) {
                              handleRoleRemove(currentRole.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Assign New Role</Label>
                    <div className="mt-2 flex gap-2">
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {rolesArray.map((role: Role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleRoleUpdate}
                        disabled={!selectedRole || updateUserRole.isPending}
                        className="bg-[#08163d] hover:bg-[#0a1f4f]"
                      >
                        {updateUserRole.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Assign Role
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PermissionGuard>

            <PermissionGuard permission={PERMISSIONS.ROLES_ASSIGN}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Permission Management
                  </CardTitle>
                  <CardDescription>Assign specific permissions to this user</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isPermissionsLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading permissions...</p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {permissionsArray.map((permission: Permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => handlePermissionToggle(permission.id || '')}
                            />
                            <label
                              htmlFor={`permission-${permission.id || ''}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              <div className="font-medium">{permission.name}</div>
                              <div className="text-xs text-gray-500">
                                {permission?.description || permission?.category || ''}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          {selectedPermissions.length} permission(s) selected
                        </div>
                        <Button
                          onClick={handleAssignPermissions}
                          disabled={assignPermissions.isPending || selectedPermissions.length === 0}
                          className="bg-[#08163d] hover:bg-[#0a1f4f]"
                        >
                          {assignPermissions.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Assigning...
                            </>
                          ) : (
                            <>
                              <Key className="h-4 w-4 mr-2" />
                              Assign Permissions
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </PermissionGuard>

            {/* Navigation visibility (driven by view permissions) */}
            <PermissionGuard permission={PERMISSIONS.ROLES_ASSIGN}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Navigation Visibility
                  </CardTitle>
                  <CardDescription>
                    Control which main dashboard sections this user can see in the navigation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {NAV_PERMISSION_NAMES.map((permName) => {
                    const permId = getPermissionIdByName(permName)
                    if (!permId) return null

                    const label = permName
                      .replace('_VIEW', '')
                      .replace(/_/g, ' ')
                      .toLowerCase()
                      .replace(/^\w/, (c) => c.toUpperCase())

                    return (
                      <div
                        key={permName}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-800">{label}</span>
                          <span className="text-xs text-gray-500">
                            Toggles visibility of the {label.toLowerCase()} section in the sidebar.
                          </span>
                        </div>
                        <Switch
                          checked={selectedPermissions.includes(permId)}
                          onCheckedChange={() => handlePermissionToggle(permId)}
                        />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </PermissionGuard>

            {/* Promote to Super Admin - only visible to Super Admins */}
            <RoleGuard role="SUPER_ADMIN">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <Shield className="h-5 w-5" />
                    Super Admin Access
                  </CardTitle>
                  <CardDescription>
                    Grant this user full Super Admin privileges. This action cannot be easily undone.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user.role === 'SUPER_ADMIN' ? (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
                      <CheckCircle className="h-4 w-4" />
                      This user already has Super Admin access.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Current system role: <strong>{user.role || 'None'}</strong>
                      </p>
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={handlePromoteToSuperAdmin}
                        disabled={updateUser.isPending}
                      >
                        {updateUser.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700 mr-2"></div>
                            Promoting...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Promote to Super Admin
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </RoleGuard>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage user security and access settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Account Status</Label>
                  <div className="mt-1">{getStatusBadge(user.status)}</div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Email Verification</Label>
                  <div className="mt-1">
                    {user.isVerified ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-600">Not Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Last Login</Label>
                  <div className="mt-1 text-sm text-gray-600">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never logged in'}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Account Created</Label>
                  <div className="mt-1 text-sm text-gray-600">
                    {formatDate(user.createdAt || '')}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Security Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Reset Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Clock className="h-4 w-4 mr-2" />
                      View Login History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 