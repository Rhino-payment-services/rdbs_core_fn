import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalTransactions: number
  onPageChange: (page: number) => void
}

export const Pagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalTransactions,
  onPageChange
}: PaginationProps) => {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-500">
        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalTransactions)} of {totalTransactions.toLocaleString()} transactions
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const page = i + Math.max(1, currentPage - 2)
            if (page > totalPages) return null
            
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )
          })}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
