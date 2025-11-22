"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Search, Plus, Minus, Save, X, Shield } from 'lucide-react'
import { useUserPermissions, useUpdateUserPermissions, useAllPermissions } from '@/lib/hooks/useUserPermissions'
import { Permission } from '@/lib/hooks/useUserPermissions'
import toast from 'react-hot-toast'

interface EditUserPermissionsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName: string
}

const EditUserPermissionsModal: React.FC<EditUserPermissionsModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState<'add' | 'remove' | 'replace'>('add')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  // API hooks
  const { data: userPermissions, isLoading: isLoadingUserPermissions } = useUserPermissions(userId)
  const { data: allPermissions, isLoading: isLoadingAllPermissions } = useAllPermissions()
  const updatePermissionsMutation = useUpdateUserPermissions()

  // Get current user permissions
  const currentPermissionIds = userPermissions?.permissions?.map(p => p.id) || []

  // Filter permissions based on search term
  const filteredPermissions = allPermissions?.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.action.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Group permissions by resource
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    const resource = permission.resource
    if (!acc[resource]) {
      acc[resource] = []
    }
    acc[resource].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId)
      } else {
        return [...prev, permissionId]
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedPermissions(filteredPermissions.map(p => p.id))
  }

  const handleDeselectAll = () => {
    setSelectedPermissions([])
  }

  const handleSave = async () => {
    if (selectedPermissions.length === 0) {
      toast.error('Please select at least one permission')
      return
    }

    try {
      await updatePermissionsMutation.mutateAsync({
        userId,
        data: {
          permissionIds: selectedPermissions,
          action: selectedAction
        }
      })
      
      toast.success(`Permissions ${selectedAction}ed successfully!`)
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update permissions')
    }
  }

  const getPermissionBadgeVariant = (permissionId: string) => {
    const hasPermission = currentPermissionIds.includes(permissionId)
    const isSelected = selectedPermissions.includes(permissionId)
    
    if (hasPermission && isSelected) {
      return selectedAction === 'remove' ? 'destructive' : 'default'
    } else if (hasPermission) {
      return 'secondary'
    } else if (isSelected) {
      return 'default'
    } else {
      return 'outline'
    }
  }

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedPermissions([])
      setSearchTerm('')
      setSelectedAction('add')
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Edit Permissions - {userName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Selection */}
          <div className="flex items-center gap-4">
            <Label htmlFor="action">Action:</Label>
            <Select value={selectedAction} onValueChange={(value: 'add' | 'remove' | 'replace') => setSelectedAction(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    Add Permissions
                  </div>
                </SelectItem>
                <SelectItem value="remove">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-600" />
                    Remove Permissions
                  </div>
                </SelectItem>
                <SelectItem value="replace">
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4 text-blue-600" />
                    Replace All Permissions
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                Deselect All
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} selected
            </div>
          </div>

          {/* Current Permissions Summary */}
          {currentPermissionIds.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Current Permissions ({currentPermissionIds.length})</h4>
              <div className="flex flex-wrap gap-2">
                {userPermissions?.permissions?.map(permission => (
                  <Badge key={permission.id} variant="secondary" className="text-xs">
                    {permission.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Permissions List */}
          <ScrollArea className="h-96">
            {isLoadingAllPermissions ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading permissions...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                  <div key={resource} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {resource.replace(/_/g, ' ')}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 pl-4">
                      {permissions.map(permission => (
                        <div key={permission.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={() => handlePermissionToggle(permission.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={permission.id} className="font-medium cursor-pointer">
                                {permission.name}
                              </Label>
                              <Badge variant={getPermissionBadgeVariant(permission.id)} className="text-xs">
                                {currentPermissionIds.includes(permission.id) ? 'Current' : 'New'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {permission.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-2" />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={selectedPermissions.length === 0 || updatePermissionsMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updatePermissionsMutation.isPending ? 'Saving...' : `Save Changes`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default EditUserPermissionsModal
