import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

// Finance Reporting API functions
export const getCustomerCount = async (startDate: string, endDate: string) => {
  const response = await api.get('/finance/reports/customers/count', {
    params: { startDate, endDate }
  })
  return response.data
}

export const getTransactionVolume = async (params: {
  startDate: string
  endDate: string
  status?: string
  currency?: string
}) => {
  const queryParams = new URLSearchParams()
  queryParams.set('startDate', params.startDate)
  queryParams.set('endDate', params.endDate)
  if (params.status) queryParams.set('status', params.status)
  if (params.currency) queryParams.set('currency', params.currency)
  
  const response = await api.get(`/finance/reports/transactions/volume?${queryParams.toString()}`)
  return response.data
}

export const getTransactionsByGender = async (params: {
  startDate: string
  endDate: string
  status?: string
  currency?: string
}) => {
  const queryParams = new URLSearchParams()
  queryParams.set('startDate', params.startDate)
  queryParams.set('endDate', params.endDate)
  if (params.status) queryParams.set('status', params.status)
  if (params.currency) queryParams.set('currency', params.currency)
  
  const response = await api.get(`/finance/reports/transactions/gender?${queryParams.toString()}`)
  return response.data
}

export const getTransactionsByAmountBands = async (params: {
  startDate: string
  endDate: string
  status?: string
  currency?: string
  bands: Array<{ minAmount: number; maxAmount: number }>
}) => {
  const response = await api.post('/finance/reports/transactions/amount-bands', params)
  return response.data
}

// React Query hooks
export const useCustomerCount = (startDate: string, endDate: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['finance', 'customerCount', startDate, endDate],
    queryFn: () => getCustomerCount(startDate, endDate),
    enabled: enabled && !!startDate && !!endDate,
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
  return useQuery({
    queryKey: ['finance', 'transactionsByAmountBands', startDate, endDate, status, currency, bands],
    queryFn: () => getTransactionsByAmountBands({ startDate, endDate, status, currency, bands }),
    enabled: enabled && !!startDate && !!endDate && bands.length > 0,
  })
}




