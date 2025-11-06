"use client"

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Trash2
} from 'lucide-react'
import {
  useGatewayPartner,
  useGenerateApiKey,
  useSuspendGatewayPartner,
  useRevokeApiKey,
  useCreateTariffs,
} from '@/lib/hooks/useGatewayPartners'
import Link from 'next/link'
import toast from 'react-hot-toast'

const GatewayPartnerDetailsPage = () => {
  const params = useParams()
  const router = useRouter()
  const partnerId = params.id as string

  const [showGenerateKeyDialog, setShowGenerateKeyDialog] = useState(false)
  const [generatedApiKey, setGeneratedApiKey] = useState('')
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [keyToRevoke, setKeyToRevoke] = useState('')
  const [showCreateTariffsDialog, setShowCreateTariffsDialog] = useState(false)
  const [tariffData, setTariffData] = useState({
    mtn: 2.0,
    airtel: 2.0,
    bank: 2.0,
    wallet: 2.0,
  })

  const { data: partner, isLoading, error, refetch } = useGatewayPartner(partnerId)
  const generateKey = useGenerateApiKey()
  const suspendPartner = useSuspendGatewayPartner()
  const revokeKey = useRevokeApiKey()
  const createTariffs = useCreateTariffs()

  const handleGenerateKey = async () => {
    try {
      const result = await generateKey.mutateAsync({
        partnerId,
        description: 'Production API key',
        expiresInDays: 365,
      })
      setGeneratedApiKey(result.data.apiKey)
      setShowGenerateKeyDialog(true)
    } catch (error) {
      console.error('Failed to generate key:', error)
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

  const handleCreateTariffs = async () => {
    try {
      // Create tariffs individually for each destination type
      const tariffPromises = [
        createTariffs.mutateAsync({
          partnerId,
          percentageFee: tariffData.mtn,
          destinationType: 'MTN',
        }),
        createTariffs.mutateAsync({
          partnerId,
          percentageFee: tariffData.airtel,
          destinationType: 'AIRTEL',
        }),
        createTariffs.mutateAsync({
          partnerId,
          percentageFee: tariffData.bank,
          destinationType: 'BANK',
        }),
        createTariffs.mutateAsync({
          partnerId,
          percentageFee: tariffData.wallet,
          destinationType: 'WALLET',
        }),
      ]

      await Promise.all(tariffPromises)
      setShowCreateTariffsDialog(false)
      toast.success('All tariffs created successfully!')
    } catch (error) {
      console.error('Failed to create tariffs:', error)
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
          <div className="max-w-7xl mx-auto">
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
          <div className="max-w-7xl mx-auto">
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
      SILVER: 'bg-gray-500',
      GOLD: 'bg-yellow-500',
      PLATINUM: 'bg-purple-500',
    }
    return colors[tier] || 'bg-blue-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
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
                <CardTitle>Rate Limits & Quotas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Rate Limits</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Per Second:</span>
                        <span className="font-medium ml-2">{partner.rateLimits.requests_per_second}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Per Minute:</span>
                        <span className="font-medium ml-2">{partner.rateLimits.requests_per_minute}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Per Hour:</span>
                        <span className="font-medium ml-2">{partner.rateLimits.requests_per_hour.toLocaleString()}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Per Day:</span>
                        <span className="font-medium ml-2">{partner.rateLimits.requests_per_day.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Usage Quotas</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Daily Transactions:</span>
                        <span className="font-medium">{partner.usageQuotas.daily_transactions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Daily Volume:</span>
                        <span className="font-medium">{(partner.usageQuotas.daily_volume_ugx / 1000000).toFixed(0)}M UGX</span>
                      </div>
                      <div className="flex justify-between bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">Max per Transaction:</span>
                        <span className="font-medium">{(partner.usageQuotas.max_transaction_amount / 1000000).toFixed(0)}M UGX</span>
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
                <Button onClick={handleGenerateKey} disabled={generateKey.isPending}>
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
                  <Button onClick={handleGenerateKey} className="mt-4">
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
                    Transaction fees for different destination types
                  </CardDescription>
                </div>
                {partner.tariffs.length === 0 && (
                  <Button onClick={() => setShowCreateTariffsDialog(true)} disabled={createTariffs.isPending}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tariffs
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {partner.tariffs.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-3">No tariffs configured yet</p>
                  <Button onClick={() => setShowCreateTariffsDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tariffs Now
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Destination Type</TableHead>
                      <TableHead>RukaPay Commission</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partner.tariffs.map((tariff) => (
                      <TableRow key={tariff.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-sm">
                            {tariff.destinationType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-lg">
                          {Number(tariff.commissionPercentage).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {tariff.description || `Commission for ${tariff.destinationType} transfers`}
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
        </div>
      </main>

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

      {/* Create Tariffs Dialog */}
      <Dialog open={showCreateTariffsDialog} onOpenChange={setShowCreateTariffsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Create Gateway Tariffs
            </DialogTitle>
            <DialogDescription>
              Set RukaPay's commission for this gateway partner
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Commission Only</h4>
                  <p className="text-sm text-blue-700">
                    This creates 4 tariffs (MTN, Airtel, Bank, Wallet) with your commission percentage.
                    Network/Bank charges will be handled by external partners (ABC, Pegasus).
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mtnCommission" className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  MTN Commission (%)
                </Label>
                <Input
                  id="mtnCommission"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tariffData.mtn}
                  onChange={(e) => setTariffData({ ...tariffData, mtn: parseFloat(e.target.value) || 0 })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="airtelCommission" className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Airtel Commission (%)
                </Label>
                <Input
                  id="airtelCommission"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tariffData.airtel}
                  onChange={(e) => setTariffData({ ...tariffData, airtel: parseFloat(e.target.value) || 0 })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="bankCommission" className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Bank Commission (%)
                </Label>
                <Input
                  id="bankCommission"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tariffData.bank}
                  onChange={(e) => setTariffData({ ...tariffData, bank: parseFloat(e.target.value) || 0 })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="walletCommission" className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Wallet Commission (%)
                </Label>
                <Input
                  id="walletCommission"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tariffData.wallet}
                  onChange={(e) => setTariffData({ ...tariffData, wallet: parseFloat(e.target.value) || 0 })}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Commission Preview (on 100,000 UGX)</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between bg-white p-2 rounded">
                  <span className="text-gray-600">MTN:</span>
                  <span className="font-medium">{((100000 * tariffData.mtn) / 100).toLocaleString()} UGX</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded">
                  <span className="text-gray-600">Airtel:</span>
                  <span className="font-medium">{((100000 * tariffData.airtel) / 100).toLocaleString()} UGX</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-medium">{((100000 * tariffData.bank) / 100).toLocaleString()} UGX</span>
                </div>
                <div className="flex justify-between bg-white p-2 rounded">
                  <span className="text-gray-600">Wallet:</span>
                  <span className="font-medium">{((100000 * tariffData.wallet) / 100).toLocaleString()} UGX</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTariffsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTariffs} disabled={createTariffs.isPending}>
              {createTariffs.isPending ? 'Creating...' : 'Create Tariffs'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default GatewayPartnerDetailsPage

