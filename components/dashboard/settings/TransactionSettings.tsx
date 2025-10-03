"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Save as SaveIcon } from 'lucide-react'

interface TransactionSettingsProps {
  settings: {
    dailyLimit: number
    monthlyLimit: number
    maxTransactionAmount: number
    minTransactionAmount: number
    transactionTimeout: number
    autoApprovalLimit: number
    requireApproval: boolean
    approvalThreshold: number
    feePercentage: number
    fixedFee: number
    refundPolicy: string
    chargebackPolicy: string
  }
  onSettingsChange: (settings: any) => void
  onSave: () => void
}

export const TransactionSettings: React.FC<TransactionSettingsProps> = ({
  settings,
  onSettingsChange,
  onSave
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Settings</CardTitle>
        <CardDescription>
          Configure transaction limits, fees, and approval workflows
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="dailyLimit">Daily Limit</Label>
            <Input
              id="dailyLimit"
              type="number"
              value={settings.dailyLimit}
              onChange={(e) => onSettingsChange({...settings, dailyLimit: parseInt(e.target.value)})}
            />
            <p className="text-sm text-gray-500">{formatCurrency(settings.dailyLimit)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyLimit">Monthly Limit</Label>
            <Input
              id="monthlyLimit"
              type="number"
              value={settings.monthlyLimit}
              onChange={(e) => onSettingsChange({...settings, monthlyLimit: parseInt(e.target.value)})}
            />
            <p className="text-sm text-gray-500">{formatCurrency(settings.monthlyLimit)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxTransactionAmount">Max Transaction Amount</Label>
            <Input
              id="maxTransactionAmount"
              type="number"
              value={settings.maxTransactionAmount}
              onChange={(e) => onSettingsChange({...settings, maxTransactionAmount: parseInt(e.target.value)})}
            />
            <p className="text-sm text-gray-500">{formatCurrency(settings.maxTransactionAmount)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="minTransactionAmount">Min Transaction Amount</Label>
            <Input
              id="minTransactionAmount"
              type="number"
              value={settings.minTransactionAmount}
              onChange={(e) => onSettingsChange({...settings, minTransactionAmount: parseInt(e.target.value)})}
            />
            <p className="text-sm text-gray-500">{formatCurrency(settings.minTransactionAmount)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feePercentage">Fee Percentage (%)</Label>
            <Input
              id="feePercentage"
              type="number"
              step="0.1"
              value={settings.feePercentage}
              onChange={(e) => onSettingsChange({...settings, feePercentage: parseFloat(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fixedFee">Fixed Fee</Label>
            <Input
              id="fixedFee"
              type="number"
              value={settings.fixedFee}
              onChange={(e) => onSettingsChange({...settings, fixedFee: parseInt(e.target.value)})}
            />
            <p className="text-sm text-gray-500">{formatCurrency(settings.fixedFee)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Approval Workflow</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireApproval">Require Approval</Label>
                <p className="text-sm text-gray-500">Enable manual approval for transactions</p>
              </div>
              <Switch
                id="requireApproval"
                checked={settings.requireApproval}
                onCheckedChange={(checked) => onSettingsChange({...settings, requireApproval: checked})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approvalThreshold">Approval Threshold</Label>
              <Input
                id="approvalThreshold"
                type="number"
                value={settings.approvalThreshold}
                onChange={(e) => onSettingsChange({...settings, approvalThreshold: parseInt(e.target.value)})}
              />
              <p className="text-sm text-gray-500">{formatCurrency(settings.approvalThreshold)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onSave} className="flex items-center gap-2">
            <SaveIcon className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
