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

  it('shows Internal for wallet-to-wallet even when API partner metadata is present', () => {
    const label = resolvePaymentPartnerLabel({
      type: 'WALLET_TO_WALLET',
      metadata: { apiPartnerName: 'LIPAD', isApiPartnerTransaction: true },
      partner: { partnerName: 'LIPAD' },
    })
    expect(label).toBe('Internal')
  })

  it('shows Internal for merchant-to-wallet', () => {
    const label = resolvePaymentPartnerLabel({
      type: 'MERCHANT_TO_WALLET',
      metadata: { apiPartnerName: 'BOBPLUS' },
      partner: { partnerName: 'BOBPLUS' },
    })
    expect(label).toBe('Internal')
  })

  it('still resolves external rail for wallet-to-wallet sweeps', () => {
    const label = resolvePaymentPartnerLabel({
      type: 'WALLET_TO_WALLET',
      metadata: { sweepToDisbursement: true, partnerCode: 'MTN' },
    })
    expect(label).toBe('MTN')
  })

  it('shows approving API partner for confirmed partner subscriber withdrawal', () => {
    const label = resolvePaymentPartnerLabel({
      type: 'WITHDRAWAL',
      direction: 'DEBIT',
      partnerId: 'partner-1',
      partner: { partnerName: 'NEXT ALIGN B' },
      metadata: {
        mode: 'WITHDRAW',
        confirmedBy: 'PARTNER',
        partnerName: 'NEXT ALIGN B',
      },
    })
    expect(label).toBe('NEXT ALIGN B')
  })

  it('shows approving API partner for partner subscriber deposit', () => {
    const label = resolvePaymentPartnerLabel({
      type: 'DEPOSIT',
      direction: 'CREDIT',
      partnerId: 'partner-1',
      partner: { partnerName: 'ABC AGENT' },
      metadata: { mode: 'DEPOSIT' },
    })
    expect(label).toBe('ABC AGENT')
  })

  it('does not use API partner name for pending customer withdraw without approval', () => {
    const label = resolvePaymentPartnerLabel({
      type: 'WITHDRAWAL',
      direction: 'DEBIT',
      metadata: { mode: 'WITHDRAW', initiatedBy: 'CUSTOMER' },
    })
    expect(label).toBeNull()
  })
})
