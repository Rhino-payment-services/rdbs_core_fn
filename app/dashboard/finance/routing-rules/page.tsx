'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import {
  useAmountRoutingRules,
  useUpdateAmountRoutingRuleStatus,
  type AmountRoutingRule,
  type AmountRoutingRulesListParams,
} from '@/lib/hooks/useAmountRoutingRules'
import { AmountRoutingRuleFormDialog } from '@/components/dashboard/routing-rules/AmountRoutingRuleFormDialog'
import { AmountRoutingRuleViewDialog } from '@/components/dashboard/routing-rules/AmountRoutingRuleViewDialog'
import { AmountRoutingRuleDeleteDialog } from '@/components/dashboard/routing-rules/AmountRoutingRuleDeleteDialog'
import { formatAmountBand } from '@/lib/routing-rules/utils'
import { formatDate } from '@/lib/utils/transactions'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  ArrowLeft,
  Edit,
  Eye,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Route,
  Trash2,
} from 'lucide-react'

function AmountRoutingRulesContent() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission(PERMISSIONS.TARIFF_UPDATE)

  const [currencyFilter, setCurrencyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const listParams = useMemo((): AmountRoutingRulesListParams | undefined => {
    const params: AmountRoutingRulesListParams = {}
    if (currencyFilter !== 'all') params.currency = currencyFilter
    if (statusFilter === 'active') params.isActive = true
    if (statusFilter === 'inactive') params.isActive = false
    return Object.keys(params).length > 0 ? params : undefined
  }, [currencyFilter, statusFilter])

  const {
    data: rules = [],
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAmountRoutingRules(listParams)

  const { data: allRules = [] } = useAmountRoutingRules()

  const updateStatus = useUpdateAmountRoutingRuleStatus()

  const [formOpen, setFormOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AmountRoutingRule | null>(null)
  const [viewingRule, setViewingRule] = useState<AmountRoutingRule | null>(null)
  const [deletingRule, setDeletingRule] = useState<AmountRoutingRule | null>(null)

  const currencyOptions = useMemo(() => {
    const fromRules = new Set(rules.map((r) => r.currency.toUpperCase()))
    fromRules.add('UGX')
    return Array.from(fromRules).sort()
  }, [rules])

  const stats = useMemo(() => {
    const active = rules.filter((r) => r.isActive).length
    const inactive = rules.filter((r) => !r.isActive).length
    const totalUsage = rules.reduce((sum, r) => sum + r.totalTransactions, 0)
    return { total: rules.length, active, inactive, totalUsage }
  }, [rules])

  const openCreate = () => {
    setEditingRule(null)
    setFormOpen(true)
  }

  const openEdit = (rule: AmountRoutingRule) => {
    setEditingRule(rule)
    setFormOpen(true)
  }

  const openView = (rule: AmountRoutingRule) => {
    setViewingRule(rule)
    setViewOpen(true)
  }

  const openDelete = (rule: AmountRoutingRule) => {
    setDeletingRule(rule)
    setDeleteOpen(true)
  }

  const handleToggleStatus = async (rule: AmountRoutingRule) => {
    await updateStatus.mutateAsync({ id: rule.id, isActive: !rule.isActive })
  }

  return (
    <>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('finance/routing-rules')} />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
        <div>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/finance')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Finance
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Amount routing rules
          </h1>
          <p className="text-gray-600 text-sm max-w-2xl">
            Configure amount bands per currency that route transactions to an external payment
            partner. When no rule matches, partner mappings are used as fallback.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          {canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create rule
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total rules</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total routed transactions</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalUsage.toLocaleString('en-UG')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-48">
              <p className="text-sm text-gray-500 mb-1">Currency</p>
              <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All currencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All currencies</SelectItem>
                  {currencyOptions.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rules</CardTitle>
          <CardDescription>
            Sorted by currency, minimum amount, and priority (server-side).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-3" />
              <p className="text-gray-900 font-medium mb-1">Failed to load routing rules</p>
              <p className="text-gray-600 text-sm mb-4">
                Unable to retrieve amount routing rules from the server.
              </p>
              <Button onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
                Try Again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#08163d]" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12">
              <Route className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-900 font-medium mb-1">No routing rules yet</p>
              <p className="text-gray-600 text-sm mb-4 max-w-md mx-auto">
                Amount bands route transactions to external payment partners by currency and range.
                Partner mappings apply when no rule matches.
              </p>
              {canManage && (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create rule
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Currency</TableHead>
                    <TableHead>Range</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Last used</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id} className={cn(!rule.isActive && 'opacity-70')}>
                      <TableCell className="font-medium">{rule.currency.toUpperCase()}</TableCell>
                      <TableCell>
                        {formatAmountBand(rule.currency, rule.minAmount, rule.maxAmount)}
                      </TableCell>
                      <TableCell>
                        {rule.partner ? (
                          <span>
                            {rule.partner.partnerCode}
                            <span className="text-gray-500 text-xs block sm:inline sm:ml-1">
                              {rule.partner.partnerName}
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>{rule.priority}</TableCell>
                      <TableCell>
                        {rule.isActive ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>{rule.totalTransactions.toLocaleString('en-UG')}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {rule.lastUsedAt ? formatDate(rule.lastUsedAt) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openView(rule)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(rule)}
                                title="Edit rule"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void handleToggleStatus(rule)}
                                disabled={updateStatus.isPending}
                                title={rule.isActive ? 'Deactivate' : 'Activate'}
                              >
                                <Power
                                  className={cn(
                                    'h-4 w-4',
                                    rule.isActive ? 'text-amber-600' : 'text-green-600',
                                  )}
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDelete(rule)}
                                title="Delete rule"
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
      </Card>

      <AmountRoutingRuleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingRule={editingRule}
        existingRules={allRules}
      />

      <AmountRoutingRuleViewDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        rule={viewingRule}
        canManage={canManage}
        onEdit={openEdit}
      />

      <AmountRoutingRuleDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        rule={deletingRule}
      />
    </>
  )
}

export default function AmountRoutingRulesPage() {
  return (
    <DashboardPageLayout>
      <PermissionGuard
        permissions={[PERMISSIONS.TARIFF_VIEW]}
        showFallback
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access denied</h1>
              <p className="text-gray-600 mb-2">
                You do not have permission to view amount routing rules.
              </p>
              <p className="text-sm text-gray-400">Required permission: TARIFF_VIEW</p>
            </div>
          </div>
        }
      >
        <AmountRoutingRulesContent />
      </PermissionGuard>
    </DashboardPageLayout>
  )
}
