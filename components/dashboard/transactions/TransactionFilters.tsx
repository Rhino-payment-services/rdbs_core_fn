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
  channelFilter: string
  onChannelFilterChange: (value: string) => void
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
  channelFilter,
  onChannelFilterChange,
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
          <SelectItem value="DEPOSIT">Deposit</SelectItem>
          <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
          <SelectItem value="WALLET_TO_WALLET">P2P Transfer</SelectItem>
          <SelectItem value="MNO_TO_WALLET">Mobile Money → Wallet</SelectItem>
          <SelectItem value="WALLET_TO_MNO">Wallet → Mobile Money</SelectItem>
          <SelectItem value="BANK_TO_WALLET">Bank → Wallet</SelectItem>
          <SelectItem value="WALLET_TO_BANK">Wallet → Bank</SelectItem>
          <SelectItem value="CARD_TO_WALLET">Card → Wallet</SelectItem>
          <SelectItem value="WALLET_TO_UTILITY">Utility Payment</SelectItem>
          <SelectItem value="BILL_PAYMENT">Bill Payment</SelectItem>
          <SelectItem value="SCHOOL_FEES">School Fees</SelectItem>
          <SelectItem value="WALLET_TO_MERCHANT">Merchant</SelectItem>
          <SelectItem value="WALLET_TO_INTERNAL_MERCHANT">Internal Merchant</SelectItem>
          <SelectItem value="WALLET_TO_EXTERNAL_MERCHANT">External Merchant</SelectItem>
          <SelectItem value="MERCHANT_TO_WALLET">Merchant → Wallet</SelectItem>
          <SelectItem value="MERCHANT_WITHDRAWAL">Merchant Withdrawal</SelectItem>
          <SelectItem value="REVERSAL">Reversal</SelectItem>
          <SelectItem value="FEE_CHARGE">Fee Charge</SelectItem>
          <SelectItem value="WALLET_CREATION">Wallet Creation</SelectItem>
          <SelectItem value="WALLET_INIT">Wallet Init</SelectItem>
          <SelectItem value="CUSTOM">Custom</SelectItem>
        </SelectContent>
      </Select>

      <Select value={channelFilter || "all"} onValueChange={(value) => {
        onChannelFilterChange(value === "all" ? "" : value)
      }}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Channel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Channels</SelectItem>
          <SelectItem value="USSD">USSD</SelectItem>
          <SelectItem value="APP">Mobile App</SelectItem>
          <SelectItem value="BACKOFFICE">Admin Portal</SelectItem>
          <SelectItem value="MERCHANT_PORTAL">Merchant Portal</SelectItem>
          <SelectItem value="AGENT_PORTAL">Agent Portal</SelectItem>
          <SelectItem value="PARTNER_PORTAL">Partner Portal</SelectItem>
          <SelectItem value="API">API</SelectItem>
          <SelectItem value="SHULE">RukaPay Shule</SelectItem>
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
