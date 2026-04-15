"use client"
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Loader2,
  Phone,
  Mail,
  Search,
  ShieldX,
  Merge,
  User as UserIcon,
  Building2,
  Wallet,
} from 'lucide-react'
import api from '@/lib/axios'
import { useUserSearch } from '@/lib/hooks/useUserSearch'
import toast from 'react-hot-toast'
import type { User } from '@/lib/types/api'

interface MergeUsersModalProps {
  isOpen: boolean
  onClose: () => void
  onMerged?: () => void
}

type Step = 'search-keep' | 'search-merge' | 'confirm' | 'done'

function UserCard({ user, label, variant }: { user: User; label: string; variant: 'keep' | 'retire' }) {
  const name =
    user.profile?.firstName
      ? `${user.profile.firstName} ${user.profile.lastName ?? ''}`.trim()
      : [user.firstName, user.lastName].filter(Boolean).join(' ') || '—'

  const borderColor = variant === 'keep' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
  const badgeVariant = variant === 'keep' ? 'default' : 'destructive'

  return (
    <div className={`rounded-lg border-2 p-4 space-y-3 ${borderColor}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
        <Badge variant={badgeVariant}>{variant === 'keep' ? 'Keep' : 'Retire'}</Badge>
      </div>

      <div className="flex items-center gap-2">
        <UserIcon className="h-4 w-4 text-gray-400 shrink-0" />
        <span className="font-medium text-sm">{name}</span>
      </div>

      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <Phone className="h-3 w-3" />
          <span>{user.phone || '—'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="h-3 w-3" />
          <span>{user.email || '—'}</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs">
          {user.userType}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {user.status}
        </Badge>
        {(user.merchants?.length ?? 0) > 0 && (
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {user.merchants!.length} merchant{user.merchants!.length !== 1 ? 's' : ''}
          </Badge>
        )}
        {(user.wallets?.length ?? 0) > 0 && (
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Wallet className="h-3 w-3" />
            {user.wallets!.length} wallet{user.wallets!.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <p className="text-xs text-gray-400">ID: {user.id}</p>
    </div>
  )
}

function SearchStep({
  label,
  placeholder,
  onFound,
  excludeId,
}: {
  label: string
  placeholder: string
  onFound: (user: User) => void
  excludeId?: string
}) {
  const [input, setInput] = useState('')
  const [triggered, setTriggered] = useState(false)
  const [searchPhone, setSearchPhone] = useState<string | undefined>(undefined)
  const [searchEmail, setSearchEmail] = useState<string | undefined>(undefined)

  const isEmail = input.trim().includes('@')

  const { data: user, isLoading, error, refetch } = useUserSearch({
    phone: !isEmail ? searchPhone : undefined,
    email: isEmail ? searchEmail : undefined,
    enabled: triggered,
  })

  const handleSearch = async () => {
    if (!input.trim()) return
    if (isEmail) {
      setSearchEmail(input.trim())
      setSearchPhone(undefined)
    } else {
      setSearchPhone(input.trim())
      setSearchEmail(undefined)
    }
    setTriggered(true)
    await refetch()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  React.useEffect(() => {
    if (!user) return
    if (excludeId && user.id === excludeId) {
      toast.error('That is the same user — please search for a different account.')
      return
    }
    onFound(user)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const notFound = triggered && !isLoading && !user && (error as any)?.response?.status === 404
  const otherError = triggered && !isLoading && !user && !notFound && error

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => { setInput(e.target.value); setTriggered(false) }}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleSearch} disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {notFound && (
        <p className="text-xs text-red-600">No user found for "{input}".</p>
      )}
      {otherError && (
        <p className="text-xs text-red-600">
          {(otherError as any)?.response?.data?.message || (otherError as Error).message || 'Search failed.'}
        </p>
      )}
    </div>
  )
}

export const MergeUsersModal: React.FC<MergeUsersModalProps> = ({ isOpen, onClose, onMerged }) => {
  const [step, setStep] = useState<Step>('search-keep')
  const [keepUser, setKeepUser] = useState<User | null>(null)
  const [mergeUser, setMergeUser] = useState<User | null>(null)
  const [isMerging, setIsMerging] = useState(false)
  const [result, setResult] = useState<{ mergedMerchants: number; mergedWallets: number; mergedTeamMemberships: number } | null>(null)

  const handleClose = () => {
    setStep('search-keep')
    setKeepUser(null)
    setMergeUser(null)
    setIsMerging(false)
    setResult(null)
    onClose()
  }

  const handleKeepFound = (user: User) => {
    setKeepUser(user)
    setStep('search-merge')
  }

  const handleMergeFound = (user: User) => {
    setMergeUser(user)
    setStep('confirm')
  }

  const handleConfirmMerge = async () => {
    if (!keepUser || !mergeUser) return
    setIsMerging(true)
    try {
      const res = await api.post('/admin/users/merge', {
        keepUserId: keepUser.id,
        mergeUserId: mergeUser.id,
      })
      setResult(res.data)
      setStep('done')
      onMerged?.()
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Merge failed. Please try again.'
      toast.error(msg)
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5 text-blue-600" />
            Merge Duplicate Users
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">

          {/* Step indicator */}
          {step !== 'done' && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span className={step === 'search-keep' ? 'font-semibold text-blue-600' : ''}>1. Find primary account</span>
              <ArrowRight className="h-3 w-3" />
              <span className={step === 'search-merge' ? 'font-semibold text-blue-600' : ''}>2. Find duplicate</span>
              <ArrowRight className="h-3 w-3" />
              <span className={step === 'confirm' ? 'font-semibold text-blue-600' : ''}>3. Confirm</span>
            </div>
          )}

          {/* Step 1 – search for keep user */}
          {step === 'search-keep' && (
            <SearchStep
              label="Step 1 — Search for the PRIMARY account (the one to keep)"
              placeholder="Phone number or email..."
              onFound={handleKeepFound}
            />
          )}

          {/* Step 2 – show keep user + search for merge user */}
          {step === 'search-merge' && keepUser && (
            <div className="space-y-4">
              <UserCard user={keepUser} label="Primary account (will be kept)" variant="keep" />

              <SearchStep
                label="Step 2 — Search for the DUPLICATE account (will be retired)"
                placeholder="Phone number or email..."
                onFound={handleMergeFound}
                excludeId={keepUser.id}
              />

              <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => { setKeepUser(null); setStep('search-keep') }}>
                ← Change primary account
              </Button>
            </div>
          )}

          {/* Step 3 – confirm */}
          {step === 'confirm' && keepUser && mergeUser && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will transfer all merchants and business wallets from the duplicate to the primary account
                  and <strong>suspend</strong> the duplicate. This cannot be undone automatically.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <UserCard user={keepUser} label="Keep (primary)" variant="keep" />
                <UserCard user={mergeUser} label="Retire (duplicate)" variant="retire" />
              </div>

              <div className="bg-gray-50 rounded-md border p-3 text-sm space-y-1">
                <p className="font-medium text-gray-700">What will happen:</p>
                <ul className="list-disc list-inside text-gray-600 text-xs space-y-0.5">
                  <li>
                    {mergeUser.merchants?.length ?? 0} merchant account{(mergeUser.merchants?.length ?? 0) !== 1 ? 's' : ''} → transferred to primary
                  </li>
                  <li>
                    All wallets (business <em>and</em> personal) → transferred to primary
                    <span className="text-gray-400 ml-1">— balances, transactions and ledger history stay intact</span>
                  </li>
                  <li>Wallet team memberships → transferred (duplicates skipped)</li>
                  <li>Duplicate account → suspended (not deleted — audit trail preserved)</li>
                  {(!keepUser.phone && mergeUser.phone) && (
                    <li>Primary phone updated to: {mergeUser.phone}</li>
                  )}
                  {(!keepUser.email && mergeUser.email) && (
                    <li>Primary email updated to: {mergeUser.email}</li>
                  )}
                </ul>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => { setMergeUser(null); setStep('search-merge') }}
                  disabled={isMerging}
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmMerge}
                  disabled={isMerging}
                >
                  {isMerging ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Merging…
                    </>
                  ) : (
                    <>
                      <Merge className="h-4 w-4 mr-2" />
                      Confirm Merge
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && result && keepUser && mergeUser && (
            <div className="space-y-4 py-2 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-lg font-semibold">Merge complete</p>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-green-600">{result.mergedMerchants}</p>
                  <p className="text-xs text-gray-500">Merchants transferred</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-green-600">{result.mergedWallets}</p>
                  <p className="text-xs text-gray-500">Wallets transferred (all types)</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-2xl font-bold text-green-600">{result.mergedTeamMemberships}</p>
                  <p className="text-xs text-gray-500">Team memberships</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
                <ShieldX className="h-4 w-4 text-red-400" />
                Duplicate account ({mergeUser.phone || mergeUser.email}) has been suspended.
              </div>
              <Button className="w-full" onClick={handleClose}>Done</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
