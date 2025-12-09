"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Download, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ExportDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  exportStartDate: string
  exportEndDate: string
  isExporting: boolean
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onExport: (startDate: string, endDate: string) => Promise<void>
}

export const ExportDialog = ({
  isOpen,
  onOpenChange,
  exportStartDate,
  exportEndDate,
  isExporting,
  onStartDateChange,
  onEndDateChange,
  onExport
}: ExportDialogProps) => {
  const handleExport = async () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error('Please select both start and end dates')
      return
    }
    if (new Date(exportStartDate) > new Date(exportEndDate)) {
      toast.error('Start date must be before end date')
      return
    }
    await onExport(exportStartDate, exportEndDate)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onStartDateChange("")
    onEndDateChange("")
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Export Transactions by Date Range
          </DialogTitle>
          <DialogDescription>
            Select a date range to export transactions. The export will include all transactions within the selected dates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="export-start-date">Start Date</Label>
            <Input
              id="export-start-date"
              type="date"
              value={exportStartDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              max={exportEndDate || undefined}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="export-end-date">End Date</Label>
            <Input
              id="export-end-date"
              type="date"
              value={exportEndDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={exportStartDate || undefined}
            />
          </div>
          
          {exportStartDate && exportEndDate && new Date(exportStartDate) > new Date(exportEndDate) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Start date must be before end date
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !exportStartDate || !exportEndDate}
            className="bg-[#08163d] hover:bg-[#0a1f4f]"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Transactions
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

