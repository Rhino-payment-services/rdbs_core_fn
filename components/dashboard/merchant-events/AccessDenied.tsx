'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'

export function MerchantEventsAccessDenied() {
  return (
    <DashboardPageLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don&apos;t have permission to view merchant events. Contact your administrator for
            the MERCHANT_EVENTS_VIEW permission.
          </p>
        </div>
      </div>
    </DashboardPageLayout>
  )
}
