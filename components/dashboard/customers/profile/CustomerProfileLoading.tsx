"use client"
import React from 'react'
import Navbar from '@/components/dashboard/Navbar'

interface CustomerProfileLoadingProps {
  message?: string
}

export const CustomerProfileLoading: React.FC<CustomerProfileLoadingProps> = ({
  message = "Loading customer profile..."
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{message}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
