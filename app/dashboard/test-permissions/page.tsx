"use client"

import React from 'react'
import Navbar from '@/components/dashboard/Navbar'
import PermissionsDemo from '@/components/PermissionsDemo'

const TestPermissionsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Permissions Test Page</h1>
          <PermissionsDemo />
        </div>
      </main>
    </div>
  )
}

export default TestPermissionsPage 