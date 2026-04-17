import { useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

export interface OpsTransactionSearchResult {
  id: string
  reference: string
  externalReference?: string
  userId: string
  userPhone?: string
  userEmail?: string
  userName?: string
  walletId?: string
  publicWalletId?: string
  type: string
  mode?: string
  status: string
  amount: number
  currency: string
  fee: number
  netAmount: number
  channel?: string
  description?: string
  createdAt: string
  processedAt?: string
  counterpartyName?: string
  counterpartyPhone?: string
  counterpartyId?: string
  metadata?: Record<string, unknown>
  direction?: string
  /** Set by core enrichment — drives Sender/Receiver columns when present */
  senderInfo?: { name?: string; contact?: string | null; type?: string; merchantCode?: string | null; merchantName?: string | null }
  receiverInfo?: { name?: string; contact?: string | null; type?: string; merchantCode?: string | null; merchantName?: string | null }
  /** External payment rail partner (e.g. ABC, Pegasus, MTN gateway). Drives the Partner column. */
  partnerMapping?: { id: string; partner?: { id: string; partnerName: string; partnerCode: string } | null } | null
  /** API / business partner that initiated the transaction (no partnerCode — ApiPartner model) */
  partner?: { id: string; partnerName: string; partnerType?: string } | null
}

export interface OpsTransactionSearchResponse {
  results: OpsTransactionSearchResult[]
  total: number
  page: number
  limit: number
  totalPages: number
}

function buildSearchParams(paramsIn: {
  q?: string
  status?: string
  type?: string
  channel?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}) {
  const q = (paramsIn.q || '').trim()
  const params = new URLSearchParams()

  if (q) params.set('q', q)
  if (paramsIn.status) params.set('status', paramsIn.status)
  if (paramsIn.type) params.set('type', paramsIn.type)
  if (paramsIn.channel) params.set('channel', paramsIn.channel)
  if (paramsIn.startDate) params.set('startDate', paramsIn.startDate)
  if (paramsIn.endDate) params.set('endDate', paramsIn.endDate)
  params.set('page', String(paramsIn.page ?? 1))
  params.set('limit', String(paramsIn.limit ?? 20))

  return params
}

export function useOpsTransactionSearch(paramsIn: {
  q?: string
  status?: string
  type?: string
  channel?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}) {
  const q = (paramsIn.q || '').trim()
  return useQuery<OpsTransactionSearchResponse>({
    queryKey: ['ops-transaction-search', { ...paramsIn, q }],
    queryFn: async () => {
      const params = buildSearchParams({ ...paramsIn, q })
      const qs = params.toString()
      const res = await api.get(`/ops/transactions/search?${qs}`)
      return res.data as OpsTransactionSearchResponse
    },
    enabled: true,
    staleTime: 5000,
  })
}

