'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { Button } from '@/components/ui/button'
import { DuplicateAccountsPanel } from '@/components/dashboard/users/DuplicateAccountsPanel'
import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { PERMISSIONS } from '@/lib/hooks/usePermissions'

export default function DuplicateAccountsPage() {
  return (
    <PermissionGuard permission={PERMISSIONS.USERS_UPDATE}>
      <DashboardPageLayout>
        <DashboardBreadcrumbs items={getDashboardPageCrumbs('users/duplicates')} />
        <div className="mb-4">
          <Link href="/dashboard/users">
            <Button variant="ghost" size="sm" className="text-gray-600">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Users
            </Button>
          </Link>
        </div>
        <DashboardPageHeader
          title="Duplicate accounts"
          description="Review phone numbers shared by multiple users, merge accounts, and deactivate empty duplicate wallets."
        />
        <DuplicateAccountsPanel />
      </DashboardPageLayout>
    </PermissionGuard>
  )
}
