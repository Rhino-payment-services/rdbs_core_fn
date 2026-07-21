'use client'

import React, { useMemo } from 'react'
import type { ApexOptions } from 'apexcharts'
import { ApexChart } from './ApexChart'
import { getBaseChartOptions } from '@/lib/utils/merchantEventsCharts'

interface RadialChartProps {
  rate: number
  checkedIn: number
  pending: number
  total: number
  height?: number
}

export function RadialChart({
  rate,
  checkedIn,
  pending,
  total,
  height = 280,
}: RadialChartProps) {
  const options: ApexOptions = useMemo(() => {
    const base = getBaseChartOptions(height)
    return {
      ...base,
      colors: ['#10b981'],
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: ['#06b6d4'],
          stops: [0, 100],
        },
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: { size: '62%' },
          track: { background: '#e5e7eb', strokeWidth: '100%' },
          dataLabels: {
            name: {
              show: true,
              fontSize: '12px',
              color: '#6b7280',
              offsetY: 24,
            },
            value: {
              show: true,
              fontSize: '28px',
              fontWeight: 700,
              color: '#059669',
              offsetY: -8,
              formatter: () => `${Math.round(rate)}%`,
            },
          },
        },
      },
      labels: ['Check-in rate'],
      stroke: { lineCap: 'round' },
    }
  }, [height, rate])

  const series = useMemo(() => [Math.min(100, Math.max(0, rate))], [rate])

  return (
    <div className="flex flex-col items-center">
      <ApexChart type="radialBar" height={height} options={options} series={series} />
      <dl className="grid grid-cols-3 gap-4 w-full mt-2 text-center text-sm">
        <div>
          <dt className="text-gray-500">Total</dt>
          <dd className="font-bold text-lg text-violet-600">{total.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Checked In</dt>
          <dd className="font-bold text-lg text-emerald-600">{checkedIn.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Pending</dt>
          <dd className="font-bold text-lg text-amber-600">{pending.toLocaleString()}</dd>
        </div>
      </dl>
    </div>
  )
}
