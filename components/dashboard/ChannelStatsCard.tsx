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
      BACKOFFICE: <Store className="h-5 w-5" />,
      AGENT_PORTAL: <Store className="h-5 w-5" />,
      PARTNER_PORTAL: <Store className="h-5 w-5" />,
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
      BACKOFFICE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      AGENT_PORTAL: 'bg-teal-100 text-teal-700 border-teal-200',
      PARTNER_PORTAL: 'bg-pink-100 text-pink-700 border-pink-200',
      OTHER: 'bg-slate-100 text-slate-700 border-slate-200',
    }
    return colors[channel] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  // Define all possible channels with default values
  // Note: WEB is mapped to MERCHANT_PORTAL on backend, so WEB is not included here
  const allChannels = [
    { channel: 'APP', label: 'Mobile App' },
    { channel: 'USSD', label: 'USSD' },
    { channel: 'API', label: 'API' },
    { channel: 'BACKOFFICE', label: 'Back Office' },
    { channel: 'MERCHANT_PORTAL', label: 'Merchant Portal' },
    { channel: 'AGENT_PORTAL', label: 'Agent Portal' },
    { channel: 'PARTNER_PORTAL', label: 'Partner Portal' }
  ]

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

  // Backend returns channels directly, not wrapped in data property
  const existingChannels = channelStats?.channels || channelStats?.data?.channels || []
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development' && channelStats) {
    console.log('📊 Channel Stats Response:', {
      hasChannels: !!channelStats?.channels,
      hasDataChannels: !!channelStats?.data?.channels,
      channelCount: existingChannels.length,
      structure: Object.keys(channelStats),
      total: channelStats?.total || channelStats?.data?.total
    });
  }
  
  // Merge WEB into MERCHANT_PORTAL if WEB exists in the data (for backward compatibility)
  const processedChannels = existingChannels.map((ch: any) => {
    if (ch.channel === 'WEB') {
      return {
        ...ch,
        channel: 'MERCHANT_PORTAL',
        label: 'Merchant Portal'
      };
    }
    return ch;
  });
  
  // Group by channel and merge WEB into MERCHANT_PORTAL
  const channelMap = new Map<string, any>();
  processedChannels.forEach((ch: any) => {
    const key = ch.channel;
    if (channelMap.has(key)) {
      const existing = channelMap.get(key);
      channelMap.set(key, {
        ...existing,
        transactionCount: existing.transactionCount + (ch.transactionCount || 0),
        totalValue: existing.totalValue + (ch.totalValue || 0),
        averageValue: 0 // Will be recalculated
      });
    } else {
      channelMap.set(key, {
        channel: ch.channel,
        label: ch.label || allChannels.find(c => c.channel === ch.channel)?.label || ch.channel,
        transactionCount: ch.transactionCount || 0,
        totalValue: ch.totalValue || 0,
        averageValue: ch.averageValue || 0
      });
    }
  });
  
  // Recalculate average for merged channels
  channelMap.forEach((ch) => {
    if (ch.transactionCount > 0) {
      ch.averageValue = ch.totalValue / ch.transactionCount;
    }
  });
  
  // Merge existing channels with all possible channels, defaulting to 0 for missing ones
  const channels = allChannels.map((defaultChannel) => {
    const existingData = channelMap.get(defaultChannel.channel)
    return existingData || {
      channel: defaultChannel.channel,
      label: defaultChannel.label,
      transactionCount: 0,
      totalValue: 0,
      averageValue: 0
    }
  })
  
  const newWallets = walletStats?.data?.newWalletsCount || walletStats?.newWalletsCount || 0
  const totalTransactions = channelStats?.total?.transactionCount || channelStats?.data?.total?.transactionCount || 0
  const totalValue = channelStats?.total?.totalValue || channelStats?.data?.total?.totalValue || 0

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

          <div className="space-y-2">
            {channels.map((channel: any) => (
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
                      {channel.transactionCount || 0} transactions
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-bold">{formatAmount(channel.totalValue || 0)}</p>
                  <p className="text-xs opacity-75">
                    Avg: {formatAmount(channel.averageValue || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
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
      </CardContent>
    </Card>
  )
}

export default ChannelStatsCard

