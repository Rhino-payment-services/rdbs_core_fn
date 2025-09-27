"use client"
import React, { useState } from 'react'
import Navbar from '@/components/dashboard/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Download, 
  Calculator,
  DollarSign,
  TrendingUp,
  PieChart,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowLeftRight
} from 'lucide-react'
import { useTariffs, useUpdateTariff, useDeleteTariff, useCalculateEnhancedFee, TRANSACTION_TYPES, FEE_TYPES, USER_TYPES, SUBSCRIBER_TYPES, CURRENCIES, CreateTariffRequest } from '@/lib/hooks/useTariffs'
import { useTransactionSystemStats } from '@/lib/hooks/useTransactions'
import FeeBreakdownChart from '@/components/finance/FeeBreakdownChart'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const FinancePage = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("tariffs")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [editingTariff, setEditingTariff] = useState<any>(null)
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    transactionType: 'all', // Use 'all' for filters to show all types
    feeType: 'all', // Use 'all' for filters to show all types
    isActive: true,
    page: 1,
    limit: 20
  })

  // Form states
  const [tariffForm, setTariffForm] = useState<CreateTariffRequest>({
    name: '',
    description: '',
    transactionType: 'WALLET_TO_WALLET', // Default to first valid transaction type
    currency: 'UGX',
    feeType: 'FIXED',
    feeAmount: 0,
    feePercentage: 0,
    minFee: 0,
    maxFee: 0,
    minAmount: 0,
    maxAmount: 0,
    userType: 'SUBSCRIBER', // Default to first valid user type
    subscriberType: '',
    isActive: true
  })

  const [calculatorForm, setCalculatorForm] = useState({
    transactionType: 'WALLET_TO_WALLET', // Default to first valid transaction type
    amount: 0,
    currency: 'UGX',
    userType: 'SUBSCRIBER',
    subscriberType: ''
  })

  // API hooks
  const { data: tariffsData, isLoading: tariffsLoading, error: tariffsError } = useTariffs(filters)
  const { data: systemStats, isLoading: statsLoading } = useTransactionSystemStats()
  const updateTariffMutation = useUpdateTariff()
  const deleteTariffMutation = useDeleteTariff()
  const calculateFeeMutation = useCalculateEnhancedFee()

  const tariffs = tariffsData?.data?.data || []
  const totalTariffs = tariffsData?.data?.pagination?.total || 0

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Handle form submissions
  const handleUpdateTariff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTariff) return
    
    try {
      await updateTariffMutation.mutateAsync({
        id: editingTariff.id,
        data: tariffForm
      })
      toast.success('Tariff updated successfully')
      setIsEditDialogOpen(false)
      setEditingTariff(null)
      resetForm()
    } catch (error) {
      toast.error('Failed to update tariff')
    }
  }

  const handleDeleteTariff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the tariff "${name}"?`)) return
    
    try {
      await deleteTariffMutation.mutateAsync(id)
      toast.success('Tariff deleted successfully')
    } catch (error) {
      toast.error('Failed to delete tariff')
    }
  }

  const handleCalculateFee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await calculateFeeMutation.mutateAsync(calculatorForm)
      toast.success(`Fee calculated: ${formatAmount(result.data.totalFee)}`)
    } catch (error) {
      toast.error('Failed to calculate fee')
    }
  }

  const resetForm = () => {
    setTariffForm({
      name: '',
      description: '',
      transactionType: 'WALLET_TO_WALLET', // Default to first valid transaction type
      currency: 'UGX',
      feeType: 'FIXED',
      feeAmount: 0,
      feePercentage: 0,
      minFee: 0,
      maxFee: 0,
      minAmount: 0,
      maxAmount: 0,
      userType: 'SUBSCRIBER', // Default to first valid user type
      subscriberType: '',
      isActive: true
    })
  }

  const openEditDialog = (tariff: any) => {
    setEditingTariff(tariff)
    setTariffForm({
      name: tariff.name,
      description: tariff.description || '',
      transactionType: tariff.transactionType,
      currency: tariff.currency,
      feeType: tariff.feeType,
      feeAmount: tariff.feeAmount,
      feePercentage: tariff.feePercentage || 0,
      minFee: tariff.minFee || 0,
      maxFee: tariff.maxFee || 0,
      minAmount: tariff.minAmount || 0,
      maxAmount: tariff.maxAmount || 0,
      userType: tariff.userType || '',
      subscriberType: tariff.subscriberType || '',
      isActive: tariff.isActive
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Operations</h1>
              <p className="mt-2 text-gray-600">Manage tariffs, fees, and financial configurations</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setIsCalculatorOpen(true)}
                className="flex items-center space-x-2"
              >
                <Calculator className="h-4 w-4" />
                <span>Fee Calculator</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mb-4">
            <Card className="bg-white border-gray-200">
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-0">
                      Active Tariffs
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {tariffsLoading ? '...' : totalTariffs}
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="mt-0">
                  <span className="text-sm text-blue-600 font-medium">
                    Configured
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-0">
                      Total Fees
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {statsLoading ? '...' : formatAmount(systemStats?.data?.totalFees || 0)}
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="mt-0">
                  <span className="text-sm text-green-600 font-medium">
                    All fees
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-0">
                      Success Rate
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {statsLoading ? '...' : `${(systemStats?.data?.successRate || 0).toFixed(1)}%`}
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="mt-0">
                  <span className="text-sm text-purple-600 font-medium">
                    Transaction success
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="px-4 py-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-0">
                      Avg Transaction
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      {statsLoading ? '...' : formatAmount(systemStats?.data?.averageTransactionAmount || 0)}
                    </p>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-gray-600" />
                  </div>
                </div>
                <div className="mt-0">
                  <span className="text-sm text-orange-600 font-medium">
                    Per transaction
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Management</CardTitle>
              <CardDescription>Configure and manage financial operations</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="tariffs">Tariffs</TabsTrigger>
                  <TabsTrigger value="fees">Fee Analysis</TabsTrigger>
                  <TabsTrigger value="partners">Partners</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="tariffs" className="mt-6">
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search tariffs..."
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <Select 
                      value={filters.transactionType} 
                      onValueChange={(value) => setFilters({ ...filters, transactionType: value })}
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Transaction Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {TRANSACTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={filters.feeType} 
                      onValueChange={(value) => setFilters({ ...filters, feeType: value })}
                    >
                      <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Fee Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {FEE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  {/* Tariffs Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Transaction Type</TableHead>
                          <TableHead>Fee Type</TableHead>
                          <TableHead>Amount/Rate</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tariffsLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                              <p className="text-gray-500 mt-2">Loading tariffs...</p>
                            </TableCell>
                          </TableRow>
                        ) : tariffs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <p className="text-gray-500">No tariffs found</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          tariffs.map((tariff: any) => (
                            <TableRow key={tariff.id}>
                              <TableCell className="font-medium">{tariff.name}</TableCell>
                              <TableCell>
                                {TRANSACTION_TYPES.find(t => t.value === tariff.transactionType)?.label || tariff.transactionType}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {FEE_TYPES.find(t => t.value === tariff.feeType)?.label || tariff.feeType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {tariff.feeType === 'FIXED' ? (
                                  formatAmount(tariff.feeAmount)
                                ) : tariff.feeType === 'PERCENTAGE' ? (
                                  `${(tariff.feePercentage * 100).toFixed(2)}%`
                                ) : (
                                  `${formatAmount(tariff.feeAmount)} + ${(tariff.feePercentage * 100).toFixed(2)}%`
                                )}
                              </TableCell>
                              <TableCell>{tariff.currency}</TableCell>
                              <TableCell>
                                {tariff.isActive ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                                    Inactive
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => openEditDialog(tariff)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteTariff(tariff.id, tariff.name)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="fees" className="mt-6">
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Fee Analysis Dashboard</h3>
                    <p className="text-gray-500">Detailed fee breakdown and analysis coming soon</p>
                  </div>
                </TabsContent>

          <TabsContent value="partners" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">External Payment Partners</h3>
                  <p className="text-gray-500 mb-4">Manage external payment partners (ABC, Pegasus, etc.)</p>
                  <Button onClick={() => router.push('/dashboard/finance/partners')}>
                    Manage Partners
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <ArrowLeftRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction Mapping</h3>
                  <p className="text-gray-500 mb-4">Configure which partner handles each transaction type</p>
                  <Button onClick={() => router.push('/dashboard/finance/transaction-mapping')}>
                    Manage Mapping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

                <TabsContent value="reports" className="mt-6">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Financial Reports</h3>
                    <p className="text-gray-500">Generate comprehensive financial reports</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>


      {/* Edit Tariff Dialog - Similar structure to Create */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Tariff</DialogTitle>
            <DialogDescription>
              Update tariff configuration
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTariff} className="space-y-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Tariff Name</Label>
                <Input
                  id="edit-name"
                  value={tariffForm.name}
                  onChange={(e) => setTariffForm({ ...tariffForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-transactionType">Transaction Type</Label>
                <Select 
                  value={tariffForm.transactionType} 
                  onValueChange={(value) => setTariffForm({ ...tariffForm, transactionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTariffMutation.isPending}>
                {updateTariffMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Tariff'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fee Calculator Dialog */}
      <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fee Calculator</DialogTitle>
            <DialogDescription>
              Calculate fees for a transaction
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCalculateFee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calc-transactionType">Transaction Type</Label>
                <Select 
                  value={calculatorForm.transactionType} 
                  onValueChange={(value) => setCalculatorForm({ ...calculatorForm, transactionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="calc-amount">Amount</Label>
                <Input
                  id="calc-amount"
                  type="number"
                  value={calculatorForm.amount}
                  onChange={(e) => setCalculatorForm({ ...calculatorForm, amount: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            {calculateFeeMutation.data && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Calculation Result</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Tariff:</strong> {calculateFeeMutation.data.data.tariffName}</p>
                  <p><strong>Fee:</strong> {formatAmount(calculateFeeMutation.data.data.totalFee)}</p>
                  <p><strong>Net Amount:</strong> {formatAmount(calculateFeeMutation.data.data.netAmount)}</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCalculatorOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={calculateFeeMutation.isPending}>
                {calculateFeeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  'Calculate Fee'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FinancePage
