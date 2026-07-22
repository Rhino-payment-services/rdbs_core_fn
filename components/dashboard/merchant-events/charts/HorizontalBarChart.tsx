'use client'

import React, { useMemo } from 'react'
import type { ApexOptions } from 'apexcharts'
import { ApexChart } from './ApexChart'
import {
  CHART_HEIGHT,
  CHART_HEIGHT_COMPACT,
  CHART_PALETTE,
  currencyTooltipFormatter,
  formatStatusLabel,
  getBaseChartOptions,
  sortByCountDesc,
} from '@/lib/utils/merchantEventsCharts'

export interface HorizontalBarChartItem {
  label: string
  count: number
  value?: number
  currency?: string
}

interface HorizontalBarChartProps {
  data: HorizontalBarChartItem[]
  height?: number
  /** Single bar color; omit for multi-color bars */
  color?: string
  valueIsCurrency?: boolean
  compact?: boolean
  maxItems?: number
  statusLabels?: boolean
}

export function HorizontalBarChart({
  data,
  height,
  color,
  valueIsCurrency = false,
  compact = false,
  maxItems,
  statusLabels = true,
}: HorizontalBarChartProps) {
  const chartHeight = height ?? (compact ? CHART_HEIGHT_COMPACT : CHART_HEIGHT)
  const useDistributed = !color

  const sorted = useMemo(() => {
    const items = sortByCountDesc(
      data.map((d) => ({
        ...d,
        count: valueIsCurrency ? (d.value ?? d.count) : d.count,
      }))
    )
    return maxItems ? items.slice(0, maxItems) : items
  }, [data, maxItems, valueIsCurrency])

  const options: ApexOptions = useMemo(() => {
    const base = getBaseChartOptions(chartHeight)
    const barCount = sorted.length
    const dynamicHeight = Math.max(chartHeight, barCount * 36 + 40)

    return {
      ...base,
      chart: { ...base.chart, height: dynamicHeight },
      colors: color ? [color] : CHART_PALETTE,
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          borderRadiusApplication: 'end',
          barHeight: '65%',
          distributed: useDistributed,
        },
      },
      legend: { show: false },
      xaxis: {
        categories: sorted.map((d) => (statusLabels ? formatStatusLabel(d.label) : d.label)),
        labels: { style: { colors: '#6b7280', fontSize: '12px' } },
      },
      yaxis: {
        labels: {
          style: { colors: '#374151', fontSize: '12px' },
          maxWidth: 140,
        },
      },
      grid: {
        ...base.grid,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      tooltip: {
        ...base.tooltip,
        y: {
          formatter: (v, opts) => {
            const item = sorted[opts?.dataPointIndex ?? 0]
            if (valueIsCurrency) {
              return currencyTooltipFormatter(Number(v), item?.currency)
            }
            return Number(v).toLocaleString()
          },
        },
      },
    }
  }, [chartHeight, color, sorted, statusLabels, useDistributed, valueIsCurrency])

  const series = useMemo(
    () => [
      {
        name: valueIsCurrency ? 'Gross Sales' : 'Count',
        data: sorted.map((d) => (valueIsCurrency ? (d.value ?? d.count) : d.count)),
      },
    ],
    [sorted, valueIsCurrency]
  )

  if (sorted.length === 0) return null

  const renderHeight = Math.max(chartHeight, sorted.length * 36 + 40)

  return (
    <ApexChart
      type="bar"
      height={renderHeight}
      options={options}
      series={series}
    />
  )
}
