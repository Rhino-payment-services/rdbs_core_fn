'use client'

import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PartnerBucket } from '@/lib/tariffs-new/types'
import { countTariffStatuses } from '@/lib/tariffs-new/utils'
import { Building2, Search, Users, Zap } from 'lucide-react'

type ExternalPartnerSidebarProps = {
  partners: PartnerBucket[]
  selectedKey: string
  search: string
  onSearchChange: (value: string) => void
  onSelect: (key: string) => void
}

export function ExternalPartnerSidebar({
  partners,
  selectedKey,
  search,
  onSearchChange,
  onSelect,
}: ExternalPartnerSidebarProps) {
  const q = search.trim().toLowerCase()
  const filtered = partners.filter(
    (p) =>
      !q ||
      p.label.toLowerCase().includes(q) ||
      (p.sublabel && p.sublabel.toLowerCase().includes(q)),
  )

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white rounded-l-lg">
      <div className="p-3 border-b border-gray-100 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Users className="h-4 w-4" />
          Partners
          <Badge variant="secondary" className="ml-auto text-xs">
            {partners.length}
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search partners…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[calc(100vh-280px)]">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-500 px-2 py-4">No partners match your search</p>
        ) : (
          filtered.map((partner) => {
            const stats = countTariffStatuses(partner.tariffs)
            const selected = partner.key === selectedKey
            return (
              <button
                key={partner.key}
                type="button"
                onClick={() => onSelect(partner.key)}
                className={cn(
                  'w-full text-left rounded-lg px-3 py-2.5 transition-colors',
                  selected
                    ? 'bg-[#08163d] text-white'
                    : 'hover:bg-gray-100 text-gray-900',
                )}
              >
                <div className="flex items-start gap-2">
                  {partner.kind === 'api' ? (
                    <Zap
                      className={cn(
                        'h-4 w-4 mt-0.5 shrink-0',
                        selected ? 'text-blue-200' : 'text-green-600',
                      )}
                    />
                  ) : (
                    <Building2
                      className={cn(
                        'h-4 w-4 mt-0.5 shrink-0',
                        selected ? 'text-blue-200' : 'text-gray-500',
                      )}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{partner.label}</p>
                    {partner.sublabel && (
                      <p
                        className={cn(
                          'text-xs truncate',
                          selected ? 'text-blue-100' : 'text-gray-500',
                        )}
                      >
                        {partner.sublabel}
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
