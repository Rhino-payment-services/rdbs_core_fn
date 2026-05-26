/**
 * Shared layout width for the top navbar and dashboard page content.
 * Keep these in sync so Finance (and other) pages line up with the menu bar.
 */
export const DASHBOARD_MAX_WIDTH_CLASS = 'max-w-[90rem]' // 1440px (was 1280px / max-w-7xl)

export const DASHBOARD_GUTTER_CLASS = 'px-4 sm:px-6'

/** Inner page column — use inside `<main>` after gutter padding */
export const dashboardPageShellClass = `${DASHBOARD_MAX_WIDTH_CLASS} mx-auto w-full`

/** Narrow forms (tariff create/edit) — same horizontal alignment, readable line length */
export const dashboardFormShellClass = `${DASHBOARD_MAX_WIDTH_CLASS} mx-auto w-full max-w-4xl`
