'use client'

import React from 'react'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { PlatformRevenuePanel } from '@/components/dashboard/PlatformRevenuePanel'

const PlatformRevenuePage = () => {
  return (
    <DashboardPageLayout>
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('platform-revenue')} />
      <DashboardPageHeader
        title="Platform revenue"
        description="Consolidated RukaPay fee revenue — view accruals by partner and settle to bank, mobile money (MTN / Airtel), or partner offset."
      />
      <PlatformRevenuePanel />
    </DashboardPageLayout>
  )
}

export default PlatformRevenuePage
