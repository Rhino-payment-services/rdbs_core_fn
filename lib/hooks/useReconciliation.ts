import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

const apiFetch = async (endpoint: string, options: any = {}) => {
  const response = await api({
    url: endpoint,
    method: options.method || 'GET',
    data: options.data,
    ...options,
  })
  return response.data
}

export interface SettlementRow {
  id: string
  fileId: string
  providerCode: string
  providerRef: string
  providerDate: string
  providerAmount: string
  providerFee: string
  providerStatus: string
  currency: string
  rawData: Record<string, any>
  internalTransactionId: string | null
  internalReference: string | null
  ledgerTransactionId: string | null
  matchStatus: string
  matchScore: number | null
  reconNotes: string | null
  matchedAt: string | null
  matchedBy: string | null
  createdAt: string
  updatedAt: string
  internalTransaction?: {
    id: string
    reference: string | null
    externalReference: string | null
    amount: string
    status: string
    fee: string
    currency: string
    type: string
    createdAt: string
  } | null
}

export interface SettlementFile {
  id: string
  providerCode: string
  fileName: string | null
  fileDate: string | null
  receivedAt: string
  status: string
  totalRows: number
  matchedRows: number
  unmatchedRows: number
  checksum: string | null
  metadata: Record<string, any> | null
  createdAt: string
  updatedAt: string
  rows?: SettlementRow[]
}

export const reconciliationKeys = {
  files: (filters: any) => ['reconciliation-files', filters] as const,
  file: (id: string, includeRows: boolean) => ['reconciliation-file', id, includeRows] as const,
  rows: (filters: any) => ['reconciliation-rows', filters] as const,
}

export const useSettlementFiles = (filters?: {
  providerCode?: string
  status?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}) => {
  return useQuery<{
    files: SettlementFile[]
    page: number
    limit: number
    total: number
    totalPages: number
  }>({
    queryKey: reconciliationKeys.files(filters || {}),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters?.providerCode) params.set('providerCode', filters.providerCode)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.fromDate) params.set('fromDate', filters.fromDate)
      if (filters?.toDate) params.set('toDate', filters.toDate)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))
      const qs = params.toString()
      return apiFetch(`/finance/reconciliation/files${qs ? `?${qs}` : ''}`)
    },
  })
}

export const useSettlementFile = (id: string | undefined, includeRows = false) => {
  return useQuery<SettlementFile>({
    queryKey: reconciliationKeys.file(id || '', includeRows),
    queryFn: () =>
      apiFetch(`/finance/reconciliation/files/${id}${includeRows ? '?includeRows=true' : ''}`),
    enabled: !!id,
  })
}

export const useSettlementRows = (filters: {
  fileId?: string
  providerCode?: string
  matchStatus?: string
  internalTransactionId?: string
  page?: number
  limit?: number
}) => {
  return useQuery<{
    rows: SettlementRow[]
    page: number
    limit: number
    total: number
    totalPages: number
  }>({
    queryKey: reconciliationKeys.rows(filters),
    queryFn: () => {
      const params = new URLSearchParams()
      if (filters.fileId) params.set('fileId', filters.fileId)
      if (filters.providerCode) params.set('providerCode', filters.providerCode)
      if (filters.matchStatus) params.set('matchStatus', filters.matchStatus)
      if (filters.internalTransactionId) {
        params.set('internalTransactionId', filters.internalTransactionId)
      }
      if (filters.page) params.set('page', String(filters.page))
      if (filters.limit) params.set('limit', String(filters.limit))
      const query = params.toString()
      return apiFetch(`/finance/reconciliation/rows${query ? `?${query}` : ''}`)
    },
    // allow listing recent rows by default (paginated server-side)
    enabled: true,
  })
}

export const useIngestSettlementFile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => apiFetch('/finance/reconciliation/files', { method: 'POST', data }),
    onSuccess: () => {
      toast.success('Settlement file ingested')
      queryClient.invalidateQueries({ queryKey: ['reconciliation-rows'] })
      queryClient.invalidateQueries({ queryKey: ['reconciliation-files'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to ingest settlement file')
    },
  })
}

export const useAutoMatchSettlementFile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fileId: string) =>
      apiFetch(`/finance/reconciliation/files/${fileId}/auto-match`, { method: 'POST' }),
    onSuccess: (_, fileId) => {
      toast.success('Auto-match completed')
      queryClient.invalidateQueries({ queryKey: reconciliationKeys.file(fileId, true) })
      queryClient.invalidateQueries({ queryKey: ['reconciliation-rows'] })
      queryClient.invalidateQueries({ queryKey: ['reconciliation-files'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to auto-match')
    },
  })
}

export const useUpdateSettlementRow = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      rowId,
      matchStatus,
      reconNotes,
    }: {
      rowId: string
      matchStatus: string
      reconNotes?: string
    }) =>
      apiFetch(`/finance/reconciliation/rows/${rowId}`, {
        method: 'PATCH',
        data: { matchStatus, reconNotes },
      }),
    onSuccess: () => {
      toast.success('Row updated')
      queryClient.invalidateQueries({ queryKey: ['reconciliation-rows'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update row')
    },
  })
}
