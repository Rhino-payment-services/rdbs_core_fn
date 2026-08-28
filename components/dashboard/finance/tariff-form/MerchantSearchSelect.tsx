'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Search, X } from 'lucide-react'
import api from '@/lib/axios'
import { cn } from '@/lib/utils'

export type MerchantSearchOption = {
  id: string
  businessTradeName: string
  merchantCode: string
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

type MerchantSearchSelectProps = {
  value?: string
  onChange: (merchantId: string) => void
  disabled?: boolean
  label?: string
}

export function MerchantSearchSelect({
  value,
  onChange,
  disabled = false,
  label = 'Merchant *',
}: MerchantSearchSelectProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<MerchantSearchOption | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data: searchResults = [], isFetching } = useQuery({
    queryKey: ['merchant-tariff-search', debouncedSearch],
    queryFn: async () => {
      const res = await api.get('/merchant-kyc/all', {
        params: {
          page: 1,
          pageSize: 30,
          ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        },
      })
      const body = res.data as {
        merchants?: MerchantSearchOption[]
        data?: { merchants?: MerchantSearchOption[] }
      }
      return body.merchants || body.data?.merchants || []
    },
    enabled: open,
    staleTime: 30_000,
  })

  const { data: resolvedMerchant, isLoading: resolvingSelected } = useQuery({
    queryKey: ['merchant-tariff-resolve', value],
    queryFn: async () => {
      if (!value) return null
      const res = await api.get('/merchant-kyc/all', {
        params: { page: 1, pageSize: 1000 },
      })
      const body = res.data as { merchants?: MerchantSearchOption[] }
      const merchants = body.merchants || []
      return merchants.find((m) => m.id === value) ?? null
    },
    enabled: Boolean(value) && !selected,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (resolvedMerchant && resolvedMerchant.id === value) {
      setSelected(resolvedMerchant)
    }
  }, [resolvedMerchant, value])

  useEffect(() => {
    if (!value) {
      setSelected(null)
      setSearch('')
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayLabel = useMemo(() => {
    if (selected) {
      return `${selected.businessTradeName} (${selected.merchantCode})`
    }
    if (value && resolvingSelected) return 'Loading merchant…'
    return ''
  }, [selected, value, resolvingSelected])

  const handleSelect = (merchant: MerchantSearchOption) => {
    setSelected(merchant)
    onChange(merchant.id)
    setSearch('')
    setOpen(false)
  }

  const handleClear = () => {
    setSelected(null)
    setSearch('')
    onChange('')
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <Label htmlFor="merchant-search">{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <Input
          id="merchant-search"
          value={open ? search : displayLabel}
          onChange={(e) => {
            setSearch(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            if (selected && !search) setSearch('')
          }}
          placeholder="Search by name, merchant code, phone, or email…"
          className="pl-9 pr-9"
          disabled={disabled}
          autoComplete="off"
        />
        {(selected || value) && !disabled && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={handleClear}
            aria-label="Clear merchant"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-64 overflow-y-auto">
            {isFetching ? (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching merchants…
              </div>
            ) : searchResults.length === 0 ? (
              <p className="px-3 py-4 text-sm text-gray-500">
                {debouncedSearch.trim()
                  ? 'No merchants match your search'
                  : 'Type to search merchants'}
              </p>
            ) : (
              <ul className="py-1">
                {searchResults.map((merchant) => (
                  <li key={merchant.id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-gray-50',
                        value === merchant.id && 'bg-indigo-50 text-indigo-900',
                      )}
                      onClick={() => handleSelect(merchant)}
                    >
                      <span className="font-medium">{merchant.businessTradeName}</span>
                      <span className="text-gray-500 ml-1 font-mono text-xs">
                        ({merchant.merchantCode})
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Tariff fees apply only to transactions for this merchant (payments to them,
        their payouts, and merchant-portal activity).
      </p>
    </div>
  )
}
