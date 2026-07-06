'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconBg?: string
  valueClassName?: string
  subtitle?: string
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  iconBg = 'bg-[#08163d]',
  valueClassName,
  subtitle,
}: KpiCardProps) {
  return (
    <Card className="shadow-sm border-gray-100">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className={cn('text-2xl font-bold text-gray-900', valueClassName)}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
