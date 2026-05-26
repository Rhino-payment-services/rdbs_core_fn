export interface CreateTariffForm {
  name: string
  description?: string
  tariffType: 'INTERNAL' | 'EXTERNAL'
  transactionType:
    | 'DEPOSIT'
    | 'WITHDRAWAL'
    | 'BILL_PAYMENT'
    | 'SCHOOL_FEES'
    | 'WALLET_INIT'
    | 'WALLET_TO_INTERNAL_MERCHANT'
    | 'WALLET_TO_EXTERNAL_MERCHANT'
    | 'MERCHANT_WITHDRAWAL'
    | 'MERCHANT_TO_WALLET'
    | 'WALLET_TO_WALLET'
    | 'WALLET_TO_MNO'
    | 'WALLET_TO_UTILITY'
    | 'MNO_TO_WALLET'
    | 'WALLET_TO_MERCHANT'
    | 'WALLET_TO_BANK'
    | 'BANK_TO_WALLET'
    | 'CARD_TO_WALLET'
    | 'REVERSAL'
    | 'FEE_CHARGE'
    | 'CUSTOM'
    | 'WALLET_TO_PARTNER_INSTITUTION'
    | 'PARTNER_INSTITUTION_TO_WALLET'
  network?: 'MTN' | 'AIRTEL'
  transactionModeId?: string
  currency: string
  feeType: 'FIXED' | 'PERCENTAGE' | 'TIERED' | 'HYBRID'
  feeAmount: number
  feePercentage?: number
  minAmount?: number
  maxAmount?: number
  userType?: 'STAFF' | 'SUBSCRIBER'
  subscriberType?: 'INDIVIDUAL' | 'MERCHANT' | 'AGENT'
  partnerId?: string
  apiPartnerId?: string
  partnerType?: 'EXTERNAL_PARTNER' | 'API_PARTNER'
  group?: string
  partnerFee?: number
  rukapayFee?: number
  telecomBankCharge?: number
  governmentTax?: number
  metadata?: Record<string, unknown>
  institutionSpreadRukapayBps?: number
  institutionSpreadNexenBps?: number
  channel?: string
}
