'use client'

import Navbar from '@/components/dashboard/Navbar'
import { DashboardPageContent } from '@/components/dashboard/DashboardPageContent'
import { DASHBOARD_PAGE_CLASS } from '@/lib/constants/dashboard-layout'
import { cn } from '@/lib/utils'

type DashboardPageLayoutProps = {
  children: React.ReactNode
  /** Form create/edit pages — same 90% column as list pages */
  variant?: 'default' | 'form'
  className?: string
  shellClassName?: string
  /** Extra classes on the outer page wrapper (e.g. flex flex-col) */
  pageClassName?: string
}

/**
 * Standard backoffice page shell: Navbar + centered 90% content column.
 * Use DashboardPageHeader for consistent page titles.
 */
export function DashboardPageLayout({
  children,
  variant = 'default',
  className,
  shellClassName,
  pageClassName,
}: DashboardPageLayoutProps) {
  return (
    <div className={cn(DASHBOARD_PAGE_CLASS, pageClassName)}>
      <Navbar />
      <DashboardPageContent
        variant={variant}
        className={className}
        shellClassName={shellClassName}
      >
        {children}
      </DashboardPageContent>
    </div>
  )
}
