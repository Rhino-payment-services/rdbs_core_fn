"use client"

import React from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { BackupSettings } from '@/components/dashboard/settings/BackupSettings'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
import { PERMISSIONS } from '@/lib/hooks/usePermissions'
import { Database } from 'lucide-react'

const BackupsPage = () => {
  return (
    <PermissionGuard
      permission={PERMISSIONS.BACKUP_VIEW}
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Database className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have permission to view backups.</p>
          </div>
        </div>
      }
      showFallback
    >
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Backups</h1>
              <p className="text-gray-600 mt-2">Run, download, and clean up database backups.</p>
            </div>
            <BackupSettings />
          </div>
        </main>
      </div>
    </PermissionGuard>
  )
}

export default BackupsPage
