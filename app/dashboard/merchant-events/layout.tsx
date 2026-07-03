'use client'

import React from 'react'
import { MerchantEventsNav } from '@/components/dashboard/merchant-events/MerchantEventsNav'
import { MerchantEventsGuard } from '@/components/dashboard/merchant-events/MerchantEventsGuard'

export default function MerchantEventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <MerchantEventsGuard>
      <div className="bg-[#f8fafc] min-h-full -m-4 sm:-m-6 p-4 sm:p-6">
        <MerchantEventsNav />
        {children}
      </div>
    </MerchantEventsGuard>
  )
}
