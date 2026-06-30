import { useMemo } from 'react'
import { formatAmount } from '@/lib/utils/transactions'
import { getKampalaCalendarDate } from '@/lib/utils/kampalaDate'
import { useTransactionSystemStats } from '@/lib/hooks/useTransactions'

export type RevenueCardSubtitle = {
  value: string
  suffix: string
  tone: 'positive' | 'negative' | 'neutral' | 'info'
}

type UseRevenueCardSubtitleOptions = {
  rukapayRevenue: number
  totalTransactions: number
  hasDateFilter: boolean
  typeFilter?: string
  statusFilter?: string
}

function computeDayOverDayPercent(today: number, yesterday: number): number | null {
  if (yesterday === 0) {
    if (today === 0) return null
    return 100
  }
  return ((today - yesterday) / yesterday) * 100
}

const toneClass: Record<RevenueCardSubtitle['tone'], string> = {
  positive: 'text-green-600',
  negative: 'text-red-600',
  neutral: 'text-gray-500',
  info: 'text-blue-600',
}

export function revenueSubtitleClassName(tone: RevenueCardSubtitle['tone']): string {
  return toneClass[tone]
}

export function useRevenueCardSubtitle({
  rukapayRevenue,
  totalTransactions,
  hasDateFilter,
  typeFilter,
  statusFilter,
}: UseRevenueCardSubtitleOptions): RevenueCardSubtitle | null {
  const today = getKampalaCalendarDate(0)
  const yesterday = getKampalaCalendarDate(-1)

  const sharedFilters = {
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  }

  const { data: todayStats, isLoading: todayLoading } = useTransactionSystemStats({
    ...sharedFilters,
    startDate: today,
    endDate: today,
    enabled: !hasDateFilter,
  })

  const { data: yesterdayStats, isLoading: yesterdayLoading } = useTransactionSystemStats({
    ...sharedFilters,
    startDate: yesterday,
    endDate: yesterday,
    enabled: !hasDateFilter,
  })

  return useMemo(() => {
    if (hasDateFilter) {
      if (totalTransactions <= 0) return null
      return {
        value: formatAmount(rukapayRevenue / totalTransactions),
        suffix: 'avg revenue per txn',
        tone: 'info',
      }
    }

    if (todayLoading || yesterdayLoading) return null

    const todayRevenue = Number(todayStats?.rukapayRevenue ?? 0)
    const yesterdayRevenue = Number(yesterdayStats?.rukapayRevenue ?? 0)
    const change = computeDayOverDayPercent(todayRevenue, yesterdayRevenue)

    if (change == null) return null

    const rounded = Math.abs(change).toFixed(1)
    const prefix = change > 0 ? '+' : change < 0 ? '-' : ''
    return {
      value: `${prefix}${rounded}%`,
      suffix: 'vs yesterday',
      tone: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
    }
  }, [
    hasDateFilter,
    rukapayRevenue,
    totalTransactions,
    todayLoading,
    yesterdayLoading,
    todayStats?.rukapayRevenue,
    yesterdayStats?.rukapayRevenue,
  ])
}
