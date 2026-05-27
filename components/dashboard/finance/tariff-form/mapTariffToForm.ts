import { TARIFF_CHANNEL_ALL } from '@/lib/constants/tariff-channels'
import type { TransactionMode } from '@/lib/hooks/useTransactionModes'
import type { CreateTariffForm } from './types'

export type ApiTariffRecord = {
  id: string
  name: string
  description?: string | null
  tariffType: 'INTERNAL' | 'EXTERNAL' | string
  transactionType: string
  network?: 'MTN' | 'AIRTEL' | null
  currency?: string
  feeType: CreateTariffForm['feeType']
  feeAmount?: number | string | null
  feePercentage?: number | string | null
  minAmount?: number | string | null
  maxAmount?: number | string | null
  userType?: CreateTariffForm['userType']
  subscriberType?: CreateTariffForm['subscriberType']
  partnerId?: string | null
  apiPartnerId?: string | null
  partner?: { id: string; partnerName: string; partnerCode: string }
  apiPartner?: { id: string; partnerName: string; partnerType: string }
  group?: string | null
  partnerFee?: number | string | null
  rukapayFee?: number | string | null
  telecomBankCharge?: number | string | null
  governmentTax?: number | string | null
  transactionModeCode?: string | null
  transactionModeId?: string | null
  metadata?: Record<string, unknown> | null
  channel?: string | null
}

function num(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function resolveTransactionModeId(
  tariff: ApiTariffRecord,
  transactionModes?: TransactionMode[],
): string | undefined {
  if (!transactionModes?.length) return undefined

  const normalizeCode = (value: unknown): string =>
    String(value ?? '')
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_')

  const matchModeByCode = (rawCode: unknown): string | undefined => {
    const code = normalizeCode(rawCode)
    if (!code) return undefined
    const exact = transactionModes.find((m) => normalizeCode(m.code) === code)
    if (exact) return exact.id
    return undefined
  }

  const meta = tariff.metadata as Record<string, unknown> | undefined
  const candidateIds = [
    tariff.transactionModeId,
    meta?.transactionModeId,
  ].filter((c): c is string => typeof c === 'string' && c.length > 0)
  for (const id of candidateIds) {
    const mode = transactionModes.find((m) => m.id === id)
    if (mode) return mode.id
  }

  const candidates = [
    tariff.transactionModeCode,
    meta?.transactionModeCode,
    meta?.mode,
    tariff.transactionType,
  ].filter((c): c is string => typeof c === 'string' && c.length > 0)

  if (tariff.description) {
    const match = tariff.description.match(/\[Mode:\s*([^\]]+)\]/i)
    if (match?.[1]) candidates.push(match[1].trim())
  }

  for (const code of candidates) {
    const matchedId = matchModeByCode(code)
    if (matchedId) return matchedId
  }

  // Legacy aliases for older tariff rows where transactionType doesn't match modern mode codes exactly.
  const aliases: Record<string, string[]> = {
    WALLET_INIT: ['WALLET_CREATION'],
    WALLET_CREATION: ['WALLET_INIT'],
    WALLET_TO_EXTERNAL_MERCHANT: ['WALLET_TO_MERCHANT'],
    WALLET_TO_MERCHANT: ['WALLET_TO_EXTERNAL_MERCHANT'],
    MERCHANT_WITHDRAWAL: ['MERCHANT_TO_WALLET'],
  }
  const normalizedTxType = normalizeCode(tariff.transactionType)
  for (const alias of aliases[normalizedTxType] ?? []) {
    const matchedId = matchModeByCode(alias)
    if (matchedId) return matchedId
  }

  // Last fallback: use the first system mode mapped from transactionType semantics.
  const txToModeCode: Record<string, string> = {
    DEPOSIT: 'MNO_TO_WALLET',
    WITHDRAWAL: 'WALLET_TO_MNO',
    BILL_PAYMENT: 'BILL_PAYMENT',
    WALLET_TO_WALLET: 'WALLET_TO_WALLET',
    WALLET_TO_BANK: 'WALLET_TO_BANK',
    BANK_TO_WALLET: 'BANK_TO_WALLET',
    WALLET_TO_PARTNER_INSTITUTION: 'WALLET_TO_PARTNER_INSTITUTION',
    PARTNER_INSTITUTION_TO_WALLET: 'PARTNER_INSTITUTION_TO_WALLET',
  }
  const mappedCode = txToModeCode[normalizedTxType]
  if (mappedCode) {
    const matchedId = matchModeByCode(mappedCode)
    if (matchedId) return matchedId
  }

  return undefined
}

const VALID_TRANSACTION_TYPES = new Set<CreateTariffForm['transactionType']>([
  'DEPOSIT',
  'WITHDRAWAL',
  'BILL_PAYMENT',
  'SCHOOL_FEES',
  'WALLET_INIT',
  'WALLET_TO_INTERNAL_MERCHANT',
  'WALLET_TO_EXTERNAL_MERCHANT',
  'MERCHANT_WITHDRAWAL',
  'MERCHANT_TO_WALLET',
  'WALLET_TO_WALLET',
  'WALLET_TO_MNO',
  'WALLET_TO_UTILITY',
  'MNO_TO_WALLET',
  'WALLET_TO_MERCHANT',
  'WALLET_TO_BANK',
  'BANK_TO_WALLET',
  'CARD_TO_WALLET',
  'REVERSAL',
  'FEE_CHARGE',
  'CUSTOM',
  'WALLET_TO_PARTNER_INSTITUTION',
  'PARTNER_INSTITUTION_TO_WALLET',
])

function normalizeTariffType(
  tariffType: string | undefined,
  partnerId?: string,
  apiPartnerId?: string,
): CreateTariffForm['tariffType'] {
  if (tariffType === 'INTERNAL' || tariffType === 'EXTERNAL') return tariffType
  return partnerId || apiPartnerId ? 'EXTERNAL' : 'INTERNAL'
}

function normalizeTransactionType(transactionType: string): CreateTariffForm['transactionType'] {
  if (transactionType === 'WALLET_CREATION') return 'WALLET_INIT'
  if (VALID_TRANSACTION_TYPES.has(transactionType as CreateTariffForm['transactionType'])) {
    return transactionType as CreateTariffForm['transactionType']
  }
  return 'CUSTOM'
}

/** Map API tariff → form state (inverse of create submit, aligned with create form fields). */
export function mapTariffToForm(
  tariff: ApiTariffRecord,
  transactionModes?: TransactionMode[],
): CreateTariffForm {
  const apiPartnerId = tariff.apiPartnerId || tariff.apiPartner?.id || undefined
  const partnerId = tariff.partnerId || tariff.partner?.id || undefined
  const normalizedTariffType = normalizeTariffType(tariff.tariffType, partnerId, apiPartnerId)
  const partnerType = apiPartnerId
    ? ('API_PARTNER' as const)
    : partnerId
      ? ('EXTERNAL_PARTNER' as const)
      : undefined

  const rawPct = num(tariff.feePercentage, 0)
  let feePercentage = 0
  if (rawPct > 0) {
    if (partnerType === 'API_PARTNER') {
      feePercentage = rawPct > 0 && rawPct <= 1 ? rawPct * 100 : rawPct
    } else {
      feePercentage = rawPct > 0 && rawPct <= 1 ? rawPct * 100 : rawPct
    }
  }

  const txType = normalizeTransactionType(tariff.transactionType)

  const bps = (tariff.metadata as { institutionSpreadBps?: { rukapay?: number; nexen?: number } })
    ?.institutionSpreadBps

  return {
    name: tariff.name || '',
    description: tariff.description || '',
    tariffType: normalizedTariffType,
    transactionType: txType,
    network: tariff.network ?? undefined,
    transactionModeId: resolveTransactionModeId(tariff, transactionModes),
    currency: tariff.currency || 'UGX',
    feeType: tariff.feeType,
    feeAmount: num(tariff.feeAmount),
    feePercentage,
    minAmount: num(tariff.minAmount),
    maxAmount: num(tariff.maxAmount),
    userType: tariff.userType || 'SUBSCRIBER',
    subscriberType: tariff.subscriberType || 'INDIVIDUAL',
    partnerId,
    apiPartnerId,
    partnerType,
    group: tariff.group || '',
    partnerFee: num(tariff.partnerFee),
    rukapayFee: num(tariff.rukapayFee),
    telecomBankCharge: num(tariff.telecomBankCharge),
    governmentTax: num(tariff.governmentTax),
    institutionSpreadRukapayBps: Math.max(0, Math.floor(num(bps?.rukapay))),
    institutionSpreadNexenBps: Math.max(0, Math.floor(num(bps?.nexen))),
    channel: tariff.channel ?? TARIFF_CHANNEL_ALL,
    metadata: tariff.metadata ?? undefined,
  }
}
