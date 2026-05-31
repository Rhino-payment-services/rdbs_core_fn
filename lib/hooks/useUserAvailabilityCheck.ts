import { useCallback, useState } from 'react'
import api from '@/lib/axios'
import { normalizePhoneForSearch } from '@/lib/utils'
import { isMeaningfulUgandaPhone } from '@/lib/utils/uganda-phone'
import type { UserSearchResult } from './useUserSearch'

export type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'

export type PhoneAccountSummary = {
  id: string
  email: string | null
  phone: string | null
  userType: string
  status: string
  walletCount: number
  wallets: Array<{
    id: string
    walletType: string
    balance: number
    currency: string
    isActive: boolean
  }>
}

export type EmailAvailabilityResult = {
  status: AvailabilityStatus
  message?: string
}

export type PhoneAvailabilityResult = {
  status: AvailabilityStatus
  message?: string
  accounts?: PhoneAccountSummary[]
  /** Grant staff portal login on existing subscriber (keeps phone & wallets) */
  canGrantStaffOnExisting?: boolean
  existingUserId?: string
  /** Multiple accounts on same phone — use duplicates page */
  hasDuplicateAccounts?: boolean
}

type CheckAvailabilityResponse = {
  email?: {
    available: boolean
    message: string
  }
  phone?: {
    canonical: string
    accounts: PhoneAccountSummary[]
    canGrantStaffOnExisting: boolean
    message: string
  }
}

function extractApiErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string }
  return e?.response?.data?.message || e?.message || 'Check failed'
}

function httpStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status
}

function isAvailabilityEndpointMissing(err: unknown): boolean {
  const status = httpStatus(err)
  return status === 404 || status === 405
}

/** Existing customer / wallet holder who can receive staff portal login on the same profile */
export function canGrantStaffOnUser(user: UserSearchResult): boolean {
  if (user.userType === 'STAFF') return false
  const hasWallet = (user.wallets?.length ?? 0) > 0
  return user.userType === 'SUBSCRIBER' || hasWallet || !!user.subscriberType
}

async function searchUserByEmail(email: string): Promise<UserSearchResult | null> {
  try {
    const { data } = await api.get<UserSearchResult>(
      `/users/search?email=${encodeURIComponent(email.trim())}`,
    )
    return data
  } catch (err) {
    if (httpStatus(err) === 404) return null
    throw err
  }
}

async function searchUserByPhone(phone: string): Promise<UserSearchResult | null> {
  const normalized = normalizePhoneForSearch(phone)
  try {
    const { data } = await api.get<UserSearchResult>(
      `/users/search?phone=${encodeURIComponent(normalized)}`,
    )
    return data
  } catch (err) {
    if (httpStatus(err) === 404) return null
    throw err
  }
}

function accountFromSearchUser(user: UserSearchResult): PhoneAccountSummary {
  return {
    id: user.id,
    email: user.email ?? null,
    phone: user.phone ?? null,
    userType: user.userType,
    status: user.status,
    walletCount: user.wallets?.length ?? 0,
    wallets: (user.wallets ?? []).map((w) => ({
      id: w.id,
      walletType: 'PERSONAL',
      balance: 0,
      currency: 'UGX',
      isActive: true,
    })),
  }
}

function canGrantOnAccount(account: PhoneAccountSummary): boolean {
  if (account.userType === 'STAFF') return false
  return account.userType === 'SUBSCRIBER' || account.walletCount > 0
}

async function checkEmailViaSearch(email: string): Promise<EmailAvailabilityResult> {
  const user = await searchUserByEmail(email)
  if (user) {
    return {
      status: 'taken',
      message: `This email is already registered (${user.userType || 'user'}).`,
    }
  }
  return {
    status: 'available',
    message: 'Email is available for staff login.',
  }
}

async function checkPhoneViaSearch(phone: string): Promise<PhoneAvailabilityResult> {
  const user = await searchUserByPhone(phone)
  if (!user) {
    return {
      status: 'available',
      message: 'No customer account on this number — a new staff-only account will be created.',
    }
  }

  if (canGrantStaffOnUser(user)) {
    return {
      status: 'available',
      message:
        'Customer wallet found — staff portal access will be added to this profile (phone and wallet unchanged).',
      accounts: [accountFromSearchUser(user)],
      canGrantStaffOnExisting: true,
      existingUserId: user.id,
    }
  }

  return {
    status: 'taken',
    message: `This phone is linked to a ${user.userType || 'user'} account that cannot receive staff access here.`,
    accounts: [accountFromSearchUser(user)],
  }
}

export function useUserAvailabilityCheck() {
  const [emailResult, setEmailResult] = useState<EmailAvailabilityResult>({ status: 'idle' })
  const [phoneResult, setPhoneResult] = useState<PhoneAvailabilityResult>({ status: 'idle' })

  const checkEmail = useCallback(async (email: string): Promise<EmailAvailabilityResult> => {
    const trimmed = email.trim()
    if (!trimmed) {
      const r: EmailAvailabilityResult = { status: 'invalid', message: 'Email is required' }
      setEmailResult(r)
      return r
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      const r: EmailAvailabilityResult = { status: 'invalid', message: 'Enter a valid email address' }
      setEmailResult(r)
      return r
    }

    setEmailResult({ status: 'checking' })
    try {
      const { data } = await api.get<CheckAvailabilityResponse>(
        `/admin/users/check-availability?email=${encodeURIComponent(trimmed)}`,
      )
      const block = data.email
      if (!block) {
        const r = await checkEmailViaSearch(trimmed)
        setEmailResult(r)
        return r
      }
      if (block.available) {
        const r: EmailAvailabilityResult = {
          status: 'available',
          message: block.message || 'Email is available.',
        }
        setEmailResult(r)
        return r
      }
      const r: EmailAvailabilityResult = {
        status: 'taken',
        message: block.message || 'Email is already registered.',
      }
      setEmailResult(r)
      return r
    } catch (err) {
      if (isAvailabilityEndpointMissing(err)) {
        try {
          const r = await checkEmailViaSearch(trimmed)
          setEmailResult(r)
          return r
        } catch (fallbackErr) {
          const r: EmailAvailabilityResult = {
            status: 'error',
            message: extractApiErrorMessage(fallbackErr),
          }
          setEmailResult(r)
          return r
        }
      }
      const r: EmailAvailabilityResult = { status: 'error', message: extractApiErrorMessage(err) }
      setEmailResult(r)
      return r
    }
  }, [])

  const checkPhone = useCallback(async (phone: string): Promise<PhoneAvailabilityResult> => {
    const trimmed = phone.trim()
    if (!trimmed || trimmed === '+256') {
      const r: PhoneAvailabilityResult = {
        status: 'available',
        message: 'No phone linked — a new staff-only account will be created (email login).',
      }
      setPhoneResult(r)
      return r
    }

    if (!isMeaningfulUgandaPhone(trimmed)) {
      const r: PhoneAvailabilityResult = {
        status: 'invalid',
        message: 'Enter a full Uganda number (e.g. 0700123456 or +256700123456).',
      }
      setPhoneResult(r)
      return r
    }

    setPhoneResult({ status: 'checking' })
    try {
      const { data } = await api.get<CheckAvailabilityResponse>(
        `/admin/users/check-availability?phone=${encodeURIComponent(trimmed)}`,
      )
      const block = data.phone
      if (!block) {
        const r = await checkPhoneViaSearch(trimmed)
        setPhoneResult(r)
        return r
      }

      const accounts = block.accounts || []
      if (accounts.length === 0) {
        const r: PhoneAvailabilityResult = {
          status: 'available',
          message: block.message || 'No customer account on this number.',
        }
        setPhoneResult(r)
        return r
      }

      if (accounts.length > 1) {
        const r: PhoneAvailabilityResult = {
          status: 'taken',
          message: block.message,
          accounts,
          hasDuplicateAccounts: true,
          canGrantStaffOnExisting: false,
        }
        setPhoneResult(r)
        return r
      }

      const only = accounts[0]
      const canGrant =
        block.canGrantStaffOnExisting || canGrantOnAccount(only)

      if (canGrant) {
        const r: PhoneAvailabilityResult = {
          status: 'available',
          message:
            block.message ||
            'Customer account found — staff portal access will be added on this profile (wallet unchanged).',
          accounts,
          canGrantStaffOnExisting: true,
          existingUserId: only.id,
        }
        setPhoneResult(r)
        return r
      }

      const r: PhoneAvailabilityResult = {
        status: 'taken',
        message: block.message || 'This phone cannot be used for staff access.',
        accounts,
      }
      setPhoneResult(r)
      return r
    } catch (err) {
      if (isAvailabilityEndpointMissing(err)) {
        try {
          const r = await checkPhoneViaSearch(trimmed)
          setPhoneResult(r)
          return r
        } catch (fallbackErr) {
          const r: PhoneAvailabilityResult = {
            status: 'error',
            message: extractApiErrorMessage(fallbackErr),
          }
          setPhoneResult(r)
          return r
        }
      }
      const r: PhoneAvailabilityResult = { status: 'error', message: extractApiErrorMessage(err) }
      setPhoneResult(r)
      return r
    }
  }, [])

  const reset = useCallback(() => {
    setEmailResult({ status: 'idle' })
    setPhoneResult({ status: 'idle' })
  }, [])

  return {
    emailResult,
    phoneResult,
    checkEmail,
    checkPhone,
    reset,
  }
}
