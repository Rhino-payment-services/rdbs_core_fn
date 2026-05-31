import { useCallback, useState } from 'react'
import api from '@/lib/axios'
import { normalizePhoneForSearch } from '@/lib/utils'
import { isMeaningfulUgandaPhone } from '@/lib/utils/uganda-phone'
import type { UserSearchResult } from './useUserSearch'

export type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'

export type EmailAvailabilityResult = {
  status: AvailabilityStatus
  user?: UserSearchResult
  message?: string
}

export type PhoneAvailabilityResult = {
  status: AvailabilityStatus
  user?: UserSearchResult
  message?: string
  /** True when number belongs to a subscriber (wallet) account */
  isSubscriberConflict?: boolean
}

function extractApiErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string }
  return e?.response?.data?.message || e?.message || 'Check failed'
}

async function fetchUserByEmail(email: string): Promise<UserSearchResult | null> {
  try {
    const response = await api.get(`/users/search?email=${encodeURIComponent(email.trim())}`)
    return response.data
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) return null
    throw err
  }
}

async function fetchUserByPhone(phone: string): Promise<UserSearchResult | null> {
  const normalized = normalizePhoneForSearch(phone)
  try {
    const response = await api.get(`/users/search?phone=${encodeURIComponent(normalized)}`)
    return response.data
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) return null
    throw err
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
      const user = await fetchUserByEmail(trimmed)
      if (user) {
        const r: EmailAvailabilityResult = {
          status: 'taken',
          user,
          message: `This email is already registered (${user.userType || 'user'}).`,
        }
        setEmailResult(r)
        return r
      }
      const r: EmailAvailabilityResult = {
        status: 'available',
        message: 'Email is available for a new staff account.',
      }
      setEmailResult(r)
      return r
    } catch (err) {
      const r: EmailAvailabilityResult = {
        status: 'error',
        message: extractApiErrorMessage(err),
      }
      setEmailResult(r)
      return r
    }
  }, [])

  const checkPhone = useCallback(async (phone: string): Promise<PhoneAvailabilityResult> => {
    const trimmed = phone.trim()
    if (!trimmed || trimmed === '+256') {
      const r: PhoneAvailabilityResult = {
        status: 'available',
        message: 'No phone check needed — staff accounts sign in with email only.',
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
      const user = await fetchUserByPhone(trimmed)
      if (!user) {
        const r: PhoneAvailabilityResult = {
          status: 'available',
          message: 'This number is not registered as a customer wallet.',
        }
        setPhoneResult(r)
        return r
      }

      const isSubscriber =
        user.userType === 'SUBSCRIBER' ||
        user.subscriberType != null ||
        (user.wallets && user.wallets.length > 0)

      if (isSubscriber) {
        const r: PhoneAvailabilityResult = {
          status: 'taken',
          user,
          isSubscriberConflict: true,
          message:
            'This phone belongs to a customer (subscriber) account. Staff users cannot use a customer phone number.',
        }
        setPhoneResult(r)
        return r
      }

      const r: PhoneAvailabilityResult = {
        status: 'taken',
        user,
        message: `This phone is already linked to an existing ${user.userType || 'user'} account.`,
      }
      setPhoneResult(r)
      return r
    } catch (err) {
      const r: PhoneAvailabilityResult = {
        status: 'error',
        message: extractApiErrorMessage(err),
      }
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
