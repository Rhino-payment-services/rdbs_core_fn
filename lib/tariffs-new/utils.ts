import type { PartnerBucket, Tariff } from './types'
import { TRANSACTION_TYPE_LABELS } from './constants'

export function parseTariffsFromResponse(data: unknown): Tariff[] {
  const d = data as Record<string, unknown> | undefined
  if (!d) return []
  const nested = d.data as Record<string, unknown> | undefined
  return (
    (d.tariffs as Tariff[]) ||
    (nested?.tariffs as Tariff[]) ||
    (nested?.data as Tariff[]) ||
    []
  )
}

export function getTransactionTypeLabel(type: string, tariff?: Tariff): string {
  if (type === 'CUSTOM' && tariff?.transactionModeCode) {
    return tariff.transactionModeCode
  }
  const md = tariff?.metadata as { mode?: string } | null | undefined
  if (type === 'CUSTOM' && md?.mode) {
    return String(md.mode)
  }
  return TRANSACTION_TYPE_LABELS[type] || type
}

export function formatFeeAmount(tariff: Tariff): string {
  if (tariff.feeType === 'FIXED') {
    return `${Number(tariff.feeAmount).toLocaleString()} ${tariff.currency}`
  }
  if (tariff.feeType === 'PERCENTAGE') {
    if (tariff.feePercentage !== undefined && tariff.feePercentage !== null) {
      const n = Number(tariff.feePercentage)
      const pct = n > 0 && n <= 1 ? n * 100 : n
      return `${pct}%`
    }
    return 'N/A'
  }
  if (tariff.feeType === 'HYBRID') {
    const n = Number(tariff.feePercentage)
    const pct =
      tariff.feePercentage != null && n > 0 && n <= 1
        ? `${(n * 100).toFixed(2)}%`
        : tariff.feePercentage != null
          ? `${n}%`
          : 'N/A'
    return `${Number(tariff.feeAmount).toLocaleString()} ${tariff.currency} + ${pct}`
  }
  return 'N/A'
}

export function formatAmountRange(tariff: Tariff): string {
  const cur = tariff.currency || 'UGX'
  if (tariff.minAmount != null && tariff.maxAmount != null) {
    return `${Number(tariff.minAmount).toLocaleString()} – ${Number(tariff.maxAmount).toLocaleString()} ${cur}`
  }
  if (tariff.minAmount != null) {
    return `From ${Number(tariff.minAmount).toLocaleString()} ${cur}`
  }
  if (tariff.maxAmount != null) {
    return `Up to ${Number(tariff.maxAmount).toLocaleString()} ${cur}`
  }
  return 'Any amount'
}

export function getTariffPartnerKey(tariff: Tariff): string {
  if (tariff.apiPartner?.id) return `api:${tariff.apiPartner.id}`
  if (tariff.apiPartnerId) return `api:${tariff.apiPartnerId}`
  if (tariff.partner?.partnerCode) return `ext:${tariff.partner.partnerCode}`
  if (tariff.partnerId) return `ext:${tariff.partnerId}`
  return 'general'
}

export function getTariffPartnerLabel(tariff: Tariff): string {
  if (tariff.apiPartner?.partnerName) return tariff.apiPartner.partnerName
  if (tariff.partner?.partnerName) return tariff.partner.partnerName
  return 'Platform (no partner)'
}

export function getTariffPartnerSublabel(tariff: Tariff): string | undefined {
  if (tariff.apiPartner?.partnerType) return tariff.apiPartner.partnerType
  if (tariff.partner?.partnerCode) return tariff.partner.partnerCode
  return undefined
}

export function sortTariffTiers(tariffs: Tariff[]): Tariff[] {
  return [...tariffs].sort((a, b) => {
    const minA = Number(a.minAmount) || 0
    const minB = Number(b.minAmount) || 0
    if (minA !== minB) return minA - minB
    const gA = a.group || ''
    const gB = b.group || ''
    if (gA !== gB) return gA.localeCompare(gB)
    return (a.name || '').localeCompare(b.name || '')
  })
}

export function groupTariffsByTransactionType(
  tariffs: Tariff[],
  typeKeys: string[],
): Record<string, Tariff[]> {
  const map: Record<string, Tariff[]> = {}
  for (const key of typeKeys) {
    map[key] = []
  }
  for (const t of tariffs) {
    let type = t.transactionType
    if (type === 'WALLET_CREATION') type = 'WALLET_INIT'
    if (!map[type]) map[type] = []
    map[type].push(t)
  }
  for (const key of Object.keys(map)) {
    map[key] = sortTariffTiers(map[key])
  }
  return map
}

export function buildExternalPartnerBuckets(externalTariffs: Tariff[]): PartnerBucket[] {
  const byKey = new Map<string, PartnerBucket>()

  for (const tariff of externalTariffs) {
    const key = getTariffPartnerKey(tariff)
    if (!byKey.has(key)) {
      const kind = key.startsWith('api:')
        ? 'api'
        : key.startsWith('ext:')
          ? 'external'
          : 'general'
      byKey.set(key, {
        key,
        label: getTariffPartnerLabel(tariff),
        sublabel: getTariffPartnerSublabel(tariff),
        kind,
        tariffs: [],
      })
    }
    byKey.get(key)!.tariffs.push(tariff)
  }

  return Array.from(byKey.values()).sort((a, b) => {
    if (a.kind === 'general') return 1
    if (b.kind === 'general') return -1
    return a.label.localeCompare(b.label)
  })
}

export function countTariffStatuses(tariffs: Tariff[]) {
  let active = 0
  let draft = 0
  let pending = 0
  for (const t of tariffs) {
    const status = String(t.status || t.approvalStatus || '')
    if (status === 'ACTIVE' || status === 'APPROVED' || (!status && t.isActive)) active++
    else if (status === 'DRAFT') draft++
    else if (!status && !t.isActive) draft++
    else if (status === 'PENDING_APPROVAL' || status === 'PENDING') pending++
  }
  return { active, draft, pending, total: tariffs.length }
}

export function hasFeeSplit(tariff: Tariff): boolean {
  return (
    tariff.partnerFee != null ||
    tariff.rukapayFee != null ||
    tariff.telecomBankCharge != null ||
    tariff.governmentTax != null
  )
}
