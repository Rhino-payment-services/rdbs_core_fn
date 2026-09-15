import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export type RukaSenteLoanAccount = {
  id: string
  account_number: string
  loan_number: string
  loan_application_id: string
  currency: string
  principal_amount: number
  interest_amount: number
  total_repayable: number
  principal_balance: number
  interest_balance: number
  outstanding_balance: number
  amount_repaid: number
  principal_repaid: number
  interest_repaid: number
  disbursed_amount: number
  repayment_count: number
  status: string
  display_reference?: string
  disbursed_at?: string
  due_date?: string
  repaid_at?: string
}

export type RukaSenteLoanApplication = {
  id: string
  application_number: string
  borrower_name?: string
  borrower_phone?: string
  product_name?: string
  product_code?: string
  requested_amount: number
  currency: string
  status: string
  disbursed_amount?: number
  disbursement_wallet_id?: string
  due_date?: string
  account?: RukaSenteLoanAccount | null
}

export type PartnerLoanListItem = {
  id: string
  applicationNumber: string
  userId?: string | null
  name: string
  phone?: string | null
  email?: string | null
  productName?: string | null
  productCode?: string | null
  status: string
  currency: string
  requestedAmount: number
  disbursedAmount?: number | null
  amount?: number | null
  outstandingBalance: number
  amountRepaid: number
  disbursedAt?: string | null
  dueDate?: string | null
  hasActiveRukaSenteLoan?: boolean
  account?: RukaSenteLoanAccount | null
}

export type RukaSenteLoanListFilters = {
  page?: number
  limit?: number
  search?: string
  filter?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: string
  maxAmount?: string
  minOutstanding?: string
  maxOutstanding?: string
}

export type PartnerLoanListData = {
  items: PartnerLoanListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  flaggedActiveCount?: number
}

export type BorrowerLoanDetail = {
  user: {
    userId: string
    name: string
    phone?: string | null
    email?: string | null
    status?: string
    hasActiveRukaSenteLoan: boolean
    wallets: Array<{
      id: string
      balance: number
      currency: string
      isDefault: boolean
      walletType: string
    }>
  }
  loans: RukaSenteLoanApplication[]
  linked?: boolean
  rukaSenteError?: string | null
}

function listParams(filters: RukaSenteLoanListFilters) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  return {
    page,
    limit,
    search: filters.search || undefined,
    filter: filters.filter || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    minAmount: filters.minAmount || undefined,
    maxAmount: filters.maxAmount || undefined,
    minOutstanding: filters.minOutstanding || undefined,
    maxOutstanding: filters.maxOutstanding || undefined,
  }
}

export async function fetchRukaSenteLoans(filters: RukaSenteLoanListFilters = {}) {
  const { data } = await api.get('/admin/rukasente/loans', {
    params: listParams(filters),
  })
  return data as {
    success: boolean
    configured?: boolean
    data: PartnerLoanListData
  }
}

export async function fetchAllRukaSenteLoans(filters: Omit<RukaSenteLoanListFilters, 'page' | 'limit'>) {
  const pageSize = 100
  const first = await fetchRukaSenteLoans({ ...filters, page: 1, limit: pageSize })
  const items = [...(first.data?.items ?? [])]
  const totalPages = first.data?.totalPages ?? 1
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchRukaSenteLoans({ ...filters, page, limit: pageSize })
    items.push(...(next.data?.items ?? []))
  }
  return items
}

export function useActiveRukaSenteLoans(filters: RukaSenteLoanListFilters = {}) {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 20
  const search = filters.search ?? ''
  const filter = filters.filter ?? 'active'
  const dateFrom = filters.dateFrom ?? ''
  const dateTo = filters.dateTo ?? ''
  const minAmount = filters.minAmount ?? ''
  const maxAmount = filters.maxAmount ?? ''
  const minOutstanding = filters.minOutstanding ?? ''
  const maxOutstanding = filters.maxOutstanding ?? ''
  return useQuery({
    queryKey: [
      'rukasente-active-loans',
      page,
      limit,
      search,
      filter,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      minOutstanding,
      maxOutstanding,
    ],
    queryFn: () =>
      fetchRukaSenteLoans({
        page,
        limit,
        search,
        filter,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        minOutstanding,
        maxOutstanding,
      }),
  })
}

export function useRukaSenteBorrowerLoans(userId?: string) {
  return useQuery({
    queryKey: ['rukasente-borrower-loans', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await api.get(`/admin/rukasente/loans/${userId}`)
      return data as {
        success: boolean
        configured?: boolean
        data: BorrowerLoanDetail
      }
    },
  })
}

export function useCollectRukaSenteRepayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      applicationId: string
      amount: number
      wallet_id?: string
      userId?: string
    }) => {
      const { data } = await api.post(
        `/admin/rukasente/loans/applications/${payload.applicationId}/repay`,
        {
          amount: payload.amount,
          wallet_id: payload.wallet_id,
          idempotency_key: `rdbs-fn-repay-${payload.applicationId}-${Date.now()}`,
        },
        { timeout: 60000 },
      )
      return data
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: ['rukasente-active-loans'] })
      if (vars.userId) {
        void qc.invalidateQueries({
          queryKey: ['rukasente-borrower-loans', vars.userId],
        })
      }
    },
  })
}
