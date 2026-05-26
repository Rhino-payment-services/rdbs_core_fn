'use client'

import Navbar from '@/components/dashboard/Navbar'
import { cn } from '@/lib/utils'
import {
  DASHBOARD_MAIN_CLASS,
  DASHBOARD_PAGE_CLASS,
  dashboardPageShellClass,
} from '@/lib/constants/dashboard-layout'

type DashboardScrollLayoutProps = {
  children: React.ReactNode
  pageClassName?: string
  shellClassName?: string
  /** Attach to the scrollable viewport (e.g. for scroll-to-top buttons) */
  scrollRef?: React.RefObject<HTMLDivElement | null>
}

/**
 * Full-height scrollable page shell (Customers, Dashboard home, Analytics).
 * Same 90% column and top padding as standard list pages.
 */
export function DashboardScrollLayout({
  children,
  pageClassName,
  shellClassName,
  scrollRef,
}: DashboardScrollLayoutProps) {
  return (
    <div className={cn(DASHBOARD_PAGE_CLASS, 'flex flex-col', pageClassName)}>
      <Navbar />
      <main className="flex-1 overflow-hidden relative">
        <div ref={scrollRef} className="h-full overflow-y-auto">
          <div className={cn(dashboardPageShellClass, DASHBOARD_MAIN_CLASS, shellClassName)}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
