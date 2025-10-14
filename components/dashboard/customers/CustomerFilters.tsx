"use client"
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X, Download, Plus, FileText, FileSpreadsheet, File } from 'lucide-react'

interface CustomerFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
  sortBy: string
  onSortByChange: (value: string) => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (value: 'asc' | 'desc') => void
  showFilters: boolean
  onToggleFilters: () => void
  onClearFilters: () => void
  onExport: (format: 'csv' | 'excel' | 'pdf') => void
  onCreateNew: () => void
  selectedCount: number
  totalCount: number
  showAdvancedFilters?: boolean
  onToggleAdvancedFilters?: () => void
  isProcessing?: boolean
}

export const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  showFilters,
  onToggleFilters,
  onClearFilters,
  onExport,
  onCreateNew,
  selectedCount,
  totalCount,
  showAdvancedFilters = false,
  onToggleAdvancedFilters,
  isProcessing = false
}) => {
  const activeFiltersCount = [
    searchTerm,
    statusFilter !== 'all',
    typeFilter !== 'all',
    sortBy !== 'name'
  ].filter(Boolean).length

  return (
    <div className="space-y-4 mb-6">
      {/* Main Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={onToggleFilters}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Select
              onValueChange={(value) => onExport(value as 'csv' | 'excel' | 'pdf')}
              disabled={isProcessing}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CSV
                </SelectItem>
                <SelectItem value="excel" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </SelectItem>
                <SelectItem value="pdf" className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  PDF
                </SelectItem>
              </SelectContent>
            </Select>
            {isProcessing && (
              <div className="absolute -top-1 -right-1">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          {onToggleAdvancedFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAdvancedFilters}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showAdvancedFilters ? 'Hide' : 'Advanced'} Filters
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="subscriber">Subscriber</SelectItem>
                    <SelectItem value="merchant">Merchant</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={onSortByChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="createdAt">Created Date</SelectItem>
                    <SelectItem value="lastLogin">Last Login</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="transactionCount">Transaction Count</SelectItem>
                    <SelectItem value="totalSpent">Total Spent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Order</label>
                <Select value={sortOrder} onValueChange={onSortOrderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Verification Status</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="All verifications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Verifications</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending Verification</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-medium mb-4">Advanced Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Country</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="All countries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        <SelectItem value="ug">Uganda</SelectItem>
                        <SelectItem value="ke">Kenya</SelectItem>
                        <SelectItem value="tz">Tanzania</SelectItem>
                        <SelectItem value="rw">Rwanda</SelectItem>
                        <SelectItem value="ss">South Sudan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Region</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="All regions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        <SelectItem value="central">Central</SelectItem>
                        <SelectItem value="eastern">Eastern</SelectItem>
                        <SelectItem value="northern">Northern</SelectItem>
                        <SelectItem value="western">Western</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Transaction Volume</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="All volumes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Volumes</SelectItem>
                        <SelectItem value="high">High (&gt; UGX 1M)</SelectItem>
                        <SelectItem value="medium">Medium (UGX 100K - 1M)</SelectItem>
                        <SelectItem value="low">Low (&lt; UGX 100K)</SelectItem>
                        <SelectItem value="zero">No Transactions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Activity Level</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue placeholder="All activity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activity</SelectItem>
                        <SelectItem value="active">Active (Daily)</SelectItem>
                        <SelectItem value="regular">Regular (Weekly)</SelectItem>
                        <SelectItem value="occasional">Occasional (Monthly)</SelectItem>
                        <SelectItem value="inactive">Inactive (&gt;30 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedCount > 0 ? `${selectedCount} of ` : ''}{totalCount} customers
                </span>
                {activeFiltersCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}