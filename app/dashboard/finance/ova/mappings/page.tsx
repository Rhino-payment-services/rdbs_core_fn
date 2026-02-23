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
import { Link2, ArrowLeft, Plus, Search, Loader2, Trash2, Pencil } from 'lucide-react'
import Link from 'next/link'
import {
  useOvaMappings,
  useCreateOvaMapping,
  useUpdateOvaMapping,
  useDeleteOvaMapping,
  useOvaAccounts,
  type OvaAccountMapping,
} from '@/lib/hooks/useOvaAccounts'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

const OVA_TRANSACTION_TYPES = [
  { value: 'MNO_TO_WALLET', label: 'MNO_TO_WALLET (MNO collection)' },
  { value: 'WALLET_TO_MNO', label: 'WALLET_TO_MNO (MNO disbursement)' },
  { value: 'WALLET_TOPUP_PULL', label: 'WALLET_TOPUP_PULL' },
  { value: 'UTILITIES', label: 'UTILITIES' },
  { value: 'BILL_PAYMENT', label: 'BILL_PAYMENT' },
] as const

const OvaMappingsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [partnerFilter, setPartnerFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMapping, setEditingMapping] = useState<OvaAccountMapping | null>(null)
  const [editOvaAccountId, setEditOvaAccountId] = useState('')
  const [createForm, setCreateForm] = useState({
    transactionType: 'MNO_TO_WALLET',
    partnerCode: '',
    network: '',
    ovaAccountId: '',
    action: 'CREDIT' as 'CREDIT' | 'DEBIT',
  })

  const { data: mappings = [], isLoading, refetch } = useOvaMappings()
  const { data: ovaAccounts = [] } = useOvaAccounts()
  const { data: partners = [] } = useQuery({
    queryKey: ['external-payment-partners'],
    queryFn: async () => {
      const res = await api.get('/admin/external-payment-partners')
      return res.data || []
    },
  })
  const createMapping = useCreateOvaMapping()
  const updateMapping = useUpdateOvaMapping()
  const deleteMapping = useDeleteOvaMapping()

  const filteredMappings = (mappings as OvaAccountMapping[]).filter((m) => {
    const matchesSearch =
      m.transactionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.partnerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.ovaAccount?.code?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || m.transactionType === typeFilter
    const matchesPartner = partnerFilter === 'all' || m.partnerCode === partnerFilter
    return matchesSearch && matchesType && matchesPartner
  })

  const uniqueTypes = Array.from(
    new Set((mappings as OvaAccountMapping[]).map((m) => m.transactionType))
  ).sort()
  const uniquePartners = Array.from(
    new Set((mappings as OvaAccountMapping[]).map((m) => m.partnerCode))
  ).sort()

  const handleCreateMapping = async () => {
    if (!createForm.ovaAccountId) {
      return
    }
    await createMapping.mutateAsync({
      transactionType: createForm.transactionType,
      partnerCode: createForm.partnerCode,
      network: createForm.network || undefined,
      ovaAccountId: createForm.ovaAccountId,
      action: createForm.action,
    })
    setShowCreateModal(false)
    setCreateForm({
      transactionType: 'MNO_TO_WALLET',
      partnerCode: '',
      network: '',
      ovaAccountId: '',
      action: 'CREDIT',
    })
  }

  const handleOpenEditModal = (m: OvaAccountMapping) => {
    setEditingMapping(m)
    setEditOvaAccountId(m.ovaAccountId)
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editingMapping || !editOvaAccountId) return
    await updateMapping.mutateAsync({
      id: editingMapping.id,
      ovaAccountId: editOvaAccountId,
    })
    setShowEditModal(false)
    setEditingMapping(null)
    setEditOvaAccountId('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this mapping? It will no longer be used for new transactions.')) return
    await deleteMapping.mutateAsync(id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/finance/ova">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">OVA Mappings</h1>
              <p className="text-gray-600 mt-1">
                Map transaction types + partner + network to OVA accounts (CREDIT/DEBIT)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <Search className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create mapping
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mappings</CardTitle>
            <CardDescription>
              ABC/Pegasus collections on Airtel → AIRTEL_COLLECTION; on MTN → MTN_MNO. You can edit
              any mapping to change its target OVA account.
            </CardDescription>
            <div className="flex gap-4 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by type, partner, OVA code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {uniqueTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger className="w-[140px]">
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
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredMappings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No mappings found. Create one or run the OVA seed script.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction type</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>OVA account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMappings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono text-sm">{m.transactionType}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{m.partnerCode}</Badge>
                      </TableCell>
                      <TableCell>{m.network || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={m.action === 'CREDIT' ? 'default' : 'secondary'}
                        >
                          {m.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href="/dashboard/finance/ova"
                          className="text-blue-600 hover:underline font-mono text-sm"
                        >
                          {m.ovaAccount?.code || m.ovaAccountId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {m.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {m.isActive && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(m)}
                              disabled={updateMapping.isPending}
                              title="Edit mapping"
                            >
                              <Pencil className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(m.id)}
                              disabled={deleteMapping.isPending}
                              title="Deactivate mapping"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open)
          if (!open) setEditingMapping(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit mapping</DialogTitle>
            <DialogDescription>
              {editingMapping
                ? `${editingMapping.transactionType} / ${editingMapping.partnerCode} / ${editingMapping.network ?? 'null'} / ${editingMapping.action} – change target OVA`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">OVA account</label>
              <Select
                value={editOvaAccountId}
                onValueChange={setEditOvaAccountId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select OVA account" />
                </SelectTrigger>
                <SelectContent>
                  {(ovaAccounts as any[]).map((oa) => (
                    <SelectItem key={oa.id} value={oa.id}>
                      {oa.code} ({oa.partnerCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMapping.isPending || !editOvaAccountId}
            >
              {updateMapping.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create OVA mapping</DialogTitle>
            <DialogDescription>
              Map a transaction type + partner + network to an OVA account with CREDIT or DEBIT
              action
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Transaction type</label>
              <Select
                value={createForm.transactionType}
                onValueChange={(v) =>
                  setCreateForm((f) => ({ ...f, transactionType: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  {OVA_TRANSACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Partner</label>
              <Select
                value={createForm.partnerCode}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, partnerCode: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent>
                  {(partners as { id: string; partnerCode: string; partnerName: string }[]).map(
                    (p) => (
                      <SelectItem key={p.id} value={p.partnerCode}>
                        {p.partnerName} ({p.partnerCode})
                      </SelectItem>
                    )
                  )}
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
            <div>
              <label className="text-sm font-medium">Action</label>
              <Select
                value={createForm.action}
                onValueChange={(v: 'CREDIT' | 'DEBIT') =>
                  setCreateForm((f) => ({ ...f, action: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREDIT">CREDIT (e.g. MNO collection)</SelectItem>
                  <SelectItem value="DEBIT">DEBIT (e.g. MNO disbursement, Bill)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">OVA account</label>
              <Select
                value={createForm.ovaAccountId}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, ovaAccountId: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select OVA account" />
                </SelectTrigger>
                <SelectContent>
                  {(ovaAccounts as any[]).map((oa) => (
                    <SelectItem key={oa.id} value={oa.id}>
                      {oa.code} ({oa.partnerCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateMapping}
              disabled={
                createMapping.isPending ||
                !createForm.ovaAccountId ||
                !createForm.partnerCode
              }
            >
              {createMapping.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OvaMappingsPage
