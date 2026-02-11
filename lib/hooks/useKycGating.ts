import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  listKycGatingRules,
  createKycGatingRule,
  checkKycGating,
  getKycGatingRule,
  updateKycGatingRule,
  type CreateKycGatingRulePayload,
  type UpdateKycGatingRulePayload,
  type KycGatingRule,
  type KycGatingCheckResult,
  type KycContext,
} from '@/lib/kyc-gating'

export interface UseKycGatingRulesFilters {
  context?: KycContext
  productOrAction?: string
}

const kycGatingQueryKeys = {
  rules: (filters?: UseKycGatingRulesFilters) =>
    ['admin', 'kyc', 'gating-rules', filters || {}] as const,
}

export const useKycGatingRules = (filters: UseKycGatingRulesFilters = {}) => {
  return useQuery<KycGatingRule[], any>({
    queryKey: kycGatingQueryKeys.rules(filters),
    queryFn: () => listKycGatingRules(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useKycGatingRule = (id: string | null, enabled: boolean) => {
  return useQuery<KycGatingRule, any>({
    queryKey: ['admin', 'kyc', 'gating-rule', id],
    queryFn: () => getKycGatingRule(id as string),
    enabled: enabled && !!id,
  })
}

export const useCreateKycGatingRule = () => {
  const queryClient = useQueryClient()

  return useMutation<KycGatingRule, any, CreateKycGatingRulePayload>({
    mutationFn: (payload) => createKycGatingRule(payload),
    onSuccess: () => {
      toast.success('KYC gating rule created successfully.')
      queryClient.invalidateQueries({
        queryKey: ['admin', 'kyc', 'gating-rules'],
      })
    },
    onError: (error) => {
      const backendMessage = error?.data?.message || error?.message
      if (backendMessage) {
        toast.error(`Failed to create KYC gating rule: ${backendMessage}`)
      } else {
        toast.error('Failed to create KYC gating rule. Please try again.')
      }
    },
  })
}

export const useCheckKycGating = () => {
  return useMutation<
    KycGatingCheckResult,
    any,
    { userId: string; context: KycContext; productOrAction: string }
  >({
    mutationFn: (params) => checkKycGating(params),
    onSuccess: () => {
      // Optional toast; UI will primarily show inline result
      toast.success('Gating check completed.')
    },
    onError: (error) => {
      const backendMessage = error?.data?.message || error?.message
      if (backendMessage) {
        toast.error(`Failed to check KYC gating: ${backendMessage}`)
      } else {
        toast.error('Failed to check KYC gating. Please try again.')
      }
    },
  })
}

export const useUpdateKycGatingRule = () => {
  const queryClient = useQueryClient()

  return useMutation<
    KycGatingRule,
    any,
    { id: string; payload: UpdateKycGatingRulePayload }
  >({
    mutationFn: ({ id, payload }) => updateKycGatingRule(id, payload),
    onSuccess: (_, variables) => {
      toast.success('KYC gating rule updated successfully.')

      queryClient.invalidateQueries({
        queryKey: ['admin', 'kyc', 'gating-rules'],
      })
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: ['admin', 'kyc', 'gating-rule', variables.id],
        })
      }
    },
    onError: (error) => {
      const backendMessage = error?.data?.message || error?.message
      if (backendMessage) {
        toast.error(`Failed to update KYC gating rule: ${backendMessage}`)
      } else {
        toast.error('Failed to update KYC gating rule. Please try again.')
      }
    },
  })
}

