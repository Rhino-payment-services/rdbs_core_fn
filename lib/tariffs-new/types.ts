import type { LucideIcon } from 'lucide-react'

export interface Tariff {
  id: string
  name: string
  description: string
  tariffType: 'INTERNAL' | 'EXTERNAL'
  transactionType: string
  network?: 'MTN' | 'AIRTEL'
  currency: string
  feeType: 'FIXED' | 'PERCENTAGE' | 'HYBRID'
  feeAmount: number
  feePercentage: number
  minFee: number
  maxFee: number
  minAmount: number
  maxAmount: number
  userType: 'STAFF' | 'SUBSCRIBER' | 'MERCHANT'
  subscriberType: 'INDIVIDUAL' | 'BUSINESS' | null
  partnerId?: string
  apiPartnerId?: string
  group?: string
  partner?: {
    partnerName: string
    partnerCode: string
  }
  apiPartner?: {
    id: string
    partnerName: string
    partnerType: string
    contactEmail: string
    contactPhone: string
  }
  isActive?: boolean
  status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'DRAFT' | string
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | string
  approvalNotes?: string
  approvedBy?: string
  approvedById?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedById?: string
  rejectedAt?: string
  submittedForApprovalAt?: string
  submittedBy?: string
  submittedById?: string
  createdBy?: string
  createdById?: string
  updatedBy?: string
  updatedById?: string
  createdAt?: string
  updatedAt?: string
  partnerFee?: number
  rukapayFee?: number
  telecomBankCharge?: number
  governmentTax?: number
  transactionModeCode?: string
  metadata?: Record<string, unknown> | null
  channel?: string | null
}

export type TransactionTypeConfig = {
  name: string
  description: string
  icon: LucideIcon
  color: string
  tabId: string
}

export type PartnerBucket = {
  key: string
  label: string
  sublabel?: string
  kind: 'api' | 'external' | 'general'
  tariffs: Tariff[]
}
