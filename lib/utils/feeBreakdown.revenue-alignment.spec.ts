import { describe, expect, it } from 'vitest'
import {
  getNormalizedRukapayFee,
  isPlatformRevenueCreditedInRange,
  resolveExportFeeColumns,
  sumPlatformRevenueAccrualsInRange,
} from './feeBreakdown'

/** EAT bounds used by backend parsePlatformRevenueDateBound — must stay in sync. */
const EAT_JUNE_2026 = {
  start: new Date('2026-06-01T00:00:00.000+03:00'),
  end: new Date('2026-06-30T23:59:59.999+03:00'),
}

describe('revenue alignment — export column L vs dashboard booked revenue', () => {
  const juneAccrualTx = {
    id: 'tx-1',
    rukapayFee: 999,
    platformRevenueAccrual: {
      amount: 500,
      creditedAt: '2026-06-15T12:00:00.000Z',
      currency: 'UGX',
      status: 'CREDITED',
    },
  }

  it('getNormalizedRukapayFee prefers booked platformRevenueAccrual.amount over transaction fee fields', () => {
    expect(getNormalizedRukapayFee(juneAccrualTx)).toBe(500)
  })

  it('resolveExportFeeColumns prefers booked platformRevenueAccrual.amount for the RukaPay Fee column', () => {
    const cols = resolveExportFeeColumns(juneAccrualTx)
    expect(cols.rukapayFee).toBe(500)
  })

  it('isPlatformRevenueCreditedInRange uses the same EAT calendar window as the dashboard', () => {
    expect(
      isPlatformRevenueCreditedInRange(juneAccrualTx.platformRevenueAccrual.creditedAt, '2026-06-01', '2026-06-30'),
    ).toBe(true)
    expect(
      isPlatformRevenueCreditedInRange('2026-05-31T23:59:59.000+03:00', '2026-06-01', '2026-06-30'),
    ).toBe(false)
    expect(
      isPlatformRevenueCreditedInRange('2026-07-01T00:00:00.000+03:00', '2026-06-01', '2026-06-30'),
    ).toBe(false)
  })

  it('includes accruals credited at the last moment of the EAT end bound', () => {
    expect(
      isPlatformRevenueCreditedInRange(EAT_JUNE_2026.end.toISOString(), '2026-06-01', '2026-06-30'),
    ).toBe(true)
  })

  it('sumPlatformRevenueAccrualsInRange equals manual sum of booked amounts in range', () => {
    const transactions = [
      {
        platformRevenueAccrual: { amount: 100, creditedAt: '2026-06-01T00:00:00.000+03:00' },
      },
      {
        platformRevenueAccrual: { amount: -30, creditedAt: '2026-06-30T23:59:59.999+03:00' },
      },
      {
        platformRevenueAccrual: { amount: 9999, creditedAt: '2026-07-01T00:00:00.000+03:00' },
      },
      {
        platformRevenueAccrual: null,
      },
    ]

    expect(sumPlatformRevenueAccrualsInRange(transactions, '2026-06-01', '2026-06-30')).toBe(70)
  })

  it('export column sum matches getNormalizedRukapayFee row sum when every row has an in-range accrual', () => {
    const transactions = [
      { ...juneAccrualTx, platformRevenueAccrual: { amount: 200, creditedAt: '2026-06-10T10:00:00.000Z' } },
      { ...juneAccrualTx, platformRevenueAccrual: { amount: -15, creditedAt: '2026-06-20T10:00:00.000Z' } },
      { ...juneAccrualTx, platformRevenueAccrual: { amount: 315.5, creditedAt: '2026-06-25T10:00:00.000Z' } },
    ]

    const columnSum = Number(
      transactions.reduce((sum, tx) => sum + getNormalizedRukapayFee(tx), 0).toFixed(2),
    )
    const accrualSum = sumPlatformRevenueAccrualsInRange(transactions, '2026-06-01', '2026-06-30')

    expect(columnSum).toBe(500.5)
    expect(accrualSum).toBe(columnSum)
  })
})
