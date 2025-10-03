"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Save as SaveIcon } from 'lucide-react'

interface GeneralSettingsProps {
  settings: {
    companyName: string
    systemName: string
    timezone: string
    dateFormat: string
    timeFormat: string
    language: string
    currency: string
    maintenanceMode: boolean
    debugMode: boolean
  }
  onSettingsChange: (settings: any) => void
  onSave: () => void
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  settings,
  onSettingsChange,
  onSave
}) => {
  return (
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
              value={settings.companyName}
              onChange={(e) => onSettingsChange({...settings, companyName: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="systemName">System Name</Label>
            <Input
              id="systemName"
              value={settings.systemName}
              onChange={(e) => onSettingsChange({...settings, systemName: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={settings.timezone} onValueChange={(value: string) => onSettingsChange({...settings, timezone: value})}>
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
            <Select value={settings.language} onValueChange={(value: string) => onSettingsChange({...settings, language: value})}>
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
            checked={settings.maintenanceMode}
            onCheckedChange={(checked: boolean) => onSettingsChange({...settings, maintenanceMode: checked})}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="debugMode">Debug Mode</Label>
            <p className="text-sm text-gray-500">Enable debug logging for development</p>
          </div>
          <Switch
            id="debugMode"
            checked={settings.debugMode}
            onCheckedChange={(checked: boolean) => onSettingsChange({...settings, debugMode: checked})}
          />
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
