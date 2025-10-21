"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Bell, Search, Settings, User, LogOut, Home,Users, CreditCard, Shield, FileText, Database, Cog, DollarSign, AlertCircle, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { SearchInput } from '@/components/ui/search-input'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { PERMISSIONS, usePermissions } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
// import NotificationsModal from './NotificationsModal'

const Navbar = () => {
  const pathname = usePathname()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isFinanceDropdownOpen, setIsFinanceDropdownOpen] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [financeMenuPosition, setFinanceMenuPosition] = useState({ left: 0, top: 0 })
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const financeMenuRef = useRef<HTMLDivElement>(null)
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { user, logout } = useAuth()
  const { canViewSystemLogs, hasPermission, userRole } = usePermissions()

  console.log(isNotificationsOpen)

  // Check scroll position and update button states
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth)
    }
  }

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  // Handle dropdown hover with delay
  const handleFinanceMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
    }
    setIsFinanceDropdownOpen(true)
  }

  const handleFinanceMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsFinanceDropdownOpen(false)
    }, 150) // 150ms delay before closing
  }

  // Update Finance menu position when dropdown opens
  useEffect(() => {
    if (isFinanceDropdownOpen && financeMenuRef.current) {
      const rect = financeMenuRef.current.getBoundingClientRect()
      setFinanceMenuPosition({
        left: rect.left,
        top: rect.bottom
      })
    }
  }, [isFinanceDropdownOpen])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current)
      }
    }
  }, [])

  // Check scroll position on mount and when window resizes
  useEffect(() => {
    checkScrollPosition()
    window.addEventListener('resize', checkScrollPosition)
    return () => window.removeEventListener('resize', checkScrollPosition)
  }, [])
  
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    if (path === '/dashboard/profile') {
      return pathname === '/dashboard/profile'
    }
    return pathname.startsWith(path)
  }
  
  return (
      <div className="bg-white border-b border-gray-200 relative z-[9999]">
      {/* Main Navbar */}
      <nav className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#08163d] rounded-xl flex items-center justify-center">
                <Image src="/images/logoRukapay2.png" alt="logo" width={32} height={32} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RDBS</h1>
                <p className="text-xs text-gray-600">Database Management System</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <SearchInput
              type="text"
              placeholder="Search transactions, users, or reports..."
            />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <Link href="/dashboard/profile" className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="w-8 h-8 bg-[#08163d] rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-sm font-medium">
                    {user?.email || 'User'}
                  </span>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.userType || 'User'}
                  </div>
                </div>
              </Link>
            </div>

            {/* Logout */}
            <button 
              onClick={logout}
              className="flex items-center space-x-2 p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:block text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Menu Bar */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            {/* Scrollable Menu Container */}
            <div 
              ref={scrollContainerRef}
              className="nav-slider-container"
              onScroll={checkScrollPosition}
            >
              <div className="nav-slider-content">
                <Link 
                  href="/dashboard" 
                  className={`nav-slider-item ${
                    isActive('/dashboard') && !isActive('/dashboard/transactions') && !isActive('/dashboard/users') && !isActive('/dashboard/analytics') && !isActive('/dashboard/activity') && !isActive('/dashboard/revenue-tax') && !isActive('/dashboard/reports') && !isActive('/dashboard/security') && !isActive('/dashboard/settings') && !isActive('/dashboard/customers')
                      ? 'active'
                      : ''
                  }`}
                >
                  <Home className="nav-icon" />
                  <span>Dashboard</span>
                </Link>
                
                {/* Analytics Menu - Only show if user has analytics permissions */}
                <PermissionGuard permission={PERMISSIONS.ANALYTICS_VIEW}>
                  <Link 
                    href="/dashboard/analytics" 
                    className={`nav-slider-item ${
                      isActive('/dashboard/analytics')
                        ? 'active'
                        : ''
                    }`}
                  >
                    <BarChart3 className="nav-icon" />
                    <span>Analytics</span>
                  </Link>
                </PermissionGuard>
                
                {/* Ledgers Menu - Only show if user has transaction permissions */}
                <PermissionGuard permission={PERMISSIONS.TRANSACTIONS_VIEW}>
                  <Link 
                    href="/dashboard/transactions" 
                    className={`nav-slider-item ${
                      isActive('/dashboard/transactions')
                        ? 'active'
                        : ''
                    }`}
                  >
                    <CreditCard className="nav-icon" />
                    <span>Ledgers</span>
                  </Link>
                </PermissionGuard>
                
                {/* Finance Menu - Show if user has tariff OR transaction management permissions */}
                <PermissionGuard permissions={[
                  PERMISSIONS.TARIFF_VIEW, PERMISSIONS.TARIFF_CREATE, PERMISSIONS.TARIFF_UPDATE, PERMISSIONS.TARIFF_DELETE, PERMISSIONS.TARIFF_APPROVE, PERMISSIONS.TARIFF_REJECT,
                  PERMISSIONS.TRANSACTIONS_VIEW, PERMISSIONS.TRANSACTIONS_APPROVE, PERMISSIONS.TRANSACTIONS_REVERSE
                ]}>
                  <div 
                    ref={financeMenuRef}
                    className="relative"
                    onMouseEnter={handleFinanceMouseEnter}
                    onMouseLeave={handleFinanceMouseLeave}
                  >
                    <Link 
                      href="/dashboard/finance" 
                      className={`nav-slider-item ${
                        isActive('/dashboard/finance') || isActive('/dashboard/finance/tariffs') || isActive('/dashboard/finance/partners') || isActive('/dashboard/finance/transaction-mapping')
                          ? 'active'
                          : ''
                      }`}
                    >
                      <DollarSign className="nav-icon" />
                      <span>Finance</span>
                    </Link>
                  </div>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.USERS_VIEW}>
                  <Link 
                    href="/dashboard/users" 
                    className={`nav-slider-item ${
                      isActive('/dashboard/users')
                        ? 'active'
                        : ''
                    }`}
                  >
                    <Users className="nav-icon" />
                    <span>Users</span>
                  </Link>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.USERS_VIEW}>
                  <Link 
                    href="/dashboard/customers" 
                    className={`nav-slider-item ${
                      isActive('/dashboard/customers')
                        ? 'active'
                        : ''
                    }`}
                  >
                    <Users className="nav-icon" />
                    <span>Customers</span>
                  </Link>
                </PermissionGuard>
                
                
                <PermissionGuard permission={PERMISSIONS.KYC_VIEW}>
                  <Link 
                    href="/dashboard/kyc" 
                    className={`nav-slider-item ${
                      isActive('/dashboard/kyc')
                        ? 'active'
                        : ''
                    }`}
                  >
                    <Shield className="nav-icon" />
                    <span>KYC</span>
                  </Link>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.SYSTEM_LOGS}>
                  <Link 
                    href="/dashboard/reports" 
                    className={`nav-slider-item ${
                      isActive('/dashboard/reports')
                        ? 'active'
                        : ''
                    }`}
                  >
                    <FileText className="nav-icon" />
                    <span>Reports</span>
                  </Link>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.SYSTEM_CONFIGURE}>
                  <Link 
                    href="/dashboard/security" 
                    className={`nav-slider-item ${
                      isActive('/dashboard/security')
                        ? 'active'
                        : ''
                    }`}
                  >
                    <Shield className="nav-icon" />
                    <span>Security</span>
                  </Link>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.SYSTEM_CONFIGURE}>
                  <Link 
                    href="/dashboard/settings" 
                    className={`nav-slider-item ${
                      isActive('/dashboard/settings')
                        ? 'active'
                        : ''
                    }`}
                  >
                    <Cog className="nav-icon" />
                    <span>Settings</span>
                  </Link>
                </PermissionGuard>
                
                {/* Temporarily commented out API Logs tab */}
                {/* {canViewSystemLogs && (
                  <Link 
                    href="/dashboard/api-logs" 
                    className={`nav-slider-item ${
                      isActive('/dashboard/api-logs')
                        ? 'active'
                        : ''
                    }`}
                  >
                    <Database className="nav-icon" />
                    <span>API Logs</span>
                  </Link>
                )} */}
                
                <PermissionGuard permission={PERMISSIONS.SYSTEM_LOGS}>
                  <Link 
                    href="/dashboard/system-logs" 
                    className={`nav-slider-item ${
                      isActive('/dashboard/system-logs')
                        ? 'active'
                        : ''
                    }`}
                  >
                    <AlertCircle className="nav-icon" />
                    <span>System Logs</span>
                  </Link>
                </PermissionGuard>
                
                <Link 
                  href="/dashboard/profile" 
                  className={`nav-slider-item ${
                    isActive('/dashboard/profile')
                      ? 'active'
                      : ''
                  }`}
                >
                  <User className="nav-icon" />
                  <span>Profile</span>
                </Link>
              </div>
            </div>
            
            {/* Left Scroll Button */}
            {canScrollLeft && (
              <button
                onClick={scrollLeft}
                className="nav-slider-scroll-button left"
              >
                <ChevronLeft className="scroll-icon" />
              </button>
            )}

            {/* Right Scroll Button */}
            {canScrollRight && (
              <button
                onClick={scrollRight}
                className="nav-slider-scroll-button right"
              >
                <ChevronRight className="scroll-icon" />
              </button>
            )}

            {/* Gradient Overlays for Scroll Indication */}
            <div className="nav-slider-gradient left"></div>
            <div className="nav-slider-gradient right"></div>

            {/* Finance Dropdown - Positioned closer to Finance tab */}
            {isFinanceDropdownOpen && (
              <div 
                className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[100]"
                style={{ 
                  left: `${financeMenuPosition.left}px`, 
                  top: `${financeMenuPosition.top - 2}px` // Closer to the tab (reduced gap)
                }}
                onMouseEnter={handleFinanceMouseEnter}
                onMouseLeave={handleFinanceMouseLeave}
              >
                {/* Bridge element to prevent dropdown from closing */}
                <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent"></div>
                
                <div className="py-2">
                  <Link 
                    href="/dashboard/finance" 
                    className={`block px-4 py-2 text-sm transition-colors ${
                      isActive('/dashboard/finance') && !isActive('/dashboard/finance/tariffs')
                        ? 'text-[#08163d] bg-[#08163d]/10'
                        : 'text-gray-700 hover:text-[#08163d] hover:bg-[#08163d]/5'
                    }`}
                    onClick={() => setIsFinanceDropdownOpen(false)}
                  >
                    Overview
                  </Link>
                  <Link 
                    href="/dashboard/finance/tariffs" 
                    className={`block px-4 py-2 text-sm transition-colors ${
                      isActive('/dashboard/finance/tariffs')
                        ? 'text-[#08163d] bg-[#08163d]/10'
                        : 'text-gray-700 hover:text-[#08163d] hover:bg-[#08163d]/5'
                    }`}
                    onClick={() => setIsFinanceDropdownOpen(false)}
                  >
                    Tariffs
                  </Link>
                  <Link 
                    href="/dashboard/finance/partners" 
                    className={`block px-4 py-2 text-sm transition-colors ${
                      isActive('/dashboard/finance/partners')
                        ? 'text-[#08163d] bg-[#08163d]/10'
                        : 'text-gray-700 hover:text-[#08163d] hover:bg-[#08163d]/5'
                    }`}
                    onClick={() => setIsFinanceDropdownOpen(false)}
                  >
                    External Payment Partners
                  </Link>
                  <PermissionGuard permissions={[PERMISSIONS.TARIFF_VIEW]}>
                    <Link 
                      href="/dashboard/finance/transaction-mapping" 
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive('/dashboard/finance/transaction-mapping')
                          ? 'text-[#08163d] bg-[#08163d]/10'
                          : 'text-gray-700 hover:text-[#08163d] hover:bg-[#08163d]/5'
                      }`}
                      onClick={() => setIsFinanceDropdownOpen(false)}
                    >
                      Transaction Mapping
                    </Link>
                  </PermissionGuard>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Notifications Modal */}
      {/* <NotificationsModal 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      /> */}
    </div>
  )
}

export default Navbar
