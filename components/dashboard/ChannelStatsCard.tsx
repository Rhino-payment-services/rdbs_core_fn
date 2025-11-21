"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  Store, 
  Phone, 
  Globe, 
  Code, 
  Wallet,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { useChannelStatistics, useDailyNewWallets } from '@/lib/hooks/useTransactions'

interface ChannelStatsCardProps {
  startDate?: string
  endDate?: string
}

const ChannelStatsCard: React.FC<ChannelStatsCardProps> = ({ 
  startDate, 
  endDate 
}) => {
  const { data: channelStats, isLoading: channelsLoading } = useChannelStatistics(startDate, endDate)
  const { data: walletStats, isLoading: walletsLoading } = useDailyNewWallets()

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, React.ReactNode> = {
      APP: <Smartphone className="h-5 w-5" />,
      MERCHANT_PORTAL: <Store className="h-5 w-5" />,
      USSD: <Phone className="h-5 w-5" />,
      WEB: <Globe className="h-5 w-5" />,
      API: <Code className="h-5 w-5" />,
      OTHER: <Globe className="h-5 w-5" />,
    }
    return icons[channel] || <Globe className="h-5 w-5" />
  }

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      APP: 'bg-blue-100 text-blue-700 border-blue-200',
      MERCHANT_PORTAL: 'bg-purple-100 text-purple-700 border-purple-200',
      USSD: 'bg-green-100 text-green-700 border-green-200',
      WEB: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      API: 'bg-gray-100 text-gray-700 border-gray-200',
      OTHER: 'bg-slate-100 text-slate-700 border-slate-200',
    }
    return colors[channel] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  if (channelsLoading || walletsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Channel Statistics & New Wallets
          </CardTitle>
          <CardDescription>Transaction activity by channel and daily wallet creation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const channels = channelStats?.data?.channels || []
  const newWallets = walletStats?.data?.newWalletsCount || 0
  const totalTransactions = channelStats?.data?.total?.transactionCount || 0
  const totalValue = channelStats?.data?.total?.totalValue || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Channel Statistics & New Wallets
        </CardTitle>
        <CardDescription>
          Transaction activity by channel and daily wallet creation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily New Wallets */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">New Wallets Today</p>
              <p className="text-2xl font-bold text-gray-900">{newWallets}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-white">
            Daily
          </Badge>
        </div>

        {/* Channel Statistics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Transactions by Channel</h3>
            <div className="text-xs text-gray-500">
              Total: {totalTransactions} ({formatAmount(totalValue)})
            </div>
          </div>

          {channels.length > 0 ? (
            <div className="space-y-2">
              {channels
                .filter((ch: any) => ch.transactionCount > 0) // Only show channels with transactions
                .map((channel: any) => (
                  <div
                    key={channel.channel}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getChannelColor(channel.channel)}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-1.5 bg-white/50 rounded">
                        {getChannelIcon(channel.channel)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{channel.label}</p>
                        <p className="text-xs opacity-75">
                          {channel.transactionCount} transactions
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-bold">{formatAmount(channel.totalValue)}</p>
                      <p className="text-xs opacity-75">
                        Avg: {formatAmount(channel.averageValue)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">
              No transaction data available for the selected period
            </div>
          )}
        </div>

        {/* Summary */}
        {channels.length > 0 && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Transactions</p>
                <p className="text-lg font-bold text-gray-900">{totalTransactions}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Value</p>
                <p className="text-lg font-bold text-gray-900">{formatAmount(totalValue)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ChannelStatsCard

