import { getApiUrl } from '@/lib/config'
import type { EventStatus, OrderStatus, AttendeeStatus } from '@/lib/api/merchantEventsAdminApi'

const KAMPALA_TZ = 'Africa/Kampala'

export function formatKampalaDateTime(dateString?: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('en-UG', {
    timeZone: KAMPALA_TZ,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatKampalaDate(dateString?: string | null): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-UG', {
    timeZone: KAMPALA_TZ,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export function formatUgx(amount: number, currency = 'UGX'): string {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  const hasFraction = Math.abs(n % 1) > 1e-9
  const formatted = new Intl.NumberFormat('en-UG', {
    minimumFractionDigits: hasFraction ? 1 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(n)
  return `${formatted} ${currency}`
}

export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = getApiUrl().replace(/\/$/, '')
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
  PAUSED: 'bg-amber-100 text-amber-800 border-amber-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  CLOSED: 'bg-slate-100 text-slate-700 border-slate-200',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800 border-green-200',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  EXPIRED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
  REFUNDED: 'bg-purple-100 text-purple-800 border-purple-200',
}

export const TICKET_STATUS_COLORS: Record<AttendeeStatus, string> = {
  ACTIVE: 'bg-blue-100 text-blue-800 border-blue-200',
  CHECKED_IN: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
  VOID: 'bg-gray-100 text-gray-600 border-gray-200',
}

export const CHART_COLORS = [
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#06b6d4',
  '#6366f1',
  '#f97316',
  '#14b8a6',
  '#ec4899',
  '#84cc16',
]

export function getEventStatusColor(status: string): string {
  return EVENT_STATUS_COLORS[status as EventStatus] ?? 'bg-gray-100 text-gray-700 border-gray-200'
}

export function getOrderStatusColor(status: string): string {
  return ORDER_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700 border-gray-200'
}

export function getTicketStatusColor(status: string): string {
  return TICKET_STATUS_COLORS[status as AttendeeStatus] ?? 'bg-gray-100 text-gray-700 border-gray-200'
}

export const EVENT_STATUS_OPTIONS: EventStatus[] = [
  'DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'CANCELLED', 'COMPLETED',
]

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED',
]
