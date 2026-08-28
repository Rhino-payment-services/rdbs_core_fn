'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FEE_SPLIT_FIELD_LABELS,
  FEE_SPLIT_MODE_OPTIONS,
  type FeeSplitFieldKey,
  type FeeSplitFieldMode,
  type FeeSplitModeMetadata,
  feeSplitModeHint,
  feeSplitValueSuffix,
  getFeeSplitModeFromMetadata,
} from '@/lib/constants/tariff-fee-split'

type TariffFeeSplitFieldProps = {
  field: FeeSplitFieldKey
  value: number | undefined
  currency: string
  metadata: Record<string, unknown> | undefined
  disabled?: boolean
  label?: string
  onValueChange: (value: number) => void
  onModeChange: (mode: FeeSplitFieldMode) => void
}

export function TariffFeeSplitField({
  field,
  value,
  currency,
  metadata,
  disabled,
  label: labelOverride,
  onValueChange,
  onModeChange,
}: TariffFeeSplitFieldProps) {
  const mode = getFeeSplitModeFromMetadata(metadata, field) ?? 'FIXED_UGX'
  const suffix = feeSplitValueSuffix(mode)
  const label = labelOverride ?? FEE_SPLIT_FIELD_LABELS[field]

  return (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="relative">
          <Input
            id={field}
            type="number"
            value={mode === 'RESIDUAL' ? '' : value ?? 0}
            onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
            placeholder={mode === 'RESIDUAL' ? 'Auto' : '0'}
            min={mode === 'RESIDUAL' ? undefined : 0}
            step="0.01"
            disabled={disabled || mode === 'RESIDUAL'}
            className={mode !== 'RESIDUAL' ? 'pr-10' : undefined}
          />
          {mode !== 'RESIDUAL' && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
              {suffix === '%' ? '%' : currency}
            </span>
          )}
        </div>
        <Select
          value={mode}
          onValueChange={(next) => onModeChange(next as FeeSplitFieldMode)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Split type" />
          </SelectTrigger>
          <SelectContent>
            {FEE_SPLIT_MODE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-gray-500">
        {feeSplitModeHint(mode)}
        {suffix === '%' || suffix === 'auto' ? '' : ` Shown in ${currency}.`}
      </p>
    </div>
  )
}

export function readFeeSplitModeMetadata(
  metadata: Record<string, unknown> | undefined,
): FeeSplitModeMetadata {
  const modes = metadata?.feeSplitMode as FeeSplitModeMetadata | undefined
  return modes ?? {}
}
