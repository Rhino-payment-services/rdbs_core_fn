/**
 * Uganda MSISDN helpers (aligned with rdbs_core normalizeUgandaPhoneForStorage).
 */

export function canonicalUgandaPhone(phone: string): string | null {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 10 && digits.startsWith('0')) {
    return `256${digits.slice(1)}`
  }
  if (digits.length === 9) {
    return `256${digits}`
  }
  if (digits.length === 12 && digits.startsWith('256')) {
    return digits
  }
  return null
}

export function isMeaningfulUgandaPhone(phone: string): boolean {
  const canonical = canonicalUgandaPhone(phone)
  return !!canonical && /^256[0-9]{9}$/.test(canonical)
}

export function formatUgandaPhoneDisplay(phone: string): string {
  const canonical = canonicalUgandaPhone(phone)
  if (!canonical) return phone
  return `+${canonical}`
}
