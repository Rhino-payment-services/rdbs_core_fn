"use client"

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Key,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/lib/hooks/useApi'
import { useAvailablePermissions } from '@/lib/hooks/useUserPermissions'
import { PERMISSION_GROUPS } from '@/lib/constants/permissionCatalog'
import { PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import type { Role } from '@/lib/types/api'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Helper: build name → id map from the available permissions catalog
// ---------------------------------------------------------------------------
function buildNameToId(catalog: { id: string; name: string }[]): Map<string, string> {
  const m = new Map<string, string>()
  catalog.forEach((p) => { if (p.name && p.id) m.set(p.name, p.id) })
  return m
}

// ---------------------------------------------------------------------------
// RolePermissionsEditor — shown inside the create/edit dialog
// ---------------------------------------------------------------------------
interface RolePermissionsEditorProps {
  selected: string[]          // permission names
  onChange: (names: string[]) => void
}

function RolePermissionsEditor({ selected, onChange }: RolePermissionsEditorProps) {
  const toggle = (name: string) =>
    onChange(
      selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]
    )

  const toggleGroup = (group: { permissions: { name: string }[] }) => {
    const groupNames = group.permissions.map((p) => p.name)
    const allOn = groupNames.every((n) => selected.includes(n))
    if (allOn) {
      onChange(selected.filter((n) => !groupNames.includes(n)))
    } else {
      const toAdd = groupNames.filter((n) => !selected.includes(n))
      onChange([...selected, ...toAdd])
    }
  }

  return (
    <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
      {PERMISSION_GROUPS.map((group) => {
        const groupNames = group.permissions.map((p) => p.name)
        const allOn = groupNames.every((n) => selected.includes(n))
        const someOn = groupNames.some((n) => selected.includes(n))

        return (
          <div key={group.group}>
            <div className="flex items-center gap-2 mb-1.5">
              <Checkbox
                id={`group-${group.group}`}
                checked={allOn}
                data-state={someOn && !allOn ? 'indeterminate' : undefined}
                onCheckedChange={() => toggleGroup(group)}
                className="h-3.5 w-3.5"
              />
              <label
                htmlFor={`group-${group.group}`}
                className="text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none"
              >
                {group.group}
              </label>
              <span className="text-xs text-gray-400 ml-auto">
                {groupNames.filter((n) => selected.includes(n)).length}/{groupNames.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-5">
              {group.permissions.map(({ name, label }) => (
                <div key={name} className="flex items-center gap-2 py-0.5">
                  <Checkbox
                    id={`perm-${name}`}
                    checked={selected.includes(name)}
                    onCheckedChange={() => toggle(name)}
                    className="h-3.5 w-3.5"
                  />
                  <label htmlFor={`perm-${name}`} className="text-sm text-gray-700 cursor-pointer leading-none">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CreateRoleDialog
// ---------------------------------------------------------------------------
interface CreateRoleDialogProps {
  nameToId: Map<string, string>
  onCreated: () => void
}

function CreateRoleDialog({ nameToId, onCreated }: CreateRoleDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const createRole = useCreateRole()

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Role name is required'); return }

    const unresolved = selectedPerms.filter((n) => !nameToId.has(n))
    if (unresolved.length > 0) {
      toast.error(`Cannot resolve IDs for: ${unresolved.join(', ')}. Run seed:permissions first.`)
      return
    }

    const permissionIds = selectedPerms.map((n) => nameToId.get(n)!)

    try {
      await createRole.mutateAsync({ name: name.toUpperCase().replace(/\s+/g, '_'), description, permissionIds } as any)
      toast.success(`Role "${name}" created!`)
      setOpen(false)
      setName('')
      setDescription('')
      setSelectedPerms([])
      onCreated()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#08163d] hover:bg-[#0a1f4f]">
          <Plus className="h-4 w-4 mr-2" />
          New Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto" style={{ width: '60vw', maxWidth: '60vw' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Create Custom Role
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role-name">Role Name <span className="text-red-500">*</span></Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. FINANCE_OPS"
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">Will be stored as uppercase with underscores</p>
            </div>
            <div>
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this role"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">
              Permissions
              <span className="ml-2 text-xs text-gray-400 font-normal">
                {selectedPerms.length} selected
              </span>
            </Label>
            <RolePermissionsEditor selected={selectedPerms} onChange={setSelectedPerms} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createRole.isPending}
              className="bg-[#08163d] hover:bg-[#0a1f4f]"
            >
              {createRole.isPending ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Creating...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Create Role</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// EditRoleDialog
// ---------------------------------------------------------------------------
interface EditRoleDialogProps {
  role: Role
  nameToId: Map<string, string>
}

function EditRoleDialog({ role, nameToId }: EditRoleDialogProps) {
  const [open, setOpen] = useState(false)

  // Extract current permission names from the role's permission list
  // GET /roles returns permissions as join-table rows: { permission: { id, name } } or flat { id, name }
  const initialPerms = useMemo(() => {
    const perms: any[] = (role as any).permissions ?? []
    return perms.map((rp: any) => {
      const p = rp.permission ?? rp
      return p?.name ?? ''
    }).filter(Boolean) as string[]
  }, [role])

  const [selectedPerms, setSelectedPerms] = useState<string[]>(initialPerms)
  const [description, setDescription] = useState((role as any).description ?? '')
  const updateRole = useUpdateRole()

  // Re-sync if role data changes (e.g. after refetch)
  React.useEffect(() => {
    setSelectedPerms(initialPerms)
  }, [initialPerms])

  const handleSave = async () => {
    const unresolved = selectedPerms.filter((n) => !nameToId.has(n))
    if (unresolved.length > 0) {
      toast.error(`Cannot resolve IDs for: ${unresolved.join(', ')}. Run seed:permissions first.`)
      return
    }
    const permissionIds = selectedPerms.map((n) => nameToId.get(n)!)

    try {
      await updateRole.mutateAsync({ id: role.id, roleData: { description, permissionIds } })
      toast.success(`Role "${role.name}" updated!`)
      setOpen(false)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  const isBuiltIn = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'MERCHANT', 'USER'].includes(role.name)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto" style={{ width: '60vw', maxWidth: '60vw' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Edit Role: {role.name}
          </DialogTitle>
        </DialogHeader>

        {isBuiltIn && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>This is a built-in system role. Changing its permissions may affect all users assigned to it.</p>
          </div>
        )}

        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor={`desc-${role.id}`}>Description</Label>
            <Input
              id={`desc-${role.id}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="mb-2 block">
              Permissions
              <span className="ml-2 text-xs text-gray-400 font-normal">
                {selectedPerms.length} selected
              </span>
            </Label>
            <RolePermissionsEditor selected={selectedPerms} onChange={setSelectedPerms} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateRole.isPending}
              className="bg-[#08163d] hover:bg-[#0a1f4f]"
            >
              {updateRole.isPending ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Save Changes</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function RolesPage() {
  const { data: rolesData, isLoading: rolesLoading } = useRoles()
  const { data: availablePermissions, isLoading: permsLoading } = useAvailablePermissions()
  const deleteRole = useDeleteRole()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const rolesArray: Role[] = Array.isArray(rolesData?.roles) ? rolesData.roles : Array.isArray(rolesData) ? (rolesData as any) : []

  // name→id map for saving
  const nameToId = useMemo(
    () => buildNameToId(Array.isArray(availablePermissions) ? (availablePermissions as any[]) : []),
    [availablePermissions]
  )

  const catalogReady = Array.isArray(availablePermissions) && availablePermissions.length > 0

  const handleDelete = async (role: Role) => {
    const isBuiltIn = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'MERCHANT', 'USER'].includes(role.name)
    if (isBuiltIn) { toast.error('Cannot delete built-in system roles'); return }
    if (!window.confirm(`Delete role "${role.name}"? All users assigned to it will lose this role.`)) return

    setDeletingId(role.id)
    try {
      await deleteRole.mutateAsync(role.id)
      toast.success(`Role "${role.name}" deleted`)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const getPermCount = (role: Role) => {
    const perms: any[] = (role as any).permissions ?? []
    return perms.length
  }

  const getUserCount = (role: Role) => {
    return (role as any).userRoles?.length ?? (role as any).userCount ?? 0
  }

  return (
    <PermissionGuard
      permission={PERMISSIONS.ROLES_VIEW}
      showFallback
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to view Roles &amp; Permissions.</p>
          </div>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-[#08163d]" />
              Roles Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create and manage custom roles. Assign permissions to control what each role can do.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!catalogReady && !permsLoading && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4" />
                Permission catalog empty — run <code className="font-mono">seed:permissions</code> on the backend
              </div>
            )}
            {catalogReady && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-4 w-4" />
                {(availablePermissions as any[]).length} permissions available
              </div>
            )}
            <CreateRoleDialog nameToId={nameToId} onCreated={() => {}} />
          </div>
        </div>

        {/* Roles grid */}
        {rolesLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08163d]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rolesArray.map((role) => {
              const permCount = getPermCount(role)
              const userCount = getUserCount(role)
              const isBuiltIn = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT', 'MERCHANT', 'USER'].includes(role.name)

              // Flatten permission names for display
              const permNames: string[] = ((role as any).permissions ?? []).map((rp: any) => {
                const p = rp.permission ?? rp
                return p?.name ?? ''
              }).filter(Boolean)

              return (
                <Card key={role.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base font-semibold truncate">{role.name}</CardTitle>
                          {isBuiltIn && (
                            <Badge variant="outline" className="text-xs shrink-0">Built-in</Badge>
                          )}
                          {!(role as any).isActive && (
                            <Badge className="bg-gray-100 text-gray-600 text-xs shrink-0">Inactive</Badge>
                          )}
                        </div>
                        {(role as any).description && (
                          <CardDescription className="mt-1 text-xs line-clamp-2">
                            {(role as any).description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <EditRoleDialog role={role} nameToId={nameToId} />
                        {!isBuiltIn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(role)}
                            disabled={deletingId === role.id}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingId === role.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Stats row */}
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Key className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium">{permCount}</span> permissions
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium">{userCount}</span> users
                      </div>
                    </div>

                    {/* Permission chips — show up to 6 */}
                    {permNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {permNames.slice(0, 6).map((name) => (
                          <Badge key={name} variant="secondary" className="text-xs px-1.5 py-0.5 font-mono">
                            {name}
                          </Badge>
                        ))}
                        {permNames.length > 6 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-gray-500">
                            +{permNames.length - 6} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No permissions assigned</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </PermissionGuard>
  )
}
