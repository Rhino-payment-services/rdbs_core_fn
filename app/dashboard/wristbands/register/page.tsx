"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Watch, Save, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useRegisterWristband } from '@/lib/hooks/useWristbands'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import toast from 'react-hot-toast'

export default function RegisterWristbandPage() {
  const router = useRouter()
  const registerWristband = useRegisterWristband()

  const [formData, setFormData] = useState({
    serialNumber: '',
    nickname: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await registerWristband.mutateAsync({
        serialNumber: formData.serialNumber.trim().toUpperCase(),
        nickname: formData.nickname.trim() || undefined,
      })
      toast.success('Wristband registered successfully')
      setTimeout(() => router.push('/dashboard/wristbands'), 1000)
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string } } }
      toast.error(
        err?.response?.data?.message || err?.message || 'Failed to register wristband',
      )
    }
  }

  return (
    <DashboardPageLayout variant="form">
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('wristbands/register')} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Watch className="h-8 w-8 text-[#08163d]" />
          Register Wristband
        </h1>
        <p className="text-gray-600 mt-2">
          Register an NFC wristband serial number in the system before linking to a customer
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Wristband Information</CardTitle>
            <CardDescription>
              Enter the NFC tag serial from the physical wristband
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number (Hex) *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                placeholder="07:C6:31:03"
                required
              />
              <p className="text-sm text-gray-500">
                Colon-separated hex format as read from the NFC tag (e.g. 07:C6:31:03)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                placeholder="Blue band — optional"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={registerWristband.isPending} className="flex-1">
                {registerWristband.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Register Wristband
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={registerWristband.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </DashboardPageLayout>
  )
}
