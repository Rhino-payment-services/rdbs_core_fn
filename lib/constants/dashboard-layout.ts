/**
 * Shared layout: navbar and page content use the same centered 90% column.
 * Uses `.dashboard-shell` in globals.css (Tailwind does not scan this file for arbitrary classes).
 */
export const DASHBOARD_SHELL_CLASS = 'dashboard-shell'

export const dashboardShellClass = DASHBOARD_SHELL_CLASS

export const dashboardPageShellClass = DASHBOARD_SHELL_CLASS

export const dashboardFormShellClass = `${DASHBOARD_SHELL_CLASS} dashboard-shell--form`

/** Vertical padding only — horizontal alignment comes from `.dashboard-shell` */
export const DASHBOARD_MAIN_CLASS = 'py-4 md:py-6'
