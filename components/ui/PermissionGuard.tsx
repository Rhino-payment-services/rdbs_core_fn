"use client"

import React from 'react'
import { usePermissions, Permission, Role } from '@/lib/hooks/usePermissions'

interface PermissionGuardProps {
  children: React.ReactNode
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  fallback?: React.ReactNode
  showFallback?: boolean
}

interface RoleGuardProps {
  children: React.ReactNode
  role?: string
  roles?: string[]
  requireAll?: boolean
  fallback?: React.ReactNode
  showFallback?: boolean
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  showFallback = false
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
  
  let hasAccess = false
  
  if (permission) {
    hasAccess = hasPermission(permission)
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)
  }
  
  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null
  }
  
  return <>{children}</>
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  role,
  roles,
  requireAll = false,
  fallback = null,
  showFallback = false
}) => {
  const { hasRole, hasAnyRole } = usePermissions()
  
  let hasAccess = false
  
  if (role) {
    hasAccess = hasRole(role as Role)
  } else if (roles) {
    hasAccess = hasAnyRole(roles as Role[])
  }
  
  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null
  }
  
  return <>{children}</>
}

// Higher-Order Components for easier usage
export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  fallback?: React.ReactNode
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props: P) => (
    <PermissionGuard permission={permission} fallback={fallback}>
      <Component {...props} />
    </PermissionGuard>
  )
  WrappedComponent.displayName = `withPermission(${Component.displayName || Component.name})`
  return WrappedComponent
}

export const withRole = <P extends object>(
  Component: React.ComponentType<P>,
  role: string,
  fallback?: React.ReactNode
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props: P) => (
    <RoleGuard role={role} fallback={fallback}>
      <Component {...props} />
    </RoleGuard>
  )
  WrappedComponent.displayName = `withRole(${Component.displayName || Component.name})`
  return WrappedComponent
}

export default PermissionGuard 