import { cn } from '@/lib/utils'

type DashboardPageHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

/** Shared page title row — spacing and typography match across backoffice pages */
export function DashboardPageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6 md:mb-8',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
          {icon}
          {title}
        </h1>
        {description ? (
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>
      ) : null}
    </div>
  )
}
