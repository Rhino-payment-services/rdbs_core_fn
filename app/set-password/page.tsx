"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { ArrowLeft, Eye, EyeOff, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import * as Yup from 'yup'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import toast from 'react-hot-toast'
import { useSetPassword } from '@/lib/hooks/useApi'

function SetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const setPasswordMutation = useSetPassword()

  // Get token from URL query parameters
  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError('Invalid or missing token')
      toast.error('Invalid or missing token')
    }
  }, [searchParams])

  // Validation schema - matches backend requirements
  const validationSchema = Yup.object({
    newPassword: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      )
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], 'Passwords must match')
      .required('Please confirm your password'),
  })

  const handleSubmit = async (
    values: { newPassword: string; confirmPassword: string }, 
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    if (!token) {
      setError('Token is required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('🔐 Setting password with token:', token.substring(0, 20) + '...')
      
      const result = await setPasswordMutation.mutateAsync({
        token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })

      console.log('📊 Set password result:', result)

      if (result) {
        console.log('✅ Password set successfully')
        
        // Show success toast
        toast.success('Password set successfully! Redirecting to login...', {
          icon: <CheckCircle className="w-5 h-5" />,
        })
        
        // Set success state
        setIsSuccess(true)
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (error: any) {
      console.error('❌ Set password error:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to set password. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
      setSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Set Successfully!</h3>
          <p className="text-gray-600 mb-4">Your password has been updated. Redirecting to login...</p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex min-h-screen">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-[#08163d] rounded-xl flex items-center justify-center">
                  <Image src="/images/logoRukapay2.png" alt="logo" width={32} height={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">RDBS</h1>
                  <p className="text-sm text-gray-600">RukaPay Database Management System</p>
                </div>
              </Link>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Set Your Password</h2>
              <p className="text-gray-600">Create a secure password for your account</p>
            </div>

            {/* Set Password Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative">
              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#08163d] animate-spin mx-auto mb-2" />
                    <p className="text-[#08163d] font-medium">Setting Password...</p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <Formik
                initialValues={{ newPassword: '', confirmPassword: '' }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, errors, touched }) => (
                  <Form className="space-y-6">
                    {/* New Password Field */}
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <Field
                          id="newPassword"
                          name="newPassword"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className={`block w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-all duration-200 ${
                            errors.newPassword && touched.newPassword 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-[#08163d]'
                          }`}
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage
                        name="newPassword"
                        component="div"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <Field
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          className={`block w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-all duration-200 ${
                            errors.confirmPassword && touched.confirmPassword 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-[#08163d]'
                          }`}
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage
                        name="confirmPassword"
                        component="div"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>

                    {/* Password Requirements - Full Requirements */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>• At least 8 characters long</li>
                        <li>• One uppercase letter (A-Z)</li>
                        <li>• One lowercase letter (a-z)</li>
                        <li>• One number (0-9)</li>
                        <li>• One special character (@$!%*?&)</li>
                      </ul>
                    </div>

                    {/* Set Password Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading || !token}
                      className="w-full bg-[#08163d] hover:bg-[#0a1f4f] disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:ring-offset-2 disabled:transform-none flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Setting Password...
                        </>
                      ) : (
                        'Set Password'
                      )}
                    </button>
                  </Form>
                )}
              </Formik>
            </div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <Link 
                href="/" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to homepage
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#08163d] to-[#0a1f4f] items-center justify-center p-8">
          <div className="text-center text-white max-w-md">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Image src="/images/logoRukapay2.png" alt="logo" width={64} height={64} />
            </div>
            <h2 className="text-4xl font-bold mb-4">Secure Your Account</h2>
            <p className="text-xl text-blue-100 mb-6">
              Set a strong password to protect your account and data
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Strong password protection</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Secure account access</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Data privacy & security</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#08163d] mx-auto mb-4" />
        <p className="text-gray-600">Loading password form...</p>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SetPasswordForm />
    </Suspense>
  )
} 