import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Loader2, Smartphone, Phone, Code, Building2, Store, Users } from 'lucide-react'
import { formatAmount } from '@/lib/utils/transactions'

interface ChannelData {
  channel: string
  label: string
  transactionCount: number
  totalValue: number
  averageValue: number
}

interface ChannelStatisticsProps {
  channelStatsData: any
  isLoading: boolean
  startDate?: string
  endDate?: string
}

export const ChannelStatistics = ({ channelStatsData, isLoading, startDate, endDate }: ChannelStatisticsProps) => {
  // Define all possible channels with default values
  const allChannels = [
    { channel: 'APP', label: 'Mobile App', icon: Smartphone, color: 'border-blue-200 bg-blue-50' },
    { channel: 'USSD', label: 'USSD', icon: Phone, color: 'border-green-200 bg-green-50' },
    { channel: 'API', label: 'API', icon: Code, color: 'border-gray-200 bg-gray-50' },
    { channel: 'BACKOFFICE', label: 'Back Office', icon: Building2, color: 'border-indigo-200 bg-indigo-50' },
    { channel: 'MERCHANT_PORTAL', label: 'Merchant Portal', icon: Store, color: 'border-orange-200 bg-orange-50' },
    { channel: 'AGENT_PORTAL', label: 'Agent Portal', icon: Users, color: 'border-teal-200 bg-teal-50' },
    { channel: 'PARTNER_PORTAL', label: 'Partner Portal', icon: Users, color: 'border-pink-200 bg-pink-50' }
  ]

  // Backend returns channels directly, not wrapped in data property
  const existingChannels = channelStatsData?.channels || channelStatsData?.data?.channels || []

  // Debug logging in development
  if (process.env.NODE_ENV === 'development' && channelStatsData && !isLoading) {
    console.log('📊 Ledger Channel Stats:', {
      hasChannels: !!channelStatsData?.channels,
      hasDataChannels: !!channelStatsData?.data?.channels,
      channelCount: existingChannels.length,
      channels: existingChannels.map((c: any) => ({ channel: c.channel, count: c.transactionCount }))
    })
  }

  // Merge WEB into MERCHANT_PORTAL if WEB exists in the data (for backward compatibility)
  const channelMap = new Map<string, ChannelData>()
  existingChannels.forEach((ch: any) => {
    const channelKey = ch.channel === 'WEB' ? 'MERCHANT_PORTAL' : ch.channel
    if (channelMap.has(channelKey)) {
      const existing = channelMap.get(channelKey)!
      channelMap.set(channelKey, {
        ...existing,
        transactionCount: existing.transactionCount + (ch.transactionCount || 0),
        totalValue: existing.totalValue + (ch.totalValue || 0),
        averageValue: 0 // Will be recalculated
      })
    } else {
      const channelLabel = channelKey === 'MERCHANT_PORTAL' 
        ? 'Merchant Portal' 
        : (ch.label || allChannels.find(c => c.channel === channelKey)?.label || channelKey)
      channelMap.set(channelKey, {
        channel: channelKey,
        label: channelLabel,
        transactionCount: ch.transactionCount || 0,
        totalValue: ch.totalValue || 0,
        averageValue: ch.averageValue || 0
      })
    }
  })

  // Recalculate average for merged channels
  channelMap.forEach((ch) => {
    if (ch.transactionCount > 0) {
      ch.averageValue = ch.totalValue / ch.transactionCount
    }
  })

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Transactions by Channel</h3>
        {/* Date Range Indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>
            {startDate || endDate 
              ? `${startDate || 'Beginning'} - ${endDate || 'Today'}`
              : 'All-time (Cumulative)'
            }
          </span>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-gray-200 bg-white">
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {allChannels.map((defaultChannel) => {
            const existingData = channelMap.get(defaultChannel.channel)
            const channelData: ChannelData = existingData || {
              channel: defaultChannel.channel,
              label: defaultChannel.label,
              transactionCount: 0,
              totalValue: 0,
              averageValue: 0
            }
            // Recalculate average if we have data
            if (channelData.transactionCount > 0 && channelData.averageValue === 0) {
              channelData.averageValue = channelData.totalValue / channelData.transactionCount
            }
            const ChannelIcon = defaultChannel.icon

            return (
              <Card key={defaultChannel.channel} className={`${defaultChannel.color} border`}>
                <CardContent className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white rounded">
                        <ChannelIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {channelData.label || defaultChannel.label}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <p className="text-xs text-gray-500">Transactions</p>
                      <p className="text-lg font-bold text-gray-900">
                        {isLoading ? '...' : (channelData.transactionCount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Value</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {isLoading ? '...' : formatAmount(channelData.totalValue || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Average</p>
                      <p className="text-xs font-medium text-gray-600">
                        Avg: {isLoading ? '...' : formatAmount(channelData.averageValue || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

