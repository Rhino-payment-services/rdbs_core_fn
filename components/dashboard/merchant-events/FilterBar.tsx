'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  children: React.ReactNode
  onApply: () => void
  onClear: () => void
  defaultOpen?: boolean
  className?: string
}

export function FilterBar({
  children,
  onApply,
  onClear,
  defaultOpen = false,
  className,
}: FilterBarProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className={cn('shadow-sm border-gray-100 mb-6', className)}>
      <CardContent className="p-4">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full"
        >
          <Filter className="h-4 w-4" />
          Filters
          {open ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
        </button>
        {open && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {children}
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={onApply} className="bg-[#08163d] hover:bg-[#0a1f52]">
                Apply
              </Button>
              <Button size="sm" variant="outline" onClick={onClear}>
                Clear
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}
