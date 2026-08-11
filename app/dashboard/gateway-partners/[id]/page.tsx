"use client"

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/dashboard/Navbar'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft, 
  Key,
  Plus,
  Copy,
  CheckCircle,
  Ban,
  Globe,
  Mail,
  Phone,
  Building2,
  Shield,
  Activity,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  DollarSign,
  Trash2,
  Wallet,
  Loader2,
  TrendingUp,
  Pencil,
} from 'lucide-react'
import {
  useGatewayPartner,
  useGenerateApiKey,
  useSuspendGatewayPartner,
  useRevokeApiKey,
  usePartnerWalletBalance,
  usePartnerWallets,
  useCreatePartnerEscrowWallet,
  useTopUpPartnerWallet,
  useUpdatePartnerAuthType,
  useUpdateGatewayPartner,
} from '@/lib/hooks/useGatewayPartners'
import { GatewayPartnerRoutingPanel } from '@/components/dashboard/gateway-partners/GatewayPartnerRoutingPanel'
import Link from 'next/link'
import toast from 'react-hot-toast'

function formatGatewayLimit(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  return num.toLocaleString()
}

function formatMillionsUgx(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—'
  const num = Number(value)
  if (Number.isNaN(num)) return '—'
  return `${(num / 1_000_000).toFixed(0)}M UGX`
}

const GatewayPartnerDetailsPage = () => {
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string

  const [showGenerateKeyDialog, setShowGenerateKeyDialog] = useState(false)
  const [showSelectEnvironmentDialog, setShowSelectEnvironmentDialog] = useState(false)
  const [selectedEnvironment, setSelectedEnvironment] = useState<'DEVELOPMENT' | 'PRODUCTION'>('PRODUCTION')
  const [generatedApiKey, setGeneratedApiKey] = useState('')
  const [generatedApiKeyEnvironment, setGeneratedApiKeyEnvironment] = useState<'DEVELOPMENT' | 'PRODUCTION'>('PRODUCTION')
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [keyToRevoke, setKeyToRevoke] = useState('')

  const [showFundWalletDialog, setShowFundWalletDialog] = useState(false)
  const [fundWalletType, setFundWalletType] = useState<'ESCROW' | 'COMMISSION'>('ESCROW')
  const [fundWalletId, setFundWalletId] = useState<string>('')
  const [fundAmount, setFundAmount] = useState('')
  const [fundReference, setFundReference] = useState('')
  const [fundDescription, setFundDescription] = useState('')

  const [showCreateEscrowDialog, setShowCreateEscrowDialog] = useState(false)
  const [newEscrowDescription, setNewEscrowDescription] = useState('')
  const [createdEscrowWalletId, setCreatedEscrowWalletId] = useState('')
  const [showCreatedEscrowDialog, setShowCreatedEscrowDialog] = useState(false)
  // Rate limits / tier edit state
  const [showEditLimitsDialog, setShowEditLimitsDialog] = useState(false)
  const [editTier, setEditTier] = useState('')
  const [editIsAggregator, setEditIsAggregator] = useState(false)
  const [editLimitPerSecond, setEditLimitPerSecond] = useState('')
  const [editLimitPerMinute, setEditLimitPerMinute] = useState('')
  const [editLimitPerHour, setEditLimitPerHour] = useState('')
  const [editLimitPerDay, setEditLimitPerDay] = useState('')
  const [editDailyTxns, setEditDailyTxns] = useState('')
  const [editDailyVolume, setEditDailyVolume] = useState('')
  const [editMonthlyTxns, setEditMonthlyTxns] = useState('')
  const [editMaxTxnAmount, setEditMaxTxnAmount] = useState('')

  const { data: partner, isLoading, error, refetch } = useGatewayPartner(partnerId)
  const generateKey = useGenerateApiKey()
  const suspendPartner = useSuspendGatewayPartner()
  const revokeKey = useRevokeApiKey()
  const topUpWallet = useTopUpPartnerWallet()
  const updateAuthType = useUpdatePartnerAuthType()
  const updatePartner = useUpdateGatewayPartner()

  const { data: escrowBalance, refetch: refetchBalance } = usePartnerWalletBalance(
    partnerId,
    'UGX',
    'ESCROW',
  )
  const { data: commissionBalance } = usePartnerWalletBalance(
    partnerId,
    'UGX',
    'COMMISSION',
  )
  const { data: partnerWalletsData, refetch: refetchWallets } = usePartnerWallets(partnerId)
  const createEscrowWallet = useCreatePartnerEscrowWallet()

  const partnerWallets = partnerWalletsData?.wallets ?? []
  const escrowWallets = partnerWallets.filter(
    (w) => (w.walletType || '').toUpperCase() === 'ESCROW',
  )

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount)
    if (!amount || amount < 1000) {
      toast.error('Minimum top-up amount is UGX 1,000')
      return
    }
    if (!fundReference.trim()) {
      toast.error('Reference is required')
      return
    }

    try {
      await topUpWallet.mutateAsync({
        partnerId,
        amount,
        currency: 'UGX',
        walletType: fundWalletType,
        walletId: fundWalletId || undefined,
        reference: fundReference.trim(),
        description: fundDescription.trim() || undefined,
      })
      setShowFundWalletDialog(false)
      setFundAmount('')
      setFundReference('')
      setFundDescription('')
      setFundWalletId('')
      refetchBalance()
      refetchWallets()
      refetch()
    } catch {
      // error handled in mutation onError
    }
  }

  const handleCreateEscrowWallet = async () => {
    try {
      const result = await createEscrowWallet.mutateAsync({
        partnerId,
        currency: 'UGX',
        description: newEscrowDescription.trim() || undefined,
      })
      setShowCreateEscrowDialog(false)
      setNewEscrowDescription('')
      const id = result?.wallet?.id || ''
      if (id) {
        setCreatedEscrowWalletId(id)
        setShowCreatedEscrowDialog(true)
      }
      refetchWallets()
      refetchBalance()
      refetch()
    } catch {
      // error handled in mutation onError
    }
  }

  const handleGenerateKeyClick = () => {
    // Check if there's an active production key
    const hasActiveProductionKey = partner?.apiKeys.some(
      key => key.environment === 'PRODUCTION' && key.isActive && !key.isRevoked
    )

    if (hasActiveProductionKey) {
      toast.error('An active production API key already exists. Please revoke it first before generating a new one.')
      return
    }

    // Open environment selection dialog
    setShowSelectEnvironmentDialog(true)
  }

  const handleGenerateKey = async () => {
    try {
      const result = await generateKey.mutateAsync({
        partnerId,
        environment: selectedEnvironment,
        description: `${selectedEnvironment} API key`,
        expiresInDays: 365,
      })
      setGeneratedApiKey(result.data.apiKey)
      setGeneratedApiKeyEnvironment(result.data.environment || selectedEnvironment)
      setShowSelectEnvironmentDialog(false)
      setShowGenerateKeyDialog(true)
    } catch (error: any) {
      console.error('Failed to generate key:', error)
      toast.error(error?.response?.data?.message || 'Failed to generate API key')
    }
  }

  const handleRevokeKey = async () => {
    try {
      await revokeKey.mutateAsync({
        keyId: keyToRevoke,
        reason: 'Revoked by admin',
      })
      setShowRevokeDialog(false)
      setKeyToRevoke('')
    } catch (error) {
      console.error('Failed to revoke key:', error)
    }
  }


  const handleSuspend = async () => {
    if (!partner) return
    
    const isSuspended = !partner.isSuspended
    const reason = isSuspended ? prompt('Enter suspension reason:') : undefined

    if (isSuspended && !reason) return

    suspendPartner.mutate({ partnerId, isSuspended, reason: reason || undefined })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="dashboard-shell">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <RefreshCw className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading partner details...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !partner) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="dashboard-shell">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Partner Not Found</h1>
                <p className="text-gray-600 mb-4">Unable to load partner details.</p>
                <Button onClick={() => router.push('/dashboard/gateway-partners')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Partners
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const getStatusBadge = () => {
    if (partner.isSuspended) {
      return <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" />Suspended</Badge>
    } else if (partner.isActive) {
      return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Active</Badge>
    } else {
      return <Badge variant="secondary">Inactive</Badge>
    }
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      BRONZE: 'bg-orange-400',
      SILVER: 'bg-gray-500',
      GOLD: 'bg-yellow-500',
      PLATINUM: 'bg-purple-500',
      AGGREGATOR: 'bg-blue-600',
    }
    return colors[tier] || 'bg-blue-500'
  }

  const openEditLimitsDialog = () => {
    if (!partner) return
    setEditTier(partner.tier || 'GOLD')
    setEditIsAggregator((partner as any).isAggregator ?? false)
    setEditLimitPerSecond(String(partner.rateLimits?.requests_per_second ?? ''))
    setEditLimitPerMinute(String(partner.rateLimits?.requests_per_minute ?? ''))
    setEditLimitPerHour(String(partner.rateLimits?.requests_per_hour ?? ''))
    setEditLimitPerDay(String(partner.rateLimits?.requests_per_day ?? ''))
    setEditDailyTxns(String(partner.usageQuotas?.daily_transactions ?? ''))
    setEditDailyVolume(String(partner.usageQuotas?.daily_volume_ugx ?? ''))
    setEditMonthlyTxns(String(partner.usageQuotas?.monthly_transactions ?? ''))
    setEditMaxTxnAmount(String(partner.usageQuotas?.max_transaction_amount ?? ''))
    setShowEditLimitsDialog(true)
  }

  const handleSaveLimits = async () => {
    const rateLimits: Record<string, number> = {}
    if (editLimitPerSecond) rateLimits.requests_per_second = Number(editLimitPerSecond)
    if (editLimitPerMinute) rateLimits.requests_per_minute = Number(editLimitPerMinute)
    if (editLimitPerHour) rateLimits.requests_per_hour = Number(editLimitPerHour)
    if (editLimitPerDay) rateLimits.requests_per_day = Number(editLimitPerDay)

    const usageQuotas: Record<string, number> = {}
    if (editDailyTxns) usageQuotas.daily_transactions = Number(editDailyTxns)
    if (editDailyVolume) usageQuotas.daily_volume_ugx = Number(editDailyVolume)
    if (editMonthlyTxns) usageQuotas.monthly_transactions = Number(editMonthlyTxns)
    if (editMaxTxnAmount) usageQuotas.max_transaction_amount = Number(editMaxTxnAmount)

    try {
      await updatePartner.mutateAsync({
        partnerId,
        data: {
          tier: editTier as any,
          ...(Object.keys(rateLimits).length > 0 ? { rateLimits } : {}),
          ...(Object.keys(usageQuotas).length > 0 ? { usageQuotas } : {}),
        },
      })
      setShowEditLimitsDialog(false)
      refetch()
    } catch {
      // toast handled by the hook
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="dashboard-shell">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/dashboard" className="hover:text-gray-800">Dashboard</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/dashboard/gateway-partners" className="hover:text-gray-800">Gateway Partners</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-gray-900">{partner.partnerName}</span>
            </nav>
          </div>

          {/* Header */}
          <div className="mb-8">
            <Button variant="outline" onClick={() => router.push('/dashboard/gateway-partners')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Partners
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{partner.partnerName}</h1>
                  {getStatusBadge()}
                  <Badge className={getTierColor(partner.tier)}>{partner.tier}</Badge>
                </div>
                <p className="text-gray-600">{partner.description || 'Gateway Partner'}</p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant={partner.isSuspended ? 'default' : 'destructive'}
                  onClick={handleSuspend}
                  disabled={suspendPartner.isPending}
                >
                  {partner.isSuspended ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Reactivate
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-gray-700">Country</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">{partner.country}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Key className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-gray-700">API Keys</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">{partner.apiKeys.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {partner.apiKeys.filter(k => k.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <h3 className="font-medium text-gray-700">Tariffs</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">{partner.tariffs.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {partner.tariffs.filter(t => t.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  <h3 className="font-medium text-gray-700">Security Level</h3>
                </div>
                <p className="text-lg font-bold text-gray-900">{partner.securityLevel}</p>
              </CardContent>
            </Card>
          </div>

          {/* Authentication Type */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                Authentication Type
              </CardTitle>
              <CardDescription>
                Controls how this partner authenticates with the Gateway API.
                <strong> API_KEY_ONLY</strong> requires only an API key.
                <strong> API_KEY_AND_TOKEN</strong> requires the partner to generate a one-time access token before each request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <Select
                    value={partner.authenticationType || 'API_KEY_ONLY'}
                    onValueChange={(value) => {
                      updateAuthType.mutate({
                        partnerId,
                        authenticationType: value as 'API_KEY_ONLY' | 'API_KEY_AND_TOKEN',
                      })
                    }}
                    disabled={updateAuthType.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="API_KEY_ONLY">
                        API Key Only
                      </SelectItem>
                      <SelectItem value="API_KEY_AND_TOKEN">
                        API Key + One-Time Token
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Badge
                  variant="outline"
                  className={
                    (partner.authenticationType || 'API_KEY_ONLY') === 'API_KEY_AND_TOKEN'
                      ? 'bg-orange-50 text-orange-700 border-orange-300'
                      : 'bg-green-50 text-green-700 border-green-300'
                  }
                >
                  {(partner.authenticationType || 'API_KEY_ONLY') === 'API_KEY_AND_TOKEN'
                    ? 'Enhanced Security'
                    : 'Standard'}
                </Badge>
                {updateAuthType.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
              {(partner.authenticationType || 'API_KEY_ONLY') === 'API_KEY_AND_TOKEN' && (
                <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
                  <p className="font-medium mb-1">One-Time Token Flow</p>
                  <ol className="list-decimal list-inside space-y-1 text-orange-700">
                    <li>Partner calls <code className="bg-orange-100 px-1 rounded">POST /api/v1/gateway/partners/generate-token</code> with their API key</li>
                    <li>System returns a JWT token valid for 5 minutes (single use)</li>
                    <li>Partner includes both <code className="bg-orange-100 px-1 rounded">x-api-key</code> and <code className="bg-orange-100 px-1 rounded">Authorization: Bearer &lt;token&gt;</code> on protected requests</li>
                    <li>Token is consumed after one successful request</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Partner capabilities */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Partner Capabilities
              </CardTitle>
              <CardDescription>
                Opt-in permissions for sensitive gateway operations. Turn these on only for trusted partners.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="canDepositAndWithdraw" className="text-base">
                    Deposit &amp; Withdrawal
                  </Label>
                  <p className="text-sm text-gray-500">
                    Allow deposit and withdrawal operations on the partner API
                  </p>
                </div>
                <Switch
                  id="canDepositAndWithdraw"
                  checked={partner.canDepositAndWithdraw ?? true}
                  disabled={updatePartner.isPending}
                  onCheckedChange={(checked) => {
                    updatePartner.mutate({
                      partnerId,
                      data: { canDepositAndWithdraw: checked },
                    })
                  }}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor="canAccessWalletTransactions" className="text-base">
                    Access user / e-wallet transactions
                  </Label>
                  <p className="text-sm text-gray-500">
                    Allow reading subscriber wallet history via{' '}
                    <code className="rounded bg-gray-100 px-1 text-xs">
                      /api/v1/gateway/users/:userId/transactions
                    </code>{' '}
                    (required for Ruka Sente scoring)
                  </p>
                </div>
                <Switch
                  id="canAccessWalletTransactions"
                  checked={partner.canAccessWalletTransactions ?? false}
                  disabled={updatePartner.isPending}
                  onCheckedChange={(checked) => {
                    updatePartner.mutate({
                      partnerId,
                      data: { canAccessWalletTransactions: checked },
                    })
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Wallet Balances */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    Partner Wallets
                  </CardTitle>
                  <CardDescription>
                    ESCROW / COMMISSION balances. Create extra ESCROW wallets for RukaSente
                    lending companies under this ApiPartner.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateEscrowDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create ESCROW
                  </Button>
                  <Button onClick={() => setShowFundWalletDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Fund Wallet
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ESCROW */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">ESCROW Wallet</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      Disbursements
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    {escrowBalance?.wallet
                      ? `UGX ${Number(escrowBalance.wallet.balance).toLocaleString()}`
                      : escrowBalance?.message?.includes('not found') || !escrowBalance
                      ? 'UGX 0'
                      : '…'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {escrowBalance?.wallet?.isActive
                      ? escrowBalance.wallet.isSuspended
                        ? '⚠ Suspended'
                        : '● Active (default / first match)'
                      : escrowBalance
                      ? '○ Inactive / not created'
                      : 'Not yet funded'}
                  </p>
                  {escrowBalance?.wallet?.walletId && (
                    <p className="mt-2 font-mono text-[11px] text-blue-800 break-all">
                      {escrowBalance.wallet.walletId}
                    </p>
                  )}
                </div>

                {/* COMMISSION */}
                <div className="rounded-lg border border-green-200 bg-green-50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900">COMMISSION Wallet</span>
                    </div>
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      Earnings
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    {commissionBalance?.wallet
                      ? `UGX ${Number(commissionBalance.wallet.balance).toLocaleString()}`
                      : commissionBalance?.message?.includes('not found') || !commissionBalance
                      ? 'UGX 0'
                      : '…'}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {commissionBalance?.wallet?.isActive
                      ? commissionBalance.wallet.isSuspended
                        ? '⚠ Suspended'
                        : '● Active'
                      : '○ Credited automatically on transactions'}
                  </p>
                </div>
              </div>

              {escrowWallets.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">
                    All ESCROW wallets ({escrowWallets.length})
                  </h4>
                  <p className="mb-3 text-xs text-gray-500">
                    Copy a wallet ID into RukaSent Partner → RukaPay escrow wallet ID for
                    lending-company isolation.
                  </p>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Wallet ID</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead>Flags</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {escrowWallets.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell className="max-w-[180px] truncate text-sm">
                              {w.description || '—'}
                            </TableCell>
                            <TableCell>
                              <code className="text-[11px] break-all">{w.id}</code>
                            </TableCell>
                            <TableCell className="tabular-nums text-sm">
                              {w.currency} {Number(w.balance).toLocaleString()}
                            </TableCell>
                            <TableCell className="space-x-1">
                              {w.isDefault && (
                                <Badge variant="outline" className="text-[10px]">
                                  Default
                                </Badge>
                              )}
                              {!w.isActive && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Inactive
                                </Badge>
                              )}
                              {w.isSuspended && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Suspended
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(w.id)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setFundWalletType('ESCROW')
                                  setFundWalletId(w.id)
                                  setShowFundWalletDialog(true)
                                }}
                              >
                                Fund
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{partner.contactEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{partner.contactPhone}</p>
                  </div>
                </div>
                {partner.contactPerson && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Contact Person</p>
                      <p className="font-medium">{partner.contactPerson}</p>
                    </div>
                  </div>
                )}
                {partner.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <a href={partner.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                        {partner.website}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rate Limits & Quotas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rate Limits & Quotas</CardTitle>
                  <Button variant="outline" size="sm" onClick={openEditLimitsDialog}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Rate Limits</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Per Second:</span>
                        <span className="font-medium ml-2">
                          {formatGatewayLimit(partner.rateLimits?.requests_per_second)}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Per Minute:</span>
                        <span className="font-medium ml-2">
                          {formatGatewayLimit(partner.rateLimits?.requests_per_minute)}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Per Hour:</span>
                        <span className="font-medium ml-2">
                          {formatGatewayLimit(partner.rateLimits?.requests_per_hour)}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Per Day:</span>
                        <span className="font-medium ml-2">
                          {formatGatewayLimit(partner.rateLimits?.requests_per_day)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Usage Quotas</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Daily Transactions:</span>
                        <span className="font-medium">
                          {formatGatewayLimit(partner.usageQuotas?.daily_transactions)}
                        </span>
                      </div>
                      <div className="flex justify-between bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Monthly Transactions:</span>
                        <span className="font-medium">
                          {formatGatewayLimit(partner.usageQuotas?.monthly_transactions)}
                        </span>
                      </div>
                      <div className="flex justify-between bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Daily Volume:</span>
                        <span className="font-medium">
                          {formatMillionsUgx(partner.usageQuotas?.daily_volume_ugx)}
                        </span>
                      </div>
                      <div className="flex justify-between bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Max per Transaction:</span>
                        <span className="font-medium">
                          {formatMillionsUgx(partner.usageQuotas?.max_transaction_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Keys */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage API keys for partner authentication
                  </CardDescription>
                </div>
                <Button onClick={handleGenerateKeyClick} disabled={generateKey.isPending}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Key
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {partner.apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No API keys generated yet</p>
                  <Button onClick={handleGenerateKeyClick} className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate First Key
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key Prefix</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partner.apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell>
                          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {key.keyPrefix}...
                          </code>
                        </TableCell>
                        <TableCell>{key.description || 'N/A'}</TableCell>
                        <TableCell>
                          {key.environment === 'DEVELOPMENT' ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                              Development
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              Production
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {key.isRevoked ? (
                            <Badge variant="destructive">Revoked</Badge>
                          ) : key.isActive ? (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {key.expiresAt 
                            ? new Date(key.expiresAt).toLocaleDateString()
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {key.lastUsedAt 
                            ? new Date(key.lastUsedAt).toLocaleString()
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {key.permissions.slice(0, 2).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {perm.split(':')[1]}
                              </Badge>
                            ))}
                            {key.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{key.permissions.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {!key.isRevoked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setKeyToRevoke(key.id)
                                setShowRevokeDialog(true)
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Tariffs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tariffs</CardTitle>
                  <CardDescription>
                    Transaction fees for this API partner
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => router.push(`/dashboard/finance/tariffs/create?apiPartnerId=${partnerId}`)}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tariff
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {partner.tariffs.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">No tariffs configured yet</p>
                  <Button onClick={() => router.push(`/dashboard/finance/tariffs/create?apiPartnerId=${partnerId}`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tariff
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Transaction Mode</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Fee Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partner.tariffs.map((tariff: any) => (
                      <TableRow key={tariff.id}>
                        <TableCell className="font-medium">{tariff.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-sm">
                            {tariff.transactionType || tariff.destinationType || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tariff.feeType || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {tariff.feeType === 'PERCENTAGE' && tariff.feePercentage !== undefined && tariff.feePercentage !== null
                            ? `${(Number(tariff.feePercentage) * 100).toFixed(2)}%`
                            : tariff.feeType === 'FIXED'
                            ? `${tariff.feeAmount} ${tariff.currency || 'UGX'}`
                            : tariff.feeType === 'HYBRID'
                            ? `${tariff.feeAmount} ${tariff.currency || 'UGX'} + ${tariff.feePercentage ? (Number(tariff.feePercentage) * 100).toFixed(2) : 0}%`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {tariff.isActive ? (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <GatewayPartnerRoutingPanel partnerId={partnerId} className="mt-6" />
        </div>
      </main>

      {/* Select Environment Dialog */}
      <Dialog open={showSelectEnvironmentDialog} onOpenChange={setShowSelectEnvironmentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Select Environment
            </DialogTitle>
            <DialogDescription>
              Choose the environment for the new API key
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="environment">Environment *</Label>
              <Select
                value={selectedEnvironment}
                onValueChange={(value) => setSelectedEnvironment(value as 'DEVELOPMENT' | 'PRODUCTION')}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEVELOPMENT">Development</SelectItem>
                  <SelectItem value="PRODUCTION">Production</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                {selectedEnvironment === 'DEVELOPMENT' 
                  ? 'Development keys are for testing and sandbox environments. You can have multiple development keys.'
                  : 'Production keys are for live transactions. Only one active production key is allowed per partner.'}
              </p>
            </div>

            {selectedEnvironment === 'PRODUCTION' && partner?.apiKeys.some(
              key => key.environment === 'PRODUCTION' && key.isActive && !key.isRevoked
            ) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-1">Active Production Key Exists</h4>
                    <p className="text-sm text-red-700">
                      You must revoke the existing active production key before generating a new one.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSelectEnvironmentDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerateKey}
              disabled={
                generateKey.isPending ||
                (selectedEnvironment === 'PRODUCTION' && partner?.apiKeys.some(
                  key => key.environment === 'PRODUCTION' && key.isActive && !key.isRevoked
                ))
              }
            >
              {generateKey.isPending ? 'Generating...' : 'Generate Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate API Key Dialog */}
      <Dialog open={showGenerateKeyDialog} onOpenChange={setShowGenerateKeyDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-green-600" />
              API Key Generated Successfully
            </DialogTitle>
            <DialogDescription>
              ⚠️ This is the only time the API key will be displayed. Copy and save it securely.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">Security Warning</h4>
                  <p className="text-sm text-yellow-700">
                    Store this API key securely. It provides full gateway access.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label>Environment</Label>
              <div className="mt-2">
                {generatedApiKeyEnvironment === 'DEVELOPMENT' ? (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                    Development
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    Production
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <Label>API Key</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={generatedApiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(generatedApiKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowGenerateKeyDialog(false)}>
              I've Saved the Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Key Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this API key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeKey}
              disabled={revokeKey.isPending}
            >
              {revokeKey.isPending ? 'Revoking...' : 'Revoke Key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fund Wallet Dialog */}
      <Dialog
        open={showFundWalletDialog}
        onOpenChange={(open) => {
          if (!topUpWallet.isPending) {
            setShowFundWalletDialog(open)
            if (!open) {
              setFundAmount('')
              setFundReference('')
              setFundDescription('')
              setFundWalletId('')
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              Fund Partner Wallet
            </DialogTitle>
            <DialogDescription>
              Add funds to {partner.partnerName}&apos;s wallet. The transaction is recorded
              immediately and the balance is updated atomically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Wallet type selector */}
            <div>
              <Label htmlFor="walletType">Wallet Type *</Label>
              <Select
                value={fundWalletType}
                onValueChange={(v) => {
                  setFundWalletType(v as 'ESCROW' | 'COMMISSION')
                  setFundWalletId('')
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESCROW">ESCROW — used for disbursements</SelectItem>
                  <SelectItem value="COMMISSION">COMMISSION — partner earnings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {fundWalletType === 'ESCROW' && escrowWallets.length > 0 && (
              <div>
                <Label>Specific ESCROW wallet (optional)</Label>
                <Select
                  value={fundWalletId || '__default__'}
                  onValueChange={(v) =>
                    setFundWalletId(v === '__default__' ? '' : v)
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Default ESCROW" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default__">
                      Default ESCROW (isDefault / first match)
                    </SelectItem>
                    {escrowWallets.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {(w.description || 'ESCROW').slice(0, 40)}
                        {w.isDefault ? ' · default' : ''} —{' '}
                        {Number(w.balance).toLocaleString()} {w.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fundWalletId ? (
                  <p className="mt-1 font-mono text-[11px] text-gray-500 break-all">
                    {fundWalletId}
                  </p>
                ) : null}
              </div>
            )}

            {/* Amount */}
            <div>
              <Label htmlFor="fundAmount">Amount (UGX) *</Label>
              <Input
                id="fundAmount"
                type="number"
                min="1000"
                step="1000"
                placeholder="e.g. 10,000,000"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="mt-1.5"
              />
              {fundAmount && parseFloat(fundAmount) < 1000 && (
                <p className="text-xs text-red-500 mt-1">Minimum amount is UGX 1,000</p>
              )}
            </div>

            {/* Reference */}
            <div>
              <Label htmlFor="fundReference">Reference *</Label>
              <Input
                id="fundReference"
                placeholder="e.g. TOPUP-2024-001"
                value={fundReference}
                onChange={(e) => setFundReference(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be unique — used for idempotency (re-sending the same reference won&apos;t double-credit)
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="fundDescription">Description (optional)</Label>
              <Textarea
                id="fundDescription"
                placeholder="e.g. Initial wallet funding for Q1 operations"
                value={fundDescription}
                onChange={(e) => setFundDescription(e.target.value)}
                className="mt-1.5 resize-none"
                rows={2}
              />
            </div>

            {/* Summary */}
            {fundAmount && parseFloat(fundAmount) >= 1000 && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm space-y-1">
                <p className="font-semibold text-blue-900">Summary</p>
                <div className="flex justify-between text-blue-800">
                  <span>Wallet:</span>
                  <span>
                    {fundWalletType}
                    {fundWalletId ? ' (specific)' : ''}
                  </span>
                </div>
                <div className="flex justify-between text-blue-800">
                  <span>Amount:</span>
                  <span className="font-bold">UGX {parseFloat(fundAmount).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFundWalletDialog(false)}
              disabled={topUpWallet.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFundWallet}
              disabled={
                topUpWallet.isPending ||
                !fundAmount ||
                parseFloat(fundAmount) < 1000 ||
                !fundReference.trim()
              }
            >
              {topUpWallet.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
              ) : (
                <><DollarSign className="h-4 w-4 mr-2" /> Confirm Funding</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create ESCROW Dialog */}
      <Dialog
        open={showCreateEscrowDialog}
        onOpenChange={(open) => {
          if (!createEscrowWallet.isPending) {
            setShowCreateEscrowDialog(open)
            if (!open) setNewEscrowDescription('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create ESCROW wallet</DialogTitle>
            <DialogDescription>
              Adds another ESCROW under {partner.partnerName} for a RukaSente lending
              company. The existing default ESCROW stays the default.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="escrowDesc">Label / description</Label>
              <Input
                id="escrowDesc"
                placeholder="e.g. Lending Co A ESCROW"
                value={newEscrowDescription}
                onChange={(e) => setNewEscrowDescription(e.target.value)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-gray-500">
                Shown in the wallet list so you can match it to a RukaSent partner.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateEscrowDialog(false)}
              disabled={createEscrowWallet.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEscrowWallet}
              disabled={createEscrowWallet.isPending}
            >
              {createEscrowWallet.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                'Create ESCROW'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Created ESCROW reveal */}
      <Dialog
        open={showCreatedEscrowDialog}
        onOpenChange={setShowCreatedEscrowDialog}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              ESCROW wallet created
            </DialogTitle>
            <DialogDescription>
              Copy this wallet ID into RukaSent → Partner → RukaPay escrow wallet ID.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-gray-50 p-3">
            <code className="break-all text-xs">{createdEscrowWalletId}</code>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(createdEscrowWalletId)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy ID
            </Button>
            <Button
              onClick={() => {
                setFundWalletType('ESCROW')
                setFundWalletId(createdEscrowWalletId)
                setShowCreatedEscrowDialog(false)
                setShowFundWalletDialog(true)
              }}
            >
              Fund this wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Rate Limits & Tier Dialog ─────────────────────────────── */}
      <Dialog open={showEditLimitsDialog} onOpenChange={setShowEditLimitsDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Rate Limits & Quotas</DialogTitle>
            <DialogDescription>
              Changes take effect immediately — no restart required. Leave a field
              blank to keep the current value. Changing the tier resets all limits
              to that tier&apos;s defaults unless you also fill in custom values below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Tier */}
            <div className="space-y-1.5">
              <Label>Partner Tier</Label>
              <Select value={editTier} onValueChange={setEditTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRONZE">Bronze — 60 req/min</SelectItem>
                  <SelectItem value="SILVER">Silver — 300 req/min</SelectItem>
                  <SelectItem value="GOLD">Gold — 1,000 req/min</SelectItem>
                  <SelectItem value="PLATINUM">Platinum — 3,000 req/min</SelectItem>
                  <SelectItem value="AGGREGATOR">Aggregator — 5,000 req/min</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Tier sets the baseline. Fill in custom values below to override specific limits.
              </p>
            </div>

            {/* Custom rate limits */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Custom Rate Limits <span className="font-normal text-gray-400">(optional — overrides tier defaults)</span></p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Requests / Second</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder={`tier default`}
                    value={editLimitPerSecond}
                    onChange={(e) => setEditLimitPerSecond(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Requests / Minute</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder={`tier default`}
                    value={editLimitPerMinute}
                    onChange={(e) => setEditLimitPerMinute(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Requests / Hour</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder={`tier default`}
                    value={editLimitPerHour}
                    onChange={(e) => setEditLimitPerHour(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Requests / Day</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder={`tier default`}
                    value={editLimitPerDay}
                    onChange={(e) => setEditLimitPerDay(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Usage quotas */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Usage Quotas <span className="font-normal text-gray-400">(optional)</span></p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Daily Transactions</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 5000"
                    value={editDailyTxns}
                    onChange={(e) => setEditDailyTxns(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Monthly Transactions</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="e.g. 100000"
                    value={editMonthlyTxns}
                    onChange={(e) => setEditMonthlyTxns(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Daily Volume (UGX)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 500000000"
                    value={editDailyVolume}
                    onChange={(e) => setEditDailyVolume(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Transaction Amount (UGX)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 10000000"
                    value={editMaxTxnAmount}
                    onChange={(e) => setEditMaxTxnAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditLimitsDialog(false)}
              disabled={updatePartner.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveLimits} disabled={updatePartner.isPending}>
              {updatePartner.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
              ) : (
                <><CheckCircle className="h-4 w-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default GatewayPartnerDetailsPage

