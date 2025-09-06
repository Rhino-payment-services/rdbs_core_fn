"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function TestRedirectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      console.log('✅ User is authenticated, redirecting to dashboard')
      router.push('/dashboard')
    } else if (status === 'unauthenticated') {
      console.log('❌ User is not authenticated, redirecting to login')
      router.push('/auth/login')
    }
  }, [status, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Testing Redirect</h1>
        <p className="text-gray-600 mb-4">Status: {status}</p>
        {session && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">User: {session.user?.email}</p>
          </div>
        )}
      </div>
    </div>
  )
}
