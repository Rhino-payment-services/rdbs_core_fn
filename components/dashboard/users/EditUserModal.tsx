"use client"
import React, { useState, useEffect, useMemo } from 'react'
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
  Clock,
  Eye
} from 'lucide-react'
import { useRoles, useUpdateUserRole, useRemoveRole } from '@/lib/hooks/useApi'
import { useUpdateUser } from '@/lib/hooks/useAuth'
import { useUserPermissions, useUpdateUserPermissions, useAvailablePermissions } from '@/lib/hooks/useUserPermissions'
import type { User, Role } from '@/lib/types/api'
import { PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard, RoleGuard } from '@/components/ui/PermissionGuard'
import { NAV_PERMISSION_ITEMS as NAV_ITEMS, PERMISSION_GROUPS } from '@/lib/constants/permissionCatalog'
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
  // User's currently assigned permissions — fetched only when modal is open
  const { data: userPermissionsData, isLoading: isUserPermissionsLoading } = useUserPermissions(isOpen ? user.id : '')
  // Full permissions catalog from the backend — used to resolve name → UUID at save-time
  const { data: availablePermissions } = useAvailablePermissions()
  const updateUserRole = useUpdateUserRole()
  const removeRole = useRemoveRole()
  const updatePermissions = useUpdateUserPermissions()
  const updateUser = useUpdateUser()

  const rolesArray: Role[] = Array.isArray(roles?.roles) ? roles.roles : Array.isArray(roles) ? roles : []

  // Build a name→id map from every available source so we can resolve UUIDs at save-time.
  // Priority: (1) full catalog from /users/permissions/available, (2) user's own permissions,
  // (3) permissions embedded in roles (nested as rolePermission.permission.id from GET /roles).
  const permNameToId = useMemo(() => {
    const map = new Map<string, string>()
    // Roles embed permissions as join-table rows: { permission: { id, name } }
    rolesArray.forEach((role) => {
      ;(role as any).permissions?.forEach((rp: any) => {
        const p = rp.permission ?? rp
        if (p?.name && p?.id) map.set(p.name, p.id)
      })
    })
    // User's current permissions — flat objects with direct id/name
    userPermissionsData?.permissions?.forEach((p) => {
      if (p.name && p.id) map.set(p.name, p.id)
    })
    // Full catalog from /users/permissions/available — most authoritative source
    if (Array.isArray(availablePermissions)) {
      availablePermissions.forEach((p) => {
        if (p.name && p.id) map.set(p.name, p.id)
      })
    }
    return map
  }, [availablePermissions, userPermissionsData, rolesArray])

  // selectedPermissions stores permission NAMES (e.g. "DASHBOARD_VIEW").
  // This makes nav switches and checkbox matching trivially simple — no ID lookups needed.

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

  // Preselect permissions from the user's current permission list — keyed by name.
  // This runs as soon as userPermissionsData loads; no dependency on a catalog API.
  useEffect(() => {
    if (!userPermissionsData?.permissions) return
    setSelectedPermissions(
      userPermissionsData.permissions.map((p) => p.name).filter(Boolean) as string[]
    )
  }, [userPermissionsData])

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

  // selectedPermissions stores names — toggle by name
  const handlePermissionToggle = (permName: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permName)
        ? prev.filter(n => n !== permName)
        : [...prev, permName]
    )
  }

  const handleAssignPermissions = async () => {
    // Resolve permission names → UUIDs. The backend requires UUIDs; names will 400.
    const permissionIds: string[] = []
    const unresolved: string[] = []

    for (const name of selectedPermissions) {
      const id = permNameToId.get(name)
      if (id) {
        permissionIds.push(id)
      } else {
        unresolved.push(name)
      }
    }

    if (unresolved.length > 0) {
      console.warn('Could not resolve IDs for:', unresolved)
      toast.error(
        `Some permissions could not be saved (IDs not found): ${unresolved.join(', ')}. ` +
        `Run seed:permissions on the backend to add missing permissions.`
      )
      return
    }

    try {
      await updatePermissions.mutateAsync({
        userId: user.id,
        data: { permissionIds, action: 'replace' },
      })
      toast.success('Permissions saved successfully!')
    } catch (error: unknown) {
      console.error('Permission assignment error:', error)
      toast.error(extractErrorMessage(error))
    }
  }

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
      <DialogContent
        className="max-h-[95vh] overflow-y-auto z-[99999]"
        style={{ width: '70vw', maxWidth: '70vw' }}
      >
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
          <TabsContent value="roles">
            <PermissionGuard permission={PERMISSIONS.ROLES_ASSIGN}>
              {/* Context banner */}
              <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
                <p className="font-medium mb-0.5">How access control works</p>
                <p className="text-blue-700 text-xs leading-relaxed">
                  A user&apos;s access is determined by their <strong>role</strong> (assigned below) plus any
                  direct permission overrides in the <em>Action Permissions</em> panel.
                  Changes take effect the next time the user logs in.
                  Toggle the <strong>Navigation Access</strong> switches to control which dashboard sections they can visit.
                </p>
              </div>

              {/* Top: Role assignment row */}
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4" />
                    Role Assignment
                  </CardTitle>
                  <CardDescription>Assign or remove the system role for this user</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div className="flex-1">
                      <Label className="text-sm font-medium mb-1 block">Current Role</Label>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(user.role)}
                        {user.role && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const currentRole = rolesArray.find((role: Role) => role.name === user.role)
                              if (currentRole) handleRoleRemove(currentRole.id)
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label className="text-sm font-medium mb-1 block">Assign New Role</Label>
                      <div className="flex gap-2">
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
                          className="bg-[#08163d] hover:bg-[#0a1f4f] whitespace-nowrap"
                        >
                          {updateUserRole.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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

                    <RoleGuard role="SUPER_ADMIN">
                      <div className="flex-shrink-0">
                        {user.role === 'SUPER_ADMIN' ? (
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
                            <CheckCircle className="h-4 w-4" />
                            Already Super Admin
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50 whitespace-nowrap"
                            onClick={handlePromoteToSuperAdmin}
                            disabled={updateUser.isPending}
                          >
                            {updateUser.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-700 mr-2" />
                                Promoting...
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Promote to Super Admin
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </RoleGuard>
                  </div>
                </CardContent>
              </Card>

              {/* Bottom: two-column — Nav visibility | Fine-grained permissions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Navigation Visibility */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Eye className="h-4 w-4" />
                      Navigation Access
                    </CardTitle>
                    <CardDescription>
                      Control which top-level sections appear in this user&apos;s dashboard sidebar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {isUserPermissionsLoading ? (
                      <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                        Loading current access...
                      </div>
                    ) : (
                      NAV_ITEMS.map(({ permName, label, desc }) => (
                        <div
                          key={permName}
                          className="flex items-center justify-between py-2 border-b last:border-b-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">{label}</p>
                            <p className="text-xs text-gray-400">{desc}</p>
                          </div>
                          <Switch
                            checked={selectedPermissions.includes(permName)}
                            onCheckedChange={() => handlePermissionToggle(permName)}
                          />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Right: Fine-grained permissions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Key className="h-4 w-4" />
                      Action Permissions
                    </CardTitle>
                    <CardDescription>
                      Granular control over what actions this user can perform in each section.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isUserPermissionsLoading ? (
                      <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto" />
                        <p className="text-sm text-gray-600 mt-2">Loading permissions...</p>
                      </div>
                    ) : (
                      <div className="max-h-[420px] overflow-y-auto pr-1 space-y-4">
                        {PERMISSION_GROUPS.map(({ group, permissions }) => (
                          <div key={group}>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                              {group}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                              {permissions.map(({ name, label }) => (
                                <div key={name} className="flex items-center space-x-2 py-1">
                                  <Checkbox
                                    id={`perm-${name}`}
                                    checked={selectedPermissions.includes(name)}
                                    onCheckedChange={() => handlePermissionToggle(name)}
                                  />
                                  <label
                                    htmlFor={`perm-${name}`}
                                    className="text-sm text-gray-700 cursor-pointer leading-none"
                                  >
                                    {label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t mt-4">
                      <span className="text-sm text-gray-500">
                        {selectedPermissions.length} permission(s) selected
                      </span>
                      <Button
                        onClick={handleAssignPermissions}
                        disabled={updatePermissions.isPending}
                        className="bg-[#08163d] hover:bg-[#0a1f4f]"
                      >
                        {updatePermissions.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Key className="h-4 w-4 mr-2" />
                            Save Permissions
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </PermissionGuard>
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