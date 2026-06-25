'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Loader2, Search } from 'lucide-react'
import type { AmountRoutingRule } from '@/lib/hooks/useAmountRoutingRules'
import {
  useCreateAmountRoutingRule,
  useUpdateAmountRoutingRule,
  extractAmountRoutingApiMessage,
} from '@/lib/hooks/useAmountRoutingRules'
import { useExternalPaymentPartners } from '@/lib/hooks/useGatewayPartnerRouting'
import {
  buildCreatePayload,
  buildUpdatePayload,
  DEFAULT_AMOUNT_BAND_FORM,
  findOverlappingRules,
  partnerLabel,
  ruleToFormValues,
  validateAmountBandForm,
  type AmountBandFormValues,
} from '@/lib/routing-rules/utils'

interface AmountRoutingRuleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingRule?: AmountRoutingRule | null
  existingRules: AmountRoutingRule[]
  onSuccess?: () => void
}

export function AmountRoutingRuleFormDialog({
  open,
  onOpenChange,
  editingRule = null,
  existingRules,
  onSuccess,
}: AmountRoutingRuleFormDialogProps) {
  const [form, setForm] = useState<AmountBandFormValues>(DEFAULT_AMOUNT_BAND_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [partnerSearch, setPartnerSearch] = useState('')

  const { data: partners = [], isLoading: partnersLoading } = useExternalPaymentPartners()
  const createRule = useCreateAmountRoutingRule()
  const updateRule = useUpdateAmountRoutingRule()

  const isEdit = !!editingRule
  const isSaving = createRule.isPending || updateRule.isPending

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setApiError(null)
    setPartnerSearch('')
    setForm(editingRule ? ruleToFormValues(editingRule) : DEFAULT_AMOUNT_BAND_FORM)
  }, [open, editingRule])

  const filteredPartners = useMemo(() => {
    const q = partnerSearch.trim().toLowerCase()
    if (!q) return partners
    return partners.filter(
      (p) =>
        p.partnerCode.toLowerCase().includes(q) ||
        p.partnerName.toLowerCase().includes(q),
    )
  }, [partners, partnerSearch])

  const overlapWarning = useMemo(() => {
    const validationError = validateAmountBandForm(form)
    if (validationError) return null

    const min = Number(form.minAmount)
    const max = Number(form.maxAmount)
    const overlaps = findOverlappingRules(
      existingRules,
      { min, max, currency: form.currency },
      editingRule?.id,
    )
    if (overlaps.length === 0) return null

    return `This range may overlap with ${overlaps.length} active rule(s) for ${form.currency.toUpperCase()}. The server will reject overlapping bands.`
  }, [form, existingRules, editingRule?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setApiError(null)

    const validationError = validateAmountBandForm(form)
    if (validationError) {
      setFormError(validationError)
      return
    }

    try {
      if (isEdit && editingRule) {
        const payload = buildUpdatePayload(form, editingRule)
        if (Object.keys(payload).length === 0) {
          onOpenChange(false)
          return
        }
        await updateRule.mutateAsync({ id: editingRule.id, data: payload })
      } else {
        await createRule.mutateAsync(buildCreatePayload(form))
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      const message = extractAmountRoutingApiMessage(
        error,
        isEdit ? 'Failed to update amount routing rule' : 'Failed to create amount routing rule',
      )
      setApiError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit routing rule' : 'Create routing rule'}</DialogTitle>
          <DialogDescription>
            Configure an amount band that routes transactions to an external payment partner.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(formError || apiError) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{formError || apiError}</AlertDescription>
            </Alert>
          )}

          {overlapWarning && !apiError && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">{overlapWarning}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              className="mt-1 uppercase"
              value={form.currency}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))
              }
              placeholder="UGX"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minAmount">Min amount</Label>
              <Input
                id="minAmount"
                type="number"
                min={0}
                className="mt-1"
                value={form.minAmount}
                onChange={(e) => setForm((prev) => ({ ...prev, minAmount: e.target.value }))}
                placeholder="500"
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
                onChange={(e) => setForm((prev) => ({ ...prev, maxAmount: e.target.value }))}
                placeholder="50000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="partner">Partner</Label>
            {/* <div className="relative mt-1 mb-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="partner-search"
                placeholder="Search partners…"
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                className="pl-8"
              />
            </div> */}
            <Select
              value={form.partnerId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, partnerId: value }))}
              disabled={partnersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={partnersLoading ? 'Loading partners…' : 'Select partner'} />
              </SelectTrigger>
              <SelectContent>
                {filteredPartners.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No partners match your search
                  </SelectItem>
                ) : (
                  filteredPartners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partnerLabel(partner)}
                    </SelectItem>
                  ))
                )}
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
                  priority: e.target.value,
                }))
              }
            />
            <p className="text-xs text-gray-500 mt-1">Lower number = higher priority</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
