"use client"

import { useState, useEffect, useCallback } from 'react'

export const NAV_ITEMS = [
  { key: 'analytics', label: 'Analytics', description: 'Analytics & reporting overview' },
  { key: 'finance', label: 'Finance', description: 'Tariffs, transactions, wallets & reports' },
  { key: 'gateway-partners', label: 'Gateway Partners', description: 'External gateway partner management' },
  { key: 'users', label: 'Users', description: 'Staff user management' },
  { key: 'customers', label: 'Customers', description: 'Customer account management' },
  { key: 'security', label: 'Security', description: 'Security, KYC, activity & system logs' },
  { key: 'settings', label: 'Settings', description: 'System configuration & settings' },
  { key: 'profile', label: 'Profile', description: 'User profile page' },
] as const

export type NavItemKey = typeof NAV_ITEMS[number]['key']

function storageKeyFor(userId?: string) {
  // Per-user storage (requested). Falls back to a global key when userId is not provided.
  return userId && userId.trim() !== '' ? `rdbs_nav_visibility:${userId}` : 'rdbs_nav_visibility'
}

function loadVisibility(userId?: string): Record<NavItemKey, boolean> {
  if (typeof window === 'undefined') {
    return NAV_ITEMS.reduce((acc, item) => ({ ...acc, [item.key]: true }), {} as Record<NavItemKey, boolean>)
  }
  try {
    const stored = localStorage.getItem(storageKeyFor(userId))
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults so newly added nav items default to visible
      return NAV_ITEMS.reduce((acc, item) => ({
        ...acc,
        [item.key]: parsed[item.key] !== undefined ? parsed[item.key] : true,
      }), {} as Record<NavItemKey, boolean>)
    }
  } catch {
    // Ignore parse errors
  }
  return NAV_ITEMS.reduce((acc, item) => ({ ...acc, [item.key]: true }), {} as Record<NavItemKey, boolean>)
}

export function useNavVisibility(userId?: string) {
  const [visibility, setVisibility] = useState<Record<NavItemKey, boolean>>(() => loadVisibility(userId))

  // Re-read from storage when component mounts (handles SSR)
  useEffect(() => {
    setVisibility(loadVisibility(userId))
  }, [userId])

  const isVisible = useCallback(
    (key: NavItemKey): boolean => visibility[key] ?? true,
    [visibility]
  )

  const setItemVisible = useCallback((key: NavItemKey, visible: boolean) => {
    setVisibility(prev => {
      const updated = { ...prev, [key]: visible }
      try {
        localStorage.setItem(storageKeyFor(userId), JSON.stringify(updated))
      } catch {
        // Ignore storage errors
      }
      return updated
    })
  }, [userId])

  const resetToDefaults = useCallback(() => {
    const defaults = NAV_ITEMS.reduce(
      (acc, item) => ({ ...acc, [item.key]: true }),
      {} as Record<NavItemKey, boolean>
    )
    try {
      localStorage.removeItem(storageKeyFor(userId))
    } catch {
      // Ignore storage errors
    }
    setVisibility(defaults)
  }, [userId])

  return { visibility, isVisible, setItemVisible, resetToDefaults }
}
