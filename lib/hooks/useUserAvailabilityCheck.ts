import { useCallback, useState } from 'react'
import api from '@/lib/axios'
import { isMeaningfulUgandaPhone } from '@/lib/utils/uganda-phone'

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
        const r: EmailAvailabilityResult = { status: 'error', message: 'No email check result from server' }
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
        message: 'No phone on file — staff will sign in with email only.',
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
        const r: PhoneAvailabilityResult = { status: 'error', message: 'No phone check result from server' }
        setPhoneResult(r)
        return r
      }

      const accounts = block.accounts || []
      if (accounts.length === 0) {
        const r: PhoneAvailabilityResult = {
          status: 'available',
          message: block.message,
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
      if (block.canGrantStaffOnExisting && only.userType === 'SUBSCRIBER') {
        const r: PhoneAvailabilityResult = {
          status: 'available',
          message:
            block.message ||
            'Customer account found — you can grant staff portal access on this profile (phone and wallet stay as-is).',
          accounts,
          canGrantStaffOnExisting: true,
          existingUserId: only.id,
        }
        setPhoneResult(r)
        return r
      }

      const r: PhoneAvailabilityResult = {
        status: 'taken',
        message: block.message || 'This phone is already linked to another account.',
        accounts,
      }
      setPhoneResult(r)
      return r
    } catch (err) {
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
