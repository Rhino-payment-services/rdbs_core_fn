'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchMerchantEventsStatistics,
  fetchMerchantEvents,
  fetchMerchantEventDetail,
  fetchEventOrders,
  fetchEventAttendees,
  fetchCheckInStatistics,
  fetchGlobalOrders,
  fetchOrderDetail,
  fetchTicketLookup,
  fetchRevenueReport,
  exportEvents,
  exportOrders,
  updateEventStatus,
  updateTierStatus,
  resendTicketEmail,
  type EventListFilters,
  type OrderListFilters,
  type AttendeeListFilters,
  type EventOrderFilters,
  type RevenueReportFilters,
  type EventStatus,
  type TierStatus,
} from '@/lib/api/merchantEventsAdminApi'

const KEYS = {
  statistics: ['merchant-events', 'statistics'] as const,
  events: (f?: EventListFilters) => ['merchant-events', 'list', f] as const,
  event: (id: string) => ['merchant-events', 'detail', id] as const,
  eventOrders: (id: string, f?: EventOrderFilters) => ['merchant-events', id, 'orders', f] as const,
  eventAttendees: (id: string, f?: AttendeeListFilters) => ['merchant-events', id, 'attendees', f] as const,
  checkIn: (id: string) => ['merchant-events', id, 'check-in'] as const,
  orders: (f?: OrderListFilters) => ['merchant-events', 'orders', f] as const,
  order: (ref: string) => ['merchant-events', 'order', ref] as const,
  ticket: (code: string) => ['merchant-events', 'ticket', code] as const,
  revenue: (f?: RevenueReportFilters) => ['merchant-events', 'revenue', f] as const,
}

export function useMerchantEventsStatistics() {
  return useQuery({
    queryKey: KEYS.statistics,
    queryFn: fetchMerchantEventsStatistics,
    staleTime: 60_000,
  })
}

export function useMerchantEventsList(filters: EventListFilters = {}, enabled = true) {
  return useQuery({
    queryKey: KEYS.events(filters),
    queryFn: () => fetchMerchantEvents(filters),
    staleTime: 30_000,
    enabled,
  })
}

export function useMerchantEventDetail(eventId: string, enabled = true) {
  return useQuery({
    queryKey: KEYS.event(eventId),
    queryFn: () => fetchMerchantEventDetail(eventId),
    staleTime: 30_000,
    enabled: enabled && !!eventId,
  })
}

export function useEventOrders(eventId: string, filters: EventOrderFilters = {}, enabled = true) {
  return useQuery({
    queryKey: KEYS.eventOrders(eventId, filters),
    queryFn: () => fetchEventOrders(eventId, filters),
    staleTime: 30_000,
    enabled: enabled && !!eventId,
  })
}

export function useEventAttendees(eventId: string, filters: AttendeeListFilters = {}, enabled = true) {
  return useQuery({
    queryKey: KEYS.eventAttendees(eventId, filters),
    queryFn: () => fetchEventAttendees(eventId, filters),
    staleTime: 30_000,
    enabled: enabled && !!eventId,
  })
}

export function useCheckInStatistics(eventId: string, enabled = true) {
  return useQuery({
    queryKey: KEYS.checkIn(eventId),
    queryFn: () => fetchCheckInStatistics(eventId),
    staleTime: 15_000,
    enabled: enabled && !!eventId,
    refetchInterval: 30_000,
  })
}

export function useGlobalOrders(filters: OrderListFilters = {}, enabled = true) {
  return useQuery({
    queryKey: KEYS.orders(filters),
    queryFn: () => fetchGlobalOrders(filters),
    staleTime: 30_000,
    enabled,
  })
}

export function useOrderDetail(orderReference: string, enabled = true) {
  return useQuery({
    queryKey: KEYS.order(orderReference),
    queryFn: () => fetchOrderDetail(orderReference),
    staleTime: 30_000,
    enabled: enabled && !!orderReference,
  })
}

export function useTicketLookup(ticketCode: string, enabled = false) {
  return useQuery({
    queryKey: KEYS.ticket(ticketCode),
    queryFn: () => fetchTicketLookup(ticketCode),
    staleTime: 0,
    enabled: enabled && !!ticketCode,
    retry: false,
  })
}

export function useRevenueReport(filters: RevenueReportFilters = {}, enabled = true) {
  return useQuery({
    queryKey: KEYS.revenue(filters),
    queryFn: () => fetchRevenueReport(filters),
    staleTime: 60_000,
    enabled,
  })
}

export function useUpdateEventStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: EventStatus }) =>
      updateEventStatus(eventId, status),
    onSuccess: (_, { eventId }) => {
      toast.success('Event status updated')
      qc.invalidateQueries({ queryKey: KEYS.event(eventId) })
      qc.invalidateQueries({ queryKey: ['merchant-events'] })
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update event status'),
  })
}

export function useUpdateTierStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, tierId, status }: { eventId: string; tierId: string; status: TierStatus }) =>
      updateTierStatus(eventId, tierId, status),
    onSuccess: (_, { eventId }) => {
      toast.success('Tier status updated')
      qc.invalidateQueries({ queryKey: KEYS.event(eventId) })
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to update tier status'),
  })
}

export function useResendTicketEmail() {
  return useMutation({
    mutationFn: (orderReference: string) => resendTicketEmail(orderReference),
    onSuccess: (data) => {
      toast.success(`Ticket email resent to ${data.recipientEmail}`)
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to resend ticket email'),
  })
}

export function useExportEvents() {
  return useMutation({
    mutationFn: (filters: EventListFilters) => exportEvents(filters),
    onError: (err: Error) => toast.error(err.message || 'Export failed'),
  })
}

export function useExportOrders() {
  return useMutation({
    mutationFn: (filters: OrderListFilters) => exportOrders(filters),
    onError: (err: Error) => toast.error(err.message || 'Export failed'),
  })
}
