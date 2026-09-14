"use client"

import React, { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link as LinkIcon, Save, X, UserSearch, Search, CheckCircle, Wallet, KeyRound } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useLinkWristbandToUser } from '@/lib/hooks/useWristbands'
import { useUsers as useUsersList } from '@/lib/hooks/useAuth'
import { useAllWalletsByUserId } from '@/lib/hooks/useWallets'
import Navbar from '@/components/dashboard/Navbar'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { DASHBOARD_MAIN_CLASS, dashboardFormShellClass } from '@/lib/constants/dashboard-layout'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAdminSetupWalletPin, useWalletPinStatus } from '@/lib/hooks/useWalletPin'

function LinkWristbandContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const linkWristband = useLinkWristbandToUser()
  const { data: usersData } = useUsersList()

  const [formData, setFormData] = useState({
    serialNumber: '',
    userId: '',
    walletId: '',
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<Record<string, unknown> | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<Record<string, unknown> | null>(null)
  const [pinDialogOpen, setPinDialogOpen] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  useEffect(() => {
    const serialNumber = searchParams.get('serialNumber')
    const userId = searchParams.get('userId')
    if (serialNumber) {
      setFormData((prev) => ({
        ...prev,
        serialNumber: decodeURIComponent(serialNumber),
      }))
    }
    if (userId) {
      setFormData((prev) => ({ ...prev, userId }))
    }
  }, [searchParams])

  useEffect(() => {
    const userId = searchParams.get('userId')
    if (!userId || selectedUser) return
    const users = Array.isArray(usersData) ? usersData : usersData?.data || []
    const match = users.find((u: { id: string }) => u.id === userId)
    if (match) {
      setSelectedUser(match)
      setFormData((prev) => ({ ...prev, userId: match.id }))
    }
  }, [searchParams, usersData, selectedUser])

  const filteredUsers = useMemo(() => {
    const users = Array.isArray(usersData) ? usersData : usersData?.data || []
    if (!users.length) return []
    if (!searchTerm.trim()) return users.slice(0, 10)

    const searchLower = searchTerm.toLowerCase()
    return users
      .filter((user: Record<string, unknown>) => {
        const profile = user.profile as Record<string, string> | undefined
        const email = String(user.email || '').toLowerCase()
        const phone = String(user.phone || '').toLowerCase()
        const firstName = String(profile?.firstName || '').toLowerCase()
        const lastName = String(profile?.lastName || '').toLowerCase()
        const fullName = `${firstName} ${lastName}`.trim()
        return (
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          fullName.includes(searchLower)
        )
      })
      .slice(0, 10)
  }, [usersData, searchTerm])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleUserSelect = (user: Record<string, unknown>) => {
    setSelectedUser(user)
    handleInputChange('userId', String(user.id))
    setSearchTerm('')
    setSelectedWallet(null)
    handleInputChange('walletId', '')
  }

  const handleWalletSelect = (wallet: Record<string, unknown>) => {
    setSelectedWallet(wallet)
    handleInputChange('walletId', String(wallet.id))
  }

  const selectedUserId = selectedUser ? String(selectedUser.id) : undefined
  const { data: userWallets = [], isLoading: walletsLoading } =
    useAllWalletsByUserId(selectedUserId)
  const { data: walletPinStatus, refetch: refetchPinStatus } = useWalletPinStatus(
    formData.walletId || undefined,
  )
  const setupWalletPin = useAdminSetupWalletPin()

  const handleSetupWalletPin = async () => {
    if (!formData.walletId) return
    if (!/^\d{4,6}$/.test(newPin)) {
      toast.error('Wallet PIN must be 4–6 digits')
      return
    }
    if (newPin !== confirmPin) {
      toast.error('PIN confirmation does not match')
      return
    }
    try {
      await setupWalletPin.mutateAsync({
        walletId: formData.walletId,
        newPin,
        confirmPin,
      })
      toast.success('Wallet PIN set successfully')
      setPinDialogOpen(false)
      setNewPin('')
      setConfirmPin('')
      await refetchPinStatus()
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string } } }
      toast.error(err?.response?.data?.message || err?.message || 'Failed to set wallet PIN')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.userId) {
      toast.error('Please select a user')
      return
    }
    if (!formData.walletId) {
      toast.error('Please select a wallet')
      return
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(formData.walletId)) {
      toast.error('Invalid wallet selected. Please pick a wallet from the list after it loads.')
      return
    }
    if (!walletPinStatus?.pinEnabled) {
      toast.error('Set a wallet PIN on the selected wallet before linking the wristband.')
      setPinDialogOpen(true)
      return
    }

    try {
      await linkWristband.mutateAsync({
        serialNumber: formData.serialNumber.trim().toUpperCase(),
        userId: formData.userId,
        walletId: formData.walletId,
      })
      toast.success('Wristband linked successfully')
      setTimeout(() => router.push('/dashboard/wristbands'), 1000)
    } catch (error: unknown) {
      const err = error as { message?: string; response?: { data?: { message?: string } } }
      toast.error(
        err?.response?.data?.message || err?.message || 'Failed to link wristband',
      )
    }
  }

  return (
    <DashboardPageLayout variant="form">
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('wristbands/link')} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <LinkIcon className="h-8 w-8 text-[#08163d]" />
          Link Wristband to Customer
        </h1>
        <p className="text-gray-600 mt-2">
          Link a registered wristband to a customer wallet. The wallet must have wallet PIN
          configured before the wristband can be activated.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Link Details</CardTitle>
            <CardDescription>Serial number, customer, and target wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Wristband Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                placeholder="07:C6:31:03"
                disabled={!!searchParams.get('serialNumber')}
                className={searchParams.get('serialNumber') ? 'bg-gray-100' : ''}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userSearch">Search Customer *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="userSearch"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="pl-10"
                />
              </div>
            </div>

            {searchTerm && (
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                <div className="p-2">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No users found matching &quot;{searchTerm}&quot;
                    </div>
                  ) : (
                    filteredUsers.map((user: Record<string, unknown>) => {
                      const profile = user.profile as Record<string, string> | undefined
                      return (
                        <div
                          key={String(user.id)}
                          onClick={() => handleUserSelect(user)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedUser?.id === user.id
                              ? 'bg-[#08163d] text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {profile?.firstName || ''} {profile?.lastName || ''}
                              </div>
                              <div
                                className={`text-sm ${
                                  selectedUser?.id === user.id ? 'text-gray-200' : 'text-gray-500'
                                }`}
                              >
                                {String(user.email || user.phone || 'No contact info')}
                              </div>
                            </div>
                            {selectedUser?.id === user.id && <CheckCircle className="h-5 w-5" />}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {selectedUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <UserSearch className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900 mb-2">Selected Customer</p>
                    <div className="text-sm text-blue-700">
                      {(selectedUser.profile as Record<string, string>)?.firstName}{' '}
                      {(selectedUser.profile as Record<string, string>)?.lastName}
                      {' — '}
                      {String(selectedUser.phone || selectedUser.email || '')}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(null)
                      setSelectedWallet(null)
                      handleInputChange('userId', '')
                      handleInputChange('walletId', '')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {selectedUser && walletsLoading && (
              <div className="text-sm text-gray-500 py-4 text-center">Loading wallets...</div>
            )}

            {selectedUser && !walletsLoading && userWallets.length > 0 && (
              <div className="space-y-2">
                <Label>Select Wallet *</Label>
                <div className="border border-gray-200 rounded-lg p-2">
                  {userWallets.map((wallet) => (
                    <div
                      key={String(wallet.id)}
                      onClick={() => handleWalletSelect(wallet as Record<string, unknown>)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedWallet?.id === wallet.id
                          ? 'bg-[#08163d] text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            {String(wallet.walletType || 'PERSONAL')} Wallet
                          </div>
                          <div
                            className={`text-sm ${
                              selectedWallet?.id === wallet.id ? 'text-gray-200' : 'text-gray-500'
                            }`}
                          >
                            Balance: {Number(wallet.balance || 0).toLocaleString()}{' '}
                            {String(wallet.currency || 'UGX')}
                          </div>
                          {wallet.publicWalletId && (
                            <div
                              className={`text-xs mt-1 ${
                                selectedWallet?.id === wallet.id ? 'text-gray-300' : 'text-gray-400'
                              }`}
                            >
                              RukaPay No. {wallet.publicWalletId}
                            </div>
                          )}
                          {!wallet.isActive || wallet.isSuspended ? (
                            <Badge variant="outline" className="mt-1 text-red-700 border-red-300">
                              Inactive or suspended
                            </Badge>
                          ) : null}
                        </div>
                        {selectedWallet?.id === wallet.id && <CheckCircle className="h-5 w-5" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedUser && !walletsLoading && userWallets.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                This customer has no wallets. Create a wallet before linking a wristband.
              </div>
            )}

            {formData.walletId && walletPinStatus && !walletPinStatus.pinEnabled && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-amber-900">Wallet PIN required</p>
                    <p className="text-sm text-amber-800 mt-1">
                      Set a 4–6 digit wallet PIN on the selected wallet before you can link a
                      wristband. The customer enters this PIN when paying via wristband tap.
                    </p>
                  </div>
                  <Button type="button" size="sm" onClick={() => setPinDialogOpen(true)}>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Set wallet PIN
                  </Button>
                </div>
              </div>
            )}

            {formData.walletId && walletPinStatus?.pinEnabled && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Wallet PIN is configured for the selected wallet.
              </div>
            )}

            <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set wallet PIN</DialogTitle>
                  <DialogDescription>
                    This PIN is separate from the customer&apos;s app login PIN. They will use it
                    when paying with a wristband (4–6 digits, avoid 1234 / 0000).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPin">New wallet PIN</Label>
                    <Input
                      id="newPin"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="4–6 digits"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPin">Confirm wallet PIN</Label>
                    <Input
                      id="confirmPin"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Repeat PIN"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPinDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSetupWalletPin}
                    disabled={setupWalletPin.isPending}
                  >
                    {setupWalletPin.isPending ? 'Saving...' : 'Save wallet PIN'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={linkWristband.isPending || !selectedUser || !formData.walletId}
                className="flex-1"
              >
                {linkWristband.isPending ? 'Linking...' : 'Link Wristband'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </DashboardPageLayout>
  )
}

export default function LinkWristbandPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className={DASHBOARD_MAIN_CLASS}>
            <div className={dashboardFormShellClass}>
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08163d]" />
              </div>
            </div>
          </main>
        </div>
      }
    >
      <LinkWristbandContent />
    </Suspense>
  )
}
