"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GeneralSettings } from '@/components/dashboard/settings/GeneralSettings'
import { SecuritySettings } from '@/components/dashboard/settings/SecuritySettings'
import { TransactionSettings } from '@/components/dashboard/settings/TransactionSettings'
import { NotificationSettings } from '@/components/dashboard/settings/NotificationSettings'
import { ApiSettings } from '@/components/dashboard/settings/ApiSettings'
import { AdvancedSettings } from '@/components/dashboard/settings/AdvancedSettings'
import { RolesList } from '@/components/dashboard/settings/RolesList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { usePermissions as useUserPermissions } from '@/lib/hooks/usePermissions'
import { useCreateRole, usePermissions } from '@/lib/hooks/useRoles'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'
import { 
  Settings,
  Shield,
  CreditCard,
  Bell as BellIcon,
  Key as KeyIcon,
  Cog,
  Eye,
  Plus,
  Users,
  FileCheck,
  Building2,
  Store,
  FileText,
  ArrowLeftRight,
  DollarSign,
  ChevronDown,
  ChevronRight,
  BarChart3
} from 'lucide-react'

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general")
  const [showApiKey, setShowApiKey] = useState(false)

  // Role creation state
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissionIds: [] as string[]
  })

  // Category expansion state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Settings state
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'RukaPay',
    systemName: 'RukaPay Core',
    timezone: 'Africa/Kampala',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    language: 'English',
    currency: 'UGX',
    maintenanceMode: false,
    debugMode: false
  })

  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    twoFactorAuth: false,
    sessionTimeout: 30,
    ipWhitelist: [],
    geoRestrictions: false,
    allowedCountries: ['UG', 'KE', 'TZ'],
    blockedCountries: []
  })

  const [transactionSettings, setTransactionSettings] = useState({
    dailyLimit: 1000000,
    monthlyLimit: 10000000,
    maxTransactionAmount: 500000,
    minTransactionAmount: 1000,
    transactionTimeout: 30,
    autoApprovalLimit: 100000,
    requireApproval: true,
    approvalThreshold: 50000,
    feePercentage: 2.5,
    fixedFee: 500,
    refundPolicy: '7 days',
    chargebackPolicy: '30 days'
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    adminAlerts: true,
    userAlerts: true,
    transactionAlerts: true,
    securityAlerts: true,
    systemAlerts: true,
    maintenanceAlerts: true,
    marketingEmails: false
  })

  const [apiSettings, setApiSettings] = useState({
    apiVersion: 'v1',
    rateLimit: 1000,
    rateLimitWindow: 3600,
    webhookUrl: '',
    webhookSecret: '',
    apiKeyExpiry: 365,
    corsOrigins: ['https://app.rukapay.com', 'https://merchant.rukapay.com'],
    enableSwagger: true,
    enableMetrics: true
  })

  const [advancedSettings, setAdvancedSettings] = useState({
    logLevel: 'info',
    logRetentionDays: 30,
    backupFrequency: 'daily',
    backupRetentionDays: 90,
    enableAuditLog: true,
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
    enableAnalytics: false,
    cacheTimeout: 15,
    sessionTimeout: 30
  })

  // API hooks
  const permissionsData = usePermissions()
  const createRoleMutation = useCreateRole()

  const permissions = permissionsData?.data?.permissions || []

  const handleSaveGeneralSettings = () => {
    // TODO: Implement API call to save general settings
    toast.success('General settings saved successfully!')
  }

  const handleSaveSecuritySettings = () => {
    // TODO: Implement API call to save security settings
    toast.success('Security settings saved successfully!')
  }

  const handleSaveTransactionSettings = () => {
    // TODO: Implement API call to save transaction settings
    toast.success('Transaction settings saved successfully!')
  }

  const handleSaveNotificationSettings = () => {
    // TODO: Implement API call to save notification settings
    toast.success('Notification settings saved successfully!')
  }

  const handleSaveApiSettings = () => {
    // TODO: Implement API call to save API settings
    toast.success('API settings saved successfully!')
  }

  const handleSaveAdvancedSettings = () => {
    // TODO: Implement API call to save advanced settings
    toast.success('Advanced settings saved successfully!')
  }

  const handleExportSettings = () => {
    const allSettings = {
      general: generalSettings,
      security: securitySettings,
      transaction: transactionSettings,
      notification: notificationSettings,
      api: apiSettings,
      advanced: advancedSettings
    }
    
    const dataStr = JSON.stringify(allSettings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'rukapay-settings.json'
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success('Settings exported successfully!')
  }

  const handleImportSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const settings = JSON.parse(e.target?.result as string)
            // TODO: Validate and apply settings
            toast.success('Settings imported successfully!')
          } catch (error) {
            toast.error('Invalid settings file!')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleCreateRole = async () => {
    if (!roleForm.name.trim()) {
      toast.error('Role name is required')
      return
    }

    try {
      await createRoleMutation.mutateAsync({
        name: roleForm.name,
        description: roleForm.description,
        permissionIds: roleForm.permissionIds
      })
      
      toast.success('Role created successfully!')
      setRoleForm({ name: '', description: '', permissionIds: [] })
    } catch (error) {
      toast.error(extractErrorMessage(error))
    }
  }

  const handlePermissionToggle = (permissionId: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter(id => id !== permissionId)
        : [...prev.permissionIds, permissionId]
    }))
  }

  // Group permissions by category
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

  const handleCategoryToggle = (categoryPermissions: any[]) => {
    const categoryIds = categoryPermissions.map(p => p.id)
    const allSelected = categoryIds.every(id => roleForm.permissionIds.includes(id))
    
    if (allSelected) {
      // Deselect all permissions in this category
    setRoleForm(prev => ({
      ...prev,
        permissionIds: prev.permissionIds.filter(id => !categoryIds.includes(id))
      }))
    } else {
      // Select all permissions in this category
    setRoleForm(prev => ({
      ...prev,
        permissionIds: [...new Set([...prev.permissionIds, ...categoryIds])]
      }))
    }
  }

  const getCategoryIcon = (categoryName: string) => {
    const icons: { [key: string]: any } = {
      'Dashboard': Cog,
      'Analytics': BarChart3,
      'User Management': Users,
      'Role Management': Shield,
      'Wallet Management': CreditCard,
      'KYC Management': FileCheck,
      'Merchant KYC': Building2,
      'Merchant Management': Store,
      'Document Management': FileText,
      'Transaction Management': ArrowLeftRight,
      'Tariff Management': DollarSign,
      'System Management': Settings
    }
    return icons[categoryName] || Settings
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your system configuration and preferences</p>
          </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <BellIcon className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2">
                <KeyIcon className="h-4 w-4" />
                API
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Cog className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

          <TabsContent value="general">
            <GeneralSettings
              settings={generalSettings}
              onSettingsChange={setGeneralSettings}
              onSave={handleSaveGeneralSettings}
            />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings
              settings={securitySettings}
              onSettingsChange={setSecuritySettings}
              onSave={handleSaveSecuritySettings}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionSettings
              settings={transactionSettings}
              onSettingsChange={setTransactionSettings}
              onSave={handleSaveTransactionSettings}
            />
            </TabsContent>

          <TabsContent value="notifications">
            <NotificationSettings
              settings={notificationSettings}
              onSettingsChange={setNotificationSettings}
              onSave={handleSaveNotificationSettings}
            />
            </TabsContent>

          <TabsContent value="api">
            <ApiSettings
              settings={apiSettings}
              onSettingsChange={setApiSettings}
              onSave={handleSaveApiSettings}
              showApiKey={showApiKey}
              setShowApiKey={setShowApiKey}
            />
            </TabsContent>

          <TabsContent value="roles">
            <div className="space-y-6">
              <Tabs defaultValue="view" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="view" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    View Roles
                  </TabsTrigger>
                  <TabsTrigger value="create" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Role
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="view">
                  <RolesList />
            </TabsContent>

                <TabsContent value="create">
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold text-gray-900">Create New Role</h2>
                      <p className="text-gray-600">
                        Define a new role with specific permissions to control access to system features
                      </p>
                    </div>
                    
              <Card>
                <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Role Information
                        </CardTitle>
                  <CardDescription>
                          Provide basic information about the role
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="roleName">Role Name</Label>
                        <Input
                          id="roleName"
                          value={roleForm.name}
                          onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                            placeholder="e.g., MERCHANT_MANAGER"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roleDescription">Description</Label>
                        <Input
                          id="roleDescription"
                          value={roleForm.description}
                          onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                            placeholder="Brief description of the role"
                        />
                    </div>
                  </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Permissions
                        </CardTitle>
                        <CardDescription>
                          Select the permissions this role should have
                        </CardDescription>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-sm text-gray-500">
                            {roleForm.permissionIds.length} of {permissions.length} permissions selected
                          </div>
                          <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                              onClick={() => setRoleForm(prev => ({ ...prev, permissionIds: permissions.map((p: any) => p.id) }))}
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRoleForm(prev => ({ ...prev, permissionIds: [] }))}
                        >
                              Clear All
                        </Button>
                      </div>
                    </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                          {groupPermissionsByCategory(permissions).map(([categoryName, categoryPermissions]) => {
                            const IconComponent = getCategoryIcon(categoryName)
                            const isExpanded = expandedCategories.has(categoryName)
                            const categoryIds = categoryPermissions.map(p => p.id)
                            const selectedCount = categoryIds.filter(id => roleForm.permissionIds.includes(id)).length
                            const allSelected = selectedCount === categoryPermissions.length
                            const someSelected = selectedCount > 0 && selectedCount < categoryPermissions.length
                            
                            return (
                              <div key={categoryName} className="border rounded-lg">
                                <div 
                                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => setExpandedCategories(prev => {
                                    const newSet = new Set(prev)
                                    if (newSet.has(categoryName)) {
                                      newSet.delete(categoryName)
                                    } else {
                                      newSet.add(categoryName)
                                    }
                                    return newSet
                                  })}
                                >
                                  <div className="flex items-center gap-3">
                                    <IconComponent className="h-5 w-5 text-gray-600" />
                                    <div>
                                      <h3 className="font-medium text-gray-900">{categoryName}</h3>
                                      <p className="text-sm text-gray-500">
                                        {selectedCount} of {categoryPermissions.length} permissions selected
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleCategoryToggle(categoryPermissions)
                                      }}
                                      className="text-xs"
                                    >
                                      {allSelected ? 'Deselect All' : 'Select All'}
                                    </Button>
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-500" />
                                    )}
                                  </div>
                                </div>
                                
                                {isExpanded && (
                                  <div className="border-t p-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                      {categoryPermissions.map((permission) => (
                                        <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                      <Checkbox
                                        id={permission.id}
                                        checked={roleForm.permissionIds.includes(permission.id)}
                                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                                            className="mt-1"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                                          {permission.name}
                                        </Label>
                                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                              {permission.description || `${permission.action} ${permission.resource.toLowerCase()}`}
                                        </p>
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
                      </CardContent>
                    </Card>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleCreateRole} 
                      disabled={createRoleMutation.isPending}
                        className="flex items-center gap-2 px-8"
                        size="lg"
                    >
                        <Plus className="h-4 w-4" />
                        {createRoleMutation.isPending ? 'Creating Role...' : 'Create Role'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedSettings
              settings={advancedSettings}
              onSettingsChange={setAdvancedSettings}
              onSave={handleSaveAdvancedSettings}
              onExportSettings={handleExportSettings}
              onImportSettings={handleImportSettings}
            />
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
