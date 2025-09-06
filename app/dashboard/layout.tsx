"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Only redirect if we haven't already redirected and user is definitely unauthenticated
    if (status === 'unauthenticated' && !hasRedirected) {
      console.log('🔄 Dashboard layout: User not authenticated, redirecting to login')
      setHasRedirected(true)
      router.push('/auth/login')
    }
  }, [status, router, hasRedirected])

  // Show loading spinner while checking authentication
  if (status === 'loading') {
    console.log('🔄 Dashboard layout: Loading session...')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#08163d] mx-auto mb-4" />
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    )
  }

  // Show loading spinner while redirecting unauthenticated users
  if (status === 'unauthenticated') {
    console.log('🔄 Dashboard layout: User unauthenticated, showing redirect message')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#08163d] mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Only render children if user is authenticated
  if (status === 'authenticated') {
    console.log('✅ Dashboard layout: User authenticated, rendering dashboard')
    return <>{children}</>
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#08163d] mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
