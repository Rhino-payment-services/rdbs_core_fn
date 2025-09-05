# Role-Based Access Control (RBAC) Implementation

## Overview
This document describes the RBAC system implemented in the RDBS frontend application.

## Permission System

### Permission Constants
All permissions are defined in `lib/hooks/usePermissions.ts`:

```typescript
export const PERMISSIONS = {
  // User Management
  CREATE_USER: 'user:create',
  UPDATE_USER: 'user:update', 
  DELETE_USER: 'user:delete',
  VIEW_USERS: 'user:read',
  ASSIGN_ROLE: 'user:assign_role',
  ASSIGN_PERMISSIONS: 'user:assign_permissions',
  
  // Role Management
  CREATE_ROLE: 'role:create',
  UPDATE_ROLE: 'role:update',
  DELETE_ROLE: 'role:delete',
  VIEW_ROLES: 'role:read',
  MANAGE_PERMISSIONS: 'permission:manage',
  
  // System Management
  SYSTEM_SETTINGS: 'system:settings',
  SECURITY_MANAGEMENT: 'security:manage',
  
  // Customer Management
  VIEW_CUSTOMERS: 'customer:read',
  UPDATE_CUSTOMERS: 'customer:update',
  DELETE_CUSTOMERS: 'customer:delete',
  
  // Transaction Management
  VIEW_TRANSACTIONS: 'transaction:read',
  APPROVE_TRANSACTIONS: 'transaction:approve',
  REJECT_TRANSACTIONS: 'transaction:reject',
  
  // Wallet Management
  VIEW_WALLETS: 'wallet:read',
  UPDATE_WALLET_BALANCE: 'wallet:update_balance',
  SUSPEND_WALLET: 'wallet:suspend',
  
  // KYC Management
  VIEW_KYC: 'kyc:read',
  APPROVE_KYC: 'kyc:approve',
  REJECT_KYC: 'kyc:reject',
  
  // Reports & Analytics
  VIEW_REPORTS: 'report:read',
  EXPORT_DATA: 'data:export',
  
  // API Management
  MANAGE_API_KEYS: 'api:manage',
  VIEW_API_LOGS: 'api:logs',
}
```

### Role Hierarchy
```typescript
export const ROLE_HIERARCHY = {
  SUPERADMIN: 100,
  ADMIN: 80,
  MANAGER: 60,
  SUPPORT: 40,
  USER: 20,
}
```

## Access Control Rules

### SUPERADMIN
- **Can do everything** - No permission checks required
- Has access to all features and data

### ADMIN
- **Can do most things** except system-level permissions:
  - Cannot delete roles
  - Cannot manage permissions directly
  - Cannot access system settings
- Has access to user management, security, reports, etc.

### Other Roles (MANAGER, SUPPORT, USER)
- **Must have specific permissions** to perform actions
- Permissions are checked individually for each action
- No automatic access based on role alone

## Implementation Components

### 1. usePermissions Hook
Located in `lib/hooks/usePermissions.ts`

**Usage:**
```typescript
const { 
  canCreateUser, 
  canUpdateUser, 
  canDeleteUser,
  hasPermission,
  userRole,
  isLoading 
} = usePermissions()
```

**Features:**
- Fetches permissions from backend
- Provides pre-computed permission checks
- Handles role hierarchy
- Loading states

### 2. PermissionGuard Component
Located in `components/ui/PermissionGuard.tsx`

**Usage:**
```typescript
<PermissionGuard permission={PERMISSIONS.VIEW_USERS}>
  <UsersTable />
</PermissionGuard>

<PermissionGuard 
  permission={PERMISSIONS.CREATE_USER}
  fallback={<AccessDeniedMessage />}
>
  <CreateUserButton />
</PermissionGuard>
```

**Features:**
- Hides/shows components based on permissions
- Custom fallback content
- Loading states
- Multiple permission checks

### 3. RoleGuard Component
Located in `components/ui/PermissionGuard.tsx`

**Usage:**
```typescript
<RoleGuard role="ADMIN">
  <AdminOnlyContent />
</RoleGuard>

<RoleGuard roles={["SUPERADMIN", "ADMIN"]}>
  <ManagementContent />
</RoleGuard>
```

## Applied Examples

### 1. Navbar Menu Items
```typescript
<PermissionGuard permission={PERMISSIONS.VIEW_USERS}>
  <Link href="/dashboard/users">Users</Link>
</PermissionGuard>

<PermissionGuard permission={PERMISSIONS.SECURITY_MANAGEMENT}>
  <Link href="/dashboard/security">Security</Link>
</PermissionGuard>
```

### 2. User Management Page
```typescript
<PermissionGuard permission={PERMISSIONS.VIEW_USERS}>
  <UsersPage />
</PermissionGuard>

<PermissionGuard permission={PERMISSIONS.CREATE_USER}>
  <AddUserButton />
</PermissionGuard>

<PermissionGuard permission={PERMISSIONS.UPDATE_USER}>
  <EditButton />
</PermissionGuard>
```

### 3. Action Buttons
```typescript
<PermissionGuard permission={PERMISSIONS.DELETE_USER}>
  <DeleteButton />
</PermissionGuard>

<PermissionGuard permission={PERMISSIONS.ASSIGN_ROLE}>
  <RoleAssignmentDialog />
</PermissionGuard>
```

## Performance Optimizations

### Session-Based Permissions
- ✅ **No Loading States** - Permissions are stored in session
- ✅ **Instant Access** - No API calls needed for permission checks
- ✅ **Persistent** - Permissions persist across page navigation
- ✅ **Fallback System** - Generates permissions based on role if not in session

### How It Works
1. **Login**: Permissions are fetched from backend and stored in session
2. **Navigation**: Permissions are instantly available from session
3. **Fallback**: If permissions not in session, generated based on role
4. **No Reloads**: Permission checks are instant, no loading states

### Session Storage
```typescript
// Permissions are stored in NextAuth session
session.user.permissions = [
  'user:create',
  'user:read', 
  'customer:read',
  'transaction:read',
  // ... more permissions
]
```

### Fallback Permission Generation
If permissions are not available in session, the system automatically generates them based on role:

```typescript
const rolePermissions: Record<Role, Permission[]> = {
  SUPERADMIN: Object.values(PERMISSIONS), // All permissions
  ADMIN: [/* Most permissions except system-level */],
  MANAGER: [/* Management permissions */],
  SUPPORT: [/* Support permissions */],
  USER: [/* Basic permissions */],
}
```

## Security Benefits

1. **Frontend Security**: Prevents unauthorized UI elements from being displayed
2. **User Experience**: Users only see what they can access
3. **Consistency**: Same permission checks across all components
4. **Maintainability**: Centralized permission logic
5. **Scalability**: Easy to add new permissions and roles

## Best Practices

1. **Always check permissions** before showing sensitive actions
2. **Use PermissionGuard** for UI-level access control
3. **Provide fallback content** for denied access
4. **Handle loading states** while permissions are being fetched
5. **Backend validation** is still required - frontend is for UX only

## Testing Permissions

To test different permission levels:

1. **SUPERADMIN**: Should see everything
2. **ADMIN**: Should see most things except system settings
3. **MANAGER**: Should only see what they have specific permissions for
4. **SUPPORT**: Should only see what they have specific permissions for
5. **USER**: Should only see what they have specific permissions for

## Future Enhancements

1. **Permission Groups**: Group related permissions together
2. **Dynamic Permissions**: Real-time permission updates
3. **Audit Logging**: Track permission usage
4. **Permission Analytics**: Monitor which permissions are used most
5. **Role Templates**: Predefined permission sets for common roles 