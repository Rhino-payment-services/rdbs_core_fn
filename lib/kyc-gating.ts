import api from './axios'

// KYC Gating enums and types

export type KycContext = 'PERSONAL' | 'MERCHANT'

export type KycStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'

export type VerificationLevel = 'BASIC' | 'STANDARD' | 'ENHANCED' | 'PREMIUM'

export type KycGatingProductOrAction =
  | 'WALLET_CREATE'
  | 'TRANSFER'
  | 'BULK_PAYOUT'
  | 'WALLET_TO_MNO'
  | 'WALLET_TO_BANK'
  | string

export const KYC_GATING_PRODUCT_OPTIONS: KycGatingProductOrAction[] = [
  'WALLET_CREATE',
  'TRANSFER',
  'BULK_PAYOUT',
  'WALLET_TO_MNO',
  'WALLET_TO_BANK',
]

export interface CreateKycGatingRulePayload {
  context: KycContext
  productOrAction: KycGatingProductOrAction
  minKycStatus?: KycStatus | null
  minVerificationLevel?: VerificationLevel | null
  requireMerchantVerified?: boolean
  name?: string
  description?: string
}

// For now, updating a rule uses the same shape as creation.
// Backend expects a full object rather than a partial patch.
export interface UpdateKycGatingRulePayload {
  context: KycContext
  productOrAction: KycGatingProductOrAction
  minKycStatus?: KycStatus | null
  minVerificationLevel?: VerificationLevel | null
  requireMerchantVerified?: boolean
  name?: string
  description?: string
}

export interface KycGatingRule {
  id: string
  context: KycContext
  productOrAction: KycGatingProductOrAction
  version: number
  minKycStatus: KycStatus | null
  minVerificationLevel: VerificationLevel | null
  requireMerchantVerified: boolean
  effectiveFrom: string
  effectiveTo: string | null
  isActive: boolean
  name: string | null
  description: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface KycGatingCheckResult {
  allowed: boolean
  reason?: string
  requiredStatus?: KycStatus
  requiredLevel?: VerificationLevel
  currentStatus?: KycStatus
  currentLevel?: VerificationLevel
}

export interface ListKycGatingRulesFilters {
  context?: KycContext
  productOrAction?: string
}

/**
 * GET /admin/kyc/gating-rules/{id}
 *
 * Example:
 *   GET /admin/kyc/gating-rules/7069b755-d6e2-4e4c-b02d-d8b7a7b09662
 *
 * Example response:
 * {
 *   "id": "7069b755-d6e2-4e4c-b02d-d8b7a7b09662",
 *   "version": 1,
 *   "context": "PERSONAL",
 *   "productOrAction": "TRANSFER",
 *   "minKycStatus": "APPROVED",
 *   "minVerificationLevel": "STANDARD",
 *   "requireMerchantVerified": false,
 *   "effectiveFrom": "2026-02-11T14:36:58.943Z",
 *   "effectiveTo": null,
 *   "isActive": true,
 *   "name": null,
 *   "description": "Restricting users who are not verified to transfer",
 *   "createdBy": "1aee0980-4acf-438d-b6f9-c48e50f69501",
 *   "createdAt": "2026-02-11T14:36:59.080Z",
 *   "updatedAt": "2026-02-11T14:36:59.080Z"
 * }
 */
export async function getKycGatingRule(id: string): Promise<KycGatingRule> {
  const response = await api.get<KycGatingRule>(
    `/admin/kyc/gating-rules/${id}`
  )
  return response.data
}

/**
 * GET /admin/kyc/gating-rules
 *
 * Example requests:
 *   - List all rules:
 *     GET /admin/kyc/gating-rules
 *
 *   - List rules for personal wallet creation:
 *     GET /admin/kyc/gating-rules?context=PERSONAL&productOrAction=WALLET_CREATE
 *
 * Example response:
 * [
 *   {
 *     "id": "rule-id-1",
 *     "context": "PERSONAL",
 *     "productOrAction": "WALLET_CREATE",
 *     "version": 1,
 *     "minKycStatus": "APPROVED",
 *     "minVerificationLevel": "STANDARD",
 *     "requireMerchantVerified": false,
 *     "effectiveFrom": "2026-02-07T12:00:00.000Z",
 *     "effectiveTo": null,
 *     "isActive": true,
 *     "name": "Personal wallet creation rule",
 *     "description": "User must be KYC approved and at least STANDARD level",
 *     "createdBy": "admin-user-id",
 *     "createdAt": "2026-02-07T12:00:00.000Z",
 *     "updatedAt": "2026-02-07T12:00:00.000Z"
 *   }
 * ]
 */
export async function listKycGatingRules(
  filters: ListKycGatingRulesFilters = {}
): Promise<KycGatingRule[]> {
  const response = await api.get<KycGatingRule[]>('/admin/kyc/gating-rules', {
    params: {
      context: filters.context,
      productOrAction: filters.productOrAction,
    },
  })

  return response.data || []
}

/**
 * POST /admin/kyc/gating-rules
 *
 * Request body shape:
 * {
 *   "context": "PERSONAL",
 *   "productOrAction": "WALLET_CREATE",
 *   "minKycStatus": "APPROVED",
 *   "minVerificationLevel": "STANDARD",
 *   "requireMerchantVerified": false,
 *   "name": "Personal wallet rule v2",
 *   "description": "Requires approved KYC and STANDARD level"
 * }
 *
 * Example success response:
 * {
 *   "id": "rule-id-2",
 *   "context": "PERSONAL",
 *   "productOrAction": "WALLET_CREATE",
 *   "version": 2,
 *   "minKycStatus": "APPROVED",
 *   "minVerificationLevel": "STANDARD",
 *   "requireMerchantVerified": false,
 *   "effectiveFrom": "2026-02-11T10:00:00.000Z",
 *   "effectiveTo": null,
 *   "isActive": true,
 *   "name": "Personal wallet rule v2",
 *   "description": "Requires approved KYC and STANDARD level",
 *   "createdBy": "admin-user-id",
 *   "createdAt": "2026-02-11T10:00:00.000Z",
 *   "updatedAt": "2026-02-11T10:00:00.000Z"
 * }
 *
 * Example error response:
 * {
 *   "statusCode": 500,
 *   "message": "Failed to create gating rule"
 * }
 */
export async function createKycGatingRule(
  payload: CreateKycGatingRulePayload
): Promise<KycGatingRule> {
  const response = await api.post<KycGatingRule>(
    '/admin/kyc/gating-rules',
    payload
  )
  return response.data
}

/**
 * PATCH /admin/kyc/gating-rules/{id}
 *
 * Example request:
 *   PATCH /admin/kyc/gating-rules/{id}
 *   {
 *     "context": "PERSONAL",
 *     "productOrAction": "WALLET_CREATE",
 *     "minKycStatus": "NOT_STARTED",
 *     "minVerificationLevel": "BASIC",
 *     "requireMerchantVerified": true,
 *     "name": "string",
 *     "description": "string"
 *   }
 */
export async function updateKycGatingRule(
  id: string,
  payload: UpdateKycGatingRulePayload
): Promise<KycGatingRule> {
  const response = await api.patch<KycGatingRule>(
    `/admin/kyc/gating-rules/${id}`,
    payload
  )
  return response.data
}

/**
 * GET /admin/kyc/gating-rules/check
 *
 * Example request:
 *   GET /admin/kyc/gating-rules/check?userId=abc-123&context=PERSONAL&productOrAction=WALLET_CREATE
 *
 * Example allowed response:
 * {
 *   "allowed": true,
 *   "currentStatus": "APPROVED",
 *   "currentLevel": "STANDARD"
 * }
 *
 * Example blocked (KYC status) response:
 * {
 *   "allowed": false,
 *   "reason": "KYC approval required for this action. Current status: PENDING. Please complete identity verification.",
 *   "requiredStatus": "APPROVED",
 *   "requiredLevel": "STANDARD",
 *   "currentStatus": "PENDING",
 *   "currentLevel": "BASIC"
 * }
 *
 * Example blocked (merchant not verified) response:
 * {
 *   "allowed": false,
 *   "reason": "Merchant account must be verified to use this feature. Please complete business verification.",
 *   "requiredStatus": "APPROVED",
 *   "requiredLevel": "STANDARD",
 *   "currentStatus": "APPROVED",
 *   "currentLevel": "STANDARD"
 * }
 *
 * Example user-not-found response:
 * {
 *   "allowed": false,
 *   "reason": "User not found. Please sign in again."
 * }
 */
export async function checkKycGating(params: {
  userId: string
  context: KycContext
  productOrAction: string
}): Promise<KycGatingCheckResult> {
  const response = await api.get<KycGatingCheckResult>(
    '/admin/kyc/gating-rules/check',
    {
      params,
    }
  )

  return response.data
}

