"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Download, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Calculator,
  Receipt,
  Building2,
  CreditCard,
  Users,
  BarChart3,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

const RevenueTaxPage = () => {
  const [activeTab, setActiveTab] = useState("revenue")

  // Sample revenue and tax data
  const revenueData = [
    {
      id: "REV-001",
      transactionId: "TX-78945",
      type: "P2P Transfer",
      amount: 250000,
      governmentTax: 2500, // 1% of transaction
      rukaCharge: 1250, // 0.5% of transaction
      exciseDuty: 500, // 0.2% of transaction
      vat: 3750, // 1.5% of transaction
      netRevenue: 242000,
      customer: "John Doe",
      date: "2024-01-15 14:30:00",
      status: "completed"
    },
    {
      id: "REV-002",
      transactionId: "TX-78946",
      type: "Merchant Payment",
      amount: 89000,
      governmentTax: 890, // 1% of transaction
      rukaCharge: 445, // 0.5% of transaction
      exciseDuty: 178, // 0.2% of transaction
      vat: 1335, // 1.5% of transaction
      netRevenue: 86152,
      customer: "SuperMart",
      date: "2024-01-15 13:45:00",
      status: "completed"
    },
    {
      id: "REV-003",
      transactionId: "TX-78947",
      type: "Bill Payment",
      amount: 150000,
      governmentTax: 1500, // 1% of transaction
      rukaCharge: 750, // 0.5% of transaction
      exciseDuty: 300, // 0.2% of transaction
      vat: 2250, // 1.5% of transaction
      netRevenue: 145200,
      customer: "Electricity Co",
      date: "2024-01-15 12:20:00",
      status: "pending"
    },
    {
      id: "REV-004",
      transactionId: "TX-78948",
      type: "Agent Cash Deposit",
      amount: 500000,
      governmentTax: 5000, // 1% of transaction
      rukaCharge: 2500, // 0.5% of transaction
      exciseDuty: 1000, // 0.2% of transaction
      vat: 7500, // 1.5% of transaction
      netRevenue: 485000,
      customer: "Agent Kampala",
      date: "2024-01-15 11:15:00",
      status: "completed"
    },
    {
      id: "REV-005",
      transactionId: "TX-78949",
      type: "International Transfer",
      amount: 750000,
      governmentTax: 7500, // 1% of transaction
      rukaCharge: 3750, // 0.5% of transaction
      exciseDuty: 1500, // 0.2% of transaction
      vat: 11250, // 1.5% of transaction
      netRevenue: 727500,
      customer: "Mike Wilson",
      date: "2024-01-15 10:30:00",
      status: "completed"
    }
  ]

  const taxSummary = {
    totalRevenue: 1340000,
    totalGovernmentTax: 13400,
    totalRukaCharge: 6700,
    totalExciseDuty: 2680,
    totalVat: 20100,
    totalNetRevenue: 1297120,
    monthlyGrowth: 12.5,
    taxCompliance: 98.7
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatAmount = (amount: number) => {
    return `UGX ${amount.toLocaleString('en-UG')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Revenue & Tax Management</h1>
            <p className="text-gray-600">Monitor revenue, taxes, and financial compliance</p>
          </div>

          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mb-4">
            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Total Revenue</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{formatAmount(taxSummary.totalRevenue)}</p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">+{taxSummary.monthlyGrowth}% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Net Revenue</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{formatAmount(taxSummary.totalNetRevenue)}</p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">After all deductions</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Total Taxes</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{formatAmount(taxSummary.totalGovernmentTax + taxSummary.totalVat + taxSummary.totalExciseDuty)}</p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">Government & VAT</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Tax Compliance</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{taxSummary.taxCompliance}%</p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">Compliance rate</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tax Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mb-4">
            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Government Tax</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{formatAmount(taxSummary.totalGovernmentTax)}</p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">1% of transaction value</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">RukaPay Charges</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{formatAmount(taxSummary.totalRukaCharge)}</p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">0.5% service fee</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">Excise Duty</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{formatAmount(taxSummary.totalExciseDuty)}</p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">0.2% excise tax</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between mb-0">
                  <p className="text-sm font-medium text-gray-600 mb-0">VAT</p>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 leading-tight">{formatAmount(taxSummary.totalVat)}</p>
                <div className="mt-0">
                  <span className="text-sm text-gray-500">1.5% value added tax</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue and Tax Management */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Tax Details</CardTitle>
              <CardDescription>Detailed breakdown of revenue, taxes, and charges</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="revenue" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Revenue Details
                  </TabsTrigger>
                  <TabsTrigger value="tax" className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Tax Analysis
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="mt-6">
                  <div className="space-y-4">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search transactions..."
                          className="pl-10"
                        />
                      </div>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                    </div>

                    {/* Revenue Table */}
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Gov Tax</TableHead>
                            <TableHead>Ruka Charge</TableHead>
                            <TableHead>Excise Duty</TableHead>
                            <TableHead>VAT</TableHead>
                            <TableHead>Net Revenue</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {revenueData.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.transactionId}</TableCell>
                              <TableCell>{item.type}</TableCell>
                              <TableCell>{item.customer}</TableCell>
                              <TableCell className="font-medium">{formatAmount(item.amount)}</TableCell>
                              <TableCell className="text-red-600">{formatAmount(item.governmentTax)}</TableCell>
                              <TableCell className="text-blue-600">{formatAmount(item.rukaCharge)}</TableCell>
                              <TableCell className="text-orange-600">{formatAmount(item.exciseDuty)}</TableCell>
                              <TableCell className="text-purple-600">{formatAmount(item.vat)}</TableCell>
                              <TableCell className="font-medium text-green-600">{formatAmount(item.netRevenue)}</TableCell>
                              <TableCell>{getStatusBadge(item.status)}</TableCell>
                              <TableCell>{formatDate(item.date)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tax" className="mt-6">
                  <div className="space-y-6">
                    {/* Tax Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Tax Breakdown</CardTitle>
                          <CardDescription>Percentage breakdown of taxes</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Government Tax</span>
                              <span className="text-sm font-medium">1.0%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">RukaPay Charge</span>
                              <span className="text-sm font-medium">0.5%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Excise Duty</span>
                              <span className="text-sm font-medium">0.2%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">VAT</span>
                              <span className="text-sm font-medium">1.5%</span>
                            </div>
                            <div className="border-t pt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Total Deductions</span>
                                <span className="text-sm font-medium text-red-600">3.2%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Monthly Tax Trends</CardTitle>
                          <CardDescription>Tax collection over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">This Month</span>
                              <span className="text-sm font-medium">{formatAmount(taxSummary.totalGovernmentTax + taxSummary.totalVat + taxSummary.totalExciseDuty)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Last Month</span>
                              <span className="text-sm font-medium">UGX 18,500</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Growth</span>
                              <span className="text-sm font-medium text-green-600">+12.5%</span>
                            </div>
                            <div className="border-t pt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">YTD Total</span>
                                <span className="text-sm font-medium">UGX 245,800</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Tax Compliance */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Tax Compliance Status</CardTitle>
                        <CardDescription>Current compliance metrics</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{taxSummary.taxCompliance}%</div>
                            <div className="text-sm text-gray-600">Compliance Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">15</div>
                            <div className="text-sm text-gray-600">Days to Next Filing</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">100%</div>
                            <div className="text-sm text-gray-600">Filing Accuracy</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default RevenueTaxPage 