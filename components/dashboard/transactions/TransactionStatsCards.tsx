import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, DollarSign, TrendingUp, Activity } from 'lucide-react'
import { formatAmount } from '@/lib/utils/transactions'

interface TransactionStats {
  totalTransactions: number
  totalVolume: number
  rukapayRevenue: number
  partnerFees: number
  successRate: number
  averageTransactionAmount: number
}

interface TransactionStatsCardsProps {
  stats: TransactionStats
  isLoading: boolean
}

export const TransactionStatsCards = ({ stats, isLoading }: TransactionStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 mb-4">
      <Card className="bg-white border-gray-200">
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between mb-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-0">
                Total Transactions
              </p>
              <p className="text-xl font-bold text-gray-900 leading-tight">
                {isLoading ? '...' : stats.totalTransactions.toLocaleString()}
              </p>
            </div>
            <div className="w-8 h-8 flex items-center justify-center ml-2">
              <CreditCard className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <div className="mt-0">
            <span className="text-sm text-green-600 font-medium">
              {stats.successRate.toFixed(1)}%
            </span>
            <span className="text-sm ml-1 text-gray-500">
              success rate
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between mb-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-0">
                Total Volume
              </p>
              <p className="text-xl font-bold text-gray-900 leading-tight">
                {isLoading ? '...' : `UGX ${(stats.totalVolume / 1000000).toFixed(1)}M`}
              </p>
            </div>
            <div className="w-8 h-8 flex items-center justify-center ml-2">
              <DollarSign className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <div className="mt-0">
            <span className="text-sm text-green-600 font-medium">
              UGX {stats.averageTransactionAmount.toFixed(0)}
            </span>
            <span className="text-sm ml-1 text-gray-500">
              avg transaction
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between mb-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-0">
                RukaPay Gross Revenue
              </p>
              <p className="text-xl font-bold text-gray-900 leading-tight">
                {isLoading ? '...' : formatAmount(stats.rukapayRevenue || 0)}
              </p>
            </div>
            <div className="w-8 h-8 flex items-center justify-center ml-2">
              <TrendingUp className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <div className="mt-0">
            <span className="text-sm text-blue-600 font-medium">
              RukaPay fees
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardContent className="px-4 py-1">
          <div className="flex items-center justify-between mb-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-0">
                Partner Fees
              </p>
              <p className="text-xl font-bold text-gray-900 leading-tight">
                {isLoading ? '...' : formatAmount(stats.partnerFees || 0)}
              </p>
            </div>
            <div className="w-8 h-8 flex items-center justify-center ml-2">
              <Activity className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <div className="mt-0">
            <span className="text-sm text-orange-600 font-medium">
              Third-party fees
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

