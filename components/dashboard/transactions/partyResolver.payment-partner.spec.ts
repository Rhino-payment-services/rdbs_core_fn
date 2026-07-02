import { describe, expect, it } from 'vitest'
import { resolvePaymentPartnerLabel } from '@/components/dashboard/transactions/partyResolver'

describe('resolvePaymentPartnerLabel', () => {
  it('uses metadata.partnerCode for any external rail (not limited to MTN/Airtel/ABC)', () => {
    const label = resolvePaymentPartnerLabel({
      metadata: { partnerCode: 'newpay' },
      partner: { partnerName: 'LIPAD' },
    })
    expect(label).toBe('NEWPAY')
  })

  it('uses partnerMapping.partnerCode when metadata has no code', () => {
    const label = resolvePaymentPartnerLabel({
      metadata: {},
      partnerMapping: {
        partner: { partnerCode: 'pegasus', partnerName: 'Pegasus Technology' },
      },
    })
    expect(label).toBe('PEGASUS')
  })

  it('derives rail from mnoProvider metadata', () => {
    const label = resolvePaymentPartnerLabel({
      metadata: { mnoProvider: 'Airtel' },
      type: 'MNO_TO_WALLET',
    })
    expect(label).toBe('Airtel')
  })

  it('does not use API gateway partner name when metadata has MNO rail code', () => {
    const label = resolvePaymentPartnerLabel({
      metadata: { partnerCode: 'MTN', apiPartnerName: 'LIPAD' },
      partner: { partnerName: 'LIPAD' },
    })
    expect(label).toBe('MTN')
  })
})
