"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Bell,
  Shield,
  History,
  Settings,
  Lock,
  Smartphone,
  Mail,
  Globe
} from 'lucide-react'

interface CustomerSettingsProps {
  onConfigureNotifications: () => void
  onConfigureSecurity: () => void
  onViewLoginHistory: () => void
}

const CustomerSettings = ({ 
  onConfigureNotifications, 
  onConfigureSecurity, 
  onViewLoginHistory 
}: CustomerSettingsProps) => {
  return (
    <div className="space-y-6">
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Email Notifications</div>
                  <div className="text-sm text-gray-600">Receive notifications via email</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onConfigureNotifications}>
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">SMS Notifications</div>
                  <div className="text-sm text-gray-600">Receive notifications via SMS</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onConfigureNotifications}>
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Push Notifications</div>
                  <div className="text-sm text-gray-600">Receive notifications in the app</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onConfigureNotifications}>
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your account security and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-600">Add an extra layer of security to your account</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onConfigureSecurity}>
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <History className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Login History</div>
                  <div className="text-sm text-gray-600">View recent login activity and devices</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onViewLoginHistory}>
                View History
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Password Settings</div>
                  <div className="text-sm text-gray-600">Change your password and security questions</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onConfigureSecurity}>
                Change Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Manage your account preferences and personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Email Address</div>
                  <div className="text-sm text-gray-600">Update your email address</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Phone Number</div>
                  <div className="text-sm text-gray-600">Update your phone number</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Language & Region</div>
                  <div className="text-sm text-gray-600">Set your preferred language and region</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerSettings 