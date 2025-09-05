"use client"

import React from 'react'
import { useSession } from 'next-auth/react'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const PermissionsDemo = () => {
  const { data: session } = useSession()
  const { 
    userRole, 
    userPermissions, 
    canCreateUser, 
    canViewUsers, 
    canViewTransactions,
    canViewWallets,
    canViewKyc,
    canViewMerchants,
    canViewDocuments,
    canViewTariffs,
    canViewSystemLogs,
    hasPermission 
  } = usePermissions()

  if (!session) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Permissions Demo</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to see your permissions.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current User Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Email:</strong> {session.user?.email}
          </div>
          <div>
            <strong>Role:</strong> <Badge variant="outline">{userRole}</Badge>
          </div>
          <div>
            <strong>Total Permissions:</strong> {userPermissions.length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={canCreateUser ? "default" : "secondary"}>
              {canCreateUser ? "✅" : "❌"}
            </Badge>
            <span>Create User</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={canViewUsers ? "default" : "secondary"}>
              {canViewUsers ? "✅" : "❌"}
            </Badge>
            <span>View Users</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={canViewTransactions ? "default" : "secondary"}>
              {canViewTransactions ? "✅" : "❌"}
            </Badge>
            <span>View Transactions</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={canViewWallets ? "default" : "secondary"}>
              {canViewWallets ? "✅" : "❌"}
            </Badge>
            <span>View Wallets</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={canViewKyc ? "default" : "secondary"}>
              {canViewKyc ? "✅" : "❌"}
            </Badge>
            <span>View KYC</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={canViewMerchants ? "default" : "secondary"}>
              {canViewMerchants ? "✅" : "❌"}
            </Badge>
            <span>View Merchants</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={canViewDocuments ? "default" : "secondary"}>
              {canViewDocuments ? "✅" : "❌"}
            </Badge>
            <span>View Documents</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={canViewTariffs ? "default" : "secondary"}>
              {canViewTariffs ? "✅" : "❌"}
            </Badge>
            <span>View Tariffs</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={canViewSystemLogs ? "default" : "secondary"}>
              {canViewSystemLogs ? "✅" : "❌"}
            </Badge>
            <span>View System Logs</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Permissions ({userPermissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {userPermissions.map((permission, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {permission}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Permission Checks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={hasPermission(PERMISSIONS.SYSTEM_CONFIGURE) ? "default" : "secondary"}>
              {hasPermission(PERMISSIONS.SYSTEM_CONFIGURE) ? "✅" : "❌"}
            </Badge>
            <span>System Configure</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={hasPermission(PERMISSIONS.DELETE_USER) ? "default" : "secondary"}>
              {hasPermission(PERMISSIONS.DELETE_USER) ? "✅" : "❌"}
            </Badge>
            <span>Delete User</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={hasPermission(PERMISSIONS.CREATE_ROLE) ? "default" : "secondary"}>
              {hasPermission(PERMISSIONS.CREATE_ROLE) ? "✅" : "❌"}
            </Badge>
            <span>Create Role</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PermissionsDemo
