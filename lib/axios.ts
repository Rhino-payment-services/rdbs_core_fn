// lib/axios.ts
import axios from 'axios'
import { getSession, signOut } from 'next-auth/react'
import { updateSessionTokens } from '@/lib/utils'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag to prevent multiple refresh requests
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (error?: unknown) => void
}> = []

// Cache session to prevent endless getSession() calls
let cachedSession: any = null
let sessionCacheTime = 0
const SESSION_CACHE_DURATION = 60000 // Cache for 1 minute

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

// Function to refresh token
const refreshToken = async (refreshToken: string) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/refresh`,
      {
        refreshToken: refreshToken
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    
    return response.data
  } catch (error) {
    console.error('Token refresh failed:', error)
    throw error
  }
}

// Request interceptor to add auth token dynamically
api.interceptors.request.use(
  async (config) => {
    // Use cached session if available and fresh (prevents endless getSession calls)
    const now = Date.now()
    let session = cachedSession
    
    if (!session || (now - sessionCacheTime) > SESSION_CACHE_DURATION) {
      session = await getSession()
      cachedSession = session
      sessionCacheTime = now
    }
    
    // Try to get token from session first
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
    } else if (typeof window !== 'undefined') {
      // Fallback to localStorage if session doesn't have token
      const storedToken = localStorage.getItem('accessToken')
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`
      }
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response) {
      const { status, data } = error.response

      // Handle 401 Unauthorized with token refresh
      if (status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          }).catch(err => {
            return Promise.reject(err)
          })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
          // Clear cached session to force fresh fetch after 401
          cachedSession = null
          
          const session = await getSession()
          if (!session?.refreshToken) {
            throw new Error('No refresh token available')
          }

          const refreshResponse = await refreshToken(session.refreshToken)
          
          if (refreshResponse.accessToken) {
            // Update session with new tokens
            await updateSessionTokens(refreshResponse.accessToken, refreshResponse.refreshToken || session.refreshToken)
            
            // Clear cache to use new token
            cachedSession = null
            
            // Update the request header with new token
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.accessToken}`
            
            // Process queued requests
            processQueue(null, refreshResponse.accessToken)
            
            // Retry the original request
            return api(originalRequest)
          } else {
            throw new Error('No access token in refresh response')
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          
          // Process queued requests with error
          processQueue(refreshError, null)
          
          // Sign out user if refresh fails
          await signOut({ redirect: true, callbackUrl: '/auth/login' })
          
          return Promise.reject({
            message: 'Authentication failed - please login again',
            status: 401,
            data: { message: 'Token refresh failed' }
          })
        } finally {
          isRefreshing = false
        }
      }

      // Handle other error statuses
      switch (status) {
        case 403:
          // 403 errors are handled by individual mutation error handlers with user-friendly toasts
          break
        case 404:
          // Don't log 404 errors for endpoints that might not be implemented yet
          const url = originalRequest?.url || ''
          const silent404Endpoints = [
            '/merchants', 
            '/kyc/stats', 
            '/transactions/system/stats', 
            '/analytics', 
            '/admin/external-payment-partners/mappings', 
            '/admin/external-payment-partners/mapping', 
            '/mapping/transaction-types',
            '/admin/wallets', // Admin wallets endpoint might not exist
            '/wallet/me/all', // User's wallets endpoint - may not exist for all users
            '/wallet/admin/all' // Admin all wallets endpoint - may not be deployed yet
          ]
          const shouldLog404 = !silent404Endpoints.some(endpoint => url.includes(endpoint))
          
          if (shouldLog404) {
            console.error('Resource not found:', url)
          }
          break
        case 400:
          // Don't log 400 errors for endpoints that might have permission/validation issues
          const url400 = originalRequest?.url || ''
          const method400 = originalRequest?.method || 'GET'
          const baseURL400 = originalRequest?.baseURL || api.defaults.baseURL
          const fullUrl400 = url400.startsWith('http') ? url400 : `${baseURL400}${url400}`
          
          const silent400Endpoints = [
            '/activity-logs', // Activity logs endpoints may require admin permissions
            '/transactions?status=', // Transaction status filters may have validation issues
            '/users?status=', // User status filters may have validation issues
          ]
          const shouldLog400 = !silent400Endpoints.some(endpoint => url400.includes(endpoint))
          
          if (shouldLog400) {
            // Extract error message from response
            const errorMsg400 = data?.message || data?.error?.message || data?.error || error.message || 'Bad Request'
            
            // Extract validation errors if present
            const validationErrors = data?.errors || data?.error?.errors || data?.validationErrors
            
            const errorDetails400 = [
              `🟠 400 Bad Request: ${method400.toUpperCase()} ${fullUrl400}`,
              `   Message: ${errorMsg400}`,
              validationErrors ? `   Validation Errors: ${JSON.stringify(validationErrors)}` : null,
              data && !validationErrors ? `   Response: ${JSON.stringify(data)}` : null,
            ].filter(Boolean).join('\n')
            
            console.warn(errorDetails400)
          }
          break
        case 500:
          const url500 = originalRequest?.url || 'unknown'
          const method500 = originalRequest?.method || 'GET'
          const baseURL = originalRequest?.baseURL || api.defaults.baseURL
          const fullUrl500 = url500.startsWith('http') ? url500 : `${baseURL}${url500}`
          
          // Extract error message
          const errorMsg = data?.message || data?.error?.message || data?.error || error.message || 'Internal server error'
          
          // Use console.warn to avoid stack trace and reduce console noise
          // Format as a single message to prevent multiple log entries
          const errorDetails = [
            `🔴 500 Server Error: ${method500.toUpperCase()} ${fullUrl500}`,
            `   Message: ${errorMsg}`,
            data ? `   Response: ${JSON.stringify(data)}` : null,
            `   Status: ${error.response?.statusText || 'Internal Server Error'}`
          ].filter(Boolean).join('\n')
          
          console.warn(errorDetails)
          
          // Only log full error object in development if response data is empty
          if (process.env.NODE_ENV === 'development' && (!data || Object.keys(data).length === 0)) {
            console.warn('Full error object:', error)
          }
          break
        default:
          console.error(`API Error: ${status}`)
      }

      return Promise.reject({
        message: data?.message || `HTTP Error ${status}`,
        status,
        data,
      })
    } else if (error.request) {
      // Network error - request was made but no response received
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout')
      const isNetworkError = error.code === 'ERR_NETWORK' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED'
      
      let errorMessage = 'Network error - unable to connect to server'
      
      if (isTimeout) {
        errorMessage = 'Request timeout - server took too long to respond'
      } else if (isNetworkError) {
        const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        errorMessage = `Cannot connect to server at ${baseURL}. Please check if the server is running.`
      }
      
      // Only log in development to avoid console spam
      // Skip logging for endpoints that may have permission issues or are used for optional data
      const networkErrorUrl = originalRequest?.url || ''
      const silentNetworkErrorEndpoints = [
        '/activity-logs', // Activity logs endpoints may require admin permissions
        '/transactions', // Transaction endpoints used in security dashboard
        '/users', // User endpoints used in security dashboard
        '/analytics', // Analytics endpoints
        '/roles', // Roles endpoints used for permission checks
      ]
      const shouldLogNetworkError = !silentNetworkErrorEndpoints.some(endpoint => networkErrorUrl.includes(endpoint))
      
      if (process.env.NODE_ENV === 'development' && shouldLogNetworkError) {
        const errorDetails: Record<string, any> = {}
        
        if (error.message) {
          errorDetails.message = error.message
        }
        if (error.code) {
          errorDetails.code = error.code
        }
        if (originalRequest) {
          errorDetails.config = {
            url: originalRequest.url,
            baseURL: originalRequest.baseURL || api.defaults.baseURL,
            method: originalRequest.method || 'GET',
          }
        }
        
        // Only log if we have some details
        if (Object.keys(errorDetails).length > 0) {
          console.error('Network error details:', errorDetails)
        } else {
          console.error('Network error - no response received (no additional details available)')
        }
      }
      
      return Promise.reject({
        message: errorMessage,
        status: 0,
        code: error.code,
        isNetworkError: true,
        isTimeout,
      })
    } else {
      // Request setup error (before request was sent)
      const errorMessage = error.message || 'Request setup error'
      
      if (process.env.NODE_ENV === 'development') {
        console.error('Request setup error:', error.message)
      }
      
      return Promise.reject({
        message: errorMessage,
        status: 0,
        isRequestError: true,
      })
    }
  }
)

export default api
