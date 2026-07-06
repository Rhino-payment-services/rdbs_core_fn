import api from '@/lib/axios'

const BASE = '/admin/merchant-events'

// ─── Enums ───────────────────────────────────────────────────────────────────

export type EventStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'CANCELLED' | 'COMPLETED'
export type OrderStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED'
export type TierStatus = 'ACTIVE' | 'PAUSED'
export type AttendeeStatus = 'ACTIVE' | 'CHECKED_IN' | 'CANCELLED' | 'VOID'

// ─── Shared shapes ───────────────────────────────────────────────────────────

export interface MerchantSummary {
  id: string
  merchantCode: string
  businessTradeName: string
}

export interface PaginatedMeta {
  page: number
  limit: number
  total: number
  totalPages?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta?: PaginatedMeta
  page?: number
  limit?: number
  total?: number
}

export interface ExportResponse {
  rows: Record<string, unknown>[]
  generatedAt: string
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface CurrencySales {
  currency: string
  grossSales: number
}

export interface StatusCount {
  status: string
  count: number
}

export interface AdminMerchantEventsPortfolioStatistics {
  totalEvents: number
  activeEvents: number
  totalMerchants: number
  totalTiers: number
  totalOrders: number
  paidOrders: number
  grossSalesByCurrency: CurrencySales[]
  totalAttendees: number
  checkedInCount: number
  ticketsSoldTotal: number
  orderStatusBreakdown: StatusCount[]
  paymentStatusBreakdown: StatusCount[]
  eventsByStatus: Record<string, number>
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface MerchantEventListItem {
  id: string
  eventCode: string
  title: string
  status: EventStatus
  startsAt: string
  endsAt?: string
  location?: string
  ticketsSold: number
  capacity: number
  orderCount?: number
  attendeeCount?: number
  grossSales?: number
  currency?: string
  isFree?: boolean
  isPublic?: boolean
  isActive?: boolean
  merchant: MerchantSummary
}

export interface EventTier {
  id: string
  name: string
  price: number
  currency: string
  capacity: number
  sold: number
  status: TierStatus
  description?: string
}

export interface TierSales {
  tierId: string
  tierName: string
  sold: number
  capacity: number
  grossSales: number
  currency: string
}

export interface EventSummary {
  paidOrderCount: number
  grossSales: number
  currency: string
  checkedInCount: number
  remainingCapacity: number
  totalOrders?: number
  totalAttendees?: number
}

export interface MerchantEventDetail {
  id: string
  eventCode: string
  title: string
  description?: string
  status: EventStatus
  startsAt: string
  endsAt?: string
  location?: string
  capacity: number
  isFree: boolean
  isPublic: boolean
  isActive: boolean
  bannerUrl?: string
  merchant: MerchantSummary
  tiers: EventTier[]
  summary: EventSummary
  salesStatistics?: {
    tierSales: TierSales[]
  }
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface MerchantEventOrder {
  id: string
  orderReference: string
  status: OrderStatus
  paymentStatus: string
  quantity: number
  unitPrice: number
  totalPrice: number
  currency: string
  buyerName?: string
  buyerPhone?: string
  buyerEmail?: string
  paidAt?: string
  createdAt: string
  event?: {
    id: string
    title: string
    eventCode: string
  }
  merchant?: MerchantSummary
  tier?: {
    id: string
    name: string
  }
}

export interface OrderTransaction {
  reference?: string
  status?: string
  externalReference?: string
}

export interface OrderAttendee {
  id: string
  ticketCode: string
  attendeeName?: string
  attendeePhone?: string
  attendeeEmail?: string
  status: AttendeeStatus
  checkedInAt?: string
  tier?: { id: string; name: string }
}

export interface MerchantEventOrderDetail extends MerchantEventOrder {
  event: {
    id: string
    title: string
    eventCode: string
    startsAt?: string
    location?: string
  }
  merchant: MerchantSummary
  tier: { id: string; name: string; price: number; currency: string }
  transaction?: OrderTransaction
  attendees: OrderAttendee[]
}

export interface ResendEmailResponse {
  success: boolean
  recipientEmail: string
  ticketCount: number
  orderReference: string
}

// ─── Attendees ───────────────────────────────────────────────────────────────

export interface EventAttendee {
  id: string
  ticketCode: string
  attendeeName?: string
  attendeePhone?: string
  attendeeEmail?: string
  status: AttendeeStatus
  checkedInAt?: string
  tier?: { id: string; name: string }
  orderReference?: string
}

// ─── Check-in ────────────────────────────────────────────────────────────────

export interface RecentCheckIn {
  ticketCode: string
  attendeeName?: string
  checkedInAt: string
  tierName?: string
}

export interface CheckInStatistics {
  totalAttendees: number
  checkedInCount: number
  pendingCount: number
  checkInRate: number
  recentCheckIns: RecentCheckIn[]
}

// ─── Ticket lookup ───────────────────────────────────────────────────────────

export interface TicketLookupResult {
  ticketCode: string
  status: AttendeeStatus
  attendeeName?: string
  attendeePhone?: string
  attendeeEmail?: string
  checkedInAt?: string
  orderReference?: string
  event?: {
    id: string
    title: string
    eventCode: string
    startsAt?: string
    location?: string
  }
  merchant?: MerchantSummary
  tier?: { id: string; name: string }
}

// ─── Revenue report ──────────────────────────────────────────────────────────

export interface RevenueByMerchant {
  merchantId: string
  merchantName: string
  merchantCode: string
  eventCount: number
  paidOrders: number
  ticketsSold: number
  grossSales: number
  currency: string
}

export interface RevenueByEvent {
  eventId: string
  eventTitle: string
  eventCode: string
  merchantName: string
  paidOrders: number
  ticketsSold: number
  grossSales: number
  currency: string
}

export interface RevenueByCurrency {
  currency: string
  paidOrders: number
  ticketsSold: number
  grossSales: number
}

export interface RevenueReport {
  byMerchant: RevenueByMerchant[]
  byEvent: RevenueByEvent[]
  byCurrency: RevenueByCurrency[]
  generatedAt: string
}

// ─── Filter types ────────────────────────────────────────────────────────────

export interface EventListFilters {
  page?: number
  limit?: number
  merchantId?: string
  merchantCode?: string
  status?: string
  isActive?: boolean
  isPublic?: boolean
  isFree?: boolean
  search?: string
  startsFrom?: string
  startsTo?: string
  createdFrom?: string
  createdTo?: string
}

export interface OrderListFilters {
  page?: number
  limit?: number
  orderReference?: string
  buyerPhone?: string
  buyerEmail?: string
  merchantId?: string
  eventId?: string
  status?: string
  paymentStatus?: string
  createdFrom?: string
  createdTo?: string
}

export interface AttendeeListFilters {
  page?: number
  limit?: number
  status?: string
  search?: string
}

export interface EventOrderFilters {
  page?: number
  limit?: number
  status?: string
  paymentStatus?: string
  buyerPhone?: string
  search?: string
}

export interface RevenueReportFilters {
  dateFrom?: string
  dateTo?: string
  merchantId?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== null) {
      sp.set(key, String(value))
    }
  }
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

function unwrapList<T>(data: unknown): PaginatedResponse<T> {
  const raw = data as Record<string, unknown>
  if (Array.isArray(raw)) {
    return { data: raw as T[] }
  }
  if (Array.isArray(raw?.data)) {
    return {
      data: raw.data as T[],
      meta: raw.meta as PaginatedMeta | undefined,
      page: raw.page as number | undefined,
      limit: raw.limit as number | undefined,
      total: raw.total as number | undefined,
    }
  }
  if (Array.isArray(raw?.items)) {
    return {
      data: raw.items as T[],
      total: raw.total as number | undefined,
      page: raw.page as number | undefined,
      limit: raw.limit as number | undefined,
    }
  }
  return { data: [] }
}

// ─── API functions ───────────────────────────────────────────────────────────

export async function fetchMerchantEventsStatistics(): Promise<AdminMerchantEventsPortfolioStatistics> {
  const res = await api.get(`${BASE}/statistics`)
  return res.data?.data ?? res.data
}

export async function fetchMerchantEvents(filters: EventListFilters = {}): Promise<PaginatedResponse<MerchantEventListItem>> {
  const res = await api.get(`${BASE}${toQueryString(filters as Record<string, string | number | boolean | undefined>)}`)
  return unwrapList<MerchantEventListItem>(res.data)
}

export async function fetchMerchantEventDetail(eventId: string): Promise<MerchantEventDetail> {
  const res = await api.get(`${BASE}/${eventId}`)
  return res.data?.data ?? res.data
}

export async function fetchEventOrders(eventId: string, filters: EventOrderFilters = {}): Promise<PaginatedResponse<MerchantEventOrder>> {
  const res = await api.get(`${BASE}/${eventId}/orders${toQueryString(filters as Record<string, string | number | boolean | undefined>)}`)
  return unwrapList<MerchantEventOrder>(res.data)
}

export async function fetchEventAttendees(eventId: string, filters: AttendeeListFilters = {}): Promise<PaginatedResponse<EventAttendee>> {
  const res = await api.get(`${BASE}/${eventId}/attendees${toQueryString(filters as Record<string, string | number | boolean | undefined>)}`)
  return unwrapList<EventAttendee>(res.data)
}

export async function fetchCheckInStatistics(eventId: string): Promise<CheckInStatistics> {
  const res = await api.get(`${BASE}/${eventId}/check-in-statistics`)
  return res.data?.data ?? res.data
}

export async function fetchGlobalOrders(filters: OrderListFilters = {}): Promise<PaginatedResponse<MerchantEventOrder>> {
  const res = await api.get(`${BASE}/orders${toQueryString(filters as Record<string, string | number | boolean | undefined>)}`)
  return unwrapList<MerchantEventOrder>(res.data)
}

export async function fetchOrderDetail(orderReference: string): Promise<MerchantEventOrderDetail> {
  const res = await api.get(`${BASE}/orders/${encodeURIComponent(orderReference)}`)
  return res.data?.data ?? res.data
}

export async function fetchTicketLookup(ticketCode: string): Promise<TicketLookupResult> {
  const res = await api.get(`${BASE}/tickets/${encodeURIComponent(ticketCode)}`)
  return res.data?.data ?? res.data
}

export async function fetchRevenueReport(filters: RevenueReportFilters = {}): Promise<RevenueReport> {
  const res = await api.get(`${BASE}/reports/revenue${toQueryString(filters as Record<string, string | number | boolean | undefined>)}`)
  return res.data?.data ?? res.data
}

export async function exportEvents(filters: EventListFilters = {}): Promise<ExportResponse> {
  const res = await api.get(`${BASE}/export/events${toQueryString(filters as Record<string, string | number | boolean | undefined>)}`)
  return res.data?.data ?? res.data
}

export async function exportOrders(filters: OrderListFilters = {}): Promise<ExportResponse> {
  const res = await api.get(`${BASE}/export/orders${toQueryString(filters as Record<string, string | number | boolean | undefined>)}`)
  return res.data?.data ?? res.data
}

export async function exportAttendees(eventId: string, filters: AttendeeListFilters = {}): Promise<ExportResponse> {
  const res = await api.get(`${BASE}/export/attendees${toQueryString({ eventId, ...filters } as Record<string, string | number | boolean | undefined>)}`)
  return res.data?.data ?? res.data
}

export async function updateEventStatus(eventId: string, status: EventStatus): Promise<void> {
  await api.patch(`${BASE}/${eventId}/status`, { status })
}

export async function updateTierStatus(eventId: string, tierId: string, status: TierStatus): Promise<void> {
  await api.patch(`${BASE}/${eventId}/tiers/${tierId}/status`, { status })
}

export async function resendTicketEmail(orderReference: string): Promise<ResendEmailResponse> {
  const res = await api.post(`${BASE}/orders/${encodeURIComponent(orderReference)}/resend-email`)
  return res.data?.data ?? res.data
}
