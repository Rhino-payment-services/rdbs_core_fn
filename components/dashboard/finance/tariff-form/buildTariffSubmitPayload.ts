import { TARIFF_CHANNEL_ALL } from '@/lib/constants/tariff-channels'
import type { CreateTariffForm } from './types'

const ALLOWED_TRANSACTION_TYPES = [
  'DEPOSIT',
  'WITHDRAWAL',
  'BILL_PAYMENT',
  'WALLET_CREATION',
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
] as const

export function buildTariffSubmitPayload(
  form: CreateTariffForm,
  totalFeeAmount: number,
): Record<string, unknown> {
  const validTransactionType = ALLOWED_TRANSACTION_TYPES.includes(
    form.transactionType as (typeof ALLOWED_TRANSACTION_TYPES)[number],
  )
    ? form.transactionType
    : 'CUSTOM'

  const clampBps = (n: number) =>
    Math.max(0, Math.min(10000, Math.floor(Number.isFinite(n) ? n : 0)))

  const institutionMetadata =
    validTransactionType === 'WALLET_TO_PARTNER_INSTITUTION'
      ? {
          ...(typeof form.metadata === 'object' && form.metadata !== null ? form.metadata : {}),
          institutionSpreadBps: {
            rukapay: clampBps(Number(form.institutionSpreadRukapayBps)),
            nexen: clampBps(Number(form.institutionSpreadNexenBps)),
          },
        }
      : form.metadata || undefined

  return {
    ...form,
    channel:
      form.channel && form.channel !== TARIFF_CHANNEL_ALL
        ? form.channel.trim().toUpperCase()
        : undefined,
    transactionType: validTransactionType,
    feeType:
      form.tariffType === 'EXTERNAL' && validTransactionType === 'MNO_TO_WALLET'
        ? 'PERCENTAGE'
        : form.feeType,
    feeAmount: form.tariffType === 'EXTERNAL' ? totalFeeAmount : form.feeAmount,
    feePercentage: form.feePercentage
      ? form.partnerType === 'API_PARTNER'
        ? Number(form.feePercentage) / 100
        : Number(form.feePercentage)
      : undefined,
    governmentTax: form.governmentTax || undefined,
    metadata: institutionMetadata,
    description: form.description || undefined,
    minAmount: form.minAmount || undefined,
    maxAmount: form.maxAmount || undefined,
    userType: form.userType || undefined,
    subscriberType: form.subscriberType || undefined,
    network: form.network || undefined,
    partnerId: form.partnerId || undefined,
    apiPartnerId: form.apiPartnerId || undefined,
    group: form.group || undefined,
    partnerFee: form.partnerFee ?? undefined,
    rukapayFee: form.rukapayFee ?? undefined,
    telecomBankCharge: form.telecomBankCharge ?? undefined,
    partnerType: undefined,
    institutionSpreadRukapayBps: undefined,
    institutionSpreadNexenBps: undefined,
  }
}
