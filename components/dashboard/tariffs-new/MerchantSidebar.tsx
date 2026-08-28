'use client'

import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PartnerBucket } from '@/lib/tariffs-new/types'
import { countTariffStatuses } from '@/lib/tariffs-new/utils'
import { Search, Store } from 'lucide-react'

type MerchantSidebarProps = {
  merchants: PartnerBucket[]
  selectedKey: string
  search: string
  onSearchChange: (value: string) => void
  onSelect: (key: string) => void
}

export function MerchantSidebar({
  merchants,
  selectedKey,
  search,
  onSearchChange,
  onSelect,
}: MerchantSidebarProps) {
  const q = search.trim().toLowerCase()
  const filtered = merchants.filter(
    (m) =>
      !q ||
      m.label.toLowerCase().includes(q) ||
      (m.sublabel && m.sublabel.toLowerCase().includes(q)),
  )

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white rounded-l-lg">
      <div className="p-3 border-b border-gray-100 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Store className="h-4 w-4" />
          Merchants
          <Badge variant="secondary" className="ml-auto text-xs">
            {merchants.length}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search merchants…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[calc(100vh-280px)]">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-500 px-2 py-4">No merchants match your search</p>
        ) : (
          filtered.map((merchant) => {
            const stats = countTariffStatuses(merchant.tariffs)
            const selected = merchant.key === selectedKey
            return (
              <button
                key={merchant.key}
                type="button"
                onClick={() => onSelect(merchant.key)}
                className={cn(
                  'w-full text-left rounded-lg px-3 py-2.5 transition-colors',
                  selected
                    ? 'bg-[#08163d] text-white'
                    : 'hover:bg-gray-100 text-gray-900',
                )}
              >
                <div className="flex items-start gap-2">
                  <Store
                    className={cn(
                      'h-4 w-4 mt-0.5 shrink-0',
                      selected ? 'text-blue-200' : 'text-indigo-600',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{merchant.label}</p>
                    {merchant.sublabel && (
                      <p
                        className={cn(
                          'text-xs truncate font-mono',
                          selected ? 'text-blue-100' : 'text-gray-500',
                        )}
                      >
                        {merchant.sublabel}
                      </p>
                    )}
                    <p
                      className={cn(
                        'text-[11px] mt-1',
                        selected ? 'text-blue-100' : 'text-gray-500',
                      )}
                    >
                      {stats.total} tariff{stats.total === 1 ? '' : 's'}
                      {stats.pending > 0 && ` · ${stats.pending} pending`}
                    </p>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
