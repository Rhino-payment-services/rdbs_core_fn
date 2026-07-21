'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartCardProps {
  title: string
  description?: string
  emptyMessage?: string
  isEmpty?: boolean
  children: React.ReactNode
  className?: string
}

export function ChartCard({
  title,
  description,
  emptyMessage = 'No data yet',
  isEmpty = false,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={`shadow-sm border-gray-100 ${className ?? ''}`}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <p className="text-gray-500 text-sm py-8 text-center">{emptyMessage}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
