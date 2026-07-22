"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Loader2, Fingerprint, Smartphone, CheckCircle, ShieldCheck } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as Yup from 'yup'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import toast from 'react-hot-toast'
import axios from 'axios'

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState('')
  const [loginMethod, setLoginMethod] = useState<'credentials' | 'fingerprint'>('credentials')
  const [otpChallenge, setOtpChallenge] = useState<{
    challengeToken: string
    email: string
    expiresInSeconds: number
  } | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const channel = process.env.NEXT_PUBLIC_CHANNEL || 'BACKOFFICE'

  useEffect(() => {
    let mounted = true
    const checkExistingSession = async () => {
      const existingSession = await getSession()
      if (existingSession && mounted) {
        setIsRedirecting(true)
        router.replace(callbackUrl)
      }
    }
    checkExistingSession()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  })

  const otpValidationSchema = Yup.object({
    otp: Yup.string()
      .matches(/^\d{6}$/, 'Enter the 6-digit code from your email')
      .required('OTP is required'),
  })

  const completeSessionLogin = async (signInPayload: Record<string, string>) => {
    const result = await signIn('credentials', {
      ...signInPayload,
      redirect: false,
      callbackUrl,
    })

    if (result?.error) {
      throw new Error('Invalid or expired OTP')
    }
    if (!result?.ok) {
      throw new Error('Authentication response unclear. Please try again.')
    }

    toast.success('Login successful! Redirecting to dashboard...', {
      icon: <CheckCircle className="w-5 h-5" />,
    })
    setIsRedirecting(true)

    setTimeout(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const sessionCheck = await getSession()
      if (sessionCheck) {
        window.location.href = callbackUrl
      } else {
        setTimeout(() => {
          window.location.href = callbackUrl
        }, 1000)
      }
    }, 1000)
  }

  const handleSubmit = async (
    values: { email: string; password: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post(
        `${apiBase}/auth/login`,
        {
          email: values.email,
          password: values.password,
          channel,
        },
        { headers: { 'Content-Type': 'application/json' } },
      )

      const data = response.data

      if (data?.requiresOtp && data?.challengeToken) {
        setOtpChallenge({
          challengeToken: data.challengeToken,
          email: data.email || values.email,
          expiresInSeconds: data.expiresInSeconds || 300,
        })
        setResendCooldown(30)
        toast.success(data.message || 'OTP sent to your email')
        return
      }

      if (data?.user && data?.accessToken) {
        // Non-OTP path (unexpected for BACKOFFICE, but keep as fallback)
        await completeSessionLogin({
          email: values.email,
          password: values.password,
        })
        return
      }

      setError('Unexpected login response. Please try again.')
      toast.error('Unexpected login response. Please try again.')
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : null) ||
        'Invalid email or password'
      setError(typeof message === 'string' ? message : 'Invalid email or password')
      toast.error('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
      setSubmitting(false)
    }
  }

  const handleOtpSubmit = async (
    values: { otp: string },
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    if (!otpChallenge) return
    setIsLoading(true)
    setError('')

    try {
      await completeSessionLogin({
        challengeToken: otpChallenge.challengeToken,
        otp: values.otp,
      })
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP')
      toast.error(err?.message || 'Invalid or expired OTP')
    } finally {
      setIsLoading(false)
      setSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    if (!otpChallenge || resendCooldown > 0) return
    setIsLoading(true)
    setError('')
    try {
      const response = await axios.post(
        `${apiBase}/auth/login/resend-otp`,
        { challengeToken: otpChallenge.challengeToken },
        { headers: { 'Content-Type': 'application/json' } },
      )
      toast.success(response.data?.message || 'OTP resent to your email')
      setResendCooldown(30)
      if (response.data?.email) {
        setOtpChallenge((prev) =>
          prev
            ? {
                ...prev,
                email: response.data.email,
                expiresInSeconds: response.data.expiresInSeconds || prev.expiresInSeconds,
              }
            : prev,
        )
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to resend OTP. Please try again.'
      setError(typeof message === 'string' ? message : 'Failed to resend OTP')
      toast.error('Failed to resend OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFingerprintLogin = async () => {
    setIsLoading(true)
    setError('')

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setError('Fingerprint authentication is not yet available. Please use email & password.')
      toast.error('Fingerprint authentication is not yet available.')
    } catch {
      setError('Fingerprint authentication failed. Please try again.')
      toast.error('Fingerprint authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {isRedirecting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Login Successful!</h3>
            <p className="text-gray-600 mb-4">Redirecting to dashboard...</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className=" mb-8">
              <Link href="/" className="inline-flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-[#08163d] rounded-xl flex items-center justify-center">
                  <Image src="/images/logoRukapay2.png" alt="logo" width={32} height={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">RDBS</h1>
                  <p className="text-sm text-gray-600">RukaPay Database Management System</p>
                </div>
              </Link>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {otpChallenge ? 'Verify Email OTP' : 'Welcome Back'}
              </h2>
              <p className="text-gray-600">
                {otpChallenge
                  ? `Enter the 6-digit code sent to ${otpChallenge.email}`
                  : 'Sign in to access your dashboard'}
              </p>

              {!otpChallenge && (
                <div className="flex bg-gray-100 rounded-xl p-1 mt-6">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('credentials')}
                    className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      loginMethod === 'credentials'
                        ? 'bg-white text-[#08163d] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email & Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('fingerprint')}
                    className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      loginMethod === 'fingerprint'
                        ? 'bg-white text-[#08163d] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Fingerprint
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#08163d] animate-spin mx-auto mb-2" />
                    <p className="text-[#08163d] font-medium">
                      {otpChallenge ? 'Verifying OTP...' : 'Authenticating...'}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {otpChallenge ? (
                <Formik
                  initialValues={{ otp: '' }}
                  validationSchema={otpValidationSchema}
                  onSubmit={handleOtpSubmit}
                >
                  {({ isSubmitting, errors, touched }) => (
                    <Form className="space-y-6">
                      <div className="text-center mb-2">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ShieldCheck className="h-8 w-8 text-[#08163d]" />
                        </div>
                        <p className="text-sm text-gray-600">
                          For staff security, confirm the one-time code from your email.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                          Email OTP
                        </label>
                        <Field
                          id="otp"
                          name="otp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          className={`block w-full tracking-[0.4em] text-center text-lg py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-all duration-200 ${
                            errors.otp && touched.otp
                              ? 'border-red-300 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-[#08163d]'
                          }`}
                          placeholder="••••••"
                        />
                        <ErrorMessage
                          name="otp"
                          component="div"
                          className="mt-1 text-sm text-red-600"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || isLoading || isRedirecting}
                        className="w-full bg-[#08163d] hover:bg-[#0a1f4f] disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:ring-offset-2 flex items-center justify-center"
                      >
                        {isRedirecting ? (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                            Redirecting...
                          </>
                        ) : isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Sign In'
                        )}
                      </button>

                      <div className="flex items-center justify-between text-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpChallenge(null)
                            setError('')
                          }}
                          className="inline-flex items-center text-gray-600 hover:text-gray-900"
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resendCooldown > 0 || isLoading}
                          className="font-medium text-[#08163d] hover:text-[#0a1f4f] disabled:text-gray-400"
                        >
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              ) : loginMethod === 'credentials' ? (
                <Formik
                  initialValues={{ email: '', password: '' }}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isSubmitting, errors, touched }) => (
                    <Form className="space-y-6">
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
                            placeholder="Enter your email"
                          />
                        </div>
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="mt-1 text-sm text-red-600"
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <Field
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            className={`block w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:border-transparent transition-all duration-200 ${
                              errors.password && touched.password
                                ? 'border-red-300 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-[#08163d]'
                            }`}
                            placeholder="Enter your password"
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
                          name="password"
                          component="div"
                          className="mt-1 text-sm text-red-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            className="h-4 w-4 text-[#08163d] focus:ring-[#08163d] border-gray-300 rounded"
                          />
                          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                            Remember me
                          </label>
                        </div>
                        <div className="text-sm">
                          <Link
                            href="/auth/forgot-password"
                            className="cursor-pointer font-medium text-[#08163d] hover:text-[#0a1f4f] transition-colors"
                          >
                            Forgot password?
                          </Link>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || isLoading || isRedirecting}
                        className="w-full bg-[#08163d] hover:bg-[#0a1f4f] disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:ring-offset-2 disabled:transform-none flex items-center justify-center"
                      >
                        {isRedirecting ? (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                            Redirecting to Dashboard...
                          </>
                        ) : isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </button>
                    </Form>
                  )}
                </Formik>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Fingerprint className="h-10 w-10 text-[#08163d]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Fingerprint Login</h3>
                    <p className="text-gray-600 text-sm">
                      Use your fingerprint to securely access your account
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Mobile Device Required</p>
                          <p className="text-xs text-gray-500">
                            Ensure your device supports fingerprint authentication
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleFingerprintLogin}
                      disabled={isLoading}
                      className="w-full bg-[#08163d] hover:bg-[#0a1f4f] disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#08163d] focus:ring-offset-2 disabled:transform-none flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <Fingerprint className="w-5 h-5 mr-2" />
                          Authenticate with Fingerprint
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex flex-1 bg-[#08163d] items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 text-white max-w-lg">
            <h2 className="text-4xl font-bold mb-6">Secure Staff Access</h2>
            <p className="text-lg text-blue-100 mb-8">
              Staff logins now require email OTP verification after your password for stronger
              account protection.
            </p>
            <ul className="space-y-4 text-blue-100">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-3 mt-0.5 text-green-400 flex-shrink-0" />
                <span>Password verification first</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-3 mt-0.5 text-green-400 flex-shrink-0" />
                <span>One-time code delivered to your staff email</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-3 mt-0.5 text-green-400 flex-shrink-0" />
                <span>Codes expire in 5 minutes</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#08163d]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
