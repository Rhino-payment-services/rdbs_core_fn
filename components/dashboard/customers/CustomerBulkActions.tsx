"use client"
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  UserCheck, 
  UserX, 
  Mail, 
  Download, 
  Trash2, 
  Shield,
  X,
  CheckCircle
} from 'lucide-react'

interface CustomerBulkActionsProps {
  selectedCount: number
  onClearSelection: () => void
  onBulkStatusChange: (status: string) => void
  onBulkEmail: () => void
  onBulkExport: () => void
  onBulkDelete: () => void
  onBulkVerify: () => void
  isProcessing: boolean
}

export const CustomerBulkActions: React.FC<CustomerBulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  onBulkStatusChange,
  onBulkEmail,
  onBulkExport,
  onBulkDelete,
  onBulkVerify,
  isProcessing
}) => {
  if (selectedCount === 0) return null

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedCount} customer{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-blue-700 hover:text-blue-800"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select onValueChange={onBulkStatusChange} disabled={isProcessing}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-red-600" />
                    Inactive
                  </div>
                </SelectItem>
                <SelectItem value="verified">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    Verified
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <UserX className="h-4 w-4 text-yellow-600" />
                    Pending
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={onBulkEmail}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onBulkExport}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onBulkVerify}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Verify
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {isProcessing && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Processing bulk action...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
