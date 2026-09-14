/** Merchant-level super merchant helpers (not user subscriberType). */

export type MerchantLike = {
  id?: string
  userId?: string
  merchantCode?: string
  code?: string
  businessTradeName?: string
  name?: string
  isSuperMerchant?: boolean
}

export type SubscriberLike = {
  id?: string
  merchants?: MerchantLike[]
}

export function getMerchantsForSubscriber(
  subscriber: SubscriberLike | null | undefined,
  allMerchants: MerchantLike[] = [],
): MerchantLike[] {
  if (!subscriber) return []
  const userId = subscriber.id
  const fromUser = subscriber.merchants || []
  if (fromUser.length > 0) return fromUser
  if (!userId) return []
  return allMerchants.filter((m) => m.userId === userId)
}

export function getSuperMerchantAccounts(
  subscriber: SubscriberLike | null | undefined,
  allMerchants: MerchantLike[] = [],
): MerchantLike[] {
  return getMerchantsForSubscriber(subscriber, allMerchants).filter(
    (m) => m.isSuperMerchant === true,
  )
}

export function getPromotableMerchants(
  subscriber: SubscriberLike | null | undefined,
  allMerchants: MerchantLike[] = [],
): MerchantLike[] {
  return getMerchantsForSubscriber(subscriber, allMerchants).filter(
    (m) => !m.isSuperMerchant,
  )
}

export function hasSuperMerchantAccount(
  subscriber: SubscriberLike | null | undefined,
  allMerchants: MerchantLike[] = [],
): boolean {
  return getSuperMerchantAccounts(subscriber, allMerchants).length > 0
}

export function hasPromotableMerchant(
  subscriber: SubscriberLike | null | undefined,
  allMerchants: MerchantLike[] = [],
): boolean {
  return getPromotableMerchants(subscriber, allMerchants).length > 0
}

export function toMerchantOption(m: MerchantLike) {
  return {
    id: m.id!,
    merchantCode: m.merchantCode || m.code || '',
    businessTradeName: m.businessTradeName || m.name || 'Unknown',
    isSuperMerchant: m.isSuperMerchant,
  }
}
