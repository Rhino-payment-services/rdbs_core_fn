"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CreditCard, 
  Users, 
  Building2, 
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle
} from 'lucide-react'
import { useTransactionSystemStats } from '@/lib/hooks/useApi'

const TransactionsPage = () => {
  const [activeTab, setActiveTab] = useState("client")

  // Fetch real transaction system stats
  const { data: transactionStats, isLoading: statsLoading, error: statsError } = useTransactionSystemStats()
  
  // Get stats data
  const stats = transactionStats || {
    totalTransactions: 0,
    totalVolume: 0,
    totalFees: 0,
    successRate: 0,
    averageTransactionAmount: 0,
    transactionsByType: {},
    transactionsByStatus: {},
    transactionsByCurrency: {}
  }

  // Sample transaction data
  const clientTransactions = [
    {
      id: "TX-001",
      type: "P2P Transfer",
      sender: "John Doe",
      recipient: "Jane Smith",
      amount: 250000,
      currency: "UGX",
      status: "completed",
      date: "2024-01-15 14:30:00",
      fee: 2500
    },
    {
      id: "TX-002",
      type: "Merchant Payment",
      sender: "Mike Wilson",
      recipient: "SuperMart",
      amount: 89000,
      currency: "UGX",
      status: "completed",
      date: "2024-01-15 13:45:00",
      fee: 890
    },
    {
      id: "TX-003",
      type: "Bill Payment",
      sender: "Sarah Johnson",
      recipient: "Electricity Co",
      amount: 150000,
      currency: "UGX",
      status: "pending",
      date: "2024-01-15 12:20:00",
      fee: 1500
    },
    {
      id: "TX-004",
      type: "P2P Transfer",
      sender: "David Brown",
      recipient: "Lisa Davis",
      amount: 75000,
      currency: "UGX",
      status: "failed",
      date: "2024-01-15 11:15:00",
      fee: 750
    },
    {
      id: "TX-005",
      type: "Merchant Payment",
      sender: "Emma Wilson",
      recipient: "TechStore",
      amount: 320000,
      currency: "UGX",
      status: "completed",
      date: "2024-01-15 10:30:00",
      fee: 3200
    }
  ]

  const agentTransactions = [
    {
      id: "AG-001",
      type: "Cash Deposit",
      agent: "Agent Kampala",
      customer: "Peter Okello",
      amount: 500000,
      currency: "UGX",
      status: "completed",
      date: "2024-01-15 16:00:00",
      commission: 5000
    },
    {
      id: "AG-002",
      type: "Cash Withdrawal",
      agent: "Agent Jinja",
      customer: "Mary Nakato",
      amount: 300000,
      currency: "UGX",
      status: "completed",
      date: "2024-01-15 15:30:00",
      commission: 3000
    },
    {
      id: "AG-003",
      type: "Money Transfer",
      agent: "Agent Mbarara",
      customer: "James Mwesigwa",
      amount: 200000,
      currency: "UGX",
      status: "pending",
      date: "2024-01-15 14:45:00",
      commission: 2000
    },
    {
      id: "AG-004",
      type: "Cash Deposit",
      agent: "Agent Gulu",
      customer: "Alice Auma",
      amount: 150000,
      currency: "UGX",
      status: "completed",
      date: "2024-01-15 13:20:00",
      commission: 1500
    },
    {
      id: "AG-005",
      type: "Money Transfer",
      agent: "Agent Mbale",
      customer: "Robert Waiswa",
      amount: 400000,
      currency: "UGX",
      status: "failed",
      date: "2024-01-15 12:10:00",
      commission: 4000
    }
  ]

  const superAgentTransactions = [
    {
      id: "SA-001",
      type: "Bulk Transfer",
      superAgent: "Super Agent Kampala",
      subAgents: "5 Agents",
      amount: 2500000,
      currency: "UGX",
      status: "completed",
      date: "2024-01-15 17:00:00",
      commission: 25000
    },
    {
      id: "SA-002",
      type: "Agent Settlement",
      superAgent: "Super Agent Jinja",
      subAgents: "3 Agents",
      amount: 1800000,
      currency: "UGX",
      status: "completed",
      date: "2024-01-15 16:30:00",
      commission: 18000
    },
    {
      id: "SA-003",
      type: "Cash Distribution",
      superAgent: "Super Agent Mbarara",
      subAgents: "7 Agents",
      amount: 3500000,
      currency: "UGX",
      status: "pending",
      date: "2024-01-15 15:45:00",
      commission: 35000
    },
    {
      id: "SA-004",
      type: "Agent Training",
      superAgent: "Super Agent Gulu",
      subAgents: "4 Agents",
      amount: 800000,
      currency: "UGX",
      status: "completed",
      date: "2024-01-15 14:20:00",
      commission: 8000
    },
    {
      id: "SA-005",
      type: "Equipment Distribution",
      superAgent: "Super Agent Mbale",
      subAgents: "6 Agents",
      amount: 1200000,
      currency: "UGX",
      status: "completed",
      date: "2024-01-15 13:10:00",
      commission: 12000
    }
  ]

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
            <p className="text-gray-600">Monitor and manage all transaction activities</p>
          </div>

          {/* Loading State for Stats */}
          {statsLoading && (
            <div className="mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading transaction statistics...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error State for Stats */}
          {statsError && (
            <div className="mb-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error loading statistics</h3>
                    <p className="text-sm text-red-700 mt-1">Failed to load transaction statistics. Please try again.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : stats.totalTransactions.toLocaleString()}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  {stats.successRate.toFixed(1)}% success rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `UGX ${(stats.totalVolume / 1000000).toFixed(1)}M`}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  UGX {stats.averageTransactionAmount.toFixed(0)} avg transaction
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `UGX ${stats.totalFees.toLocaleString()}`}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  {stats.successRate.toFixed(1)}% success rate
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transaction Types</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : Object.keys(stats.transactionsByType).length}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                  {Object.keys(stats.transactionsByStatus).length} status types
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Management</CardTitle>
              <CardDescription>View and manage different types of transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="client" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Client Transactions
                  </TabsTrigger>
                  <TabsTrigger value="agent" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Agent Transactions
                  </TabsTrigger>
                  <TabsTrigger value="superagent" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Super Agent Transactions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="client" className="mt-6">
                  {/* Client Transactions */}
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

                    {/* Transactions Table */}
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Sender</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {clientTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">{transaction.id}</TableCell>
                              <TableCell>{transaction.type}</TableCell>
                              <TableCell>{transaction.sender}</TableCell>
                              <TableCell>{transaction.recipient}</TableCell>
                              <TableCell className="font-medium">
                                {formatAmount(transaction.amount)}
                              </TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell>{formatDate(transaction.date)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="agent" className="mt-6">
                  {/* Agent Transactions */}
                  <div className="space-y-4">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search agent transactions..."
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

                    {/* Agent Transactions Table */}
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Commission</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {agentTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">{transaction.id}</TableCell>
                              <TableCell>{transaction.type}</TableCell>
                              <TableCell>{transaction.agent}</TableCell>
                              <TableCell>{transaction.customer}</TableCell>
                              <TableCell className="font-medium">
                                {formatAmount(transaction.amount)}
                              </TableCell>
                              <TableCell className="text-green-600">
                                {formatAmount(transaction.commission)}
                              </TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell>{formatDate(transaction.date)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="superagent" className="mt-6">
                  {/* Super Agent Transactions */}
                  <div className="space-y-4">
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search super agent transactions..."
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

                    {/* Super Agent Transactions Table */}
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Super Agent</TableHead>
                            <TableHead>Sub Agents</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Commission</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {superAgentTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">{transaction.id}</TableCell>
                              <TableCell>{transaction.type}</TableCell>
                              <TableCell>{transaction.superAgent}</TableCell>
                              <TableCell>{transaction.subAgents}</TableCell>
                              <TableCell className="font-medium">
                                {formatAmount(transaction.amount)}
                              </TableCell>
                              <TableCell className="text-green-600">
                                {formatAmount(transaction.commission)}
                              </TableCell>
                              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                              <TableCell>{formatDate(transaction.date)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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

export default TransactionsPage 