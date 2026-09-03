import { describe, expect, it } from 'vitest'
import {
  getBookedRukapayFeeForLedgerExport,
  getNormalizedPartnerFee,
  getNormalizedRukapayFee,
  isPlatformRevenueCreditedInRange,
  resolveExportFeeColumns,
  resolveRukapayFeeForLedgerExport,
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

  it('resolveExportFeeColumns returns the actual/intended fee, not the booked accrual amount', () => {
    // resolveExportFeeColumns must NOT collapse to platformRevenueAccrual.amount — doing so
    // previously caused most export rows to show 0 whenever any accrual existed (even a
    // zero-amount or out-of-range one), because callers use this value as their fallback
    // when the booked-in-range amount (via getBookedRukapayFeeForLedgerExport) is 0.
    const cols = resolveExportFeeColumns(juneAccrualTx)
    expect(cols.rukapayFee).toBe(999)
  })

  it('per-row export fee falls back to the actual fee when accrual is 0/absent for the period', () => {
    const txWithZeroAccrual = {
      ...juneAccrualTx,
      platformRevenueAccrual: { amount: 0, creditedAt: '2026-06-15T12:00:00.000Z' },
    }
    expect(
      resolveRukapayFeeForLedgerExport(txWithZeroAccrual, '2026-06-01', '2026-06-30'),
    ).toBe(999)
  })

  it('per-row export fee falls back when accrual is missing entirely (dashboard shows fee, export was 0)', () => {
    const tx = {
      id: 'GT0U2ETQ3Q70',
      rukapayFee: 96.8,
      thirdPartyFee: 387.2,
      type: 'MNO_TO_WALLET',
      channel: 'API',
      partnerId: 'lipad',
      partner: { partnerName: 'LIPAD' },
      metadata: {
        feeBreakdown: { rukapayFee: 96.8, partnerFee: 387.2, totalFee: 484 },
        transactionModeCode: 'PARTNER_COLLECT_MNO',
      },
    }
    expect(getBookedRukapayFeeForLedgerExport(tx, '2026-04-01', '2026-05-31')).toBe(0)
    expect(resolveRukapayFeeForLedgerExport(tx, '2026-04-01', '2026-05-31')).toBe(96.8)
  })

  it('per-row export fee keeps negative booked adjustments', () => {
    const tx = {
      rukapayFee: 24,
      platformRevenueAccrual: {
        amount: -24,
        creditedAt: '2026-04-30T20:56:00.000Z',
      },
    }
    expect(resolveRukapayFeeForLedgerExport(tx, '2026-04-01', '2026-04-30')).toBe(-24)
  })

  it('getBookedRukapayFeeForLedgerExport returns 0 for failed tx without accrual', () => {
    expect(
      getBookedRukapayFeeForLedgerExport(
        { id: 'tx-failed', status: 'FAILED', rukapayFee: 500 },
        '2026-06-01',
        '2026-06-30',
      ),
    ).toBe(0)
  })

  it('getBookedRukapayFeeForLedgerExport returns booked amount when credited in range', () => {
    expect(
      getBookedRukapayFeeForLedgerExport(juneAccrualTx, '2026-06-01', '2026-06-30'),
    ).toBe(500)
  })

  it('getBookedRukapayFeeForLedgerExport returns 0 when accrual credited outside range', () => {
    expect(
      getBookedRukapayFeeForLedgerExport(
        {
          platformRevenueAccrual: {
            amount: 500,
            creditedAt: '2026-07-01T00:00:00.000+03:00',
          },
        },
        '2026-06-01',
        '2026-06-30',
      ),
    ).toBe(0)
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

describe('getNormalizedPartnerFee', () => {
  it('reads feeBreakdown.partnerFee on a loan collection', () => {
    expect(
      getNormalizedPartnerFee({
        type: 'LOAN_REPAYMENT',
        fee: 150,
        processingFee: 150,
        metadata: {
          feeBreakdown: { rukapayFee: 0, partnerFee: 150 },
          partnerFee: 150,
        },
      }),
    ).toBe(150)
  })

  it('falls back to processingFee on loan types when breakdown is missing', () => {
    expect(
      getNormalizedPartnerFee({
        type: 'LOAN_DISBURSEMENT',
        processingFee: 80,
        metadata: {},
      }),
    ).toBe(80)
  })
})
