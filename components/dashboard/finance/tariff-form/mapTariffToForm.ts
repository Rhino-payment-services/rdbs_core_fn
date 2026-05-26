import { TARIFF_CHANNEL_ALL } from '@/lib/constants/tariff-channels'
import type { TransactionMode } from '@/lib/hooks/useTransactionModes'
import type { CreateTariffForm } from './types'

export type ApiTariffRecord = {
  id: string
  name: string
  description?: string | null
  tariffType: 'INTERNAL' | 'EXTERNAL'
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

  const meta = tariff.metadata as Record<string, unknown> | undefined
  const candidates = [
    tariff.transactionModeCode,
    meta?.transactionModeCode,
    meta?.mode,
  ].filter((c): c is string => typeof c === 'string' && c.length > 0)

  if (tariff.description) {
    const match = tariff.description.match(/\[Mode:\s*([^\]]+)\]/i)
    if (match?.[1]) candidates.push(match[1].trim())
  }

  for (const code of candidates) {
    const mode = transactionModes.find((m) => m.code === code)
    if (mode) return mode.id
  }
  return undefined
}

/** Map API tariff → form state (inverse of create submit, aligned with create form fields). */
export function mapTariffToForm(
  tariff: ApiTariffRecord,
  transactionModes?: TransactionMode[],
): CreateTariffForm {
  const apiPartnerId = tariff.apiPartnerId || tariff.apiPartner?.id || undefined
  const partnerId = tariff.partnerId || tariff.partner?.id || undefined
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

  const txType =
    tariff.transactionType === 'WALLET_CREATION'
      ? 'WALLET_INIT'
      : (tariff.transactionType as CreateTariffForm['transactionType'])

  const bps = (tariff.metadata as { institutionSpreadBps?: { rukapay?: number; nexen?: number } })
    ?.institutionSpreadBps

  return {
    name: tariff.name || '',
    description: tariff.description || '',
    tariffType: tariff.tariffType,
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
