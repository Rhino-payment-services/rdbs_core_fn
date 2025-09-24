"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Save as SaveIcon } from 'lucide-react'

interface NotificationSettingsProps {
  settings: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    adminAlerts: boolean
    userAlerts: boolean
    transactionAlerts: boolean
    securityAlerts: boolean
    systemAlerts: boolean
    maintenanceAlerts: boolean
    marketingEmails: boolean
  }
  onSettingsChange: (settings: any) => void
  onSave: () => void
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  settings,
  onSettingsChange,
  onSave
}) => {
  return (
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
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => onSettingsChange({...settings, emailNotifications: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <p className="text-sm text-gray-500">Send notifications via SMS</p>
              </div>
              <Switch
                id="smsNotifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => onSettingsChange({...settings, smsNotifications: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <p className="text-sm text-gray-500">Send push notifications to mobile apps</p>
              </div>
              <Switch
                id="pushNotifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => onSettingsChange({...settings, pushNotifications: checked})}
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
                checked={settings.adminAlerts}
                onCheckedChange={(checked) => onSettingsChange({...settings, adminAlerts: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="transactionAlerts">Transaction Alerts</Label>
                <p className="text-sm text-gray-500">Transaction-related notifications</p>
              </div>
              <Switch
                id="transactionAlerts"
                checked={settings.transactionAlerts}
                onCheckedChange={(checked) => onSettingsChange({...settings, transactionAlerts: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="securityAlerts">Security Alerts</Label>
                <p className="text-sm text-gray-500">Security and fraud notifications</p>
              </div>
              <Switch
                id="securityAlerts"
                checked={settings.securityAlerts}
                onCheckedChange={(checked) => onSettingsChange({...settings, securityAlerts: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="systemAlerts">System Alerts</Label>
                <p className="text-sm text-gray-500">System maintenance and updates</p>
              </div>
              <Switch
                id="systemAlerts"
                checked={settings.systemAlerts}
                onCheckedChange={(checked) => onSettingsChange({...settings, systemAlerts: checked})}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} className="flex items-center gap-2">
            <SaveIcon className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
