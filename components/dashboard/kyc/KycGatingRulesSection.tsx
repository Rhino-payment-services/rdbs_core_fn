/* KYC Gating Rules management section:
 * - Filters bar
 * - Rules table
 * - Create Rule modal
 * - Test Gating panel
 */

'use client'

import React, { useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserCheck2,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import {
  useCheckKycGating,
  useCreateKycGatingRule,
  useKycGatingRules,
  useKycGatingRule,
  useUpdateKycGatingRule,
} from '@/lib/hooks/useKycGating'
import type {
  KycContext,
  KycGatingCheckResult,
  KycGatingRule,
  KycStatus,
  VerificationLevel,
  KycGatingProductOrAction,
} from '@/lib/kyc-gating'
import { KYC_GATING_PRODUCT_OPTIONS } from '@/lib/kyc-gating'

const KYC_CONTEXT_LABELS: { value: KycContext; label: string }[] = [
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'MERCHANT', label: 'Merchant' },
]

const KYC_STATUS_OPTIONS: (KycStatus | 'NONE')[] = [
  'NONE',
  'NOT_STARTED',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
]

const VERIFICATION_LEVEL_OPTIONS: (VerificationLevel | 'NONE')[] = [
  'NONE',
  'BASIC',
  'STANDARD',
  'ENHANCED',
  'PREMIUM',
]

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const KycGatingRulesSection: React.FC = () => {
  // Filters
  const [contextFilter, setContextFilter] = useState<'ALL' | KycContext>('ALL')
  const [productFilterInput, setProductFilterInput] = useState('')
  const [appliedFilters, setAppliedFilters] = useState<{
    context?: KycContext
    productOrAction?: string
  }>({})

  const {
    data,
    isLoading: isLoadingRules,
    error: rulesError,
    refetch: refetchRules,
  } = useKycGatingRules(appliedFilters)

  const rules = (data ?? []) as KycGatingRule[]

  // Create rule form state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createContext, setCreateContext] = useState<KycContext | ''>('')
  const [createProductOrAction, setCreateProductOrAction] =
    useState<KycGatingProductOrAction | ''>('')
  const [createMinStatus, setCreateMinStatus] = useState<KycStatus | 'NONE'>(
    'NONE'
  )
  const [createMinLevel, setCreateMinLevel] =
    useState<VerificationLevel | 'NONE'>('NONE')
  const [createRequireMerchantVerified, setCreateRequireMerchantVerified] =
    useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createErrors, setCreateErrors] = useState<{
    context?: string
    productOrAction?: string
  }>({})

  const createRuleMutation = useCreateKycGatingRule()
  const updateRuleMutation = useUpdateKycGatingRule()

  const resetCreateForm = () => {
    setCreateContext('')
    setCreateProductOrAction('')
    setCreateMinStatus('NONE')
    setCreateMinLevel('NONE')
    setCreateRequireMerchantVerified(false)
    setCreateName('')
    setCreateDescription('')
    setCreateErrors({})
  }

  const handleApplyFilters = () => {
    setAppliedFilters({
      context: contextFilter === 'ALL' ? undefined : contextFilter,
      productOrAction: productFilterInput.trim() || undefined,
    })
    refetchRules()
  }

  const handleCreateSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()

    const nextErrors: typeof createErrors = {}
    if (!createContext) {
      nextErrors.context = 'Context is required'
    }
    if (!createProductOrAction.trim()) {
      nextErrors.productOrAction = 'Product or action is required'
    }
    setCreateErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = {
      context: createContext as KycContext,
      productOrAction: createProductOrAction.trim() as KycGatingProductOrAction,
      minKycStatus: createMinStatus === 'NONE' ? undefined : createMinStatus,
      minVerificationLevel:
        createMinLevel === 'NONE' ? undefined : createMinLevel,
      requireMerchantVerified:
        createContext === 'PERSONAL' ? false : createRequireMerchantVerified,
      name: createName.trim() || undefined,
      description: createDescription.trim() || undefined,
    }

    createRuleMutation.mutate(payload, {
      onSuccess: () => {
        setIsCreateOpen(false)
        resetCreateForm()
      },
    })
  }

  // Test gating panel state
  const [testUserId, setTestUserId] = useState('')
  const [testContext, setTestContext] = useState<KycContext | ''>('')
  const [testProductOrAction, setTestProductOrAction] = useState('')
  const [testResult, setTestResult] = useState<KycGatingCheckResult | null>(
    null
  )

  const checkGatingMutation = useCheckKycGating()

  const handleCheckGating = () => {
    if (!testUserId.trim() || !testContext || !testProductOrAction.trim()) {
      return
    }

    setTestResult(null)
    checkGatingMutation.mutate(
      {
        userId: testUserId.trim(),
        context: testContext as KycContext,
        productOrAction: testProductOrAction.trim(),
      },
      {
        onSuccess: (result) => {
          setTestResult(result)
        },
      }
    )
  }

  const hasRules = rules.length > 0

  const isChecking = checkGatingMutation.isPending
  const isCreating = createRuleMutation.isPending
  const isUpdating = updateRuleMutation.isPending

  const testStatusColorClasses = useMemo(() => {
    if (!testResult) return ''
    return testResult.allowed
      ? 'bg-green-50 text-green-800 border border-green-200'
      : 'bg-red-50 text-red-800 border border-red-200'
  }, [testResult])

  // View single rule state
  const [viewRuleId, setViewRuleId] = useState<string | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  const {
    data: viewedRule,
    isLoading: isLoadingViewedRule,
    error: viewRuleError,
  } = useKycGatingRule(viewRuleId, isViewOpen && !!viewRuleId)

  const handleViewRule = (ruleId: string) => {
    setViewRuleId(ruleId)
    setIsViewOpen(true)
  }

  const handleCloseView = () => {
    setIsViewOpen(false)
  }

  // Edit rule modal state
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<KycGatingRule | null>(null)
  const [editContext, setEditContext] = useState<KycContext | ''>('')
  const [editProductOrAction, setEditProductOrAction] =
    useState<KycGatingProductOrAction | ''>('')
  const [editMinStatus, setEditMinStatus] =
    useState<KycStatus | 'NONE'>('NONE')
  const [editMinLevel, setEditMinLevel] =
    useState<VerificationLevel | 'NONE'>('NONE')
  const [editRequireMerchantVerified, setEditRequireMerchantVerified] =
    useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editErrors, setEditErrors] = useState<{
    context?: string
    productOrAction?: string
  }>({})

  const resetEditForm = () => {
    setEditingRule(null)
    setEditContext('')
    setEditProductOrAction('')
    setEditMinStatus('NONE')
    setEditMinLevel('NONE')
    setEditRequireMerchantVerified(false)
    setEditName('')
    setEditDescription('')
    setEditErrors({})
  }

  const populateEditFormFromRule = (rule: KycGatingRule) => {
    setEditingRule(rule)
    setEditContext(rule.context)
    setEditProductOrAction(rule.productOrAction)
    setEditMinStatus(rule.minKycStatus ?? 'NONE')
    setEditMinLevel(rule.minVerificationLevel ?? 'NONE')
    setEditRequireMerchantVerified(
      rule.context === 'PERSONAL' ? false : rule.requireMerchantVerified
    )
    setEditName(rule.name ?? '')
    setEditDescription(rule.description ?? '')
    setEditErrors({})
  }

  const handleOpenEditRule = (rule: KycGatingRule) => {
    populateEditFormFromRule(rule)
    setIsEditOpen(true)
  }

  const handleEditSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    if (!editingRule) return

    const nextErrors: typeof editErrors = {}
    if (!editContext) {
      nextErrors.context = 'Context is required'
    }
    if (!editProductOrAction.trim()) {
      nextErrors.productOrAction = 'Product or action is required'
    }
    setEditErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = {
      context: editContext as KycContext,
      productOrAction: editProductOrAction.trim() as KycGatingProductOrAction,
      minKycStatus: editMinStatus === 'NONE' ? undefined : editMinStatus,
      minVerificationLevel:
        editMinLevel === 'NONE' ? undefined : editMinLevel,
      requireMerchantVerified:
        editContext === 'PERSONAL' ? false : editRequireMerchantVerified,
      name: editName.trim() || undefined,
      description: editDescription.trim() || undefined,
    }

    updateRuleMutation.mutate(
      {
        id: editingRule.id,
        payload,
      },
      {
        onSuccess: () => {
          setIsEditOpen(false)
          resetEditForm()
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                KYC Gating Rules
              </CardTitle>
              <CardDescription>
                Configure minimum KYC requirements for key products and actions.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              disabled={isLoadingRules}
            >
              Create new rule
            </Button>
          </div>
          {/* <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Context
              </label>
              <Select
                value={contextFilter}
                onValueChange={(value) =>
                  setContextFilter(value as 'ALL' | KycContext)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All contexts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {KYC_CONTEXT_LABELS.map((ctx) => (
                    <SelectItem key={ctx.value} value={ctx.value}>
                      {ctx.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Product or action
              </label>
              <Input
                placeholder="e.g. WALLET_CREATE, TRANSFER…"
                value={productFilterInput}
                onChange={(e) => setProductFilterInput(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Filter rules for specific products or actions.
              </p>
            </div>
            <div className="flex items-end justify-start md:justify-end">
              <Button
                type="button"
                onClick={handleApplyFilters}
                disabled={isLoadingRules}
              >
                {isLoadingRules && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Search
              </Button>
            </div>
          </div> */}
        </CardHeader>
        <CardContent>
          {rulesError && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>
                Failed to load KYC gating rules.{' '}
                {(rulesError as any)?.message ||
                  (rulesError as any)?.data?.message ||
                  ''}
              </span>
            </div>
          )}

          {isLoadingRules && !hasRules ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading rules…
            </div>
          ) : !hasRules ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-500">
              No KYC gating rules found. Create one to start enforcing
              requirements.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Context</TableHead>
                    <TableHead>Product / Action</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Min KYC status</TableHead>
                    <TableHead>Min verification level</TableHead>
                    <TableHead>Merchant verified</TableHead>
                    <TableHead>Effective from</TableHead>
                    <TableHead>Effective to</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule: KycGatingRule) => (
                    <TableRow key={rule.id}>
                      <TableCell>{rule.context}</TableCell>
                      <TableCell>{rule.productOrAction}</TableCell>
                      <TableCell>{rule.version}</TableCell>
                      <TableCell>{rule.minKycStatus || '-'}</TableCell>
                      <TableCell>{rule.minVerificationLevel || '-'}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {rule.requireMerchantVerified ? 'Yes' : 'No'}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(rule.effectiveFrom)}</TableCell>
                      <TableCell>{formatDate(rule.effectiveTo)}</TableCell>
                      <TableCell>{rule.name || '-'}</TableCell>
                      <TableCell className="max-w-xs">
                        <span className="line-clamp-2">
                          {rule.description || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="View rule"
                            onClick={() => handleViewRule(rule.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Edit rule"
                            onClick={() => handleOpenEditRule(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Delete rule"
                            disabled
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Rule modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              KYC gating rule details
            </DialogTitle>
            <DialogDescription>
              Full configuration and metadata for this KYC gating rule.
            </DialogDescription>
          </DialogHeader>
          {isLoadingViewedRule ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading rule…
            </div>
          ) : viewRuleError ? (
            <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>
                Failed to load rule.{' '}
                {(viewRuleError as any)?.message ||
                  (viewRuleError as any)?.data?.message ||
                  ''}
              </span>
            </div>
          ) : viewedRule ? (
            <div className="space-y-6 text-sm">
              {/* Status chips */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                  Context: {viewedRule.context}
                </Badge>
                <Badge variant="outline" className="bg-slate-50 text-slate-800 border-slate-200">
                  Version {viewedRule.version}
                </Badge>
                <Badge
                  variant={viewedRule.isActive ? 'secondary' : 'outline'}
                  className={
                    viewedRule.isActive
                      ? 'bg-green-50 text-green-800 border-green-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                  }
                >
                  {viewedRule.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-200"
                >
                  Min KYC:{' '}
                  <span className="ml-1 font-medium">
                    {viewedRule.minKycStatus || 'None'}
                  </span>
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-800 border-purple-200"
                >
                  Min verification:{' '}
                  <span className="ml-1 font-medium">
                    {viewedRule.minVerificationLevel || 'None'}
                  </span>
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    viewedRule.requireMerchantVerified
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-gray-50 text-gray-700 border-gray-200'
                  }
                >
                  Merchant verified{' '}
                  <span className="ml-1 font-medium">
                    {viewedRule.requireMerchantVerified ? 'required' : 'not required'}
                  </span>
                </Badge>
              </div>

              {/* Core details */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/70 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rule overview
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Product / Action
                      </div>
                      <div className="font-medium text-gray-900">
                        {viewedRule.productOrAction}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Effective from
                      </div>
                      <div className="text-gray-900">
                        {formatDate(viewedRule.effectiveFrom)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Effective to
                      </div>
                      <div className="text-gray-900">
                        {formatDate(viewedRule.effectiveTo)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Audit & identifiers
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Rule ID
                      </div>
                      <div className="font-mono text-xs text-gray-900 break-all">
                        {viewedRule.id}
                      </div>
                    </div>
                    <div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Created at
                      </div>
                      <div className="text-gray-900">
                        {formatDate(viewedRule.createdAt)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Updated at
                      </div>
                      <div className="text-gray-900">
                        {formatDate(viewedRule.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & description */}
              <div className="space-y-3 rounded-lg border border-gray-100 bg-white p-4">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    Name
                  </div>
                  <div className="text-gray-900">
                    {viewedRule.name || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    Description
                  </div>
                  <div className="whitespace-pre-wrap text-gray-900">
                    {viewedRule.description || '-'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No rule selected. Please try again.
            </div>
          )}
          <div className="mt-6 flex justify-end border-t pt-4">
            <Button type="button" variant="outline" onClick={handleCloseView}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Rule modal */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) {
            resetCreateForm()
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create new KYC gating rule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Context<span className="text-red-500">*</span>
                </label>
                <Select
                  value={createContext || ''}
                  onValueChange={(value) => {
                    const v = (value || '') as '' | KycContext
                    setCreateContext(v)
                    if (v === 'PERSONAL') {
                      setCreateRequireMerchantVerified(false)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select context" />
                  </SelectTrigger>
                  <SelectContent>
                    {KYC_CONTEXT_LABELS.map((ctx) => (
                      <SelectItem key={ctx.value} value={ctx.value}>
                        {ctx.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createErrors.context && (
                  <p className="mt-1 text-xs text-red-600">
                    {createErrors.context}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Product or action<span className="text-red-500">*</span>
                </label>
                <Select
                  value={createProductOrAction || ''}
                  onValueChange={(value) =>
                    setCreateProductOrAction(
                      (value || '') as KycGatingProductOrAction | ''
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product or action" />
                  </SelectTrigger>
                  <SelectContent>
                    {KYC_GATING_PRODUCT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {createErrors.productOrAction && (
                  <p className="mt-1 text-xs text-red-600">
                    {createErrors.productOrAction}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Minimum KYC status
                </label>
                <Select
                  value={createMinStatus}
                  onValueChange={(value) =>
                    setCreateMinStatus(value as KycStatus | 'NONE')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {KYC_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === 'NONE' ? 'None' : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Minimum verification level
                </label>
                <Select
                  value={createMinLevel}
                  onValueChange={(value) =>
                    setCreateMinLevel(value as VerificationLevel | 'NONE')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_LEVEL_OPTIONS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level === 'NONE' ? 'None' : level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between space-x-4 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-gray-700">
                  Merchant account must be verified
                </div>
                <p className="text-[11px] text-gray-500">
                  Only applicable for merchant context. Personal rules always skip
                  merchant verification.
                </p>
              </div>
              <Switch
                id="requireMerchantVerified"
                checked={createContext === 'PERSONAL' ? false : createRequireMerchantVerified}
                onCheckedChange={(checked) =>
                  setCreateRequireMerchantVerified(Boolean(checked))
                }
                disabled={createContext === 'PERSONAL'}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name
                </label>
                <Input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Optional friendly name for this rule"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description
                </label>
                <Textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Optional description for other admins"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create rule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Rule modal */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) {
            resetEditForm()
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit KYC gating rule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Context<span className="text-red-500">*</span>
                </label>
                <Select
                  value={editContext || ''}
                  onValueChange={(value) => {
                    const v = (value || '') as '' | KycContext
                    setEditContext(v)
                    if (v === 'PERSONAL') {
                      setEditRequireMerchantVerified(false)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select context" />
                  </SelectTrigger>
                  <SelectContent>
                    {KYC_CONTEXT_LABELS.map((ctx) => (
                      <SelectItem key={ctx.value} value={ctx.value}>
                        {ctx.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.context && (
                  <p className="mt-1 text-xs text-red-600">
                    {editErrors.context}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Product or action<span className="text-red-500">*</span>
                </label>
                <Select
                  value={editProductOrAction || ''}
                  onValueChange={(value) =>
                    setEditProductOrAction(
                      (value || '') as KycGatingProductOrAction | ''
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product or action" />
                  </SelectTrigger>
                  <SelectContent>
                    {KYC_GATING_PRODUCT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editErrors.productOrAction && (
                  <p className="mt-1 text-xs text-red-600">
                    {editErrors.productOrAction}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Minimum KYC status
                </label>
                <Select
                  value={editMinStatus}
                  onValueChange={(value) =>
                    setEditMinStatus(value as KycStatus | 'NONE')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {KYC_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === 'NONE' ? 'None' : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Minimum verification level
                </label>
                <Select
                  value={editMinLevel}
                  onValueChange={(value) =>
                    setEditMinLevel(value as VerificationLevel | 'NONE')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_LEVEL_OPTIONS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level === 'NONE' ? 'None' : level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between space-x-4 rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="space-y-0.5">
                <div className="text-xs font-medium text-gray-700">
                  Merchant account must be verified
                </div>
                <p className="text-[11px] text-gray-500">
                  Only applicable for merchant context. Personal rules always skip
                  merchant verification.
                </p>
              </div>
              <Switch
                id="editRequireMerchantVerified"
                checked={editContext === 'PERSONAL' ? false : editRequireMerchantVerified}
                onCheckedChange={(checked) =>
                  setEditRequireMerchantVerified(Boolean(checked))
                }
                disabled={editContext === 'PERSONAL'}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Name
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Optional friendly name for this rule"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Optional description for other admins"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating || !editingRule}>
                {isUpdating && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default KycGatingRulesSection

