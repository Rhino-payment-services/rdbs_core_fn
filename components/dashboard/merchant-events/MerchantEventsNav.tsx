'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingCart,
  Headphones,
  BarChart3,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard/merchant-events', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/merchant-events/list', label: 'All Events', icon: CalendarDays },
  { href: '/dashboard/merchant-events/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/merchant-events/support', label: 'Support', icon: Headphones },
  { href: '/dashboard/merchant-events/reports', label: 'Revenue', icon: BarChart3 },
]

export function MerchantEventsNav() {
  const pathname = usePathname()

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex flex-wrap gap-1 p-1 bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
            isActive(href, exact)
              ? 'bg-[#08163d] text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
