'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { Props as ReactApexChartProps } from 'react-apexcharts'
import { cn } from '@/lib/utils'

const ReactApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => <div className="w-full min-h-[180px] rounded-lg bg-gray-100 animate-pulse" />,
})

interface ApexChartProps extends ReactApexChartProps {
  className?: string
}

export function ApexChart({ className, height, ...props }: ApexChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <ReactApexChart height={height} {...props} />
    </div>
  )
}
