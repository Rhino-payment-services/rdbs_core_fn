'use client'

import type { Tariff } from '@/lib/tariffs-new/types'
import { formatTariffGovernmentTax, formatTariffSplitField } from '@/lib/utils/tariffDisplay'
import { hasFeeSplit } from '@/lib/tariffs-new/utils'

/**
 * Returns true when the telecom split is a fixed UGX deduction from a percentage fee
 * (e.g. "1.5% total, 600 UGX to telecom, remainder to RukaPay").
 * Mirrors backend tariffSplitFieldsAreFixedUgx logic.
 */
function isPercentageWithFixedUgxTelecom(tariff: Tariff): boolean {
  if (tariff.feeType !== 'PERCENTAGE') return false
  const n = Number(tariff.telecomBankCharge)
  return Number.isFinite(n) && Math.abs(n) > 100
}

export function TariffFeeSplit({ tariff, compact }: { tariff: Tariff; compact?: boolean }) {
  if (!hasFeeSplit(tariff)) {
    return <span className="text-gray-400 text-sm">—</span>
  }

  const lines: { label: string; value: string; dim?: boolean }[] = []
  const partner = formatTariffSplitField(tariff.partnerFee, tariff)
  const rukapay = formatTariffSplitField(tariff.rukapayFee, tariff)
  const telecom = formatTariffSplitField(tariff.telecomBankCharge, tariff)
  const gov = formatTariffGovernmentTax(tariff.governmentTax)

  const residualRukapay = !rukapay && isPercentageWithFixedUgxTelecom(tariff)

  if (partner) lines.push({ label: 'Partner', value: partner })
  if (rukapay) lines.push({ label: 'RukaPay', value: rukapay })
  else if (residualRukapay) lines.push({ label: 'RukaPay', value: 'Residual', dim: true })
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
          <span className={l.dim ? 'text-gray-400 italic' : 'font-medium'}>{l.value}</span>
        </li>
      ))}
    </ul>
  )
}
