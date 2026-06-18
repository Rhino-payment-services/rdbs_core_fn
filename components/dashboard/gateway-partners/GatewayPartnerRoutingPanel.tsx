'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertTriangle,
  Edit,
  Eye,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Route,
  Trash2,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/transactions'
import {
  useCreateGatewayPartnerRouting,
  useDeactivateGatewayPartnerRouting,
  useExternalPaymentPartners,
  useGatewayPartnerRouting,
  useUpdateGatewayPartnerRouting,
  type CreateGatewayPartnerRoutingRequest,
  type GatewayPartnerRoutingRule,
  type UpdateGatewayPartnerRoutingRequest,
} from '@/lib/hooks/useGatewayPartnerRouting'
import type { ExternalPaymentPartner } from '@/lib/types/api'

const ROUTING_TRANSACTION_TYPES = [
  { value: 'WALLET_TO_MNO', label: 'Send (Wallet to MNO)' },
  { value: 'MNO_TO_WALLET', label: 'Collect (MNO to Wallet)' },
] as const

const ROUTING_NETWORKS = ['MTN', 'AIRTEL'] as const

const MNO_TRANSACTION_TYPES = new Set(['WALLET_TO_MNO', 'MNO_TO_WALLET'])

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  WALLET_TO_MNO: 'Send',
  MNO_TO_WALLET: 'Collect',
}

interface RoutingFormState {
  transactionType: string
  network: string
  externalPartnerId: string
  geographicRegion: string
  priority: number
  minAmount: string
  maxAmount: string
  dailyLimit: string
  monthlyLimit: string
}

const DEFAULT_FORM: RoutingFormState = {
  transactionType: 'WALLET_TO_MNO',
  network: '',
  externalPartnerId: '',
  geographicRegion: 'UG',
  priority: 1,
  minAmount: '',
  maxAmount: '',
  dailyLimit: '',
  monthlyLimit: '',
}

interface PresetTemplate {
  label: string
  transactionType: string
  network: string
  partnerCode: string
}

const BOBPLUS_PRESETS: PresetTemplate[] = [
  { label: 'Send MTN → Pegasus', transactionType: 'WALLET_TO_MNO', network: 'MTN', partnerCode: 'PEGASUS' },
  { label: 'Send Airtel → ABC', transactionType: 'WALLET_TO_MNO', network: 'AIRTEL', partnerCode: 'ABC' },
  { label: 'Collect MTN → Pegasus', transactionType: 'MNO_TO_WALLET', network: 'MTN', partnerCode: 'PEGASUS' },
  { label: 'Collect Airtel → ABC', transactionType: 'MNO_TO_WALLET', network: 'AIRTEL', partnerCode: 'ABC' },
]

const LIPAD_PRESETS: PresetTemplate[] = [
  { label: 'Send MTN → MTN', transactionType: 'WALLET_TO_MNO', network: 'MTN', partnerCode: 'MTN' },
  { label: 'Send Airtel → ABC', transactionType: 'WALLET_TO_MNO', network: 'AIRTEL', partnerCode: 'ABC' },
  { label: 'Collect MTN → MTN', transactionType: 'MNO_TO_WALLET', network: 'MTN', partnerCode: 'MTN' },
  { label: 'Collect Airtel → ABC', transactionType: 'MNO_TO_WALLET', network: 'AIRTEL', partnerCode: 'ABC' },
]

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const num = Number(trimmed)
  return Number.isNaN(num) ? undefined : num
}

function getTransactionTypeLabel(type: string): string {
  return TRANSACTION_TYPE_LABELS[type] || type.replace(/_/g, ' ')
}

function normalizeNetwork(network?: string | null): string {
  if (!network) return ''
  return network.toUpperCase() === 'AIRTEL' ? 'AIRTEL' : network.toUpperCase()
}

function sortRules(rules: GatewayPartnerRoutingRule[]): GatewayPartnerRoutingRule[] {
  return [...rules].sort((a, b) => {
    const typeCompare = a.transactionType.localeCompare(b.transactionType)
    if (typeCompare !== 0) return typeCompare
    const networkCompare = (a.network || '').localeCompare(b.network || '')
    if (networkCompare !== 0) return networkCompare
    return a.priority - b.priority
  })
}

function formatOptionalLimit(value?: number | null): string {
  if (value === undefined || value === null) return '—'
  return value.toLocaleString()
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-left sm:text-right">{value}</span>
    </div>
  )
}

interface GatewayPartnerRoutingPanelProps {
  partnerId: string
  className?: string
}

export function GatewayPartnerRoutingPanel({
  partnerId,
  className,
}: GatewayPartnerRoutingPanelProps) {
  const {
    data: rules = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useGatewayPartnerRouting(partnerId)
  const { data: externalPartners = [], isLoading: partnersLoading } =
    useExternalPaymentPartners()

  const createRouting = useCreateGatewayPartnerRouting()
  const updateRouting = useUpdateGatewayPartnerRouting()
  const deactivateRouting = useDeactivateGatewayPartnerRouting()

  const [showInactive, setShowInactive] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<GatewayPartnerRoutingRule | null>(null)
  const [viewingRule, setViewingRule] = useState<GatewayPartnerRoutingRule | null>(null)
  const [ruleToDeactivate, setRuleToDeactivate] = useState<GatewayPartnerRoutingRule | null>(null)
  const [form, setForm] = useState<RoutingFormState>(DEFAULT_FORM)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const filteredRules = useMemo(() => {
    const sorted = sortRules(rules)
    if (showInactive) return sorted
    return sorted.filter((rule) => rule.isActive)
  }, [rules, showInactive])

  const isMnoType = MNO_TRANSACTION_TYPES.has(form.transactionType)
  const isSaving = createRouting.isPending || updateRouting.isPending

  const openCreateDialog = () => {
    setEditingRule(null)
    setForm(DEFAULT_FORM)
    setShowAdvanced(false)
    setDialogOpen(true)
  }

  const openEditDialog = (rule: GatewayPartnerRoutingRule) => {
    setEditingRule(rule)
    setForm({
      transactionType: rule.transactionType,
      network: normalizeNetwork(rule.network),
      externalPartnerId: rule.externalPartnerId,
      geographicRegion: rule.geographicRegion || 'UG',
      priority: rule.priority,
      minAmount: rule.minAmount != null ? String(rule.minAmount) : '',
      maxAmount: rule.maxAmount != null ? String(rule.maxAmount) : '',
      dailyLimit: rule.dailyLimit != null ? String(rule.dailyLimit) : '',
      monthlyLimit: rule.monthlyLimit != null ? String(rule.monthlyLimit) : '',
    })
    setShowAdvanced(
      rule.minAmount != null ||
        rule.maxAmount != null ||
        rule.dailyLimit != null ||
        rule.monthlyLimit != null,
    )
    setDialogOpen(true)
  }

  const openDetailsDialog = (rule: GatewayPartnerRoutingRule) => {
    setViewingRule(rule)
    setDetailsOpen(true)
  }

  const resolvePartnerId = (
    partners: ExternalPaymentPartner[],
    partnerCode: string,
  ): string | undefined => {
    const match = partners.find(
      (p) => p.partnerCode.toUpperCase() === partnerCode.toUpperCase(),
    )
    return match?.id
  }

  const applyPreset = (preset: PresetTemplate) => {
    const partnerIdResolved = resolvePartnerId(externalPartners, preset.partnerCode)
    if (!partnerIdResolved) {
      toast.error(`Processor "${preset.partnerCode}" not found in external partners list`)
    }
    setEditingRule(null)
    setForm({
      ...DEFAULT_FORM,
      transactionType: preset.transactionType,
      network: preset.network,
      externalPartnerId: partnerIdResolved || '',
    })
    setShowAdvanced(false)
    setDialogOpen(true)
  }

  const hasDuplicateActiveRoute = (
    transactionType: string,
    network: string,
    geographicRegion: string,
  ): boolean => {
    return rules.some(
      (rule) =>
        rule.isActive &&
        rule.transactionType === transactionType &&
        normalizeNetwork(rule.network) === normalizeNetwork(network) &&
        rule.geographicRegion === geographicRegion &&
        rule.id !== editingRule?.id,
    )
  }

  const validateForm = (): boolean => {
    if (!form.transactionType) {
      toast.error('Please select a transaction type')
      return false
    }
    if (isMnoType && !form.network) {
      toast.error('Please select a network for MNO transactions')
      return false
    }
    if (!form.externalPartnerId) {
      toast.error('Please select a destination processor')
      return false
    }
    if (
      !editingRule &&
      hasDuplicateActiveRoute(form.transactionType, form.network, form.geographicRegion)
    ) {
      toast.error(
        'An active route already exists for this transaction type, network, and region',
      )
      return false
    }
    return true
  }

  const buildCreatePayload = (): CreateGatewayPartnerRoutingRequest => {
    const payload: CreateGatewayPartnerRoutingRequest = {
      transactionType: form.transactionType,
      externalPartnerId: form.externalPartnerId,
      geographicRegion: form.geographicRegion || 'UG',
      priority: form.priority || 1,
    }
    if (isMnoType) payload.network = form.network
    const minAmount = parseOptionalNumber(form.minAmount)
    const maxAmount = parseOptionalNumber(form.maxAmount)
    const dailyLimit = parseOptionalNumber(form.dailyLimit)
    const monthlyLimit = parseOptionalNumber(form.monthlyLimit)
    if (minAmount !== undefined) payload.minAmount = minAmount
    if (maxAmount !== undefined) payload.maxAmount = maxAmount
    if (dailyLimit !== undefined) payload.dailyLimit = dailyLimit
    if (monthlyLimit !== undefined) payload.monthlyLimit = monthlyLimit
    return payload
  }

  const buildUpdatePayload = (): UpdateGatewayPartnerRoutingRequest => {
    const payload: UpdateGatewayPartnerRoutingRequest = {
      externalPartnerId: form.externalPartnerId,
      priority: form.priority || 1,
    }
    const minAmount = parseOptionalNumber(form.minAmount)
    const maxAmount = parseOptionalNumber(form.maxAmount)
    const dailyLimit = parseOptionalNumber(form.dailyLimit)
    const monthlyLimit = parseOptionalNumber(form.monthlyLimit)
    payload.minAmount = minAmount ?? null
    payload.maxAmount = maxAmount ?? null
    payload.dailyLimit = dailyLimit ?? null
    payload.monthlyLimit = monthlyLimit ?? null
    return payload
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editingRule) {
        await updateRouting.mutateAsync({
          partnerId,
          routingId: editingRule.id,
          data: buildUpdatePayload(),
        })
      } else {
        await createRouting.mutateAsync({
          partnerId,
          data: buildCreatePayload(),
        })
      }
      setDialogOpen(false)
      setEditingRule(null)
      setForm(DEFAULT_FORM)
    } catch {
      // Toast handled in hook
    }
  }

  const handleDeactivate = async () => {
    if (!ruleToDeactivate) return
    try {
      await deactivateRouting.mutateAsync({
        partnerId,
        routingId: ruleToDeactivate.id,
      })
      setDeactivateDialogOpen(false)
      setRuleToDeactivate(null)
    } catch {
      // Toast handled in hook
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-blue-600" />
              Payment Routing
            </CardTitle>
            <CardDescription>
              Configure which payment processor handles this partner&apos;s transactions
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive-routing"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive-routing" className="text-sm text-gray-600">
                Show inactive
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Route
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Routes define which payment processor handles this partner&apos;s transactions. If no
            route is configured, the system uses the global default routing.
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-gray-500 self-center mr-1">Quick presets:</span>
          {BOBPLUS_PRESETS.map((preset) => (
            <Button
              key={`bobplus-${preset.label}`}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => applyPreset(preset)}
              disabled={partnersLoading}
            >
              <Zap className="h-3 w-3 mr-1" />
              BobPlus: {preset.label}
            </Button>
          ))}
          {LIPAD_PRESETS.map((preset) => (
            <Button
              key={`lipad-${preset.label}`}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => applyPreset(preset)}
              disabled={partnersLoading}
            >
              <Zap className="h-3 w-3 mr-1" />
              Lipad: {preset.label}
            </Button>
          ))}
        </div>

        {isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-3" />
            <p className="text-gray-900 font-medium mb-1">Failed to load routing rules</p>
            <p className="text-gray-600 text-sm mb-4">
              Unable to retrieve routing configuration from the server.
            </p>
            <Button onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-8">
            <Route className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-3">
              {rules.length > 0
                ? 'No active routing rules. Toggle "Show inactive" to see deactivated rules.'
                : 'No routing rules configured yet'}
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Route
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction type</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Destination processor</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow
                    key={rule.id}
                    className={cn(!rule.isActive && 'opacity-60')}
                  >
                    <TableCell className="font-medium">
                      <Badge variant="outline">
                        {getTransactionTypeLabel(rule.transactionType)}
                      </Badge>
                      <span className="sr-only">{rule.transactionType}</span>
                    </TableCell>
                    <TableCell>
                      {rule.network ? (
                        <Badge variant="secondary">{rule.network}</Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {rule.externalPartner ? (
                        <span>
                          {rule.externalPartner.partnerName}{' '}
                          <Badge variant="outline" className="ml-1 text-xs">
                            {rule.externalPartner.partnerCode}
                          </Badge>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>{rule.geographicRegion}</TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      {rule.isActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {rule.lastUsedAt ? formatDate(rule.lastUsedAt) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailsDialog(rule)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {rule.isActive && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(rule)}
                              title="Edit route"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setRuleToDeactivate(rule)
                                setDeactivateDialogOpen(true)
                              }}
                              title="Deactivate route"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit routing rule' : 'Add routing rule'}
            </DialogTitle>
            <DialogDescription>
              {editingRule
                ? 'Update the destination processor, priority, or amount limits for this route.'
                : 'Define which processor handles transactions for this partner.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="transactionType">Transaction type *</Label>
              <Select
                value={form.transactionType}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    transactionType: value,
                    network: MNO_TRANSACTION_TYPES.has(value) ? prev.network : '',
                  }))
                }
                disabled={!!editingRule}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  {ROUTING_TRANSACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isMnoType && (
              <div>
                <Label htmlFor="network">Network *</Label>
                <Select
                  value={form.network || undefined}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, network: value }))
                  }
                  disabled={!!editingRule}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROUTING_NETWORKS.map((network) => (
                      <SelectItem key={network} value={network}>
                        {network === 'AIRTEL' ? 'Airtel' : network}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="externalPartnerId">Destination processor *</Label>
              <Select
                value={form.externalPartnerId || undefined}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, externalPartnerId: value }))
                }
                disabled={partnersLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select processor" />
                </SelectTrigger>
                <SelectContent>
                  {externalPartners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.partnerName} ({partner.partnerCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="geographicRegion">Region</Label>
                <Select
                  value={form.geographicRegion}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, geographicRegion: value }))
                  }
                  disabled={!!editingRule}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UG">Uganda (UG)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  min={1}
                  className="mt-1"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      priority: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <button
                type="button"
                className="text-sm text-blue-600 hover:underline"
                onClick={() => setShowAdvanced((prev) => !prev)}
              >
                {showAdvanced ? 'Hide advanced limits' : 'Show advanced limits'}
              </button>
              {showAdvanced && (
                <div className="mt-3 grid grid-cols-2 gap-4 rounded-lg border p-4 bg-gray-50">
                  <div>
                    <Label htmlFor="minAmount">Min amount</Label>
                    <Input
                      id="minAmount"
                      type="number"
                      min={0}
                      className="mt-1"
                      value={form.minAmount}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, minAmount: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxAmount">Max amount</Label>
                    <Input
                      id="maxAmount"
                      type="number"
                      min={0}
                      className="mt-1"
                      value={form.maxAmount}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, maxAmount: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dailyLimit">Daily limit</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      min={0}
                      className="mt-1"
                      value={form.dailyLimit}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, dailyLimit: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyLimit">Monthly limit</Label>
                    <Input
                      id="monthlyLimit"
                      type="number"
                      min={0}
                      className="mt-1"
                      value={form.monthlyLimit}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, monthlyLimit: e.target.value }))
                      }
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingRule ? 'Save changes' : 'Create route'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Routing rule details</DialogTitle>
            <DialogDescription>
              Full configuration for this payment routing rule.
            </DialogDescription>
          </DialogHeader>

          {viewingRule && (
            <div className="space-y-1">
              <DetailRow
                label="Transaction type"
                value={
                  <span>
                    {getTransactionTypeLabel(viewingRule.transactionType)}{' '}
                    <Badge variant="outline" className="ml-1 text-xs font-normal">
                      {viewingRule.transactionType}
                    </Badge>
                  </span>
                }
              />
              <DetailRow
                label="Network"
                value={
                  viewingRule.network ? (
                    <Badge variant="secondary">{viewingRule.network}</Badge>
                  ) : (
                    '—'
                  )
                }
              />
              <DetailRow
                label="Destination processor"
                value={
                  viewingRule.externalPartner ? (
                    <span>
                      {viewingRule.externalPartner.partnerName}{' '}
                      <Badge variant="outline" className="ml-1 text-xs font-normal">
                        {viewingRule.externalPartner.partnerCode}
                      </Badge>
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
              <DetailRow label="Region" value={viewingRule.geographicRegion} />
              <DetailRow label="Priority" value={viewingRule.priority} />
              <DetailRow
                label="Status"
                value={
                  viewingRule.isActive ? (
                    <Badge className="bg-green-500">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )
                }
              />
              <DetailRow label="Min amount" value={formatOptionalLimit(viewingRule.minAmount)} />
              <DetailRow label="Max amount" value={formatOptionalLimit(viewingRule.maxAmount)} />
              <DetailRow label="Daily limit" value={formatOptionalLimit(viewingRule.dailyLimit)} />
              <DetailRow
                label="Monthly limit"
                value={formatOptionalLimit(viewingRule.monthlyLimit)}
              />
              <DetailRow
                label="Last used"
                value={viewingRule.lastUsedAt ? formatDate(viewingRule.lastUsedAt) : '—'}
              />
              <DetailRow
                label="Created"
                value={viewingRule.createdAt ? formatDate(viewingRule.createdAt) : '—'}
              />
              <DetailRow
                label="Updated"
                value={viewingRule.updatedAt ? formatDate(viewingRule.updatedAt) : '—'}
              />
              <DetailRow
                label="Rule ID"
                value={<span className="font-mono text-xs break-all">{viewingRule.id}</span>}
              />
            </div>
          )}

          <DialogFooter>
            {viewingRule?.isActive && (
              <Button
                variant="outline"
                onClick={() => {
                  setDetailsOpen(false)
                  openEditDialog(viewingRule)
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit route
              </Button>
            )}
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this routing rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate routing for{' '}
              <strong>
                {ruleToDeactivate
                  ? `${getTransactionTypeLabel(ruleToDeactivate.transactionType)}${
                      ruleToDeactivate.network ? ` / ${ruleToDeactivate.network}` : ''
                    }`
                  : 'this route'}
              </strong>
              . The system will fall back to global default routing for matching transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deactivateRouting.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
