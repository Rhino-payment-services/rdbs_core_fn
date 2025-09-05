"use client"

import React, { useState } from 'react'
import { Bell, Search, Settings, User, LogOut, Home, BarChart3, Users, CreditCard, Shield, Activity, FileText, Database, Cog, HelpCircle, DollarSign, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePermissions, PERMISSIONS } from '@/lib/hooks/usePermissions'
import { PermissionGuard } from '@/components/ui/PermissionGuard'
// import NotificationsModal from './NotificationsModal'

const Navbar = () => {
  const pathname = usePathname()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const { user, logout } = useAuth()
  const { 
    canViewTransactions,
    canViewUsers,
    canViewSystemLogs,
    canConfigureSystem,
    canViewWallets,
    canViewKyc,
    userRole
  } = usePermissions()
  
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
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search transactions, users, or reports..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent"
              />
            </div>
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
            <div className="flex items-center overflow-x-auto scrollbar-hide">
              <div className="flex items-center space-x-1 px-4 py-3 min-w-max">
                <Link 
                  href="/dashboard" 
                  className={`flex items-center space-x-2 py-2 px-3 font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive('/dashboard') && !isActive('/dashboard/transactions') && !isActive('/dashboard/users') && !isActive('/dashboard/analytics') && !isActive('/dashboard/activity') && !isActive('/dashboard/revenue-tax') && !isActive('/dashboard/reports') && !isActive('/dashboard/security') && !isActive('/dashboard/settings') && !isActive('/dashboard/customers')
                      ? 'text-[#08163d] bg-[#08163d]/10 rounded-lg border border-[#08163d]/20'
                      : 'text-gray-600 hover:text-[#08163d] hover:bg-[#08163d]/5 rounded-lg border border-transparent hover:border-[#08163d]/20'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                
                <Link 
                  href="/dashboard/transactions" 
                  className={`flex items-center space-x-2 py-2 px-3 font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive('/dashboard/transactions')
                      ? 'text-[#08163d] bg-[#08163d]/10 rounded-lg border border-[#08163d]/20'
                      : 'text-gray-600 hover:text-[#08163d] hover:bg-[#08163d]/5 rounded-lg border border-transparent hover:border-[#08163d]/20'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Transactions</span>
                </Link>
                
                <PermissionGuard permission={PERMISSIONS.VIEW_USERS}>
                  <Link 
                    href="/dashboard/users" 
                    className={`flex items-center space-x-2 py-2 px-3 font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive('/dashboard/users')
                        ? 'text-[#08163d] bg-[#08163d]/10 rounded-lg border border-[#08163d]/20'
                        : 'text-gray-600 hover:text-[#08163d] hover:bg-[#08163d]/5 rounded-lg border border-transparent hover:border-[#08163d]/20'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Users</span>
                  </Link>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.VIEW_USERS}>
                  <Link 
                    href="/dashboard/customers" 
                    className={`flex items-center space-x-2 py-2 px-3 font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive('/dashboard/customers')
                        ? 'text-[#08163d] bg-[#08163d]/10 rounded-lg border border-[#08163d]/20'
                        : 'text-gray-600 hover:text-[#08163d] hover:bg-[#08163d]/5 rounded-lg border border-transparent hover:border-[#08163d]/20'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Customers</span>
                  </Link>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.VIEW_WALLETS}>
                  <Link 
                    href="/dashboard/wallet" 
                    className={`flex items-center space-x-2 py-2 px-3 font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive('/dashboard/wallet')
                        ? 'text-[#08163d] bg-[#08163d]/10 rounded-lg border border-[#08163d]/20'
                        : 'text-gray-600 hover:text-[#08163d] hover:bg-[#08163d]/5 rounded-lg border border-transparent hover:border-[#08163d]/20'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Wallets</span>
                  </Link>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.VIEW_KYC}>
                  <Link 
                    href="/dashboard/kyc" 
                    className={`flex items-center space-x-2 py-2 px-3 font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive('/dashboard/kyc')
                        ? 'text-[#08163d] bg-[#08163d]/10 rounded-lg border border-[#08163d]/20'
                        : 'text-gray-600 hover:text-[#08163d] hover:bg-[#08163d]/5 rounded-lg border border-transparent hover:border-[#08163d]/20'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>KYC</span>
                  </Link>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.VIEW_SYSTEM_LOGS}>
                  <Link 
                    href="/dashboard/reports" 
                    className={`flex items-center space-x-2 py-2 px-3 font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive('/dashboard/reports')
                        ? 'text-[#08163d] bg-[#08163d]/10 rounded-lg border border-[#08163d]/20'
                        : 'text-gray-600 hover:text-[#08163d] hover:bg-[#08163d]/5 rounded-lg border border-transparent hover:border-[#08163d]/20'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Reports</span>
                  </Link>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.SYSTEM_CONFIGURE}>
                  <Link 
                    href="/dashboard/security" 
                    className={`flex items-center space-x-2 py-2 px-3 font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive('/dashboard/security')
                        ? 'text-[#08163d] bg-[#08163d]/10 rounded-lg border border-[#08163d]/20'
                        : 'text-gray-600 hover:text-[#08163d] hover:bg-[#08163d]/5 rounded-lg border border-transparent hover:border-[#08163d]/20'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Security</span>
                  </Link>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.SYSTEM_CONFIGURE}>
                  <Link 
                    href="/dashboard/settings" 
                    className={`flex items-center space-x-2 py-2 px-3 font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive('/dashboard/settings')
                        ? 'text-[#08163d] bg-[#08163d]/10 rounded-lg border border-[#08163d]/20'
                        : 'text-gray-600 hover:text-[#08163d] hover:bg-[#08163d]/5 rounded-lg border border-transparent hover:border-[#08163d]/20'
                    }`}
                  >
                    <Cog className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.VIEW_SYSTEM_LOGS}>
                  <Link 
                    href="/dashboard/api-logs" 
                    className={`flex items-center space-x-2 py-2 px-3 font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive('/dashboard/api-logs')
                        ? 'text-[#08163d] bg-[#08163d]/10 rounded-lg border border-[#08163d]/20'
                        : 'text-gray-600 hover:text-[#08163d] hover:bg-[#08163d]/5 rounded-lg border border-transparent hover:border-[#08163d]/20'
                    }`}
                  >
                    <Database className="h-4 w-4" />
                    <span>API Logs</span>
                  </Link>
                </PermissionGuard>
                
                <PermissionGuard permission={PERMISSIONS.VIEW_SYSTEM_LOGS}>
                  <Link 
                    href="/dashboard/system-logs" 
                    className={`flex items-center space-x-2 py-2 px-3 font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive('/dashboard/system-logs')
                        ? 'text-[#08163d] bg-[#08163d]/10 rounded-lg border border-[#08163d]/20'
                        : 'text-gray-600 hover:text-[#08163d] hover:bg-[#08163d]/5 rounded-lg border border-transparent hover:border-[#08163d]/20'
                    }`}
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>System Logs</span>
                  </Link>
                </PermissionGuard>
                
                <Link 
                  href="/dashboard/profile" 
                  className={`flex items-center space-x-2 py-2 px-3 font-medium whitespace-nowrap transition-all duration-200 ${
                    isActive('/dashboard/profile')
                      ? 'text-[#08163d] bg-[#08163d]/10 rounded-lg border border-[#08163d]/20'
                      : 'text-gray-600 hover:text-[#08163d] hover:bg-[#08163d]/5 rounded-lg border border-transparent hover:border-[#08163d]/20'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </div>
            </div>
            
            {/* Gradient Overlays for Scroll Indication */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
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
