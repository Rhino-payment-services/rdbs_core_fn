'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TransactionMode } from '@/lib/hooks/useTransactionModes'
import { transactionModeShortLabel } from './transactionModeLabels'

type TransactionModeSelectProps = {
  modes: TransactionMode[] | undefined
  value: string
  onValueChange: (modeId: string) => void
  placeholder?: string
  disabled?: boolean
}

export function TransactionModeSelect({
  modes,
  value,
  onValueChange,
  placeholder = 'Select transaction mode',
  disabled,
}: TransactionModeSelectProps) {
  const selected = modes?.find((m) => m.id === value)

  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full max-w-full [&_[data-slot=select-value]]:truncate">
        <SelectValue placeholder={placeholder}>
          {selected ? transactionModeShortLabel(selected) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        className="w-[var(--radix-select-trigger-width)] max-w-[min(100vw-2rem,24rem)]"
      >
        {modes && modes.length > 0 ? (
          modes.map((mode) => (
            <SelectItem
              key={mode.id}
              value={mode.id}
              textValue={transactionModeShortLabel(mode)}
              title={mode.description?.trim() || undefined}
              className="items-start py-2.5 pr-8"
            >
              <span className="flex flex-col gap-0.5 min-w-0 w-full">
                <span className="font-medium text-sm leading-snug line-clamp-2">
                  {mode.displayName || mode.name}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono truncate">
                  {mode.code}
                  {mode.isSystem === false ? ' · custom' : ''}
                </span>
              </span>
            </SelectItem>
          ))
        ) : (
          <div className="px-2 py-1.5 text-sm text-gray-500">Loading transaction modes…</div>
        )}
      </SelectContent>
    </Select>
  )
}
