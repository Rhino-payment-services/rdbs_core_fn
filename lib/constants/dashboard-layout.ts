/**
 * Shared backoffice layout — navbar and page body share the same centered 90% column.
 *
 * Prefer wrapping pages with:
 *   <DashboardPageLayout> … <DashboardPageHeader /> … </DashboardPageLayout>
 *
 * Or manually:
 *   <main className={DASHBOARD_MAIN_CLASS}>
 *     <div className={dashboardPageShellClass}>…</div>
 *   </main>
 *
 * CSS lives in globals.css (`.dashboard-shell`) so width rules are always applied.
 */
export const DASHBOARD_SHELL_CLASS = 'dashboard-shell'

export const dashboardShellClass = DASHBOARD_SHELL_CLASS

export const dashboardPageShellClass = DASHBOARD_SHELL_CLASS

/** Same 90% column as list pages; --form marker for optional inner constraints */
export const dashboardFormShellClass = `${DASHBOARD_SHELL_CLASS} dashboard-shell--form`

/** Vertical padding only — horizontal alignment comes from `.dashboard-shell` */
export const DASHBOARD_MAIN_CLASS = 'py-4 md:py-6'

/** Outer page wrapper (full viewport background) */
export const DASHBOARD_PAGE_CLASS = 'min-h-screen bg-gray-50'
