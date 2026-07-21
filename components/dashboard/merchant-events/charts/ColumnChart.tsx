'use client'

import React, { useMemo } from 'react'
import type { ApexOptions } from 'apexcharts'
import { ApexChart } from './ApexChart'
import {
  CHART_HEIGHT,
  CHART_HEIGHT_COMPACT,
  CHART_PALETTE,
  compactNumberFormatter,
  currencyTooltipFormatter,
  getBaseChartOptions,
} from '@/lib/utils/merchantEventsCharts'

export interface ColumnChartItem {
  label: string
  value: number
  currency?: string
}

interface ColumnChartProps {
  data: ColumnChartItem[]
  height?: number
  valueIsCurrency?: boolean
  /** Single bar color; omit for multi-color bars */
  color?: string
  compact?: boolean
}

export function ColumnChart({
  data,
  height,
  valueIsCurrency = false,
  color,
  compact = false,
}: ColumnChartProps) {
  const chartHeight = height ?? (compact ? CHART_HEIGHT_COMPACT : CHART_HEIGHT)
  const useDistributed = !color

  const options: ApexOptions = useMemo(() => {
    const base = getBaseChartOptions(chartHeight)
    return {
      ...base,
      colors: color ? [color] : CHART_PALETTE,
      plotOptions: {
        bar: {
          borderRadius: 4,
          borderRadiusApplication: 'end',
          columnWidth: '55%',
          distributed: useDistributed,
        },
      },
      legend: { show: false },
      xaxis: {
        categories: data.map((d) => d.label),
        labels: { style: { colors: '#6b7280', fontSize: '12px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: '#6b7280', fontSize: '12px' },
          formatter: (v) => compactNumberFormatter(Number(v)),
        },
      },
      tooltip: {
        ...base.tooltip,
        y: {
          formatter: (v, opts) => {
            const item = data[opts?.dataPointIndex ?? 0]
            if (valueIsCurrency) {
              return currencyTooltipFormatter(Number(v), item?.currency)
            }
            return Number(v).toLocaleString()
          },
        },
      },
    }
  }, [chartHeight, color, data, useDistributed, valueIsCurrency])

  const series = useMemo(
    () => [{ name: valueIsCurrency ? 'Gross Sales' : 'Count', data: data.map((d) => d.value) }],
    [data, valueIsCurrency]
  )

  if (data.length === 0) return null

  return (
    <ApexChart
      type="bar"
      height={chartHeight}
      options={options}
      series={series}
    />
  )
}
