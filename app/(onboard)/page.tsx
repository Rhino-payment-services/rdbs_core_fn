"use client"
import React from 'react'
import { ArrowRight, Shield, TrendingUp, Users, Activity, BarChart3, CreditCard, Zap } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

const OnboardScreen = () => {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-none xl:max-w-[1600px] 2xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#08163d] rounded-xl flex items-center justify-center">
                <Image src="/images/logoRukapay2.png" alt="logo" width={32} height={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RDBS</h1>
                <p className="text-sm text-gray-600">RukaPay Database Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/dashboard')} className="bg-[#08163d] hover:bg-[#0a1f4f] text-white px-10 cursor-pointer py-4 rounded-lg transition-colors">Dashboard</button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-none xl:max-w-[1600px] 2xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Monitor
              <span className="text-[#08163d]"> RDBS Portal</span>
              <br />
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              RDBS - RukaPay Database Management System provides comprehensive transaction monitoring and staff activity tracking for your entire fintech ecosystem. 
              Real-time insights across all platforms and applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="cursor-pointer bg-[#08163d] hover:bg-[#0a1f4f] text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2">
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="cursor-pointer border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-none xl:max-w-[1600px] 2xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Monitor</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From transaction flows to staff activities, get complete visibility into your fintech operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
              <div className="w-12 h-12 bg-[#08163d] rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Transaction Monitoring</h3>
              <p className="text-gray-600 mb-4">
                Real-time tracking of all transactions across your platforms, apps, and payment gateways.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Staff Activity Tracking</h3>
              <p className="text-gray-600 mb-4">
                Monitor internal team activities, access logs, and performance metrics.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-8 rounded-2xl border border-purple-100">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Analytics</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive dashboards with customizable reports and predictive insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-none xl:max-w-[1600px] 2xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Transform Your Fintech Operations?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of fintech companies already using RDBS to monitor and optimize their operations
          </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-[#08163d] cursor-pointer  hover:bg-[#0a1f4f] text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200 transform hover:scale-105">
                Access Dashboard
              </button>
              <button className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-200">
                Contact Support
              </button>
            </div>
        </div>
      </section>
    </div>
  )
}

export default OnboardScreen