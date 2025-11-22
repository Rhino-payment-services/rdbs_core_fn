"use client"

import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Save,
  CheckCircle,
  Key,
  ChevronRight,
  Copy,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  useCreateGatewayPartner,
  useGenerateApiKey,
  CreateGatewayPartnerRequest,
} from '@/lib/hooks/useGatewayPartners'

type WalletType = 'ESCROW' | 'COMMISSION'

const CreateGatewayPartnerPage = () => {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Create Partner, 2: Generate Key
  const [partnerId, setPartnerId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiKeyEnvironment, setApiKeyEnvironment] = useState<'DEVELOPMENT' | 'PRODUCTION'>('PRODUCTION')
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)

  const createPartner = useCreateGatewayPartner()
  const generateKey = useGenerateApiKey()

  // Form state
  const [formData, setFormData] = useState<CreateGatewayPartnerRequest>({
    partnerName: '',
    contactEmail: '',
    contactPhone: '',
    country: '',
    contactPerson: '',
    tier: 'GOLD',
    website: '',
    address: '',
    description: '',
    walletTypes: ['ESCROW'], // Default to ESCROW
  })


  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate wallet types
    if (!formData.walletTypes || formData.walletTypes.length === 0) {
      toast.error('Please select at least one wallet type')
      return
    }

    try {
      const result = await createPartner.mutateAsync(formData)
      const newPartnerId = result.partner.id
      setPartnerId(newPartnerId)
      setStep(2)
      toast.success('Partner created successfully!')
    } catch (error: any) {
      console.error('Failed to create partner:', error)
      toast.error(error.response?.data?.message || 'Failed to create partner')
    }
  }

  const handleGenerateKey = async () => {
    try {
      const result = await generateKey.mutateAsync({
        partnerId,
        description: `${apiKeyEnvironment} API key`,
        environment: apiKeyEnvironment,
        expiresInDays: 365,
      })
      setApiKey(result.data.apiKey)
      setApiKeyEnvironment(result.data.environment || 'PRODUCTION')
      setShowApiKeyDialog(true)
    } catch (error) {
      console.error('Failed to generate API key:', error)
    }
  }

  const toggleWalletType = (type: WalletType, checked: boolean) => {
    setFormData((prev) => {
      const current: WalletType[] = prev.walletTypes ? [...prev.walletTypes] : []
      const next = checked
        ? current.includes(type)
          ? current
          : [...current, type]
        : current.filter((t) => t !== type)
      return { ...prev, walletTypes: next }
    })
  }


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/dashboard" className="hover:text-gray-800">Dashboard</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/dashboard/gateway-partners" className="hover:text-gray-800">Gateway Partners</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="font-semibold text-gray-900">Create Partner</span>
            </nav>
          </div>

          {/* Header */}
          <div className="mb-8">
            <Button variant="outline" onClick={() => router.push('/dashboard/gateway-partners')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Partners
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Gateway Partner</h1>
            <p className="text-gray-600">Set up a new partner who will use RukaPay as a gateway</p>
          </div>

          {/* Progress Steps */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                  </div>
                  <span className="font-medium">Partner Info</span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    2
                  </div>
                  <span className="font-medium">API Key</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Create Partner */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Partner Information</CardTitle>
                <CardDescription>
                  Enter the basic details for the gateway partner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreatePartner} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="partnerName">Partner Name *</Label>
                      <Input
                        id="partnerName"
                        value={formData.partnerName}
                        onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                        placeholder="e.g., Paystack Gateway"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="tier">Partner Tier *</Label>
                      <Select
                        value={formData.tier}
                        onValueChange={(value) => setFormData({ ...formData, tier: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SILVER">Silver (Basic)</SelectItem>
                          <SelectItem value="GOLD">Gold (Standard)</SelectItem>
                          <SelectItem value="PLATINUM">Platinum (Premium)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.tier === 'SILVER' && 'Basic: 50K req/day, 500 txn/day, 50M UGX/day'}
                        {formData.tier === 'GOLD' && 'Standard: 100K req/day, 2K txn/day, 200M UGX/day'}
                        {formData.tier === 'PLATINUM' && 'Premium: 500K req/day, 10K txn/day, 1B UGX/day'}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="contactEmail">Contact Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="integrations@partner.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="contactPhone">Contact Phone *</Label>
                      <Input
                        id="contactPhone"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+234-1-888-7777"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                        placeholder="e.g., NIGERIA"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="contactPerson">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        value={formData.contactPerson}
                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                        placeholder="Integration Team"
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://partner.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the partner..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="walletTypes">Wallet Types *</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="wallet-escrow"
                          checked={formData.walletTypes?.includes('ESCROW')}
                          onChange={(e) => toggleWalletType('ESCROW', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <Label htmlFor="wallet-escrow" className="font-normal cursor-pointer">
                          ESCROW Wallet
                        </Label>
                        <span className="text-xs text-gray-500">
                          (For holding customer funds before transfer)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="wallet-commission"
                          checked={formData.walletTypes?.includes('COMMISSION')}
                          onChange={(e) => toggleWalletType('COMMISSION', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <Label htmlFor="wallet-commission" className="font-normal cursor-pointer">
                          COMMISSION Wallet
                        </Label>
                        <span className="text-xs text-gray-500">
                          (For storing partner commission/revenue)
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Select at least one wallet type. ESCROW is used for holding customer funds, COMMISSION for partner revenue.
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/dashboard/gateway-partners')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPartner.isPending}>
                      {createPartner.isPending ? 'Creating...' : 'Create Partner'}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Generate API Key */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Generate API Key</CardTitle>
                <CardDescription>
                  Create an API key for the partner to authenticate with RukaPay
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Key className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">API Key Generation</h4>
                        <p className="text-sm text-blue-700">
                          The API key will be shown only once. Make sure to copy and save it securely.
                          The partner will use this key to authenticate all requests.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="environment">Environment *</Label>
                    <Select
                      value={apiKeyEnvironment}
                      onValueChange={(value) => setApiKeyEnvironment(value as 'DEVELOPMENT' | 'PRODUCTION')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DEVELOPMENT">Development</SelectItem>
                        <SelectItem value="PRODUCTION">Production</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {apiKeyEnvironment === 'DEVELOPMENT' 
                        ? 'Development keys are for testing and sandbox environments'
                        : 'Production keys are for live transactions and real money'}
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button onClick={handleGenerateKey} disabled={generateKey.isPending}>
                      {generateKey.isPending ? 'Generating...' : 'Generate API Key'}
                      <Key className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>

      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
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
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">Important Security Notice</h4>
                  <p className="text-sm text-yellow-700">
                    This API key provides full access to the gateway. Store it securely and never share it publicly.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <Label>API Key</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={apiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(apiKey)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Share with Partner</h4>
              <p className="text-sm text-blue-700 mb-3">
                Provide this information to your partner for integration:
              </p>
              <div className="space-y-2 text-sm font-mono bg-white p-3 rounded border">
                <div><span className="text-gray-500">API Key:</span> {apiKey}</div>
                <div><span className="text-gray-500">Environment:</span> {apiKeyEnvironment}</div>
                <div><span className="text-gray-500">Header:</span> X-API-Key: {apiKey}</div>
                <div><span className="text-gray-500">Base URL:</span> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/gateway</div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => {
                setShowApiKeyDialog(false)
                router.push(`/dashboard/gateway-partners/${partnerId}`)
              }}>
                View Partner Details
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CreateGatewayPartnerPage

