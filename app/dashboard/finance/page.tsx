"use client"
import React from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  DollarSign,
  ArrowLeftRight,
  Building2,
  FileSearch,
  Wallet,
  BookOpen,
  BarChart3,
  Layers,
  Settings2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const FinancePage = () => {
  const router = useRouter()

  const financeSections = [
    {
      title: 'Tariff Management',
      description: 'Manage transaction fees and charges across partners & payment types',
      icon: DollarSign,
      href: '/dashboard/finance/tariffs',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Ledgers (Transactions)',
      description: 'Browse and investigate internal transactions and ledger activity',
      icon: BookOpen,
      href: '/dashboard/transactions',
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200'
    },
    {
      title: 'Reports',
      description: 'View downloadable reports and system finance summaries',
      icon: BarChart3,
      href: '/dashboard/reports',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      title: 'Wallets',
      description: 'View and manage customer and merchant wallets',
      icon: Wallet,
      href: '/dashboard/wallet',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      title: 'System Wallets',
      description: 'Inspect platform system wallets and balances',
      icon: Layers,
      href: '/dashboard/system-wallets',
      color: 'text-teal-700',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    {
      title: 'OVA Accounts',
      description: 'Manage OVA accounts and related finance configuration',
      icon: Settings2,
      href: '/dashboard/finance/ova',
      color: 'text-cyan-700',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200'
    },
    {
      title: 'External Payment Partners',
      description: 'Manage external payment partners (ABC, Pegasus, etc.) and their configurations',
      icon: Building2,
      href: '/dashboard/finance/partners',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Transaction Modes',
      description: 'Configure and manage transaction modes available in the system',
      icon: Settings2,
      href: '/dashboard/transaction-modes',
      color: 'text-fuchsia-700',
      bgColor: 'bg-fuchsia-50',
      borderColor: 'border-fuchsia-200'
    },
    {
      title: 'Transaction Mapping',
      description: 'Configure transaction type mappings and routing rules',
      icon: ArrowLeftRight,
      href: '/dashboard/finance/transaction-mapping',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Provider Reconciliation',
      description: 'Ingest settlement files, auto-match rows, and review matched/unmatched records',
      icon: FileSearch,
      href: '/dashboard/finance/reconciliation',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance</h1>
          <p className="text-gray-600">Manage all finance tools from one place</p>
        </div>

        {/* Finance Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financeSections.map((section) => {
            const Icon = section.icon
            return (
              <Card 
                key={section.href}
                className={`${section.borderColor} hover:shadow-lg transition-shadow cursor-pointer`}
                onClick={() => router.push(section.href)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${section.bgColor}`}>
                      <Icon className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <ArrowRight className={`h-5 w-5 ${section.color} opacity-50`} />
                  </div>
                  <CardTitle className="mt-4">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(section.href)
                    }}
                  >
                    Manage
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Stats or Additional Info */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Finance Overview</CardTitle>
              <CardDescription>
                Access all finance-related management tools from this page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                Use the quick links above to jump directly to any Finance section (the same destinations available in the Finance dropdown).
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default FinancePage
