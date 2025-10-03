"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Save as SaveIcon, Eye, EyeOff } from 'lucide-react'

interface ApiSettingsProps {
  settings: {
    apiVersion: string
    rateLimit: number
    rateLimitWindow: number
    webhookUrl: string
    webhookSecret: string
    apiKeyExpiry: number
    corsOrigins: string[]
    enableSwagger: boolean
    enableMetrics: boolean
  }
  onSettingsChange: (settings: any) => void
  onSave: () => void
  showApiKey: boolean
  setShowApiKey: (show: boolean) => void
}

export const ApiSettings: React.FC<ApiSettingsProps> = ({
  settings,
  onSettingsChange,
  onSave,
  showApiKey,
  setShowApiKey
}) => {
  return (
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
              value={settings.apiVersion}
              onChange={(e) => onSettingsChange({...settings, apiVersion: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
            <Input
              id="rateLimit"
              type="number"
              value={settings.rateLimit}
              onChange={(e) => onSettingsChange({...settings, rateLimit: parseInt(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              value={settings.webhookUrl}
              onChange={(e) => onSettingsChange({...settings, webhookUrl: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Webhook Secret</Label>
            <div className="relative">
              <Input
                id="webhookSecret"
                type={showApiKey ? "text" : "password"}
                value={settings.webhookSecret}
                onChange={(e) => onSettingsChange({...settings, webhookSecret: e.target.value})}
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
              value={settings.corsOrigins.join('\n')}
              onChange={(e) => onSettingsChange({...settings, corsOrigins: e.target.value.split('\n').filter(origin => origin.trim())})}
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
                checked={settings.enableSwagger}
                onCheckedChange={(checked) => onSettingsChange({...settings, enableSwagger: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableMetrics">Enable API Metrics</Label>
                <p className="text-sm text-gray-500">Track API usage and performance</p>
              </div>
              <Switch
                id="enableMetrics"
                checked={settings.enableMetrics}
                onCheckedChange={(checked) => onSettingsChange({...settings, enableMetrics: checked})}
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
