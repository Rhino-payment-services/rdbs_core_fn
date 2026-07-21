import type { ApexOptions } from 'apexcharts'
import { formatUgx } from '@/lib/utils/merchantEvents'

export const CHART_HEIGHT = 240
export const CHART_HEIGHT_COMPACT = 220

/** Vibrant palette for merchant-events charts */
export const CHART_PALETTE = [
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#f97316', // orange
  '#14b8a6', // teal
  '#ec4899', // pink
  '#84cc16', // lime
  '#a855f7', // purple
  '#0ea5e9', // sky
]

export function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getBaseChartOptions(height = CHART_HEIGHT): ApexOptions {
  return {
    chart: {
      fontFamily: 'inherit',
      toolbar: { show: false },
      animations: { enabled: true, speed: 400 },
      height,
    },
    colors: CHART_PALETTE,
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 3,
    },
    dataLabels: { enabled: false },
    legend: {
      fontSize: '12px',
      labels: { colors: '#6b7280' },
    },
    tooltip: {
      theme: 'light',
      style: { fontSize: '12px' },
    },
    noData: {
      text: 'No data yet',
      align: 'center',
      verticalAlign: 'middle',
      style: { color: '#6b7280', fontSize: '14px' },
    },
  }
}

export function currencyTooltipFormatter(value: number, currency?: string): string {
  return formatUgx(value, currency)
}

export function compactNumberFormatter(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(value)
}

export function sortByCountDesc<T extends { count: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.count - a.count)
}

export function sortByValueDesc<T extends { value: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.value - a.value)
}
