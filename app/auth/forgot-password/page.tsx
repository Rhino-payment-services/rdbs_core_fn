"use client"

import React, { useState, Suspense } from 'react'
import { ArrowLeft, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import * as Yup from 'yup'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import toast from 'react-hot-toast'
import { useForgotPassword } from '@/lib/hooks/useApi'

function ForgotPasswordForm() {
  const [isEmailSent, setIsEmailSent] = useState(false)
  const forgotPasswordMutation = useForgotPassword()

  // Validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('Email is required'),
  })

  const handleSubmit = async (
    values: { email: string }, 
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    try {
      console.log('📧 Sending forgot password request for:', values.email)
      
      const result = await forgotPasswordMutation.mutateAsync({
        email: values.email,
      })

      console.log('📊 Forgot password result:', result)

      if (result) {
        console.log('✅ Password reset email sent successfully')
        
        // Show success toast
        toast.success('Password reset email sent! Check your inbox.', {
          icon: <CheckCircle className="w-5 h-5" />,
        })
        
        // Set success state
        setIsEmailSent(true)
      }
    } catch (error: any) {
      console.error('❌ Forgot password error:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send password reset email. Please try again.'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Sent!</h3>
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.
          </p>
          <div className="space-y-3">
            <Link 
              href="/auth/login"
              className="w-full bg-[#08163d] hover:bg-[#0a1f4f] text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:ring-offset-2 flex items-center justify-center"
            >
              Back to Login
            </Link>
            <button
              onClick={() => setIsEmailSent(false)}
              className="w-full text-[#08163d] hover:text-[#0a1f4f] py-2 px-4 rounded-xl font-medium transition-colors"
            >
              Send Another Email
            </button>
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
              <Link href="/auth/login" className="inline-flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-[#08163d] rounded-xl flex items-center justify-center">
                  <Image src="/images/logoRukapay2.png" alt="logo" width={32} height={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">RDBS</h1>
                  <p className="text-sm text-gray-600">RukaPay Database Management System</p>
                </div>
              </Link>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
              <p className="text-gray-600">Enter your email address and we'll send you a link to reset your password</p>
            </div>

            {/* Forgot Password Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative">
              {/* Loading Overlay */}
              {forgotPasswordMutation.isPending && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#08163d] animate-spin mx-auto mb-2" />
                    <p className="text-[#08163d] font-medium">Sending Email...</p>
                  </div>
                </div>
              )}

              <Formik
                initialValues={{ email: '' }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, errors, touched }) => (
                  <Form className="space-y-6">
                    {/* Email Field */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <Field
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-all duration-200 ${
                            errors.email && touched.email 
                              ? 'border-red-300 focus:ring-red-500' 
                              : 'border-gray-300 focus:ring-[#08163d]'
                          }`}
                          placeholder="Enter your email address"
                        />
                      </div>
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || forgotPasswordMutation.isPending}
                      className="w-full bg-[#08163d] hover:bg-[#0a1f4f] disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:ring-offset-2 disabled:transform-none flex items-center justify-center"
                    >
                      {forgotPasswordMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sending Email...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </Form>
                )}
              </Formik>
            </div>

            {/* Back to Login */}
            <div className="text-center mt-6">
              <Link 
                href="/auth/login" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to login
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
            <h2 className="text-4xl font-bold mb-4">Reset Your Password</h2>
            <p className="text-xl text-blue-100 mb-6">
              Don't worry, it happens to the best of us. We'll help you get back into your account.
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Secure password reset process</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Email verification required</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Quick and easy recovery</span>
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
        <p className="text-gray-600">Loading forgot password form...</p>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ForgotPasswordForm />
    </Suspense>
  )
} 