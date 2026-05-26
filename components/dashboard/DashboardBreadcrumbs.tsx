import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DashboardBreadcrumbItem = {
  label: string
  href?: string
}

type DashboardBreadcrumbsProps = {
  items: DashboardBreadcrumbItem[]
  className?: string
}

/** Consistent breadcrumb trail (Dashboard > Section > …) */
export function DashboardBreadcrumbs({ items, className }: DashboardBreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-4', className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" /> : null}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-[#08163d]">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-gray-900' : undefined}>{item.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
