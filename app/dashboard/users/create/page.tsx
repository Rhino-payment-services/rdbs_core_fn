'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { Button } from '@/components/ui/button'
import { CreateStaffUserWizard } from '@/components/dashboard/users/CreateStaffUserWizard'

const CreateUserPage = () => {
  return (
    <DashboardPageLayout variant="form">
      <DashboardBreadcrumbs items={getDashboardPageCrumbs('users/create')} />
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard/users">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Staff User</h1>
        <p className="text-gray-600">
          Verify work email, optionally link an existing customer by phone, then complete staff
          details. Staff sign in with email; customer wallets stay on the same profile when linked.
        </p>
      </div>
      <CreateStaffUserWizard />
    </DashboardPageLayout>
  )
}

export default CreateUserPage
