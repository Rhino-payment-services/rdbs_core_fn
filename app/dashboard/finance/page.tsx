"use client"
import React from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  DollarSign,
  CreditCard,
  ArrowLeftRight,
  Settings,
  Building2
} from 'lucide-react'
import Link from 'next/link'
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
      title: 'External Payment Partners',
      description: 'Manage external payment partners (ABC, Pegasus, etc.) and their configurations',
      icon: Building2,
      href: '/dashboard/finance/partners',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Transaction Mapping',
      description: 'Configure transaction type mappings and routing rules',
      icon: ArrowLeftRight,
      href: '/dashboard/finance/transaction-mapping',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Finance</h1>
          <p className="text-gray-600">Manage tariffs, partners, and transaction configurations</p>
        </div>

        {/* Finance Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Tariff Management</h3>
                  <p className="text-sm text-gray-600">
                    Configure fees, charges, and pricing rules for all transaction types
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Payment Partners</h3>
                  <p className="text-sm text-gray-600">
                    Manage external payment gateway partners and their settings
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Transaction Mapping</h3>
                  <p className="text-sm text-gray-600">
                    Set up routing rules and transaction type mappings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default FinancePage
