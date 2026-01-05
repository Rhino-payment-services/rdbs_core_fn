"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Shield,
  Ban,
  CheckCircle,
  DollarSign,
  Plus,
  AlertTriangle,
  CreditCard,
  UserX,
  UserCheck,
  Wallet,
  Key
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/axios'

interface CustomerSettingsProps {
  customerId: string
  customerStatus: string
  customerPhone?: string
  walletBalance?: number
  currency?: string
  onActionComplete?: () => void
}

const CustomerSettings = ({ 
  customerId, 
  customerStatus,
  customerPhone = '',
  walletBalance = 0, 
  currency = 'UGX',
  onActionComplete 
}: CustomerSettingsProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [unsuspendDialogOpen, setUnsuspendDialogOpen] = useState(false)
  const [manualTransactionDialogOpen, setManualTransactionDialogOpen] = useState(false)
  const [resetPinDialogOpen, setResetPinDialogOpen] = useState(false)
  const [isResettingPin, setIsResettingPin] = useState(false)
  
  // Suspend form state
  const [suspendForm, setSuspendForm] = useState({
    reason: '',
    duration: '',
    blockMoney: false,
    amount: '' // Add amount field
  })
  
  // Manual transaction form state
  const [transactionForm, setTransactionForm] = useState({
    type: 'CREDIT',
    amount: '',
    description: '',
    reference: ''
  })

  const handleSuspend = async () => {
    if (!suspendForm.reason) {
      toast.error('Please provide a suspension reason')
      return
    }

    if (!suspendForm.amount) {
      toast.error('Please specify the amount to suspend')
      return
    }

    setIsLoading(true)
    try {
      // API call to suspend user
      const response = await fetch(`/api/users/${customerId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: suspendForm.reason,
          duration: suspendForm.duration,
          blockMoney: suspendForm.blockMoney,
          amount: parseFloat(suspendForm.amount) // Include amount in API call
        })
      })

      if (response.ok) {
        toast.success(`User suspended with ${suspendForm.amount} ${currency} blocked`)
        setSuspendDialogOpen(false)
        setSuspendForm({ reason: '', duration: '', blockMoney: false, amount: '' })
        onActionComplete?.()
      } else {
        throw new Error('Failed to suspend user')
      }
    } catch (error) {
      toast.error('Failed to suspend user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsuspend = async () => {
    setIsLoading(true)
    try {
      // API call to unsuspend user
      const response = await fetch(`/api/users/${customerId}/unsuspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        toast.success('User unsuspended successfully')
        setUnsuspendDialogOpen(false)
        onActionComplete?.()
      } else {
        throw new Error('Failed to unsuspend user')
      }
    } catch (error) {
      toast.error('Failed to unsuspend user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualTransaction = async () => {
    if (!transactionForm.amount || !transactionForm.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      // API call to create manual transaction
      const response = await fetch(`/api/transactions/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: customerId,
          type: transactionForm.type,
          amount: parseFloat(transactionForm.amount),
          description: transactionForm.description,
          reference: transactionForm.reference || `MANUAL_${Date.now()}`
        })
      })

      if (response.ok) {
        toast.success('Manual transaction created successfully')
        setManualTransactionDialogOpen(false)
        setTransactionForm({ type: 'CREDIT', amount: '', description: '', reference: '' })
        onActionComplete?.()
      } else {
        throw new Error('Failed to create manual transaction')
      }
    } catch (error) {
      toast.error('Failed to create manual transaction')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPin = async () => {
    if (!customerPhone) {
      toast.error('Customer phone number not found. Cannot reset PIN.')
      return
    }

    setIsResettingPin(true)
    try {
      const response = await api.post('/auth/reset-pin-by-phone', { phone: customerPhone })
      const data = response.data

      if (data?.success) {
        toast.success(data?.message || 'PIN has been reset successfully. A temporary PIN has been sent to the customer\'s phone number.')
        setResetPinDialogOpen(false)
        onActionComplete?.()
      } else {
        throw new Error(data?.message || 'Failed to reset PIN')
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to reset PIN. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsResettingPin(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Status
          </CardTitle>
          <CardDescription>
            Current account status and management actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${customerStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="text-sm font-medium">Account Status</div>
                  <div className="text-sm text-gray-600 capitalize">{customerStatus.toLowerCase()}</div>
                </div>
              </div>
              <div className="flex gap-2">
                {customerStatus === 'ACTIVE' ? (
                  <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        Suspend Money
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Suspend User Account</DialogTitle>
                        <DialogDescription>
                          Suspend this user's account and optionally block their money
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reason">Suspension Reason *</Label>
                          <Textarea
                            id="reason"
                            placeholder="Enter reason for suspension..."
                            value={suspendForm.reason}
                            onChange={(e) => setSuspendForm({...suspendForm, reason: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount to Suspend *</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder={`Enter amount in ${currency}`}
                            value={suspendForm.amount}
                            onChange={(e) => setSuspendForm({...suspendForm, amount: e.target.value})}
                          />
                          <p className="text-xs text-gray-500">
                            This amount will be blocked from the user's wallet
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration</Label>
                          <Select value={suspendForm.duration} onValueChange={(value) => setSuspendForm({...suspendForm, duration: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1d">1 Day</SelectItem>
                              <SelectItem value="7d">7 Days</SelectItem>
                              <SelectItem value="30d">30 Days</SelectItem>
                              <SelectItem value="indefinite">Indefinite</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="blockMoney"
                            checked={suspendForm.blockMoney}
                            onChange={(e) => setSuspendForm({...suspendForm, blockMoney: e.target.checked})}
                          />
                          <Label htmlFor="blockMoney">Block all money transactions</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleSuspend} disabled={isLoading}>
                          {isLoading ? 'Suspending...' : 'Suspend User'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Dialog open={unsuspendDialogOpen} onOpenChange={setUnsuspendDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" size="sm" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Unsuspend
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Unsuspend User Account</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to unsuspend this user's account?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setUnsuspendDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUnsuspend} disabled={isLoading}>
                          {isLoading ? 'Unsuspending...' : 'Unsuspend User'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Management
          </CardTitle>
          <CardDescription>
            Current wallet balance and manual transaction management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Current Balance</div>
                  <div className="text-sm text-gray-600">{walletBalance.toLocaleString()} {currency}</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Plus className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Manual Transaction</div>
                  <div className="text-sm text-gray-600">Create manual credit/debit transaction</div>
                </div>
              </div>
              <Dialog open={manualTransactionDialogOpen} onOpenChange={setManualTransactionDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Create Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Manual Transaction</DialogTitle>
                    <DialogDescription>
                      Create a manual transaction to credit or debit the user's account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="type">Transaction Type *</Label>
                      <Select value={transactionForm.type} onValueChange={(value) => setTransactionForm({...transactionForm, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CREDIT">Credit (Add Money)</SelectItem>
                          <SelectItem value="DEBIT">Debit (Remove Money)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm({...transactionForm, amount: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter transaction description..."
                        value={transactionForm.description}
                        onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reference">Reference (Optional)</Label>
                      <Input
                        id="reference"
                        placeholder="Enter reference number"
                        value={transactionForm.reference}
                        onChange={(e) => setTransactionForm({...transactionForm, reference: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setManualTransactionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleManualTransaction} disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create Transaction'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Actions
          </CardTitle>
          <CardDescription>
            Security-related actions for this customer account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium">Reset Customer PIN</div>
                  <div className="text-sm text-gray-600">
                    Reset the customer's PIN and send a temporary PIN via SMS
                  </div>
                  {customerPhone && (
                    <div className="text-xs text-gray-500 mt-1">
                      Phone: {customerPhone}
                    </div>
                  )}
                </div>
              </div>
              <Dialog open={resetPinDialogOpen} onOpenChange={setResetPinDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2"
                    disabled={!customerPhone}
                  >
                    <Key className="h-4 w-4" />
                    Reset PIN
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Customer PIN</DialogTitle>
                    <DialogDescription>
                      This will reset the customer's PIN and send a temporary 5-digit PIN to their phone number via SMS.
                      The customer should change this PIN after logging in.
                    </DialogDescription>
                  </DialogHeader>
                  {customerPhone ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm font-medium text-blue-900 mb-1">Customer Phone Number</div>
                        <div className="text-sm text-blue-700">{customerPhone}</div>
                      </div>
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-sm font-medium text-yellow-900 mb-1">⚠️ Important</div>
                        <div className="text-sm text-yellow-700">
                          A temporary 5-digit PIN will be sent to this phone number. The customer must change it after login.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm font-medium text-red-900">Phone Number Not Found</div>
                      <div className="text-sm text-red-700 mt-1">
                        Cannot reset PIN without a phone number for this customer.
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setResetPinDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleResetPin} 
                      disabled={isResettingPin || !customerPhone}
                      className="flex items-center gap-2"
                    >
                      {isResettingPin ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Resetting PIN...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4" />
                          Reset PIN & Send SMS
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Emergency actions for account management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Block Account
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Verify Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CustomerSettings 