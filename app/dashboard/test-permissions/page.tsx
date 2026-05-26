"use client"

import React from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import {
  DASHBOARD_MAIN_CLASS,
  dashboardFormShellClass,
  dashboardPageShellClass,
} from '@/lib/constants/dashboard-layout'
import PermissionsDemo from '@/components/PermissionsDemo'

const TestPermissionsPage = () => {
  return (
    <DashboardPageLayout variant="form">
        <DashboardBreadcrumbs items={getDashboardPageCrumbs('test-permissions')} />
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Permissions Test Page</h1>
          <PermissionsDemo />
    </DashboardPageLayout>
  )
}

export default TestPermissionsPage 