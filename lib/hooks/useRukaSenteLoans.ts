import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'

export type ActiveLoanBorrower = {
  userId: string
  name: string
  phone?: string | null
  email?: string | null
  status?: string
  hasActiveRukaSenteLoan: boolean
  walletId?: string | null
  walletBalance?: number | null
  walletCurrency?: string
  wallets?: Array<{
    id: string
    balance: number
    currency: string
    isDefault: boolean
    walletType: string
  }>
  updatedAt?: string
}

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
}

export function useActiveRukaSenteLoans(params?: {
  page?: number
  limit?: number
  search?: string
}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const search = params?.search ?? ''
  return useQuery({
    queryKey: ['rukasente-active-loans', page, limit, search],
    queryFn: async () => {
      const { data } = await api.get('/admin/rukasente/loans', {
        params: { page, limit, search: search || undefined },
      })
      return data as {
        success: boolean
        configured?: boolean
        data: {
          items: ActiveLoanBorrower[]
          total: number
          page: number
          limit: number
          totalPages: number
        }
      }
    },
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
