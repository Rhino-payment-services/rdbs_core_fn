
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { toUserFacingMessage } from './user-facing-error'

export { toUserFacingMessage }

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract error message from backend API response
 * Handles different error response formats:
 * - { message: "User already has this role", error: "Conflict", statusCode: 409 }
 * - { error: "Some error message" }
 * - { message: "Some error message" }
 * - Standard Error objects
 * - Axios error responses
 */
export function extractErrorMessage(error: unknown): string {
  // If it's already a string, return it
  if (typeof error === 'string') {
    return error
  }

  // If it's an Error object, return its message
  if (error instanceof Error) {
    return error.message
  }

  // If it's an object with response data (Axios error)
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string; error?: string }; statusText?: string } }
    const responseData = axiosError.response?.data

    if (responseData) {
      // Handle the specific format you mentioned
      if (responseData.message) {
        return responseData.message
      }
      if (responseData.error) {
        return responseData.error
      }
    }

    // Fallback to status text
    if (axiosError.response?.statusText) {
      return axiosError.response.statusText
    }
  }

  // If it's a plain object with error properties
  if (error && typeof error === 'object') {
    const errorObj = error as { message?: string; error?: string; msg?: string; description?: string }
    
    // Check for common error message properties
    if (errorObj.message) {
      return errorObj.message
    }
    if (errorObj.error) {
      return errorObj.error
    }
    if (errorObj.msg) {
      return errorObj.msg
    }
    if (errorObj.description) {
      return errorObj.description
    }
  }

  // Default fallback
  return 'An unexpected error occurred'
}

/**
 * Get error status code from error object
 */
export function extractErrorStatusCode(error: unknown): number | null {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number } }
    return axiosError.response?.status || null
  }

  if (error && typeof error === 'object') {
    const errorObj = error as { statusCode?: number; status?: number; isNetworkError?: boolean; isTimeout?: boolean; code?: string }
    return errorObj.statusCode || errorObj.status || null
  }

  return null
}

/**
 * Check if error is a specific HTTP status code
 */
export function isErrorStatus(error: unknown, statusCode: number): boolean {
  return extractErrorStatusCode(error) === statusCode
}

/**
 * Get user-friendly error message based on status code
 */
export function getFriendlyErrorMessage(error: unknown): string {
  const statusCode = extractErrorStatusCode(error)
  const message = extractErrorMessage(error)

  // Check for network errors (status 0 or network error flags)
  if (error && typeof error === 'object') {
    const errorObj = error as { isNetworkError?: boolean; isTimeout?: boolean; code?: string }
    
    if (errorObj.isNetworkError || statusCode === 0) {
      if (errorObj.isTimeout) {
        return 'Request timed out. Please try again.'
      }
      if (message && message !== 'Network error - no response received' && message !== 'An unexpected error occurred') {
        return toUserFacingMessage(message, statusCode)
      }
      return 'Connection problem. Check your network and try again.'
    }
  }

  if (message && message !== 'An unexpected error occurred' && message !== 'Network error - no response received') {
    return toUserFacingMessage(message, statusCode)
  }

  return toUserFacingMessage(null, statusCode)
}

/**
 * Normalize phone for API/DB lookup — canonical Uganda storage: 256XXXXXXXXX (no +).
 * 0742600203, +256742600203, and 256742600203 all normalize to the same value.
 */
export function normalizePhoneForSearch(phone: string): string {
  const trimmed = phone.trim()
  if (!trimmed) return trimmed

  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return trimmed

  if (digits.startsWith('256') && digits.length >= 12) {
    return digits.slice(0, 12)
  }

  if (digits.startsWith('0') && digits.length >= 10) {
    return `256${digits.slice(1, 10)}`
  }

  if (digits.length === 9 && !digits.startsWith('0')) {
    return `256${digits}`
  }

  return digits
}

// Utility function to update session tokens
export const updateSessionTokens = async (accessToken: string, refreshToken: string) => {
  try {
    // This is a client-side function that can be called after token refresh
    // Note: NextAuth doesn't provide a direct way to update session tokens from client-side
    // You might need to implement this differently based on your needs
    
    // Option 1: Store tokens in localStorage/sessionStorage for immediate use
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
    }
    
    // Option 2: Trigger a session update (you might need to implement this)
    // await updateSession({ accessToken, refreshToken })
    
    return true
  } catch (error) {
    console.error('Failed to update session tokens:', error)
    return false
  }
}

