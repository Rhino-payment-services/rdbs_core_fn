'use client'

import React from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { PlatformRevenuePanel } from '@/components/dashboard/PlatformRevenuePanel'

const PlatformRevenuePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="dashboard-shell">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Platform revenue</h1>
            <p className="text-gray-600 mt-2">
              Consolidated RukaPay fee revenue — view accruals by partner and settle to bank, mobile
              money (MTN / Airtel), or partner offset.
            </p>
          </div>
          <PlatformRevenuePanel />
        </div>
      </main>
    </div>
  )
}

export default PlatformRevenuePage
