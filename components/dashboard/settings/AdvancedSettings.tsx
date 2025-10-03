"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Save as SaveIcon, Download as DownloadIcon, Upload } from 'lucide-react'

interface AdvancedSettingsProps {
  settings: {
    logLevel: string
    logRetentionDays: number
    backupFrequency: string
    backupRetentionDays: number
    enableAuditLog: boolean
    enablePerformanceMonitoring: boolean
    enableErrorTracking: boolean
    enableAnalytics: boolean
    cacheTimeout: number
    sessionTimeout: number
  }
  onSettingsChange: (settings: any) => void
  onSave: () => void
  onExportSettings: () => void
  onImportSettings: () => void
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  settings,
  onSettingsChange,
  onSave,
  onExportSettings,
  onImportSettings
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Settings</CardTitle>
        <CardDescription>
          System configuration, logging, and monitoring settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="logLevel">Log Level</Label>
            <select
              id="logLevel"
              value={settings.logLevel}
              onChange={(e) => onSettingsChange({...settings, logLevel: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logRetentionDays">Log Retention (Days)</Label>
            <Input
              id="logRetentionDays"
              type="number"
              value={settings.logRetentionDays}
              onChange={(e) => onSettingsChange({...settings, logRetentionDays: parseInt(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backupFrequency">Backup Frequency</Label>
            <select
              id="backupFrequency"
              value={settings.backupFrequency}
              onChange={(e) => onSettingsChange({...settings, backupFrequency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="backupRetentionDays">Backup Retention (Days)</Label>
            <Input
              id="backupRetentionDays"
              type="number"
              value={settings.backupRetentionDays}
              onChange={(e) => onSettingsChange({...settings, backupRetentionDays: parseInt(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cacheTimeout">Cache Timeout (Minutes)</Label>
            <Input
              id="cacheTimeout"
              type="number"
              value={settings.cacheTimeout}
              onChange={(e) => onSettingsChange({...settings, cacheTimeout: parseInt(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Session Timeout (Minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => onSettingsChange({...settings, sessionTimeout: parseInt(e.target.value)})}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Monitoring & Analytics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableAuditLog">Enable Audit Logging</Label>
                <p className="text-sm text-gray-500">Track all system activities</p>
              </div>
              <Switch
                id="enableAuditLog"
                checked={settings.enableAuditLog}
                onCheckedChange={(checked) => onSettingsChange({...settings, enableAuditLog: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enablePerformanceMonitoring">Performance Monitoring</Label>
                <p className="text-sm text-gray-500">Monitor system performance metrics</p>
              </div>
              <Switch
                id="enablePerformanceMonitoring"
                checked={settings.enablePerformanceMonitoring}
                onCheckedChange={(checked) => onSettingsChange({...settings, enablePerformanceMonitoring: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableErrorTracking">Error Tracking</Label>
                <p className="text-sm text-gray-500">Track and report application errors</p>
              </div>
              <Switch
                id="enableErrorTracking"
                checked={settings.enableErrorTracking}
                onCheckedChange={(checked) => onSettingsChange({...settings, enableErrorTracking: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableAnalytics">Analytics</Label>
                <p className="text-sm text-gray-500">Enable user behavior analytics</p>
              </div>
              <Switch
                id="enableAnalytics"
                checked={settings.enableAnalytics}
                onCheckedChange={(checked) => onSettingsChange({...settings, enableAnalytics: checked})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Settings Management</h3>
          <div className="flex gap-4">
            <Button onClick={onExportSettings} variant="outline" className="flex items-center gap-2">
              <DownloadIcon className="h-4 w-4" />
              Export Settings
            </Button>
            <Button onClick={onImportSettings} variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Settings
            </Button>
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
