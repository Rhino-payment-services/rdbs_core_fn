"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { usePermissions, useCreateRole } from '@/lib/hooks/useApi'
import toast from 'react-hot-toast'
import { extractErrorMessage } from '@/lib/utils'
import { 
  RefreshCw,
  Settings,
  Shield,
  Database,
  CreditCard,
  FileText,
  BarChart3,
  DollarSign,
  Activity,
  Users,
  Cog,
  Bell as BellIcon,
  Shield as ShieldIcon,
  CreditCard as CreditCardIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Plus,
  Download as DownloadIcon,
  Upload,
  Key as KeyIcon,
  Eye,
  EyeOff,
  UserCheck
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

  // API hooks
  const { data: permissionsData, isLoading: permissionsLoading } = usePermissions()
  const createRoleMutation = useCreateRole()

  console.log("permissionsData",permissionsData)

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: "RukaPay",
    systemName: "RDBS",
    timezone: "Africa/Kampala",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    language: "English",
    currency: "UGX",
    maintenanceMode: false,
    debugMode: false
  })

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    twoFactorAuth: true,
    sessionTimeout: 60,
    ipWhitelist: [],
    geoRestrictions: true,
    allowedCountries: ["Uganda", "Kenya", "Tanzania"],
    blockedCountries: ["North Korea", "Iran", "Syria"]
  })

  // Transaction Settings
  const [transactionSettings, setTransactionSettings] = useState({
    dailyLimit: 5000000,
    monthlyLimit: 50000000,
    maxTransactionAmount: 10000000,
    minTransactionAmount: 1000,
    transactionTimeout: 300,
    autoApprovalLimit: 1000000,
    requireApproval: true,
    approvalThreshold: 2000000,
    feePercentage: 0.5,
    fixedFee: 2500,
    refundPolicy: "7 days",
    chargebackPolicy: "30 days"
  })

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    adminAlerts: true,
    userAlerts: true,
    transactionAlerts: true,
    securityAlerts: true,
    systemAlerts: true,
    maintenanceAlerts: true,
    marketingEmails: false
  })

  // API Settings
  const [apiSettings, setApiSettings] = useState({
    apiVersion: "v2.1",
    rateLimit: 1000,
    rateLimitWindow: 3600,
    webhookUrl: "https://api.rukapay.com/webhooks",
    webhookSecret: "whsec_abc123def456",
    apiKeyExpiry: 365,
    corsOrigins: ["https://app.rukapay.com", "https://merchant.rukapay.com"],
    enableSwagger: true,
    enableMetrics: true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleSave = (section: string) => {
    console.log(`Saving ${section} settings...`)
    // Here you would typically save to backend
  }

  const handleCreateRole = async () => {
    if (!roleForm.name || !roleForm.description || roleForm.permissionIds.length === 0) {
      toast.error('Please fill in all fields and select at least one permission')
      return
    }

    try {
      await createRoleMutation.mutateAsync(roleForm)
      toast.success('Role created successfully!')
      setRoleForm({ name: '', description: '', permissionIds: [] })
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      toast.error(errorMessage)
      console.error('Error creating role:', error)
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

  // Helper function to group permissions by resource
  const groupPermissionsByResource = (permissions: any[]) => {
    const grouped: { [key: string]: any[] } = {}
    permissions.forEach(permission => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = []
      }
      grouped[permission.resource].push(permission)
    })
    return grouped
  }

  // Get resource display name and icon
  const getResourceInfo = (resource: string) => {
    const resourceInfo: { [key: string]: { name: string; icon: any; color: string } } = {
      users: { name: 'Users', icon: Users, color: 'bg-blue-100 text-blue-800' },
      roles: { name: 'Roles', icon: Shield, color: 'bg-purple-100 text-purple-800' },
      wallets: { name: 'Wallets', icon: CreditCard, color: 'bg-green-100 text-green-800' },
      kyc: { name: 'KYC', icon: UserCheck, color: 'bg-orange-100 text-orange-800' },
      documents: { name: 'Documents', icon: FileText, color: 'bg-yellow-100 text-yellow-800' },
      transactions: { name: 'Transactions', icon: BarChart3, color: 'bg-indigo-100 text-indigo-800' },
      tariffs: { name: 'Tariffs', icon: DollarSign, color: 'bg-red-100 text-red-800' },
      system: { name: 'System', icon: Settings, color: 'bg-gray-100 text-gray-800' }
    }
    return resourceInfo[resource] || { name: resource, icon: Cog, color: 'bg-gray-100 text-gray-800' }
  }

  // Helper functions for bulk selection
  const selectAllInResource = (resource: string) => {
    const permissions = permissionsData?.permissions || []
    const resourcePermissions = permissions.filter((p: any) => p.resource === resource)
    const resourcePermissionIds = resourcePermissions.map((p: any) => p.id)
    
    setRoleForm(prev => ({
      ...prev,
      permissionIds: [...new Set([...prev.permissionIds, ...resourcePermissionIds])]
    }))
  }

  const selectNoneInResource = (resource: string) => {
    const permissions = permissionsData?.permissions || []
    const resourcePermissions = permissions.filter((p: any) => p.resource === resource)
    const resourcePermissionIds = resourcePermissions.map((p: any) => p.id)
    
    setRoleForm(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.filter(id => !resourcePermissionIds.includes(id))
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-gray-600">Configure system settings, security policies, and preferences</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <DownloadIcon className="h-4 w-4" />
                  Export Config
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Import Config
                </Button>
              </div>
            </div>
          </div>

          {/* Settings Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <ShieldIcon className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <CreditCardIcon className="h-4 w-4" />
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
                <Users className="h-4 w-4" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Cog className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Basic system configuration and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={generalSettings.companyName}
                        onChange={(e) => setGeneralSettings({...generalSettings, companyName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="systemName">System Name</Label>
                      <Input
                        id="systemName"
                        value={generalSettings.systemName}
                        onChange={(e) => setGeneralSettings({...generalSettings, systemName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={generalSettings.timezone} onValueChange={(value: string) => setGeneralSettings({...generalSettings, timezone: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Kampala">Africa/Kampala (UTC+3)</SelectItem>
                          <SelectItem value="Africa/Nairobi">Africa/Nairobi (UTC+3)</SelectItem>
                          <SelectItem value="Africa/Dar_es_Salaam">Africa/Dar es Salaam (UTC+3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={generalSettings.language} onValueChange={(value: string) => setGeneralSettings({...generalSettings, language: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Swahili">Swahili</SelectItem>
                          <SelectItem value="Luganda">Luganda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">Enable maintenance mode to restrict access</p>
                    </div>
                    <Switch
                      id="maintenanceMode"
                      checked={generalSettings.maintenanceMode}
                      onCheckedChange={(checked: boolean) => setGeneralSettings({...generalSettings, maintenanceMode: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="debugMode">Debug Mode</Label>
                      <p className="text-sm text-gray-500">Enable debug logging for development</p>
                    </div>
                    <Switch
                      id="debugMode"
                      checked={generalSettings.debugMode}
                      onCheckedChange={(checked: boolean) => setGeneralSettings({...generalSettings, debugMode: checked})}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSave('general')} className="flex items-center gap-2">
                      <SaveIcon className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6 mt-6">
              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure security policies and authentication requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        value={securitySettings.passwordMinLength}
                        onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordExpiryDays">Password Expiry (Days)</Label>
                      <Input
                        id="passwordExpiryDays"
                        type="number"
                        value={securitySettings.passwordExpiryDays}
                        onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiryDays: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lockoutDuration">Lockout Duration (Minutes)</Label>
                      <Input
                        id="lockoutDuration"
                        type="number"
                        value={securitySettings.lockoutDuration}
                        onChange={(e) => setSecuritySettings({...securitySettings, lockoutDuration: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Password Requirements</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requireUppercase">Require Uppercase Letters</Label>
                        <Switch
                          id="requireUppercase"
                          checked={securitySettings.requireUppercase}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireUppercase: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requireLowercase">Require Lowercase Letters</Label>
                        <Switch
                          id="requireLowercase"
                          checked={securitySettings.requireLowercase}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireLowercase: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requireNumbers">Require Numbers</Label>
                        <Switch
                          id="requireNumbers"
                          checked={securitySettings.requireNumbers}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireNumbers: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="requireSymbols">Require Symbols</Label>
                        <Switch
                          id="requireSymbols"
                          checked={securitySettings.requireSymbols}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireSymbols: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Authentication</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                          <p className="text-sm text-gray-500">Require 2FA for all users</p>
                        </div>
                        <Switch
                          id="twoFactorAuth"
                          checked={securitySettings.twoFactorAuth}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="geoRestrictions">Geographic Restrictions</Label>
                          <p className="text-sm text-gray-500">Block access from specific countries</p>
                        </div>
                        <Switch
                          id="geoRestrictions"
                          checked={securitySettings.geoRestrictions}
                          onCheckedChange={(checked) => setSecuritySettings({...securitySettings, geoRestrictions: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSave('security')} className="flex items-center gap-2">
                      <SaveIcon className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6 mt-6">
              {/* Transaction Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Settings</CardTitle>
                  <CardDescription>
                    Configure transaction limits, fees, and approval workflows
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="dailyLimit">Daily Limit</Label>
                      <Input
                        id="dailyLimit"
                        type="number"
                        value={transactionSettings.dailyLimit}
                        onChange={(e) => setTransactionSettings({...transactionSettings, dailyLimit: parseInt(e.target.value)})}
                      />
                      <p className="text-sm text-gray-500">{formatCurrency(transactionSettings.dailyLimit)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyLimit">Monthly Limit</Label>
                      <Input
                        id="monthlyLimit"
                        type="number"
                        value={transactionSettings.monthlyLimit}
                        onChange={(e) => setTransactionSettings({...transactionSettings, monthlyLimit: parseInt(e.target.value)})}
                      />
                      <p className="text-sm text-gray-500">{formatCurrency(transactionSettings.monthlyLimit)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxTransactionAmount">Max Transaction Amount</Label>
                      <Input
                        id="maxTransactionAmount"
                        type="number"
                        value={transactionSettings.maxTransactionAmount}
                        onChange={(e) => setTransactionSettings({...transactionSettings, maxTransactionAmount: parseInt(e.target.value)})}
                      />
                      <p className="text-sm text-gray-500">{formatCurrency(transactionSettings.maxTransactionAmount)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minTransactionAmount">Min Transaction Amount</Label>
                      <Input
                        id="minTransactionAmount"
                        type="number"
                        value={transactionSettings.minTransactionAmount}
                        onChange={(e) => setTransactionSettings({...transactionSettings, minTransactionAmount: parseInt(e.target.value)})}
                      />
                      <p className="text-sm text-gray-500">{formatCurrency(transactionSettings.minTransactionAmount)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="feePercentage">Fee Percentage (%)</Label>
                      <Input
                        id="feePercentage"
                        type="number"
                        step="0.1"
                        value={transactionSettings.feePercentage}
                        onChange={(e) => setTransactionSettings({...transactionSettings, feePercentage: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fixedFee">Fixed Fee</Label>
                      <Input
                        id="fixedFee"
                        type="number"
                        value={transactionSettings.fixedFee}
                        onChange={(e) => setTransactionSettings({...transactionSettings, fixedFee: parseInt(e.target.value)})}
                      />
                      <p className="text-sm text-gray-500">{formatCurrency(transactionSettings.fixedFee)}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Approval Workflow</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="requireApproval">Require Approval</Label>
                          <p className="text-sm text-gray-500">Enable manual approval for transactions</p>
                        </div>
                        <Switch
                          id="requireApproval"
                          checked={transactionSettings.requireApproval}
                          onCheckedChange={(checked) => setTransactionSettings({...transactionSettings, requireApproval: checked})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="approvalThreshold">Approval Threshold</Label>
                        <Input
                          id="approvalThreshold"
                          type="number"
                          value={transactionSettings.approvalThreshold}
                          onChange={(e) => setTransactionSettings({...transactionSettings, approvalThreshold: parseInt(e.target.value)})}
                        />
                        <p className="text-sm text-gray-500">{formatCurrency(transactionSettings.approvalThreshold)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSave('transactions')} className="flex items-center gap-2">
                      <SaveIcon className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-6">
              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure notification preferences and alert settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Channels</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="emailNotifications">Email Notifications</Label>
                          <p className="text-sm text-gray-500">Send notifications via email</p>
                        </div>
                        <Switch
                          id="emailNotifications"
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="smsNotifications">SMS Notifications</Label>
                          <p className="text-sm text-gray-500">Send notifications via SMS</p>
                        </div>
                        <Switch
                          id="smsNotifications"
                          checked={notificationSettings.smsNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="pushNotifications">Push Notifications</Label>
                          <p className="text-sm text-gray-500">Send push notifications to mobile apps</p>
                        </div>
                        <Switch
                          id="pushNotifications"
                          checked={notificationSettings.pushNotifications}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Alert Types</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="adminAlerts">Admin Alerts</Label>
                          <p className="text-sm text-gray-500">System administration notifications</p>
                        </div>
                        <Switch
                          id="adminAlerts"
                          checked={notificationSettings.adminAlerts}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, adminAlerts: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="transactionAlerts">Transaction Alerts</Label>
                          <p className="text-sm text-gray-500">Transaction-related notifications</p>
                        </div>
                        <Switch
                          id="transactionAlerts"
                          checked={notificationSettings.transactionAlerts}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, transactionAlerts: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="securityAlerts">Security Alerts</Label>
                          <p className="text-sm text-gray-500">Security and fraud notifications</p>
                        </div>
                        <Switch
                          id="securityAlerts"
                          checked={notificationSettings.securityAlerts}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, securityAlerts: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="systemAlerts">System Alerts</Label>
                          <p className="text-sm text-gray-500">System maintenance and updates</p>
                        </div>
                        <Switch
                          id="systemAlerts"
                          checked={notificationSettings.systemAlerts}
                          onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemAlerts: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSave('notifications')} className="flex items-center gap-2">
                      <SaveIcon className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="space-y-6 mt-6">
              {/* API Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>API Settings</CardTitle>
                  <CardDescription>
                    Configure API endpoints, rate limits, and webhook settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="apiVersion">API Version</Label>
                      <Input
                        id="apiVersion"
                        value={apiSettings.apiVersion}
                        onChange={(e) => setApiSettings({...apiSettings, apiVersion: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        value={apiSettings.rateLimit}
                        onChange={(e) => setApiSettings({...apiSettings, rateLimit: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhookUrl">Webhook URL</Label>
                      <Input
                        id="webhookUrl"
                        value={apiSettings.webhookUrl}
                        onChange={(e) => setApiSettings({...apiSettings, webhookUrl: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhookSecret">Webhook Secret</Label>
                      <div className="relative">
                        <Input
                          id="webhookSecret"
                          type={showApiKey ? "text" : "password"}
                          value={apiSettings.webhookSecret}
                          onChange={(e) => setApiSettings({...apiSettings, webhookSecret: e.target.value})}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">CORS Settings</h3>
                    <div className="space-y-2">
                      <Label htmlFor="corsOrigins">Allowed Origins</Label>
                      <Textarea
                        id="corsOrigins"
                        value={apiSettings.corsOrigins.join('\n')}
                        onChange={(e) => setApiSettings({...apiSettings, corsOrigins: e.target.value.split('\n').filter(origin => origin.trim())})}
                        placeholder="https://app.rukapay.com&#10;https://merchant.rukapay.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">API Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableSwagger">Enable Swagger Documentation</Label>
                          <p className="text-sm text-gray-500">Enable API documentation at /docs</p>
                        </div>
                        <Switch
                          id="enableSwagger"
                          checked={apiSettings.enableSwagger}
                          onCheckedChange={(checked) => setApiSettings({...apiSettings, enableSwagger: checked})}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="enableMetrics">Enable API Metrics</Label>
                          <p className="text-sm text-gray-500">Track API usage and performance</p>
                        </div>
                        <Switch
                          id="enableMetrics"
                          checked={apiSettings.enableMetrics}
                          onCheckedChange={(checked) => setApiSettings({...apiSettings, enableMetrics: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => handleSave('api')} className="flex items-center gap-2">
                      <SaveIcon className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="space-y-6 mt-6">
              {/* Roles Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Role Management</CardTitle>
                  <CardDescription>
                    Create and manage user roles with specific permissions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Create New Role</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="roleName">Role Name</Label>
                        <Input
                          id="roleName"
                          placeholder="e.g., FINANCIAL_OPS"
                          value={roleForm.name}
                          onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roleDescription">Description</Label>
                        <Input
                          id="roleDescription"
                          placeholder="e.g., Financial operations specialist"
                          value={roleForm.description}
                          onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Select Permissions</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {roleForm.permissionIds.length} selected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allPermissionIds = permissionsData?.permissions?.map((p: any) => p.id) || []
                            setRoleForm(prev => ({ ...prev, permissionIds: allPermissionIds }))
                          }}
                          className="text-xs"
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRoleForm(prev => ({ ...prev, permissionIds: [] }))}
                          className="text-xs"
                        >
                          Select None
                        </Button>
                      </div>
                    </div>
                    
                    {permissionsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-500">Loading permissions...</span>
                      </div>
                    ) : (
                      <div className="space-y-6 max-h-96 overflow-y-auto border rounded-lg p-4">
                        {(() => {
                          const permissions = permissionsData?.permissions || []
                          const groupedPermissions = groupPermissionsByResource(permissions)
                          
                          return Object.entries(groupedPermissions).map(([resource, resourcePermissions]) => {
                            const resourceInfo = getResourceInfo(resource)
                            const ResourceIcon = resourceInfo.icon
                            
                            return (
                              <div key={resource} className="space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-lg ${resourceInfo.color}`}>
                                      <ResourceIcon className="h-4 w-4" />
                                    </div>
                                    <h4 className="font-medium text-gray-900">{resourceInfo.name}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {resourcePermissions.length} permissions
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => selectAllInResource(resource)}
                                      className="text-xs"
                                    >
                                      Select All
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => selectNoneInResource(resource)}
                                      className="text-xs"
                                    >
                                      Select None
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {resourcePermissions.map((permission) => (
                                    <div key={permission.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                      <Checkbox
                                        id={permission.id}
                                        checked={roleForm.permissionIds.includes(permission.id)}
                                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                                          {permission.name}
                                        </Label>
                                        <p className="text-xs text-gray-500 truncate">
                                          {permission.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline" className="text-xs">
                                            {permission.action}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleCreateRole} 
                      disabled={createRoleMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {createRoleMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 mt-6">
              {/* Advanced Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>
                    Advanced system configuration and maintenance options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">System Maintenance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Backup Database
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Clear Cache
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Generate Reports
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        System Health Check
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Danger Zone</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                        <div>
                          <h4 className="font-medium text-red-800">Reset All Settings</h4>
                          <p className="text-sm text-red-600">This will reset all settings to default values</p>
                        </div>
                        <Button variant="destructive" size="sm">
                          Reset Settings
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                        <div>
                          <h4 className="font-medium text-red-800">Delete All Data</h4>
                          <p className="text-sm text-red-600">This action cannot be undone</p>
                        </div>
                        <Button variant="destructive" size="sm">
                          Delete Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default SettingsPage
