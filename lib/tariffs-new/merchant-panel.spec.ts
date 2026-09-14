import { describe, expect, it } from 'vitest'
import { MERCHANT_TRANSACTION_TYPES } from './constants'
import { buildMerchantBuckets, groupTariffsByTransactionType } from './utils'
import type { Tariff } from './types'

function visibleMerchantTypes(tariffs: Tariff[]) {
  const typeKeys = Object.keys(MERCHANT_TRANSACTION_TYPES)
  const byType = groupTariffsByTransactionType(tariffs, typeKeys)
  const activeTypes = typeKeys.filter((k) => (byType[k]?.length ?? 0) > 0)
  const orphanTypes = Object.keys(byType).filter(
    (k) => (byType[k]?.length ?? 0) > 0 && !typeKeys.includes(k),
  )
  return { byType, visibleTypes: [...activeTypes, ...orphanTypes] }
}

function merchantTariff(overrides: Partial<Tariff> = {}): Tariff {
  return {
    id: 't1',
    name: 'Fortbet bill',
    description: '',
    tariffType: 'MERCHANT',
    transactionType: 'BILL_PAYMENT',
    currency: 'UGX',
    feeType: 'FIXED',
    feeAmount: 1000,
    feePercentage: 0,
    minFee: 0,
    maxFee: 0,
    minAmount: 0,
    maxAmount: 1_000_000,
    userType: 'SUBSCRIBER',
    subscriberType: 'INDIVIDUAL',
    merchantId: 'fortbet-id',
    merchant: {
      id: 'fortbet-id',
      businessTradeName: 'Fortbet',
      merchantCode: '7340',
    },
    ...overrides,
  }
}

describe('merchant BILL_PAYMENT custom tariffs', () => {
  it('includes BILL_PAYMENT in merchant product types', () => {
    expect(MERCHANT_TRANSACTION_TYPES.BILL_PAYMENT?.name).toBe('Bill Payment')
  })

  it('shows Fortbet BILL_PAYMENT custom tariff as 1 product instead of empty', () => {
    const buckets = buildMerchantBuckets([merchantTariff()])
    expect(buckets).toHaveLength(1)
    expect(buckets[0].label).toBe('Fortbet')
    expect(buckets[0].sublabel).toBe('7340')
    expect(buckets[0].tariffs).toHaveLength(1)

    const { visibleTypes, byType } = visibleMerchantTypes(buckets[0].tariffs)
    expect(visibleTypes).toEqual(['BILL_PAYMENT'])
    expect(byType.BILL_PAYMENT).toHaveLength(1)
  })

  it('still shows unknown transaction types as orphan products', () => {
    const { visibleTypes, byType } = visibleMerchantTypes([
      merchantTariff({ transactionType: 'SOME_FUTURE_TYPE' }),
    ])
    expect(visibleTypes).toEqual(['SOME_FUTURE_TYPE'])
    expect(byType.SOME_FUTURE_TYPE).toHaveLength(1)
  })
})
