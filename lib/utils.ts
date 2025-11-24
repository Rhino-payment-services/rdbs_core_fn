
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
        return 'Request timeout - server took too long to respond. Please try again.'
      }
      // Use the message from axios if available, otherwise provide a generic one
      if (message && message !== 'Network error - no response received' && message !== 'An unexpected error occurred') {
        return message
      }
      return 'Cannot connect to server. Please check your internet connection and ensure the server is running.'
    }
  }

  // If we have a specific message from the backend, use it
  if (message && message !== 'An unexpected error occurred' && message !== 'Network error - no response received') {
    return message
  }

  // Otherwise, provide user-friendly messages based on status code
  switch (statusCode) {
    case 0:
      return 'Network error - unable to connect to server. Please check your connection.'
    case 400:
      return 'Invalid request. Please check your input and try again.'
    case 401:
      return 'Authentication failed. Please log in again.'
    case 403:
      return 'You do not have permission to perform this action.'
    case 404:
      return 'The requested resource was not found.'
    case 409:
      return 'This action conflicts with the current state of the resource.'
    case 422:
      return 'The request was well-formed but contains invalid data.'
    case 429:
      return 'Too many requests. Please try again later.'
    case 500:
      return 'Server error. Please try again later.'
    case 502:
      return 'Bad gateway. Please try again later.'
    case 503:
      return 'Service temporarily unavailable. Please try again later.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
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

