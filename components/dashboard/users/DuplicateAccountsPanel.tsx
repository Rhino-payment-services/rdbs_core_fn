'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Loader2,
  Phone,
  Trash2,
  User,
  Wallet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  useDeactivateWallet,
  useDuplicatePhoneGroups,
  type DuplicateAccountSummary,
} from '@/lib/hooks/useDuplicateAccounts'
import { extractErrorMessage } from '@/lib/utils'
import { MergeUsersModal } from './MergeUsersModal'

function AccountRow({
  account,
  onDeactivateWallet,
  deactivatingId,
}: {
  account: DuplicateAccountSummary
  onDeactivateWallet: (walletId: string) => void
  deactivatingId: string | null
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 font-medium text-sm">
            <User className="h-4 w-4 text-gray-400" />
            {account.name || '—'}
          </div>
          <p className="text-xs text-gray-500 mt-1">{account.email || 'No email'}</p>
          <p className="text-xs text-gray-500">{account.phone}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{account.userType}</Badge>
          <Badge variant="outline">{account.status}</Badge>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Wallets</p>
        {account.wallets.length === 0 ? (
          <p className="text-xs text-gray-500">No wallets</p>
        ) : (
          account.wallets.map((w) => (
            <div
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-100 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-3.5 w-3.5 text-gray-400" />
                <span className="font-medium">{w.walletType}</span>
                <span className="text-gray-500">
                  {w.balance.toLocaleString()} {w.currency}
                </span>
                {!w.isActive && <Badge variant="secondary">Inactive</Badge>}
                {w.isSuspended && <Badge variant="destructive">Suspended</Badge>}
              </div>
              {w.balance === 0 && w.isActive && !w.isSuspended && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-red-700 border-red-200 hover:bg-red-50"
                  disabled={deactivatingId === w.id}
                  onClick={() => onDeactivateWallet(w.id)}
                >
                  {deactivatingId === w.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Deactivate
                    </>
                  )}
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      <Link
        href={`/dashboard/customers/${account.userType === 'SUBSCRIBER' ? 'subscriber' : 'user'}/${account.id}`}
        className="text-xs text-blue-600 hover:underline"
      >
        View account →
      </Link>
    </div>
  )
}

export function DuplicateAccountsPanel() {
  const [offset, setOffset] = useState(0)
  const limit = 25
  const { data, isLoading, isError, error, refetch } = useDuplicatePhoneGroups(limit, offset)
  const deactivateMutation = useDeactivateWallet()
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const [mergeOpen, setMergeOpen] = useState(false)

  const handleDeactivate = async (walletId: string) => {
    if (!confirm('Deactivate this empty wallet? This cannot be undone without support.')) return
    setDeactivatingId(walletId)
    try {
      await deactivateMutation.mutateAsync({
        walletId,
        reason: 'Duplicate wallet cleanup from admin duplicates page',
      })
      toast.success('Wallet deactivated')
      refetch()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeactivatingId(null)
    }
  }

  const groups = data?.groups ?? []
  const total = data?.total ?? 0

  return (
    <div className="space-y-6">
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-700" />
        <AlertDescription className="text-amber-900 text-sm">
          Phone numbers linked to more than one user should be merged into a single canonical
          account. Deactivate only empty duplicate wallets after merging users.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => setMergeOpen(true)}>
          Merge two accounts
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/users/create">Grant staff on existing customer</Link>
        </Button>
      </div>

      <MergeUsersModal isOpen={mergeOpen} onClose={() => setMergeOpen(false)} onMerged={() => refetch()} />

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>{extractErrorMessage(error)}</AlertDescription>
        </Alert>
      )}

      {!isLoading && groups.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-600 text-sm">
            No duplicate phone groups found.
          </CardContent>
        </Card>
      )}

      {groups.map((group) => (
        <Card key={group.canonicalPhone}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {group.canonicalPhone}
            </CardTitle>
            <CardDescription>
              {group.accountCount} accounts share this number
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {group.accounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                onDeactivateWallet={handleDeactivate}
                deactivatingId={deactivatingId}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      {total > limit && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 self-center">
            {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </span>
          <Button
            variant="outline"
            disabled={offset + limit >= total}
            onClick={() => setOffset((o) => o + limit)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
