"use client"

import React from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, RotateCcw, Eye, EyeOff, Layers } from 'lucide-react'
import { RoleGuard } from '@/components/ui/PermissionGuard'
import { useNavVisibility, NAV_ITEMS, type NavItemKey } from '@/lib/hooks/useNavVisibility'
import toast from 'react-hot-toast'

export default function NavVisibilityPage() {
  const { visibility, setItemVisible, resetToDefaults } = useNavVisibility()

  const handleToggle = (key: NavItemKey, visible: boolean) => {
    setItemVisible(key, visible)
    toast.success(`"${NAV_ITEMS.find(i => i.key === key)?.label}" is now ${visible ? 'visible' : 'hidden'}`)
  }

  const handleResetAll = () => {
    resetToDefaults()
    toast.success('Nav visibility reset to defaults')
  }

  const hiddenCount = Object.values(visibility).filter(v => !v).length

  return (
    <RoleGuard
      role="SUPER_ADMIN"
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">Only Super Admins can manage navigation visibility.</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Navigation Visibility</h1>
                <p className="text-gray-600 mt-1">
                  Control which navigation tabs are visible across the dashboard.
                  Changes apply immediately for all users on this browser.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleResetAll}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
            </div>

            {/* Summary */}
            {hiddenCount > 0 && (
              <div className="mb-6 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm">
                <EyeOff className="h-4 w-4 shrink-0" />
                <span>
                  <strong>{hiddenCount}</strong> navigation tab{hiddenCount > 1 ? 's are' : ' is'} currently hidden.
                </span>
              </div>
            )}

            {/* Nav Items Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Navigation Tabs
                </CardTitle>
                <CardDescription>
                  Toggle each tab on or off. The Dashboard tab is always visible and cannot be hidden.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {/* Dashboard — always visible */}
                <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-700">Dashboard</div>
                      <div className="text-xs text-gray-500">Main dashboard overview</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">Always visible</Badge>
                </div>

                {NAV_ITEMS.map(item => {
                  const isOn = visibility[item.key] ?? true
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between py-3 px-4 rounded-lg border transition-colors ${
                        isOn
                          ? 'bg-white border-gray-200 hover:bg-gray-50'
                          : 'bg-gray-50 border-gray-100 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isOn ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          <Label
                            htmlFor={`nav-${item.key}`}
                            className={`font-medium cursor-pointer ${isOn ? 'text-gray-900' : 'text-gray-500'}`}
                          >
                            {item.label}
                          </Label>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                      </div>
                      <Switch
                        id={`nav-${item.key}`}
                        checked={isOn}
                        onCheckedChange={(checked) => handleToggle(item.key, checked)}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Note: Visibility settings are stored locally in this browser. Permission-based restrictions still apply — hidden items are only visually removed, not access-restricted.
            </p>
          </div>
        </main>
      </div>
    </RoleGuard>
  )
}
