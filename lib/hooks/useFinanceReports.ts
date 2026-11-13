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

// BOU monthly report (Bank of Uganda)
export interface BouMonthlyReport {
  reportType: string
  period: {
    month: string
    start: string
    end: string
  }
  transactions: {
    totalCount: number
    totalVolume: number
    cashIn: { count: number; volume: number }
    cashOut: { count: number; volume: number }
    p2p: { count: number; volume: number }
    walletToBank: { count: number; volume: number }
    /** Per destination bank from transaction metadata (UNKNOWN when missing); names/codes merged */
    walletToBankByBank?: Array<{ bank: string; transactionCount: number; volume: number }>
    /** Bill / utility payments in the month */
    billPayments?: { count: number; volume: number }
    /** Breakdown by utility provider (NWSC, UMEME (UEDCL), URA, …) */
    billPaymentsByProvider?: Array<{
      provider: string
      transactionCount: number
      volume: number
    }>
    merchantToWallet: { count: number; volume: number }
    personalToBusiness: { count: number; volume: number }
    personalToMerchant: { count: number; volume: number }
    bands: Array<{
      label: string
      min: number
      max: number | null
      transactionCount: number
      totalVolume: number
    }>
  }
  customers: {
    total: number
    female: number
    male: number
    /** Missing / blank / other gender */
    unknown?: number
    registeredInMonth?: {
      total: number
      female: number
      male: number
      unknown?: number
    }
    /** All subscribers registered on/before month end */
    totalAsOfMonthEnd?: {
      total: number
      female: number
      male: number
      unknown?: number
    }
    activeInMonth: {
      total: number
      female: number
      male: number
      unknown?: number
    }
    activeIn90Days: {
      total: number
      female: number
      male: number
      unknown?: number
    }
  }
  merchants: {
    /** Registered (created) in report month — same as registeredInMonth.total */
    total: number
    female: number
    male: number
    unknown?: number
    registeredInMonth?: {
      total: number
      female: number
      male: number
      unknown?: number
    }
    activeInMonth?: {
      total: number
      female: number
      male: number
      unknown?: number
    }
    activeIn90Days?: {
      total: number
      female: number
      male: number
      unknown?: number
    }
  }
  wallets: {
    totalActiveBalance: number
    activeNonMerchantLinked?: {
      walletCount: number
      totalBalance: number
    }
    activeMerchantLinked?: {
      walletCount: number
      totalBalance: number
    }
    blocked?: {
      walletCount: number
      totalBalance: number
    }
    dormant?: {
      walletCount: number
      totalBalance: number
      inactiveDaysThreshold?: number
      asOf?: string
    }
  }
  accounts?: {
    userSuspended?: {
      userCount: number
      walletCount: number
      totalWalletBalance: number
    }
  }
  generatedAt: string | Date
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
    
    // Transform the data to match expected format; blank/null gender → Unknown
    const rawStats = data?.genderStats || data?.distribution || []
    const normalizeGenderLabel = (raw: unknown): string => {
      const s = String(raw ?? '').trim()
      if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') {
        return 'Unknown'
      }
      const upper = s.toUpperCase()
      if (upper === 'F' || upper === 'FEMALE') return 'Female'
      if (upper === 'M' || upper === 'MALE') return 'Male'
      if (upper === 'UNKNOWN' || upper === 'OTHER' || upper === 'N/A') return 'Unknown'
      return s
    }
    const merged = new Map<
      string,
      { gender: string; totalVolume: number; totalCount: number; averageAmount: number }
    >()
    if (Array.isArray(rawStats)) {
      for (const stat of rawStats) {
        const gender = normalizeGenderLabel(stat.gender ?? stat._id)
        const totalVolume = Number(stat.totalVolume || 0)
        const totalCount = Number(stat.count || stat.totalCount || 0)
        const cur = merged.get(gender) || {
          gender,
          totalVolume: 0,
          totalCount: 0,
          averageAmount: 0,
        }
        cur.totalVolume += totalVolume
        cur.totalCount += totalCount
        merged.set(gender, cur)
      }
    }
    const genderStats = Array.from(merged.values()).map((g) => ({
      ...g,
      averageAmount: g.totalCount > 0 ? g.totalVolume / g.totalCount : 0,
    }))
    // Prefer Female, Male, Unknown order when present
    const order = ['Female', 'Male', 'Unknown']
    genderStats.sort((a, b) => {
      const ai = order.indexOf(a.gender)
      const bi = order.indexOf(b.gender)
      if (ai === -1 && bi === -1) return a.gender.localeCompare(b.gender)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
    
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

// BOU monthly report - backend already aggregates everything
export const getBouMonthlyReport = async (month?: string): Promise<BouMonthlyReport> => {
  const response = await api.get('/analytics/reports/bou', {
    params: month ? { month } : undefined,
  })
  return response.data as BouMonthlyReport
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

export const useBouMonthlyReport = (month?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['finance', 'bouMonthlyReport', month],
    queryFn: () => getBouMonthlyReport(month),
    enabled: enabled && typeof window !== 'undefined', // only in browser
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

