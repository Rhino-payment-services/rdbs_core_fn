import { formatAmount } from '@/lib/utils/transactions'

interface PageStats {
    totalCount: number
    totalVolume: number
    rukapayFees: number
    partnerFees: number
    governmentTaxes: number
  totalFees: number
    successfulCount: number
  }

interface PageStatsProps {
  stats: PageStats
}

export const PageStats = ({ stats }: PageStatsProps) => {
  if (stats.totalCount === 0) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h4 className="text-blue-800 font-semibold mb-3">Current Page Fee Breakdown</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
        <div>
          <p className="text-blue-600 font-medium">Transactions</p>
          <p className="text-blue-900 font-bold">{stats.totalCount}</p>
        </div>
        <div>
          <p className="text-blue-600 font-medium">Volume</p>
          <p className="text-blue-900 font-bold">{formatAmount(stats.totalVolume)}</p>
        </div>
        <div>
          <p className="text-blue-600 font-medium">RukaPay Fees</p>
          <p className="text-blue-900 font-bold">{formatAmount(stats.rukapayFees)}</p>
        </div>
        <div>
          <p className="text-orange-600 font-medium">Partner Fees</p>
          <p className="text-orange-900 font-bold">{formatAmount(stats.partnerFees)}</p>
        </div>
        <div>
          <p className="text-red-600 font-medium">Gov Taxes</p>
          <p className="text-red-900 font-bold">{formatAmount(stats.governmentTaxes)}</p>
        </div>
        <div>
          <p className="text-green-600 font-medium">Success Rate</p>
          <p className="text-green-900 font-bold">
            {stats.totalCount > 0 ? ((stats.successfulCount / stats.totalCount) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex justify-between text-sm">
          <span className="text-blue-600 font-medium">Total Fees:</span>
          <span className="text-blue-900 font-bold">{formatAmount(stats.totalFees)}</span>
        </div>
      </div>
    </div>
  )
}
