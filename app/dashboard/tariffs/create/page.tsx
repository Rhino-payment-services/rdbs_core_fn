"use client"
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function RedirectComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve query parameters
    const queryString = searchParams.toString()
    const redirectUrl = queryString 
      ? `/dashboard/finance/tariffs/create?${queryString}`
      : '/dashboard/finance/tariffs/create'
    
    // Permanent redirect (308)
    router.replace(redirectUrl)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting...</h1>
        <p className="text-gray-600">Create Tariff has moved to Finance → Tariffs → Create</p>
      </div>
    </div>
  )
}

export default function CreateTariffRedirect() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
        </div>
      </div>
    }>
      <RedirectComponent />
    </Suspense>
  )
}