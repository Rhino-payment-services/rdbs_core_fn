'use client'

import React, { useMemo } from 'react'
import type { ApexOptions } from 'apexcharts'
import { ApexChart } from './ApexChart'
import {
  CHART_HEIGHT,
  CHART_HEIGHT_COMPACT,
  currencyTooltipFormatter,
  formatStatusLabel,
  getBaseChartOptions,
} from '@/lib/utils/merchantEventsCharts'

export interface DonutChartItem {
  label: string
  value: number
  currency?: string
}

interface DonutChartProps {
  data: DonutChartItem[]
  height?: number
  centerLabel?: string
  valueIsCurrency?: boolean
  compact?: boolean
}

export function DonutChart({
  data,
  height,
  centerLabel,
  valueIsCurrency = false,
  compact = false,
}: DonutChartProps) {
  const chartHeight = height ?? (compact ? CHART_HEIGHT_COMPACT : CHART_HEIGHT)
  const total = data.reduce((sum, d) => sum + d.value, 0)

  const options: ApexOptions = useMemo(() => {
    const base = getBaseChartOptions(chartHeight)
    return {
      ...base,
      labels: data.map((d) => formatStatusLabel(d.label)),
      plotOptions: {
        pie: {
          donut: {
            size: '58%',
            labels: {
              show: true,
              name: { show: true, fontSize: '12px', color: '#6b7280' },
              value: {
                show: true,
                fontSize: '18px',
                fontWeight: 700,
                color: '#111827',
                formatter: (v) => Number(v).toLocaleString(),
              },
              total: {
                show: true,
                label: centerLabel ?? 'Total',
                fontSize: '12px',
                color: '#6b7280',
                formatter: () =>
                  valueIsCurrency && data[0]?.currency
                    ? currencyTooltipFormatter(total, data[0].currency)
                    : total.toLocaleString(),
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(0)}%`,
        style: { fontSize: '11px', fontWeight: 600, colors: ['#fff'] },
        dropShadow: { enabled: false },
      },
      legend: {
        position: 'bottom',
        fontSize: '12px',
        labels: { colors: '#6b7280' },
      },
      tooltip: {
        ...base.tooltip,
        y: {
          formatter: (v, opts) => {
            const item = data[opts?.seriesIndex ?? 0]
            if (valueIsCurrency) {
              return currencyTooltipFormatter(Number(v), item?.currency)
            }
            return Number(v).toLocaleString()
          },
        },
      },
    }
  }, [chartHeight, centerLabel, data, total, valueIsCurrency])

  const series = useMemo(() => data.map((d) => d.value), [data])

  if (data.length === 0) return null

  return (
    <ApexChart
      type="donut"
      height={chartHeight}
      options={options}
      series={series}
    />
  )
}
