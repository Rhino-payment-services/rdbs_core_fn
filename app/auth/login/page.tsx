"use client"

import React, { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Loader2, Fingerprint, Smartphone, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import * as Yup from 'yup'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState('')
  const [loginMethod, setLoginMethod] = useState<'credentials' | 'fingerprint'>('credentials')
  const router = useRouter()

  // Validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Please enter a valid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  })

  const handleSubmit = async (
    values: { email: string; password: string }, 
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) => {
    setIsLoading(true)
    setError('')

    try {
      console.log('🔐 Attempting signIn with:', { email: values.email, password: '***' })
      
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      console.log('📊 signIn result:', result)

      if (result?.error) {
        console.log('❌ signIn error:', result.error)
        setError('Invalid email or password')
        toast.error('Login failed. Please check your credentials.')
      } else if (result?.ok) {
        console.log('✅ signIn successful, redirecting to dashboard')
        
        // Show success toast
        toast.success('Login successful! Redirecting to dashboard...', {
          icon: <CheckCircle className="w-5 h-5" />,
        })
        
        // Set redirecting state
        setIsRedirecting(true)
        
        // Small delay to show the success message before redirect
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        console.log('⚠️ signIn result unclear:', result)
        setError('Authentication response unclear. Please try again.')
        toast.error('Authentication response unclear. Please try again.')
      }
    } catch (error) {
      console.error('❌ signIn exception:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
      setSubmitting(false)
    }
  }

  const handleFingerprintLogin = async () => {
    setIsLoading(true)
    setError('')

    try {
      // TODO: Implement actual fingerprint authentication
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Show success toast
      toast.success('Fingerprint authentication successful! Redirecting to dashboard...', {
        icon: <CheckCircle className="w-5 h-5" />,
      })
      
      // Set redirecting state
      setIsRedirecting(true)
      
      // Small delay to show the success message before redirect
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      setError('Fingerprint authentication failed. Please try again.')
      toast.error('Fingerprint authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Redirecting Overlay */}
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
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Header */}
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to access your dashboard</p>
              
              {/* Login Method Selector */}
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
            </div>

            {/* Login Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative">
              {/* Loading Overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#08163d] animate-spin mx-auto mb-2" />
                    <p className="text-[#08163d] font-medium">Authenticating...</p>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {loginMethod === 'credentials' ? (
                <Formik
                initialValues={{ email: '', password: '' }}
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
                          placeholder="Enter your email"
                        />
                      </div>
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="mt-1 text-sm text-red-600"
                      />
                    </div>

                    {/* Password Field */}
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
                          type={showPassword ? "text" : "password"}
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

                    {/* Remember Me & Forgot Password */}
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
                        <a href="#" className="font-medium text-[#08163d] hover:text-[#0a1f4f] transition-colors">
                          Forgot password?
                        </a>
                      </div>
                    </div>

                    {/* Login Button */}
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
                /* Fingerprint Login */
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
                          <p className="text-xs text-gray-500">Ensure your device supports fingerprint authentication</p>
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
                          Login with Fingerprint
                        </>
                      )}
                    </button>

                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        Place your finger on the sensor when prompted
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}

              {/* Sign Up Link */}
            
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
            <h2 className="text-4xl font-bold mb-4">RDBS Portal</h2>
            <p className="text-xl text-blue-100 mb-6">
              Comprehensive database management system for monitoring fintech operations
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Real-time transaction monitoring</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Staff activity tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Advanced analytics & reporting</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 