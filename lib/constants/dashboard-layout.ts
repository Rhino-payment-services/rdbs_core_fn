/**
 * Shared layout: navbar and page content use the same centered 90% column.
 */
export const DASHBOARD_SHELL_WIDTH_CLASS = 'w-[90%]'

/** Navbar inner row + page content wrapper */
export const dashboardShellClass = `${DASHBOARD_SHELL_WIDTH_CLASS} mx-auto`

export const dashboardPageShellClass = dashboardShellClass

/** Forms: same horizontal alignment, readable max line length */
export const dashboardFormShellClass = `${DASHBOARD_SHELL_WIDTH_CLASS} max-w-4xl mx-auto`

/** Vertical padding only — horizontal alignment comes from the 90% shell */
export const DASHBOARD_MAIN_CLASS = 'py-4 md:py-6'
