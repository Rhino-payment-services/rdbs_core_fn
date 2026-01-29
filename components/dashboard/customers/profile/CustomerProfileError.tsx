"use client"
import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Navbar from '@/components/dashboard/Navbar'

interface CustomerProfileErrorProps {
  title: string
  message: string
  onBack: () => void
}

export const CustomerProfileError: React.FC<CustomerProfileErrorProps> = ({
  title,
  message,
  onBack
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <button 
                onClick={onBack}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
