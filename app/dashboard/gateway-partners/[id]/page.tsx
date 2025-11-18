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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
} from '@/lib/hooks/useGatewayPartners'
import Link from 'next/link'
import toast from 'react-hot-toast'

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

  const { data: partner, isLoading, error, refetch } = useGatewayPartner(partnerId)
  const generateKey = useGenerateApiKey()
  const suspendPartner = useSuspendGatewayPartner()
  const revokeKey = useRevokeApiKey()

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

    </div>
  )
}

export default GatewayPartnerDetailsPage

