'use client'

import { useUgandaBanks } from '@/lib/hooks/useUgandaBanks'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface BankSortCodeSelectProps {
  value?: string
  onValueChange: (bankSortCode: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function BankSortCodeSelect({
  value,
  onValueChange,
  disabled,
  placeholder = 'Select bank',
  className,
}: BankSortCodeSelectProps) {
  const { data: banks = [], isLoading, isError } = useUgandaBanks()

  const sortedBanks = [...banks].sort((a, b) => a.bankName.localeCompare(b.bankName))

  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={className}>
        <SelectValue
          placeholder={isLoading ? 'Loading banks...' : isError ? 'Failed to load banks' : placeholder}
        />
      </SelectTrigger>
      <SelectContent>
        {sortedBanks.map((bank) => (
          <SelectItem key={bank.id} value={bank.bankSortCode}>
            <span className="flex items-center gap-2">
              <span className={bank.isRoutable ? '' : 'text-muted-foreground'}>
                {bank.bankName} ({bank.bankSortCode})
              </span>
              {!bank.isRoutable && (
                <Badge variant="outline" className="text-xs">
                  Unavailable
                </Badge>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
