import { cn } from '@/lib/utils'
import {
  DASHBOARD_MAIN_CLASS,
  dashboardFormShellClass,
  dashboardPageShellClass,
} from '@/lib/constants/dashboard-layout'

type DashboardPageContentProps = {
  children: React.ReactNode
  /** Narrower column for create/edit forms */
  variant?: 'default' | 'form'
  className?: string
  shellClassName?: string
}

/**
 * Wraps dashboard page body in the same centered 90% column as the navbar.
 */
export function DashboardPageContent({
  children,
  variant = 'default',
  className,
  shellClassName,
}: DashboardPageContentProps) {
  const shell =
    variant === 'form' ? dashboardFormShellClass : dashboardPageShellClass

  return (
    <main className={cn(DASHBOARD_MAIN_CLASS, className)}>
      <div className={cn(shell, shellClassName)}>{children}</div>
    </main>
  )
}
