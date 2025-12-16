import { Search, Filter, Download, FileText, FileSpreadsheet, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TransactionFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  onResetFilters: () => void
  isExporting: boolean
  onExportCurrentPage: () => void
  onExportAll: () => void
  onExportByDateRange: () => void
  transactionsCount: number
}

export const TransactionFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  pageSize,
  onPageSizeChange,
  onResetFilters,
  isExporting,
  onExportCurrentPage,
  onExportAll,
  onExportByDateRange,
  transactionsCount
}: TransactionFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by ID, sender name, or receiver name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Select value={statusFilter || "all"} onValueChange={(value) => {
        onStatusFilterChange(value === "all" ? "" : value)
      }}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="SUCCESS">Completed</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="FAILED">Failed</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Select value={typeFilter || "all"} onValueChange={(value) => {
        onTypeFilterChange(value === "all" ? "" : value)
      }}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="WALLET_TO_WALLET">P2P Transfer</SelectItem>
          <SelectItem value="WALLET_TO_MNO">Mobile Money</SelectItem>
          <SelectItem value="WALLET_TO_BANK">Bank Transfer</SelectItem>
          <SelectItem value="WALLET_TO_UTILITY">Utility Payment</SelectItem>
          <SelectItem value="BILL_PAYMENT">Bill Payment</SelectItem>
          <SelectItem value="DEPOSIT">Deposit</SelectItem>
          <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
        </SelectContent>
      </Select>

      <Select value={pageSize.toString()} onValueChange={(value) => {
        onPageSizeChange(Number(value))
      }}>
        <SelectTrigger className="w-full sm:w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onResetFilters}>
        <Filter className="h-4 w-4 mr-2" />
        Reset
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={onExportCurrentPage}
            disabled={isExporting || transactionsCount === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export Current Page ({transactionsCount} transactions)
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onExportAll}
            disabled={isExporting}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export All Transactions
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onExportByDateRange}
            disabled={isExporting}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Export by Date Range
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
