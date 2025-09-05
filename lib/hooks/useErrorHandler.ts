import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { extractErrorMessage, getFriendlyErrorMessage } from '@/lib/utils'

/**
 * Custom hook for consistent error handling across the application
 * Provides methods to handle errors with toast notifications
 */
export const useErrorHandler = () => {
  /**
   * Handle error and show toast notification
   * @param error - The error object
   * @param fallbackMessage - Optional fallback message if error extraction fails
   */
  const handleError = useCallback((error: unknown, fallbackMessage?: string) => {
    console.error('Error occurred:', error)
    const errorMessage = extractErrorMessage(error) || fallbackMessage || 'An unexpected error occurred'
    toast.error(errorMessage)
  }, [])

  /**
   * Handle error with user-friendly message
   * @param error - The error object
   * @param fallbackMessage - Optional fallback message
   */
  const handleErrorWithFallback = useCallback((error: unknown, fallbackMessage?: string) => {
    console.error('Error occurred:', error)
    const errorMessage = getFriendlyErrorMessage(error) || fallbackMessage || 'An unexpected error occurred'
    toast.error(errorMessage)
  }, [])

  /**
   * Handle specific error types with custom messages
   * @param error - The error object
   * @param errorMap - Map of error messages for different scenarios
   */
  const handleSpecificError = useCallback((
    error: unknown, 
    errorMap: Record<string, string> = {}
  ) => {
    console.error('Error occurred:', error)
    
    // Try to extract specific error message first
    const extractedMessage = extractErrorMessage(error)
    
    // Check if we have a specific message for this error
    const specificMessage = errorMap[extractedMessage]
    
    if (specificMessage) {
      toast.error(specificMessage)
    } else {
      // Fallback to extracted message or friendly message
      const errorMessage = extractedMessage || getFriendlyErrorMessage(error)
      toast.error(errorMessage)
    }
  }, [])

  /**
   * Handle API errors with retry suggestion
   * @param error - The error object
   * @param retryAction - Optional retry action function
   */
  const handleApiError = useCallback((error: unknown, retryAction?: () => void) => {
    console.error('API Error occurred:', error)
    const errorMessage = extractErrorMessage(error)
    
    // Show error with retry option if provided
    if (retryAction) {
      toast.error(
        `${errorMessage} (Retry available)`,
        { duration: 5000 }
      )
      // Note: For actual retry functionality, implement it in the component
    } else {
      toast.error(errorMessage)
    }
  }, [])

  return {
    handleError,
    handleErrorWithFallback,
    handleSpecificError,
    handleApiError,
  }
} 