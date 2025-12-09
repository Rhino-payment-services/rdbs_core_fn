import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onClear: () => void
}

export const DateRangeFilter = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear
}: DateRangeFilterProps) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Date Range:</span>
      </div>
      <div className="flex items-center space-x-2">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-[140px]"
          placeholder="Start Date"
        />
        <span className="text-gray-400">to</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-[140px]"
          placeholder="End Date"
        />
      </div>
      {(startDate || endDate) && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="text-gray-500 hover:text-gray-700"
        >
          Clear
        </Button>
      )}
    </div>
  )
}
