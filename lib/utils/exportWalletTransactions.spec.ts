import { describe, expect, it } from 'vitest'
import { buildWalletTransactionsExportQuery } from './exportWalletTransactions'

describe('buildWalletTransactionsExportQuery', () => {
  it('includes startDate and endDate when provided', () => {
    const q = buildWalletTransactionsExportQuery({
      page: 1,
      pageSize: 1000,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      skipCount: true,
    })
    const params = new URLSearchParams(q)
    expect(params.get('page')).toBe('1')
    expect(params.get('limit')).toBe('1000')
    expect(params.get('startDate')).toBe('2026-10-01')
    expect(params.get('endDate')).toBe('2026-10-31')
    expect(params.get('skipCount')).toBe('true')
  })

  it('omits dates when not provided', () => {
    const q = buildWalletTransactionsExportQuery({
      page: 2,
      pageSize: 200,
      walletId: 'w-1',
    })
    const params = new URLSearchParams(q)
    expect(params.get('walletId')).toBe('w-1')
    expect(params.has('startDate')).toBe(false)
    expect(params.has('endDate')).toBe(false)
    expect(params.has('skipCount')).toBe(false)
  })
})
