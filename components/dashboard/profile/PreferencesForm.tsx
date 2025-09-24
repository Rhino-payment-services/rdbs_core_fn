"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Globe, Shield, Save, X } from 'lucide-react'

interface PreferencesFormProps {
  preferences: {
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    twoFactorAuth: boolean
    language: string
    timezone: string
    currency: string
    theme: string
  }
  onPreferencesChange: (preferences: any) => void
  onSave: () => void
  onCancel: () => void
  isLoading: boolean
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  preferences,
  onPreferencesChange,
  onSave,
  onCancel,
  isLoading
}) => {
  const handlePreferenceChange = (field: string, value: any) => {
    onPreferencesChange({
      ...preferences,
      [field]: value
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Preferences
        </CardTitle>
        <CardDescription>
          Customize your notification and display preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via SMS</p>
              </div>
              <Switch
                id="smsNotifications"
                checked={preferences.smsNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('smsNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pushNotifications">Push Notifications</Label>
                <p className="text-sm text-gray-500">Receive push notifications in browser</p>
              </div>
              <Switch
                id="pushNotifications"
                checked={preferences.pushNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </h3>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <Switch
              id="twoFactorAuth"
              checked={preferences.twoFactorAuth}
              onCheckedChange={(checked) => handlePreferenceChange('twoFactorAuth', checked)}
            />
          </div>
        </div>

        {/* Display Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Display Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select 
                value={preferences.language} 
                onValueChange={(value) => handlePreferenceChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sw">Swahili</SelectItem>
                  <SelectItem value="lg">Luganda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={preferences.timezone} 
                onValueChange={(value) => handlePreferenceChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Kampala">Africa/Kampala (UTC+3)</SelectItem>
                  <SelectItem value="Africa/Nairobi">Africa/Nairobi (UTC+3)</SelectItem>
                  <SelectItem value="Africa/Dar_es_Salaam">Africa/Dar es Salaam (UTC+3)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={preferences.currency} 
                onValueChange={(value) => handlePreferenceChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UGX">Ugandan Shilling (UGX)</SelectItem>
                  <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                  <SelectItem value="TZS">Tanzanian Shilling (TZS)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select 
                value={preferences.theme} 
                onValueChange={(value) => handlePreferenceChange('theme', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
