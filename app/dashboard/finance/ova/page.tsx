"use client"

import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  RefreshCw,
  Link2,
  Plus,
  Search,
  Loader2,
  History,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import {
  useOvaAccounts,
  useCreateOvaAccount,
  useFundOva,
  type OvaAccount,
} from '@/lib/hooks/useOvaAccounts'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

const OvaAccountsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [partnerFilter, setPartnerFilter] = useState<string>('all')
  const [ovaTypeFilter, setOvaTypeFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFundModal, setShowFundModal] = useState(false)
  const [selectedOva, setSelectedOva] = useState<OvaAccount | null>(null)
  const [fundForm, setFundForm] = useState({ amount: '', reference: '', description: '' })
  const [createForm, setCreateForm] = useState({
    code: '',
    name: '',
    partnerId: '',
    partnerCode: '',
    ovaType: 'COLLECTION' as 'COLLECTION' | 'DISBURSEMENT' | 'SINGLE',
    network: '',
    transactionTypes: 'MNO_TO_WALLET',
    currency: 'UGX',
    description: '',
  })

  const { data: ovaAccounts = [], isLoading, refetch } = useOvaAccounts()
  const { data: partners = [] } = useQuery({
    queryKey: ['external-payment-partners'],
    queryFn: async () => {
      const res = await api.get('/admin/external-payment-partners')
      return res.data || []
    },
  })
  const createOva = useCreateOvaAccount()
  const fundOva = useFundOva()

  const filteredAccounts = ovaAccounts.filter((acc: OvaAccount) => {
    const matchesSearch =
      acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.partnerCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPartner = partnerFilter === 'all' || acc.partnerCode === partnerFilter
    const matchesType = ovaTypeFilter === 'all' || acc.ovaType === ovaTypeFilter
    return matchesSearch && matchesPartner && matchesType
  })

  const formatAmount = (val: number | string | null) => {
    if (val == null) return '-'
    const n = typeof val === 'string' ? parseFloat(val) : val
    return new Intl.NumberFormat('en-UG', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n)
  }

  const handleOpenFundModal = (ova: OvaAccount) => {
    setSelectedOva(ova)
    setFundForm({ amount: '', reference: '', description: 'Manual funding' })
    setShowFundModal(true)
  }

  const handleAddFunding = async () => {
    if (!selectedOva) return
    const amount = fundForm.amount ? parseFloat(fundForm.amount) : 0
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    await fundOva.mutateAsync({
      id: selectedOva.id,
      data: {
        amount,
        reference: fundForm.reference || undefined,
        description: fundForm.description || 'Manual funding',
      },
    })
    setShowFundModal(false)
    setSelectedOva(null)
    setFundForm({ amount: '', reference: '', description: '' })
  }

  const handleCreateOva = async () => {
    if (!createForm.partnerId || !createForm.partnerCode) {
      toast.error('Select a partner')
      return
    }
    if (!createForm.code.trim()) {
      toast.error('Code is required')
      return
    }
    const transactionTypes = createForm.transactionTypes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    await createOva.mutateAsync({
      ...createForm,
      partnerId: createForm.partnerId,
      partnerCode: createForm.partnerCode,
      network: createForm.network || undefined,
      transactionTypes: transactionTypes.length ? transactionTypes : ['MNO_TO_WALLET'],
      description: createForm.description || undefined,
    })
    setShowCreateModal(false)
    setCreateForm({
      code: '',
      name: '',
      partnerId: '',
      partnerCode: '',
      ovaType: 'COLLECTION',
      network: '',
      transactionTypes: 'MNO_TO_WALLET',
      currency: 'UGX',
      description: '',
    })
  }

  const uniquePartners = Array.from(
    new Set((ovaAccounts as OvaAccount[]).map((a) => a.partnerCode))
  ).sort()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OVA Accounts</h1>
            <p className="text-gray-600 mt-1">
              Operator Virtual Accounts – track expected balance movements
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create OVA
            </Button>
            <Link href="/dashboard/finance/ova/mappings">
              <Button variant="outline" size="sm">
                <Link2 className="h-4 w-4 mr-2" />
                Mappings
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>
              Expected balance is derived from transaction movements. Actual balance is viewed when you log in to each operator OVA.
            </CardDescription>
            <div className="flex gap-4 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by code, name, partner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All partners</SelectItem>
                  {uniquePartners.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ovaTypeFilter} onValueChange={setOvaTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="OVA type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="COLLECTION">Collection</SelectItem>
                  <SelectItem value="DISBURSEMENT">Disbursement</SelectItem>
                  <SelectItem value="SINGLE">Single</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No OVA accounts found. Create one or run the seed script.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((acc: OvaAccount) => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-mono text-sm">{acc.code}</TableCell>
                      <TableCell>{acc.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{acc.partnerCode}</Badge>
                      </TableCell>
                      <TableCell>{acc.ovaType}</TableCell>
                      <TableCell>{acc.network || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatAmount(acc.expectedBalance)} UGX
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-8 w-8" asChild title="View movements">
                            <Link href={`/dashboard/finance/ova/${acc.id}/movements`}>
                              <History className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="default" size="icon" className="h-8 w-8" onClick={() => handleOpenFundModal(acc)} title="Add funding">
                            <Wallet className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add funding modal – records a CREDIT movement and shows in movements log */}
      <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add funding</DialogTitle>
            <DialogDescription>
              {selectedOva?.code} – Add amount to this OVA. A credit movement will be recorded and appear in the movements log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Amount to add (UGX)</label>
              <Input
                type="number"
                min={1}
                placeholder="Enter amount"
                value={fundForm.amount}
                onChange={(e) => setFundForm((f) => ({ ...f, amount: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reference (optional)</label>
              <Input
                placeholder="e.g. Bank transfer ref"
                value={fundForm.reference}
                onChange={(e) => setFundForm((f) => ({ ...f, reference: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="e.g. Manual funding"
                value={fundForm.description}
                onChange={(e) => setFundForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFundModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFunding} disabled={fundOva.isPending}>
              {fundOva.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add funding'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create OVA account</DialogTitle>
            <DialogDescription>
              Create a new Operator Virtual Account for tracking expected balance movements
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Partner</label>
              <Select
                value={createForm.partnerId}
                onValueChange={(v) => {
                  const p = partners.find((x: any) => x.id === v)
                  setCreateForm((f) => ({
                    ...f,
                    partnerId: v,
                    partnerCode: p?.partnerCode || '',
                  }))
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.partnerName} ({p.partnerCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Code (unique)</label>
              <Input
                placeholder="e.g. ABC_MNO_COLLECTION_MTN"
                value={createForm.code}
                onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="ABC MNO Collection (MTN)"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">OVA type</label>
                <Select
                  value={createForm.ovaType}
                  onValueChange={(v: any) =>
                    setCreateForm((f) => ({ ...f, ovaType: v }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLLECTION">Collection</SelectItem>
                    <SelectItem value="DISBURSEMENT">Disbursement</SelectItem>
                    <SelectItem value="SINGLE">Single</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Network (optional)</label>
                <Input
                  placeholder="Airtel, MTN"
                  value={createForm.network}
                  onChange={(e) => setCreateForm((f) => ({ ...f, network: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Transaction types (comma-separated)</label>
              <Input
                placeholder="MNO_TO_WALLET, WALLET_TO_MNO"
                value={createForm.transactionTypes}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, transactionTypes: e.target.value }))
                }
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOva} disabled={createOva.isPending}>
              {createOva.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OvaAccountsPage
