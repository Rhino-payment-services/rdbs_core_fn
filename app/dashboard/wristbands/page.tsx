"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Watch,
  Plus,
  Link as LinkIcon,
  Shield,
  ShieldOff,
  Power,
  MoreVertical,
  Search,
  UserPlus,
  Unlink,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useWristbands,
  useUpdateWristbandStatus,
  useActivateWristband,
  useUnlinkWristband,
  type WristbandWithUser,
} from '@/lib/hooks/useWristbands'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import toast from 'react-hot-toast'

export default function WristbandsPage() {
  const router = useRouter()
  const { data: wristbandsData, isLoading } = useWristbands()
  const updateStatus = useUpdateWristbandStatus()
  const activateWristband = useActivateWristband()
  const unlinkWristband = useUnlinkWristband()
  const [searchTerm, setSearchTerm] = useState('')

  const wristbands = wristbandsData?.data || []

  const handleBlock = async (wristbandId: string) => {
    try {
      await updateStatus.mutateAsync({ wristbandId, data: { status: 'BLOCKED' } })
      toast.success('Wristband blocked successfully')
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err?.message || 'Failed to block wristband')
    }
  }

  const handleActivate = async (wristbandId: string) => {
    try {
      await activateWristband.mutateAsync(wristbandId)
      toast.success('Wristband activated successfully')
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err?.message || 'Failed to activate wristband')
    }
  }

  const handleUnlink = async (wristbandId: string) => {
    try {
      await unlinkWristband.mutateAsync(wristbandId)
      toast.success('Wristband unlinked successfully')
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err?.message || 'Failed to unlink wristband')
    }
  }

  const handleAssign = (serialNumber: string) => {
    router.push(`/dashboard/wristbands/link?serialNumber=${encodeURIComponent(serialNumber)}`)
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, React.ReactNode> = {
      ACTIVE: <Badge className="bg-green-100 text-green-800">Active</Badge>,
      INACTIVE: <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>,
      BLOCKED: <Badge className="bg-red-100 text-red-800">Blocked</Badge>,
      LOST: <Badge className="bg-yellow-100 text-yellow-800">Lost</Badge>,
      STOLEN: <Badge className="bg-purple-100 text-purple-800">Stolen</Badge>,
    }
    return statusMap[status] || <Badge>{status}</Badge>
  }

  const filtered = wristbands.filter((w: WristbandWithUser) => {
    const q = searchTerm.toLowerCase()
    return (
      w.serialNumber.toLowerCase().includes(q) ||
      w.nickname?.toLowerCase().includes(q) ||
      w.user?.name?.toLowerCase().includes(q) ||
      w.user?.phone?.toLowerCase().includes(q) ||
      w.user?.email?.toLowerCase().includes(q)
    )
  })

  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('wristbands')} />
      <DashboardPageHeader
        title="Wristbands"
        description="Register, link, and manage NFC wristbands for customer payments"
        icon={<Watch className="h-8 w-8 text-[#08163d]" />}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push('/dashboard/wristbands/link')}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Link Wristband
            </Button>
            <Button onClick={() => router.push('/dashboard/wristbands/register')}>
              <Plus className="h-4 w-4 mr-2" />
              Register Wristband
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{wristbands.length}</p>
              </div>
              <Watch className="h-8 w-8 text-[#08163d]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {wristbands.filter((w) => w.status === 'ACTIVE').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unlinked</p>
                <p className="text-2xl font-bold text-gray-600">
                  {wristbands.filter((w) => !w.userId).length}
                </p>
              </div>
              <ShieldOff className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Blocked</p>
                <p className="text-2xl font-bold text-red-600">
                  {wristbands.filter((w) => w.status === 'BLOCKED').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>All Wristbands</CardTitle>
              <CardDescription>
                Wristbands must be linked to a wallet with wallet PIN enabled before activation
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search wristbands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#08163d]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No wristbands found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Nickname</TableHead>
                  <TableHead>Linked User</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Wallet PIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((wristband) => (
                  <TableRow key={wristband.id}>
                    <TableCell className="font-mono">{wristband.serialNumber}</TableCell>
                    <TableCell>{wristband.nickname || '—'}</TableCell>
                    <TableCell>
                      {wristband.user ? (
                        <div>
                          <div className="font-medium">{wristband.user.name}</div>
                          <div className="text-sm text-gray-500">
                            {wristband.user.phone || wristband.user.email}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Unlinked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {wristband.wallet?.walletType || '—'}
                    </TableCell>
                    <TableCell>
                      {wristband.wallet ? (
                        wristband.wallet.walletPinEnabled ? (
                          <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Not set</Badge>
                        )
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(wristband.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {wristband.lastUsedAt
                        ? new Date(wristband.lastUsedAt).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!wristband.userId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssign(wristband.serialNumber)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Link
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {wristband.status !== 'BLOCKED' && (
                              <DropdownMenuItem
                                onClick={() => handleBlock(wristband.id)}
                                className="text-red-600"
                              >
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Block
                              </DropdownMenuItem>
                            )}
                            {wristband.status === 'INACTIVE' && wristband.userId && (
                              <DropdownMenuItem
                                onClick={() => handleActivate(wristband.id)}
                                className="text-blue-600"
                              >
                                <Power className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {wristband.userId && (
                              <DropdownMenuItem
                                onClick={() => handleUnlink(wristband.id)}
                                className="text-orange-600"
                              >
                                <Unlink className="h-4 w-4 mr-2" />
                                Unlink
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardPageLayout>
  )
}
