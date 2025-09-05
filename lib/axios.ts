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
  resolve: (value?: any) => void
  reject: (error?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
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
    const session = await getSession()
    
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
          const session = await getSession()
          if (!session?.refreshToken) {
            throw new Error('No refresh token available')
          }

          const refreshResponse = await refreshToken(session.refreshToken)
          
          if (refreshResponse.accessToken) {
            // Update session with new tokens
            await updateSessionTokens(refreshResponse.accessToken, refreshResponse.refreshToken || session.refreshToken)
            
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
          console.error('Access forbidden')
          break
        case 404:
          console.error('Resource not found')
          break
        case 500:
          console.error('Server error')
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
      console.error('Network error - no response received')
      return Promise.reject({
        message: 'Network error - no response received',
        status: 0,
      })
    } else {
      console.error('Request setup error:', error.message)
      return Promise.reject({
        message: error.message,
        status: 0,
      })
    }
  }
)

export default api
