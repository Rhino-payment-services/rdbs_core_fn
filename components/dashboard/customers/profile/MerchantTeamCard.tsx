'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Users, Plus, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/axios'
import { extractErrorMessage } from '@/lib/utils'

type MerchantTeamWallet = {
  id: string
  walletType: string
  publicWalletId?: string | null
  balance?: number
  currency?: string
}

type UniqueMember = {
  email: string
  userId: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  role: string
  status: string
  canLiquidate: boolean
  wallets: Array<{
    walletId: string
    walletType: string | null
    publicWalletId: string | null
    memberId: string
  }>
}

type MerchantTeamResponse = {
  wallets: MerchantTeamWallet[]
  uniqueMembers: UniqueMember[]
}

function walletTypeLabel(wt: string | undefined | null): string {
  if (!wt) return 'Wallet'
  const t = wt.toUpperCase()
  if (t === 'BUSINESS') return 'Business'
  if (t === 'BUSINESS_COLLECTION') return 'Collection'
  if (t === 'BUSINESS_DISBURSEMENT' || t === 'BUSINESS_LIQUIDATION') return 'Disbursement'
  return wt.replace(/_/g, ' ')
}

export function MerchantTeamCard({ merchantId }: { merchantId: string }) {
  const [data, setData] = useState<MerchantTeamResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncingEmail, setSyncingEmail] = useState<string | null>(null)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'ADMIN',
    canLiquidate: true,
    canViewBalance: true,
    canViewTransactions: true,
    canInitiatePayments: true,
  })

  const loadTeam = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/merchant-kyc/${merchantId}/team`)
      setData(res.data)
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to load merchant team'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (merchantId) {
      loadTeam()
    }
  }, [merchantId])

  const handleInvite = async () => {
    if (!inviteForm.email.trim()) {
      toast.error('Email is required')
      return
    }
    setSaving(true)
    try {
      await api.post(`/merchant-kyc/${merchantId}/team/invite`, {
        email: inviteForm.email.trim(),
        firstName: inviteForm.firstName.trim() || undefined,
        lastName: inviteForm.lastName.trim() || undefined,
        phoneNumber: inviteForm.phoneNumber.trim() || undefined,
        role: inviteForm.role,
        canLiquidate: inviteForm.canLiquidate,
        canViewBalance: inviteForm.canViewBalance,
        canViewTransactions: inviteForm.canViewTransactions,
        canInitiatePayments: inviteForm.canInitiatePayments,
      })
      toast.success('Team member invited to all merchant wallets')
      setInviteOpen(false)
      setInviteForm({
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        role: 'ADMIN',
        canLiquidate: true,
        canViewBalance: true,
        canViewTransactions: true,
        canInitiatePayments: true,
      })
      await loadTeam()
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to invite team member'))
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async (email: string) => {
    setSyncingEmail(email)
    try {
      const res = await api.post(`/merchant-kyc/${merchantId}/team/members/sync-by-email`, {
        email,
      })
      const mirrored = res.data?.mirrored ?? 0
      toast.success(
        mirrored > 0
          ? `Granted ${mirrored} missing wallet${mirrored === 1 ? '' : 's'}`
          : 'Member already has all merchant wallets',
      )
      await loadTeam()
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to grant all wallets'))
    } finally {
      setSyncingEmail(null)
    }
  }

  const walletCount = data?.wallets?.length ?? 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Merchant Team
            </CardTitle>
            <CardDescription>
              Team members get collection and disbursement wallets automatically. Use Grant all wallets for people invited to only one wallet.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Invite member
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <div className="text-sm text-gray-500">Loading team...</div>}

        {!loading && (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              {(data?.wallets || []).map((wallet) => (
                <div key={wallet.id} className="border rounded-lg p-3">
                  <div className="text-sm font-medium">{walletTypeLabel(wallet.walletType)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    RukaPay No. {wallet.publicWalletId || '—'}
                  </div>
                  <div className="text-sm mt-1">
                    {Number(wallet.balance || 0).toLocaleString()} {wallet.currency || 'UGX'}
                  </div>
                </div>
              ))}
              {walletCount === 0 && (
                <div className="text-sm text-gray-500 border rounded-lg p-4 md:col-span-2">
                  No collection or disbursement wallets found for this merchant.
                </div>
              )}
            </div>

            <div className="space-y-2">
              {(data?.uniqueMembers || []).length === 0 ? (
                <div className="text-sm text-gray-500 border rounded-lg p-4">
                  No team members yet. Invite someone to grant access on all merchant wallets.
                </div>
              ) : (
                data?.uniqueMembers.map((member) => {
                  const name =
                    `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
                    member.email
                  const missingWallets = walletCount > member.wallets.length
                  return (
                    <div
                      key={member.email}
                      className="flex items-center justify-between gap-3 p-4 border rounded-lg"
                    >
                      <div>
                        <div className="text-sm font-medium">{name}</div>
                        <div className="text-sm text-gray-600">
                          {member.email}
                          {member.phone ? ` • ${member.phone}` : ''}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {member.role} • {member.status}
                          {member.canLiquidate ? ' • Can liquidate' : ''}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {member.wallets.map((wallet) => (
                            <span
                              key={wallet.memberId}
                              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                            >
                              {walletTypeLabel(wallet.walletType)}
                            </span>
                          ))}
                        </div>
                      </div>
                      {missingWallets && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={syncingEmail === member.email}
                          onClick={() => handleSync(member.email)}
                        >
                          {syncingEmail === member.email ? 'Granting…' : 'Grant all wallets'}
                        </Button>
                      )}
                      {!missingWallets && (
                        <span className="text-xs text-green-700 flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          All wallets
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              They will be added to every collection and disbursement wallet for this merchant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="team-email">Email</Label>
              <Input
                id="team-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="team-first">First name</Label>
                <Input
                  id="team-first"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="team-last">Last name</Label>
                <Input
                  id="team-last"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="team-phone">Phone</Label>
              <Input
                id="team-phone"
                value={inviteForm.phoneNumber}
                onChange={(e) => setInviteForm({ ...inviteForm, phoneNumber: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="team-liquidate">Can liquidate</Label>
              <Switch
                id="team-liquidate"
                checked={inviteForm.canLiquidate}
                onCheckedChange={(checked) =>
                  setInviteForm({ ...inviteForm, canLiquidate: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={saving}>
              {saving ? 'Inviting…' : 'Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
