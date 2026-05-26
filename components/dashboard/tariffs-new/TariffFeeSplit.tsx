'use client'

import type { Tariff } from '@/lib/tariffs-new/types'
import { formatTariffGovernmentTax, formatTariffSplitField } from '@/lib/utils/tariffDisplay'
import { hasFeeSplit } from '@/lib/tariffs-new/utils'

export function TariffFeeSplit({ tariff, compact }: { tariff: Tariff; compact?: boolean }) {
  if (!hasFeeSplit(tariff)) {
    return <span className="text-gray-400 text-sm">—</span>
  }

  const lines: { label: string; value: string }[] = []
  const partner = formatTariffSplitField(tariff.partnerFee, tariff)
  const rukapay = formatTariffSplitField(tariff.rukapayFee, tariff)
  const telecom = formatTariffSplitField(tariff.telecomBankCharge, tariff)
  const gov = formatTariffGovernmentTax(tariff.governmentTax)

  if (partner) lines.push({ label: 'Partner', value: partner })
  if (rukapay) lines.push({ label: 'RukaPay', value: rukapay })
  if (telecom) lines.push({ label: 'Telecom', value: telecom })
  if (gov) lines.push({ label: 'Gov tax', value: gov })

  if (lines.length === 0) {
    return <span className="text-gray-400 text-sm">—</span>
  }

  if (compact) {
    return (
      <span className="text-xs text-gray-600">
        {lines.map((l) => `${l.label} ${l.value}`).join(' · ')}
      </span>
    )
  }

  return (
    <ul className="text-xs space-y-0.5 text-gray-700">
      {lines.map((l) => (
        <li key={l.label}>
          <span className="text-gray-500">{l.label}:</span>{' '}
          <span className="font-medium">{l.value}</span>
        </li>
      ))}
    </ul>
  )
}
