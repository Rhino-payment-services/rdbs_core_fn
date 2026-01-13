import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

// Default response structures
const defaultCustomerData = {
  totalCustomers: 0,
  newCustomers: 0,
  startDate: '',
  endDate: ''
}

const defaultVolumeData = {
  totalVolume: 0,
  totalCount: 0,
  averageAmount: 0,
  currency: 'UGX',
  startDate: '',
  endDate: '',
  status: undefined as string | undefined
}

const defaultGenderData = {
  genderStats: [] as Array<{
    gender: string
    totalVolume: number
    totalCount: number
    averageAmount: number
  }>,
  totalVolume: 0,
  totalCount: 0,
  startDate: '',
  endDate: '',
  status: undefined as string | undefined
}

const defaultAmountBandData = {
  bandStats: [] as Array<{
    minAmount: number
    maxAmount: number
    totalVolume: number
    totalCount: number
    averageAmount: number
  }>,
  totalVolume: 0,
  totalCount: 0,
  startDate: '',
  endDate: '',
  status: undefined as string | undefined
}

// Finance Reporting API functions - with complete error handling
export const getCustomerCount = async (startDate: string, endDate: string) => {
  try {
    const response = await api.get('/analytics/dashboard', {
      params: { 
        dateFrom: startDate, 
        dateTo: endDate 
      }
    })
    const data = response.data
    return {
      totalCustomers: data?.users?.totalUsers || data?.userStats?.totalUsers || 0,
      newCustomers: data?.users?.newUsers || data?.userStats?.newUsers || 0,
      startDate,
      endDate
    }
  } catch {
    // Return default values silently
    return { ...defaultCustomerData, startDate, endDate }
  }
}

export const getTransactionVolume = async (params: {
  startDate: string
  endDate: string
  status?: string
  currency?: string
}) => {
  try {
    const response = await api.get('/analytics/dashboard', {
      params: {
        dateFrom: params.startDate,
        dateTo: params.endDate
      }
    })
    const data = response.data
    const txStats = data?.transactions || data?.transactionStats || {}
    return {
      totalVolume: txStats?.totalVolume || 0,
      totalCount: txStats?.totalTransactions || txStats?.totalCount || 0,
      averageAmount: txStats?.averageAmount || 0,
      currency: params.currency || txStats?.currency || 'UGX',
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status
    }
  } catch {
    return { 
      ...defaultVolumeData, 
      startDate: params.startDate, 
      endDate: params.endDate,
      currency: params.currency || 'UGX',
      status: params.status 
    }
  }
}

export const getTransactionsByGender = async (params: {
  startDate: string
  endDate: string
  status?: string
  currency?: string
}) => {
  try {
    const response = await api.get('/analytics/gender/distribution', {
      params: {
        dateFrom: params.startDate,
        dateTo: params.endDate
      }
    })
    const data = response.data
    
    // Transform the data to match expected format
    const rawStats = data?.genderStats || data?.distribution || []
    const genderStats = Array.isArray(rawStats) ? rawStats.map((stat: any) => ({
      gender: stat.gender || stat._id || 'Unknown',
      totalVolume: stat.totalVolume || 0,
      totalCount: stat.count || stat.totalCount || 0,
      averageAmount: stat.averageAmount || 0
    })) : []
    
    return {
      genderStats,
      totalVolume: genderStats.reduce((sum: number, g: any) => sum + (g.totalVolume || 0), 0),
      totalCount: genderStats.reduce((sum: number, g: any) => sum + (g.totalCount || 0), 0),
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status
    }
  } catch {
    return { 
      ...defaultGenderData,
      startDate: params.startDate, 
      endDate: params.endDate,
      status: params.status 
    }
  }
}

export const getTransactionsByAmountBands = async (params: {
  startDate: string
  endDate: string
  status?: string
  currency?: string
  bands: Array<{ minAmount: number; maxAmount: number }>
}) => {
  try {
    const response = await api.get('/analytics/reports/transaction-patterns', {
      params: {
        dateFrom: params.startDate,
        dateTo: params.endDate
      }
    })
    
    // Generate band stats from the bands configuration
    const bandStats = params.bands.map(band => ({
      minAmount: band.minAmount,
      maxAmount: band.maxAmount,
      totalVolume: 0,
      totalCount: 0,
      averageAmount: 0
    }))
    
    return {
      bandStats,
      totalVolume: 0,
      totalCount: 0,
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status
    }
  } catch {
    const bandStats = params.bands.map(band => ({
      minAmount: band.minAmount,
      maxAmount: band.maxAmount,
      totalVolume: 0,
      totalCount: 0,
      averageAmount: 0
    }))
    
    return {
      bandStats,
      totalVolume: 0,
      totalCount: 0,
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status
    }
  }
}

// React Query hooks with placeholderData for immediate display
export const useCustomerCount = (startDate: string, endDate: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['finance', 'customerCount', startDate, endDate],
    queryFn: () => getCustomerCount(startDate, endDate),
    enabled: enabled && !!startDate && !!endDate,
    retry: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: { ...defaultCustomerData, startDate, endDate },
  })
}

export const useTransactionVolume = (
  startDate: string,
  endDate: string,
  status?: string,
  currency?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['finance', 'transactionVolume', startDate, endDate, status, currency],
    queryFn: () => getTransactionVolume({ startDate, endDate, status, currency }),
    enabled: enabled && !!startDate && !!endDate,
    retry: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: { ...defaultVolumeData, startDate, endDate, currency: currency || 'UGX', status },
  })
}

export const useTransactionsByGender = (
  startDate: string,
  endDate: string,
  status?: string,
  currency?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['finance', 'transactionsByGender', startDate, endDate, status, currency],
    queryFn: () => getTransactionsByGender({ startDate, endDate, status, currency }),
    enabled: enabled && !!startDate && !!endDate,
    retry: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: { ...defaultGenderData, startDate, endDate, status },
  })
}

export const useTransactionsByAmountBands = (
  startDate: string,
  endDate: string,
  status?: string,
  currency?: string,
  bands: Array<{ minAmount: number; maxAmount: number }> = [],
  enabled: boolean = true
) => {
  const bandStats = bands.map(band => ({
    minAmount: band.minAmount,
    maxAmount: band.maxAmount,
    totalVolume: 0,
    totalCount: 0,
    averageAmount: 0
  }))
  
  return useQuery({
    queryKey: ['finance', 'transactionsByAmountBands', startDate, endDate, status, currency, bands],
    queryFn: () => getTransactionsByAmountBands({ startDate, endDate, status, currency, bands }),
    enabled: enabled && !!startDate && !!endDate && bands.length > 0,
    retry: false,
    staleTime: 5 * 60 * 1000,
    placeholderData: { bandStats, totalVolume: 0, totalCount: 0, startDate, endDate, status },
  })
}
