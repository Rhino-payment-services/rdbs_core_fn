"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Save as SaveIcon } from 'lucide-react'

interface SecuritySettingsProps {
  settings: {
    passwordMinLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
    passwordExpiryDays: number
    maxLoginAttempts: number
    lockoutDuration: number
    twoFactorAuth: boolean
    sessionTimeout: number
    ipWhitelist: string[]
    geoRestrictions: boolean
    allowedCountries: string[]
    blockedCountries: string[]
  }
  onSettingsChange: (settings: any) => void
  onSave: () => void
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  settings,
  onSettingsChange,
  onSave
}) => {
  return (
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
              value={settings.passwordMinLength}
              onChange={(e) => onSettingsChange({...settings, passwordMinLength: parseInt(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordExpiryDays">Password Expiry (Days)</Label>
            <Input
              id="passwordExpiryDays"
              type="number"
              value={settings.passwordExpiryDays}
              onChange={(e) => onSettingsChange({...settings, passwordExpiryDays: parseInt(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) => onSettingsChange({...settings, maxLoginAttempts: parseInt(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lockoutDuration">Lockout Duration (Minutes)</Label>
            <Input
              id="lockoutDuration"
              type="number"
              value={settings.lockoutDuration}
              onChange={(e) => onSettingsChange({...settings, lockoutDuration: parseInt(e.target.value)})}
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
                checked={settings.requireUppercase}
                onCheckedChange={(checked) => onSettingsChange({...settings, requireUppercase: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="requireLowercase">Require Lowercase Letters</Label>
              <Switch
                id="requireLowercase"
                checked={settings.requireLowercase}
                onCheckedChange={(checked) => onSettingsChange({...settings, requireLowercase: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="requireNumbers">Require Numbers</Label>
              <Switch
                id="requireNumbers"
                checked={settings.requireNumbers}
                onCheckedChange={(checked) => onSettingsChange({...settings, requireNumbers: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="requireSymbols">Require Symbols</Label>
              <Switch
                id="requireSymbols"
                checked={settings.requireSymbols}
                onCheckedChange={(checked) => onSettingsChange({...settings, requireSymbols: checked})}
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
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => onSettingsChange({...settings, twoFactorAuth: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="geoRestrictions">Geographic Restrictions</Label>
                <p className="text-sm text-gray-500">Block access from specific countries</p>
              </div>
              <Switch
                id="geoRestrictions"
                checked={settings.geoRestrictions}
                onCheckedChange={(checked) => onSettingsChange({...settings, geoRestrictions: checked})}
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
