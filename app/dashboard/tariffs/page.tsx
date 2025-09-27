"use client"
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function TariffsRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve query parameters
    const queryString = searchParams.toString()
    const redirectUrl = queryString 
      ? `/dashboard/finance/tariffs?${queryString}`
      : '/dashboard/finance/tariffs'
    
    // Permanent redirect (308)
    router.replace(redirectUrl)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting...</h1>
        <p className="text-gray-600">Tariff Management has moved to Finance → Tariffs</p>
      </div>
    </div>
  )
}