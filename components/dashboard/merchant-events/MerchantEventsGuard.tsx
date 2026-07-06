'use client'

import React from 'react'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { MerchantEventsAccessDenied } from './AccessDenied'

export function useMerchantEventsPermissions() {
  const { hasPermission } = usePermissions()
  return {
    canView: hasPermission(PERMISSIONS.MERCHANT_EVENTS_VIEW),
    canManage: hasPermission(PERMISSIONS.MERCHANT_EVENTS_MANAGE),
  }
}

export function MerchantEventsGuard({ children }: { children: React.ReactNode }) {
  const { canView } = useMerchantEventsPermissions()
  if (!canView) return <MerchantEventsAccessDenied />
  return <>{children}</>
}
