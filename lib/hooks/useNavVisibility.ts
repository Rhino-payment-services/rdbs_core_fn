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

const STORAGE_KEY = 'rdbs_nav_visibility'

function loadVisibility(): Record<NavItemKey, boolean> {
  if (typeof window === 'undefined') {
    return NAV_ITEMS.reduce((acc, item) => ({ ...acc, [item.key]: true }), {} as Record<NavItemKey, boolean>)
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
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

export function useNavVisibility() {
  const [visibility, setVisibility] = useState<Record<NavItemKey, boolean>>(loadVisibility)

  // Re-read from storage when component mounts (handles SSR)
  useEffect(() => {
    setVisibility(loadVisibility())
  }, [])

  const isVisible = useCallback(
    (key: NavItemKey): boolean => visibility[key] ?? true,
    [visibility]
  )

  const setItemVisible = useCallback((key: NavItemKey, visible: boolean) => {
    setVisibility(prev => {
      const updated = { ...prev, [key]: visible }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {
        // Ignore storage errors
      }
      return updated
    })
  }, [])

  const resetToDefaults = useCallback(() => {
    const defaults = NAV_ITEMS.reduce(
      (acc, item) => ({ ...acc, [item.key]: true }),
      {} as Record<NavItemKey, boolean>
    )
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
    setVisibility(defaults)
  }, [])

  return { visibility, isVisible, setItemVisible, resetToDefaults }
}
